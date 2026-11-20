import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
async function t(u: string, init?: RequestInit) {
  try { const r = await fetch(u, { ...init, headers: { 'user-agent': UA, ...(init?.headers ?? {}) }, cache: 'no-store', signal: AbortSignal.timeout(10000) }); const s = await r.text(); return { s: r.status, n: s.length, body: s }; }
  catch (e) { return { err: String(e) }; }
}
const around = (s: string, f: string, n = 1500) => { const out: string[] = []; let i = 0; while (out.length < 3) { i = s.indexOf(f, i); if (i < 0) break; out.push(s.slice(Math.max(0, i - 300), i + n)); i += n; } return out; };
export async function GET() {
  const key = encodeURIComponent(process.env.DATA_GO_KR_KEY ?? '');
  const out: Record<string, unknown> = {};
  const list = await t(`https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1?serviceKey=${key}&PG_SZ=3&PAGE=1&PAN_SS=${encodeURIComponent('공고중')}`);
  out.lhList = { ...list, body: (list as { body?: string }).body?.slice(0, 3000) };
  // 수원당수 행복주택 (목록에서 본 공고)
  for (const spl of ['010', '050', '060', '070', '080']) {
    const r = await t(`https://apis.data.go.kr/B552555/lhLeaseNoticeSplInfo1/getLeaseNoticeSplInfo1?serviceKey=${key}&PAN_ID=2015122300021119&CCR_CNNT_SYS_DS_CD=03&SPL_INF_TP_CD=${spl}&UPP_AIS_TP_CD=06&AIS_TP_CD=10`);
    out['lhSpl' + spl] = { ...r, body: (r as { body?: string }).body?.slice(0, 2500) };
  }
  const v = await t('https://soco.seoul.go.kr/youth/bbs/BMSR00015/view.do?boardId=6806&menuNo=400008');
  const b = (v as { body?: string }).body ?? '';
  out.socoView = { s: (v as { s?: number }).s, file: around(b, 'atchFile', 700), down: around(b, 'download', 600), fileDown: around(b, 'FileDown', 600), tbl: around(b, '보증금', 1200) };
  return NextResponse.json(out);
}
