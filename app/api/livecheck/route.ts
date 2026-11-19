import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'icn1';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const URLS = [
  'https://query1.finance.yahoo.com/v8/finance/chart/QQQ?range=1d&interval=5m',
  'https://query2.finance.yahoo.com/v8/finance/chart/KRW=X?range=1d&interval=5m',
  'https://polling.finance.naver.com/api/realtime/domestic/stock/069500,360750',
  'https://m.stock.naver.com/api/stock/069500/basic',
  'https://api.stock.naver.com/stock/QQQ.O/basic',
  'https://api.stock.naver.com/etf/QQQ.O/basic',
  'https://api.stock.naver.com/marketindex/exchange/FX_USDKRW',
  'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=exchange&reutersCode=FX_USDKRW',
  'https://stooq.com/q/l/?s=qqq.us&f=sd2t2ohlcp&h&e=csv',
];
export async function GET() {
  const out = await Promise.all(URLS.map(async (u) => {
    try {
      const r = await fetch(u, { headers: { 'user-agent': UA, accept: '*/*', referer: 'https://m.stock.naver.com/' }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
      const t = await r.text();
      return { u, s: r.status, b: t.slice(0, 700) };
    } catch (e) { return { u, err: String(e) }; }
  }));
  return NextResponse.json({ region: process.env.VERCEL_REGION, out });
}
