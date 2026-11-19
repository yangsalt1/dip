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
            print(f"ok  {t:12s} {quotes[t]['last']:>12} 매수 {quotes[t]['buy']}%")
        except Exception as e:  # 한 종목이 실패해도 나머지는 갱신하고, 실패한 건 어제 값 유지
            failed.append(t)
            print(f"ERR {t}: {e}", file=sys.stderr)
    out = {
        "updatedAt": datetime.now(KST).isoformat(timespec="minutes"),
        "source": "Yahoo Finance",
        "engine": "DIP engine v0.1",
        "failed": failed,
        "quotes": quotes,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"저장: {OUT} (실패 {len(failed)}개)")
    return 1 if len(failed) == len(tickers) else 0


if __name__ == "__main__":
    raise SystemExit(main())
