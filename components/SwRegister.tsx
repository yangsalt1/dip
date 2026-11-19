'use client';
import { useEffect } from 'react';

/** 폰 홈 화면에 설치(PWA)되도록 서비스워커를 등록해요. 푸시 알림도 여기서 시작해요. */
export default function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
