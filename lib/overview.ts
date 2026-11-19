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

export function overview(): OvGroup[] {
  const sectors = Object.keys(NAME) as Sector[];
  const stat = sectors.map((s) => {
    const qs = ETFS.filter((e) => e.sector === s).map((e) => e.q);
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
