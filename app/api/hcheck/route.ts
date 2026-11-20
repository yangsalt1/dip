import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const U = [
  'https://api.stock.naver.com/chart/domestic/item/005930/day?startDateTime=202511200000&endDateTime=202611200000',
  'https://api.stock.naver.com/chart/foreign/item/NVDA.O/day?startDateTime=202511200000&endDateTime=202611200000',
  'https://m.stock.naver.com/front-api/external/chart/domestic/info?symbol=005930&requestType=1&startTime=20251120&endTime=20261120&timeframe=day',
  'https://ac.stock.naver.com/ac?q=%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90&target=stock,ipo,index,marketindicator',
  'https://ac.stock.naver.com/ac?q=nvidia&target=stock',
  'https://m.stock.naver.com/front-api/search/autoComplete?query=%ED%85%8C%EC%8A%AC%EB%9D%BC&target=stock',
];
export async function GET() {
  const out = await Promise.all(U.map(async (u) => {
    try { const r = await fetch(u, { headers: { 'user-agent': UA, referer: 'https://m.stock.naver.com/' }, cache: 'no-store', signal: AbortSignal.timeout(9000) }); const t = await r.text(); return { u, s: r.status, n: t.length, head: t.slice(0, 900), tail: t.slice(-300) }; }
    catch (e) { return { u, err: String(e) }; }
  }));
  return NextResponse.json({ out });
}
