import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Google from 'next-auth/providers/google';
import Naver from 'next-auth/providers/naver';
import Kakao from 'next-auth/providers/kakao';
import Credentials from 'next-auth/providers/credentials';
import { createHash } from 'crypto';

/**
 * 로그인: 구글 · 네이버 · 카카오.
 * 각 서비스 키(환경변수)가 들어 있는 것만 버튼이 켜져요.
 *   AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
 *   AUTH_NAVER_ID  / AUTH_NAVER_SECRET
 *   AUTH_KAKAO_ID  / AUTH_KAKAO_SECRET
 */
const providers: Provider[] = [];
if (process.env.AUTH_GOOGLE_ID) providers.push(Google);
if (process.env.AUTH_NAVER_ID) providers.push(Naver);
if (process.env.AUTH_KAKAO_ID) providers.push(Kakao);
// 로컬 테스트 전용 (배포에서는 절대 켜지 않아요)
if (process.env.AUTH_DEV_LOGIN === '1' && !process.env.VERCEL) {
  providers.push(Credentials({ id: 'dev', name: '테스트', credentials: {}, authorize: async () => ({ id: 'tester', name: '테스터' }) }));
}

/** AUTH_SECRET이 없으면 Vercel이 넣어주는 저장소 토큰으로 비밀값을 만들어요 (사용자가 따로 만들 필요 없게). */
function secret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const base = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return base ? createHash('sha256').update('jup-auth:' + base).digest('hex') : undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: secret(),
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 90 },
  pages: { signIn: '/login/' },
  callbacks: {
    jwt({ token, account }) {
      if (account) token.uid = `${account.provider}:${account.providerAccountId}`;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = (token.uid as string) ?? token.sub;
      return session;
    },
  },
});
