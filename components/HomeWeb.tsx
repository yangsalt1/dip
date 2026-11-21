'use client';
import { etfTitle } from '@/lib/format';
import { useLive } from '@/lib/live';
import { useState } from 'react';
import Link from 'next/link';
import { BRIEF, ETFS, FX, PRICE_DATE, isKnife, isRebound, type Etf } from '@/lib/data';
import { useJup, goLogin } from '@/lib/useJup';
import { fxVerdict } from '@/lib/fx';
import { Arrow, BottomNav, HandIcon, Sticker } from './ui';
import NewsCard from './NewsCard';
import Fng from './Fng';
import Overview, { MktToggle } from './Overview';
import { FX_COLORS } from './Home';

const NEWS_BG = ['#B1A6FF', '#D8D0C4', '#F2F28E'];

/** 웹(1024px~) 전용 첫 화면 */
export default function HomeWeb() {
  useLive();
  const [mkt, setMkt] = useState<'us' | 'kr'>('us');
  const list = ETFS.filter((e) => e.market === mkt);
  const byScore = (a: Etf, b: Etf) => b.q.buy - a.q.buy;
  const rebs = list.filter(isRebound).sort(byScore);
  const megas = list.filter((e) => e.kind === 'mega' && !isRebound(e)).sort(byScore);
  const sales = list.filter((e) => e.kind === 'sale' && !isRebound(e)).sort(byScore);
  const jup = useJup();
  const mine = ETFS.filter((e) => jup.ids.includes(e.id));
  const wows = list.filter((e) => e.kind === 'wow');
  const nameOf = (e: Etf) => etfTitle(e);
  const priceOf = (e: Etf) => (e.market === 'us' ? '$' + e.q.last.toFixed(2) : Math.round(e.q.last).toLocaleString('ko-KR') + '원');

  const Row = ({ e }: { e: Etf }) => (
    <Link href={`/etf/${e.id}/`} className="wRow">
      <span className="wRowName"><b>{nameOf(e)}</b><small>{e.kw}{isRebound(e) ? ' · 반등 시작' : e.kind === 'mega' && isKnife(e.q) ? ' · 나눠서 줍기' : ''}</small></span>
      <Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} />
      <span className="wRowPrice">{priceOf(e)}</span>
    </Link>
  );

  return (
    <main className="app wOnly">
      <header className="wHero">
        <div>
          <p className="meta" style={{ margin: 0 }}>{BRIEF.dateLabel}</p>
          <h1 className="wTitle">오늘 시장은</h1>
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
            <h2 style={{ margin: 0 }}>오늘 {mkt === 'us' ? '미국' : '한국'} 뉴스</h2>
          </div>
          <Fng web />
          <div className="wNews3">
            {(mkt === 'us' ? BRIEF.cards : BRIEF.cardsKr).map((c, i) => <NewsCard key={mkt + i} c={c} i={i} bg={NEWS_BG[i]} />)}
          </div>

          <div className="wSecHead">
            <h2 style={{ margin: 0 }}>오늘 세일 리스트</h2>
            <div className="seg" role="group" aria-label="시장" style={{ gridTemplateColumns: '1fr 1fr', width: 260 }}>
              <button type="button" aria-pressed={mkt === 'us'} onClick={() => setMkt('us')}>미국 상장</button>
              <button type="button" aria-pressed={mkt === 'kr'} onClick={() => setMkt('kr')}>한국 상장</button>
            </div>
          </div>
          <div className="wSale2">
            <section className="wCard reboundCard" style={{ gridColumn: '1 / -1' }}>
              <div className="row"><h3 className="wListTitle">줍줍리스트</h3><b className="wCnt">{rebs.length}개</b></div>
              <p className="wMid">반등 시작됐다 줍자.</p>
              <p className="nShort">슬슬 오를 기미가 보이는 녀석들만 모아보기</p>
              <p className="wBody" style={{ fontWeight: 800 }}>{rebs.length ? `${rebs.length}개` : '아직은 0개'}</p>
              <div>{rebs.map((e) => <Row key={e.id} e={e} />)}</div>
            </section>
            <section className="wCard dark">
              <div className="row"><h3 className="wListTitle">특급세일 리스트</h3><b className="wCnt">{megas.length}개</b></div>
              <p className="wMid" style={{ color: '#F4F4F2' }}>최고가대비 특급할인</p>
              <p className="nShort" style={{ color: '#BDBDBA' }}>최고가보다 15% 넘게 빠진 종목들</p>
              <div>{megas.length ? megas.map((e) => <Row key={e.id} e={e} />) : <p className="wBody" style={{ color: '#CFCFCB' }}>지금 특급세일은 없어요. 기다리는 것도 실력!</p>}</div>
            </section>
            <section className="wCard" style={{ background: '#C9DDF7' }}>
              <div className="row"><h3 className="wListTitle">일반세일 리스트</h3><b className="wCnt">{sales.length}개</b></div>
              <p className="wMid">세일 시작했다</p>
              <p className="nShort">조금씩 빠지는 종목들</p>
              <div>{sales.length ? sales.map((e) => <Row key={e.id} e={e} />) : <p className="wBody">지금 일반 세일은 없어요.</p>}</div>
            </section>
          </div>
          {wows.map((e) => (
            <Link key={e.id} href={`/etf/${e.id}/`} className="wWow"><HandIcon /><span><b>워워! {nameOf(e)}는 최고가 바로 근처</b> · 많이 들어가지 않기</span></Link>
          ))}
          <Link href="/etf/" className="cta" style={{ alignSelf: 'flex-start', width: 'auto', gap: 16 }}>ETF 전체 보기<Arrow /></Link>
          <section className="wCard" style={{ background: '#fff', border: '2px solid #111' }} id="myjup">
            <div className="row"><h3 className="wListTitle">내 줍줍리스트</h3><b className="wCnt">{mine.length}개</b></div>
            <div>{jup.status === 'out'
              ? <button type="button" className="cta" onClick={goLogin} style={{ width: 'auto' }}>로그인하고 내 리스트 보기<Arrow /></button>
              : mine.length ? mine.map((e) => <Row key={e.id} e={e} />) : <p className="wBody">아직 비어 있어요. ETF에서 ♥ 줍줍을 눌러 담아보세요.</p>}</div>
          </section>
        </div>

        <aside className="wSide">
          <section className="wPanel">
            <h3 className="wListTitle">환율 사? 말아?</h3>
            {FX.map((f, i) => {
              const v = fxVerdict(f);
              const c = FX_COLORS[i % 3];
              const off = f.q.dd <= -1;
              return (
                <Link key={f.id} href="/fx/" className="wFx2" style={{ background: c.bg, color: c.fg }}>
                  <span className="row"><b className="fxNm" style={{ fontSize: 30 }}>{f.short.replace(/\s*\(.*\)/, "")}{f.mult !== 1 && <small>{f.mult}엔</small>}</b><span className={`fxV ${v.good ? 'good' : ''}`}>{v.label}</span></span>
                  <span className="wFxBig">{Math.round(f.q.last * f.mult).toLocaleString('ko-KR')}<small>원</small></span>
                  {off
                    ? <span className={`fxSt${c.fg === '#fff' ? ' inv' : ''}`}>↓{Math.abs(f.q.dd).toFixed(1)}% {f.q.dd <= -10 ? '특급할인' : '할인 중'}</span>
                    : <span className="pilltag up">↑ {Math.abs(f.q.d1).toFixed(2)}% 올랐어</span>}
                </Link>
              );
            })}
            <Link href="/fx/" className="cta" style={{ marginTop: 4 }}>자세히 보기<Arrow /></Link>
            <p className="meta" style={{ margin: 0, fontSize: 12 }}>할인율은 1년 최고 대비 · {PRICE_DATE}</p>
          </section>
        </aside>
      </div>
      <BottomNav active="news" />
    </main>
  );
}
