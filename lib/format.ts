import { tf, type Lang } from './i18n';
import type { Etf, Kind } from './data';
import { FX_RATE } from './data';

export type Cur = 'usd' | 'krw';

export function priceText(e: Etf, cur: Cur, lang: Lang = 'ko'): string {
  let v = e.q.last;
  const native: Cur = e.market === 'us' ? 'usd' : 'krw';
  if (cur === 'usd') {
    if (native === 'krw') v = v / FX_RATE;
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (native === 'usd') v = v * FX_RATE;
  return Math.round(v).toLocaleString('ko-KR') + (lang === 'en' ? ' KRW' : '원');
}

export function pct(v: number, digits = 2): string {
  return (v > 0 ? '+' : '') + v.toFixed(digits) + '%';
}

export function won(n: number): string {
  if (n >= 10000) return Math.round(n / 10000).toLocaleString('ko-KR') + '만원';
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

export const KIND_CHIP_EN: Record<Kind, string> = {
  mega: 'Mega sale on',
  sale: 'On sale',
  up: 'Climbing~!!',
  wow: 'Easy · maybe at the top',
};
export const kindChip = (k: Kind, lang: Lang = 'ko') => (lang === 'en' ? KIND_CHIP_EN : KIND_CHIP)[k];

export const KIND_CHIP: Record<Kind, string> = {
  mega: '특급세일 진행중',
  sale: '일반 세일',
  up: '상승 중~!!',
  wow: '워워 · 어깨 위일 수도',
};

export function statusLine(e: Etf, lang: Lang = 'ko'): { line: string; side: string } {
  const { dd, d1 } = e.q;
  if (lang === 'en') {
    if (e.kind === 'mega') return { line: `${Math.abs(dd).toFixed(1)}% off the high · mega sale`, side: `Today ${pct(d1)}` };
    if (e.kind === 'sale') return { line: `${Math.abs(dd).toFixed(1)}% off the high`, side: `Today ${pct(d1)}` };
    if (e.kind === 'up') return { line: `Up ${pct(d1)} today~!!`, side: `${Math.abs(dd).toFixed(1)}% to the high` };
    return { line: 'Right near the high! Might take a breather', side: `Today ${pct(d1)}` };
  }
  if (e.kind === 'mega') return { line: `최고가보다 ${Math.abs(dd).toFixed(1)}% 특급 할인 중`, side: `오늘 ${pct(d1)}` };
  if (e.kind === 'sale') return { line: `최고가보다 ${Math.abs(dd).toFixed(1)}% 할인 중`, side: `오늘 ${pct(d1)}` };
  if (e.kind === 'up') return { line: `오늘 ${pct(d1)} 상승 중~!!`, side: `최고가까지 ${Math.abs(dd).toFixed(1)}% 남음` };
  return { line: '최고가 바로 근처! 쉬어갈 수 있어요', side: `오늘 ${pct(d1)}` };
}

export function tempLabel(buy: number, lang: Lang = 'ko'): string {
  if (lang === 'en') return buy >= 65 ? 'Good zone to buy' : buy >= 35 ? 'Watch' : 'Sit tight';
  if (buy >= 65) return '사도 좋은 구간';
  if (buy >= 35) return '지켜보기';
  return '쉬어가기';
}

/** 화면 큰 이름: 미국은 티커(VOO), 한국은 진짜 상품명(TIGER 미국나스닥100) */
export const etfTitle = (e: Etf, lang: Lang = 'ko') => (e.market === 'us' ? e.code : lang === 'en' && e.nameEn ? e.nameEn : e.name);
/** 이름 옆(밑) 작은 글씨: 어떤 ETF인지 한 줄 설명. 이름과 항상 세트로 */
export const etfSubtitle = (e: Etf, lang: Lang = 'ko') => tf(e, 'kw', lang);
