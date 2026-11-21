import { cookies, headers } from 'next/headers';
import { LANG_COOKIE, langFrom, type Lang } from './i18n';

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  const a = (await headers()).get('accept-language');
  return langFrom(c, a);
}
