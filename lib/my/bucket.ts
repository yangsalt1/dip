import type { Bucket } from '@/lib/buckets';

/** 이름·코드로 칸(미국 대표·반도체…) 어림. 틀리면 화면에서 바꿀 수 있어요 */
export function guessBucket(name: string, code: string): Bucket {
  const s = `${name} ${code}`.toUpperCase();
  if (/채권|국채|TLT|BND|IEF|SHY|AGG|회사채|단기채/.test(s)) return 'bond';
  if (/금현물|골드|GOLD|GLD|IAU|\b금\b|KRX금/.test(s)) return 'gold';
  if (/배당|SCHD|DIVIDEND|VYM|JEPI|커버드콜/.test(s)) return 'dividend';
  if (/반도체|SEMI|SOXX|SMH|SOXL|NVDA|엔비디아|AMD|AVGO|브로드컴|TSM|MU\b|마이크론|INTC|인텔|삼성전자|하이닉스|한미반도체|ASML/.test(s)) return 'semi';
  if (/S&P|S＆P|SP500|VOO|SPY|IVV|VTI|미국S&P|미국 S&P|토탈마켓/.test(s)) return 'us_broad';
  if (/나스닥|NASDAQ|QQQ|AAPL|애플|MSFT|마이크로소프트|GOOG|알파벳|AMZN|아마존|META|메타|TSLA|테슬라|NFLX|넷플릭스|빅테크|테크/.test(s)) return 'us_tech';
  if (/전력|원전|유틸|XLU|URA|한국전력|두산에너빌리티|에너빌|전선|변압기/.test(s)) return 'power';
  if (/코스피|KOSPI|200|TOP10|KRX300/.test(s)) return 'kr_broad';
  return 'other';
}
