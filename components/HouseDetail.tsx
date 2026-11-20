'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from './ui';
import type { HUnit, Notice } from '@/lib/house/types';
import { daysLeft, moneySteps, pyeongOf, roomsOf, won } from '@/lib/house/calc';

function checks(n: Notice): string[] {
  const out: string[] = [];
  const sum = (k: 'newlywed' | 'youth' | 'family' | 'first') => n.units.reduce((s, u) => s + (u.sp?.[k] ?? 0), 0);
  if (n.src === 'applyhome') {
    out.push('청약통장이 있어야 해요');
    out.push('보통 집이 없어야(무주택) 유리해요');
    if (sum('newlywed')) out.push(`신혼부부 특별공급 ${sum('newlywed')}세대`);
    if (sum('youth')) out.push(`청년 특별공급 ${sum('youth')}세대`);
    if (sum('first')) out.push(`생애최초 특별공급 ${sum('first')}세대`);
    if (sum('family')) out.push(`다자녀·신생아 특별공급 ${sum('family')}세대`);
  } else if (n.src === 'remndr') {
    out.push('청약통장 없이도 되는 경우가 많아요');
    out.push('먼저 받은 사람이 우선일 수 있어요 (공고문 확인)');
  } else {
    if (n.who.includes('youth')) out.push('청년 (보통 만 19~39세)');
    if (n.who.includes('newlywed')) out.push('신혼부부·예비부부');
    if (n.who.includes('family')) out.push('아이 있는 가정');
    out.push('집이 없어야 해요 (무주택)');
  }
  if (n.note) out.push(n.note);
  return out;
}

export default function HouseDetail({ id }: { id: string }) {
  const [n, setN] = useState<Notice | null>(null);
  const [err, setErr] = useState('');
  const [sel, setSel] = useState(0);
  useEffect(() => {
    fetch(`/api/house/?id=${encodeURIComponent(id)}`).then((r) => r.json()).then((j) => (j.ok ? setN(j.notice) : setErr('이미 마감됐거나 사라진 공고예요.'))).catch(() => setErr('불러오지 못했어요.'));
  }, [id]);

  const units: HUnit[] = n ? [...n.units].sort((a, b) => a.area - b.area) : [];
  const u = units[sel];
  const steps = n && u ? moneySteps(n, u) : [];
  const dl = n ? daysLeft(n.end) : null;

  return (
    <main className="app">
      <header style={{ padding: '28px 24px 0' }}>
        <Link href="/house/" className="hBack">← 청약 목록</Link>
        {n && <h1 className="title" style={{ wordBreak: 'keep-all' }}>{n.name}</h1>}
        {n && <p className="hWhere" style={{ marginTop: 8 }}>{n.cat} · {n.addr ?? `${n.sido} ${n.gu ?? ''}`}</p>}
      </header>
      <div style={{ padding: '18px 24px 130px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {err && <p className="hWarn">{err}</p>}
        {!n && !err && <p className="hSum">불러오는 중…</p>}
        {n && (
          <>
            {units.length > 1 && (
              <div className="hChips" role="group" aria-label="주택형 고르기">
                {units.map((x, i) => (
                  <button key={x.ty + i} type="button" className={`hChip${i === sel ? ' on' : ''}`} aria-pressed={i === sel} onClick={() => setSel(i)}>{pyeongOf(x)}평 · {x.ty.replace(/^0*(\d+)\.\d+/, '$1')}</button>
                ))}
              </div>
            )}
            {u ? (
              <section className="hBox dark">
                <span className="hLab y">되면 이런 집</span>
                <b className="hBig">{pyeongOf(u)}평 · 방 약 {roomsOf(u.area, n.src === 'applyhome' || n.src === 'remndr')}개</b>
                <span className="hSmall">전용 {u.area}㎡{u.count ? ` · 이번에 ${u.count}세대` : ''}{n.move ? ` · ${n.move.replace('.', '년 ')}월 입주` : ''}</span>
              </section>
            ) : (
              <section className="hBox dark"><span className="hLab y">되면 이런 집</span><b className="hBig" style={{ fontSize: 22 }}>면적·방은 공고문에서 확인</b></section>
            )}
            <section className="hBox y">
              <span className="hLab">얼마 필요해?</span>
              {steps.length ? steps.map((s) => (
                <div key={s.label} className="hLine"><span>{s.label}{s.sub && <small>{s.sub}</small>}</span><b>{s.v}</b></div>
              )) : <p className="hSmall k">이 공고는 금액이 공고문 파일에만 있어요. 아래 버튼으로 확인해주세요.</p>}
              {n.kind === 'sale' && u?.price && <p className="hSmall k">분양가 {won(u.price)}원 (최고가 기준) · 비율은 보통 기준이라 공고마다 달라요</p>}
            </section>
            <section className="hBox w">
              <span className="hLab">나 신청 돼?</span>
              {checks(n).map((c) => <p key={c} className="hOk"><i aria-hidden="true">✓</i>{c}</p>)}
              <p className="hSmall k">정확한 자격(나이·소득·자산)은 공고문이 기준이에요.</p>
            </section>
            <section className="hBox w">
              <span className="hLab">일정</span>
              {n.start && <div className="hLine"><span>접수</span><b>{n.start === n.end ? n.start : `${n.start} ~ ${n.end}`}</b></div>}
              {!n.start && n.end && <div className="hLine"><span>마감</span><b>{n.end}</b></div>}
              {n.win && <div className="hLine"><span>당첨 발표</span><b>{n.win}</b></div>}
              {n.tel && <div className="hLine"><span>문의</span><b><a href={`tel:${n.tel}`}>{n.tel}</a></b></div>}
            </section>
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="hGo"><span>신청하러 가기{dl != null ? ` · ${dl <= 0 ? '오늘 마감' : `D-${dl}`}` : ''}</span><span aria-hidden="true">→</span></a>
            {n.doc && <a href={n.doc} target="_blank" rel="noopener noreferrer" className="hGo w"><span>모집공고문 보기</span><span aria-hidden="true">→</span></a>}
          </>
        )}
      </div>
      <BottomNav active="house" />
    </main>
  );
}
