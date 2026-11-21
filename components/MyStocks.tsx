'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BUCKETS, BUCKET_KEYS, diagnose, type Bucket, type Holding } from '@/lib/buckets';
import { PLANS, type Goal } from '@/lib/plans';
import { etfTitle, etfSubtitle } from '@/lib/format';
import { SIGNAL } from '@/lib/my/signal';
import type { Pos, Row } from '@/lib/my/types';
import { goLogin } from '@/lib/useJup';
import { useLive } from '@/lib/live';
import { Arrow, Sticker } from './ui';
import { useLang } from './Lang';
import { PLAN_EN } from '@/lib/plans';

const MAX = 10;
async function shrink(f: File): Promise<string> {
  const bmp = await createImageBitmap(f);
  const k = Math.min(1, 1568 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}
const krw = (n: number, en = false) => en ? (n >= 1e6 ? `₩${(n / 1e6).toFixed(1)}M` : `₩${Math.round(n).toLocaleString('en-US')}`) : (n >= 1e8 ? `${(n / 1e8).toFixed(n >= 1e9 ? 0 : 1)}억` : n >= 1e4 ? `${Math.round(n / 1e4).toLocaleString('ko-KR')}만` : Math.round(n).toLocaleString('ko-KR')) + '원';
const price = (n: number, m: 'kr' | 'us', en = false) => (m === 'us' ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : en ? `₩${Math.round(n).toLocaleString('en-US')}` : `${Math.round(n).toLocaleString('ko-KR')}원`);
const sgn = (n: number, d = 1) => `${n > 0 ? '+' : ''}${n.toFixed(d)}%`;
type Found = { code: string; name: string; rc: string; market: 'kr' | 'us'; where: string; bucket: Bucket };
type Cand = Pos & { found?: boolean; keep?: boolean };
const toPos = (r: Row | Cand): Pos => ({ id: r.id, name: r.name, code: r.code, rc: r.rc, market: r.market, qty: r.qty, avg: r.avg, bucket: r.bucket });

function NumIn({ label, value, onChange, unit }: { label: string; value: number; onChange: (n: number) => void; unit: string }) {
  return (
    <label className="myNum"><span>{label}</span>
      <span><input type="number" inputMode="decimal" min={0} value={value || ''} placeholder="0" onChange={(e) => onChange(Number(e.target.value) || 0)} /><small>{unit}</small></span>
    </label>
  );
}

function Card({ r, open, onToggle, onEdit, onDelete }: { r: Row; open: boolean; onToggle: () => void; onEdit: (p: Pos) => void; onDelete: () => void }) {
  const en = useLang() === 'en';
  const t = (ko: string, e: string) => (en ? e : ko);
  const bl = (b: Bucket) => (en ? BUCKETS[b].labelEn : BUCKETS[b].label);
  const i = r.info;
  const s = i ? SIGNAL[i.signal] : null;
  const [edit, setEdit] = useState(false);
  const [qty, setQty] = useState(r.qty), [avg, setAvg] = useState(r.avg), [bk, setBk] = useState<Bucket>(r.bucket);
  return (
    <article className="myCard">
      <button type="button" className="myTop" onClick={onToggle} aria-expanded={open}>
        <span style={{ minWidth: 0 }}><b>{r.name}</b><small>{r.code} · {r.market === 'us' ? t('미국', 'US') : t('한국', 'Korea')} · {bl(r.bucket)}</small></span>
        {s ? <span className="mySig" style={{ background: s.bg, color: s.fg }}>{en ? s.labelEn : s.label}</span> : <span className="mySig" style={{ background: '#E2E2DE' }}>{t('가격 확인 중', 'Checking price')}</span>}
      </button>
      {i && (
        <div className="myNums">
          <span><small>{t('지금', 'Now')}</small><b>{price(i.last, r.market, en)}</b><em style={{ color: i.d1 >= 0 ? '#C0281A' : '#1A3FA8' }}>{sgn(i.d1, 2)}</em></span>
          <span><small>{t('내 수익', 'My return')}</small><b style={{ color: i.pnl == null ? '#111' : i.pnl >= 0 ? '#C0281A' : '#1A3FA8' }}>{i.pnl == null ? '—' : sgn(i.pnl * 100)}</b><em>{r.valueKrw ? krw(r.valueKrw, en) : ''}</em></span>
          <span><small>{t('최고점 대비', 'From peak')}</small><b>{sgn(i.dd * 100)}</b><em>{t('1년 기준', '1 year')}</em></span>
        </div>
      )}
      {i && <p className="myWhy">{en ? i.whyEn ?? i.why : i.why}</p>}
      {i && (
        <div className="myRange" aria-label={en ? `At ${Math.round(i.pos * 100)}% of the 1-year range` : `1년 중 ${Math.round(i.pos * 100)}% 위치`}>
          <span className="lo">{t('1년 최저', '1y low')}</span><span className="track"><i style={{ left: `${Math.round(i.pos * 100)}%` }} /></span><span className="hi">{t('최고', 'High')}</span>
        </div>
      )}
      {open && i && (
        <div className="myMore">
          <b style={{ fontSize: 14 }}>{t('내 체크리스트 (어깨에서 팔아본다)', 'My checklist (sell at the shoulder)')} · {i.count}/4</b>
          {i.checks.map((c) => <p key={c.key} className={`myChk${c.on ? ' on' : ''}`}><i aria-hidden="true">{c.on ? '✓' : ''}</i>{en ? c.labelEn ?? c.label : c.label}</p>)}
          <span className="small" style={{ color: '#6B6B69' }}>{t('2개면 절반, 4개 이상이면 전량 정리 고려 (일지에 적어둔 내 규칙). 탐욕지수·분위기·욕심은 직접 체크해요.', '2 checks: consider selling half. 4+: consider selling all (my own rule). Check greed index, mood and FOMO yourself.')}</span>
          {!edit ? (
            <div className="myBtns"><button type="button" onClick={() => setEdit(true)}>{t('수량·평단 고치기', 'Edit shares·avg price')}</button><button type="button" onClick={onDelete}>{t('빼기', 'Remove')}</button></div>
          ) : (
            <div className="myEdit">
              <NumIn label={t('보유 수량', 'Shares')} value={qty} onChange={setQty} unit={t('주', 'sh')} />
              <NumIn label={t('평균 매수가', 'Avg price')} value={avg} onChange={setAvg} unit={r.market === 'us' ? '$' : t('원', '₩')} />
              <label className="myNum"><span>{t('칸', 'Group')}</span><select value={bk} onChange={(e) => setBk(e.target.value as Bucket)}>{BUCKET_KEYS.filter((b) => b !== 'cash').map((b) => <option key={b} value={b}>{bl(b)}</option>)}</select></label>
              <button type="button" className="cta" onClick={() => { onEdit({ ...toPos(r), qty, avg, bucket: bk }); setEdit(false); }}>{t('저장', 'Save')}<Arrow /></button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function MyStocks({ goal }: { goal: Goal }) {
  useLive();
  const en = useLang() === 'en';
  const t = (ko: string, e: string) => (en ? e : ko);
  const bl = (b: Bucket) => (en ? BUCKETS[b].labelEn : BUCKETS[b].label);
  const [st, setSt] = useState<'loading' | 'out' | 'in'>('loading');
  const [rows, setRows] = useState<Row[]>([]);
  const [target, setTarget] = useState(0.5);
  const [canScan, setCanScan] = useState(false);
  const [mode, setMode] = useState<'' | 'scan' | 'add'>('');
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [imgs, setImgs] = useState<string[]>([]);
  const [cands, setCands] = useState<Cand[] | null>(null);
  const [q, setQ] = useState(''); const [found, setFound] = useState<Found[]>([]); const [sel, setSel] = useState<Found | null>(null);
  const [qty, setQty] = useState(0); const [avg, setAvg] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const j = await fetch('/api/my/', { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
    if (!j) { setSt('out'); return; }
    setSt(j.loggedIn ? 'in' : 'out'); setCanScan(Boolean(j.scan));
    if (j.loggedIn) { setRows(j.rows ?? []); setTarget(j.target ?? 0.5); }
  }
  useEffect(() => { load(); }, []);

  async function save(list: Pos[], t = target) {
    setBusy(true);
    await fetch('/api/my/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ list, target: t }) }).catch(() => {});
    await load(); setBusy(false);
  }
  const listNow = () => rows.map(toPos);

  // 직접 넣기: 검색
  useEffect(() => {
    if (mode !== 'add' || !q.trim() || sel) { setFound([]); return; }
    const t = setTimeout(() => fetch(`/api/my/search/?q=${encodeURIComponent(q.trim())}`).then((r) => r.json()).then((j) => setFound(j.items ?? [])).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [q, mode, sel]);

  async function pick(files: FileList | null) {
    if (!files) return;
    const room = MAX - imgs.length;
    const arr = [...files].filter((f) => f.type.startsWith('image/')).slice(0, room);
    const out = await Promise.all(arr.map((f) => shrink(f).catch(() => '')));
    setImgs((p) => [...p, ...out.filter(Boolean)]);
    if (fileRef.current) fileRef.current.value = '';
  }
  async function scan() {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/my/scan/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ images: imgs }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error ?? t('읽지 못했어요', 'Couldn’t read it')); return; }
      setCands((j.items as Cand[]).map((c) => ({ ...c, keep: c.found !== false })));
      setImgs([]);
    } catch { setErr(t('읽지 못했어요. 잠시 뒤 다시 해봐요', 'Couldn’t read it. Try again in a bit')); } finally { setBusy(false); }
  }
  async function addCands() {
    const add = (cands ?? []).filter((c) => c.keep && c.code).map(toPos);
    const cur = listNow().filter((p) => !add.some((a) => a.rc === p.rc));
    setCands(null); setMode('');
    await save([...cur, ...add]);
  }
  async function addOne() {
    if (!sel) return;
    const p: Pos = { id: `m${Date.now()}`, name: sel.name, code: sel.code, rc: sel.rc, market: sel.market, qty, avg, bucket: sel.bucket };
    setSel(null); setQ(''); setQty(0); setAvg(0); setMode('');
    await save([...listNow().filter((x) => x.rc !== p.rc), p]);
  }

  const total = rows.reduce((s, r) => s + (r.valueKrw ?? 0), 0);
  const cost = rows.reduce((s, r) => s + (r.info && r.avg && r.qty ? (r.valueKrw ?? 0) / (r.info.last / r.avg) : 0), 0);
  const pnlAll = cost > 0 ? total / cost - 1 : null;
  const hold: Holding[] = rows.map((r) => ({ name: r.name, ticker: r.code, bucket: r.bucket, weight: r.valueKrw ?? 1 }));
  const d = rows.length ? diagnose(hold, goal) : null;
  const counts = (['pick', 'wait', 'hold', 'take'] as const).map((k) => [k, rows.filter((r) => r.info?.signal === k).length] as const).filter(([, n]) => n);

  return (
    <section className="anz" id="my" aria-label={t('내 주식', 'My stocks')}>
      <div className="anzHead"><h2 style={{ margin: 0 }}>{t('내 주식', 'My stocks')}<br /><span>{t('줍줍? 기다림?', 'Pick up? Wait?')}</span></h2></div>

      {st === 'out' && (
        <div className="card dark" style={{ gap: 12, paddingBottom: 22 }}>
          <p style={{ margin: 0, fontSize: 22, lineHeight: 1.3, fontWeight: 800, letterSpacing: '-0.04em' }}>{en ? <>Add your stocks and get<br />pick up · wait · take profit every day.</> : <>내 주식 넣어두면<br />줍줍·기다림·챙기기를 매일 알려줄게.</>}</p>
          <button type="button" className="cta light" onClick={goLogin}>{t('로그인하고 시작하기', 'Log in to start')}<Arrow color="#111" /></button>
        </div>
      )}

      {st === 'in' && rows.length > 0 && (
        <section className="card dark" style={{ gap: 10 }}>
          <span className="small" style={{ color: '#BDBDBA', fontWeight: 700 }}>{en ? `${rows.length} stocks · live` : `내 주식 ${rows.length}개 · 실시간`}</span>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.1 }}>{total ? krw(total) : '—'}{pnlAll != null && <span style={{ fontSize: 20, marginLeft: 10, color: pnlAll >= 0 ? '#FF8A7A' : '#9CC3FF' }}>{sgn(pnlAll * 100)}</span>}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{counts.map(([k, n]) => <span key={k} className="mySig" style={{ background: SIGNAL[k].bg, color: SIGNAL[k].fg }}>{SIGNAL[k].label} {n}</span>)}</div>
        </section>
      )}

      {st === 'in' && (
        <div className="myAdd">
          <button type="button" className={mode === 'scan' ? 'on' : ''} onClick={() => { setMode(mode === 'scan' ? '' : 'scan'); setErr(''); }}>{t('📷 캡처로 넣기', '📷 Add from screenshot')}</button>
          <button type="button" className={mode === 'add' ? 'on' : ''} onClick={() => { setMode(mode === 'add' ? '' : 'add'); setErr(''); }}>{t('＋ 직접 넣기', '＋ Add manually')}</button>
        </div>
      )}

      {st === 'in' && mode === 'scan' && !cands && (
        <div className="card" style={{ background: '#F7F7F5', gap: 12, paddingBottom: 22 }}>
          <b style={{ fontSize: 16 }}>{t("증권사 앱 '보유종목' 화면을 캡처해서 올려요", 'Upload a screenshot of your broker app’s holdings screen')}</b>
          {!canScan && <span className="small" style={{ color: '#A3200F', fontWeight: 700 }}>{t('사진 읽기는 곧 열려요. 지금은 직접 넣기를 써주세요.', 'Photo reading opens soon. Please add manually for now.')}</span>}
          <div className="anzThumbs">
            {imgs.map((s, i) => <span key={i} className="anzThumb" style={{ backgroundImage: `url(${s})` }}><button type="button" aria-label={en ? `Remove photo ${i + 1}` : `${i + 1}번 사진 빼기`} onClick={() => setImgs(imgs.filter((_, j) => j !== i))}>×</button></span>)}
            {imgs.length < MAX && <label className="anzAdd"><input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => pick(e.target.files)} style={{ display: 'none' }} /><b>＋</b><small>{imgs.length}/{MAX}</small></label>}
          </div>
          <span className="small" style={{ color: '#3D3D3B' }}>{t('🔒 계좌번호·이름이 보이면 가리고 올려주세요. 종목·수량·평단만 읽고, 사진은 읽은 뒤 바로 버려요.', '🔒 Cover your account number and name. We only read tickers, shares and avg price, and delete the photo right after.')}</span>
          {err && <p role="alert" className="small" style={{ margin: 0, color: '#A3200F', fontWeight: 700 }}>{err}</p>}
          <button type="button" className="cta" disabled={!imgs.length || busy || !canScan} onClick={scan} style={{ opacity: !imgs.length || busy || !canScan ? 0.45 : 1 }}>{busy ? t('읽는 중… (최대 30초)', 'Reading… (up to 30s)') : en ? `Read${imgs.length ? ` (${imgs.length})` : ''}` : `읽기${imgs.length ? ` (${imgs.length}장)` : ''}`}<Arrow /></button>
        </div>
      )}

      {st === 'in' && cands && (
        <div className="card" style={{ background: '#F2F28E', gap: 10, paddingBottom: 22 }}>
          <b style={{ fontSize: 17 }}>{t('이렇게 읽었어요. 맞는지 확인해줘요', 'Here’s what we read. Please check it')}</b>
          {cands.map((c, i) => (
            <div key={c.id} className="myCand">
              <label className="myKeep"><input type="checkbox" checked={Boolean(c.keep)} onChange={(e) => setCands(cands.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} /><span><b>{c.name}</b><small>{c.code || t('코드 못 찾음', 'No code found')} · {c.market === 'us' ? t('미국', 'US') : t('한국', 'Korea')}{c.found === false ? t(' · 검색 안 됨', ' · not found') : ''}</small></span></label>
              <div className="myEdit row2">
                <NumIn label={t('수량', 'Shares')} value={c.qty} onChange={(n) => setCands(cands.map((x, j) => (j === i ? { ...x, qty: n } : x)))} unit={t('주', 'sh')} />
                <NumIn label={t('평단', 'Avg')} value={c.avg} onChange={(n) => setCands(cands.map((x, j) => (j === i ? { ...x, avg: n } : x)))} unit={c.market === 'us' ? '$' : t('원', '₩')} />
              </div>
            </div>
          ))}
          <button type="button" className="cta" disabled={busy} onClick={addCands}>{busy ? t('저장 중…', 'Saving…') : t('이대로 내 주식에 넣기', 'Add these to my stocks')}<Arrow /></button>
          <button type="button" className="linkBtn" onClick={() => setCands(null)}>{t('취소', 'Cancel')}</button>
        </div>
      )}

      {st === 'in' && mode === 'add' && (
        <div className="card" style={{ background: '#F7F7F5', gap: 10, paddingBottom: 22 }}>
          {!sel ? (
            <>
              <label className="myNum"><span>{t('종목 이름이나 코드', 'Stock name or ticker')}</span><span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('삼성전자, 엔비디아, TSLA…', 'NVDA, TSLA, Samsung…')} autoFocus /></span></label>
              {found.map((f) => (
                <button key={f.rc} type="button" className="myFound" onClick={() => setSel(f)}><span><b>{f.name}</b><small>{f.code} · {f.where}</small></span><Arrow /></button>
              ))}
            </>
          ) : (
            <>
              <div className="row"><b style={{ fontSize: 18 }}>{sel.name}</b><button type="button" className="linkBtn" onClick={() => setSel(null)}>{t('다른 종목', 'Pick another')}</button></div>
              <div className="myEdit row2">
                <NumIn label={t('보유 수량', 'Shares')} value={qty} onChange={setQty} unit={t('주', 'sh')} />
                <NumIn label={t('평균 매수가', 'Avg price')} value={avg} onChange={setAvg} unit={sel.market === 'us' ? '$' : t('원', '₩')} />
              </div>
              <span className="small" style={{ color: '#6B6B69' }}>{t('모르면 비워도 돼요. 대신 수익률·비중 계산이 빠져요.', 'Leave blank if unsure. Returns and weights just won’t be calculated.')}</span>
              <button type="button" className="cta" disabled={busy} onClick={addOne}>{busy ? t('저장 중…', 'Saving…') : t('내 주식에 넣기', 'Add to my stocks')}<Arrow /></button>
            </>
          )}
        </div>
      )}

      {st === 'in' && rows.length === 0 && mode === '' && (
        <div className="card" style={{ background: '#F7F7F5', gap: 6, paddingBottom: 22 }}>
          <b style={{ fontSize: 16 }}>{t('아직 넣은 주식이 없어요', 'No stocks added yet')}</b>
          <span className="small">{t('캡처로 한 번에, 또는 직접 하나씩 넣어봐요.', 'Add them all from a screenshot, or one by one.')}</span>
        </div>
      )}

      {st === 'in' && rows.length > 0 && (
        <div className="myList">
          {rows.map((r) => (
            <Card key={r.id} r={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)}
              onEdit={(p) => save(listNow().map((x) => (x.id === p.id ? p : x)))}
              onDelete={() => { if (window.confirm(en ? `Remove ${r.name}?` : `${r.name}을(를) 뺄까요?`)) save(listNow().filter((x) => x.id !== r.id)); }} />
          ))}
          <div className="myTarget">
            <span>{t('내 목표수익', 'My profit goal')}</span>
            {[0.3, 0.5, 1].map((t) => <button key={t} type="button" className={target === t ? 'on' : ''} onClick={() => save(listNow(), t)}>+{Math.round(t * 100)}%</button>)}
          </div>
        </div>
      )}

      {st === 'in' && d && (
        <div className="stack keep" style={{ padding: 0, marginTop: 12 }}>
          <section className="card" style={{ background: '#fff', gap: 4 }}>
            <div className="row" style={{ marginBottom: 4 }}><b style={{ fontSize: 16 }}>{t('내 포트폴리오에 뭐가 부족해?', 'What’s my portfolio missing?')}</b><span className="small" style={{ color: '#6B6B69' }}>┃ = {en ? PLAN_EN[goal].label : PLANS[goal].label}</span></div>
            {d.rows.map((x) => (
              <div key={x.b} className="anzGap">
                <span>{bl(x.b)}</span>
                <span className="anzTrack"><span className="me" style={{ width: `${Math.min(x.me, 100)}%`, background: x.diff >= 10 ? '#FF5A3C' : '#111' }} />{x.goal > 0 && <span className="goal" style={{ left: `${x.goal}%` }} />}</span>
                <b style={{ color: x.diff <= -5 ? '#1A3FA8' : x.diff >= 10 ? '#A3200F' : '#6B6B69' }}>{x.diff > 0 ? '+' : ''}{Math.round(x.diff)}</b>
              </div>
            ))}
            <span className="small" style={{ color: '#6B6B69', marginTop: 6 }}>{t('위에서 고른 목표(1~4번)를 바꾸면 비교도 바뀌어요.', 'Change the goal above (1–4) and the comparison changes too.')}</span>
          </section>
          {d.lack.length > 0 && (
            <section className="card" style={{ background: '#C9DDF7', gap: 10 }}>
              <b style={{ fontSize: 18, letterSpacing: '-0.03em' }}>{t('새 돈이 생기면 여기부터', 'Got new money? Start here')}</b>
              {d.lack.map((l, i) => (
                <div key={l.b} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <b style={{ fontSize: 15 }}>{i + 1}. {bl(l.b)} <span style={{ color: '#1A3FA8' }}>{Math.round(l.diff)}%</span></b>
                  {l.picks.map((e) => (
                    <Link key={e.id} href={`/etf/${e.id}/`} className="anzPick"><span style={{ minWidth: 0 }}><b>{etfTitle(e, en ? 'en' : 'ko')}</b><small>{etfSubtitle(e, en ? 'en' : 'ko')}</small></span><Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} /></Link>
                  ))}
                </div>
              ))}
            </section>
          )}
          {d.over.length > 0 && (
            <section className="card" style={{ background: '#FFD6CC', gap: 6 }}>
              <b style={{ fontSize: 16 }}>{t('너무 몰린 칸', 'Too concentrated')}</b>
              {d.over.map((o) => <span key={o.b} className="small" style={{ fontSize: 14 }}><b>{bl(o.b)}</b> {en ? `+${Math.round(o.diff)}% over goal · pause new buys here` : `목표보다 +${Math.round(o.diff)}% · 새로 사는 건 잠깐 쉬기`}</span>)}
            </section>
          )}
        </div>
      )}
      <p className="note" style={{ margin: '12px 12px 0' }}>{t('줍줍·기다림·챙기기는 가격 데이터와 내가 정한 규칙으로 계산한 참고 신호예요. 사라·팔라는 투자 권유가 아니고, 최종 판단은 본인이 해요.', 'Pick up · Wait · Take profit are reference signals from price data and your own rules. Not a recommendation to buy or sell; the final call is yours.')}</p>
    </section>
  );
}
