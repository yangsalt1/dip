import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { parseSupply } from '@/lib/house/fetch';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
export async function GET() {
  const r = await fetch('https://apply.lh.or.kr/lhapply/lhFile.do?fileid=69502007', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(25000) });
  const buf = new Uint8Array(await r.arrayBuffer());
  const t0 = Date.now();
  const { text, totalPages } = await extractText(await getDocumentProxy(buf), { mergePages: true });
  const t = String(text);
  const hits: string[] = []; let i = 0;
  while (hits.length < 4) { i = t.indexOf('임대보증금', i); if (i < 0) break; hits.push(t.slice(Math.max(0, i - 300), i + 1200)); i += 1200; }
  return NextResponse.json({ s: r.status, ct: r.headers.get('content-type'), bytes: buf.length, totalPages, ms: Date.now() - t0, len: t.length, parsed: parseSupply(t), hits });
}
