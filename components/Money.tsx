'use client';
import { Brand, useLang } from './Lang';
import { useState } from 'react';
import Link from 'next/link';
import { PLANS, PLAN_EN, ROW_EN, etfLineEn, pensionCalc, pensionNoteEn, type Goal } from '@/lib/plans';
import { won, wonL } from '@/lib/format';
import { BottomNav, Disclaimer } from './ui';
import MyStocks from './MyStocks';

const ORDER: Goal[] = ['grow', 'dividend', 'balance', 'pension'];

function NumberField({ id, label, value, unit, onChange, presets }: { id: string; label: string; value: number; unit: string; onChange: (v: number) => void; presets: number[] }) {
  const en = useLang() === 'en';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label htmlFor={id} className="fieldlabel">{label}</label>
      <div className="money-input">
        <input id={id} type="number" inputMode="numeric" min={0} value={value} onChange={(e) => { const v = Number(e.target.value); onChange(isNaN(v) ? 0 : v); }} />
        <b style={{ fontSize: 22 }}>{unit}</b>
      </div>
      <div className="pills">
        {presets.map((p) => <button key={p} type="button" className="pill outline" style={{ fontSize: 14 }} onClick={() => onChange(p)}>{en ? wonL(p * 10000, 'en') : `${p.toLocaleString('ko-KR')}만`}</button>)}
      </div>
    </div>
  );
}

