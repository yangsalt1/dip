import { readDays } from '@/lib/analytics';
import { allPrefs, peekNotices, pushUsers } from '@/lib/house/store';
import { WHO_LABEL } from '@/lib/house/calc';
import type { Pref, Who } from '@/lib/house/types';

const fmt = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)}시간` : s >= 60 ? `${Math.round(s / 60)}분` : `${Math.round(s)}초`);
const count = <T extends string>(arr: T[][]) => {
  const m = new Map<T, number>();
  for (const a of arr) for (const x of a) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

function Bars({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="hBarBox">
      <b>{title}</b>
      {rows.length ? rows.slice(0, 8).map(([k, v]) => (
        <div key={k} className="hBar"><span>{k}</span><i><em style={{ width: `${(v / max) * 100}%` }} /></i><small>{v}명{total ? ` · ${Math.round((v / total) * 100)}%` : ''}</small></div>
      )) : <p className="small" style={{ margin: 0 }}>아직 없음</p>}
    </div>
  );
}

/** 관리자 · 청약 분석: 청약 탭 이용, 많이 본 공고, 사람들이 건 조건 */
export default async function HouseAnalytics() {
  const [days, prefs, pushers, cache] = await Promise.all([
    readDays(7), allPrefs().catch(() => [] as Pref[]), pushUsers().catch(() => [] as string[]), peekNotices().catch(() => null),
  ]);
  const notices = new Map((cache?.list ?? []).map((n) => [n.id, n]));
  let tabViews = 0, tabTime = 0, detViews = 0, detTime = 0;
  const per = new Map<string, { v: number; t: number }>();
  for (const d of days) {
    for (const [p, v] of Object.entries(d.views)) {
      if (p === '/house/') tabViews += v;
      const m = p.match(/^\/house\/([^/]+)\/$/);
      if (m) { detViews += v; const o = per.get(m[1]) ?? { v: 0, t: 0 }; o.v += v; per.set(m[1], o); }
    }
    for (const [p, t] of Object.entries(d.time)) {
      if (p === '/house/') tabTime += t;
      const m = p.match(/^\/house\/([^/]+)\/$/);
      if (m) { detTime += t; const o = per.get(m[1]) ?? { v: 0, t: 0 }; o.t += t; per.set(m[1], o); }
    }
  }
  const top = [...per.entries()].sort((a, b) => b[1].v - a[1].v || b[1].t - a[1].t).slice(0, 10);
  const n = prefs.length;
  const money = prefs.map((p) => p.money).filter((x) => x > 0);
  const moneyRows: [string, number][] = [
    ['상관없음', prefs.filter((p) => !p.money).length],
    ['5천만 이하', money.filter((x) => x <= 5000).length],
    ['5천~1억', money.filter((x) => x > 5000 && x <= 10000).length],
    ['1억~3억', money.filter((x) => x > 10000 && x <= 30000).length],
    ['3억 넘게', money.filter((x) => x > 30000).length],
  ].filter((r) => (r[1] as number) > 0) as [string, number][];

  return (
    <section className="anl">
      <h2 className="anlH">청약 분석 <small>이용은 최근 7일 · 조건은 지금 저장된 것</small></h2>
      <div className="admStats">
        <div><b>{n}</b><span>조건 저장한 사람</span></div>
        <div><b>{pushers.length}</b><span>청약 알림 켠 사람</span></div>
        <div><b>{tabViews}</b><span>청약 탭 조회 (7일)</span></div>
        <div><b>{tabViews ? fmt(tabTime / tabViews) : '-'}</b><span>청약 탭 평균 머문 시간</span></div>
        <div><b>{detViews}</b><span>공고 상세 조회 (7일)</span></div>
        <div><b>{detViews ? fmt(detTime / detViews) : '-'}</b><span>공고 1개 평균 보는 시간</span></div>
      </div>

      <div className="anlBox">
        <b>가장 많이 본 공고 TOP 10</b>
        <div className="anlRow head"><span>공고</span><span>조회</span><span>총 머문 시간</span><span>평균</span></div>
        {top.map(([id, o]) => {
          const x = notices.get(id);
          return (
            <div key={id} className="anlRow">
              <span title={x?.name ?? id}>{x ? `${x.name} · ${x.sido}${x.gu ? ` ${x.gu}` : ''} · ${x.cat}` : `공고 ${id} (마감돼서 목록에서 빠짐)`}</span>
              <span>{o.v}</span><span>{fmt(o.t)}</span><span>{o.v ? fmt(o.t / o.v) : '-'}</span>
            </div>
          );
        })}
        {!top.length && <p className="small" style={{ margin: 0 }}>아직 기록 없음</p>}
      </div>

      <div className="hBarGrid">
        <Bars title="누가 보나 (나는)" rows={count(prefs.map((p) => p.who)).map(([k, v]) => [WHO_LABEL[k as Who] ?? k, v])} total={n} />
        <Bars title="많이 고른 지역 (시·도)" rows={count(prefs.map((p) => p.sido))} total={n} />
        <Bars title="많이 고른 지역 (구·시)" rows={count(prefs.map((p) => p.gu))} total={n} />
        <Bars title="원하는 방 개수" rows={count(prefs.map((p) => p.rooms)).map(([k, v]) => [`방 ${k}개${k === '3' ? ' 이상' : ''}`, v])} total={n} />
        <Bars title="분양 / 임대" rows={count(prefs.map((p) => p.kind)).map(([k, v]) => [k === 'sale' ? '분양 (내 집)' : '임대 (전월세)', v])} total={n} />
        <Bars title="지금 쓸 수 있는 돈" rows={moneyRows} total={n} />
      </div>
      <p className="small" style={{ margin: 0, color: '#6B6B69' }}>여러 개를 고를 수 있어서 비율을 더하면 100%가 넘을 수 있어요. 개인 정보는 없이 합계만 보여줘요.</p>
    </section>
  );
}
