const CACHE_NAME = 'yasmin-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handler fetch obrigatório para o Chrome Android considerar o app instalável
self.addEventListener('fetch', (event) => {
  // Estratégia simples: rede primeiro, cache como fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
