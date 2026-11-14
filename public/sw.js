const CACHE_NAME = 'yasmin-v5';
const APP_SHELL = [
  '/',
  '/login',
  '/manifest.webmanifest',
  '/icon',
];

// INSTALAÇÃO: guarda a casca do app em cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ATIVAÇÃO: limpa caches antigos
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

// PUSH: notificações
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

// FETCH: estratégia inteligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora métodos não-GET (POST, PUT, etc) - deixa passar direto pela rede
  if (request.method !== 'GET') return;

  // Ignora requisições para o Supabase (API) - sempre vai pela rede
  if (url.hostname.includes('supabase.co')) return;

  // Navegação (abrir páginas): NETWORK-FIRST com fallback para CACHE
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Atualiza o cache com a versão fresca
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Se falhar, serve do cache ou a home como fallback
          return caches.match(request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // Assets estáticos (JS, CSS, imagens): CACHE-FIRST (rápido e funciona offline)
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
        }).catch(() => caches.match('/'));
      })
    );
  }
});
