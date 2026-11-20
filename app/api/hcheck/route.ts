import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
type T = { u: string; m?: string; body?: string; ct?: string; find: string[]; raw?: number };
const T: T[] = [
  { u: 'https://soco.seoul.go.kr/youth/pgm/home/yohome/bbsListJson.json', m: 'POST', ct: 'application/x-www-form-urlencoded; charset=UTF-8', body: 'bbsId=BMSR00015&pageIndex=1&searchAdresGu=&searchCondition=&searchKeyword=&optn2=&optn5=', find: [], raw: 3000 },
  { u: 'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId=2015122300021119&ccrCnntSysDsCd=03&uppAisTpCd=06&aisTpCd=10&mi=1026', find: ['월임대료(원)</th>', '공고문 다운로드', '접수기간', '신청일시'] },
  { u: 'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026', find: ['<select', 'name="', 'srchAisTpCd', 'panSs'] },
  { u: 'https://www.applyhome.co.kr/ai/aia/selectPblPvtRentLttotPblancListView.do', find: ['data-pbno'] },
  { u: 'https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do', find: ['pageIndex', 'beginPd', 'searchHouseSecd', '<form'] },
];
export async function GET() {
  const out = await Promise.all(T.map(async (t) => {
    try {
      const h: Record<string, string> = { 'user-agent': UA, accept: '*/*', 'x-requested-with': 'XMLHttpRequest' };
      if (t.ct) h['content-type'] = t.ct;
      const r = await fetch(t.u, { method: t.m ?? 'GET', headers: h, body: t.body, cache: 'no-store', signal: AbortSignal.timeout(9000) });
      const s = await r.text();
      const hits: Record<string, string[]> = {};
      for (const f of t.find) {
        const arr: string[] = []; let i = 0;
        while (arr.length < 2) { i = s.indexOf(f, i); if (i < 0) break; arr.push(s.slice(Math.max(0, i - 200), i + 1800)); i += f.length + 1800; }
        hits[f] = arr;
      }
      return { u: t.u, s: r.status, n: s.length, raw: t.raw ? s.slice(0, t.raw) : undefined, hits };
    } catch (e) { return { u: t.u, err: String(e) }; }
  }));
  return NextResponse.json({ out });
}
