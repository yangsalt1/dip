/** 청약 공고 (청약홈 · LH · 서울 청년안심주택에서 모아 한 모양으로) */
export type Who = 'newlywed' | 'youth' | 'family' | 'general';
export type HKind = 'sale' | 'rent';

export type HUnit = {
  ty: string;          // 주택형 이름 (예: 059A, 26D)
  area: number;        // 전용면적 ㎡
  supply?: number;     // 공급면적 ㎡ (있으면 평수 계산에 사용)
  count?: number;      // 이번에 뽑는 세대수
  price?: number;      // 분양가 (만원, 최고가 기준)
  deposit?: number;    // 임대보증금 (만원)
  rent?: number;       // 월세 (만원)
  sp?: Partial<Record<'newlywed' | 'youth' | 'family' | 'first', number>>; // 특별공급 세대수
};

export type Notice = {
  id: string;
  src: 'applyhome' | 'remndr' | 'lh' | 'soco';
  kind: HKind;
  cat: string;          // 아파트 분양 · 행복주택 · 청년안심주택 …
  name: string;
  sido: string;         // 서울 · 경기 …
  gu?: string;          // 노원구 · 부천시 …
  addr?: string;
  posted?: string;      // YYYY-MM-DD
  start?: string;
  end?: string;
  win?: string;         // 당첨자 발표
  move?: string;        // 입주 예정 (YYYY.MM)
  url: string;          // 원문 (사람이 보는 페이지)
  doc?: string;         // 모집공고문 파일
  tel?: string;
  who: Who[];
  units: HUnit[];
  note?: string;
};

export type Pref = {
  who: Who[];
  sido: string[];
  gu: string[];
  rooms: ('1' | '2' | '3')[];
  kind: HKind[];
  money: number;        // 지금 쓸 수 있는 돈 (만원). 0 = 상관없음
  push: boolean;
};

export const EMPTY_PREF: Pref = { who: [], sido: [], gu: [], rooms: [], kind: [], money: 0, push: true };
