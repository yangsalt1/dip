import { BottomNav, Back } from '@/components/ui';
import { BRIEF, FX } from '@/lib/data';
import { pct } from '@/lib/format';

export const metadata = { title: 'JUP · 환율 세일' };
const BG = ['#F06C3C', '#B1A6FF', '#F2F28E'];
const CARE = BRIEF.fxCare as Record<string, string>;

export default function Page() {
  return (
    <main className="app">
      <header style={{ padding: '28px 24px 0' }}>
        <Back href="/" label="뉴스로" />
        <h1 className="title">환율 세일<br /><span>지금 사? 말아?</span></h1>
        <p className="small" style={{ margin: '12px 0 0', fontSize: 14, color: '#3D3D3B' }}>달러·엔·유로가 지난 1년 중 가장 쌀 때와 가까워요. 원화가 힘이 세졌다는 뜻이에요.</p>
      </header>

      <div className="stack">
        {FX.map((f, i) => {
          const q = f.q;
          const lo = q.lo ?? Math.min(...q.chart.points);
          const avg = q.avg ?? q.chart.points.reduce((a, b) => a + b, 0) / q.chart.points.length;
          const p = Math.max(0, Math.min(1, (q.last - lo) / (q.hi - lo)));
          const verdict = p < 0.25 ? '사도 괜츈' : p < 0.75 ? '사도 낫배드' : '비싸게 사는 편';
          const w = (v: number) => Math.round(v * f.mult).toLocaleString('ko-KR') + '원';
          const gap = Math.round((avg - q.last) * f.mult);
          const good = (p < 0.02 ? '지난 1년 중 가장 싸요. ' : p < 0.25 ? '1년 최저와 가까워요. ' : '') +
            (gap > 0 ? `1년 평균(${w(avg)})보다 ${gap.toLocaleString('ko-KR')}원 싸요.` : `1년 평균(${w(avg)})보다 비싸요.`);
          return (
            <section key={f.id} className="card" style={{ background: BG[i], gap: 16 }}>
              <div className="row"><b style={{ fontSize: 18 }}>{f.name}</b><span className={`chip ${q.dd <= -10 ? 'mega' : q.dd <= -3 ? 'sale' : 'up'}`}>{q.dd <= -10 ? '특급세일 진행중' : q.dd <= -3 ? '일반 세일' : '상승 중~!!'}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="line sale">1년 최고보다 {Math.abs(q.dd).toFixed(1)}% 할인 중</span>
                <span className="big" style={{ fontSize: 52 }}>{w(q.last)}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }} className="soft">{f.unit} · 오늘 {pct(q.d1)} · 이번 주 {pct(q.wk)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'rgba(17,17,17,0.15)' }} aria-hidden="true">
                  <div style={{ position: 'absolute', top: -5, left: `${p * 100}%`, transform: `translateX(-${p * 100}%)`, width: 20, height: 20, borderRadius: '50%', background: '#111', border: '3px solid #fff' }} />
                </div>
                <div className="row" style={{ fontSize: 12, fontWeight: 700 }}><span>1년 최저 {w(lo)}</span><span>최고 {w(q.hi)}</span></div>
              </div>
              <div className="box" style={{ background: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
                <div className="row"><b style={{ fontSize: 14 }}>지금 사면?</b><span className="chip" style={{ background: '#F2F28E', border: '1.5px solid #111' }}>{verdict}</span></div>
                <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>{good}</span>
                <span className="small" style={{ fontSize: 14, color: '#3D3D3B' }}>조심! {CARE[f.id]}</span>
              </div>
            </section>
          );
        })}
      </div>

      <section className="card dark" style={{ margin: '16px 12px 0', paddingBottom: 22 }}>
        <span className="label">ETF 할 때 왜 중요해?</span>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.55 }}>달러가 싸면 VOO 같은 미국 상장 ETF를 같은 돈으로 더 많이 살 수 있어요. 대신 TIGER 미국S&amp;P500 같은 원화 ETF는 달러가 내려가는 만큼 수익이 조금 깎여요.</p>
      </section>
      <p className="note">환율: Yahoo Finance, 최고·최저는 최근 1년. &quot;지금 사면?&quot;은 1년 범위 안 위치로 정한 참고 의견이고, 더 싸질 수도 있어요. 한 번에 말고 나눠서 바꾸세요.</p>
      <BottomNav active="news" />
    </main>
  );
}
