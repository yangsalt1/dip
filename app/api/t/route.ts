import { record, type Ev } from '@/lib/analytics';

/** 방문 기록 받기 (sendBeacon). 응답은 늘 204 */
export async function POST(req: Request) {
  try {
    const body = JSON.parse(await req.text()) as { vid?: string; src?: string; lang?: string; ev?: Ev[] };
    await record(String(body.vid ?? ''), body.src === 'app' ? 'app' : 'web', String(body.lang ?? 'ko'), Array.isArray(body.ev) ? body.ev : []);
  } catch { /* 무시 */ }
  return new Response(null, { status: 204 });
}
