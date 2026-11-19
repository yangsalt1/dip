/** Upstash 연결 정보: 이름 앞에 어떤 접두어(KV_, STORAGE_ 등)가 붙어도 찾아요 */
function pick(...suffixes: string[]) {
  for (const s of suffixes) {
    if (process.env[s]) return process.env[s];
    const k = Object.keys(process.env).find((x) => x.endsWith('_' + s) && process.env[x]);
    if (k) return process.env[k];
  }
  return undefined;
}
export const REDIS_URL = pick('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REST_API_URL');
export const REDIS_TOKEN = pick('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN', 'REST_API_TOKEN');
