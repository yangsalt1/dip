'use client';
import { Brand } from './Lang';
import { useState } from 'react';
import Link from 'next/link';
import { PLANS, pensionCalc, type Goal } from '@/lib/plans';
import { won } from '@/lib/format';
import { BottomNav, Disclaimer } from './ui';
import MyStocks from './MyStocks';

const ORDER: Goal[] = ['grow', 'dividend', 'balance', 'pension'];

function NumberField({ id, label, value, unit, onChange, presets }: { id: string; label: string; value: number; unit: string; onChange: (v: number) => void; presets: number[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label htmlFor={id} className="fieldlabel">{label}</label>
      <div className="money-input">
        <input id={id} type="number" inputMode="numeric" min={0} value={value} onChange={(e) => { const v = Number(e.target.value); onChange(isNaN(v) ? 0 : v); }} />
        <b style={{ fontSize: 22 }}>{unit}</b>
      </div>
      <div className="pills">
        {presets.map((p) => <button key={p} type="button" className="pill outline" style={{ fontSize: 14 }} onClick={() => onChange(p)}>{p.toLocaleString('ko-KR')}만</button>)}
      </div>
    </div>
  );
}

export default function Money() {
  const [goal, setGoal] = useState<Goal>('balance');
  const [amount, setAmount] = useState(100);
  const [yearly, setYearly] = useState(900);
  const [lowPay, setLowPay] = useState(true);
  const plan = PLANS[goal];
  const isPension = goal === 'pension';
  const base = (isPension ? yearly : amount) * 10000;
  const pc = pensionCalc(yearly, lowPay);

  return (
    <main className="app">
      <header className="hdr">
        <div>
          <Brand />
          <h1 className="title">포트폴리오<br /><span>짜보기</span></h1>
        </div>
        <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <a href="#my" className="pill" style={{ fontSize: 13, minHeight: 36, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', background: '#111', color: '#fff' }}>내 주식 ↓</a>
          <Link href="/jup/" className="pill outline" style={{ fontSize: 13, minHeight: 36, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>내 줍줍리스트 →</Link>
        </div>
      </header>

      <div className="split">
      <div className="splitL">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '22px 24px 0' }}>
        <span className="fieldlabel">목표가 뭐야?</span>
        <div className="grid2 goals" role="radiogroup" aria-label="목표">
          {ORDER.map((k, i) => {
            const on = goal === k;
            return (
              <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setGoal(k)}
                style={{ minHeight: 96, borderRadius: 26, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '14px 16px', textAlign: 'left', background: on ? PLANS[k].color : '#F7F7F5', border: `2px solid ${on ? '#111' : 'transparent'}` }}>
                <b style={{ fontSize: 24, lineHeight: 1 }}>{i + 1}</b>
                <b style={{ fontSize: 16, lineHeight: 1.25 }}>{PLANS[k].label}</b>
              </button>
            );
          })}
        </div>
        <p className="small" style={{ margin: 0, fontSize: 14, color: '#3D3D3B' }}>{plan.desc}</p>
      </div>

      <div style={{ padding: '22px 24px 0' }}>
        {!isPension ? (
          <NumberField id="amount" label="얼마 넣을 거야?" value={amount} unit="만원" onChange={setAmount} presets={[100, 500, 1000]} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="fieldlabel">내 연봉(총급여)은?</span>
            <div className="seg" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <button type="button" aria-pressed={lowPay} onClick={() => setLowPay(true)} style={{ fontSize: 14 }}>5,500만원 이하</button>
              <button type="button" aria-pressed={!lowPay} onClick={() => setLowPay(false)} style={{ fontSize: 14 }}>5,500만원 초과</button>
            </div>
            <NumberField id="yearly" label="1년에 얼마 넣을 거야?" value={yearly} unit="만원/년" onChange={setYearly} presets={[600, 900, 1800]} />
            <section className="card dark" aria-label="연금 계산 결과" style={{ padding: 22, gap: 14 }}>
              <span className="small" style={{ color: '#BDBDBA', fontSize: 14, fontWeight: 700 }}>내년 연말정산 때 돌려받는 돈</span>
              <span className="big" style={{ fontSize: 52, fontWeight: 500 }}>{Math.round(pc.refund).toLocaleString('ko-KR')}원</span>
              <span className="small" style={{ color: '#CFCFCB' }}>세액공제 대상 {pc.credit.toLocaleString('ko-KR')}만원 × {lowPay ? '16.5%' : '13.2%'}</span>
              <div className="grid2">
                <div className="box" style={{ background: '#2A2A2A' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#BDBDBA' }}>연금저축에</span><br /><b style={{ fontSize: 22 }}>{pc.saving.toLocaleString('ko-KR')}만원</b></div>
                <div className="box" style={{ background: '#2A2A2A' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#BDBDBA' }}>IRP에</span><br /><b style={{ fontSize: 22 }}>{pc.irp.toLocaleString('ko-KR')}만원</b></div>
              </div>
              <b style={{ fontSize: 15 }}>매달 {won(pc.monthly)}씩 넣으면 돼요</b>
              {pc.note && <span className="box" style={{ background: '#F2F28E', color: '#111', fontSize: 14, fontWeight: 700, lineHeight: 1.45 }}>{pc.note}</span>}
            </section>
          </div>
        )}
      </div>

      </div>
      <div className="splitR">
      <div className="stack keep" style={{ paddingTop: 22 }}>
        <span className="fieldlabel" style={{ padding: '0 12px 10px' }}>이렇게 나눠 담아봐</span>
        {plan.rows.map(([name, etf, p, bg], i) => (
          <div key={name + etf} className="card" style={{ background: bg, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: i === plan.rows.length - 1 ? '18px 20px 20px' : '18px 20px 40px' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <b style={{ fontSize: 20, lineHeight: 1.15, letterSpacing: '-0.035em' }}>{name}</b>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2E2E2C' }}>{etf}</span>
              <b style={{ fontSize: 15, paddingTop: 4 }}>{won((base * p) / 100)}{isPension ? ' / 년' : ''}</b>
            </span>
            <span style={{ fontSize: 46, fontWeight: 500, lineHeight: 0.9, letterSpacing: '-0.05em' }}>{p}<span style={{ fontSize: 22 }}>%</span></span>
          </div>
        ))}
      </div>

      {isPension && (
        <ul style={{ margin: '14px 12px 0', padding: '18px 20px 18px 36px', borderRadius: 24, background: '#F7F7F5', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: '#2E2E2C' }}>
          <li>연금계좌에선 한국에 상장된 ETF만 살 수 있어요. VOO 대신 TIGER 미국S&amp;P500처럼.</li>
          <li>IRP는 주식형(위험자산)을 70%까지만 담을 수 있어서 채권을 30% 넣었어요.</li>
          <li>레버리지·인버스 ETF는 못 사요.</li>
          <li>55세 전에 깨면 돌려받은 세금을 16.5%로 다시 내야 해요.</li>
        </ul>
      )}

      <Disclaimer><b style={{ color: '#111' }}>이건 그냥 추천이에요.</b> 목표만 보고 대략 나눈 예시라서 원금 손실이 날 수 있어요. 세금 계산도 어림값이에요. 사기 전에 꼭 직접 확인하고, 한 번에 말고 나눠서 사세요.</Disclaimer>
      </div>
      </div>
      <MyStocks goal={goal} />
      <BottomNav active="money" />
    </main>
  );
}
