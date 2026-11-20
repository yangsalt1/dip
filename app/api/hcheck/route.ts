import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { getNotices } from '@/lib/house/store';
import { parseSupply } from '@/lib/house/fetch';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
export async function GET() {
  const out: Record<string, unknown> = {};
  const html = await (await fetch('https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId=2015122300021119&ccrCnntSysDsCd=03&uppAisTpCd=06&aisTpCd=10&mi=1026', { headers: { 'user-agent': UA }, cache: 'no-store' })).text();
  const i = html.indexOf('function fileDownLoad');
  out.fn = i >= 0 ? html.slice(i, i + 900) : 'not in page';
  const js = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter((u) => /lhapply|sub|com/.test(u)).slice(0, 8);
  out.js = js;
  for (const u of js) {
    try {
      const t = await (await fetch(new URL(u, 'https://apply.lh.or.kr').toString(), { headers: { 'user-agent': UA } })).text();
      const k = t.indexOf('fileDownLoad');
      if (k >= 0) { out.fnJs = { u, s: t.slice(Math.max(0, k - 100), k + 900) }; break; }
    } catch { /* */ }
  }
  const c = await getNotices();
  const bad = c.list.filter((x) => x.src === 'soco' && !x.units.length && x.doc).slice(0, 5);
  out.soco = await Promise.all(bad.map(async (n) => {
    const r = await fetch(n.doc!, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
    const { text } = await extractText(await getDocumentProxy(new Uint8Array(await r.arrayBuffer())), { mergePages: true });
    const t = String(text); const k = t.search(/㎡/);
    return { name: n.name, parsed: parseSupply(t), around: t.slice(Math.max(0, k - 600), k + 900) };
  }));
  return NextResponse.json(out);
}
