import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import cfg from '@/data/etfs.json';
import { kisReady, krPrice, usPrice } from '@/lib/kis';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** 미국 ETF 거래소 (KIS 코드). 나스닥 상장 = NAS, NYSE Arca 상장 = AMS */
const EXCD: Record<string, string> = {
  QQQ: 'NAS', SMH: 'NAS', SOXX: 'NAS', AIQ: 'NAS', IBIT: 'NAS', BOTZ: 'NAS', GRID: 'NAS', TLT: 'NAS',
  VOO: 'AMS', SPY: 'AMS', SCHD: 'AMS', XLV: 'AMS', GLD: 'AMS', XLU: 'AMS', DIA: 'AMS', ITA: 'AMS', XBI: 'AMS', URA: 'AMS',
};
const ALT: Record<string, string[]> = { NAS: ['AMS', 'NYS'], AMS: ['NYS', 'NAS'], NYS: ['AMS', 'NAS'] };

type Live = { at: string; quotes: Record<string, { last: number; d1: number }> };
const TTL = 30; // 초. 이 시간 안에는 모두가 같은 시세를 같이 써요 (KIS 호출 아끼기)

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && tok ? new Redis({ url, token: tok }) : null;
let mem: { v: Live; exp: number } | null = null;
const found: Record<string, string> = {};

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const x = items[i++]; await fn(x); await new Promise((r) => setTimeout(r, 60)); } }));
}

async function fetchAll(): Promise<Live> {
  const quotes: Live['quotes'] = {};
  await pool(cfg.etfs, 4, async (e) => {
    try {
      if (e.market === 'kr') {
        quotes[e.id] = await krPrice(e.yahoo.replace(/\.K[SQ]$/, ''));
      } else {
        const first = found[e.yahoo] ?? EXCD[e.yahoo] ?? 'AMS';
        for (const ex of [first, ...(ALT[first] ?? [])]) {
          try { quotes[e.id] = await usPrice(e.yahoo, ex); found[e.yahoo] = ex; break; } catch { /* 다음 거래소 */ }
        }
      }
    } catch { /* 이 종목은 하루 두 번 업데이트 값 그대로 */ }
  });
  return { at: new Date().toISOString(), quotes };
}

export async function GET() {
  // 로컬 화면 테스트 전용 (배포에서는 절대 안 켜져요)
  if (process.env.LIVE_MOCK === '1' && !process.env.VERCEL) {
    const m = (await import('@/data/market.json')).default as { quotes: Record<string, { last: number; d1: number }> };
    const quotes: Live['quotes'] = {};
    for (const e of cfg.etfs) { const q = m.quotes[e.yahoo]; if (q) quotes[e.id] = { last: Math.round(q.last * 1.012 * 100) / 100, d1: Math.round((q.d1 + 1.2) * 100) / 100 }; }
    return NextResponse.json({ ok: true, at: new Date().toISOString(), quotes });
  }
  if (!kisReady) return NextResponse.json({ ok: false, reason: 'no-key' });
  if (mem && mem.exp > Date.now()) return NextResponse.json({ ok: true, ...mem.v });
  try {
    if (redis) {
      const c = (await redis.get('live:all')) as Live | null;
      if (c) { mem = { v: c, exp: Date.now() + 5000 }; return NextResponse.json({ ok: true, ...c }); }
      // 한 번에 한 서버만 KIS를 부르게
      const lock = await redis.set('live:lock', '1', { nx: true, ex: 20 });
      if (!lock) { await new Promise((r) => setTimeout(r, 2500)); const c2 = (await redis.get('live:all')) as Live | null; if (c2) return NextResponse.json({ ok: true, ...c2 }); }
    }
    const v = await fetchAll();
    if (!Object.keys(v.quotes).length) return NextResponse.json({ ok: false, reason: 'empty' });
    mem = { v, exp: Date.now() + TTL * 1000 };
    if (redis) { await redis.set('live:all', v, { ex: TTL }); await redis.del('live:lock'); }
    return NextResponse.json({ ok: true, ...v });
  } catch {
    return NextResponse.json({ ok: false, reason: 'error' });
  }
}
