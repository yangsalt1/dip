'use client';
import { useLang } from './Lang';
import { tf } from '@/lib/i18n';
import { Brand } from './Lang';
import { useLive } from '@/lib/live';
import { etfTitle, etfSubtitle } from '@/lib/format';
import LiveStamp from './LiveStamp';
import { useState } from 'react';
import Link from 'next/link';
import { ETFS, FX_RATE, PALETTE, PRICE_DATE, SECTORS, type Etf, type Market, isRebound } from '@/lib/data';
import { priceText, statusLine, type Cur } from '@/lib/format';
import { BottomNav, StatusChip, Sticker } from './ui';
import { stickerStyle } from '@/lib/sticker';
import { etfPart } from '@/lib/fng';

export default function EtfList() {
  useLive();
  const lang = useLang();
  const en = lang === 'en';
  const t = (ko: string, e: string) => (en ? e : ko);
  const [market, setMarket] = useState<Market>('us');
  const [sector, setSector] = useState<string>('all');
  const [cur, setCur] = useState<Cur>('usd');

  const list = ETFS.filter((e) => e.market === market && (sector === 'all' || e.sector === sector)).sort((a, b) => (isRebound(b) ? 1 : 0) - (isRebound(a) ? 1 : 0) || a.rank - b.rank);
  const [hero, ...rest] = list;

  const pickMarket = (m: Market) => { setMarket(m); setSector('all'); setCur(m === 'us' ? 'usd' : 'krw'); };

  return (
    <main className="app">
      <header className="hdr">
        <div>
          <Brand />
          <h1 className="title">{t('지금 꼭', 'ETFs to')}<br /><span>{t('알아야 할 ETF', 'know right now')}</span></h1>
        </div>
        <div className="seg" role="group" aria-label={t('통화', 'Currency')} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 36 }}>
          <button type="button" aria-pressed={cur === 'usd'} onClick={() => setCur('usd')} style={{ padding: '0 14px' }}>$</button>
          <button type="button" aria-pressed={cur === 'krw'} onClick={() => setCur('krw')} style={{ padding: '0 14px' }}>{t('원', '₩')}</button>
        </div>
      </header>

      <div className="seg" role="tablist" aria-label={t('시장', 'Market')} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', margin: '18px 24px 0' }}>
        <button type="button" role="tab" aria-selected={market === 'us'} onClick={() => pickMarket('us')}>{t('미국 상장', 'US-listed')}</button>
        <button type="button" role="tab" aria-selected={market === 'kr'} onClick={() => pickMarket('kr')}>{t('한국 상장', 'Korea-listed')}</button>
      </div>

      <div className="circles" role="group" aria-label={t('섹터', 'Sector')}>
        {SECTORS.filter((s) => s.id === 'all' || ETFS.some((e) => e.market === market && e.sector === s.id)).map((s) => (
          <button key={s.id} type="button" className="circle" aria-pressed={sector === s.id} onClick={() => setSector(s.id)}
            style={{ background: s.color, color: s.id === 'all' ? '#F4F4F2' : '#111' }}>{en ? s.labelEn : s.label}</button>
        ))}
      </div>
      <p className="note" style={{ margin: '12px 24px 0', fontSize: 13 }}>{t('반등 시작 먼저, 그다음 많이 보는 순서 · 몸 위치는 1년 최저가=발바닥, 최고가=정수리', 'Bouncing first, then most viewed · Body spot: 1-year low = sole, high = head')} · {PRICE_DATE.slice(5).replace('-', '/')} {t('종가', 'close')}</p>

      {hero && (
        <div className="stack etfGrid mOnlyB" style={{ paddingTop: 16 }}>
          <Card e={hero} cur={cur} hero tag={isRebound(hero) ? t('줍줍타이밍', 'Dip time') : sector === 'all' ? t('인기 1위', '#1 popular') : t('이 섹터 1위', '#1 in sector')} />
          {rest.map((e, i) => <Card key={e.id} e={e} cur={cur} rank={i + 2} bg={isRebound(e) ? '#B8E8C6' : PALETTE[i % PALETTE.length]} />)}
        </div>
      )}

      {hero && (
        <div className="wList wOnlyB" role="list">
          <div className="wListHead"><span>{t('순위', 'Rank')}</span><span>ETF</span><span>{t('한 줄', 'In short')}</span><span>{t('할인', 'Discount')}</span><span style={{ textAlign: 'right' }}>{t('가격', 'Price')}</span><span style={{ textAlign: 'right' }}>{t('오늘', 'Today')}</span><span>{t('매수 온도', 'Buy temp')}</span></div>
          {[hero, ...rest].map((e, i) => {
            const sc = SECTORS.find((x) => x.id === e.sector);
            return (
              <Link key={e.id} href={`/etf/${e.id}/`} className="wListRow" role="listitem">
                <b className="wRank">{isRebound(e) ? t('줍', '↗') : i + 1}</b>
                <span className="wListName"><b>{etfTitle(e, lang)}</b><small>{etfSubtitle(e, lang)}</small></span>
                <span className="wListKw"><i style={{ background: sc?.color }} /><span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}><span>{tf(e, 'diff', lang)}</span>{e.market === 'us' && <small className="wDiff">{e.name}</small>}</span></span>
                <span className="chipCol" style={{ alignItems: 'flex-start' }}><Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} /><PartTag e={e} /></span>
                <b className="wListPrice">{priceText(e, cur, lang)}</b>
                <b style={{ textAlign: 'right', color: e.q.d1 >= 0 ? '#A3200F' : '#1A3FA8' }}>{e.q.d1 >= 0 ? '+' : ''}{e.q.d1.toFixed(2)}%</b>
                <span className="wTemp"><span><i style={{ width: `${e.q.buy}%` }} /></span><small>{e.q.buy}</small></span>
              </Link>
            );
          })}
        </div>
      )}

      <p className="note">{en ? `Prices: ${PRICE_DATE} close. FX: $1 = ${Math.round(FX_RATE).toLocaleString('en-US')} KRW. Popularity ranking is manual for now.` : `가격: Yahoo Finance ${PRICE_DATE} 종가, 환율 1달러 = ${Math.round(FX_RATE).toLocaleString('ko-KR')}원. 인기 순위는 지금은 수동이에요.`}</p>
      <LiveStamp />
      <BottomNav active="etf" />
    </main>
  );
}

