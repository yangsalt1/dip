'use client';
import { liveTime, useLive } from '@/lib/live';
import { useLang } from './Lang';

/** 화면 맨 아래 작은 시세 출처 표시 */
export default function LiveStamp({ market }: { market?: 'us' | 'kr' }) {
  const live = useLive();
  const en = useLang() === 'en';
  const t = liveTime(live.at);
  if (!t) return null;
  const src = en
    ? live.src === 'kis' ? 'Korea Investment live' : live.src === 'naver' ? 'Naver Finance live' : market === 'us' ? 'Yahoo Finance' : 'Yahoo Finance · Korean ETFs ~15–20 min delayed'
    : live.src === 'kis' ? '한국투자증권 실시간' : live.src === 'naver' ? '네이버 증권 실시간' : market === 'us' ? 'Yahoo Finance' : 'Yahoo Finance · 한국 ETF는 약 15~20분 지연';
  return <p className="note" style={{ marginTop: 18 }}>● {en ? `Prices updated ${t}` : `가격 ${t} 업데이트`} · {src}</p>;
}
