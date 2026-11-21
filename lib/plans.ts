/**
 * 목표별 모델 포트폴리오 (예시). 백테스트 전 1차 버전이라 숫자는 바뀔 수 있어요.
 * 각 줄: [이름, ETF, 비중%, 카드색]
 */
export type Goal = 'grow' | 'dividend' | 'balance' | 'pension';

export const PLANS: Record<Goal, { label: string; color: string; desc: string; rows: [string, string, number, string][] }> = {
  grow: {
    label: '빨리 불리기', color: '#F06C3C',
    desc: '크게 오를 수 있지만, 그만큼 크게 떨어질 수도 있어요. 몇 년 동안 안 쓸 돈일 때만.',
    rows: [
      ['빅테크 몰빵쟁이', 'TIGER 미국나스닥100 · QQQ', 35, '#B1A6FF'],
      ['미국 대표 500짱', 'TIGER 미국S&P500 · VOO', 25, '#F06C3C'],
      ['반도체', 'TIGER 반도체TOP10 · SMH', 20, '#D8D0C4'],
      ['전기짱', 'KODEX AI전력핵심설비 · XLU', 10, '#F2F28E'],
      ['한국 대표 200짱', 'KODEX 200', 10, '#2DB866'],
    ],
  },
  dividend: {
    label: '배당으로 생활비', color: '#2DB866',
    desc: '은퇴 후 배당과 이자로 생활비가 꾸준히 나오게. 크게 오르진 않아요.',
    rows: [
      ['배당 꼬박꼬박', 'TIGER 미국배당다우존스 · SCHD', 40, '#2DB866'],
      ['미국 대표 500짱', 'TIGER 미국S&P500 · VOO', 20, '#F06C3C'],
      ['나라에 빌려주기', 'ACE 미국30년국채액티브 · TLT', 20, '#D8D0C4'],
      ['전기짱', 'XLU', 10, '#F2F28E'],
      ['금덩이', 'ACE KRX금현물 · GLD', 10, '#B1A6FF'],
    ],
  },
  balance: {
    label: '다 골고루 밸런스', color: '#B1A6FF',
    desc: '오를 때 적당히 따라가고, 떨어질 때 덜 아프게. 처음이면 여기부터.',
    rows: [
      ['미국 대표 500짱', 'TIGER 미국S&P500 · VOO', 40, '#F06C3C'],
      ['빅테크 몰빵쟁이', 'TIGER 미국나스닥100 · QQQ', 15, '#B1A6FF'],
      ['한국 대표 200짱', 'KODEX 200', 15, '#2DB866'],
      ['배당 꼬박꼬박', 'TIGER 미국배당다우존스 · SCHD', 15, '#F2F28E'],
      ['나라에 빌려주기', 'ACE 미국30년국채액티브 · TLT', 10, '#D8D0C4'],
      ['금덩이', 'ACE KRX금현물 · GLD', 5, '#C9DDF7'],
    ],
  },
  pension: {
    label: '한국 연금계좌', color: '#F2F28E',
    desc: '연금저축·IRP용. 넣은 돈만큼 세금을 돌려받고, 55세 이후 연금으로 받아요.',
    rows: [
      ['미국 대표 500짱', 'TIGER 미국S&P500', 30, '#F06C3C'],
      ['빅테크 몰빵쟁이', 'TIGER 미국나스닥100', 15, '#B1A6FF'],
      ['배당 꼬박꼬박', 'TIGER 미국배당다우존스', 15, '#2DB866'],
      ['나라에 빌려주기', 'ACE 미국30년국채액티브', 30, '#D8D0C4'],
      ['금덩이', 'ACE KRX금현물', 10, '#F2F28E'],
    ],
  },
};

/** 연금계좌 세액공제 (2026년 기준): 연금저축 600만원, 연금저축+IRP 합산 900만원, 총 납입 1,800만원. 총급여 5,500만원 이하 16.5%, 초과 13.2%. */
export const PENSION = { savingCap: 600, creditCap: 900, totalCap: 1800, rateLow: 0.165, rateHigh: 0.132 };

export function pensionCalc(yearlyMan: number, lowPay: boolean) {
  const rate = lowPay ? PENSION.rateLow : PENSION.rateHigh;
  const credit = Math.min(yearlyMan, PENSION.creditCap);
  const saving = Math.min(yearlyMan, PENSION.savingCap);
  const irp = Math.min(Math.max(yearlyMan - PENSION.savingCap, 0), PENSION.creditCap - PENSION.savingCap);
  let note = '';
  if (yearlyMan > PENSION.totalCap) note = '연금계좌는 1년에 1,800만원까지만 넣을 수 있어요.';
  else if (yearlyMan > PENSION.creditCap) note = '900만원 넘는 돈은 세금 환급은 없지만, 굴려서 번 돈에 붙는 세금을 나중으로 미룰 수 있어요.';
  else if (yearlyMan < PENSION.creditCap) note = `900만원까지 채우면 최대 ${Math.round(PENSION.creditCap * 10000 * rate).toLocaleString('ko-KR')}원까지 돌려받을 수 있어요.`;
  return { rate, credit, saving, irp, refund: credit * 10000 * rate, monthly: (yearlyMan * 10000) / 12, note };
}

/** 영어 (DIP) */
export const PLAN_EN: Record<Goal, { label: string; desc: string }> = {
  grow: { label: 'Grow it fast', desc: 'Can rise a lot, but can fall just as hard. Only for money you won\'t need for years.' },
  dividend: { label: 'Dividends for living', desc: 'Steady dividends and interest to cover living costs after retirement. Won\'t rocket.' },
  balance: { label: 'A bit of everything', desc: 'Keeps up when markets rise, hurts less when they fall. Start here if you\'re new.' },
  pension: { label: 'Korean pension account', desc: 'For Korean pension savings / IRP. Get tax back on what you put in, collect it as a pension after 55.' },
};
export const ROW_EN: Record<string, string> = {
  '빅테크 몰빵쟁이': 'Big Tech all-in', '미국 대표 500짱': "America's top 500", '반도체': 'Chips', '전기짱': 'Power company boss',
  '한국 대표 200짱': "Korea's top 200", '배당 꼬박꼬박': 'Steady dividends', '나라에 빌려주기': 'Lend to the government', '금덩이': 'Gold bar',
};
export const ETFNAME_EN: Record<string, string> = {
  'TIGER 미국나스닥100': 'TIGER US Nasdaq100', 'TIGER 미국S&P500': 'TIGER US S&P500', 'TIGER 반도체TOP10': 'TIGER Semiconductor TOP10',
  'KODEX AI전력핵심설비': 'KODEX AI Power Core Equipment', 'TIGER 미국배당다우존스': 'TIGER US Dividend Dow Jones',
  'ACE 미국30년국채액티브': 'ACE US 30Y Treasury Active', 'ACE KRX금현물': 'ACE KRX Gold Spot',
};
export const etfLineEn = (s: string) => Object.entries(ETFNAME_EN).reduce((a, [k, v]) => a.replace(k, v), s);
export function pensionNoteEn(yearlyMan: number, lowPay: boolean) {
  const rate = lowPay ? PENSION.rateLow : PENSION.rateHigh;
  if (yearlyMan > PENSION.totalCap) return 'Pension accounts take at most ₩18M a year.';
  if (yearlyMan > PENSION.creditCap) return 'Money above ₩9M gets no tax refund, but tax on the gains is pushed to later.';
  if (yearlyMan < PENSION.creditCap) return `Fill it up to ₩9M and you can get back up to ₩${Math.round(PENSION.creditCap * 10000 * rate).toLocaleString('en-US')}.`;
  return '';
}
