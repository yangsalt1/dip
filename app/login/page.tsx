import Link from 'next/link';
import { signIn } from '@/auth';
import { BottomNav } from '@/components/ui';

export const metadata = { title: 'JUP · 시작하기' };
export const dynamic = 'force-dynamic';

const BTN = [
  { id: 'kakao', env: 'AUTH_KAKAO_ID', label: '카카오로 시작하기', cls: 'kakao' },
  { id: 'naver', env: 'AUTH_NAVER_ID', label: '네이버로 시작하기', cls: 'naver' },
  { id: 'google', env: 'AUTH_GOOGLE_ID', label: '구글로 시작하기', cls: 'google' },
] as const;

function Mark({ id }: { id: string }) {
  if (id === 'kakao') return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#191919" d="M12 3.5C6.8 3.5 2.6 6.8 2.6 10.9c0 2.6 1.7 4.9 4.3 6.2l-1.1 4c-.1.3.3.6.6.4l4.7-3.1c.3 0 .6.1.9.1 5.2 0 9.4-3.3 9.4-7.4S17.2 3.5 12 3.5z" /></svg>;
  if (id === 'naver') return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M15.6 12.8 8.1 2H2v20h6.4V11.2L15.9 22H22V2h-6.4z" /></svg>;
  return <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>;
}

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '/jup/';
  const on = BTN.filter((b) => process.env[b.env]);
  const dev = process.env.AUTH_DEV_LOGIN === '1' && !process.env.VERCEL;
  return (
    <main className="app">
      <header className="hdr">
        <div>
          <Link href="/" className="brand">JUP<small>떨어질 때 줍는다</small></Link>
          <h1 className="title">JUP<br /><span>시작하기</span></h1>
        </div>
      </header>
      <div className="stack keep">
        <section className="card" style={{ background: '#F2F28E', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 24, lineHeight: 1.3, fontWeight: 800, letterSpacing: '-0.035em' }}>특급세일 중인 주식,<br />절대 놓치지 않을 거야.</p>
          <p className="small" style={{ margin: 0 }}>진정한 고수는 떨어질 때 줍는 법</p>
        </section>
        {sp.error && <p role="alert" className="small" style={{ margin: '0 8px', color: '#A3200F', fontWeight: 700 }}>로그인하지 못했어요. 다시 한 번 눌러봐요.</p>}
        <div className="loginBtns">
          {BTN.map((b) => {
            const ready = on.some((x) => x.id === b.id);
            return (
              <form key={b.id} action={async () => { 'use server'; await signIn(b.id, { redirectTo: next }); }}>
                <button type="submit" className={`loginBtn ${b.cls}`} disabled={!ready}>
                  <Mark id={b.id} /><span>{b.label}</span>{!ready && <small>준비 중</small>}
                </button>
              </form>
            );
          })}
          {dev && (
            <form action={async () => { 'use server'; await signIn('dev', { redirectTo: next }); }}>
              <button type="submit" className="loginBtn google"><span>테스트 로그인 (로컬 전용)</span></button>
            </form>
          )}
        </div>
        <p className="small" style={{ margin: '0 8px', color: '#5A5A58' }}>
          처음이면 바로 가입돼요. 시작하면 <Link href="/privacy/" style={{ fontWeight: 800 }}>개인정보처리방침</Link>에 동의하는 걸로 봐요.
        </p>
      </div>
      <BottomNav active="money" />
    </main>
  );
}
