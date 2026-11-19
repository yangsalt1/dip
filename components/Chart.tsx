export default function Chart({ points, start, label }: { points: number[]; start: string; label: string }) {
  const W = 318, H = 150;
  const lo = Math.min(...points), hi = Math.max(...points);
  const pad = (hi - lo) * 0.08 || 1;
  const y = (v: number) => H - ((v - (lo - pad)) / (hi - lo + pad * 2)) * H;
  const x = (i: number) => (i * W) / (points.length - 1);
  const line = points.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const iMax = points.indexOf(hi);
  const last = points.length - 1;
  const ym = (s: string) => s.slice(2, 4) + '.' + s.slice(5, 7);
  const mid = new Date(start);
  mid.setMonth(mid.getMonth() + 6);
  return (
    <svg className="chart" width="100%" height="170" viewBox="-6 -14 330 184" role="img" aria-label={label}>
      <path d={`M0,${H} L${line} L${W},${H} Z`} fill="#B1A6FF" opacity="0.35" />
      <polyline points={line} fill="none" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <line x1="0" y1={y(hi)} x2={W} y2={y(hi)} stroke="#111" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
      <circle cx={x(iMax)} cy={y(hi)} r="5" fill="#111" />
      <text x={Math.max(24, x(iMax) - 8)} y={y(hi) - 8} fontSize="11" fontWeight="700" textAnchor="end" fill="#111">고점</text>
      <circle cx={x(last)} cy={y(points[last])} r="6" fill="#F06C3C" stroke="#111" strokeWidth="2" />
      <text x="0" y="168" fontSize="11" fontWeight="600" fill="#5A5A58">{ym(start)}</text>
      <text x={W / 2} y="168" fontSize="11" fontWeight="600" textAnchor="middle" fill="#5A5A58">{ym(mid.toISOString())}</text>
      <text x={W} y="168" fontSize="11" fontWeight="600" textAnchor="end" fill="#5A5A58">지금</text>
    </svg>
  );
}
