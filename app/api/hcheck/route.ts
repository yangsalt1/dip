import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'icn1';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const URLS = [
  'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail?page=1&perPage=1',
  'https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1?PG_SZ=1&PAGE=1',
  'https://soco.seoul.go.kr/youth/bbs/BMSR00015/list.do?menuNo=400008',
  'https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do',
  'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026',
];
export async function GET() {
  const out = await Promise.all(URLS.map(async (u) => {
    try {
      const r = await fetch(u, { headers: { 'user-agent': UA, accept: '*/*' }, cache: 'no-store', signal: AbortSignal.timeout(9000) });
      const t = await r.text();
      const i = t.indexOf('<tbody');
      return { u, s: r.status, n: t.length, head: t.slice(0, 300), body: i >= 0 ? t.slice(i, i + 2500) : '' };
    } catch (e) { return { u, err: String(e) }; }
  }));
  return NextResponse.json({ region: process.env.VERCEL_REGION, out });
}
