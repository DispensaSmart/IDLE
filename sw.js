// Service worker: fa funzionare il gioco anche senza rete dopo la prima apertura.
// Strategia: risponde subito dalla cache e intanto scarica la versione nuova per la volta dopo.
const CACHE = 'portale-rotto-v1';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './js/main.js',
  './js/logic/util.js',
  './js/logic/data.js',
  './js/logic/state.js',
  './js/logic/hero.js',
  './js/logic/loot.js',
  './js/logic/expedition.js',
  './js/logic/battle.js',
  './js/logic/offline.js',
  './js/logic/defense.js',
  './js/ui/draw.js',
  './js/ui/battle-view.js',
  './js/ui/defense-view.js',
  './js/ui/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const network = fetch(event.request)
        .then((res) => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
