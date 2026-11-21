"""
매일 실행: data/etfs.json 의 ETF·환율 가격을 받아서 data/market.json 을 새로 만들어요.

    pip install -r pipeline/requirements.txt
    python pipeline/update_market.py

GitHub Actions(.github/workflows/update-data.yml)가 평일 아침 7시, 오후 4시(한국시간)에 자동으로 돌려요.
"""
from __future__ import annotations
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import urllib.request

import yfinance as yf

sys.path.insert(0, str(Path(__file__).parent))
from engine import analyze  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "data" / "etfs.json").read_text(encoding="utf-8"))
OUT = ROOT / "data" / "market.json"
KST = timezone(timedelta(hours=9))


def fetch(ticker: str):
    df = yf.download(ticker, period="2y", interval="1d", auto_adjust=False, progress=False)
    s = df["Close"].squeeze().dropna()
    return [d.strftime("%Y-%m-%d") for d in s.index], [float(x) for x in s.values]


def streak(closes):
    """끝에서부터 연속 하락(음수) 또는 연속 상승(양수) 일수"""
    n = 0
    for i in range(len(closes) - 1, 0, -1):
        ch = closes[i] - closes[i - 1]
        if ch == 0 or (n > 0 and ch < 0) or (n < 0 and ch > 0):
            break
        n += 1 if ch > 0 else -1
    return n


def fear_greed():
    """CNN Fear & Greed 지수 (0~100). 실패하면 None"""
    req = urllib.request.Request(
        "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
            "Accept": "application/json",
            "Referer": "https://edition.cnn.com/markets/fear-and-greed",
            "Origin": "https://edition.cnn.com",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        j = json.loads(r.read().decode("utf-8"))["fear_and_greed"]
    r1 = lambda v: round(float(v)) if v is not None else None  # noqa: E731
    ts = j.get("timestamp")
    date = ts[:10] if isinstance(ts, str) else datetime.fromtimestamp(float(ts) / 1000, timezone.utc).strftime("%Y-%m-%d")
    return {
        "score": r1(j["score"]), "rating": j.get("rating", ""), "date": date,
        "prev": r1(j.get("previous_close")), "week": r1(j.get("previous_1_week")),
        "month": r1(j.get("previous_1_month")), "year": r1(j.get("previous_1_year")),
    }


def main() -> int:
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"quotes": {}}
    quotes = dict(old.get("quotes", {}))
    tickers = [e["yahoo"] for e in CFG["etfs"]] + [f["yahoo"] for f in CFG["fx"]]
    failed = []
    for t in tickers:
        try:
            dates, closes = fetch(t)
            if len(closes) < 260:
                raise ValueError(f"데이터 부족 {len(closes)}일")
            quotes[t] = analyze(dates, closes)
            quotes[t]["streak"] = streak(closes)
            print(f"ok  {t:12s} {quotes[t]['last']:>12} 매수 {quotes[t]['buy']}%")
        except Exception as e:  # 한 종목이 실패해도 나머지는 갱신하고, 실패한 건 어제 값 유지
            failed.append(t)
            print(f"ERR {t}: {e}", file=sys.stderr)
    fng = old.get("fng")
    try:
        fng = fear_greed()
        print(f"ok  F&G {fng['score']} {fng['rating']}")
    except Exception as e:  # 실패하면 지난 값 유지
        print(f"ERR F&G: {e}", file=sys.stderr)
    out = {
        "updatedAt": datetime.now(KST).isoformat(timespec="minutes"),
        "source": "Yahoo Finance",
        "engine": "DIP engine v0.1",
        "failed": failed,
        "quotes": quotes,
    }
    if fng:
        out["fng"] = fng
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"저장: {OUT} (실패 {len(failed)}개)")
    return 1 if len(failed) == len(tickers) else 0


if __name__ == "__main__":
    raise SystemExit(main())
