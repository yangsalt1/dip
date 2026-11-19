import Link from 'next/link';
import type { Kind } from '@/lib/data';
import { KIND_CHIP } from '@/lib/format';
import { stickerStyle } from '@/lib/sticker';

export function BottomNav({ active }: { active: 'news' | 'etf' | 'money' }) {
  return (
    <nav className="nav" aria-label="메뉴">
      <Link href="/" className="navBrand">DIP<small>buy the dip</small></Link>
      <Link href="/" aria-current={active === 'news' ? 'page' : undefined}>오늘</Link>
      <Link href="/etf/" aria-current={active === 'etf' ? 'page' : undefined}>ETF</Link>
      <Link href="/money/" aria-current={active === 'money' ? 'page' : undefined}>포트폴리오</Link>
    </nav>
  );
}

export function StatusChip({ kind }: { kind: Kind }) {
  return <span className={`chip ${kind}`}>{KIND_CHIP[kind]}</span>;
}

/** 할인 딱지. B = 동그란 도장, F = 숫자만 크게 */
export function Sticker({ kind, dd, d1, label }: { kind: Kind; dd: number; d1: number; label?: string }) {
  const off = Math.abs(dd);
  if (stickerStyle() === 'b') {
    const big = kind === 'mega' || kind === 'sale' ? `${Math.round(off)}%` : kind === 'up' ? `${d1 >= 0 ? '+' : ''}${d1.toFixed(1)}%` : '워워';
    const small = kind === 'mega' ? '특급' : kind === 'sale' ? '할인' : kind === 'up' ? '상승' : '고점';
    return <span className={`stamp ${kind}`}><b>{big}</b><span>{small}</span></span>;
  }
  if (stickerStyle() === 'c') {
    const t = kind === 'mega' ? `↓ ${off.toFixed(1)}% 특급할인` : kind === 'sale' ? `↓ ${off.toFixed(1)}% 할인 중`
      : kind === 'up' ? `↑ ${Math.abs(d1).toFixed(2)}% 상승 중` : '워워 · 최고가 근처';
    return <span className={`pilltag ${kind}`}>{t}</span>;
  }
  const big = kind === 'mega' || kind === 'sale' ? `-${off.toFixed(1)}%` : kind === 'up' ? `${d1 >= 0 ? '+' : ''}${d1.toFixed(2)}%` : '최고가 근처';
  const pre = label ?? (kind === 'mega' || kind === 'sale' ? '고점대비' : kind === 'up' ? '오늘' : '');
  const post = kind === 'mega' ? '특급세일 중' : kind === 'sale' ? '세일 중' : kind === 'up' ? '상승 중' : '워워';
  return <span className={`numtag ${kind}`}>{pre && <small>{pre}</small>}<b>{big}</b><small>{post}</small></span>;
}

export function Back({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="back" aria-label={label}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
    </Link>
  );
}

export function Arrow({ color = '#F4F4F2' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  );
}

export function WarnIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#C2410C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 2 }}><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4.5M12 17.5v.5" /></svg>
  );
}

export function HandIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 9V4.5a1.5 1.5 0 0 1 3 0V10M13 9.5V5.5a1.5 1.5 0 0 1 3 0V12M16 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4 15.5a1.6 1.6 0 0 1 2.4-2.1L7 14" /></svg>
  );
}

export function WeatherIcon() {
  return (
    <svg width="64" height="48" viewBox="0 0 64 48" aria-hidden="true"><circle cx="40" cy="16" r="11" fill="#FFD43B" /><path d="M40 0v4M40 28v4M24 16h4M52 16h4M28.7 4.7l2.8 2.8M48.5 24.5l2.8 2.8M51.3 4.7l-2.8 2.8" stroke="#FFD43B" strokeWidth="3" strokeLinecap="round" /><path d="M14 44h30a10 10 0 0 0 0-20 13 13 0 0 0-25 3A9 9 0 0 0 14 44z" fill="#F4F4F2" /></svg>
  );
}

export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: '14px 12px 0', padding: '18px 20px', borderRadius: 24, background: '#fff', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <WarnIcon />
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: '#2E2E2C' }}>{children}</p>
    </div>
  );
}
