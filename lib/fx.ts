import type { FX } from './data';
type Fx = (typeof FX)[number];
/** 환율 판단: 1년 범위에서 지금 위치(0=최저, 1=최고) */
export function fxVerdict(f: Fx) {
  const q = f.q;
  const lo = q.lo ?? Math.min(...q.chart.points);
  const p = Math.max(0, Math.min(1, (q.last - lo) / (q.hi - lo)));
  const label = p < 0.25 ? '사도 괜찮음' : p < 0.75 ? '보통' : '기다리기';
  return { p, label, good: p < 0.25 };
}
