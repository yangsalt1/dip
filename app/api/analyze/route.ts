import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { FX_RATE } from '@/lib/data';
import { BUCKET_KEYS, type Bucket, type Holding, type Saved } from '@/lib/buckets';
import { bumpQuota, delPort, getPort, setPort, storeReady } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 로컬 화면 테스트 전용 가짜 분석 (배포에서는 절대 안 켜져요)
const MOCK = process.env.ANALYZE_MOCK === '1' && !process.env.VERCEL;
const KEY = process.env.ANTHROPIC_API_KEY || (MOCK ? 'mock' : undefined);
const MODEL = process.env.ANALYZE_MODEL || 'claude-sonnet-5-5';
const DAILY = 10;

async function me() {
  const s = await auth();
  const u = s?.user as { id?: string } | undefined;
  return u?.id ?? null;
}

/** 저장된 내 포트폴리오 */
export async function GET() {
  const uid = await me().catch(() => null);
  const ready = Boolean(KEY) && storeReady;
  if (!uid) return NextResponse.json({ loggedIn: false, ready });
  const saved = storeReady ? await getPort<Saved>(uid) : null;
  return NextResponse.json({ loggedIn: true, ready, saved });
}

export async function DELETE() {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  if (storeReady) await delPort(uid);
  return NextResponse.json({ ok: true });
}

const PROMPT = `너는 한국 증권사 앱(토스, 키움, 삼성, 미래에셋, NH, KB 등)의 '보유종목/잔고' 화면 캡처를 읽는 도우미야.
캡처 여러 장에 나온 보유 종목을 모두 찾아서 아래 JSON 하나만 출력해. 설명 문장, 코드블록 표시 없이 JSON만.

{"holdings":[{"name":"종목 이름","ticker":"종목코드나 티커, 모르면 null","bucket":"칸","value":평가금액 숫자 또는 null,"currency":"KRW" 또는 "USD","weight":화면에 나온 비중% 숫자 또는 null}],"cash":{"value":예수금/현금 숫자 또는 null,"currency":"KRW" 또는 "USD"},"readable":true 또는 false}

bucket은 반드시 다음 중 하나:
- us_broad: S&P500·미국 전체시장 ETF (VOO, SPY, IVV, VTI, TIGER/KODEX 미국S&P500 등)
- us_tech: 나스닥100 ETF, 미국 빅테크 개별주 (애플, 마이크로소프트, 알파벳, 아마존, 메타, 테슬라, 넷플릭스 등)
- semi: 반도체 ETF와 반도체 개별주 (엔비디아, AMD, 브로드컴, TSMC, 마이크론, 인텔, 삼성전자, SK하이닉스, 한미반도체 등)
- power: 유틸리티·전력·원전 ETF와 개별주 (한국전력, 두산에너빌리티, XLU, URA 등)
- kr_broad: 코스피200·코스피 전체 ETF (KODEX 200, TIGER 200 등)
- dividend: 배당 ETF (SCHD, TIGER 미국배당다우존스, 고배당 ETF 등)
- bond: 채권 ETF (TLT, 국채, 회사채 ETF 등)
- gold: 금·은 ETF (GLD, KRX금현물 등)
- other: 위에 안 맞는 개별주·테마 (2차전지, 바이오, 게임, 코인 관련, 기타)
레버리지·인버스 ETF는 기초자산 칸으로 넣어.

규칙:
- 같은 종목이 여러 캡처에 나오면 한 번만.
- value는 '평가금액'(지금 가치). 없으면 null. 원화면 KRW, 달러면 USD.
- 계좌번호, 이름, 전화번호 같은 개인정보는 절대 출력하지 마.
- 보유종목 화면이 아니거나 읽을 수 없으면 {"holdings":[],"readable":false}.`;

function parseJson(t: string) {
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s < 0 || e < s) throw new Error('no json');
  return JSON.parse(t.slice(s, e + 1));
}

