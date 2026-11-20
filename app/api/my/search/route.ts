import { NextResponse } from 'next/server';
import { search } from '@/lib/my/server';
import { guessBucket } from '@/lib/my/bucket';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 40);
  if (!q) return NextResponse.json({ items: [] });
  try {
    const items = (await search(q)).map((x) => ({ ...x, bucket: guessBucket(x.name, x.code) }));
    return NextResponse.json({ items });
  } catch { return NextResponse.json({ items: [], error: '검색이 잠깐 안 돼요' }); }
}
