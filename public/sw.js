const CACHE_NAME = 'yasmin-v3';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Recebe a notificação push do servidor
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon',
      badge: '/icon',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Quando o usuário clica na notificação, abre o app na página certa
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
