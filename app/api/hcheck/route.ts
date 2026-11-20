import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const B = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/';
const OPS = ['getAPTLttotPblancDetail', 'getRemndrLttotPblancDetail', 'getRemndrLttotPblancMdl', 'getPblPvtRentLttotPblancDetail', 'getPblPvtRentLttotPblancMdl', 'getUrbtyOfctlLttotPblancDetail'];
export async function GET() {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key) return NextResponse.json({ key: false });
  const out: Record<string, unknown> = { key: true };
  for (const op of OPS) {
    try {
      const r = await fetch(`${B}${op}?page=1&perPage=2&serviceKey=${encodeURIComponent(key)}`, { cache: 'no-store', signal: AbortSignal.timeout(9000) });
      const t = await r.text();
      out[op] = { s: r.status, body: t.slice(0, 2500) };
    } catch (e) { out[op] = String(e); }
  }
  return NextResponse.json(out);
}
