'use client';
import { useEffect } from 'react';

type Cap = { isNativePlatform?: () => boolean; Plugins?: { App?: { addListener: (e: string, cb: (d: { canGoBack: boolean }) => void) => void; exitApp: () => void } } };

/** 앱(안드로이드·아이폰) 안에서 열렸을 때만: 뒤로가기 버튼 처리 */
export default function AppBridge() {
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: Cap }).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    document.documentElement.classList.add('inApp');
    const app = cap.Plugins?.App;
    app?.addListener('backButton', ({ canGoBack }) => (canGoBack ? history.back() : app.exitApp()));
  }, []);
  return null;
}

/** 앱 안 웹뷰인지 (구글 로그인은 웹뷰에서 막혀서 숨겨요) */
export const isInApp = (ua: string) => ua.includes('JUPApp');
