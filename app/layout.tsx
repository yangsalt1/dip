import type { Metadata, Viewport } from 'next';
import './globals.css';
import SwRegister from '@/components/SwRegister';
import AppBridge from '@/components/AppBridge';
import Tracker from '@/components/Tracker';
import LoginSheet from '@/components/LoginSheet';
import { LangProvider } from '@/components/Lang';
import { getLang } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getLang()) === 'en';
  return {
  // 주소가 바뀌어도 자동으로 따라가요 (SITE_URL > Vercel 기본 주소)
  metadataBase: new URL(process.env.SITE_URL || 'https://jup-rosy.vercel.app'),
  title: (en ? 'DIP · Buy the dip' : 'JUP · 떨어질 때 줍는다'),
  description: (en ? 'ETFs on sale today, at a glance. A daily market briefing for total beginners.' : '오늘 세일 중인 ETF와 환율을 한눈에. 왕초보를 위한 매일 시장 브리핑.'),
  openGraph: {
    type: 'website',
    url: '/',
    siteName: en ? 'DIP' : 'JUP',
    title: (en ? 'DIP · Buy the dip' : 'JUP · 떨어질 때 줍는다'),
    description: (en ? 'ETFs on sale today, at a glance. A daily market briefing for total beginners.' : '오늘 세일 중인 ETF와 환율을 한눈에. 왕초보를 위한 매일 시장 브리핑.'),
    images: [{ url: '/og-jup.png', width: 1200, height: 630, alt: (en ? 'DIP · Buy the dip' : 'JUP · 떨어질 때 줍는다') }],
  },
  twitter: {
    card: 'summary_large_image',
    title: (en ? 'DIP · Buy the dip' : 'JUP · 떨어질 때 줍는다'),
    images: ['/og-jup.png'],
  },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: en ? 'DIP' : 'JUP', statusBarStyle: 'default' },
  };
}

export const viewport: Viewport = {
  themeColor: '#ECECEA',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=Noto+Sans+KR:wght@500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LangProvider lang={lang}>
          {children}
          <SwRegister />
          <AppBridge />
          <Tracker />
          <LoginSheet />
        </LangProvider>
      </body>
    </html>
  );
}
