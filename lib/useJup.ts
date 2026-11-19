'use client';
import { useEffect, useState } from 'react';

export type JupState = { status: 'loading' | 'out' | 'in'; ids: string[]; name?: string; ready: boolean; error?: string };

// 화면 안의 여러 버튼이 같은 목록을 보도록 한 곳에 모아둬요
let cur: JupState = { status: 'loading', ids: [], ready: true };
const subs = new Set<(s: JupState) => void>();
let started = false;
function set(s: JupState) { cur = s; subs.forEach((f) => f(s)); }

async function load() {
  try {
    const r = await fetch('/api/jup', { cache: 'no-store', credentials: 'same-origin' });
    const j = await r.json();
    set({ status: j.loggedIn ? 'in' : 'out', ids: j.ids ?? [], name: j.name, ready: j.ready !== false });
  } catch {
    set({ status: 'out', ids: [], ready: false, error: '지금은 불러올 수 없어요' });
  }
}

/** 로그인 상태 다시 확인 (화면 이동 뒤 등) */
export function refreshJup() { load(); }

export function goLogin() {
  const next = location.pathname + location.search;
  location.href = '/login/?next=' + encodeURIComponent(next);
}

export async function toggleJup(id: string) {
  if (cur.status !== 'in') { goLogin(); return; }
  const on = cur.ids.includes(id);
  const prev = cur;
  set({ ...cur, ids: on ? cur.ids.filter((x) => x !== id) : [...cur.ids, id], error: undefined });
  try {
    const r = await fetch('/api/jup', { method: on ? 'DELETE' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }), credentials: 'same-origin' });
    const j = await r.json();
    if (!r.ok) { set({ ...prev, error: j.error ?? '저장하지 못했어요' }); return; }
    set({ ...cur, ids: j.ids });
  } catch {
    set({ ...prev, error: '저장하지 못했어요. 잠시 뒤 다시 해봐요' });
  }
}

export function useJup() {
  const [s, setS] = useState(cur);
  useEffect(() => {
    subs.add(setS);
    if (!started) { started = true; load(); } else setS(cur);
    return () => { subs.delete(setS); };
  }, []);
  return s;
}
