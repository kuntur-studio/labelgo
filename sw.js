const CACHE_NAME = 'labelgo-v1.3';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/js/app.js',
  './assets/js/print-helper.js',
  './assets/img/background.png',
  './assets/img/icon-512.png',
  './assets/img/icon-192.png',
  'https://cdn.jsdelivr.net/npm/framework7@8/framework7-bundle.min.css',
  'https://cdn.jsdelivr.net/npm/framework7-icons/css/framework7-icons.css',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdn.jsdelivr.net/npm/framework7@8/framework7-bundle.min.js',
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://unpkg.com/papaparse@5.4.1/papaparse.min.js',
  'https://unpkg.com/html5-qrcode'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim(); 
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});