import { ETFS, SECTORS, type Sector } from './data';
import type { Lang } from './i18n';

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

export function overview(mkt: 'us' | 'kr', lang: Lang = 'ko'): OvGroup[] {
  const label = (s: Sector) => (lang === 'en' ? SECTORS.find((x) => x.id === s)?.labelEn ?? NAME[s] : NAME[s]);
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
    const all = arr.map((x) => label(x.s));
    // 한 줄이 너무 길어지지 않게 4개까지만
    const names = all.slice(0, 4);
    out.push({ key, names, lead: `${names.join(', ')}${topic(names[names.length - 1])}`, word });
  };
  const en = lang === 'en';
  add('mega', mega, en ? 'Mega sale' : '특급세일');
  add('sale', sale, en ? 'On sale' : '일반 세일');
  add('bottom', bottom, en ? 'Bottoming' : '줍줍준비');
  add('rising', rising, en ? 'Rising' : '상승중');
  return out;
}

/** 오늘의 한 줄: 세일 폭 + 대표 ETF 흐름으로 '줍기 / 조금씩 / 구경' 판단 (투자 권유 아님) */
export type Signal = { tone: 'go' | 'slow' | 'dip' | 'top'; text: string; chips: string[]; sub?: string };
export const SIGNAL_SUB: Partial<Record<Signal['tone'], string>> = { slow: '현금 딱 들고 있어' };
export const SIGNAL_SUB_EN: Partial<Record<Signal['tone'], string>> = { slow: 'Keep your cash ready' };
export const SIGNAL_TEXT_EN = {
  slow: 'Mega sale is on!',
  go: 'Sale is finding a floor. Start easing in.',
  dip: 'First pullback in an uptrend. Buy a little, as planned.',
  top: 'Very pricey. At the top. No FOMO.',
};
export const SIGNAL_TEXT = {
  slow: '왕세일 시작!',
  go: '세일 바닥 다진다. 슬슬 들어가자.',
  dip: '오르다 첫 눌림목. 계획대로 조금씩 줍자.',
  top: '매우 비쌈. 고점임. 포모 금지.',
};
/**
 * 대표 ETF(미국 VOO · 한국 KODEX 200) 흐름으로 오늘의 한 줄
 *   고점 근처 + 오르는 중        → top
 *   오르다 3~10% 눌림 + 멈춤     → dip
 *   눌림 뒤 다시 빠지는 중 / 세일 중 아직 하락 → slow
 *   10% 넘게 빠졌는데 바닥 신호  → go
 */
export function signal(mkt: 'us' | 'kr', lang: Lang = 'ko'): Signal {
  const s = signalRaw(mkt, lang);
  return lang === 'en'
    ? { ...s, text: SIGNAL_TEXT_EN[s.tone], sub: SIGNAL_SUB_EN[s.tone] }
    : { ...s, sub: SIGNAL_SUB[s.tone] };
}
function signalRaw(mkt: 'us' | 'kr', lang: Lang): Signal {
  const en = lang === 'en';
  const list = ETFS.filter((e) => e.market === mkt);
  const idx = ETFS.find((e) => e.id === (mkt === 'us' ? 'voo' : 'kodex-200'));
  const mega = list.filter((e) => e.kind === 'mega').length;
  const sale = list.filter((e) => e.kind === 'sale').length;
  const q = idx?.q as { d1: number; wk: number; dd: number; rsi?: number; streak?: number; factors?: { trend: number } } | undefined;
  const d1 = q?.d1 ?? 0, wk = q?.wk ?? 0, dd = q?.dd ?? 0, rsi = q?.rsi ?? 50, st = q?.streak ?? 0, trend = q?.factors?.trend ?? 0;
  const usDrop = mkt === 'kr' && (ETFS.find((e) => e.id === 'voo')?.q.d1 ?? 0) <= -1.5;
  const bottoming = st >= 2 || (rsi < 35 && d1 > 0) || d1 >= 1;
  const fallingAgain = st <= -2 || d1 <= -0.5;

  const chips: string[] = [];
  if (mega > 0) chips.push(en ? `${mega} mega sales` : `특급세일 ${mega}개`);
  else if (sale > 0) chips.push(en ? `${sale} on sale` : `세일 ${sale}개`);
  if (st <= -2) chips.push(en ? `Down ${-st} days in a row` : `${-st}일 연속 하락`);
  else if (st >= 2) chips.push(en ? `Up ${st} days in a row` : `${st}일 연속 상승`);
  if (d1 >= 0.5) chips.push(en ? 'Bounced today' : '오늘 반등');
  if (usDrop) chips.push(en ? 'US dropped overnight' : '밤새 미국 급락');
  if (dd > -3) chips.push(en ? 'Near the high' : '최고가 근처');

  if (usDrop) return { tone: 'slow', text: SIGNAL_TEXT.slow, chips };
  if (dd > -3 && (trend > 0 || wk > 0)) return { tone: 'top', text: SIGNAL_TEXT.top, chips };
  if (dd > -10) return fallingAgain || trend < 0 ? { tone: 'slow', text: SIGNAL_TEXT.slow, chips } : { tone: 'dip', text: SIGNAL_TEXT.dip, chips };
  return bottoming ? { tone: 'go', text: SIGNAL_TEXT.go, chips } : { tone: 'slow', text: SIGNAL_TEXT.slow, chips };
}
