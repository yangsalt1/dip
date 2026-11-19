'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BUCKETS, diagnose, type Saved } from '@/lib/buckets';
import { PLANS, type Goal } from '@/lib/plans';
import { goLogin } from '@/lib/useJup';
import { Arrow, Sticker } from './ui';

const MAX = 10;

/** 캡처를 줄여서(긴 변 1568px, JPEG) 보내요. 원본은 폰에만 남아요. */
async function shrink(f: File): Promise<string> {
  const bmp = await createImageBitmap(f);
  const k = Math.min(1, 1568 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}

const pct = (n: number) => `${Math.round(n)}%`;

export default function Analyze({ goal }: { goal: Goal }) {
  const [st, setSt] = useState<'loading' | 'out' | 'in'>('loading');
  const [ready, setReady] = useState(true);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [imgs, setImgs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showAll, setShowAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/analyze', { cache: 'no-store' }).then((r) => r.json()).then((j) => {
      setSt(j.loggedIn ? 'in' : 'out'); setReady(j.ready !== false); setSaved(j.saved ?? null);
    }).catch(() => setSt('out'));
  }, []);

  async function pick(files: FileList | null) {
    if (!files) return;
    setErr('');
    const room = MAX - imgs.length;
    const arr = [...files].filter((f) => f.type.startsWith('image/')).slice(0, room);
    if (files.length > room) setErr(`사진은 ${MAX}장까지예요`);
    const out = await Promise.all(arr.map((f) => shrink(f).catch(() => '')));
    setImgs((p) => [...p, ...out.filter(Boolean)]);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function run() {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ images: imgs }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error ?? '분석하지 못했어요'); return; }
      setSaved(j.saved); setImgs([]);
    } catch { setErr('분석하지 못했어요. 잠시 뒤 다시 해봐요'); }
    finally { setBusy(false); }
  }

  async function wipe() {
    if (!window.confirm('분석 결과를 지울까요?')) return;
    await fetch('/api/analyze', { method: 'DELETE' }).catch(() => {});
    setSaved(null);
  }

  const d = saved ? diagnose(saved.holdings, goal) : null;

  return (
    <section className="anz" aria-label="지금 내 주식 분석하기">
      <div className="anzHead">
        <h2 style={{ margin: 0 }}>지금 내 주식<br /><span>분석하기</span></h2>
        <span className="pill" style={{ background: '#F7F7F5', minHeight: 30, fontSize: 13 }}>선택</span>
      </div>

      {st === 'out' && (
        <div className="card dark" style={{ gap: 12, paddingBottom: 22 }}>
          <p style={{ margin: 0, fontSize: 22, lineHeight: 1.3, fontWeight: 800, letterSpacing: '-0.04em' }}>증권사 앱 캡처만 올리면<br />뭐가 모자란지 알려줄게.</p>
          <p className="small" style={{ margin: 0, color: '#CFCFCB' }}>분석 결과는 내 계정에 저장돼요. 그래서 로그인이 필요해요.</p>
          <button type="button" className="cta light" onClick={goLogin}>로그인하고 분석하기<Arrow color="#111" /></button>
        </div>
      )}

      {st === 'in' && d && saved && (
        <div className="stack keep" style={{ padding: 0 }}>
          <section className="card dark" style={{ gap: 10 }}>
            <div className="row"><span className="small" style={{ color: '#BDBDBA', fontWeight: 700 }}>내 포트폴리오 · {PLANS[goal].label} 기준</span><span className="small" style={{ color: '#8A8A88' }}>{saved.at.slice(5, 10).replace('-', '.')}</span></div>
            <p style={{ margin: 0, fontSize: 24, lineHeight: 1.28, fontWeight: 800, letterSpacing: '-0.045em' }}>
              {d.top && <>{BUCKETS[d.top.b].label}에 <span style={{ color: '#FF5A3C' }}>{pct(d.top.p)}</span>{d.top.p >= 50 ? ' 몰빵.' : '.'}</>}
              {d.lack.length > 0 && <><br />{d.lack.slice(0, 2).map((l) => BUCKETS[l.b].label).join(', ')}{d.lack.length > 2 ? ' 등' : ''}이 모자라.</>}
              {d.lack.length === 0 && d.over.length === 0 && <><br />목표랑 거의 비슷해. 잘 나눠 담았어!</>}
            </p>
            <div className="bar" style={{ display: 'flex', height: 12, borderRadius: 99, overflow: 'hidden', gap: 2 }} aria-hidden="true">
              {d.mine.map((m) => <span key={m.b} style={{ flex: m.p, background: BUCKETS[m.b].color }} />)}
            </div>
            <div className="anzLeg">{d.mine.map((m) => <span key={m.b}><i style={{ background: BUCKETS[m.b].color }} />{BUCKETS[m.b].label} {pct(m.p)}</span>)}</div>
            {d.cash >= 1 && <span className="small" style={{ color: '#8A8A88' }}>현금 {pct(d.cash)}는 따로 빼고 계산했어요</span>}
            {saved.rough && <span className="small" style={{ color: '#F2F28E' }}>캡처에 금액이 없어서 종목 수로 어림했어요</span>}
          </section>

          <section className="card" style={{ background: '#fff', gap: 4 }}>
            <div className="row" style={{ marginBottom: 4 }}><b style={{ fontSize: 16 }}>목표랑 비교</b><span className="small" style={{ color: '#6B6B69' }}>┃ = {PLANS[goal].label} 목표</span></div>
            {d.rows.map((r) => (
              <div key={r.b} className="anzGap">
                <span>{BUCKETS[r.b].label}</span>
                <span className="anzTrack"><span className="me" style={{ width: `${Math.min(r.me, 100)}%`, background: r.diff >= 10 ? '#FF5A3C' : '#111' }} />{r.goal > 0 && <span className="goal" style={{ left: `${r.goal}%` }} />}</span>
                <b style={{ color: r.diff <= -5 ? '#1A3FA8' : r.diff >= 10 ? '#A3200F' : '#6B6B69' }}>{r.diff > 0 ? '+' : ''}{Math.round(r.diff)}</b>
              </div>
            ))}
          </section>

          {d.lack.length > 0 && (
            <section className="card" style={{ background: '#C9DDF7', gap: 10 }}>
              <b style={{ fontSize: 18, letterSpacing: '-0.03em' }}>새 돈이 생기면 여기부터</b>
              <span className="small" style={{ marginTop: -6 }}>파는 건 꼭 안 해도 돼요. 앞으로 사는 걸로 맞추기.</span>
              {d.lack.map((l, i) => (
                <div key={l.b} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <b style={{ fontSize: 15 }}>{i + 1}. {BUCKETS[l.b].label} <span style={{ color: '#1A3FA8' }}>{Math.round(l.diff)}%</span></b>
                  {l.picks.map((e) => (
                    <Link key={e.id} href={`/etf/${e.id}/`} className="anzPick">
                      <span style={{ minWidth: 0 }}><b>{e.market === 'us' ? e.code : e.name}</b><small>{e.diff ?? e.kw}</small></span>
                      <Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} />
                    </Link>
                  ))}
                </div>
              ))}
            </section>
          )}

          {d.over.length > 0 && (
            <section className="card" style={{ background: '#FFD6CC', gap: 6 }}>
              <b style={{ fontSize: 16 }}>잠깐 멈출 칸</b>
              {d.over.map((o) => <span key={o.b} className="small" style={{ fontSize: 14 }}><b>{BUCKETS[o.b].label}</b> 목표보다 +{Math.round(o.diff)}% · 새로 사는 건 잠깐 쉬기</span>)}
            </section>
          )}

          <section className="card" style={{ background: '#F7F7F5', gap: 2, paddingBottom: 22 }}>
            <b style={{ fontSize: 15, marginBottom: 4 }}>캡처에서 읽은 종목 {saved.holdings.length}개</b>
            {(showAll ? saved.holdings : saved.holdings.slice(0, 4)).map((h) => (
              <div key={h.name} className="anzHold"><span><b>{h.name}</b><small>{BUCKETS[h.bucket].label}</small></span><b>{h.weight.toFixed(1)}%</b></div>
            ))}
            {saved.holdings.length > 4 && <button type="button" className="linkBtn" onClick={() => setShowAll(!showAll)}>{showAll ? '접기' : `${saved.holdings.length - 4}개 더 보기`}</button>}
            <span className="small" style={{ color: '#6B6B69', marginTop: 6 }}>잘못 읽은 게 있으면 캡처를 다시 올려주세요. <button type="button" className="linkBtn" style={{ display: 'inline', padding: 0 }} onClick={wipe}>결과 지우기</button></span>
          </section>
        </div>
      )}

      {st === 'in' && (
        <div className="card" style={{ background: '#F7F7F5', gap: 12, marginTop: d ? 12 : 0, paddingBottom: 22 }}>
          <b style={{ fontSize: 16 }}>{d ? '다시 분석하기' : '증권사 앱 보유종목 화면을 캡처해서 올려요'}</b>
          {!ready && <span className="small" style={{ color: '#A3200F', fontWeight: 700 }}>사진 분석은 준비 중이에요. 곧 열려요!</span>}
          <div className="anzThumbs">
            {imgs.map((s, i) => (
              <span key={i} className="anzThumb" style={{ backgroundImage: `url(${s})` }}>
                <button type="button" aria-label={`${i + 1}번 사진 빼기`} onClick={() => setImgs(imgs.filter((_, j) => j !== i))}>×</button>
              </span>
            ))}
            {imgs.length < MAX && (
              <label className="anzAdd">
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => pick(e.target.files)} style={{ display: 'none' }} />
                <b>＋</b><small>{imgs.length}/{MAX}</small>
              </label>
            )}
          </div>
          <span className="small" style={{ color: '#3D3D3B' }}>🔒 종목 이름이랑 비중만 읽어요. 계좌번호·금액은 저장 안 하고, 사진은 분석 뒤 바로 버려요.</span>
          {err && <p role="alert" className="small" style={{ margin: 0, color: '#A3200F', fontWeight: 700 }}>{err}</p>}
          <button type="button" className="cta" disabled={!imgs.length || busy || !ready} onClick={run} style={{ opacity: !imgs.length || busy || !ready ? 0.45 : 1 }}>
            {busy ? '읽는 중… (최대 30초)' : `분석하기${imgs.length ? ` (${imgs.length}장)` : ''}`}<Arrow />
          </button>
        </div>
      )}
      <p className="note" style={{ margin: '12px 12px 0' }}>교육용 비교예요. 특정 종목을 사라는 게 아니고, 최종 판단은 본인이 해요.</p>
    </section>
  );
}
