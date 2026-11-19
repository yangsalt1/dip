import 'server-only';
import { Redis } from '@upstash/redis';

/**
 * 한국투자증권 KIS Developers (실전 도메인) 시세 조회.
 *   환경변수: KIS_APP_KEY, KIS_APP_SECRET
 *   - 접근토큰은 24시간짜리 + 1분에 1번만 발급돼서 저장소에 저장해 두고 같이 써요.
 */
const BASE = 'https://openapi.koreainvestment.com:9443';
const APP_KEY = process.env.KIS_APP_KEY;
const APP_SECRET = process.env.KIS_APP_SECRET;
export const kisReady = Boolean(APP_KEY && APP_SECRET);

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && tok ? new Redis({ url, token: tok }) : null;

let memTok: { t: string; exp: number } | null = null;

async function issue(): Promise<{ t: string; exp: number }> {
  const r = await fetch(`${BASE}/oauth2/tokenP`, {
    method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ grant_type: 'client_credentials', appkey: APP_KEY, appsecret: APP_SECRET }), cache: 'no-store',
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('KIS token: ' + (j.error_description || j.msg1 || r.status));
  const sec = Number(j.expires_in) || 86400;
  return { t: j.access_token, exp: Date.now() + (sec - 600) * 1000 };
}

async function token(): Promise<string> {
  if (memTok && memTok.exp > Date.now()) return memTok.t;
  if (redis) {
    const saved = (await redis.get('kis:token')) as { t: string; exp: number } | null;
    if (saved && saved.exp > Date.now()) { memTok = saved; return saved.t; }
    // 여러 서버가 동시에 발급하지 않게 잠금 (KIS는 1분에 1번만 발급)
    const got = await redis.set('kis:lock', '1', { nx: true, ex: 65 });
    if (!got) {
      await new Promise((r) => setTimeout(r, 1500));
      const again = (await redis.get('kis:token')) as { t: string; exp: number } | null;
      if (again && again.exp > Date.now()) { memTok = again; return again.t; }
      throw new Error('KIS token busy');
    }
    const n = await issue();
    await redis.set('kis:token', n, { ex: Math.max(60, Math.floor((n.exp - Date.now()) / 1000)) });
    memTok = n; return n.t;
  }
  memTok = await issue();
  return memTok.t;
}

async function get(path: string, trId: string, params: Record<string, string>, retry = true): Promise<Record<string, string>> {
  const t = await token();
  const r = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`, {
    headers: { 'content-type': 'application/json; charset=utf-8', authorization: `Bearer ${t}`, appkey: APP_KEY!, appsecret: APP_SECRET!, tr_id: trId, custtype: 'P' },
    cache: 'no-store',
  });
  const j = await r.json().catch(() => ({}));
  if (j.rt_cd !== '0') {
    // 초당 호출 제한(EGW00201)이면 잠깐 쉬고 한 번 더
    if (retry && (j.msg_cd === 'EGW00201' || r.status === 500)) { await new Promise((s) => setTimeout(s, 400)); return get(path, trId, params, false); }
    if (j.msg_cd === 'EGW00123' || j.msg_cd === 'EGW00121') { memTok = null; if (redis) await redis.del('kis:token'); }
    throw new Error(`KIS ${trId} ${j.msg_cd ?? r.status} ${j.msg1 ?? ''}`);
  }
  return j.output ?? {};
}

/** 국내 주식·ETF 현재가 (코드 6자리) */
export async function krPrice(code: string) {
  const o = await get('/uapi/domestic-stock/v1/quotations/inquire-price', 'FHKST01010100', { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: code });
  const last = Number(o.stck_prpr), d1 = Number(o.prdy_ctrt);
  if (!(last > 0)) throw new Error('KIS kr empty ' + code);
  return { last, d1 };
}

/** 해외 주식·ETF 현재가. EXCD: NAS 나스닥 · NYS 뉴욕 · AMS 아멕스(NYSE Arca ETF 포함) */
export async function usPrice(symb: string, excd: string) {
  const o = await get('/uapi/overseas-price/v1/quotations/price', 'HHDFS00000300', { AUTH: '', EXCD: excd, SYMB: symb });
  const last = Number(o.last), d1 = Number(o.rate);
  if (!(last > 0)) throw new Error('KIS us empty ' + symb);
  return { last, d1 };
}
