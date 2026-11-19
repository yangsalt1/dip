import Link from 'next/link';
import { BottomNav } from '@/components/ui';

export const metadata = { title: 'JUP · 개인정보처리방침' };

// 운영자 연락처: 실제 받는 이메일로 바꿔주세요
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '(운영자 이메일)';

const S: [string, React.ReactNode][] = [
  ['1. 모으는 정보', <>로그인할 때 고른 서비스(구글·네이버·카카오)에서 <b>회원번호</b>, <b>이름(닉네임)</b>, <b>이메일</b>(제공에 동의한 경우)을 받아요. 그리고 직접 담은 <b>줍줍리스트(ETF 목록)</b>와, 내 주식 분석을 쓰면 캡처에서 읽은 <b>종목 이름·비중</b>을 저장해요. 비밀번호·계좌번호·금액은 저장하지 않아요.</>],
  ['2. 쓰는 곳', <>로그인 유지, 줍줍리스트·포트폴리오 분석 저장과 보여주기에만 써요. 광고나 마케팅에는 쓰지 않아요.</>],
  ['3. 보관 기간', <>로그인은 최대 90일 유지돼요. 줍줍리스트는 직접 지우거나 탈퇴할 때까지 보관하고, 요청하면 바로 지워요. 줍줍 화면의 <b>‘내 정보 지우기’</b>로 언제든 직접 지울 수 있어요.</>],
  ['4. 다른 곳에 주는 경우', <>제3자에게 제공하지 않아요. 다만 서비스 운영을 위해 아래 회사의 서버를 써요(국외 보관).<br />· Vercel Inc.(미국): 웹사이트 운영, 로그인 처리<br />· Upstash Inc.(미국 등): 줍줍리스트·분석 결과 저장<br />· Anthropic PBC(미국): 올린 캡처에서 종목 읽기 (사진은 분석에만 쓰고 저장하지 않아요)<br />저장되는 건 회원번호, 담은 ETF 목록, 종목 이름·비중뿐이고, 이름·이메일은 내 브라우저의 로그인 쿠키에만 담겨요.</>],
  ['5. 내 권리', <>내 정보를 보거나, 고치거나, 지우거나, 처리를 멈춰달라고 언제든 요청할 수 있어요. 로그인 연결은 각 서비스(구글·네이버·카카오)의 계정 설정에서도 끊을 수 있어요.</>],
  ['6. 쿠키', <>로그인 상태를 기억하려고 쿠키를 써요. 브라우저 설정에서 끌 수 있지만, 끄면 로그인이 안 돼요.</>],
  ['7. 문의', <>개인정보 보호 책임자: JUP 운영자 · {CONTACT}</>],
];

export default function Privacy() {
  return (
    <main className="app">
      <header className="hdr">
        <div>
          <Link href="/" className="brand">JUP<small>떨어질 때 줍는다</small></Link>
          <h1 className="title">개인정보<br /><span>처리방침</span></h1>
        </div>
      </header>
      <div className="stack keep">
        {S.map(([t, b]) => (
          <section key={t} className="card" style={{ background: '#F7F7F5', gap: 8 }}>
            <b style={{ fontSize: 18, letterSpacing: '-0.03em' }}>{t}</b>
            <p className="small" style={{ margin: 0, lineHeight: 1.6 }}>{b}</p>
          </section>
        ))}
        <p className="small" style={{ margin: '0 8px', color: '#5A5A58' }}>시행일: 2026년 11월 19일</p>
      </div>
      <BottomNav active="money" />
    </main>
  );
}
