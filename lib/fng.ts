/** 공포지수 → 몸 위치 (머리가 비쌀 때, 발바닥이 쌀 때) */
export const PARTS = [
  { key: 'top', en: 'Head', sayEn: 'At the top. Take some profit.', ko: '정수리', min: 76, range: '76~', color: '#B1A6FF', say: '꼭대기. 일부 팔아서 익절 챙기자.' },
  { key: 'shoulder', en: 'Shoulder', sayEn: 'Everyone is excited. Trim a bit or just watch.', ko: '어깨', min: 56, range: '56~75', color: '#9CC3FF', say: '다들 신났다. 조금 익절하거나 지켜보자.' },
  { key: 'waist', en: 'Waist', sayEn: 'Calm market. Stick to the plan.', ko: '허리', min: 45, range: '45~55', color: '#F2F28E', say: '평온한 장. 계획대로.' },
  { key: 'knee', en: 'Knee', sayEn: 'Nervous market. Buy in small pieces.', ko: '무릎', min: 25, range: '25~44', color: '#F2A93B', say: '겁 많은 장. 나눠서 줍자.' },
  { key: 'ankle', en: 'Ankle', sayEn: 'Almost there. Buy when it hits the sole.', ko: '발목', min: 10, range: '10~24', color: '#FF5A3C', say: '거의 다 왔다. 발바닥 오면 줍자.' },
  { key: 'sole', en: 'Sole', sayEn: 'Single digits! Panic everywhere. Buy now.', ko: '발바닥', min: 0, range: '0~9', color: '#FF5A3C', say: '한 자리 수! 다들 패닉. 지금 줍자.' },
] as const;
export type Part = (typeof PARTS)[number];
export const partOf = (score: number): Part => PARTS.find((p) => score >= p.min) ?? PARTS[PARTS.length - 1];
/** 졸라맨(viewBox 0 0 100 240) 위 빨간 점 위치 */
export const DOT_AT: Record<Part['key'], [number, number]> = {
  top: [50, 10], shoulder: [50, 70], waist: [50, 140], knee: [39, 181], ankle: [28, 214], sole: [22, 226],
};

/** ETF 하나의 위치: 1년 최저가(발바닥) ~ 최고가(정수리) 사이 어디쯤인지 */
export const etfPos = (q: { last: number; hi: number | null; lo: number | null }) =>
  q.hi != null && q.lo != null && q.hi > q.lo ? Math.max(0, Math.min(100, ((q.last - q.lo) / (q.hi - q.lo)) * 100)) : 50;
export const etfPart = (q: { last: number; hi: number | null; lo: number | null }) => partOf(etfPos(q));
