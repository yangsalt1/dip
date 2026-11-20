import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { getNotices } from '@/lib/house/store';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
async function pdfText(u: string) {
  const r = await fetch(u, { headers: { 'user-agent': UA }, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const b = new Uint8Array(await r.arrayBuffer());
  const pdf = await getDocumentProxy(b);
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { bytes: b.length, totalPages, t: String(text), ct: r.headers.get('content-type') };
}
export async function GET() {
  const out: Record<string, unknown> = {};
  const html = await (await fetch('https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId=2015122300021119&ccrCnntSysDsCd=03&uppAisTpCd=06&aisTpCd=10&mi=1026', { headers: { 'user-agent': UA }, cache: 'no-store' })).text();
  const links: string[] = [];
  let i = 0; while (links.length < 8) { i = html.indexOf('.pdf', i); if (i < 0) break; links.push(html.slice(Math.max(0, i - 500), i + 120)); i += 120; }
  out.lhLinks = links;
  const c = await getNotices();
  const bad = c.list.filter((x) => x.src === 'soco' && !x.units.length).slice(0, 3);
  out.soco = await Promise.all(bad.map(async (n) => {
    try {
      if (!n.doc) return { name: n.name, doc: null };
      const p = await pdfText(n.doc);
      const k = p.t.search(/공급\s*현황|임대\s*조건|공급\s*내역|임대보증금/);
      return { name: n.name, doc: n.doc, pages: p.totalPages, len: p.t.length, ct: p.ct, at: k, sec: p.t.slice(Math.max(0, k - 200), k + 1800) };
    } catch (e) { return { name: n.name, err: String(e) }; }
  }));
  return NextResponse.json(out);
}
