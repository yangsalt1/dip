'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from './ui';
import { EMPTY_PREF, type Notice, type Pref, type Who } from '@/lib/house/types';
import { daysLeft, matchNotice, pickUnit, pyeongOf, roomsOf, spLine, won, WHO_LABEL } from '@/lib/house/calc';
import { goLogin, useJup } from '@/lib/useJup';

const SIDO = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const SEOUL_GU = ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'];
const MONEY: [number, string][] = [[3000, '3천 이하'], [5000, '5천 이하'], [10000, '1억 이하'], [20000, '2억 이하'], [0, '상관없음']];
/** 컬러 가이드: 카드마다 돌아가며 섞어서 [배경, 글자] */
const W = '#FFFFFF', K = '#282828';
const MIX: [string, string][] = [
  ['#1283EB', W], // Azure Cornflower
  ['#FFE459', K], // Lemon and Banana
  ['#7B61FF', W], // Amethyst Bellflower
  ['#F8F3EC', K], // Creamy Milk
  ['#2BBF5D', W], // Light Malachite
  ['#FF5E54', W], // Watermelon with Carrot
  ['#282828', W], // Signal Black
];

function toggle<T>(arr: T[], v: T) { return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]; }

function Chips<T extends string | number>({ items, on, onToggle, label }: { items: [T, string][]; on: (v: T) => boolean; onToggle: (v: T) => void; label: string }) {
  return (
    <div className="hChips" role="group" aria-label={label}>
      {items.map(([v, t]) => (
        <button key={String(v)} type="button" className={`hChip${on(v) ? ' on' : ''}`} aria-pressed={on(v)} onClick={() => onToggle(v)}>{t}</button>
      ))}
    </div>
  );
}

/** 알림 켜기: 이 기기를 등록해요 */
async function enablePush(): Promise<'ok' | 'denied' | 'unsupported'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  const reg = await navigator.serviceWorker.ready;
  const { key } = await fetch('/api/push/').then((r) => r.json());
  if (!key) return 'unsupported';
  const pad = '='.repeat((4 - (key.length % 4)) % 4);
  const raw = atob((key + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const appKey = Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey }));
  await fetch('/api/push/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sub) });
  return 'ok';
}

