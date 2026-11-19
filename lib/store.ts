import { Redis } from '@upstash/redis';

/**
 * 저장소 (Upstash Redis · Vercel Storage에서 한 번에 연결).
 *   jup:<서비스>:<회원번호>   → 줍줍리스트 ETF id (Set)
 *   port:<서비스>:<회원번호>  → 내 포트폴리오 분석 결과 (종목 이름·칸·비중만, 사진은 저장 안 함)
 *   quota:<회원번호>:<날짜>   → 하루 분석 횟수
 */
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
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
  if (redis) { await redis.del(key(uid), pkey(uid)); return; }
  mem.delete(key(uid)); mem.delete(pkey(uid));
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