export default function Money() {
  const lang = useLang();
  const en = lang === 'en';
  const t = (ko: string, e: string) => (en ? e : ko);
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
          <h1 className="title">{t('포트폴리오', 'Build a')}<br /><span>{t('짜보기', 'portfolio')}</span></h1>
        </div>
        <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <a href="#my" className="pill" style={{ fontSize: 13, minHeight: 36, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', background: '#111', color: '#fff' }}>{t('내 주식 ↓', 'My stocks ↓')}</a>
          <Link href="/jup/" className="pill outline" style={{ fontSize: 13, minHeight: 36, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{t('내 줍줍리스트 →', 'My dip list →')}</Link>
        </div>
      </header>

      <div className="split">
      <div className="splitL">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '22px 24px 0' }}>
        <span className="fieldlabel">{t('목표가 뭐야?', 'What’s your goal?')}</span>
        <div className="grid2 goals" role="radiogroup" aria-label={t('목표', 'Goal')}>
          {ORDER.map((k, i) => {
            const on = goal === k;
            return (
              <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setGoal(k)}
                style={{ minHeight: 96, borderRadius: 26, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '14px 16px', textAlign: 'left', background: on ? PLANS[k].color : '#F7F7F5', border: `2px solid ${on ? '#111' : 'transparent'}` }}>
                <b style={{ fontSize: 24, lineHeight: 1 }}>{i + 1}</b>
                <b style={{ fontSize: 16, lineHeight: 1.25 }}>{en ? PLAN_EN[k].label : PLANS[k].label}</b>
              </button>
            );
          })}
        </div>
        <p className="small" style={{ margin: 0, fontSize: 14, color: '#3D3D3B' }}>{en ? PLAN_EN[goal].desc : plan.desc}</p>
      </div>

      <div style={{ padding: '22px 24px 0' }}>
        {!isPension ? (
          <NumberField id="amount" label={t('얼마 넣을 거야?', 'How much are you putting in?')} value={amount} unit={t('만원', '× ₩10k')} onChange={setAmount} presets={[100, 500, 1000]} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="fieldlabel">{t('내 연봉(총급여)은?', 'Your yearly salary?')}</span>
            <div className="seg" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <button type="button" aria-pressed={lowPay} onClick={() => setLowPay(true)} style={{ fontSize: 14 }}>{t('5,500만원 이하', '₩55M or less')}</button>
              <button type="button" aria-pressed={!lowPay} onClick={() => setLowPay(false)} style={{ fontSize: 14 }}>{t('5,500만원 초과', 'Over ₩55M')}</button>
            </div>
            <NumberField id="yearly" label={t('1년에 얼마 넣을 거야?', 'How much per year?')} value={yearly} unit={t('만원/년', '× ₩10k / yr')} onChange={setYearly} presets={[600, 900, 1800]} />
            <section className="card dark" aria-label={t('연금 계산 결과', 'Pension result')} style={{ padding: 22, gap: 14 }}>
              <span className="small" style={{ color: '#BDBDBA', fontSize: 14, fontWeight: 700 }}>{t('내년 연말정산 때 돌려받는 돈', 'Tax refund at next year-end settlement')}</span>
              <span className="big" style={{ fontSize: 52, fontWeight: 500 }}>{en ? wonL(pc.refund, 'en') : `${Math.round(pc.refund).toLocaleString('ko-KR')}원`}</span>
              <span className="small" style={{ color: '#CFCFCB' }}>{en ? `Creditable ${wonL(pc.credit * 10000, 'en')}` : `세액공제 대상 ${pc.credit.toLocaleString('ko-KR')}만원`} × {lowPay ? '16.5%' : '13.2%'}</span>
              <div className="grid2">
                <div className="box" style={{ background: '#2A2A2A' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#BDBDBA' }}>{t('연금저축에', 'Pension savings')}</span><br /><b style={{ fontSize: 22 }}>{en ? wonL(pc.saving * 10000, 'en') : `${pc.saving.toLocaleString('ko-KR')}만원`}</b></div>
                <div className="box" style={{ background: '#2A2A2A' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#BDBDBA' }}>IRP</span><br /><b style={{ fontSize: 22 }}>{en ? wonL(pc.irp * 10000, 'en') : `${pc.irp.toLocaleString('ko-KR')}만원`}</b></div>
              </div>
              <b style={{ fontSize: 15 }}>{en ? `Put in ${wonL(pc.monthly, 'en')} a month` : `매달 ${won(pc.monthly)}씩 넣으면 돼요`}</b>
              {(en ? pensionNoteEn(yearly, lowPay) : pc.note) && <span className="box" style={{ background: '#F2F28E', color: '#111', fontSize: 14, fontWeight: 700, lineHeight: 1.45 }}>{en ? pensionNoteEn(yearly, lowPay) : pc.note}</span>}
            </section>
          </div>
        )}
      </div>

      </div>
      <div className="splitR">
      <div className="stack keep" style={{ paddingTop: 22 }}>
        <span className="fieldlabel" style={{ padding: '0 12px 10px' }}>{t('이렇게 나눠 담아봐', 'Try splitting it like this')}</span>
        {plan.rows.map(([name, etf, p, bg], i) => (
          <div key={name + etf} className="card" style={{ background: bg, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: i === plan.rows.length - 1 ? '18px 20px 20px' : '18px 20px 40px' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <b style={{ fontSize: 20, lineHeight: 1.15, letterSpacing: '-0.035em' }}>{en ? ROW_EN[name] ?? name : name}</b>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2E2E2C' }}>{en ? etfLineEn(etf) : etf}</span>
              <b style={{ fontSize: 15, paddingTop: 4 }}>{wonL((base * p) / 100, lang)}{isPension ? t(' / 년', ' / yr') : ''}</b>
            </span>
            <span style={{ fontSize: 46, fontWeight: 500, lineHeight: 0.9, letterSpacing: '-0.05em' }}>{p}<span style={{ fontSize: 22 }}>%</span></span>
          </div>
        ))}
      </div>

      {isPension && (
        <ul style={{ margin: '14px 12px 0', padding: '18px 20px 18px 36px', borderRadius: 24, background: '#F7F7F5', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: '#2E2E2C' }}>
          {(en ? ['Pension accounts can only buy Korea-listed ETFs, like TIGER US S&P500 instead of VOO.', 'IRP caps stocks (risky assets) at 70%, so 30% is in bonds.', 'No leveraged or inverse ETFs.', 'Cash out before 55 and you pay back the refund at 16.5%.'] : ['연금계좌에선 한국에 상장된 ETF만 살 수 있어요. VOO 대신 TIGER 미국S&P500처럼.', 'IRP는 주식형(위험자산)을 70%까지만 담을 수 있어서 채권을 30% 넣었어요.', '레버리지·인버스 ETF는 못 사요.', '55세 전에 깨면 돌려받은 세금을 16.5%로 다시 내야 해요.']).map((x) => <li key={x}>{x}</li>)}
        </ul>
      )}

      <Disclaimer>{en ? <><b style={{ color: '#111' }}>This is just a suggestion.</b> It’s a rough split based only on your goal, so you can lose money. Tax numbers are estimates too. Check for yourself before buying, and buy in pieces, not all at once.</> : <><b style={{ color: '#111' }}>이건 그냥 추천이에요.</b> 목표만 보고 대략 나눈 예시라서 원금 손실이 날 수 있어요. 세금 계산도 어림값이에요. 사기 전에 꼭 직접 확인하고, 한 번에 말고 나눠서 사세요.</>}</Disclaimer>
      </div>
      </div>
      <MyStocks goal={goal} />
      <BottomNav active="money" />
    </main>
  );
}
