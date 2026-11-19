import { Redis } from '@upstash/redis';

/**
 * 줍줍리스트 저장소 (Upstash Redis · Vercel Storage에서 한 번에 연결).
 * 키: jup:<로그인서비스>:<회원번호> → ETF id 목록(Set)
 */
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// 로컬 테스트용 메모리 저장소 (배포에서는 쓰지 않아요)
const mem = new Map<string, Set<string>>();
const useMem = !redis && process.env.AUTH_DEV_LOGIN === '1' && !process.env.VERCEL;

export const storeReady = Boolean(redis) || useMem;
const key = (uid: string) => `jup:${uid}`;

export async function listJup(uid: string): Promise<string[]> {
  if (redis) return (await redis.smembers(key(uid))) as string[];
  return [...(mem.get(key(uid)) ?? [])];
}
export async function addJup(uid: string, id: string) {
  if (redis) { await redis.sadd(key(uid), id); return; }
  if (!mem.has(key(uid))) mem.set(key(uid), new Set());
  mem.get(key(uid))!.add(id);
}
export async function removeJup(uid: string, id: string) {
  if (redis) { await redis.srem(key(uid), id); return; }
  mem.get(key(uid))?.delete(id);
}
export async function clearJup(uid: string) {
  if (redis) { await redis.del(key(uid)); return; }
  mem.delete(key(uid));
}
