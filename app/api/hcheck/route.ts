import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
type T = { u: string; m?: string; body?: string; find: string[] };
const T: T[] = [
  { u: 'https://soco.seoul.go.kr/youth/bbs/BMSR00015/list.do?menuNo=400008', find: ['cohomeList', '.json', 'ajax', 'url:'] },
  { u: 'https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000591&pblancNo=2026000591', find: ['주택형', '공급금액', '분양가', '<table', '전용'] },
  { u: 'https://www.applyhome.co.kr/ai/aia/selectPRMOLttotPblancListView.do', find: ['<tbody', 'data-pbno'] },
  { u: 'https://www.applyhome.co.kr/ai/aia/selectAPTRemndrLttotPblancListView.do', find: ['<tbody', 'data-pbno'] },
  { u: 'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId=2015122300021119&ccrCnntSysDsCd=03&uppAisTpCd=06&aisTpCd=10&mi=1026', find: ['전용', '임대보증금', '월임대료', '공급', '<table'] },
];
export async function GET() {
  const out = await Promise.all(T.map(async (t) => {
    try {
      const r = await fetch(t.u, { method: t.m ?? 'GET', headers: { 'user-agent': UA, accept: '*/*' }, cache: 'no-store', signal: AbortSignal.timeout(9000) });
      const s = await r.text();
      const hits: Record<string, string[]> = {};
      for (const f of t.find) {
        const arr: string[] = []; let i = 0;
        while (arr.length < 3) { i = s.indexOf(f, i); if (i < 0) break; arr.push(s.slice(Math.max(0, i - 300), i + 900)); i += f.length + 900; }
        hits[f] = arr;
      }
      return { u: t.u, s: r.status, n: s.length, hits };
    } catch (e) { return { u: t.u, err: String(e) }; }
  }));
  return NextResponse.json({ out });
}
