'use client';
import { useLang } from './Lang';
import { tf } from '@/lib/i18n';
import { Brand } from './Lang';
import { useLive } from '@/lib/live';
import { etfTitle } from '@/lib/format';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ETFS, etfById, type Etf } from '@/lib/data';
import { priceText } from '@/lib/format';
import { toggleJup, useJup, goLogin } from '@/lib/useJup';
import { BottomNav, Sticker, Arrow } from './ui';

function Check() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}
function Plus() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}

/** ETF 상세: 줍줍리스트에 담기 */
export function JupButton({ id }: { id: string }) {
  const s = useJup();
  const en = useLang() === 'en';
  const on = s.status === 'in' && s.ids.includes(id);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button type="button" className={`cta jupBtn${on ? ' on' : ''}`} aria-pressed={on} disabled={s.status === 'loading'}
        onClick={() => toggleJup(id)}>
        <span>{en ? (on ? 'Added to my dip list' : s.status === 'out' ? 'Log in to add to my dip list' : 'Add to my dip list') : on ? '줍줍리스트에 담았어요' : s.status === 'out' ? '로그인하고 줍줍리스트에 담기' : '줍줍리스트에 담기'}</span>
        {on ? <Check /> : <Plus />}
      </button>
      {on && <Link href="/jup/" className="small" style={{ margin: '0 8px', fontWeight: 800 }}>{en ? 'See my dip list →' : '내 줍줍리스트 보기 →'}</Link>}
      {s.error && <p role="alert" className="small" style={{ margin: '0 8px', color: '#A3200F' }}>{s.error}</p>}
    </div>
  );
}

/** 목록 안의 작은 담기 버튼 */
export function JupMini({ id }: { id: string }) {
  const s = useJup();
  const en = useLang() === 'en';
  const on = s.status === 'in' && s.ids.includes(id);
  const e = etfById(id);
  return (
    <button type="button" className={`jupMini${on ? ' on' : ''}`} aria-pressed={on} aria-label={en ? `${on ? 'Remove' : 'Add'} ${e?.code ?? id} ${on ? 'from' : 'to'} my dip list` : `${e?.code ?? id} 줍줍리스트${on ? '에서 빼기' : '에 담기'}`}
      onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); toggleJup(id); }}>
      {on ? <Check /> : <Plus />}
    </button>
  );
}

function Row({ e }: { e: Etf }) {
  const lang = useLang();
  const native = e.market === 'us' ? 'usd' : 'krw';
  return (
    <div className="jupRow">
      <Link href={`/etf/${e.id}/`} className="jupMain">
        <span className="jupName"><b>{etfTitle(e, lang)}</b><small>{tf(e, 'kw', lang)}</small></span>
        <span className="jupSide"><Sticker kind={e.kind} dd={e.q.dd} d1={e.q.d1} /><b className="jupPrice">{priceText(e, native, lang)}</b></span>
      </Link>
      <JupMini id={e.id} />
    </div>
  );
}

async function wipe(en: boolean) {
  if (!window.confirm(en ? 'Delete your whole dip list and log out? This can’t be undone.' : '줍줍리스트를 모두 지우고 로그아웃할까요? 되돌릴 수 없어요.')) return;
  await fetch('/api/jup', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ all: true }), credentials: 'same-origin' }).catch(() => {});
  await signOut({ redirectTo: '/jup/' });
}

