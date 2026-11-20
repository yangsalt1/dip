import { ETFS, type Sector } from './data';

/** 오늘 시장 한눈에: 섹터별로 '지금 떨어지는 중 / 바닥 다지는 중 / 오르는 중' 자동 분류 */
const NAME: Record<Sector, string> = { idx: '미국 대표', kidx: '한국 대표', semi: '반도체', ai: 'AI·로봇', power: '전력·원전', bio: '제약·바이오', defense: '방산·조선', div: '배당', safe: '금·채권', crypto: '비트코인' };
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export type OvGroup = { key: 'mega' | 'sale' | 'bottom' | 'rising'; names: string[]; lead: string; word: string };

/** 받침 있으면 '은', 없으면 '는' (영문은 '는') */
function topic(word: string) {
  const c = word.charCodeAt(word.length - 1);
  if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 ? '은' : '는';
  return '는';
}

export function overview(mkt: 'us' | 'kr'): OvGroup[] {
  const sectors = Object.keys(NAME) as Sector[];
  const stat = sectors.map((s) => {
    const qs = ETFS.filter((e) => e.market === mkt && e.sector === s).map((e) => e.q);
    if (!qs.length) return null;
    return { s, d1: median(qs.map((q) => q.d1)), wk: median(qs.map((q) => q.wk)), dd: median(qs.map((q) => q.dd)) };
  }).filter((x): x is NonNullable<typeof x> => x !== null);
  // 지금 떨어지는 중: 오늘 -1% 이하 또는 이번 주 -2% 이하
  const isFalling = (x: (typeof stat)[number]) => x.d1 <= -1 || x.wk <= -2;
  const byDd = (a: (typeof stat)[number], b: (typeof stat)[number]) => a.dd - b.dd;
  const mega = stat.filter((x) => isFalling(x) && x.dd <= -15).sort(byDd); // 떨어지는 중 + 최고가보다 15% 넘게 빠짐
  const sale = stat.filter((x) => isFalling(x) && x.dd > -15).sort(byDd); // 떨어지는 중 + 아직 덜 빠짐
  const bottom = stat.filter((x) => !isFalling(x) && x.dd <= -10).sort(byDd); // 많이 빠졌지만 더 안 빠지는 중
  const rising = stat.filter((x) => !isFalling(x) && x.dd > -10).sort((a, b) => b.wk - a.wk);
  const out: OvGroup[] = [];
  const add = (key: OvGroup['key'], arr: typeof stat, word: string) => {
    if (!arr.length) return;
    const all = arr.map((x) => NAME[x.s]);
    // 한 줄이 너무 길어지지 않게 4개까지만
    const names = all.slice(0, 4);
    out.push({ key, names, lead: `${names.join(', ')}${topic(names[names.length - 1])}`, word });
  };
  add('mega', mega, '특급세일');
  add('sale', sale, '일반 세일');
  add('bottom', bottom, '줍줍준비');
  add('rising', rising, '상승중');
  return out;
}

/** 오늘의 한 줄: 세일 폭 + 대표 ETF 흐름으로 '줍기 / 조금씩 / 구경' 판단 (투자 권유 아님) */
export type Signal = { tone: 'go' | 'slow' | 'wait'; text: string };
export function signal(mkt: 'us' | 'kr'): Signal {
  const list = ETFS.filter((e) => e.market === mkt);
  const idx = ETFS.find((e) => e.id === (mkt === 'us' ? 'voo' : 'kodex-200'));
  const mega = list.filter((e) => e.kind === 'mega').length;
  const sale = list.filter((e) => e.kind === 'sale').length;
  const share = list.length ? (mega + sale) / list.length : 0;
  const big = list.length ? mega / list.length >= 0.4 : false;
  const q = idx?.q as { d1: number; wk: number; rsi?: number } | undefined;
  const d1 = q?.d1 ?? 0, wk = q?.wk ?? 0, rsi = q?.rsi ?? 50;
  const falling = d1 <= -0.5 || (wk <= -2 && d1 <= 0.3);
  const rebound = d1 >= 0.5 || (rsi <= 30 && d1 > 0);
  // 한국: 밤사이 미국이 크게 빠졌으면 오늘 아침엔 조심
  const us = ETFS.find((e) => e.id === 'voo')?.q.d1 ?? 0;
  if (mkt === 'kr' && us <= -1.5 && share >= 0.3) return { tone: 'slow', text: '밤새 미국이 크게 빠졌어. 오늘은 지켜보면서 조금씩.' };
  if (share < 0.3) return { tone: 'wait', text: '대부분 최고가 근처라 아직 비싸. 오늘은 구경만.' };
  if (falling && !rebound) return big
    ? { tone: 'slow', text: '세일 크게 하는 중. 아직 떨어지는 중이라 3번에 나눠서.' }
    : { tone: 'slow', text: '세일 시작. 더 싸질 수 있어서 지켜보면서 아주 조금만.' };
  return big
    ? { tone: 'go', text: '많이 싸졌고 떨어지는 게 멈췄어. 줍기 좋은 날.' }
    : { tone: 'go', text: '조금 싸졌고 흐름은 괜찮아. 천천히 담아도 돼.' };
}
