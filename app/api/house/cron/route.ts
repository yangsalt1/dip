import { NextResponse } from 'next/server';
import { getNotices, getPref, markSeen, pushUsers, seen, sendPush } from '@/lib/house/store';
import { daysLeft, matchNotice } from '@/lib/house/calc';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** 하루 몇 번: 공고 새로 모으고 → 조건 맞는 새 공고 / 마감 3일 전 알림 */
export async function GET(req: Request) {
  const sec = process.env.CRON_SECRET;
  if (sec && req.headers.get('authorization') !== `Bearer ${sec}`) return NextResponse.json({ error: 'no' }, { status: 401 });
  const c = await getNotices(true);
  let pushed = 0;
  for (const uid of await pushUsers()) {
    const p = await getPref(uid);
    if (!p || !p.push) continue;
    const done = await seen(uid);
    const hit = c.list.filter((n) => matchNotice(n, p));
    const fresh = hit.filter((n) => !done.has(n.id));
    const soon = hit.filter((n) => daysLeft(n.end) === 3 && !done.has('d3:' + n.id));
    if (fresh.length) {
      pushed += await sendPush(uid, {
        title: `새 청약 ${fresh.length}개 떴어요`,
        body: fresh.slice(0, 3).map((n) => n.name).join(', ') + (fresh.length > 3 ? ` 외 ${fresh.length - 3}개` : ''),
        url: fresh.length === 1 ? `/house/${fresh[0].id}/` : '/house/', tag: 'house-new',
      });
      await markSeen(uid, fresh.map((n) => n.id));
    }
    for (const n of soon) {
      pushed += await sendPush(uid, { title: '청약 마감 3일 전', body: `${n.name} · ${n.end} 마감`, url: `/house/${n.id}/`, tag: 'house-d3-' + n.id });
      await markSeen(uid, ['d3:' + n.id]);
    }
  }
  return NextResponse.json({ ok: true, notices: c.list.length, pushed });
}
