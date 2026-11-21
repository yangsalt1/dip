import { ETFS, etfById, type Etf } from './data';
import { PLANS, type Goal } from './plans';

/** 내 주식을 나누는 칸. 추천 포트폴리오(PLANS)의 칸과 1:1로 맞춰요. */
export const BUCKETS = {
  us_broad: { label: '미국 대표', labelEn: 'US index', color: '#F06C3C', etfs: ['voo', 'tiger-sp500', 'spy'] },
  us_tech: { label: '빅테크', labelEn: 'Big Tech', color: '#B1A6FF', etfs: ['qqq', 'tiger-nasdaq100', 'kodex-nasdaq100'] },
  semi: { label: '반도체', labelEn: 'Chips', color: '#FF5A3C', etfs: ['soxx', 'smh', 'tiger-semi-top10'] },
  power: { label: '전기·원전', labelEn: 'Power·Nuclear', color: '#F2F28E', etfs: ['xlu', 'kodex-ai-power', 'ura'] },
  kr_broad: { label: '한국 대표', labelEn: 'Korea index', color: '#2DB866', etfs: ['kodex-200', 'tiger-200'] },
  dividend: { label: '배당', labelEn: 'Dividend', color: '#9FE0B0', etfs: ['schd', 'tiger-us-dividend'] },
  bond: { label: '채권', labelEn: 'Bonds', color: '#D8D0C4', etfs: ['tlt', 'ace-us30y'] },
  gold: { label: '금', labelEn: 'Gold', color: '#FFC85C', etfs: ['gld', 'ace-gold'] },
  other: { label: '기타 개별주·테마', labelEn: 'Other stocks·themes', color: '#8A8A88', etfs: [] as string[] },
  cash: { label: '현금', labelEn: 'Cash', color: '#555555', etfs: [] as string[] },
} as const;
export type Bucket = keyof typeof BUCKETS;
export const BUCKET_KEYS = Object.keys(BUCKETS) as Bucket[];

const ROW_BUCKET: Record<string, Bucket> = {
  '미국 대표 500짱': 'us_broad', '빅테크 몰빵쟁이': 'us_tech', '반도체': 'semi', '전기짱': 'power',
  '한국 대표 200짱': 'kr_broad', '배당 꼬박꼬박': 'dividend', '나라에 빌려주기': 'bond', '금덩이': 'gold',
};

export type Holding = { name: string; ticker?: string | null; bucket: Bucket; weight: number };
export type Saved = { holdings: Holding[]; at: string; rough?: boolean };

/** 목표(PLANS) → 칸별 목표 % */
export function targetOf(goal: Goal): Partial<Record<Bucket, number>> {
  const t: Partial<Record<Bucket, number>> = {};
  for (const [name, , p] of PLANS[goal].rows) { const b = ROW_BUCKET[name]; if (b) t[b] = (t[b] ?? 0) + p; }
  return t;
}

const saleRank = (e: Etf) => (e.kind === 'mega' ? 0 : e.kind === 'sale' ? 1 : e.kind === 'up' ? 2 : 3);

export type Diag = {
  mine: { b: Bucket; p: number }[]; // 현금 빼고 투자한 돈 기준 %
  cash: number; // 전체 대비 현금 %
  rows: { b: Bucket; me: number; goal: number; diff: number }[];
  lack: { b: Bucket; diff: number; picks: Etf[] }[];
  over: { b: Bucket; diff: number }[];
  top?: { b: Bucket; p: number };
};

export function diagnose(h: Holding[], goal: Goal): Diag {
  const total = h.reduce((s, x) => s + x.weight, 0) || 1;
  const cash = (h.filter((x) => x.bucket === 'cash').reduce((s, x) => s + x.weight, 0) / total) * 100;
  const inv = h.filter((x) => x.bucket !== 'cash');
  const invTotal = inv.reduce((s, x) => s + x.weight, 0) || 1;
  const by: Partial<Record<Bucket, number>> = {};
  for (const x of inv) by[x.bucket] = (by[x.bucket] ?? 0) + (x.weight / invTotal) * 100;
  const target = targetOf(goal);
  const keys = BUCKET_KEYS.filter((b) => b !== 'cash' && ((by[b] ?? 0) > 0.5 || (target[b] ?? 0) > 0));
  const rows = keys.map((b) => ({ b, me: by[b] ?? 0, goal: target[b] ?? 0, diff: (by[b] ?? 0) - (target[b] ?? 0) }))
    .sort((a, b2) => b2.goal - a.goal || b2.me - a.me);
  const lack: Diag["lack"] = rows.filter((r) => r.diff <= -5).sort((a, b2) => a.diff - b2.diff).map((r) => ({
    b: r.b, diff: r.diff,
    picks: BUCKETS[r.b].etfs.map((id) => etfById(id)).filter((e): e is Etf => Boolean(e)).sort((a, b2) => saleRank(a) - saleRank(b2) || a.q.dd - b2.q.dd).slice(0, 2),
  }));
  lack.splice(3);
  const over = rows.filter((r) => r.diff >= 10).sort((a, b2) => b2.diff - a.diff).map((r) => ({ b: r.b, diff: r.diff }));
  const mine = (Object.entries(by) as [Bucket, number][]).map(([b, p]) => ({ b, p })).sort((a, b2) => b2.p - a.p);
  return { mine, cash, rows, lack, over, top: mine[0] };
}
export const ALL_ETFS = ETFS;
