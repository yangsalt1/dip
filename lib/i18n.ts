/** 한국어 / English. 쿠키 'lang'에 저장, 없으면 브라우저 언어로 */
export type Lang = 'ko' | 'en';
export const LANG_COOKIE = 'lang';
export const pick = (lang: Lang, ko: string, en: string) => (lang === 'en' ? en : ko);
export const langFrom = (cookie?: string | null, accept?: string | null): Lang =>
  cookie === 'en' || cookie === 'ko' ? cookie : /^\s*ko\b/i.test(accept ?? '') || !accept ? 'ko' : 'en';
/** 브랜드: 한국어 JUP, 영어 DIP */
export const BRAND = { ko: { name: 'JUP', tag: '떨어질 때 줍는다' }, en: { name: 'DIP', tag: 'Buy the dip' } } as const;
/** 데이터에 영어 필드(xxxEn)가 있으면 그걸, 없으면 원래 값 */
export function tf<T extends object, K extends keyof T & string>(o: T, key: K, lang: Lang): T[K] {
  if (lang === 'en') {
    const v = (o as Record<string, unknown>)[`${key}En`];
    if (v != null && v !== '') return v as T[K];
  }
  return o[key];
}
