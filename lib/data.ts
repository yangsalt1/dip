import market from '@/data/market.json';
import cfg from '@/data/etfs.json';
import brief from '@/content/briefing.json';

export type Market = 'us' | 'kr';
export type Sector = 'idx' | 'kidx' | 'semi' | 'ai' | 'power' | 'bio' | 'defense' | 'div' | 'safe' | 'crypto';
export type Kind = 'mega' | 'sale' | 'up' | 'wow';

export interface Quote {
  date: string;
  last: number;
  d1: number;
  wk: number;
  hi: number;
  lo: number | null;
  avg: number | null;
  dd: number;
  rsi: number;
  buy: number;
  factors: { trend: number; sale: number; overheat: number; volatility: number };
  shoulder: boolean[];
  chart: { start: string; end: string; points: number[] };
}

export interface Etf {
  id: string;
  yahoo: string;
  market: Market;
  code: string;
  name: string;
  kw: string;
  sector: Sector;
  rank: number;
  sub: string;
  /** 비슷한 ETF와 뭐가 다른지 · 어떤 사람에게 맞는지 (짧게) */
  diff: string;
  about: string;
  q: Quote;
  kind: Kind;
}

const quotes = market.quotes as unknown as Record<string, Quote>;

/** DIP 신호 4단계
 *  워워      = 1년 최고가 1% 이내이거나 RSI 70 이상(과열) → 많이 사지 않기
 *  특급세일  = 최고가보다 15% 이상 빠짐 (점수 공식의 '세일' 점수가 꽉 차는 지점)
 *  세일      = 최고가보다 5% 이상 빠졌거나 오늘 떨어짐
 *  상승 중   = 나머지 (최고가 근처에서 오르는 중 → 평정심 유지) */
export const MEGA_DD = -15;
export const SALE_DD = -5;
export function kindOf(q: Quote): Kind {
  if (q.dd > -1 || q.rsi >= 70) return 'wow';
  if (q.dd <= MEGA_DD) return 'mega';
  if (q.dd <= SALE_DD || q.d1 < 0) return 'sale';
  return 'up';
}
/** 아직 떨어지는 중(200일선 아래 + 하락 추세) — 칼날 조심, 나눠서 */
export const isKnife = (q: Quote) => q.factors.trend < 0;
/** 줍줍 시작: 세일 중인데 반등이 보이는 것 (2일 연속 상승, 오늘 +1% 이상, 또는 많이 식은 뒤 오름) */
export const isRebound = (e: { kind: string; q: Quote & { streak?: number } }) =>
  (e.kind === 'mega' || e.kind === 'sale') && ((e.q.streak ?? 0) >= 2 || e.q.d1 >= 1 || (e.q.rsi < 35 && e.q.d1 > 0));

// 시세가 아직 없는 ETF(새로 추가했는데 데이터가 안 들어온 경우)는 화면에서 빼기
export const ETFS: Etf[] = cfg.etfs.filter((e) => quotes[e.yahoo]).map((e) => {
  const q = quotes[e.yahoo];
  return { ...(e as Omit<Etf, 'q' | 'kind'>), q, kind: kindOf(q) };
});

export function etfById(id: string) {
  return ETFS.find((e) => e.id === id);
}

export const FX_RATE = quotes['KRW=X'].last;
export const UPDATED_AT = market.updatedAt;
export const PRICE_DATE = quotes['VOO'].date;

export const FX = cfg.fx.map((f) => ({ ...f, q: quotes[f.yahoo] }));

export const BRIEF = brief;

export const SECTORS: { id: Sector | 'all'; label: string; color: string }[] = [
  { id: 'all', label: '전체', color: '#111111' },
  { id: 'idx', label: '미국 대표', color: '#F06C3C' },
  { id: 'kidx', label: '한국 대표', color: '#FF9E80' },
  { id: 'semi', label: '반도체', color: '#B1A6FF' },
  { id: 'ai', label: 'AI·로봇', color: '#C9DDF7' },
  { id: 'power', label: '전력·원전', color: '#F2F28E' },
  { id: 'bio', label: '제약·바이오', color: '#FFB8D6' },
  { id: 'defense', label: '방산·조선', color: '#A8B8C8' },
  { id: 'div', label: '배당', color: '#2DB866' },
  { id: 'safe', label: '금·채권', color: '#D8D0C4' },
  { id: 'crypto', label: '비트코인', color: '#FFC85C' },
];

export const PALETTE = ['#B1A6FF', '#D8D0C4', '#F06C3C', '#F2F28E', '#2DB866', '#C9DDF7'];
