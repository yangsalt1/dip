import type { FX } from './data';
type Fx = (typeof FX)[number];
/** 환율 판단: 1년 범위에서 지금 위치(0=최저, 1=최고) */
export function fxVerdict(f: Fx) {
  const q = f.q;
  const lo = q.lo ?? Math.min(...q.chart.points);
  const p = Math.max(0, Math.min(1, (q.last - lo) / (q.hi - lo)));
  // 1년 중 싼 쪽 1/4 = 사도 괜츈 · 중간 = 사도 낫배드 · 비싼 쪽 1/4 = 비싸게 사는 편
  const label = p < 0.25 ? '사도 괜츈' : p < 0.75 ? '사도 낫배드' : '비싸게 사는 편';
  return { p, label, good: p < 0.25 };
}
