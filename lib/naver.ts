import 'server-only';

/**
 * 네이버 증권 시세 (키 필요 없음, 지연 없음).
 *   한국 ETF: 여러 개를 한 번에 · 미국 ETF: 종목별 · 환율: 하나은행 고시
 */
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
type Q = { last: number; d1: number };
const num = (s: unknown) => Number(String(s ?? '').replace(/,/g, ''));

async function get(url: string) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json', referer: 'https://m.stock.naver.com/' }, cache: 'no-store', signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error('naver ' + r.status);
  return r.json();
}

/** 한국: 6자리 코드 목록 → { 코드: 시세 } */
export async function naverKr(codes: string[]): Promise<Record<string, Q>> {
  const out: Record<string, Q> = {};
  for (let i = 0; i < codes.length; i += 20) {
    const j = await get(`https://polling.finance.naver.com/api/realtime/domestic/stock/${codes.slice(i, i + 20).join(',')}`);
    for (const d of j?.datas ?? []) {
      if (d.openPrice === '-' || d.openPrice == null) continue; // 장 열기 전: 어제 등락률 그대로 두기
      const last = num(d.closePrice); const d1 = num(d.fluctuationsRatio);
      if (last > 0 && Number.isFinite(d1)) out[d.itemCode] = { last, d1 };
    }
  }
  return out;
}

/** 미국: 거래소 꼬리표(.O 나스닥, .K NYSE Arca 등)를 찾아서 기억 */
const suffix: Record<string, string> = {};
export async function naverUs(sym: string): Promise<Q> {
  const tries = suffix[sym] !== undefined ? [suffix[sym]] : ['.O', '.K', '', '.N', '.A'];
  for (const s of tries) {
    try {
      const j = await get(`https://api.stock.naver.com/stock/${sym}${s}/basic`);
      const last = num(j?.closePrice); const d1 = num(j?.fluctuationsRatio);
      if (last > 0 && Number.isFinite(d1)) { suffix[sym] = s; return { last, d1 }; }
    } catch { /* 다음 꼬리표 */ }
  }
  delete suffix[sym];
  throw new Error('naver us ' + sym);
}

/** 환율: usd/eur는 1단위, jpy는 1엔 기준으로 돌려줌 (화면에서 ×100) */
const FX: Record<string, [string, number]> = { usd: ['FX_USDKRW', 1], jpy: ['FX_JPYKRW', 100], eur: ['FX_EURKRW', 1] };
export async function naverFx(id: string): Promise<Q> {
  const [code, per] = FX[id] ?? [];
  if (!code) throw new Error('fx ' + id);
  const j = await get(`https://api.stock.naver.com/marketindex/exchange/${code}`);
  const e = j?.exchangeInfo ?? j;
  const last = num(e?.closePrice) / per; const d1 = num(e?.fluctuationsRatio) * (e?.fluctuationsType?.name === 'FALLING' && num(e?.fluctuationsRatio) > 0 ? -1 : 1);
  if (!(last > 0)) throw new Error('fx ' + id);
  return { last: Math.round(last * 10000) / 10000, d1 };
}
