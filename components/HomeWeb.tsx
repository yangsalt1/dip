'use client';
import { useLang } from './Lang';
import { tf } from '@/lib/i18n';
import { etfTitle } from '@/lib/format';
import { useLive } from '@/lib/live';
import { useState } from 'react';
import Link from 'next/link';
import { briefFor, ETFS, FX, PRICE_DATE, isKnife, isRebound, type Etf } from '@/lib/data';
import { useJup, goLogin } from '@/lib/useJup';
import { fxVerdict, fxShort } from '@/lib/fx';
import { Arrow, BottomNav, HandIcon, Sticker } from './ui';
import NewsCard from './NewsCard';
import Fng from './Fng';
import Overview, { MktToggle } from './Overview';
import { FX_COLORS } from './Home';

const NEWS_BG = ['#B1A6FF', '#D8D0C4', '#F2F28E'];

/** 웹(1024px~) 전용 첫 화면 */
export default function HomeWeb() {
  useLive();
  const lang = useLang();
  const en = lang === 'en';
  const BRIEF = briefFor(lang);
  const t = (ko: string, e: string) => (en ? e : ko);
  const [mkt, setMkt] = useState<'us' | 'kr'>('us');
  const list = ETFS.filter((e) => e.market === mkt);
  const byScore = (a: Etf, b: Etf) => b.q.buy - a.q.buy;
  const rebs = list.filter(isRebound).sort(byScore);
  const megas = list.filter((e) => e.kind === 'mega' && !isRebound(e)).sort(byScore);
  const sales = list.filter((e) => e.kind === 'sale' && !isRebound(e)).sort(byScore);
  const jup = useJup();
  const mine = ETFS.filter((e) => jup.ids.includes(e.id));
  const wows = list.filter((e) => e.kind === 'wow');
  const nameOf = (e: Etf) => etfTitle(e, lang);
  const priceOf = (e: Etf) => (e.market === 'us' ? '$' + e.q.last.toFixed(2) : Math.round(e.q.last).toLocaleString('ko-KR') + t('원', ' KRW'));

  const Row = ({ e }: { e: Etf }) => (
    <Link href={`/etf/${e.id}/`} className="wRow">
      <span className="wRowName"><b>{nameOf(e)}</b><small>{tf(e, 'kw', lang)}{isRebound(e) ? t(' · 반등 시작', ' · bouncing') : e.kind === 'mega' && isKnife(e.q) ? t(' · 나눠서 줍기', ' · buy in pieces') : ''}</small></span>
      <Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} />
      <span className="wRowPrice">{priceOf(e)}</span>
    </Link>
  );

  return (
    <main className="app wOnly">
      <header className="wHero">
        <div>
          <p className="meta" style={{ margin: 0 }}>{BRIEF.dateLabel}</p>
          <h1 className="wTitle">{t('오늘 시장은', 'Today’s market')}</h1>
        </div>
      </header>

      <div className="wHome">
        <div className="wMain">
          <section className="wBanner">
            <div className="row" style={{ alignItems: 'baseline' }}>
              <MktToggle mkt={mkt} onChange={setMkt} />
            </div>
            <Overview size="web" mkt={mkt} />
          </section>

          <div className="wSecHead">
            <h2 style={{ margin: 0 }}>{en ? `Today’s ${mkt === 'us' ? 'US' : 'Korea'} news` : `오늘 ${mkt === 'us' ? '미국' : '한국'} 뉴스`}</h2>
          </div>
          <div className="wNews3">
            {(mkt === 'us' ? BRIEF.cards : BRIEF.cardsKr).map((c, i) => <NewsCard key={mkt + i} c={c} i={i} bg={NEWS_BG[i]} />)}
          </div>

          <div className="wSecHead">
            <h2 style={{ margin: 0 }}>{t('오늘 세일 리스트', 'Today’s sale list')}</h2>
            <div className="seg" role="group" aria-label={t('시장', 'Market')} style={{ gridTemplateColumns: '1fr 1fr', width: 260 }}>
              <button type="button" aria-pressed={mkt === 'us'} onClick={() => setMkt('us')}>{t('미국 상장', 'US-listed')}</button>
              <button type="button" aria-pressed={mkt === 'kr'} onClick={() => setMkt('kr')}>{t('한국 상장', 'Korea-listed')}</button>
            </div>
          </div>
          <div className="wSale2">
            <section className="wCard reboundCard" style={{ gridColumn: '1 / -1' }}>
              <div className="row"><h3 className="wListTitle">{t('반등리스트', 'Bounce list')}</h3><b className="wCnt">{rebs.length}{t('개', '')}</b></div>
              <p className="wMid">{t('반등 시작됐다 줍자.', 'The bounce is on. Pick it up.')}</p>
              <p className="nShort">{t('슬슬 오를 기미가 보이는 녀석들만 모아보기', 'Only the ones starting to climb back')}</p>
              <p className="wBody" style={{ fontWeight: 800 }}>{rebs.length ? t(`${rebs.length}개`, `${rebs.length} ETFs`) : t('아직은 0개', 'None yet')}</p>
              <div>{rebs.map((e) => <Row key={e.id} e={e} />)}</div>
            </section>
            <section className="wCard dark">
              <div className="row"><h3 className="wListTitle">{t('특급세일 리스트', 'Mega sale list')}</h3><b className="wCnt">{megas.length}{t('개', '')}</b></div>
              <p className="wMid" style={{ color: '#F4F4F2' }}>{t('최고가대비 특급할인', 'Way off the high')}</p>
              <p className="nShort" style={{ color: '#BDBDBA' }}>{t('최고가보다 15% 넘게 빠진 종목들', 'Down more than 15% from the high')}</p>
              <div>{megas.length ? megas.map((e) => <Row key={e.id} e={e} />) : <p className="wBody" style={{ color: '#CFCFCB' }}>{t('지금 특급세일은 없어요. 기다리는 것도 실력!', 'No mega sales right now. Waiting is a skill too!')}</p>}</div>
            </section>
            <Fng web />
          </div>
          {wows.map((e) => (
            <Link key={e.id} href={`/etf/${e.id}/`} className="wWow"><HandIcon /><span><b>{en ? `Easy! ${nameOf(e)} is right near its high` : `워워! ${nameOf(e)}는 최고가 바로 근처`}</b> · {t('많이 들어가지 않기', 'don’t go big')}</span></Link>
          ))}
          <Link href="/etf/" className="cta" style={{ alignSelf: 'flex-start', width: 'auto', gap: 16 }}>{t('ETF 전체 보기', 'See all ETFs')}<Arrow /></Link>
          <section className="wCard" style={{ background: '#fff', border: '2px solid #111' }} id="myjup">
            <div className="row"><h3 className="wListTitle">{t('내 줍줍리스트', 'My dip list')}</h3><b className="wCnt">{mine.length}{t('개', '')}</b></div>
            <div>{jup.status === 'out'
              ? <button type="button" className="cta" onClick={goLogin} style={{ width: 'auto' }}>{t('로그인하고 내 리스트 보기', 'Log in to see your list')}<Arrow /></button>
              : mine.length ? mine.map((e) => <Row key={e.id} e={e} />) : <p className="wBody">{t('아직 비어 있어요. ETF에서 ♥ 줍줍을 눌러 담아보세요.', 'Empty for now. Tap ♥ on any ETF to add it.')}</p>}</div>
          </section>
        </div>

        <aside className="wSide">
          <section className="wPanel">
            <h3 className="wListTitle">{t('환율 사? 말아?', 'FX: buy or wait?')}</h3>
            {FX.map((f, i) => {
              const v = fxVerdict(f);
              const c = FX_COLORS[i % 3];
              const off = f.q.dd <= -1;
              return (
                <Link key={f.id} href="/fx/" className="wFx2" style={{ background: c.bg, color: c.fg }}>
                  <span className="row"><b className="fxNm" style={{ fontSize: 30 }}>{fxShort(f, lang)}{f.mult !== 1 && <small>{f.mult}{t('엔', ' JPY')}</small>}</b><span className={`fxV ${v.good ? 'good' : ''}`}>{en ? v.labelEn : v.label}</span></span>
                  <span className="wFxBig">{Math.round(f.q.last * f.mult).toLocaleString('ko-KR')}<small>{t('원', ' KRW')}</small></span>
                  {off
                    ? <span className={`fxSt${c.fg === '#fff' ? ' inv' : ''}`}>↓{Math.abs(f.q.dd).toFixed(1)}% {f.q.dd <= -10 ? t('특급할인', 'mega off') : t('할인 중', 'off')}</span>
                    : <span className="pilltag up">↑ {Math.abs(f.q.d1).toFixed(2)}% {t('올랐어', 'up')}</span>}
                </Link>
              );
            })}
            <Link href="/fx/" className="cta" style={{ marginTop: 4 }}>{t('자세히 보기', 'See more')}<Arrow /></Link>
            <p className="meta" style={{ margin: 0, fontSize: 12 }}>{t('할인율은 1년 최고 대비', 'Discount vs 1-year high')} · {PRICE_DATE}</p>
          </section>
        </aside>
      </div>
      <BottomNav active="news" />
    </main>
  );
}
