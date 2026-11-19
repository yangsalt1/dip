'use client';
import { useEffect, useState } from 'react';
import { ETFS, FX, kindOf } from './data';

/**
 * 실시간 시세 (Yahoo Finance, 한국투자 키가 있으면 한국투자). 1분마다 /api/live 를 불러서 화면 속 ETF 가격·등락·할인율·세일 단계를 바꿔요.
 * 키가 없거나 실패하면 하루 두 번 업데이트된 가격 그대로.
 */
type State = { at: string | null; src?: string; ver: number };
let cur: State = { at: null, ver: 0 };
const subs = new Set<(s: State) => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let off = false;

function apply(quotes: Record<string, { last: number; d1: number }>) {
  for (const e of ETFS) {
    const l = quotes[e.id];
    if (!l || !(l.last > 0)) continue;
    const q = e.q;
    q.last = l.last; q.d1 = l.d1;
    if (l.last > q.hi) q.hi = l.last;
    q.dd = Math.round((l.last / q.hi - 1) * 1000) / 10;
    e.kind = kindOf(q);
  }
  for (const f of FX) {
    const l = quotes['fx:' + f.id];
    if (!l || !(l.last > 0) || !f.q) continue;
    f.q.last = l.last; f.q.d1 = l.d1;
    if (l.last > f.q.hi) f.q.hi = l.last;
    f.q.dd = Math.round((l.last / f.q.hi - 1) * 1000) / 10;
  }
}

async function tick() {
  if (off || (typeof document !== 'undefined' && document.hidden)) return;
  try {
    const r = await fetch('/api/live/', { cache: 'no-store' });
    const j = await r.json();
    if (!j.ok) { if (j.reason === 'no-key') { off = true; if (timer) clearInterval(timer); } return; }
    apply(j.quotes);
    cur = { at: j.at, src: j.src, ver: cur.ver + 1 };
    subs.forEach((f) => f(cur));
  } catch { /* 다음에 다시 */ }
}

export function useLive() {
  const [s, setS] = useState(cur);
  useEffect(() => {
    subs.add(setS);
    if (!timer && !off) { tick(); timer = setInterval(tick, 20_000); }
    else setS(cur);
    return () => { subs.delete(setS); };
  }, []);
  return s;
}

export const liveTime = (at: string | null) => {
  if (!at) return null;
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
