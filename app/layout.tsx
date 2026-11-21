import type { Metadata, Viewport } from 'next';
import './globals.css';
import SwRegister from '@/components/SwRegister';
import AppBridge from '@/components/AppBridge';
import LoginSheet from '@/components/LoginSheet';

export const metadata: Metadata = {
  // 주소가 바뀌어도 자동으로 따라가요 (SITE_URL > Vercel 기본 주소)
  metadataBase: new URL(process.env.SITE_URL || 'https://jup-rosy.vercel.app'),
  title: 'JUP · 떨어질 때 줍는다',
  description: '오늘 세일 중인 ETF와 환율을 한눈에. 왕초보를 위한 매일 시장 브리핑.',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'JUP',
    title: 'JUP · 떨어질 때 줍는다',
    description: '오늘 세일 중인 ETF와 환율을 한눈에. 왕초보를 위한 매일 시장 브리핑.',
    images: [{ url: '/og-jup.png', width: 1200, height: 630, alt: 'JUP · 떨어질 때 줍는다' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JUP · 떨어질 때 줍는다',
    images: ['/og-jup.png'],
  },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'JUP', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#ECECEA',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=Noto+Sans+KR:wght@500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <SwRegister />
        <AppBridge />
        <LoginSheet />
      </body>
    </html>
  );
}
