import 'server-only';
import { Redis } from '@upstash/redis';
import webpush from 'web-push';
import { REDIS_URL, REDIS_TOKEN } from '@/lib/redisEnv';
import type { Notice, Pref } from './types';
import { EMPTY_PREF } from './types';
import { collect } from './fetch';

/**
 * 청약 저장소
 *   house:all          → 모아온 공고 { at, list } (3시간마다 새로)
 *   hpref:<회원>       → 내 조건
 *   push:<회원>        → 알림 받을 기기들 (Set, JSON)
 *   hseen:<회원>       → 이미 알림 보낸 공고 id (Set)
 *   hpush:users        → 알림 켠 회원 목록 (Set)
 *   vapid              → 알림용 서버 열쇠 (처음 한 번 자동 생성)
 */
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;
const mem = new Map<string, unknown>();
const TTL_MS = 3 * 3600e3;

type Cache = { at: number; list: Notice[] };
let local: Cache | null = null;

async function rget<T>(k: string): Promise<T | null> { return redis ? ((await redis.get(k)) as T | null) : ((mem.get(k) as T) ?? null); }
async function rset(k: string, v: unknown) { if (redis) await redis.set(k, v); else mem.set(k, v); }

export async function getNotices(force = false): Promise<Cache> {
  // 로컬 화면 테스트 전용 (배포에서는 절대 안 켜져요)
  if (process.env.HOUSE_MOCK === '1' && !process.env.VERCEL) return { at: Date.now(), list: (await import('./mock')).MOCK };
  if (!force && local && Date.now() - local.at < 60e3) return local;
  const c = await rget<Cache>('house:v2');
  if (!force && c && Date.now() - c.at < TTL_MS) { local = c; return c; }
  // 한 번에 한 서버만 새로 모으기
  if (redis) {
    const ok = await redis.set('house:lock', '1', { nx: true, ex: 90 });
    if (!ok && c) return c;
  }
  try {
    const old: Record<string, Notice> = {};
    for (const n of c?.list ?? []) old[n.id] = n;
    const list = await collect(old);
    const v = { at: Date.now(), list: list.length ? list : c?.list ?? [] };
    await rset('house:v2', v);
    local = v;
    return v;
  } finally {
    if (redis) await redis.del('house:lock');
  }
}

export async function getPref(uid: string): Promise<Pref | null> { return rget<Pref>(`hpref:${uid}`); }
export async function setPref(uid: string, p: Pref) {
  await rset(`hpref:${uid}`, { ...EMPTY_PREF, ...p });
  if (redis) { if (p.push) await redis.sadd('hpush:users', uid); else await redis.srem('hpush:users', uid); }
}

/* ───── 알림 ───── */
export async function vapid(): Promise<{ publicKey: string; privateKey: string }> {
  let v = await rget<{ publicKey: string; privateKey: string }>('vapid');
  if (!v) {
    v = webpush.generateVAPIDKeys();
    if (redis) { const ok = await redis.set('vapid', v, { nx: true }); if (!ok) v = (await redis.get('vapid')) as typeof v; }
    else mem.set('vapid', v);
  }
  return v!;
}
export async function addSub(uid: string, sub: unknown) {
  if (redis) { await redis.sadd(`push:${uid}`, JSON.stringify(sub)); await redis.sadd('hpush:users', uid); }
}
export async function pushUsers(): Promise<string[]> { return redis ? ((await redis.smembers('hpush:users')) as string[]) : []; }
export async function seen(uid: string): Promise<Set<string>> { return new Set(redis ? ((await redis.smembers(`hseen:${uid}`)) as string[]) : []); }
export async function markSeen(uid: string, ids: string[]) { if (redis && ids.length) await redis.sadd(`hseen:${uid}`, ids[0], ...ids.slice(1)); }

export async function sendPush(uid: string, payload: { title: string; body: string; url: string; tag?: string }) {
  if (!redis) return 0;
  const v = await vapid();
  webpush.setVapidDetails('https://jup-rosy.vercel.app', v.publicKey, v.privateKey);
  const subs = (await redis.smembers(`push:${uid}`)) as unknown[];
  let sent = 0;
  for (const s of subs) {
    const raw = typeof s === 'string' ? s : JSON.stringify(s);
    try { await webpush.sendNotification(JSON.parse(raw), JSON.stringify(payload)); sent++; }
    catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) await redis.srem(`push:${uid}`, raw); }
  }
  return sent;
}
