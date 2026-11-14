const CACHE_NAME = 'yasmin-v6';
const APP_SHELL = ['/', '/login', '/manifest.webmanifest', '/icon'];
const OFFLINE_PAGE = '/offline.html';

// INSTALAÇÃO
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ATIVAÇÃO
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// PUSH
self.addEventListener('push', function(event) {
  let data = { title: 'Yasmin', body: 'Notificação!', url: '/' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch (e) { const text = event.data.text(); if (text) data.body = text; }
  }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: '/icon', badge: '/icon',
    vibrate: [100, 50, 100], data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// FETCH
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;

  // NAVEGAÇÃO (abrir páginas)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Sucesso: guarda a página no cache para uso futuro offline
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          // Falhou: procura essa rota específica no cache
          const cached = await caches.match(request);
          if (cached) return cached;

          // Se não encontrou, tenta o cache da home
          const homeCached = await caches.match('/');
          if (homeCached) {
            // Retorna a home, mas avisa o app que a rota não está disponível
            return homeCached;
          }

          // Último recurso: página offline
          return caches.match(OFFLINE_PAGE) || new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // ASSETS (JS, CSS, imagens): cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
  }
});
