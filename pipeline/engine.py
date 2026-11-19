"""
DIP 점수 엔진 v0.1 (매수·매도 온도)

일별 종가 리스트를 받아서 화면에 필요한 숫자를 전부 계산해요.
- 매수 % = 50 + 50 x (0.30 추세 + 0.25 세일 + 0.20 과열 + 0.15 심리 + 0.10 변동성)
- 장기 하락추세(200일선 아래 + 200일선 하락)면 매수 %는 최대 55
- 어깨 체크리스트 자동 3개: [1] 최고가 대비 -10~-15%, [2] 가격은 오르는데 RSI는 약해짐, [3] 20일선 아래
"""
from __future__ import annotations
import math
from statistics import mean, stdev

W = {"trend": 0.30, "sale": 0.25, "overheat": 0.20, "sentiment": 0.15, "volatility": 0.10}


def clip(x: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def rsi_series(c: list[float], n: int = 14) -> list[float]:
    """Wilder RSI (지수평활, alpha = 1/n)."""
    a = 1 / n
    out = [math.nan] * len(c)
    up = dn = None
    for i in range(1, len(c)):
        d = c[i] - c[i - 1]
        u, v = max(d, 0.0), max(-d, 0.0)
        if up is None:
            up, dn = u, v
        else:
            up = (1 - a) * up + a * u
            dn = (1 - a) * dn + a * v
        if i >= n:
            out[i] = 100.0 if dn == 0 else 100 - 100 / (1 + up / dn)
    return out


def analyze(dates: list[str], c: list[float], fear_greed: float | None = None) -> dict:
    n = len(c)
    L = n - 1
    ma = lambda k, i: mean(c[i + 1 - k:i + 1]) if i + 1 >= k else math.nan
    ma20, ma200, ma200p = ma(20, L), ma(200, L), ma(200, L - 20)
    slope = ma200 / ma200p - 1
    win = c[max(0, n - 252):]
    hi, lo, avg = max(win), min(win), mean(win)
    dd = c[L] / hi - 1
    rsis = rsi_series(c)
    rsi = rsis[L]
    lr = [math.log(c[i] / c[i - 1]) for i in range(1, n)]
    vol20 = stdev(lr[-20:]) * math.sqrt(252)
    vol252 = stdev(lr[-252:]) * math.sqrt(252)

    T = 0.5 * clip((c[L] / ma200 - 1) / 0.10) + 0.5 * clip(slope / 0.03)
    sale_raw = clip(-dd / 0.15, 0, 1)
    D = sale_raw if T >= 0 else 0.3 * sale_raw
    O = clip((50 - rsi) / 20)
    F = 0.0 if fear_greed is None else clip((50 - fear_greed) / 50)
    V = -clip(vol20 / vol252 - 1, 0, 1)
    pct = 50 + 50 * (W["trend"] * T + W["sale"] * D + W["overheat"] * O + W["sentiment"] * F + W["volatility"] * V)
    if c[L] < ma200 and slope < 0:
        pct = min(pct, 55)
    pct = round(max(0, min(100, pct)))

    rc, rr = c[-60:], rsis[-60:]
    A, B = rc[:30], rc[30:]
    ia, ib = A.index(max(A)), 30 + B.index(max(B))
    divergence = max(B) >= max(A) and rr[ib] < rr[ia] - 5
    shoulder = [-0.15 <= dd <= -0.10, bool(divergence), c[L] < ma20]

    idx = list(range(L, max(-1, L - 256), -5))[::-1]
    pts = [round(c[i], 4) for i in idx]

    return {
        "date": dates[L], "last": round(c[L], 4),
        "d1": round((c[L] / c[L - 1] - 1) * 100, 2), "wk": round((c[L] / c[L - 5] - 1) * 100, 2),
        "hi": round(hi, 4), "lo": round(lo, 4), "avg": round(avg, 4), "dd": round(dd * 100, 1),
        "rsi": round(rsi, 1), "buy": pct,
        "factors": {"trend": round(T, 2), "sale": round(D, 2), "overheat": round(O, 2), "volatility": round(V, 2)},
        "shoulder": shoulder,
        "chart": {"start": dates[idx[0]], "end": dates[L], "points": pts},
    }
