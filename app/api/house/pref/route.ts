import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPref, setPref } from '@/lib/house/store';
import { EMPTY_PREF, type Pref } from '@/lib/house/types';

export const dynamic = 'force-dynamic';

async function uid() { const s = await auth(); return (s?.user as { id?: string } | undefined)?.id ?? null; }

export async function GET() {
  const u = await uid();
  if (!u) return NextResponse.json({ loggedIn: false, pref: null });
  return NextResponse.json({ loggedIn: true, pref: await getPref(u) });
}

const arr = (v: unknown, ok: string[]) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && ok.includes(x)) : []);
export async function POST(req: Request) {
  const u = await uid();
  if (!u) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const p: Pref = {
    ...EMPTY_PREF,
    who: arr(b.who, ['newlywed', 'youth', 'family', 'general']) as Pref['who'],
    sido: (Array.isArray(b.sido) ? b.sido : []).filter((x: unknown) => typeof x === 'string').slice(0, 20),
    gu: (Array.isArray(b.gu) ? b.gu : []).filter((x: unknown) => typeof x === 'string').slice(0, 30),
    rooms: arr(b.rooms, ['1', '2', '3']) as Pref['rooms'],
    kind: arr(b.kind, ['sale', 'rent']) as Pref['kind'],
    money: Math.max(0, Math.min(1e6, Number(b.money) || 0)),
    push: b.push !== false,
  };
  await setPref(u, p);
  return NextResponse.json({ ok: true, pref: p });
}
