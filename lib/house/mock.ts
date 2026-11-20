import type { Notice } from './types';
// 로컬 화면 확인용 가짜 공고 (배포에서는 안 써요)
export const MOCK: Notice[] = [
  { id: 'soco-1', src: 'soco', kind: 'rent', cat: '청년안심주택 (민간임대)', name: '광운대역 현대프라힐스', sido: '서울', gu: '노원구', addr: '서울특별시 노원구 월계동 410-3', end: '2026-11-23', who: ['youth', 'newlywed'], url: '#', units: [{ ty: '49A', area: 49.2, deposit: 9800, rent: 32 }], note: '민간임대 일반공급은 소득·자산 기준이 없는 경우가 많아요 (공고문 확인)' },
  { id: 'lh-1', src: 'lh', kind: 'rent', cat: '행복주택', name: '수원당수 1, 2단지 행복주택 입주자 모집', sido: '경기', gu: '수원시', start: '2026-11-30', end: '2026-12-02', win: '2026-12-04', who: ['youth', 'newlywed'], url: '#', units: [{ ty: '26D', area: 26.88, count: 28, deposit: 2800, rent: 13 }, { ty: '44A', area: 44.59, count: 40, deposit: 5400, rent: 21 }] },
  { id: 'ah-1', src: 'applyhome', kind: 'sale', cat: '아파트 분양', name: '고양 한신더휴 퍼스트원', sido: '경기', gu: '고양시', start: '2026-11-30', end: '2026-12-02', win: '2026-12-09', move: '2028.05', who: ['general', 'newlywed', 'family'], url: '#', units: [{ ty: '59A', area: 59.99, supply: 80.3, count: 9, price: 55932, sp: { newlywed: 1, family: 2, first: 1 } }, { ty: '84A', area: 84.6, supply: 112, count: 12, price: 78307, sp: { newlywed: 2 } }] },
  { id: 'pv-1', src: 'pvt', kind: 'rent', cat: '공공지원 민간임대', name: '힐스테이트 회룡역파크뷰', sido: '경기', gu: '의정부시', end: '2026-11-28', who: ['general', 'newlywed'], url: '#', units: [{ ty: '49B', area: 49.5, supply: 75, deposit: 21120 }] },
  { id: 'rm-1', src: 'remndr', kind: 'sale', cat: '무순위 (줍줍)', name: '산곡역자이힐스테이트앤하늘채', sido: '인천', gu: '부평구', end: '2026-11-24', who: ['general'], url: '#', units: [{ ty: '59A', area: 59.8, supply: 79.4, price: 41668 }] },
  { id: 'lh-2', src: 'lh', kind: 'rent', cat: '국민임대', name: '파주운정 국민임대 예비입주자 모집', sido: '경기', gu: '파주시', end: '2026-12-01', who: ['general', 'family'], url: '#', units: [{ ty: '51', area: 51.9, deposit: 6214, rent: 36 }] },
];
