const CACHE_NAME = 'labelgo-v1';
const ASSETS = [
  './',
  './index.html',
  './assets/js/app.js',
  'https://cdn.jsdelivr.net/npm/framework7@8/framework7-bundle.min.css',
  'https://cdn.jsdelivr.net/npm/framework7-icons/css/framework7-icons.css',
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://unpkg.com/papaparse@5.4.1/papaparse.min.js',
  'https://unpkg.com/html5-qrcode'
];

self.addEventListener('install', e => {
  self.skipWaiting(); // Fuerza la instalación inmediata
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  // Limpia cachés antiguas automáticamente
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});