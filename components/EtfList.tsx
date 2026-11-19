'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ETFS, FX_RATE, PALETTE, PRICE_DATE, SECTORS, type Etf, type Market } from '@/lib/data';
import { priceText, statusLine, type Cur } from '@/lib/format';
import { BottomNav, StatusChip, Sticker } from './ui';
import { stickerStyle } from '@/lib/sticker';

export default function EtfList() {
  const [market, setMarket] = useState<Market>('us');
  const [sector, setSector] = useState<string>('all');
  const [cur, setCur] = useState<Cur>('usd');

  const list = ETFS.filter((e) => e.market === market && (sector === 'all' || e.sector === sector)).sort((a, b) => a.rank - b.rank);
  const [hero, ...rest] = list;

  const pickMarket = (m: Market) => { setMarket(m); setSector('all'); setCur(m === 'us' ? 'usd' : 'krw'); };

  return (
    <main className="app">
      <header className="hdr">
        <div>
          <Link href="/" className="brand">JUP<small>떨어질 때 사리라</small></Link>
          <h1 className="title">지금 꼭<br /><span>알아야 할 ETF</span></h1>
        </div>
        <div className="seg" role="group" aria-label="통화" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 36 }}>
          <button type="button" aria-pressed={cur === 'usd'} onClick={() => setCur('usd')} style={{ padding: '0 14px' }}>$</button>
          <button type="button" aria-pressed={cur === 'krw'} onClick={() => setCur('krw')} style={{ padding: '0 14px' }}>원</button>
        </div>
      </header>

      <div className="seg" role="tablist" aria-label="시장" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', margin: '18px 24px 0' }}>
        <button type="button" role="tab" aria-selected={market === 'us'} onClick={() => pickMarket('us')}>미국 상장</button>
        <button type="button" role="tab" aria-selected={market === 'kr'} onClick={() => pickMarket('kr')}>한국 상장</button>
      </div>

      <div className="circles" role="group" aria-label="섹터">
        {SECTORS.filter((s) => s.id === 'all' || ETFS.some((e) => e.market === market && e.sector === s.id)).map((s) => (
          <button key={s.id} type="button" className="circle" aria-pressed={sector === s.id} onClick={() => setSector(s.id)}
            style={{ background: s.color, color: s.id === 'all' ? '#F4F4F2' : '#111' }}>{s.label}</button>
        ))}
      </div>
      <p className="note" style={{ margin: '12px 24px 0', fontSize: 13 }}>요즘 사람들이 제일 많이 보는 순서 · {PRICE_DATE.slice(5).replace('-', '/')} 종가</p>

      {hero && (
        <div className="stack etfGrid mOnlyB" style={{ paddingTop: 16 }}>
          <Card e={hero} cur={cur} hero tag={sector === 'all' ? '인기 1위' : '이 섹터 1위'} />
          {rest.map((e, i) => <Card key={e.id} e={e} cur={cur} rank={i + 2} bg={PALETTE[i % PALETTE.length]} />)}
        </div>
      )}

      {hero && (
        <div className="wList wOnlyB" role="list">
          <div className="wListHead"><span>순위</span><span>ETF</span><span>한 줄</span><span>할인</span><span style={{ textAlign: 'right' }}>가격</span><span style={{ textAlign: 'right' }}>오늘</span><span>매수 온도</span></div>
          {[hero, ...rest].map((e, i) => {
            const sc = SECTORS.find((x) => x.id === e.sector);
            return (
              <Link key={e.id} href={`/etf/${e.id}/`} className="wListRow" role="listitem">
                <b className="wRank">{i + 1}</b>
                <span className="wListName"><b>{e.code}</b><small>{e.name}</small></span>
                <span className="wListKw"><i style={{ background: sc?.color }} /><span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}><span>{e.kw}</span><small className="wDiff">{e.diff}</small></span></span>
                <span><Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} /></span>
                <b className="wListPrice">{priceText(e, cur)}</b>
                <b style={{ textAlign: 'right', color: e.q.d1 >= 0 ? '#A3200F' : '#1A3FA8' }}>{e.q.d1 >= 0 ? '+' : ''}{e.q.d1.toFixed(2)}%</b>
                <span className="wTemp"><span><i style={{ width: `${e.q.buy}%` }} /></span><small>{e.q.buy}</small></span>
              </Link>
            );
          })}
        </div>
      )}

      <p className="note">가격: Yahoo Finance {PRICE_DATE} 종가, 환율 1달러 = {Math.round(FX_RATE).toLocaleString('ko-KR')}원. 인기 순위는 지금은 수동이에요.</p>
      <BottomNav active="etf" />
    </main>
  );
}

function Card({ e, cur, hero, tag, rank, bg }: { e: Etf; cur: Cur; hero?: boolean; tag?: string; rank?: number; bg?: string }) {
  const s = statusLine(e);
  return (
    <Link href={`/etf/${e.id}/`} className={`card${hero ? ' dark' : ''}`} style={hero ? { padding: '24px 22px 50px', gap: 14 } : { background: bg }}>
      <span className="row">
        {hero
          ? <span className="chip" style={{ background: '#F2F28E', color: '#111', fontSize: 12, padding: '5px 11px' }}>{tag}</span>
          : <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><b style={{ fontSize: 13, color: '#3A3A38' }}>{rank}위</b><b style={{ fontSize: e.code.length > 5 ? 24 : 30, letterSpacing: '-0.045em' }}>{e.code}</b></span>}
        {stickerStyle() === 'b' ? <Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} /> : <StatusChip kind={e.kind} />}
      </span>
      {hero && <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.05em' }}>{e.code}</span>}
      <span style={{ display: 'flex', flexDirection: 'column', gap: hero ? 6 : 3 }}>
        <b style={{ fontSize: hero ? 22 : 18, letterSpacing: '-0.035em' }}>{e.kw}</b>
        <span className="diffTag">{e.diff}</span>
        <span className="small soft" style={{ fontSize: hero ? 14 : 13 }}>{e.sub}</span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: hero ? 6 : 4, paddingTop: 2 }}>
        {stickerStyle() !== 'b' && <span><Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} /></span>}
        <span className="rowEnd">
          <span className="big" style={{ fontSize: hero ? 52 : 44 }}>{priceText(e, cur)}</span>
          <span style={{ paddingBottom: hero ? 6 : 4, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }} className="soft">{s.side}</span>
        </span>
      </span>
    </Link>
  );
}
