import type { Metadata, Viewport } from 'next';
import './globals.css';
import SwRegister from '@/components/SwRegister';

export const metadata: Metadata = {
  title: 'DIP · 나는 떨어질 때 살거야',
  description: '왕초보를 위한 ETF 시장 브리핑. 떨어져도 즐겁게, buy the dip.',
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
