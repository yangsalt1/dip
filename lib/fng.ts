/** 점수 → 쉬운 말 (CNN 구간: 0-24 / 25-44 / 45-55 / 56-75 / 76-100) */
export function fngZone(score: number) {
  if (score < 25) return { ko: '극단적 공포', color: '#FF5A3C', say: '다들 겁먹었다. 세일 줍기 좋은 날씨.' };
  if (score < 45) return { ko: '공포', color: '#F2A93B', say: '겁 많은 장. 나눠서 줍자.' };
  if (score <= 55) return { ko: '중립', color: '#F2F28E', say: '평온한 장. 계획대로.' };
  if (score <= 75) return { ko: '탐욕', color: '#9CC3FF', say: '다들 신났다. 쫓아 사지 말자.' };
  return { ko: '극단적 탐욕', color: '#B1A6FF', say: '과열. 포모 금지.' };
}
