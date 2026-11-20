import type { HUnit, Notice, Pref, Who } from './types';

/** 오늘 (한국 날짜) YYYY-MM-DD */
export function todayKst(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
}
export function daysLeft(date?: string, today = todayKst()) {
  if (!date) return null;
  return Math.round((Date.parse(date) - Date.parse(today)) / 864e5);
}

/** 전용면적으로 방 개수 어림 (공고에 방 수가 없어서) */
export function roomsOf(area: number, apt = false) {
  if (area < 30) return 1;
  if (area < 50) return 2;
  if (area < 60) return apt ? 3 : 2; // 새 아파트 59㎡는 보통 방 3개, 임대 49~59㎡는 보통 2개
  if (area < 85) return 3;
  return 4;
}
/** 평수: 공급면적이 있으면 그걸로, 없으면 전용 × 1.33 */
export function pyeongOf(u: HUnit) {
  const m2 = u.supply && u.supply > u.area ? u.supply : u.area * 1.33;
  return Math.round(m2 / 3.3058);
}

/** 만원 → "1억 2,300만" */
export function won(man?: number) {
  if (man == null || !Number.isFinite(man)) return '';
  const m = Math.round(man);
  const eok = Math.floor(m / 10000), rest = m % 10000;
  if (eok && rest) return `${eok}억 ${rest.toLocaleString('ko-KR')}만`;
  if (eok) return `${eok}억`;
  return `${rest.toLocaleString('ko-KR')}만`;
}

/** 이 집에 들어가려면 '내 돈'이 대략 얼마? (분양 = 계약금 10%, 임대 = 보증금) */
export function cashNeed(n: Notice, u: HUnit) {
  if (n.kind === 'sale') return u.price ? u.price * 0.1 : undefined;
  return u.deposit;
}

/** 돈 단계 (상세 화면 '얼마 필요해?') */
export function moneySteps(n: Notice, u: HUnit): { label: string; v: string; sub?: string }[] {
  if (n.kind === 'sale' && u.price) {
    const p = u.price;
    return [
      { label: '청약할 때', v: '0원', sub: '청약통장만 있으면 돼요' },
      { label: '계약할 때 (10%)', v: won(p * 0.1) + '원' },
      { label: '짓는 동안 (중도금 60%)', v: won(p * 0.6) + '원', sub: '보통 은행 대출로 내요' },
      { label: '들어갈 때 (잔금 30%)', v: won(p * 0.3) + '원', sub: '주택담보대출로 일부 낼 수 있어요' },
    ];
  }
  if (n.kind === 'rent' && (u.deposit || u.rent)) {
    const d = u.deposit ?? 0;
    const out = [] as { label: string; v: string; sub?: string }[];
    if (d) {
      out.push({ label: '계약할 때 (보통 10%)', v: won(d * 0.1) + '원' });
      out.push({ label: '들어갈 때 (나머지)', v: won(d * 0.9) + '원', sub: '버팀목 같은 전세대출을 쓸 수 있어요' });
    }
    if (u.rent) out.push({ label: '매달', v: `${won(u.rent)}원 + 관리비` });
    return out;
  }
  return [];
}

export const WHO_LABEL: Record<Who, string> = { newlywed: '신혼부부', youth: '청년 혼자', family: '아이 있는 가정', general: '그 외' };

/** 이 공고가 내 조건에 맞나? 맞으면 맞는 주택형만 돌려줘요 */
export function matchNotice(n: Notice, p: Pref): HUnit[] | null {
  if (p.kind.length && !p.kind.includes(n.kind)) return null;
  if (p.sido.length && !p.sido.includes(n.sido)) return null;
  if (p.gu.length && n.sido === '서울' && n.gu && !p.gu.includes(n.gu)) return null;
  if (p.who.length) {
    const ok = n.who.includes('general') || p.who.some((w) => n.who.includes(w));
    if (!ok) return null;
  }
  // 주택형 정보가 없으면(공고문 확인) 일단 보여줘요
  if (!n.units.length) return [];
  const units = n.units.filter((u) => {
    if (p.rooms.length) {
      const r = roomsOf(u.area, n.src === 'applyhome');
      const want = p.rooms.some((x) => (x === '3' ? r >= 3 : r === Number(x)));
      if (!want) return false;
    }
    if (p.money) {
      const c = cashNeed(n, u);
      if (c != null && c > p.money) return false;
    }
    return true;
  });
  return units.length ? units : null;
}

/** 카드에 크게 보여줄 대표 주택형: 조건에 맞는 것 중 제일 싼 것 */
export function pickUnit(n: Notice, units: HUnit[]) {
  const arr = units.length ? units : n.units;
  if (!arr.length) return undefined;
  const cost = (u: HUnit) => (n.kind === 'sale' ? u.price ?? 1e9 : (u.deposit ?? 1e9) + (u.rent ?? 0) * 100);
  return [...arr].sort((a, b) => cost(a) - cost(b))[0];
}

/** 내 상황에 맞는 특별공급이 있으면 한 줄로 */
export function spLine(n: Notice, p: Pref) {
  const sum = (k: 'newlywed' | 'youth' | 'family' | 'first') => n.units.reduce((s, u) => s + (u.sp?.[k] ?? 0), 0);
  const out: string[] = [];
  if (p.who.includes('newlywed') && sum('newlywed')) out.push(`신혼 특별공급 ${sum('newlywed')}세대`);
  if (p.who.includes('youth') && sum('youth')) out.push(`청년 특별공급 ${sum('youth')}세대`);
  if (p.who.includes('family') && sum('family')) out.push(`다자녀·신생아 ${sum('family')}세대`);
  return out.join(' · ');
}
