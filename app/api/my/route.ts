import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { kvGet, kvSet, storeReady } from '@/lib/store';
import { enrich } from '@/lib/my/server';
import { BUCKET_KEYS, type Bucket } from '@/lib/buckets';
import type { MySaved, Pos } from '@/lib/my/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function me() { const s = await auth(); return (s?.user as { id?: string } | undefined)?.id ?? null; }
const key = (u: string) => `my:${u}`;

/** 내 주식 + 지금 가격·신호 */
export async function GET() {
  const uid = await me().catch(() => null);
  const scan = Boolean(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY) || (process.env.ANALYZE_MOCK === '1' && !process.env.VERCEL);
  if (!uid) return NextResponse.json({ loggedIn: false, scan });
  const s = (storeReady ? await kvGet<MySaved>(key(uid)) : null) ?? { list: [], target: 0.5, at: '' };
  const { rows, fx } = await enrich(s);
  return NextResponse.json({ loggedIn: true, scan, rows, fx, target: s.target, at: s.at });
}

/** 목록 통째로 저장 */
export async function POST(req: Request) {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const list: Pos[] = (Array.isArray(b.list) ? b.list : []).slice(0, 60).map((x: Record<string, unknown>, i: number) => ({
    id: String(x.id ?? `p${Date.now()}${i}`).slice(0, 40),
    name: String(x.name ?? '').slice(0, 40),
    code: String(x.code ?? '').slice(0, 16),
    rc: String(x.rc ?? x.code ?? '').slice(0, 20),
    market: x.market === 'us' ? 'us' : 'kr',
    qty: Math.max(0, Number(x.qty) || 0),
    avg: Math.max(0, Number(x.avg) || 0),
    bucket: (BUCKET_KEYS.includes(x.bucket as Bucket) ? x.bucket : 'other') as Bucket,
  })).filter((p: Pos) => p.name && p.code);
  const target = Math.min(5, Math.max(0.05, Number(b.target) || 0.5));
  const s: MySaved = { list, target, at: new Date().toISOString() };
  await kvSet(key(uid), s);
  return NextResponse.json({ ok: true });
}
