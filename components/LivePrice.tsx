'use client';
import { etfById, FX_RATE } from '@/lib/data';
import { pct, priceText } from '@/lib/format';
import { useLive } from '@/lib/live';
import { StatusChip, Sticker } from './ui';
import { useLang } from './Lang';

/** ETF 상세 맨 위 가격 카드 (실시간이면 30초마다 바뀌어요) */
export default function LivePrice({ id }: { id: string }) {
  useLive();
  const lang = useLang();
  const en = lang === 'en';
  const e = etfById(id)!;
  const q = e.q;
  const native = e.market === 'us' ? 'usd' : 'krw';
  const other = native === 'usd' ? 'krw' : 'usd';
  const hiText = native === 'usd' ? '$' + q.hi.toFixed(2) : (en ? `₩${Math.round(q.hi).toLocaleString('en-US')}` : Math.round(q.hi).toLocaleString('ko-KR') + '원');
  return (
    <>
      <div className="row"><Sticker kind={e.kind} dd={q.dd} d1={q.d1} label={e.kind === 'mega' || e.kind === 'sale' ? (en ? `vs high ${hiText}` : `최고가 ${hiText} 대비`) : undefined} /><StatusChip kind={e.kind} /></div>
      <div className="rowEnd">
        <span className="big" style={{ fontSize: 56 }}>{priceText(e, native, lang)}</span>
        <span style={{ paddingBottom: 6, fontSize: 15, fontWeight: 800, color: q.d1 >= 0 ? '#A3200F' : '#1A3FA8' }}>{en ? 'Today' : '오늘'} {pct(q.d1)}</span>
      </div>
      <span className="small soft">≈ {priceText(e, other, lang)} ({en ? `$1 = ${Math.round(FX_RATE).toLocaleString('en-US')} KRW` : `1달러 = ${Math.round(FX_RATE).toLocaleString('ko-KR')}원`}) · {en ? 'This week' : '이번 주'} {pct(q.wk)}</span>
    </>
  );
}
