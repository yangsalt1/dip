import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addSub, vapid } from '@/lib/house/store';

export const dynamic = 'force-dynamic';

/** 알림 열쇠(공개용) */
export async function GET() {
  try { return NextResponse.json({ key: (await vapid()).publicKey }); }
  catch { return NextResponse.json({ key: null }); }
}

/** 이 기기로 알림 받기 */
export async function POST(req: Request) {
  const s = await auth();
  const u = (s?.user as { id?: string } | undefined)?.id;
  if (!u) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  const sub = await req.json().catch(() => null);
  if (!sub?.endpoint || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint)) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  await addSub(u, { endpoint: sub.endpoint, keys: sub.keys });
  return NextResponse.json({ ok: true });
}