export default function JupPage() {
  useLive();
  const en = useLang() === 'en';
  const t = (ko: string, e: string) => (en ? e : ko);
  const s = useJup();
  const list = s.ids.map((id) => ETFS.find((e) => e.id === id)).filter(Boolean) as Etf[];
  list.sort((a, b) => a.q.dd - b.q.dd);
  const mega = list.filter((e) => e.kind === 'mega');
  const sale = list.filter((e) => e.kind === 'sale');
  const rest = list.filter((e) => e.kind !== 'mega' && e.kind !== 'sale');

  return (
    <main className="app">
      <header className="hdr">
        <div>
          <Brand />
          <h1 className="title">{t('줍줍', 'My dip')}<br /><span>{t('리스트', 'list')}</span></h1>
        </div>
      </header>

      {s.status === 'loading' && <p className="note" style={{ marginTop: 24 }}>{t('불러오는 중…', 'Loading…')}</p>}

      {s.status === 'out' && (
        <div className="stack keep">
          <section className="card dark" style={{ gap: 14 }}>
            <span className="small" style={{ color: '#BDBDBA', fontWeight: 700 }}>{t('로그인하면', 'Log in and')}</span>
            <p style={{ margin: 0, fontSize: 28, lineHeight: 1.25, fontWeight: 800, letterSpacing: '-0.04em' }}>{en ? <>see if your saved ETFs<br />are on sale, at a glance.</> : <>찜해둔 ETF가<br />세일하는지 한눈에.</>}</p>
            <p className="small" style={{ margin: 0, color: '#CFCFCB' }}>{t('폰이랑 컴퓨터 어디서든 같은 리스트가 보여요.', 'Same list on your phone and computer.')}</p>
            <button type="button" className="cta light" onClick={goLogin}>{t('구글 · 네이버 · 카카오로 시작하기', 'Start with Google · Naver · Kakao')}<Arrow color="#111" /></button>
          </section>
        </div>
      )}

      {s.status === 'in' && (
        <div className="stack keep">
          {!s.ready && <section className="card" style={{ background: '#F2F28E' }}><b>{t('저장소를 연결하는 중이에요.', 'Connecting storage.')}</b><span className="small">{t('곧 담을 수 있어요.', 'You can save soon.')}</span></section>}
          {list.length === 0 ? (
            <section className="card" style={{ background: '#C9DDF7', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 24, lineHeight: 1.3, fontWeight: 800, letterSpacing: '-0.035em' }}>{t('아직 비어 있어요.', 'Empty for now.')}</p>
              <p className="small" style={{ margin: 0 }}>{en ? <>Tap <b>+ Add to my dip list</b> on any ETF you like. When it goes on sale, you’ll see it here.</> : <>마음에 드는 ETF에서 <b>+ 줍줍리스트에 담기</b>를 눌러봐요. 세일 들어가면 여기서 바로 보여요.</>}</p>
              <Link href="/etf/" className="cta">{t('ETF 둘러보기', 'Browse ETFs')}<Arrow /></Link>
            </section>
          ) : (
            <>
              <section className="card dark" style={{ gap: 6 }}>
                <span className="small" style={{ color: '#BDBDBA', fontWeight: 700 }}>{en ? `Of your ${list.length}` : `담은 ${list.length}개 중`}</span>
                <p style={{ margin: 0, fontSize: 30, lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.04em' }}>
                  {mega.length + sale.length > 0 ? (en ? `${mega.length + sale.length} on sale` : `${mega.length + sale.length}개 세일 중`) : t('지금은 세일 없음', 'None on sale right now')}
                </p>
                <p className="small" style={{ margin: 0, color: '#CFCFCB' }}>
                  {en ? `${mega.length > 0 ? `${mega.length} mega sale · ` : ''}${sale.length > 0 ? `${sale.length} on sale · ` : ''}${rest.length} others` : `${mega.length > 0 ? `특급세일 ${mega.length}개 · ` : ''}${sale.length > 0 ? `일반세일 ${sale.length}개 · ` : ''}나머지 ${rest.length}개`}
                </p>
              </section>
              {mega.length > 0 && <Group title={t('특급세일', 'Mega sale')} bg="#FF5A3C" items={mega} />}
              {sale.length > 0 && <Group title={t('일반세일', 'On sale')} bg="#C9DDF7" items={sale} />}
              {rest.length > 0 && <Group title={t('기다리는 중', 'Waiting')} bg="#F7F7F5" items={rest} />}
            </>
          )}
          <div className="jupMe">
            <span className="small">{en ? (s.name ? `Logged in as ${s.name}` : 'Logged in') : s.name ? `${s.name}님으로 로그인 중` : '로그인 중'}</span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="pill outline" onClick={() => signOut({ redirectTo: '/jup/' })}>{t('로그아웃', 'Log out')}</button>
              <button type="button" className="pill" style={{ color: '#A3200F' }} onClick={() => wipe(en)}>{t('내 정보 지우기', 'Delete my data')}</button>
            </span>
          </div>
        </div>
      )}
      {s.error && <p role="alert" className="note" style={{ color: '#A3200F' }}>{s.error}</p>}
      <p className="note">{t('세일이어도 더 떨어질 수 있어요. 한 번에 말고 나눠서. 투자 권유 아님.', 'A sale can still fall further. Buy in pieces. Not investment advice.')} · <Link href="/privacy/">{t('개인정보처리방침', 'Privacy policy')}</Link></p>
      <BottomNav active="money" />
    </main>
  );
}

function Group({ title, bg, items }: { title: string; bg: string; items: Etf[] }) {
  return (
    <section className="card" style={{ background: bg, gap: 4 }} aria-label={title}>
      <span className="label">{title}</span>
      {items.map((e) => <Row key={e.id} e={e} />)}
    </section>
  );
}
