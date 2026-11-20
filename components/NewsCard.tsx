'use client';
import Rich from './Rich';
import Link from 'next/link';
import { BRIEF, etfById } from '@/lib/data';
import { Arrow, Sticker } from './ui';
import { etfTitle, etfSubtitle } from '@/lib/format';

type Card = (typeof BRIEF.cards)[number] & { short?: string; etfs?: string[]; buy?: string; story?: string };

/** 뉴스 한 장 아래 붙는 '관련 ETF + 사? 말아?' */
export function NewsExtra({ c }: { c: Card }) {
  const etfs = (c.etfs ?? []).map((id) => etfById(id)).filter(Boolean);
  return (
    <div className="nx">
      <div className="nxEtfs">
        {etfs.map((e) => (
          <Link key={e!.id} href={`/etf/${e!.id}/`} className="nxEtf">
            <span className="nxNm"><b>{etfTitle(e!)}</b><small>{etfSubtitle(e!)}</small></span>
            <Sticker kind={e!.kind} dd={e!.q.dd} d1={e!.q.d1} />
          </Link>
        ))}
      </div>
      {c.buy && (
        <Link href={c.story ? `/story/${c.story}/` : `/etf/${(c.etfs ?? [])[0] ?? ''}/`} className="nxBuy">
          <span>사? 말아?</span><b>{c.buy}</b><Arrow color="#111" />
        </Link>
      )}
    </div>
  );
}

export default function NewsCard({ c, i, bg }: { c: Card; i: number; bg: string }) {
  return (
    <section className="wCard nCard" style={{ background: bg }}>
      <div className="row"><span className="num">{i + 1}</span><b style={{ fontSize: 14 }}>{c.label}</b></div>
      <p className="wMid">{c.kid}</p>
      {c.short && <p className="nShort rich"><Rich t={c.short} /></p>}
      <NewsExtra c={c} />
    </section>
  );
}
