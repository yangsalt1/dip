'use client';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { refreshJup, useJup } from '@/lib/useJup';

const BTN = [
  { id: 'kakao', label: '카카오로 시작하기', cls: 'kakao' },
  { id: 'naver', label: '네이버로 시작하기', cls: 'naver' },
  { id: 'google', label: '구글로 시작하기', cls: 'google' },
];
const FREE = ['/login', '/privacy']; // 로그인 없이 볼 수 있는 곳

/**
 * 로그인 필수: 로그인 안 했으면 어느 화면이든 이 시트가 덮어요 (닫기 없음).
 * 단, 로그인 키가 하나도 없을 때(설정 전)는 사이트가 잠기지 않게 안 띄워요.
 */
export default function LoginSheet() {
  const s = useJup();
  const path = usePathname() ?? '/';
  const [on, setOn] = useState<string[] | null>(null);
  // 페이지를 옮기면 로그인 상태를 다시 확인 (방금 로그인했을 수 있어서)
  useEffect(() => { if (s.status === 'out') refreshJup(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (s.status !== 'out') return;
    fetch('/api/auth/providers/').then((r) => r.json()).then((j) => setOn(Object.keys(j ?? {}).filter((k) => ['kakao', 'naver', 'google'].includes(k) && !(k === 'google' && navigator.userAgent.includes('JUPApp'))))).catch(() => setOn([]));
  }, [s.status]);
  useEffect(() => {
    const lock = s.status === 'out' && !!on?.length && !FREE.some((f) => path.startsWith(f));
    document.documentElement.style.overflow = lock ? 'hidden' : '';
  }, [s.status, on, path]);
  if (s.status !== 'out' || !on?.length || FREE.some((f) => path.startsWith(f))) return null;
  return (
    <div className="lsWrap" role="dialog" aria-modal="true" aria-labelledby="lsTitle">
      <div className="lsBg" aria-hidden="true" />
      <div className="lsSheet">
        <span className="lsGrab" aria-hidden="true" />
        <div className="lsLogo" aria-hidden="true"><i style={{ background: '#B1A6FF' }} /><i style={{ background: '#F06C3C' }}><b>JUP</b></i><i style={{ background: '#F2F28E' }} /></div>
        <span className="lsTag">JUP · 떨어지면 줍는다</span>
        <h2 id="lsTitle" className="lsTitle">특급 세일 주식,<br />절대 안 놓칠 거야.</h2>
        <p className="lsSub">떨어질 때 주울 용기</p>
        <div className="loginBtns">
          {BTN.map((b) => {
            const ready = on.includes(b.id);
            return (
              <button key={b.id} type="button" className={`loginBtn ${b.cls}`} disabled={!ready} onClick={() => signIn(b.id, { redirectTo: path })}>
                <span>{b.label}</span>{!ready && <small>준비 중</small>}
              </button>
            );
          })}
        </div>
        <a className="lsLater" href="/privacy/">개인정보처리방침</a>
      </div>
    </div>
  );
}
