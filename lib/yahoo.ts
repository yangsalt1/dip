import 'server-only';

/**
 * Yahoo Finance 현재가 (키 필요 없음).
 *   미국: 거의 실시간 · 한국(.KS): 약 15~20분 지연 · 환율: 거의 실시간
 */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

export async function yahooPrice(symbol: string): Promise<{ last: number; d1: number }> {
  for (const host of ['query1', 'query2']) {
    try {
      const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`, {
        headers: { 'user-agent': UA, accept: 'application/json' }, cache: 'no-store',
      });
      if (!r.ok) continue;
      const j = await r.json();
      const m = j?.chart?.result?.[0]?.meta;
      const last = Number(m?.regularMarketPrice);
      const prev = Number(m?.chartPreviousClose ?? m?.previousClose);
      if (last > 0 && prev > 0) return { last, d1: Math.round((last / prev - 1) * 10000) / 100 };
    } catch { /* 다음 호스트 */ }
  }
  throw new Error('yahoo ' + symbol);
}
