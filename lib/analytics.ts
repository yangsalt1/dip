import { Redis } from '@upstash/redis';
import { REDIS_URL, REDIS_TOKEN } from '@/lib/redisEnv';

/**
 * 아주 가벼운 방문 분석 (개인정보 없음).
 * 날짜(한국시간)별로: 페이지 조회수·머문 시간, 홈 섹션별 본 시간, 방문자 수(익명 번호), 앱/웹 비율.
 * 키는 90일 뒤 자동 삭제.
 */
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;
export const analyticsReady = Boolean(redis);
const TTL = 60 * 60 * 24 * 90;

export const kstDay = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const K = (day: string, k: string) => `a:${day}:${k}`;

export type Ev = { t: 'pv'; p: string } | { t: 'tm'; p: string; s: number } | { t: 'sec'; k: string; s: number };

/** 경로 정리: /etf/voo/?x → /etf/voo/ */
export function cleanPath(p: string) {
  const s = (p || '/').split(/[?#]/)[0].slice(0, 60);
  if (!/^\/[a-z0-9\-/_]*$/i.test(s)) return null;
  return s.endsWith('/') ? s : `${s}/`;
}
const cleanKey = (k: string) => (/^[a-z0-9\-_]{1,30}$/i.test(k) ? k : null);

export async function record(vid: string, src: 'app' | 'web', lang: string, evs: Ev[]) {
  if (!redis || !evs.length) return;
  const day = kstDay();
  const p = redis.pipeline();
  if (/^[a-z0-9]{8,40}$/i.test(vid)) p.pfadd(K(day, 'uv'), vid);
  let pv = 0;
  for (const e of evs.slice(0, 40)) {
    if (e.t === 'pv') { const path = cleanPath(e.p); if (path) { p.hincrby(K(day, 'views'), path, 1); pv++; } }
    if (e.t === 'tm') { const path = cleanPath(e.p); const s = Math.round(Math.min(Math.max(e.s, 0), 1800)); if (path && s > 0) p.hincrby(K(day, 'time'), path, s); }
    if (e.t === 'sec') { const k = cleanKey(e.k); const s = Math.round(Math.min(Math.max(e.s, 0), 1800)); if (k && s > 0) { p.hincrby(K(day, 'sec'), k, s); p.hincrby(K(day, 'secn'), k, 1); } }
  }
  if (pv) { p.hincrby(K(day, 'src'), src, pv); p.hincrby(K(day, 'lang'), lang === 'en' ? 'en' : 'ko', pv); }
  for (const k of ['uv', 'views', 'time', 'sec', 'secn', 'src', 'lang']) p.expire(K(day, k), TTL);
  await p.exec();
}

export type DayStats = {
  day: string; uv: number;
  views: Record<string, number>; time: Record<string, number>;
  sec: Record<string, number>; secn: Record<string, number>;
  src: Record<string, number>; lang: Record<string, number>;
};

export async function readDays(n: number): Promise<DayStats[]> {
  if (!redis) return [];
  const days = Array.from({ length: n }, (_, i) => kstDay(new Date(Date.now() - i * 86400e3)));
  const p = redis.pipeline();
  for (const d of days) {
    p.pfcount(K(d, 'uv'));
    for (const k of ['views', 'time', 'sec', 'secn', 'src', 'lang']) p.hgetall(K(d, k));
  }
  const r = (await p.exec()) as unknown[];
  const num = (o: unknown) => Object.fromEntries(Object.entries((o as Record<string, unknown>) ?? {}).map(([k, v]) => [k, Number(v) || 0]));
  return days.map((day, i) => {
    const b = i * 7;
    return { day, uv: Number(r[b]) || 0, views: num(r[b + 1]), time: num(r[b + 2]), sec: num(r[b + 3]), secn: num(r[b + 4]), src: num(r[b + 5]), lang: num(r[b + 6]) };
  });
}
