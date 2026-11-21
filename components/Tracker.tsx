'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLang } from './Lang';

type Ev = { t: 'pv'; p: string } | { t: 'tm'; p: string; s: number } | { t: 'sec'; k: string; s: number };

/** 익명 방문 기록: 페이지 조회·머문 시간(화면을 보고 있을 때만)·홈 섹션별 본 시간. 개인정보는 안 보내요. */
export default function Tracker() {
  const path = usePathname() ?? '/';
  const lang = useLang();
  const st = useRef({ path: '', start: 0, acc: 0, q: [] as Ev[], sec: new Map<string, { since: number; acc: number }>() });

  useEffect(() => {
    if (/^\/admin/.test(path)) return;
    const s = st.current;
    let vid = '';
    try { vid = localStorage.getItem('jvid') ?? ''; if (!vid) { vid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('jvid', vid); } } catch { /* 저장 안 되면 빈 값 */ }
    const src = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ? 'app' : 'web';
    const visible = () => document.visibilityState === 'visible';

    const flush = () => {
      if (!s.q.length) return;
      const body = JSON.stringify({ vid, src, lang, ev: s.q.splice(0) });
      if (!navigator.sendBeacon?.('/api/t/', body)) fetch('/api/t/', { method: 'POST', body, keepalive: true }).catch(() => {});
    };
    const pauseAll = () => {
      const now = Date.now();
      if (s.start) { s.acc += now - s.start; s.start = 0; }
      s.sec.forEach((v) => { if (v.since) { v.acc += now - v.since; v.since = 0; } });
    };
    const closePage = () => {
      pauseAll();
      if (s.path && s.acc > 1000) s.q.push({ t: 'tm', p: s.path, s: s.acc / 1000 });
      s.sec.forEach((v, k) => { if (v.acc > 1000) s.q.push({ t: 'sec', k, s: v.acc / 1000 }); });
      s.acc = 0; s.sec.clear();
    };

    // 새 페이지 시작
    s.path = path; s.acc = 0; s.start = visible() ? Date.now() : 0;
    s.q.push({ t: 'pv', p: path });
    flush();

    // 홈 등에서 [data-track] 섹션이 화면에 반 이상 보이는 시간
    const io = new IntersectionObserver((ents) => {
      const now = Date.now();
      for (const e of ents) {
        const k = (e.target as HTMLElement).dataset.track!;
        const v = s.sec.get(k) ?? { since: 0, acc: 0 };
        if (e.isIntersecting && visible()) { if (!v.since) v.since = now; }
        else if (v.since) { v.acc += now - v.since; v.since = 0; }
        s.sec.set(k, v);
      }
    }, { threshold: 0.5 });
    const scan = () => document.querySelectorAll<HTMLElement>('[data-track]').forEach((el) => io.observe(el));
    const t1 = setTimeout(scan, 600); const t2 = setTimeout(scan, 2500);

    const onVis = () => {
      if (visible()) { s.start = Date.now(); s.sec.clear(); io.disconnect(); scan(); }
      else { closePage(); flush(); }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onVis);
    return () => {
      clearTimeout(t1); clearTimeout(t2); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onVis);
      closePage(); flush();
    };
  }, [path, lang]);
  return null;
}
