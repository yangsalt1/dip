import Link from 'next/link';
import Rich from '@/components/Rich';
import { etfTitle } from '@/lib/format';
import { notFound } from 'next/navigation';
import Chart from '@/components/Chart';
import { BottomNav, Back, StatusChip, Arrow, Sticker } from '@/components/ui';
import { briefFor, ETFS, FX_RATE, etfById } from '@/lib/data';
import { pct, priceText, tempLabel } from '@/lib/format';
import { stickerStyle } from '@/lib/sticker';
import { JupButton } from '@/components/Jup';
import LivePrice from '@/components/LivePrice';
import LiveStamp from '@/components/LiveStamp';
import { getLang } from '@/lib/i18n-server';
import { tf } from '@/lib/i18n';

export const dynamicParams = false;

export function generateStaticParams() {
  return ETFS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = etfById(id);
  const lang = await getLang();
  const b = lang === 'en' ? 'DIP' : 'JUP';
  return { title: e ? `${b} · ${etfTitle(e, lang)} ${tf(e, 'kw', lang)}` : b };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = etfById(id);
  if (!e) notFound();
  const lang = await getLang();
  const en = lang === 'en';
  const t = (ko: string, e: string) => (en ? e : ko);
  const title = etfTitle(e, lang);
  const q = e.q;
  const native = e.market === 'us' ? 'usd' : 'krw';
  const other = native === 'usd' ? 'krw' : 'usd';
  const hiText = native === 'usd' ? '$' + q.hi.toFixed(2) : Math.round(q.hi).toLocaleString('ko-KR') + t('원', ' KRW');
  const f = q.factors;
  const chips: [string, boolean][] = [];
  if (f.sale >= 0.5) chips.push([t('세일 많이 함', 'Deep discount'), true]);
  if (f.overheat >= 0.3) chips.push([t('많이 식었음', 'Cooled off a lot'), true]);
  if (f.overheat <= -0.3) chips.push([t('좀 뜨거움', 'A bit hot'), false]);
  chips.push(f.trend >= 0 ? [t('추세 살아있음', 'Trend intact'), true] : [t('추세 꺾임', 'Trend broken'), false]);
  if (f.volatility <= -0.3) chips.push([t('많이 출렁임', 'Very bumpy'), false]);
  const insights = (briefFor(lang).insights as Record<string, string[][]>)[e.sector] ?? [];

  return (
    <main className="app">
      <header style={{ padding: '28px 24px 0' }}>
        <Back href="/etf/" label={t('ETF 목록으로', 'Back to ETFs')} />
        <h1 className="title" style={e.market === 'kr' ? { wordBreak: 'keep-all' } : undefined}>{title}<br /><span>{tf(e, 'kw', lang)}</span></h1>
        <p className="diffTag" style={{ marginTop: 10 }}>{tf(e, 'diff', lang)}</p>
        {e.market === 'us' && <p className="meta" style={{ margin: '8px 0 0' }}>{e.name}</p>}
      </header>

      <div className="stack">
        <section className="card" style={{ background: '#B1A6FF' }}>
          <LivePrice id={e.id} />
</section>

        <section className="card" aria-label={t('1년 차트', '1-year chart')} style={{ background: '#F7F7F5', padding: '20px 14px 48px' }}>
          <div className="row" style={{ padding: '0 8px' }}><span className="label">{t('1년 차트', '1-year chart')}</span><span className="meta">{t('주간 종가', 'Weekly close')}</span></div>
          <Chart en={en} points={q.chart.points} start={q.chart.start} label={en ? `${title} 1-year weekly chart. High ${hiText}, now ${priceText(e, native, lang)}` : `${title} 1년 주간 종가 차트. 최고가 ${hiText}, 지금 ${priceText(e, native)}`} />
        </section>

        <section className="card dark" style={{ gap: 14 }}>
          <div className="row"><span className="label">{t('매수·매도 온도', 'Buy / sell temperature')}</span><span className="chip" style={{ background: '#F2F28E', color: '#111' }}>{tempLabel(q.buy, lang)}</span></div>
          <div className="rowEnd"><span style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.05em' }}>{t('매수', 'Buy')} {q.buy}</span><span style={{ fontSize: 20, fontWeight: 600, color: '#BDBDBA' }}>{t('매도', 'Sell')} {100 - q.buy}</span></div>
          <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden' }}><div style={{ width: `${q.buy}%`, background: '#F06C3C' }} /><div style={{ width: `${100 - q.buy}%`, background: '#6E8FE0' }} /></div>
          <div className="pills" style={{ gap: 6 }}>
            {chips.map(([c, good]) => <span key={c} className="chip" style={{ background: '#2A2A2A', color: '#F4F4F2' }}>{c} {good ? '+' : '−'}</span>)}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#A8A8A4' }}>{t('점수 엔진 v0.1', 'Score engine v0.1')} · RSI {q.rsi} · {t('투자 권유 아님', 'Not investment advice')}</span>
        </section>

        <section className="card" style={{ background: '#D8D0C4', gap: 8 }}>
          <span className="label">{t('이게 뭐야?', 'What is it?')}</span>
          {(() => { const pts = (en ? e.pointsEn : null) ?? (e as { points?: string[] }).points; return pts
            ? <ul className="aboutList">{pts.map((p, i) => <li key={i}><Rich t={p} /></li>)}</ul>
            : <p style={{ margin: 0, fontSize: 18, lineHeight: 1.45, fontWeight: 700, letterSpacing: '-0.03em' }}>{tf(e, 'about', lang)}</p>; })()}
        </section>

        {insights.length > 0 && (
          <section className="card" aria-label={t('미국 투자자들은', 'What investors are doing')} style={{ background: '#F2F28E', gap: 14 }}>
            <span className="label">{en ? 'What are investors doing?' : e.market === 'us' ? '미국 투자자들은 지금?' : '투자자들은 지금?'}</span>
            {insights.map(([h, b, src], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span className="num" style={{ width: 30, height: 30, fontSize: 13, borderColor: 'rgba(17,17,17,0.25)' }}>{i + 1}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b style={{ fontSize: 17, letterSpacing: '-0.03em' }}>{h}</b><span className="small" style={{ color: '#3D3D1A' }}>{b} · {src}</span></span>
              </div>
            ))}
          </section>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 16px 0' }}>
        <JupButton id={e.id} />
        <Link href="/money/" className="cta light" style={{ border: '1.5px solid #C4C4C0' }}>{t('포트폴리오 짜보기', 'Build a portfolio')}<Arrow color="#111" /></Link>
        <p className="small" style={{ margin: '0 8px', fontSize: 12, color: '#5A5A58' }}>{en ? `A sale can still fall further. Buy in pieces, not all at once. Price: ${q.date} close. The final call is yours.` : `세일이어도 더 떨어질 수 있어요. 한 번에 말고 나눠서. 가격: Yahoo Finance ${q.date} 종가. 최종 판단은 본인이 해요.`}</p>
      </div>
      <LiveStamp market={e.market} />
      <BottomNav active="etf" />
    </main>
  );
}
