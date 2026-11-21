/** 점수 → 쉬운 말 (CNN 구간: 0-24 / 25-44 / 45-55 / 56-75 / 76-100, 한 자리 수는 따로) */
export function fngZone(score: number) {
  if (score < 10) return { ko: '극단적 공포', color: '#FF5A3C', say: '한 자리 수! 다들 패닉. 들어가기 좋은 때.' };
  if (score < 25) return { ko: '극단적 공포', color: '#FF5A3C', say: '공포 심함. 한 자리 수 오면 들어가자.' };
  if (score < 45) return { ko: '공포', color: '#F2A93B', say: '겁 많은 장. 나눠서 줍자.' };
  if (score <= 55) return { ko: '중립', color: '#F2F28E', say: '평온한 장. 계획대로.' };
  if (score <= 75) return { ko: '탐욕', color: '#9CC3FF', say: '다들 신났다. 조금 익절하거나 지켜보자.' };
  return { ko: '극단적 탐욕', color: '#B1A6FF', say: '과열. 일부 팔아서 익절 챙기자.' };
}
