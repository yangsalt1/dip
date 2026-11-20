import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { bumpQuota, storeReady } from '@/lib/store';
import { search } from '@/lib/my/server';
import { guessBucket } from '@/lib/my/bucket';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GEMINI = process.env.GEMINI_API_KEY;
const CLAUDE = process.env.ANTHROPIC_API_KEY;
const MOCK = process.env.ANALYZE_MOCK === '1' && !process.env.VERCEL;
const DAILY = 15;

const PROMPT = `한국 증권사 앱(토스, 키움, 삼성, 미래에셋, NH, KB, 한투 등)의 '보유종목/잔고' 화면 캡처야.
캡처에 나온 보유 종목을 모두 찾아서 JSON 하나만 출력해. 설명이나 코드블록 없이.
{"holdings":[{"name":"종목 이름","ticker":"종목코드(6자리)나 미국 티커, 모르면 null","qty":보유수량 숫자 또는 null,"avg":평균단가(매입가) 숫자 또는 null,"currency":"KRW" 또는 "USD"}],"readable":true 또는 false}
규칙:
- 같은 종목이 여러 장에 나오면 한 번만.
- 숫자는 쉼표 없이. 평균단가는 1주당 가격(원화면 원, 달러면 달러).
- 계좌번호, 이름, 전화번호 같은 개인정보는 절대 출력하지 마.
- 보유종목 화면이 아니면 {"holdings":[],"readable":false}.`;

type Raw = { name?: string; ticker?: string | null; qty?: number | null; avg?: number | null; currency?: string };
function parseJson(t: string) { const s = t.indexOf('{'), e = t.lastIndexOf('}'); return JSON.parse(t.slice(s, e + 1)); }

async function viaGemini(imgs: { mime: string; data: string }[]) {
  const models = [process.env.GEMINI_MODEL, 'gemini-4-hydrogen', 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean) as string[];
  let last = '';
  for (const m of models) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI! },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [...imgs.map((i) => ({ inline_data: { mime_type: i.mime, data: i.data } })), { text: PROMPT }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } }),
      signal: AbortSignal.timeout(50000),
    });
    if (!r.ok) { last = `${m}:${r.status}`; if ([400, 403].includes(r.status)) break; continue; }
    const j = await r.json();
    return parseJson((j?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join(''));
  }
  throw new Error(last);
}
async function viaClaude(imgs: { mime: string; data: string }[]) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': CLAUDE!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANALYZE_MODEL || 'claude-sonnet-5-5', max_tokens: 2500, messages: [{ role: 'user', content: [...imgs.map((i) => ({ type: 'image', source: { type: 'base64', media_type: i.mime, data: i.data } })), { type: 'text', text: PROMPT }] }] }),
  });
  if (!r.ok) throw new Error(String(r.status));
  const j = await r.json();
  return parseJson((j.content ?? []).map((c: { text?: string }) => c.text ?? '').join(''));
}

/** 캡처 → 종목 후보 (저장은 사용자가 확인한 뒤에) */
export async function POST(req: Request) {
  const s = await auth();
  const uid = (s?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  if (!GEMINI && !CLAUDE && !MOCK) return NextResponse.json({ error: '사진 읽기는 준비 중이에요. 직접 넣기로 먼저 넣어주세요' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const list: string[] = Array.isArray(body.images) ? body.images.filter((x: unknown) => typeof x === 'string') : [];
  if (!list.length) return NextResponse.json({ error: '사진을 올려주세요' }, { status: 400 });
  if (list.length > 10) return NextResponse.json({ error: '사진은 10장까지예요' }, { status: 400 });
  if (storeReady && (await bumpQuota(uid)) > DAILY) return NextResponse.json({ error: `사진 읽기는 하루 ${DAILY}번까지예요` }, { status: 429 });
  const imgs: { mime: string; data: string }[] = [];
  for (const d of list) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(d);
    if (!m || m[2].length > 2_500_000) return NextResponse.json({ error: '사진 형식이 이상해요. 다시 올려주세요' }, { status: 400 });
    imgs.push({ mime: m[1], data: m[2] });
  }
  let raw: { holdings?: Raw[]; readable?: boolean };
  try {
    raw = MOCK ? { readable: true, holdings: [{ name: '삼성전자', ticker: '005930', qty: 30, avg: 152000, currency: 'KRW' }, { name: '엔비디아', ticker: 'NVDA', qty: 12, avg: 121.5, currency: 'USD' }, { name: 'TIGER 미국S&P500', ticker: '360750', qty: 100, avg: 21800, currency: 'KRW' }] }
      : GEMINI ? await viaGemini(imgs) : await viaClaude(imgs);
  } catch {
    return NextResponse.json({ error: '사진을 읽지 못했어요. 잠시 뒤 다시 해봐요' }, { status: 502 });
  }
  const hs = (raw.holdings ?? []).filter((h) => h?.name).slice(0, 40);
  if (!hs.length) return NextResponse.json({ error: '보유종목 화면을 못 찾았어요. 잔고 화면을 캡처해 주세요' }, { status: 422 });
  const out = await Promise.all(hs.map(async (h, i) => {
    const want = h.currency === 'USD' ? 'us' : 'kr';
    let f = null as Awaited<ReturnType<typeof search>>[number] | null;
    for (const q of [h.ticker, h.name].filter(Boolean) as string[]) {
      try { const r = await search(q); f = r.find((x) => x.market === want) ?? r[0] ?? null; } catch { /* 다음 */ }
      if (f) break;
    }
    return {
      id: `s${Date.now()}${i}`, found: Boolean(f || h.ticker), name: f?.name ?? String(h.name).slice(0, 40), code: f?.code ?? String(h.ticker ?? ''),
      rc: f?.rc ?? (h.ticker ? (want === 'us' ? `${h.ticker}.O` : String(h.ticker)) : ''),
      market: f?.market ?? want, qty: Number(h.qty) || 0, avg: Number(h.avg) || 0, bucket: guessBucket(f?.name ?? String(h.name), f?.code ?? String(h.ticker ?? '')),
    };
  }));
  return NextResponse.json({ ok: true, items: out });
}
