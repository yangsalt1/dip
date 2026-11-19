import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { etfById } from '@/lib/data';
import { addJup, clearJup, listJup, removeJup, storeReady } from '@/lib/store';

export const dynamic = 'force-dynamic';

async function me() {
  const s = await auth();
  const u = s?.user as { id?: string; name?: string | null } | undefined;
  return u?.id ? { id: u.id, name: u.name ?? '' } : null;
}

/** 내 줍줍리스트 */
export async function GET() {
  const u = await me();
  if (!u) return NextResponse.json({ loggedIn: false, ready: storeReady, ids: [] });
  const ids = storeReady ? await listJup(u.id) : [];
  return NextResponse.json({ loggedIn: true, name: u.name, ready: storeReady, ids });
}

async function change(req: Request, add: boolean) {
  const u = await me();
  if (!u) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  if (!storeReady) return NextResponse.json({ error: '저장소 준비 중이에요' }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (!add && body.all === true) { await clearJup(u.id); return NextResponse.json({ ok: true, ids: [] }); }
  const id = typeof body.id === 'string' ? body.id : '';
  if (!etfById(id)) return NextResponse.json({ error: '없는 종목이에요' }, { status: 400 });
  if (add) {
    const cur = await listJup(u.id);
    if (cur.length >= 50 && !cur.includes(id)) return NextResponse.json({ error: '최대 50개까지 담을 수 있어요' }, { status: 400 });
    await addJup(u.id, id);
  } else await removeJup(u.id, id);
  return NextResponse.json({ ok: true, ids: await listJup(u.id) });
}

export const POST = (req: Request) => change(req, true);
export const DELETE = (req: Request) => change(req, false);
