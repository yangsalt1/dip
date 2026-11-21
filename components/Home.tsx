'use client';
import { Brand, useLang } from './Lang';
import { tf } from '@/lib/i18n';
import { fxShort } from '@/lib/fx';
import { etfTitle } from '@/lib/format';
import { useLive } from '@/lib/live';
import Rich from './Rich';
import { useState } from 'react';
import Link from 'next/link';
import { briefFor, ETFS, FX, isKnife, isRebound, type Etf } from '@/lib/data';
import { useJup, goLogin } from '@/lib/useJup';
import { stickerStyle } from '@/lib/sticker';
import { fxVerdict } from '@/lib/fx';
import { Arrow, BottomNav, HandIcon, Sticker } from './ui';
import { NewsExtra } from './NewsCard';
import Overview, { MktToggle } from './Overview';
import LiveStamp from './LiveStamp';
import Fng from './Fng';

const CARD_BG = ['#B1A6FF', '#D8D0C4', '#F2F28E'];
// 시안 A: 빨강 · 노랑 · 인디고 (글씨·스티커는 모두 검정)
export const FX_COLORS = [{ bg: '#DB6558', fg: '#111' }, { bg: '#EAE675', fg: '#111' }, { bg: '#4B71B6', fg: '#111' }];

export default function Home() {
  useLive();
  const lang = useLang();
  const en = lang === 'en';
  const BRIEF = briefFor(lang);
  const t = (ko: string, e: string) => (en ? e : ko);
  const [open, setOpen] = useState(-1);

  const [mkt, setMktRaw] = useState<'us' | 'kr'>('us');
  const setMkt = (m: 'us' | 'kr') => { setMktRaw(m); setOpen(-1); };
  const cards = mkt === 'us' ? BRIEF.cards : BRIEF.cardsKr;
  const list = ETFS.filter((e) => e.market === mkt);
  const byScore = (a: Etf, b: Etf) => b.q.buy - a.q.buy;
  const rebs = list.filter(isRebound).sort(byScore);
  const megas = list.filter((e) => e.kind === 'mega' && !isRebound(e)).sort(byScore);
  const sales = list.filter((e) => e.kind === 'sale' && !isRebound(e)).sort(byScore);
  const jup = useJup();
  const mine = ETFS.filter((e) => jup.ids.includes(e.id));
  const ups = list.filter((e) => e.kind === 'up');
  const wows = list.filter((e) => e.kind === 'wow');
  const nameOf = (e: Etf) => etfTitle(e, lang);
  const priceOf = (e: Etf) => (e.market === 'us' ? '$' + e.q.last.toFixed(2) : Math.round(e.q.last).toLocaleString('ko-KR') + t('원', ' KRW'));
  const Row = ({ e }: { e: Etf }) => (
    <Link href={`/etf/${e.id}/`} className="saleRow">
      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="nm">{nameOf(e)}</span>
        <span className="kw">{tf(e, 'kw', lang)}{isRebound(e) ? t(' · 반등 시작', ' · bouncing') : e.kind === 'mega' && isKnife(e.q) ? t(' · 아직 떨어지는 중, 나눠서 줍기', ' · still falling, buy in pieces') : ''}</span>
      </span>
      {stickerStyle() === 'b' ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="off">{priceOf(e)}</span>
          <Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} />
        </span>
      ) : (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} />
          <span className="off">{priceOf(e)}</span>
        </span>
      )}
    </Link>
  );

  return (
    <main className="app mOnly">
      <header className="hdr">
        <div>
          <Brand />
          <h1 className="title">{t('오늘', 'Today’s')} <span>{t('시장은', 'market')}</span></h1>
        </div>
        <span className="meta" style={{ paddingTop: 6 }}>{BRIEF.dateLabel}</span>
      </header>

      <div className="homeGrid">
      <div className="colA">
      <div className="stack keep">
        <section className="card dark" style={{ gap: 12, paddingTop: 16 }}>
          <MktToggle mkt={mkt} onChange={setMkt} />
          <Overview size="app" mkt={mkt} />
        </section>

        {cards.map((c, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="card" style={{ background: CARD_BG[i] }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}
                style={{ border: 0, background: 'transparent', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <span className="row" style={{ width: '100%' }}>
                  <span className="num">{i + 1}</span>
                  <span className="row" style={{ fontSize: 15, fontWeight: 700 }}>{c.label}
                    <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(17,17,17,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{isOpen ? '−' : '+'}</span>
                  </span>
                </span>
                <span style={{ fontSize: 24, lineHeight: 1.3, fontWeight: 800, letterSpacing: '-0.035em' }}>{c.kid}</span>
              </button>
              {isOpen && (
                <>
                  <p className="box rich" style={{ margin: 0, background: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.55 }}><Rich t={(c as { short?: string }).short ?? c.more} /></p>
                  <NewsExtra c={c} />
                </>
              )}
            </div>
          );
        })}
      </div>

      </div>
      <div className="colB">
      <section className="section" aria-label={t('할인 중인 환율', 'Exchange rates on sale')}>
        <div className="rowEnd" style={{ padding: '0 12px' }}>
          <h2 style={{ margin: 0 }}>{t('환율', 'FX')}<br /><span>{t('사? 말아?', 'Buy or wait?')}</span></h2>
          <span className="meta" style={{ fontSize: 12 }}>{t('1년 최고 대비', 'vs 1-year high')}</span>
        </div>
        <div className="grid3">
          {FX.map((f, i) => (
            <Link key={f.id} href="/fx/" className="fxTile" style={{ background: FX_COLORS[i % 3].bg, color: FX_COLORS[i % 3].fg }}>
              <b className="fxNm">{fxShort(f, lang)}{f.mult !== 1 && <small>{f.mult}{fxShort(f, lang)}</small>}</b>
              {f.q.dd <= -1
                ? <span className="fxSt fxOff">↓{Math.abs(f.q.dd).toFixed(1)}% {t('할인', 'off')}</span>
                : <span className={`fxSt${FX_COLORS[i % 3].fg === '#fff' ? ' inv' : ''}`}>{t('워워 · 최고가 근처', 'Easy · near the high')}</span>}
              <span className="fxSt inv">{en ? fxVerdict(f).labelEn : fxVerdict(f).label}</span>
              <span className="fxPr">{Math.round(f.q.last * f.mult).toLocaleString('ko-KR')}<small>{t('원', ' KRW')}</small></span>
            </Link>
          ))}
        </div>
        <Link href="/fx/" className="cta" style={{ margin: '0 4px', width: 'auto' }}>{t('지금 사? 말아? 보기', 'Buy or wait? See more')}<Arrow /></Link>
      </section>

      <section className="section" aria-label={t('지금 세일 중', 'On sale now')} style={{ paddingBottom: 0 }}>
        <h2 style={{ margin: 0, padding: '0 12px' }}>{t('오늘', 'Today’s')}<br /><span>{t('세일 리스트', 'sale list')}</span></h2>
      </section>

      <div style={{ padding: '18px 24px 0' }}>
        <div className="seg" role="group" aria-label={t('시장', 'Market')} style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <button type="button" className={mkt === 'us' ? 'on' : ''} aria-pressed={mkt === 'us'} onClick={() => setMkt('us')}>{t('미국 상장', 'US-listed')}</button>
          <button type="button" className={mkt === 'kr' ? 'on' : ''} aria-pressed={mkt === 'kr'} onClick={() => setMkt('kr')}>{t('한국 상장', 'Korea-listed')}</button>
        </div>
      </div>
      <div className="stack keep" aria-label={t('세일 현황', 'Sale status')}>
        <section className="card reboundCard" style={{ gap: 6 }}>
          <div className="row"><span className="chip" style={{ background: '#111', color: '#fff' }}>{t('반등리스트', 'Bounce list')}</span><span style={{ fontSize: 15, fontWeight: 800 }}>{rebs.length}{t('개', '')}</span></div>
          <p style={{ margin: '8px 0 0', fontSize: 30, lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.045em' }}>{t('반등 시작됐다 줍자.', 'The bounce is on. Pick it up.')}</p>
          <p className="nShort" style={{ margin: '0 0 4px', color: '#123' }}>{t('슬슬 오를 기미가 보이는 녀석들만 모아보기', 'Only the ones starting to climb back')}</p>
          <p className="small" style={{ margin: '6px 0 0', fontWeight: 800, fontSize: 16 }}>{rebs.length ? t(`${rebs.length}개`, `${rebs.length} ETFs`) : t('아직은 0개', 'None yet')}</p>
          {rebs.map((e) => <Row key={e.id} e={e} />)}
        </section>
        <section className="card dark" style={{ gap: 6 }}>
          <div className="row"><span className="live">{t('특급세일 리스트', 'Mega sale list')}</span><span style={{ fontSize: 15, fontWeight: 800 }}>{megas.length}{t('개', '')}</span></div>
          <p style={{ margin: '8px 0 4px', fontSize: 30, lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.045em' }}>{t('최고가대비', 'Way off')}<br />{t('특급할인', 'the high')}</p>
          <p className="nShort" style={{ margin: '0 0 4px', color: '#BDBDBA' }}>{t('최고가보다 15% 넘게 빠진 종목들', 'Down more than 15% from the high')}</p>
          {megas.length ? megas.map((e) => <Row key={e.id} e={e} />)
            : <p className="small" style={{ margin: '6px 0 0', fontWeight: 700 }}>{t('지금 특급세일은 없어요. 기다리는 것도 실력!', 'No mega sales right now. Waiting is a skill too!')}</p>}
        </section>
        <Fng />
        <section className="card" style={{ background: '#F4F4F2', gap: 10 }}>
          <div className="row"><b style={{ fontSize: 15 }}>{t('올랐을 땐 평정심', 'Stay calm when it’s up')}</b><span style={{ fontSize: 13, fontWeight: 700, color: '#5A5A58' }}>{t('상승 중', 'Rising')} {ups.length} · {t('워워', 'Easy')} {wows.length}</span></div>
          {wows.length ? wows.map((e) => (
            <Link key={e.id} href={`/etf/${e.id}/`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 18, background: '#F2F28E', textDecoration: 'none', color: '#111' }}>
              <HandIcon />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <b style={{ fontSize: 15 }}>{en ? `Easy! ${nameOf(e)} is right near its high` : `워워! ${nameOf(e)}는 최고가 바로 근처`}</b>
                <span className="small" style={{ color: '#3D3D1A' }}>{t('지금은 조금만. 많이 들어가지 않기.', 'Just a little for now. Don’t go big.')}</span>
              </span>
            </Link>
          )) : <p className="small" style={{ margin: 0 }}>{t('고점에서 과열된 건 없어요.', 'Nothing overheated at the top.')}</p>}
          {ups.length > 0 && <p className="small" style={{ margin: 0, color: '#3D3D3B' }}>{en ? `Rising: ${ups.map(nameOf).join(', ')} — going well. Don’t chase, stick to the plan.` : `상승 중: ${ups.map(nameOf).join(', ')} — 잘 가고 있어요. 쫓아 사지 말고 원래 계획대로.`}</p>}
          <Link href="/etf/" className="cta" style={{ marginTop: 4 }}>{t('ETF 전체 보기', 'See all ETFs')}<Arrow /></Link>
        </section>
        <section className="card" style={{ background: '#fff', border: '2px solid #111', gap: 6 }} id="myjup">
          <div className="row"><b style={{ fontSize: 18 }}>{t('내 줍줍리스트', 'My dip list')}</b><span style={{ fontSize: 15, fontWeight: 800 }}>{mine.length}{t('개', '')}</span></div>
          {jup.status === 'out' ? (
            <button type="button" className="cta" onClick={goLogin} style={{ marginTop: 4 }}>{t('로그인하고 내 리스트 보기', 'Log in to see your list')}<Arrow /></button>
          ) : mine.length ? mine.map((e) => <Row key={e.id} e={e} />)
            : <p className="small" style={{ margin: '6px 0 0', fontWeight: 700 }}>{t('아직 비어 있어요. ETF에서 ♥ 줍줍을 눌러 담아보세요.', 'Empty for now. Tap ♥ on any ETF to add it.')}</p>}
        </section>
      </div>
      </div>
      </div>


      <LiveStamp />
      <BottomNav active="news" />
    </main>
  );
}
