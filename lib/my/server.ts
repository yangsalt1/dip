import 'server-only';
import { kvGet, kvSet } from '@/lib/store';
import { naverFx } from '@/lib/naver';
import { makeInfo } from './signal';
import type { MySaved, Pos, Row } from './types';

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
async function get(url: string) {
  const r = await fetch(url, { headers: { 'user-agent': UA, referer: 'https://m.stock.naver.com/' }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('naver ' + r.status);
  return r.json();
}
const num = (s: unknown) => Number(String(s ?? '').replace(/,/g, ''));

export type Found = { code: string; name: string; rc: string; market: 'kr' | 'us'; where: string };

/** 종목 검색 (한글 이름 · 영어 · 코드) */
export async function search(q: string): Promise<Found[]> {
  const j = await get(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(q)}&target=stock`);
  return ((j?.items ?? []) as Record<string, string>[])
    .filter((x) => x.category === 'stock' && (x.nationCode === 'KOR' || x.nationCode === 'USA'))
    .slice(0, 8)
    .map((x) => ({ code: x.code, name: x.name, rc: x.reutersCode || x.code, market: x.nationCode === 'KOR' ? 'kr' : 'us', where: x.typeName }));
}

/** 지금 가격 */
export async function quote(p: Pick<Pos, 'rc' | 'code' | 'market'>): Promise<{ last: number; d1: number } | null> {
  try {
    if (p.market === 'kr') {
      const j = await get(`https://polling.finance.naver.com/api/realtime/domestic/stock/${p.code}`);
      const d = j?.datas?.[0];
      const last = num(d?.closePrice);
      return last > 0 ? { last, d1: num(d?.fluctuationsRatio) } : null;
    }
    const j = await get(`https://api.stock.naver.com/stock/${p.rc}/basic`);
    const last = num(j?.closePrice);
    return last > 0 ? { last, d1: num(j?.fluctuationsRatio) } : null;
  } catch { return null; }
}

/** 1년 일별 종가 (6시간 저장) */
const ymd = (d: Date) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
export async function history(p: Pick<Pos, 'rc' | 'code' | 'market'>): Promise<number[]> {
  const k = `hist:${p.rc}`;
  const c = await kvGet<{ at: number; c: number[] }>(k);
  if (c && Date.now() - c.at < 6 * 3600e3 && c.c.length) return c.c;
  const end = ymd(new Date()), start = ymd(new Date(Date.now() - 370 * 864e5));
  const path = p.market === 'kr' ? `domestic/item/${p.code}` : `foreign/item/${p.rc}`;
  try {
    const arr = await get(`https://api.stock.naver.com/chart/${path}/day?startDateTime=${start}0000&endDateTime=${end}2359`);
    const closes = ((arr ?? []) as { closePrice: number }[]).map((x) => Number(x.closePrice)).filter((x) => x > 0);
    if (closes.length) await kvSet(k, { at: Date.now(), c: closes }, 8 * 3600);
    return closes;
  } catch { return c?.c ?? []; }
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const x = items[i++]; await fn(x); } }));
}

// 로컬 화면 테스트 전용 가짜 시세 (배포에서는 안 켜져요)
const MOCK = process.env.LIVE_MOCK === '1' && !process.env.VERCEL;
function mockSeries(seed: string, base: number) {
  let x = 0; for (const ch of seed) x = (x * 31 + ch.charCodeAt(0)) % 9973;
  const out: number[] = []; let v = base;
  for (let i = 0; i < 250; i++) { x = (x * 7919 + 13) % 9973; v *= 1 + ((x / 9973) - 0.48) * 0.04; out.push(v); }
  return out;
}

/** 저장된 종목에 가격·신호 붙이기 */
export async function enrich(s: MySaved): Promise<{ rows: Row[]; fx: number }> {
  let fx = 1400;
  try { fx = (await naverFx('usd')).last; } catch { /* 기본값 */ }
  const rows: Row[] = s.list.map((p) => ({ ...p, info: null, valueKrw: null }));
  await pool(rows, 5, async (r) => {
    const h = MOCK ? mockSeries(r.rc, r.avg || 100) : await history(r);
    const q = MOCK ? { last: h[h.length - 1], d1: 0.8 } : await quote(r);
    if (!q) return;
    r.info = makeInfo(h, q.last, q.d1, r.avg || null, s.target);
    r.valueKrw = r.qty > 0 ? q.last * r.qty * (r.market === 'us' ? fx : 1) : null;
  });
  return { rows, fx };
}
