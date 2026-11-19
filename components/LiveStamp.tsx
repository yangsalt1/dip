'use client';
import { liveTime, useLive } from '@/lib/live';

/** 화면 맨 아래 작은 시세 출처 표시 */
export default function LiveStamp({ market }: { market?: 'us' | 'kr' }) {
  const live = useLive();
  const t = liveTime(live.at);
  if (!t) return null;
  const src = live.src === 'kis' ? '한국투자증권 실시간' : live.src === 'naver' ? '네이버 증권 실시간' : market === 'us' ? 'Yahoo Finance' : 'Yahoo Finance · 한국 ETF는 약 15~20분 지연';
  return <p className="note" style={{ marginTop: 18 }}>● 가격 {t} 업데이트 · {src}</p>;
}
