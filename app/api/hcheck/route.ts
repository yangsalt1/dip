import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
export async function GET() {
  const key = encodeURIComponent(process.env.DATA_GO_KR_KEY ?? '');
  const out: Record<string, unknown> = {};
  for (const [pan, spl, upp, ais] of [] as string[][]) {
    try {
      const r = await fetch(`https://apis.data.go.kr/B552555/lhLeaseNoticeSplInfo1/getLeaseNoticeSplInfo1?serviceKey=${key}&PAN_ID=${pan}&CCR_CNNT_SYS_DS_CD=03&SPL_INF_TP_CD=${spl}&UPP_AIS_TP_CD=${upp}&AIS_TP_CD=${ais}`, { cache: 'no-store' });
      out['spl' + pan] = (await r.text()).slice(0, 3500);
    } catch (e) { out['spl' + pan] = String(e); }
  }
  try {
    const r = await fetch('https://soco.seoul.go.kr/coHouse/cmmn/file/fileDown.do?atchFileId=78f3aa6df7454dad8367131ca942b47b&fileSn=1', { headers: { 'user-agent': UA }, cache: 'no-store' });
    const buf = new Uint8Array(await r.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    const t = String(text);
    const i = t.indexOf('보증금');
    out.pdf = { totalPages, len: t.length, i, full: t.slice(3500, 8800) };
  } catch (e) { out.pdf = String(e); }
  return NextResponse.json(out);
}
