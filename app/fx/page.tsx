import { BottomNav, Back } from '@/components/ui';
import { briefFor, FX } from '@/lib/data';
import { getLang } from '@/lib/i18n-server';
import { fxShort } from '@/lib/fx';
import { pct } from '@/lib/format';

export async function generateMetadata() { return { title: (await getLang()) === 'en' ? 'DIP · FX on sale' : 'JUP · 환율 세일' }; }
const BG = ['#F06C3C', '#B1A6FF', '#F2F28E'];

export default async function Page() {
  const lang = await getLang();
  const en = lang === 'en';
  const t = (ko: string, e: string) => (en ? e : ko);
  const CARE = briefFor(lang).fxCare as Record<string, string>;
  return (
    <main className="app">
      <header style={{ padding: '28px 24px 0' }}>
        <Back href="/" label={t('뉴스로', 'Back to news')} />
        <h1 className="title">{t('환율 세일', 'FX on sale')}<br /><span>{t('지금 사? 말아?', 'Buy now or wait?')}</span></h1>
        <p className="small" style={{ margin: '12px 0 0', fontSize: 14, color: '#3D3D3B' }}>{t('달러·엔·유로가 지난 1년 중 가장 쌀 때와 가까워요. 원화가 힘이 세졌다는 뜻이에요.', 'The dollar, yen and euro are near their cheapest in a year (vs the Korean won). The won has gotten stronger.')}</p>
      </header>

      <div className="stack">
        {FX.map((f, i) => {
          const q = f.q;
          const lo = q.lo ?? Math.min(...q.chart.points);
          const avg = q.avg ?? q.chart.points.reduce((a, b) => a + b, 0) / q.chart.points.length;
          const p = Math.max(0, Math.min(1, (q.last - lo) / (q.hi - lo)));
          const verdict = en ? (p < 0.25 ? 'Good time to buy' : p < 0.75 ? 'Not bad' : 'On the pricey side') : p < 0.25 ? '사도 괜츈' : p < 0.75 ? '사도 낫배드' : '비싸게 사는 편';
          const w = (v: number) => en ? `₩${Math.round(v * f.mult).toLocaleString('en-US')}` : Math.round(v * f.mult).toLocaleString('ko-KR') + '원';
          const gap = Math.round((avg - q.last) * f.mult);
          const good = en
            ? (p < 0.02 ? 'Cheapest in a year. ' : p < 0.25 ? 'Close to the 1-year low. ' : '') + (gap > 0 ? `₩${gap.toLocaleString('en-US')} cheaper than the 1-year average (${w(avg)}).` : `Pricier than the 1-year average (${w(avg)}).`)
            : (p < 0.02 ? '지난 1년 중 가장 싸요. ' : p < 0.25 ? '1년 최저와 가까워요. ' : '') +
            (gap > 0 ? `1년 평균(${w(avg)})보다 ${gap.toLocaleString('ko-KR')}원 싸요.` : `1년 평균(${w(avg)})보다 비싸요.`);
          return (
            <section key={f.id} className="card" style={{ background: BG[i], gap: 16 }}>
              <div className="row"><b style={{ fontSize: 18 }}>{en ? fxShort(f, 'en') : f.name}</b><span className={`chip ${q.dd <= -10 ? 'mega' : q.dd <= -3 ? 'sale' : 'up'}`}>{q.dd <= -10 ? t('특급세일 진행중', 'Mega sale on') : q.dd <= -3 ? t('일반 세일', 'On sale') : t('상승 중~!!', 'Climbing~!!')}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="line sale">{en ? `${Math.abs(q.dd).toFixed(1)}% off the 1-year high` : `1년 최고보다 ${Math.abs(q.dd).toFixed(1)}% 할인 중`}</span>
                <span className="big" style={{ fontSize: 52 }}>{w(q.last)}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }} className="soft">{en ? `${f.mult} ${fxShort(f, 'en')}` : f.unit} · {t('오늘', 'Today')} {pct(q.d1)} · {t('이번 주', 'This week')} {pct(q.wk)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'rgba(17,17,17,0.15)' }} aria-hidden="true">
                  <div style={{ position: 'absolute', top: -5, left: `${p * 100}%`, transform: `translateX(-${p * 100}%)`, width: 20, height: 20, borderRadius: '50%', background: '#111', border: '3px solid #fff' }} />
                </div>
                <div className="row" style={{ fontSize: 12, fontWeight: 700 }}><span>{t('1년 최저', '1y low')} {w(lo)}</span><span>{t('최고', 'High')} {w(q.hi)}</span></div>
              </div>
              <div className="box" style={{ background: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
                <div className="row"><b style={{ fontSize: 14 }}>{t('지금 사면?', 'Buy now?')}</b><span className="chip" style={{ background: '#F2F28E', border: '1.5px solid #111' }}>{verdict}</span></div>
                <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>{good}</span>
                <span className="small" style={{ fontSize: 14, color: '#3D3D3B' }}>{t('조심!', 'Careful!')} {CARE[f.id]}</span>
              </div>
            </section>
          );
        })}
      </div>

      <section className="card dark" style={{ margin: '16px 12px 0', paddingBottom: 22 }}>
        <span className="label">{t('ETF 할 때 왜 중요해?', 'Why does it matter for ETFs?')}</span>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.55 }}>{t('달러가 싸면 VOO 같은 미국 상장 ETF를 같은 돈으로 더 많이 살 수 있어요. 대신 TIGER 미국S&P500 같은 원화 ETF는 달러가 내려가는 만큼 수익이 조금 깎여요.', 'When the dollar is cheap, the same won buys more of US-listed ETFs like VOO. But won-based ETFs like TIGER US S&P500 lose a bit of return as the dollar falls.')}</p>
      </section>
      <p className="note">{t('환율: Yahoo Finance, 최고·최저는 최근 1년. "지금 사면?"은 1년 범위 안 위치로 정한 참고 의견이고, 더 싸질 수도 있어요. 한 번에 말고 나눠서 바꾸세요.', 'FX: Yahoo Finance; high and low are for the past year. "Buy now?" is a reference based on where it sits in the 1-year range, and it could get cheaper. Exchange in pieces, not all at once.')}</p>
      <BottomNav active="news" />
    </main>
  );
}
