import { NextResponse } from 'next/server';
import { getNotices } from '@/lib/house/store';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
/** 임시: 평수·금액이 채워졌는지 요약 */
export async function GET() {
  const c = await getNotices(true);
  const by: Record<string, { n: number; units: number; money: number }> = {};
  for (const x of c.list) { const b = (by[x.src] ??= { n: 0, units: 0, money: 0 }); b.n++; if (x.units.length) b.units++; if (x.units.some((u) => u.price || u.deposit)) b.money++; }
  const lhRent = c.list.filter((x) => x.src === 'lh' && x.kind === 'rent' && !/매입|전세/.test(x.cat));
  return NextResponse.json({ total: c.list.length, by, lhRent: lhRent.length, lhRentMoney: lhRent.filter((x) => x.units.some((u) => u.deposit)).length, sample: lhRent.filter((x) => x.units.some((u) => u.deposit)).slice(0, 3).map((x) => ({ name: x.name, units: x.units.slice(0, 2) })) });
}
