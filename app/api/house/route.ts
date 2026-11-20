import { NextResponse } from 'next/server';
import { getNotices } from '@/lib/house/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** 모아온 청약 공고 (?id= 하나만) */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  try {
    const c = await getNotices();
    if (id) {
      const n = c.list.find((x) => x.id === id);
      return n ? NextResponse.json({ ok: true, at: c.at, notice: n }) : NextResponse.json({ ok: false, reason: 'gone' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, at: c.at, list: c.list });
  } catch {
    return NextResponse.json({ ok: false, reason: 'error', list: [] }, { status: 500 });
  }
}
