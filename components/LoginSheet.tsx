'use client';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useJup } from '@/lib/useJup';

const BTN = [
  { id: 'kakao', label: '카카오로 시작하기', cls: 'kakao' },
  { id: 'naver', label: '네이버로 시작하기', cls: 'naver' },
  { id: 'google', label: '구글로 시작하기', cls: 'google' },
];
const LATER = 'jup_login_later';

/** 처음 들어오면 아래에서 올라오는 로그인 시트. '나중에'를 누르면 다시 안 떠요. */
export default function LoginSheet() {
  const s = useJup();
  const [show, setShow] = useState(false);
  const [on, setOn] = useState<string[]>([]);
  useEffect(() => {
    if (s.status !== 'out') { setShow(false); return; }
    let later = false;
    try { later = localStorage.getItem(LATER) === '1'; } catch {}
    if (later) return;
    setShow(true);
    fetch('/api/auth/providers').then((r) => r.json()).then((j) => setOn(Object.keys(j ?? {}))).catch(() => {});
  }, [s.status]);
  if (!show) return null;
  const close = () => { try { localStorage.setItem(LATER, '1'); } catch {} setShow(false); };
  return (
    <div className="lsWrap" role="dialog" aria-modal="true" aria-labelledby="lsTitle">
      <button type="button" className="lsBg" aria-label="닫기" onClick={close} />
      <div className="lsSheet">
        <span className="lsGrab" aria-hidden="true" />
        <div className="lsLogo" aria-hidden="true"><i style={{ background: '#B1A6FF' }} /><i style={{ background: '#F06C3C' }}><b>JUP</b></i><i style={{ background: '#F2F28E' }} /></div>
        <span className="lsTag">JUP · 떨어지면 줍는다</span>
        <h2 id="lsTitle" className="lsTitle">특급세일 중인 주식,<br />절대 놓치지 않을 거야.</h2>
        <p className="lsSub">진정한 고수는 떨어질 때 줍는 법</p>
        <div className="loginBtns">
          {BTN.map((b) => {
            const ready = on.includes(b.id);
            return (
              <button key={b.id} type="button" className={`loginBtn ${b.cls}`} disabled={!ready} onClick={() => signIn(b.id, { redirectTo: '/' })}>
                <span>{b.label}</span>{!ready && <small>준비 중</small>}
              </button>
            );
          })}
        </div>
        <button type="button" className="lsLater" onClick={close}>나중에 할게요 · 그냥 둘러보기</button>
      </div>
    </div>
  );
}
