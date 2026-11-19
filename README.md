# DIP · 나는 떨어질 때 살거야

왕초보를 위한 ETF 시장 브리핑 웹앱(PWA)이에요. 핵심은 **buy the dip**, 떨어져도 즐겁게 보게 만드는 거예요.

- 뉴스: 시장 날씨 + 3줄(초딩/중딩/고딩), 카드 누르면 쉬운 설명과 상세(관련주·ETF·사? 말아?)
- 오늘의 DIP 신호: 세일 중 / 상승 중~!! / 워워(어깨 위일 수도)
- 환율 세일: 달러·엔·유로가 1년 최고 대비 몇 % 할인인지, 지금 사? 말아?
- ETF: 미국/한국 상장 → 섹터(대표·반도체·AI·전력·배당·금·채권), $/원 전환, 가격 + 할인율
- ETF 상세: 1년 차트, 매수·매도 온도(점수 엔진), 이게 뭐야?, 투자자 인사이트
- 포트폴리오: 목표 4개(빨리 불리기·배당 생활비·다 골고루 밸런스·한국 연금계좌) + 연금 세액공제 계산기

## 폴더 구조

```
app/                화면 (Next.js App Router)
  page.tsx          뉴스(홈)
  story/[id]/       뉴스 상세 (예: 엔비디아 사장 사임)
  fx/               환율 세일
  etf/              ETF 목록, etf/[id]/ ETF 상세
  money/            포트폴리오
components/         화면 조각 (카드, 메뉴, 차트)
lib/                데이터 읽기, 신호 판단(kindOf), 포맷, 목표별 비중(plans.ts)
data/etfs.json      다루는 ETF·환율 목록 (이름, 키워드, 설명, 섹터, 인기 순서)
data/market.json    가격·할인율·온도 점수 (매일 자동 갱신)
content/briefing.json  매일 바뀌는 글 (날씨, 3줄, 고딩 뉴스, 상세 스토리, 인사이트)
pipeline/           매일 가격을 받아 점수를 계산하는 파이썬 (engine.py, update_market.py)
.github/workflows/  평일 07:00, 16:00(한국시간) 자동 갱신
public/             PWA 설치용 아이콘·manifest·서비스워커
```

## 내 컴퓨터에서 실행

```bash
npm install
npm run dev          # http://localhost:3000
```

## 데이터 갱신

```bash
pip install -r pipeline/requirements.txt
python pipeline/update_market.py     # data/market.json 갱신
```

GitHub에 올리면 `.github/workflows/update-data.yml` 이 평일 아침 7시, 오후 4시에 자동으로 돌리고 커밋해요. 저장소 Settings → Actions → General 에서 "Read and write permissions"를 켜 주세요.

## 매일 글(뉴스) 바꾸기

`content/briefing.json` 만 고치면 돼요. 노션 Morning Briefing 내용을 이 형식에 맞춰 옮기면 화면에 그대로 나와요.

- `cards[].kid / mid / pro` = 제목 (kid만 사용, mid·pro는 예비), `short` = 아래 한 줄(아주 짧게)
- `cards[].etfs` = 관련 ETF id 3개, `buy` = "사? 말아?" 한 줄 결론, `story` = 상세 화면 id(있을 때)
- `weather.detail` = 지수 등락 한 줄
- `news` = 예비 (지금 화면에는 안 나와요)
- 첫 화면 배너(세일중 / 줍줍준비 / 상승중)는 시세 데이터로 자동 계산돼요 → `lib/overview.ts`
- `stories` = 카드에서 들어가는 상세 화면

## 배포 (Vercel, 무료)

1. 이 폴더를 GitHub 저장소에 올리기
2. vercel.com → New Project → 저장소 선택 → Deploy (설정 그대로)
3. 이후 데이터가 커밋될 때마다 자동으로 다시 배포돼요

폰에서 사이트를 열고 "홈 화면에 추가"를 누르면 앱처럼 설치돼요.

## 화면 구성

- 폰(1023px 이하): 앱 화면 — 아래 메뉴, 오늘 → 환율 → 세일 리스트
- PC(1024px 이상): 웹 화면 — 위 메뉴, 배너 + 뉴스 3장 + 세일 리스트 2장, 오른쪽에 환율 사? 말아?
- 할인 표시는 알약(C안): `components/ui.tsx` 의 `Sticker`

## 신호 기준 (lib/data.ts)

| 신호 | 기준 |
|---|---|
| 워워 | 1년 최고가 1% 이내, 또는 RSI 70 이상 |
| 특급세일 | 최고가보다 15% 이상 빠짐 |
| 일반 세일 | 최고가보다 5% 이상 빠졌거나 오늘 하락 |
| 상승 중 | 나머지 |

배너 섹터 분류 (`lib/overview.ts`, 섹터별 중간값)

| 줄 | 기준 |
|---|---|
| 세일중 | 오늘 -1% 이하 또는 이번 주 -2% 이하 |
| 줍줍준비 | 최고가보다 10% 넘게 빠졌지만 더 안 빠지는 중 |
| 상승중 | 위 둘이 아니고 이번 주 상승 |

매수·매도 온도 = 50 + 50 × (0.30 추세 + 0.25 세일 + 0.20 과열 + 0.15 심리 + 0.10 변동성). 장기 하락추세면 최대 55. 자세한 건 `pipeline/engine.py`.

## 다음 할 일

- [ ] 실제 데이터로 점수 엔진 백테스트 → 가중치 확정
- [ ] 인기 순위 자동화 (거래대금·개인 순매수)
- [ ] 공포·탐욕 지수 연결 (심리 점수)
- [ ] 웹 푸시 알림 (세일·워워) — `public/sw.js` 에 push 처리 준비됨
- [ ] 뉴스 글 자동 생성 (노션 브리핑 → briefing.json)
- [ ] 출시 전 금융 전문 변호사 자문 (특히 "포트폴리오"의 금액·목표별 비중 제시)

모든 숫자는 참고용이고 투자 권유가 아니에요.
