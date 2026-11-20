import { NextResponse } from 'next/server';
import { getNotices } from '@/lib/house/store';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
/** 임시: 공고별로 평수·금액이 채워졌는지 요약 */
export async function GET() {
  const c = await getNotices(true);
  const by: Record<string, { n: number; units: number; money: number }> = {};
  for (const x of c.list) {
    const b = (by[x.src] ??= { n: 0, units: 0, money: 0 });
    b.n++; if (x.units.length) b.units++; if (x.units.some((u) => u.price || u.deposit)) b.money++;
  }
  return NextResponse.json({ total: c.list.length, by, soco: c.list.filter((x) => x.src === 'soco').map((x) => ({ name: x.name, units: x.units })) });
}