function Card({ e, cur, hero, tag, rank, bg }: { e: Etf; cur: Cur; hero?: boolean; tag?: string; rank?: number; bg?: string }) {
  const lang = useLang();
  const s = statusLine(e, lang);
  const title = etfTitle(e, lang);
  return (
    <Link href={`/etf/${e.id}/`} className={`card${hero ? ' dark' : ''}`} style={hero ? { padding: '24px 22px 50px', gap: 14 } : { background: bg }}>
      <span className="row">
        {hero
          ? <span className="chip" style={{ background: '#F2F28E', color: '#111', fontSize: 12, padding: '5px 11px' }}>{tag}</span>
          : <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><b style={{ fontSize: 13, color: '#3A3A38' }}>{lang === 'en' ? `#${rank}` : `${rank}위`}</b><b style={{ fontSize: title.length > 12 ? 19 : title.length > 5 ? 24 : 30, letterSpacing: '-0.045em' }}>{title}</b></span>}
        <span className="chipCol">
          {stickerStyle() === 'b' ? <Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} /> : <StatusChip kind={e.kind} />}
          <PartTag e={e} dark={hero} />
        </span>
      </span>
      {hero && <span style={{ fontSize: title.length > 6 ? 38 : 64, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', wordBreak: 'keep-all' }}>{title}</span>}
      <span style={{ display: 'flex', flexDirection: 'column', gap: hero ? 6 : 3 }}>
        <b style={{ fontSize: hero ? 22 : 18, letterSpacing: '-0.035em' }}>{tf(e, 'kw', lang)}</b>
        <span className="diffTag">{tf(e, 'diff', lang)}</span>
        <span className="small soft" style={{ fontSize: hero ? 14 : 13 }}>{tf(e, 'sub', lang)}</span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: hero ? 6 : 4, paddingTop: 2 }}>
        {stickerStyle() !== 'b' && <span><Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} /></span>}
        <span className="rowEnd">
          <span className="big" style={{ fontSize: hero ? 52 : 44 }}>{priceText(e, cur, lang)}</span>
          <span style={{ paddingBottom: hero ? 6 : 4, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }} className="soft">{s.side}</span>
        </span>
      </span>
    </Link>
  );
}

/** 1년 최저(발바닥)~최고(정수리) 중 지금 위치 */
function PartTag({ e, dark }: { e: Etf; dark?: boolean }) {
  const p = etfPart(e.q);
  const en = useLang() === 'en';
  return <span className="partTag" title={en ? '1-year low = sole, high = head' : '1년 최저가=발바닥, 최고가=정수리'}><i style={{ background: p.color }} />{en ? p.en : p.ko}</span>;
}
