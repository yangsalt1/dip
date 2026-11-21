import Link from 'next/link';
import { auth } from '@/auth';
import { allUsers, storeReady, userStats } from '@/lib/store';
import Analytics from './Analytics';
import HouseAnalytics from './HouseAnalytics';

export const metadata = { title: 'JUP · 관리자', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** 관리자: Vercel 환경변수 ADMIN_IDS 에 적힌 회원번호만 볼 수 있어요 (쉼표로 여러 명). */
// 기본 관리자(운영자 카카오 계정) + Vercel 환경변수 ADMIN_IDS 로 추가 가능
const ADMINS = ['kakao:5195172894', ...(process.env.ADMIN_IDS ?? '').split(',')].map((x) => x.trim()).filter(Boolean);
const PROV: Record<string, string> = { kakao: '카카오', naver: '네이버', google: '구글', dev: '테스트' };
const d = (iso: string) => { const t = new Date(iso); return `${t.getMonth() + 1}.${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`; };

export default async function Admin() {
  const s = await auth().catch(() => null);
  const uid = (s?.user as { id?: string } | undefined)?.id;
  if (!uid) {
    return <main className="app"><div className="adm"><h1 className="title">관리자</h1><p>먼저 로그인해 주세요. <Link href="/login/?next=/admin/">로그인 →</Link></p></div></main>;
  }
  if (!ADMINS.includes(uid)) {
    return (
      <main className="app"><div className="adm">
        <h1 className="title">관리자<br /><span>등록이 필요해요</span></h1>
        <p>내 회원번호는 <code>{uid}</code> 예요.</p>
        <p className="small">Vercel → Settings → Environment Variables 에 <code>ADMIN_IDS</code> = <code>{uid}</code> 를 넣고 Redeploy 하면 이 페이지에서 회원 목록이 보여요.</p>
      </div></main>
    );
  }
  const users = storeReady ? (await allUsers()).sort((a, b) => b.last.localeCompare(a.last)) : [];
  const stats = await Promise.all(users.map((u) => userStats(u.uid).catch(() => ({ jup: 0, port: false }))));
  const today = new Date().toISOString().slice(0, 10);
  const by = (p: string) => users.filter((u) => u.provider === p).length;
  return (
    <main className="app" style={{ maxWidth: 1100 }}>
      <div className="adm">
        <h1 className="title">관리자<br /><span>회원 {users.length}명</span></h1>
        {!storeReady && <p style={{ color: '#A3200F', fontWeight: 700 }}>저장소(Upstash)가 아직 연결 안 됐어요.</p>}
        <div className="admStats">
          <div><b>{users.length}</b><span>전체 회원</span></div>
          <div><b>{users.filter((u) => u.first.slice(0, 10) === today).length}</b><span>오늘 가입</span></div>
          <div><b>{users.filter((u) => u.last.slice(0, 10) === today).length}</b><span>오늘 들어옴</span></div>
          <div><b>{by('kakao')} · {by('naver')} · {by('google')}</b><span>카카오 · 네이버 · 구글</span></div>
          <div><b>{stats.filter((x) => x.port).length}</b><span>내 주식 분석함</span></div>
        </div>
        <Analytics />
        <HouseAnalytics />
        <h2 className="anlH">회원 목록</h2>
        <div className="admTable" role="table">
          <div className="admRow head" role="row"><span>이름</span><span>이메일</span><span>로그인</span><span>가입</span><span>최근</span><span>줍줍</span><span>분석</span></div>
          {users.map((u, i) => (
            <div key={u.uid} className="admRow" role="row">
              <span><b>{u.name || '(이름 없음)'}</b><small>{u.uid}</small></span>
              <span>{u.email || '-'}</span>
              <span>{PROV[u.provider] ?? u.provider} · {u.logins}회</span>
              <span>{d(u.first)}</span>
              <span>{d(u.last)}</span>
              <span>{stats[i].jup}개</span>
              <span>{stats[i].port ? '✓' : '-'}</span>
            </div>
          ))}
          {!users.length && <p className="small" style={{ padding: 16 }}>아직 회원이 없어요.</p>}
        </div>
        <p className="small" style={{ color: '#6B6B69' }}>회원 정보는 서비스 운영에만 쓰고 밖으로 내보내지 마세요. 탈퇴(내 정보 지우기)하면 여기서도 사라져요.</p>
      </div>
    </main>
  );
}
