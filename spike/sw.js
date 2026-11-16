// Service worker del prototipo di prova (usa e getta).
// Se cambi un file della spike, cambia anche il nome della cache qui sotto,
// altrimenti il telefono continua a servire la versione vecchia (cache-first).
const CACHE = 'nay-spike-1';

const FILES = [
  './',
  './index.html',
  './spike.js',
  './format.js',
  './manifest.webmanifest',
  './snowball/_stemmer.js',
  './snowball/spanish_stemmer.js',
  '../vendor/fflate.js',
  '../assets/icons/icon-192.png',
  '../assets/icons/icon-512.png',
  '../assets/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request)));
});