type Raw = { name?: string; ticker?: string | null; bucket?: string; value?: number | null; currency?: string; weight?: number | null };

export async function POST(req: Request) {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  if (!KEY) return NextResponse.json({ error: '사진 분석은 준비 중이에요' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const imgs: string[] = Array.isArray(body.images) ? body.images.filter((x: unknown) => typeof x === 'string') : [];
  if (!imgs.length) return NextResponse.json({ error: '사진을 올려주세요' }, { status: 400 });
  if (imgs.length > 10) return NextResponse.json({ error: '사진은 10장까지예요' }, { status: 400 });
  if (storeReady && (await bumpQuota(uid)) > DAILY) return NextResponse.json({ error: `분석은 하루 ${DAILY}번까지예요` }, { status: 429 });

  const content: unknown[] = [];
  for (const d of imgs) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(d);
    if (!m || m[2].length > 2_000_000) return NextResponse.json({ error: '사진 형식이 이상해요. 다시 올려주세요' }, { status: 400 });
    content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
  }
  content.push({ type: 'text', text: PROMPT });

  let raw: { holdings?: Raw[]; cash?: { value?: number | null; currency?: string }; readable?: boolean };
  if (MOCK) raw = { readable: true, holdings: [
    { name: '삼성전자', bucket: 'semi', value: 9000000, currency: 'KRW' }, { name: 'SK하이닉스', bucket: 'semi', value: 6600000, currency: 'KRW' },
    { name: '엔비디아', ticker: 'NVDA', bucket: 'semi', value: 2900, currency: 'USD' }, { name: 'TIGER 미국S&P500', bucket: 'us_broad', value: 3600000, currency: 'KRW' },
    { name: '테슬라', ticker: 'TSLA', bucket: 'us_tech', value: 1500, currency: 'USD' }, { name: '에코프로', bucket: 'other', value: 2400000, currency: 'KRW' } ],
    cash: { value: 3000000, currency: 'KRW' } };
  else try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 2500, messages: [{ role: 'user', content }] }),
    });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    raw = parseJson((j.content ?? []).map((c: { text?: string }) => c.text ?? '').join(''));
  } catch {
    return NextResponse.json({ error: '분석하지 못했어요. 잠시 뒤 다시 해봐요' }, { status: 502 });
  }

  const list = (raw.holdings ?? []).filter((h) => h.name);
  if (!raw.readable && !list.length) return NextResponse.json({ error: '보유종목 화면을 못 찾았어요. 잔고 화면을 캡처해 주세요' }, { status: 422 });
  const krw = (v: number | null | undefined, c?: string) => (typeof v === 'number' && v > 0 ? (c === 'USD' ? v * FX_RATE : v) : null);
  const vals = list.map((h) => krw(h.value, h.currency));
  const allVal = vals.every((v) => v !== null);
  const allW = list.every((h) => typeof h.weight === 'number' && h.weight! > 0);
  const okB = (b?: string): Bucket => (BUCKET_KEYS.includes(b as Bucket) && b !== 'cash' ? (b as Bucket) : 'other');
  const holdings: Holding[] = list.map((h, i) => ({
    name: String(h.name).slice(0, 40), ticker: h.ticker ? String(h.ticker).slice(0, 16) : null, bucket: okB(h.bucket),
    weight: allVal ? (vals[i] as number) : allW ? (h.weight as number) : 1,
  }));
  const cash = krw(raw.cash?.value, raw.cash?.currency);
  if (allVal && cash) holdings.push({ name: '현금(예수금)', ticker: null, bucket: 'cash', weight: cash });
  const sum = holdings.reduce((s, h) => s + h.weight, 0) || 1;
  for (const h of holdings) h.weight = Math.round((h.weight / sum) * 1000) / 10; // % (금액은 저장 안 해요)
  const saved: Saved = { holdings, at: new Date().toISOString(), rough: !allVal && !allW };
  if (storeReady) await setPort(uid, saved);
  return NextResponse.json({ ok: true, saved });
}
