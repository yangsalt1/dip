import { Redis } from '@upstash/redis';
import { REDIS_URL, REDIS_TOKEN } from '@/lib/redisEnv';

/**
 * 저장소 (Upstash Redis · Vercel Storage에서 한 번에 연결).
 *   jup:<서비스>:<회원번호>   → 줍줍리스트 ETF id (Set)
 *   port:<서비스>:<회원번호>  → 내 포트폴리오 분석 결과 (종목 이름·칸·비중만, 사진은 저장 안 함)
 *   quota:<회원번호>:<날짜>   → 하루 분석 횟수
 */
const url = REDIS_URL;
const token = REDIS_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// 로컬 테스트용 메모리 저장소 (배포에서는 쓰지 않아요)
const mem = new Map<string, unknown>();
const useMem = !redis && process.env.AUTH_DEV_LOGIN === '1' && !process.env.VERCEL;

export const storeReady = Boolean(redis) || useMem;
const key = (uid: string) => `jup:${uid}`;
const pkey = (uid: string) => `port:${uid}`;

export async function listJup(uid: string): Promise<string[]> {
  if (redis) return (await redis.smembers(key(uid))) as string[];
  return [...((mem.get(key(uid)) as Set<string>) ?? [])];
}
export async function addJup(uid: string, id: string) {
  if (redis) { await redis.sadd(key(uid), id); return; }
  if (!mem.has(key(uid))) mem.set(key(uid), new Set());
  (mem.get(key(uid)) as Set<string>).add(id);
}
export async function removeJup(uid: string, id: string) {
  if (redis) { await redis.srem(key(uid), id); return; }
  (mem.get(key(uid)) as Set<string> | undefined)?.delete(id);
}
export async function clearJup(uid: string) {
  if (redis) { await redis.del(key(uid), pkey(uid)); await redis.hdel('users', uid); return; }
  mem.delete(key(uid)); mem.delete(pkey(uid)); mem.delete('u:' + uid); (mem.get('users') as Set<string> | undefined)?.delete(uid);
}

export async function getPort<T>(uid: string): Promise<T | null> {
  if (redis) return ((await redis.get(pkey(uid))) as T) ?? null;
  return (mem.get(pkey(uid)) as T) ?? null;
}
export async function setPort(uid: string, v: unknown) {
  if (redis) { await redis.set(pkey(uid), v); return; }
  mem.set(pkey(uid), v);
}
export async function delPort(uid: string) {
  if (redis) { await redis.del(pkey(uid)); return; }
  mem.delete(pkey(uid));
}

/** 하루 분석 횟수 +1 하고 지금 횟수 돌려줘요 */
export async function bumpQuota(uid: string): Promise<number> {
  const k = `quota:${uid}:${new Date().toISOString().slice(0, 10)}`;
  if (redis) { const n = await redis.incr(k); if (n === 1) await redis.expire(k, 60 * 60 * 26); return n; }
  const n = ((mem.get(k) as number) ?? 0) + 1; mem.set(k, n); return n;
}

/** 회원 목록 (관리자 페이지용). users 해시: 회원번호 → 정보 */
export type Member = { uid: string; provider: string; name: string; email: string; first: string; last: string; logins: number };
export async function touchUser(uid: string, provider: string, name: string, email: string) {
  const now = new Date().toISOString();
  const prev = (redis ? ((await redis.hget('users', uid)) as Member | null) : (mem.get('u:' + uid) as Member | undefined)) ?? null;
  const m: Member = { uid, provider, name: name || prev?.name || '', email: email || prev?.email || '', first: prev?.first ?? now, last: now, logins: (prev?.logins ?? 0) + 1 };
  if (redis) await redis.hset('users', { [uid]: m });
  else { mem.set('u:' + uid, m); const all = (mem.get('users') as Set<string>) ?? new Set(); all.add(uid); mem.set('users', all); }
}
export async function allUsers(): Promise<Member[]> {
  if (redis) return Object.values(((await redis.hgetall('users')) ?? {}) as Record<string, Member>);
  return [...((mem.get('users') as Set<string>) ?? [])].map((u) => mem.get('u:' + u) as Member);
}
export async function delUser(uid: string) {
  if (redis) { await redis.hdel('users', uid); return; }
  mem.delete('u:' + uid); (mem.get('users') as Set<string> | undefined)?.delete(uid);
}
export async function userStats(uid: string) {
  if (redis) { const [n, p] = await Promise.all([redis.scard(key(uid)), redis.exists(pkey(uid))]); return { jup: n, port: p === 1 }; }
  return { jup: ((mem.get(key(uid)) as Set<string>) ?? new Set()).size, port: mem.has(pkey(uid)) };
}
