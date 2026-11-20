import type { Check, Info, SignalKind } from './types';

/** RSI(14) 전체 줄 */
function rsiSeries(c: number[], n = 14): number[] {
  const out = new Array(c.length).fill(50);
  let g = 0, l = 0;
  for (let i = 1; i < c.length; i++) {
    const ch = c[i] - c[i - 1];
    const up = Math.max(ch, 0), dn = Math.max(-ch, 0);
    if (i <= n) { g += up / n; l += dn / n; } else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; }
    if (i >= n) out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  return out;
}
const argmax = (a: number[], s: number, e: number) => { let k = s; for (let i = s; i < e; i++) if (a[i] > a[k]) k = i; return k; };

/**
 * 신호 만들기. closes = 1년 일별 종가 (오래된 → 최근), last = 지금 가격
 * 챙기기 체크는 사용자 주식일지의 '어깨에서 팔아본다' 체크리스트 중 데이터로 볼 수 있는 4개
 */
export function makeInfo(closesIn: number[], last: number, d1: number, avg: number | null, target = 0.5): Info {
  const c = [...closesIn];
  if (!c.length || Math.abs(c[c.length - 1] - last) / last > 0.0001) c.push(last);
  const hi = Math.max(...c), lo = Math.min(...c);
  const dd = last / hi - 1;
  const pos = hi > lo ? (last - lo) / (hi - lo) : 1;
  const r = rsiSeries(c);
  const rsi = r[r.length - 1];
  const tail = c.slice(-20);
  const ma20 = tail.reduce((s, x) => s + x, 0) / tail.length;
  const pnl = avg && avg > 0 ? last / avg - 1 : null;

  // 2. 주가는 신고가인데 힘(RSI)은 약해짐: 최근 30일 고점 vs 그 전 30~120일 고점
  let diverge = false;
  if (c.length > 130) {
    const n = c.length;
    const i1 = argmax(c, n - 30, n), i0 = argmax(c, n - 120, n - 30);
    diverge = c[i1] >= c[i0] && r[i1] < r[i0] - 3;
  }
  const checks: Check[] = [
    { key: 'dd', label: '최고점에서 10~15% 밀렸다', on: dd <= -0.1 && dd >= -0.2 },
    { key: 'rsi', label: '주가는 오르는데 힘(RSI)은 약해진다', on: diverge },
    { key: 'ma', label: '20일 평균선 아래로 내려왔다', on: last < ma20 },
    { key: 'goal', label: `내 목표수익(+${Math.round(target * 100)}%) 달성했다`, on: pnl != null && pnl >= target },
  ];
  const count = checks.filter((x) => x.on).length;

  let signal: SignalKind = 'hold';
  let why = '특별한 신호 없음. 그대로 들고 가기';
  const rising = r[r.length - 1] > r[r.length - 2];
  if (pnl != null && pnl > 0 && count >= 2) {
    signal = 'take';
    why = count >= 4 ? `체크 ${count}개 · 내 규칙상 전량 정리 고려` : `체크 ${count}개 · 내 규칙상 절반 정리 고려`;
  } else if (dd <= -0.2 && (d1 >= 0.3 || (rsi < 35 && rising))) {
    signal = 'pick'; why = '많이 싸졌고 떨어지는 게 멈췄어';
  } else if (dd <= -0.1 && last < ma20) {
    signal = 'wait'; why = '싸지는 중인데 아직 떨어지는 중';
  } else if (dd <= -0.2) {
    signal = 'pick'; why = '1년 중 많이 싼 편';
  }
  return { last, d1, hi, lo, dd, pos, rsi, ma20, pnl, checks, count, signal, why };
}

export const SIGNAL: Record<SignalKind, { label: string; bg: string; fg: string }> = {
  pick: { label: '줍줍', bg: '#2DB866', fg: '#111' },
  wait: { label: '기다림', bg: '#F2F28E', fg: '#111' },
  hold: { label: '보유', bg: '#E2E2DE', fg: '#111' },
  take: { label: '챙기기', bg: '#FF5A3C', fg: '#111' },
};
