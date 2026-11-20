import Link from 'next/link';
import { etfTitle } from '@/lib/format';
import { notFound } from 'next/navigation';
import { BottomNav, Back, StatusChip } from '@/components/ui';
import { BRIEF, etfById } from '@/lib/data';
import { pct, priceText } from '@/lib/format';
import Rich from '@/components/Rich';

type Story = (typeof BRIEF.stories)['nvidia-ceo'];
const STORIES = BRIEF.stories as Record<string, Story>;

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(STORIES).map((id) => ({ id }));
}

const color = (v: number) => (v >= 0 ? '#A3200F' : '#1A3FA8');

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = STORIES[id];
  if (!s) notFound();
  return (
    <main className="app story">
      <header style={{ padding: '28px 24px 0' }}>
        <Back href="/" label="뉴스로" />
        <h1 className="title">{s.title}<br /><span>{s.subtitle}</span></h1>
      </header>

      <div className="stack">
        <section className="card" style={{ background: '#B1A6FF', gap: 14 }}>
          <span className="label">무슨 일이 있었냐면</span>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {s.timeline.map(([d, t]) => (
              <li key={d} style={{ display: 'flex', gap: 12 }}><b style={{ flex: 'none', width: 54, fontSize: 14 }}>{d}</b><span className="rich" style={{ fontSize: 17, lineHeight: 1.6 }}><Rich t={t} /></span></li>
            ))}
          </ol>
        </section>

        <section className="card" aria-label="관련주" style={{ background: '#F7F7F5' }}>
          <div className="row"><span className="label">관련주는 지금</span><span className="meta" style={{ fontSize: 12 }}>오늘 · 이번 주</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: '10px 14px', fontSize: 15 }}>
            {s.stocks.map(([n, d, w]) => (
              <div key={n as string} style={{ display: 'contents' }}>
                <b>{n}</b>
                <b style={{ color: color(d as number), textAlign: 'right' }}>{pct(d as number)}</b>
                <b style={{ color: color(w as number), textAlign: 'right' }}>{pct(w as number)}</b>
              </div>
            ))}
          </div>
          <p style={{ margin: '4px 0 0', background: '#ECECEA', fontSize: 15, lineHeight: 1.6 }} className="box rich"><Rich t={s.stocksNote} /></p>
        </section>

        <section className="card" aria-label="ETF" style={{ background: '#D8D0C4' }}>
          <span className="label">ETF는 지금</span>
          {s.etfs.map((id2) => {
            const e = etfById(id2)!;
            return (
              <Link key={id2} href={`/etf/${id2}/`} className="box row" style={{ background: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
                <span style={{ display: 'flex', flexDirection: 'column' }}><b style={{ fontSize: 17 }}>{etfTitle(e)}</b><span style={{ fontSize: 12, fontWeight: 700, color: '#2E2E2C' }}>{e.kw} · {priceText(e, e.market === 'us' ? 'usd' : 'krw')}</span></span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}><StatusChip kind={e.kind} /><b style={{ fontSize: 15, color: '#1A3FA8' }}>최고가보다 {e.q.dd.toFixed(1)}%</b></span>
              </Link>
            );
          })}
          <p className="rich" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}><Rich t={s.etfsNote} /></p>
        </section>

        <section className="card dark" aria-label="사야 할까" style={{ gap: 14 }}>
          <div className="row"><span className="label">그래서 사? 말아?</span><span className="chip" style={{ background: '#F2F28E', color: '#111' }}>지켜보기 · 나눠서</span></div>
          <p style={{ margin: 0, fontSize: 30, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.045em', whiteSpace: 'pre-line' }}>{s.verdict.headline}</p>
          {s.verdict.cases.map(([h, b]) => (
            <div key={h} className="box" style={{ background: '#2A2A2A', display: 'flex', flexDirection: 'column', gap: 4 }}><b style={{ fontSize: 13, color: '#F2F28E' }}>{h}</b><span className="rich dk" style={{ fontSize: 15, lineHeight: 1.6 }}><Rich t={b} /></span></div>
          ))}
          <div className="grid2">
            <div className="box" style={{ background: '#F06C3C', color: '#111', padding: 14 }}><b style={{ fontSize: 12 }}>좋게 보는 쪽</b><p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.55 }} className="rich"><Rich t={s.verdict.bull} /></p></div>
            <div className="box" style={{ background: '#9DB8FF', color: '#111', padding: 14 }}><b style={{ fontSize: 12 }}>걱정하는 쪽</b><p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.55 }} className="rich"><Rich t={s.verdict.bear} /></p></div>
          </div>
        </section>

        <section className="card" aria-label="지켜볼 것" style={{ background: '#F2F28E' }}>
          <span className="label">이것만 지켜봐</span>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {s.watch.map(([t, b], i) => (
              <li key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span className="num" style={{ width: 30, height: 30, fontSize: 13, background: '#111', color: '#F2F28E', border: 0 }}>{i + 1}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b style={{ fontSize: 16 }}>{t}</b><span className="small rich" style={{ color: '#3D3D1A' }}><Rich t={b} /></span></span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <p className="note">{s.sources} 참고용이고 투자 권유가 아니에요.</p>
      <BottomNav active="news" />
    </main>
  );
}
