// JUP 서비스워커: 한 번 본 화면은 오프라인에서도 열리게 저장해요. 푸시 알림(세일·워워)은 여기에 붙이면 돼요.
const CACHE = 'jup-v2';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  // 로그인·내 리스트는 저장하지 않아요
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/login') || u.pathname.startsWith('/jup')) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'JUP', body: '오늘의 세일 소식이 도착했어요' };
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/icon-192.png' }));
});