function Setup({ init, onSave }: { init: Pref; onSave: (p: Pref) => void }) {
  const [p, setP] = useState<Pref>(init);
  const [busy, setBusy] = useState(false);
  const set = (k: Partial<Pref>) => setP((x) => ({ ...x, ...k }));
  return (
    <div className="hSetup">
      <section>
        <p className="hQ">나는? <small>여러 개 OK</small></p>
        <Chips label="나는" items={(['newlywed', 'youth', 'family', 'general'] as Who[]).map((w) => [w, WHO_LABEL[w]])} on={(v) => p.who.includes(v)} onToggle={(v) => set({ who: toggle(p.who, v) })} />
      </section>
      <section>
        <p className="hQ">어디 살고 싶어? <small>여러 개 OK · 안 고르면 전국</small></p>
        <Chips label="지역" items={SIDO.map((s) => [s, s])} on={(v) => p.sido.includes(v)} onToggle={(v) => set({ sido: toggle(p.sido, v), gu: v === '서울' && p.sido.includes('서울') ? [] : p.gu })} />
        {p.sido.includes('서울') && (
          <div className="hSub">
            <p className="hQ sm">서울 어느 구? <small>안 고르면 서울 전체</small></p>
            <Chips label="서울 구" items={SEOUL_GU.map((g) => [g, g.replace(/구$/, '')])} on={(v) => p.gu.includes(v)} onToggle={(v) => set({ gu: toggle(p.gu, v) })} />
          </div>
        )}
      </section>
      <section>
        <p className="hQ">방은? <small>여러 개 OK</small></p>
        <Chips label="방" items={[['1', '1개'], ['2', '2개'], ['3', '3개 이상']] as ['1' | '2' | '3', string][]} on={(v) => p.rooms.includes(v)} onToggle={(v) => set({ rooms: toggle(p.rooms, v) })} />
      </section>
      <section>
        <p className="hQ">어떤 집? <small>둘 다 OK</small></p>
        <Chips label="어떤 집" items={[['rent', '월세·전세 (임대)'], ['sale', '내 집 (분양)']] as ['rent' | 'sale', string][]} on={(v) => p.kind.includes(v)} onToggle={(v) => set({ kind: toggle(p.kind, v) })} />
      </section>
      <section>
        <p className="hQ">지금 쓸 수 있는 돈 <small>임대는 보증금, 분양은 계약금 기준</small></p>
        <Chips label="돈" items={MONEY} on={(v) => p.money === v} onToggle={(v) => set({ money: v })} />
      </section>
      <button type="button" className={`hPush${p.push ? ' on' : ''}`} aria-pressed={p.push} onClick={() => set({ push: !p.push })}>
        <span><b>새 공고 뜨면 알림</b><small>맞는 것만, 마감 3일 전에 한 번 더</small></span>
        <i>{p.push ? '켜짐' : '꺼짐'}</i>
      </button>
      <button type="button" className="hSave" disabled={busy} onClick={async () => { setBusy(true); try { onSave(p); } finally { setBusy(false); } }}>
        이 조건으로 찾기 <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function summary(p: Pref) {
  const a: string[] = [];
  if (p.who.length) a.push(p.who.map((w) => WHO_LABEL[w]).join('·'));
  a.push(p.gu.length ? p.gu.map((g) => g.replace(/구$/, '')).join('·') : p.sido.length ? p.sido.join('·') : '전국');
  if (p.rooms.length) a.push('방 ' + p.rooms.map((r) => (r === '3' ? '3+' : r)).join('·'));
  if (p.kind.length === 1) a.push(p.kind[0] === 'rent' ? '임대' : '분양');
  if (p.money) a.push(won(p.money) + ' 이하');
  return a.join(' · ');
}

function Card({ n, p, i }: { n: Notice; p: Pref; i: number }) {
  const units = matchNotice(n, p) ?? [];
  const u = pickUnit(n, units);
  const dl = daysLeft(n.end);
  const notYet = n.start && daysLeft(n.start)! > 0;
  const sp = spLine(n, p);
  const [bg, fg] = MIX[i % MIX.length];
  return (
    <Link href={`/house/${n.id}/`} className="hCard" style={{ background: bg, color: fg }}>
      <span className="hTop">
        {notYet ? <span className="hSt w">접수 {n.start!.slice(5).replace('-', '/')} 시작</span>
          : dl != null ? <span className={`hSt ${dl <= 3 ? 'r' : 'k'}`}>{dl <= 0 ? '오늘 마감' : `마감 D-${dl}`}</span> : <span className="hSt w">접수 중</span>}
        <span className="hCat">{n.cat}</span>
      </span>
      <b className="hName">{n.name}</b>
      <span className="hWhere">{n.sido}{n.gu ? ` ${n.gu}` : ''}</span>
      {u && (u.price || u.deposit || u.rent) ? (
        <span className="hMoney">{n.kind === 'sale' ? <>분양가 {won(u.price)}원부터</> : <>보증금 {won(u.deposit)}{u.rent ? <><br />월 {won(u.rent)}원</> : '원'}</>}</span>
      ) : <span className="hMoney sm">금액은 공고문에서 확인</span>}
      <span className="hMeta">
        {u ? `방 약 ${roomsOf(u.area, n.src === 'applyhome' || n.src === 'remndr')}개 · ${pyeongOf(u)}평` : ''}
        {sp ? `${u ? ' · ' : ''}${sp}` : ''}
      </span>
    </Link>
  );
}

export default function House() {
  const { status } = useJup();
  const [pref, setPref] = useState<Pref | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [edit, setEdit] = useState(false);
  const [list, setList] = useState<Notice[] | null>(null);
  const [err, setErr] = useState('');
  const [pushMsg, setPushMsg] = useState('');

  useEffect(() => {
    if (status !== 'in') return;
    fetch('/api/house/pref/').then((r) => r.json()).then((j) => { setPref(j.pref); setLoaded(true); if (!j.pref) setEdit(true); }).catch(() => setLoaded(true));
  }, [status]);
  useEffect(() => {
    fetch('/api/house/').then((r) => r.json()).then((j) => (j.ok ? setList(j.list) : setErr('공고를 불러오지 못했어요. 잠시 뒤 다시 열어주세요.'))).catch(() => setErr('공고를 불러오지 못했어요.'));
  }, []);

  const p = pref ?? EMPTY_PREF;
  const hits = useMemo(() => (list ?? []).filter((n) => matchNotice(n, p)), [list, p]);

  async function save(np: Pref) {
    setPref(np); setEdit(false);
    await fetch('/api/house/pref/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(np) }).catch(() => {});
    if (np.push) {
      const r = await enablePush().catch(() => 'unsupported' as const);
      setPushMsg(r === 'ok' ? '' : r === 'denied' ? '알림이 꺼져 있어요. 휴대폰 설정에서 JUP 알림을 허용해주세요.' : '이 기기는 알림을 못 받아요. 아이폰은 공유 → "홈 화면에 추가" 후 거기서 열면 돼요.');
    }
  }

  return (
    <main className="app">
      <header className="hdr">
        <div>
          <Link href="/" className="brand">JUP<small>떨어질 때 줍는다</small></Link>
          <h1 className="title">청약 <span>{edit || !pref ? '내 조건' : list ? `딱 맞는 ${hits.length}개` : '찾는 중'}</span></h1>
        </div>
      </header>

      <div style={{ padding: '6px 24px 130px' }}>
        {status === 'out' && (
          <div className="hEmpty"><b>로그인하면 내 조건을 저장하고 알림을 받을 수 있어요</b><button type="button" className="hSave" onClick={() => goLogin()}>로그인하기 →</button></div>
        )}
        {status === 'in' && loaded && (edit || !pref) && <Setup init={pref ?? EMPTY_PREF} onSave={save} />}
        {status === 'in' && pref && !edit && (
          <>
            <p className="hSum">{summary(pref)} <button type="button" onClick={() => setEdit(true)}>조건 바꾸기</button></p>
            {pushMsg && <p className="hWarn">{pushMsg}</p>}
            {err && <p className="hWarn">{err}</p>}
            {!list && !err && <p className="hSum">전국 공고 모으는 중… 처음엔 20초쯤 걸려요</p>}
            {list && hits.length === 0 && (
              <div className="hEmpty"><b>지금은 딱 맞는 공고가 없어요</b><span>새로 뜨면 바로 알려줄게요. 조건을 조금 넓혀봐도 좋아요.</span></div>
            )}
            <div className="hList">{hits.map((n, i) => <Card key={n.id} n={n} p={pref} i={i} />)}</div>
            {list && <p className="note" style={{ marginTop: 18 }}>청약홈 · LH청약플러스 · 서울 청년안심주택 공고를 모았어요. 방 개수는 면적으로 어림한 값이고, 정확한 자격·금액은 꼭 공고문에서 확인하세요.</p>}
          </>
        )}
      </div>
      <BottomNav active="house" />
    </main>
  );
}
