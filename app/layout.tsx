import type { Metadata, Viewport } from 'next';
import './globals.css';
import SwRegister from '@/components/SwRegister';

export const metadata: Metadata = {
  metadataBase: new URL('https://dip-rosy.vercel.app'),
  title: 'DIP · 떨어질 때 사리라',
  description: '오늘 세일 중인 ETF와 환율을 한눈에. 왕초보를 위한 매일 시장 브리핑.',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'DIP',
    title: 'DIP · 떨어질 때 사리라',
    description: '오늘 세일 중인 ETF와 환율을 한눈에. 왕초보를 위한 매일 시장 브리핑.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'DIP · 떨어질 때 사리라' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIP · 떨어질 때 사리라',
    images: ['/og.png'],
  },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'DIP', statusBarStyle: 'default' },
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
      </body>
    </html>
  );
}
