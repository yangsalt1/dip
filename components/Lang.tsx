'use client';
import { createContext, useContext, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LANG_COOKIE, pick, type Lang } from '@/lib/i18n';

const Ctx = createContext<{ lang: Lang; set: (l: Lang) => void }>({ lang: 'ko', set: () => {} });

export function LangProvider({ lang: initial, children }: { lang: Lang; children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial);
  const router = useRouter();
  const [, start] = useTransition();
  const set = (l: Lang) => {
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    setLang(l);
    start(() => router.refresh());
  };
  return <Ctx.Provider value={{ lang, set }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx).lang;
/** const t = useT(); t('한국어', 'English') */
export const useT = () => {
  const lang = useLang();
  return (ko: string, en: string) => pick(lang, ko, en);
};

/** 한 / EN 스위치 */
export function LangSwitch({ dark }: { dark?: boolean }) {
  const { lang, set } = useContext(Ctx);
  return (
    <span className={`langSw${dark ? ' dark' : ''}`} role="group" aria-label="Language">
      <button type="button" aria-pressed={lang === 'ko'} onClick={() => set('ko')}>한</button>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => set('en')}>EN</button>
    </span>
  );
}

/** 로고 + 언어 스위치 (한국어 JUP / 영어 DIP) */
export function Brand() {
  const lang = useLang();
  const b = lang === 'en' ? { n: 'DIP', t: 'Buy the dip' } : { n: 'JUP', t: '떨어질 때 줍는다' };
  return (
    <span className="brandRow">
      <a href="/" className="brand">{b.n}<small>{b.t}</small></a>
      <LangSwitch />
    </span>
  );
}
