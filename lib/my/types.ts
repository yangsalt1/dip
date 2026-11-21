import type { Bucket } from '@/lib/buckets';

/** 내가 가진 종목 하나 */
export type Pos = {
  id: string;
  name: string;
  code: string;          // 005930 · NVDA
  rc: string;            // 네이버 코드: 005930 · NVDA.O
  market: 'kr' | 'us';
  qty: number;           // 보유 수량
  avg: number;           // 평균 매수가 (원 또는 달러)
  bucket: Bucket;
};
export type MySaved = { list: Pos[]; target: number; at: string };

export type SignalKind = 'pick' | 'wait' | 'hold' | 'take';
export type Check = { key: string; label: string; labelEn?: string; on: boolean };
export type Info = {
  last: number; d1: number;
  hi: number; lo: number; dd: number; pos: number; rsi: number; ma20: number;
  pnl: number | null;      // 내 수익률
  checks: Check[]; count: number;
  signal: SignalKind; why: string; whyEn?: string;
};
export type Row = Pos & { info: Info | null; valueKrw: number | null };
