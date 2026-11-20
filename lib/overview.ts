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
export type Signal = { tone: 'go' | 'slow' | 'wait'; text: string; chips: string[] };
export function signal(mkt: 'us' | 'kr'): Signal {
  const list = ETFS.filter((e) => e.market === mkt);
  const idx = ETFS.find((e) => e.id === (mkt === 'us' ? 'voo' : 'kodex-200'));
  const mega = list.filter((e) => e.kind === 'mega').length;
  const sale = list.filter((e) => e.kind === 'sale').length;
  const share = list.length ? (mega + sale) / list.length : 0;
  const q = idx?.q as { d1: number; wk: number; rsi?: number; streak?: number } | undefined;
  const d1 = q?.d1 ?? 0, wk = q?.wk ?? 0, rsi = q?.rsi ?? 50, st = q?.streak ?? 0;
  const falling = d1 <= -0.5 || (wk <= -2 && d1 <= 0.3);
  const rebound = d1 >= 0.5 || (rsi <= 30 && d1 > 0);
  const usDrop = mkt === 'kr' && (ETFS.find((e) => e.id === 'voo')?.q.d1 ?? 0) <= -1.5;

  const chips: string[] = [];
  if (mega > 0) chips.push(`특급세일 ${mega}개`);
  else if (sale > 0) chips.push(`세일 ${sale}개`);
  if (st <= -2) chips.push(`${-st}일 연속 하락`);
  else if (st >= 2) chips.push(`${st}일 연속 상승`);
  if (d1 >= 0.5) chips.push('오늘 반등');
  else if (d1 <= -0.5 && st > -2) chips.push('오늘 하락');
  if (usDrop) chips.push('밤새 미국 급락');
  if (share < 0.3) chips.push('최고가 근처');

  const SLOW = '떨어지는 중. 한 번에 말고 조금씩 줍자.';
  if (share < 0.3) return { tone: 'wait', text: '다 비싸. 오늘은 줍지 말고 쉬자.', chips };
  if (usDrop || (falling && !rebound)) return { tone: 'slow', text: SLOW, chips };
  return { tone: 'go', text: '바닥 찍고 반등! 지금이 줍줍 타이밍.', chips };
}
