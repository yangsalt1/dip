import { ETFS, type Sector } from './data';

/** 오늘 시장 한눈에: 섹터별로 '지금 떨어지는 중 / 바닥 다지는 중 / 오르는 중' 자동 분류 */
const NAME: Record<Sector, string> = { idx: '대표지수', semi: '반도체', ai: 'AI', power: '전력', div: '배당', safe: '금·채권' };
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export type OvGroup = { key: 'falling' | 'bottom' | 'rising'; names: string[]; lead: string; word: string };

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
    return { s, d1: median(qs.map((q) => q.d1)), wk: median(qs.map((q) => q.wk)), dd: median(qs.map((q) => q.dd)) };
  });
  // 지금 막 떨어지는 중: 오늘 -1% 이하 또는 이번 주 -2% 이하
  const falling = stat.filter((x) => x.d1 <= -1 || x.wk <= -2).sort((a, b) => a.d1 - b.d1);
  // 바닥 다지는 중: 최고가보다 10% 넘게 빠졌지만 지금은 더 안 빠지는 중
  const bottom = stat.filter((x) => !falling.includes(x) && x.dd <= -10).sort((a, b) => a.dd - b.dd);
  // 오르는 중: 최고가 근처에서 이번 주 상승
  const rising = stat.filter((x) => !falling.includes(x) && !bottom.includes(x) && x.wk > 0).sort((a, b) => b.wk - a.wk);
  const names = (arr: typeof stat) => arr.slice(0, 3).map((x) => NAME[x.s]);
  const out: OvGroup[] = [];
  const f = names(falling), b = names(bottom), r = names(rising);
  if (f.length) out.push({ key: 'falling', names: f, lead: `${f.join(', ')}${topic(f[f.length - 1])}`, word: '세일중' });
  if (b.length) out.push({ key: 'bottom', names: b, lead: b.join(', '), word: '줍줍준비' });
  if (r.length) out.push({ key: 'rising', names: r, lead: r.join(', '), word: '상승중' });
  return out;
}
