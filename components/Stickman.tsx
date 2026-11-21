import { DOT_AT, type Part } from '@/lib/fng';

/** 졸라맨 + 지금 위치 빨간 점 */
export default function Stickman({ part, color = '#111', width = 92, dot = 11 }: { part: Part; color?: string; width?: number; dot?: number }) {
  const [x, y] = DOT_AT[part.key];
  return (
    <svg viewBox="0 0 100 240" width={width} aria-hidden="true" style={{ flex: 'none', display: 'block' }}>
      <g fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="30" r="20" />
        <path d="M50 50 V140" />
        <path d="M50 70 L18 110 M50 70 L82 110" />
        <path d="M50 140 L28 222 M50 140 L72 222" />
        <path d="M28 222 h-12 M72 222 h12" />
      </g>
      <circle cx={x} cy={y} r={dot} fill="#FF5A3C" />
    </svg>
  );
}
