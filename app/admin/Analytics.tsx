import { analyticsReady, readDays, type DayStats } from '@/lib/analytics';
import { ETFS } from '@/lib/data';

const SEC: Record<string, string> = {
  banner: '검은 배너 (오늘 한 줄·공포지수)', news: '오늘 뉴스 3개', news1: '뉴스 1 (무슨 일?)', news2: '뉴스 2 (그래서?)', news3: '뉴스 3 (나는?)',
  fx: '환율', bounce: '반등리스트', mega: '특급세일 리스트', fear: '공포지수 졸라맨 카드', calm: '올랐을 땐 평정심', mylist: '내 줍줍리스트',
};
function pageName(p: string) {
  if (p === '/') return '오늘 (홈)';
  const m = p.match(/^\/etf\/([^/]+)\/$/);
  if (m) { const e = ETFS.find((x) => x.id === m[1]); return `ETF 상세 · ${e ? (e.market === 'us' ? e.code : e.name) : m[1]}`; }
  const M: Record<string, string> = { '/etf/': 'ETF 목록', '/money/': '포트폴리오', '/house/': '청약', '/jup/': '줍줍리스트', '/fx/': '환율', '/login/': '로그인', '/privacy/': '개인정보' };
  if (M[p]) return M[p];
  if (p.startsWith('/house/')) return '청약 상세';
  if (p.startsWith('/story/')) return '뉴스 스토리';
  return p;
}
const fmt = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)}시간` : s >= 60 ? `${Math.round(s / 60)}분` : `${Math.round(s)}초`);
const sum = (rs: Record<string, number>[]) => rs.reduce<Record<string, number>>((a, r) => { for (const [k, v] of Object.entries(r)) a[k] = (a[k] ?? 0) + v; return a; }, {});

export default async function Analytics() {
  if (!analyticsReady) return <p className="small">저장소가 연결돼야 방문 분석이 쌓여요.</p>;
  const days: DayStats[] = await readDays(7);
  const today = days[0];
  const views = sum(days.map((d) => d.views)), time = sum(days.map((d) => d.time));
  const sec = sum(days.map((d) => d.sec)), secn = sum(days.map((d) => d.secn));
  const src = sum(days.map((d) => d.src)), lang = sum(days.map((d) => d.lang));
  const totalViews = Object.values(views).reduce((a, b) => a + b, 0);
  const totalTime = Object.values(time).reduce((a, b) => a + b, 0);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  // 같은 이름(ETF 상세 여러 개는 따로) 페이지 묶기
  const rows = Object.keys({ ...views, ...time }).map((p) => ({ p, name: pageName(p), v: views[p] ?? 0, t: time[p] ?? 0 }))
    .sort((a, b) => b.t - a.t || b.v - a.v).slice(0, 25);
  const maxT = Math.max(1, ...rows.map((r) => r.t));
  const secRows = Object.keys(sec).map((k) => ({ k, name: SEC[k] ?? k, t: sec[k], n: secn[k] ?? 0 })).sort((a, b) => b.t - a.t);
  const maxS = Math.max(1, ...secRows.map((r) => r.t));
  const maxUv = Math.max(1, ...days.map((d) => d.uv));
  const empty = totalViews === 0;

  return (
    <section className="anl">
      <h2 className="anlH">방문 분석 <small>최근 7일 · 한국시간 · 익명</small></h2>
      {empty && <p className="small">아직 쌓인 기록이 없어요. 지금부터 방문이 생기면 여기에 보여요.</p>}
      <div className="admStats">
        <div><b>{today?.uv ?? 0}</b><span>오늘 방문자</span></div>
        <div><b>{today ? Object.values(today.views).reduce((a, b) => a + b, 0) : 0}</b><span>오늘 페이지 조회</span></div>
        <div><b>{totalViews}</b><span>7일 페이지 조회</span></div>
        <div><b>{totalViews ? fmt(totalTime / totalViews) : '-'}</b><span>페이지당 평균 머문 시간</span></div>
        <div><b>{pct(src.app ?? 0, (src.app ?? 0) + (src.web ?? 0))}%</b><span>앱으로 본 비율</span></div>
        <div><b>{pct(lang.en ?? 0, (lang.en ?? 0) + (lang.ko ?? 0))}%</b><span>영어(DIP)로 본 비율</span></div>
      </div>

      <div className="anlBox">
        <b>날짜별 방문자</b>
        <div className="anlDays">
          {[...days].reverse().map((d) => (
            <div key={d.day}><i style={{ height: `${Math.max(4, (d.uv / maxUv) * 100)}%` }} /><b>{d.uv}</b><span>{d.day.slice(5).replace('-', '/')}</span></div>
          ))}
        </div>
      </div>

      <div className="anlBox">
        <b>어디서 가장 오래 보나 · 페이지</b>
        <div className="anlRow head"><span>페이지</span><span>조회</span><span>총 머문 시간</span><span>1번 볼 때 평균</span></div>
        {rows.map((r) => (
          <div key={r.p} className="anlRow">
            <span><em style={{ width: `${(r.t / maxT) * 100}%` }} />{r.name}</span>
            <span>{r.v}</span><span>{fmt(r.t)}</span><span>{r.v ? fmt(r.t / r.v) : '-'}</span>
          </div>
        ))}
      </div>

      <div className="anlBox">
        <b>홈 화면에서 어디를 오래 보나 · 섹션</b>
        <div className="anlRow head"><span>섹션</span><span>본 횟수</span><span>총 본 시간</span><span>1번 볼 때 평균</span></div>
        {secRows.map((r) => (
          <div key={r.k} className="anlRow">
            <span><em style={{ width: `${(r.t / maxS) * 100}%` }} />{r.name}</span>
            <span>{r.n}</span><span>{fmt(r.t)}</span><span>{r.n ? fmt(r.t / r.n) : '-'}</span>
          </div>
        ))}
        {!secRows.length && <p className="small" style={{ margin: 0 }}>아직 기록 없음</p>}
        <p className="small" style={{ margin: 0, color: '#6B6B69' }}>섹션이 화면에 반 이상 보이고, 앱·탭이 켜져 있을 때만 시간을 재요.</p>
      </div>
    </section>
  );
}
