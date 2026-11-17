// Service worker (modulo ES). Precache da precache.json, prima la cache, nessuna richiesta
// verso altri siti. La versione viene da js/version.js: quando cambia quel file il browser
// vede un service worker nuovo (byte diversi in un modulo importato) e lo installa.
import { APP_VERSION } from './js/version.js';
import { cacheName, staleCaches } from './js/cache.js';

const CURRENT = cacheName(APP_VERSION);
const SCOPE_PATH = new URL('./', self.location.href).pathname; // es. /Nay-app/
const SPIKE_PATH = `${SCOPE_PATH}spike/`; // la prova sul Samsung ha un suo service worker
let healing = null; // riparazione della cache in corso

// Ogni richiesta del precache porta ?v=<versione>: cambia con la versione, quindi nemmeno una
// copia vecchia tenuta da una rete di distribuzione può essere presa per quella nuova.
// (cache.match con ignoreSearch la ritrova poi con l'indirizzo normale.)
const versioned = (file) => `${file}${file.includes('?') ? '&' : '?'}v=${encodeURIComponent(APP_VERSION)}`;

// Scarica tutto l'elenco di precache.json nella cache della versione corrente.
async function precacheAll() {
  // cache: 'reload' salta la cache HTTP: GitHub Pages manda max-age=600 e un file appena
  // pubblicato non deve arrivare nella cache dell'app nella sua versione vecchia.
  const response = await fetch(versioned('./precache.json'), { cache: 'reload' });
  if (!response.ok) throw new Error(`precache.json: HTTP ${response.status}`);
  const { files } = await response.json();
  const cache = await caches.open(CURRENT);
  await cache.addAll(files.map((file) => new Request(versioned(file), { cache: 'reload' })));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAll());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(staleCaches(names, APP_VERSION).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE_PATH) || url.pathname.startsWith(SPIKE_PATH)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CURRENT);
      const hit = await cache.match(request, { ignoreSearch: true });
      if (hit) return hit;
      // Non c'è in cache. Se manca perfino la pagina principale, la cache è stata cancellata da fuori
      // (per esempio da un altro service worker sulla stessa origine): si rifà il precache in
      // background, così l'app si ripara da sola finché c'è rete.
      if (request.mode === 'navigate' && !(await cache.match('./index.html', { ignoreSearch: true }))) {
        healing ??= precacheAll().catch(() => {}).finally(() => (healing = null));
        event.waitUntil(healing);
      }
      return fetch(request);
    })(),
  );
});
