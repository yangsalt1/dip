import Link from 'next/link';
import { notFound } from 'next/navigation';
import Chart from '@/components/Chart';
import { BottomNav, Back, StatusChip, Arrow, Sticker } from '@/components/ui';
import { BRIEF, ETFS, FX_RATE, etfById } from '@/lib/data';
import { pct, priceText, tempLabel } from '@/lib/format';
import { stickerStyle } from '@/lib/sticker';
import { JupButton } from '@/components/Jup';
import LivePrice from '@/components/LivePrice';
import LiveStamp from '@/components/LiveStamp';

export const dynamicParams = false;

export function generateStaticParams() {
  return ETFS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = etfById(id);
  return { title: e ? `JUP · ${e.code} ${e.kw}` : 'JUP' };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = etfById(id);
  if (!e) notFound();
  const q = e.q;
  const native = e.market === 'us' ? 'usd' : 'krw';
  const other = native === 'usd' ? 'krw' : 'usd';
  const hiText = native === 'usd' ? '$' + q.hi.toFixed(2) : Math.round(q.hi).toLocaleString('ko-KR') + '원';
  const f = q.factors;
  const chips: [string, boolean][] = [];
  if (f.sale >= 0.5) chips.push(['세일 많이 함', true]);
  if (f.overheat >= 0.3) chips.push(['많이 식었음', true]);
  if (f.overheat <= -0.3) chips.push(['좀 뜨거움', false]);
  chips.push(f.trend >= 0 ? ['추세 살아있음', true] : ['추세 꺾임', false]);
  if (f.volatility <= -0.3) chips.push(['많이 출렁임', false]);
  const insights = (BRIEF.insights as Record<string, string[][]>)[e.sector] ?? [];

  return (
    <main className="app">
      <header style={{ padding: '28px 24px 0' }}>
        <Back href="/etf/" label="ETF 목록으로" />
        <h1 className="title">{e.code}<br /><span>{e.kw}</span></h1>
        <p className="diffTag" style={{ marginTop: 10 }}>{e.diff}</p>
        <p className="meta" style={{ margin: '8px 0 0' }}>{e.name}</p>
      </header>

      <div className="stack">
        <section className="card" style={{ background: '#B1A6FF' }}>
          <LivePrice id={e.id} />
</section>

        <section className="card" aria-label="1년 차트" style={{ background: '#F7F7F5', padding: '20px 14px 48px' }}>
          <div className="row" style={{ padding: '0 8px' }}><span className="label">1년 차트</span><span className="meta">주간 종가</span></div>
          <Chart points={q.chart.points} start={q.chart.start} label={`${e.code} 1년 주간 종가 차트. 최고가 ${hiText}, 지금 ${priceText(e, native)}`} />
        </section>

        <section className="card dark" style={{ gap: 14 }}>
          <div className="row"><span className="label">매수·매도 온도</span><span className="chip" style={{ background: '#F2F28E', color: '#111' }}>{tempLabel(q.buy)}</span></div>
          <div className="rowEnd"><span style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.05em' }}>매수 {q.buy}</span><span style={{ fontSize: 20, fontWeight: 600, color: '#BDBDBA' }}>매도 {100 - q.buy}</span></div>
          <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden' }}><div style={{ width: `${q.buy}%`, background: '#F06C3C' }} /><div style={{ width: `${100 - q.buy}%`, background: '#6E8FE0' }} /></div>
          <div className="pills" style={{ gap: 6 }}>
            {chips.map(([t, good]) => <span key={t} className="chip" style={{ background: '#2A2A2A', color: '#F4F4F2' }}>{t} {good ? '+' : '−'}</span>)}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#A8A8A4' }}>점수 엔진 v0.1 · RSI {q.rsi} · 투자 권유 아님</span>
        </section>

        <section className="card" style={{ background: '#D8D0C4', gap: 8 }}>
          <span className="label">이게 뭐야?</span>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.45, fontWeight: 700, letterSpacing: '-0.03em' }}>{e.about}</p>
        </section>

        {insights.length > 0 && (
          <section className="card" aria-label="미국 투자자들은" style={{ background: '#F2F28E', gap: 14 }}>
            <span className="label">{e.market === 'us' ? '미국 투자자들은 지금?' : '투자자들은 지금?'}</span>
            {insights.map(([t, b, src], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span className="num" style={{ width: 30, height: 30, fontSize: 13, borderColor: 'rgba(17,17,17,0.25)' }}>{i + 1}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b style={{ fontSize: 17, letterSpacing: '-0.03em' }}>{t}</b><span className="small" style={{ color: '#3D3D1A' }}>{b} · {src}</span></span>
              </div>
            ))}
          </section>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 16px 0' }}>
        <JupButton id={e.id} />
        <Link href="/money/" className="cta light" style={{ border: '1.5px solid #C4C4C0' }}>포트폴리오 짜보기<Arrow color="#111" /></Link>
        <p className="small" style={{ margin: '0 8px', fontSize: 12, color: '#5A5A58' }}>세일이어도 더 떨어질 수 있어요. 한 번에 말고 나눠서. 가격: Yahoo Finance {q.date} 종가. 최종 판단은 본인이 해요.</p>
      </div>
      <LiveStamp market={e.market} />
      <BottomNav active="etf" />
    </main>
  );
}
