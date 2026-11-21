import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.jup.app',
  appName: 'JUP',
  webDir: 'www',
  // 앱은 라이브 사이트를 그대로 띄워요. 사이트를 고치면 앱도 바로 바뀌어요.
  server: {
    url: 'https://jup-rosy.vercel.app',
    errorPath: 'index.html',
    allowNavigation: [
      'jup-rosy.vercel.app',
      '*.kakao.com', '*.kakao.co.kr', 'kauth.kakao.com', 'accounts.kakao.com',
      'nid.naver.com', '*.naver.com',
      'accounts.google.com', '*.google.com',
    ],
  },
  backgroundColor: '#ECECEA',
  android: { appendUserAgent: 'JUPApp' },
  ios: { appendUserAgent: 'JUPApp', contentInset: 'never' },
  plugins: {
    SplashScreen: { launchShowDuration: 900, backgroundColor: '#ECECEA', showSpinner: false },
    StatusBar: { style: 'LIGHT', backgroundColor: '#ECECEA', overlaysWebView: false },
  },
};

export default config;
