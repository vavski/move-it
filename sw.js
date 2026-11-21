// App-shell service worker for Move It.
// Network-first for index.html so a new deploy is picked up quickly.
// Precache local HTML/JS/icons; cache-on-fetch for CDN/fonts/MediaPipe
// so a stale model cannot be baked in at install time.
const SHELL = 'move-it-shell-v2';
const RUNTIME = 'move-it-runtime-v2';

const SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/main.js',
  './js/i18n.js',
  './js/stats.js',
  './js/zaklad.js',
  './js/beh.js',
  './js/let.js',
  './js/postavy.js',
  './js/pwa.js',
  './js/navod.js',
  './js/letci.js',
  './js/bezci.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // Add one-by-one so a single miss does not fail the whole install.
    await Promise.all(SHELL_URLS.map(async url => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) await cache.put(url, res);
      } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, RUNTIME]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function jeNavigace(request, url) {
  if (request.mode === 'navigate' || request.destination === 'document') return true;
  const p = url.pathname;
  return p.endsWith('/') || p.endsWith('/index.html');
}

function jeAnalytika(url) {
  return /goatcounter\.com$/.test(url.hostname) || url.hostname === 'gc.zgo.at';
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      try { await cache.put(request, fresh.clone()); } catch {}
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request) || await cache.match('./index.html') || await cache.match('./');
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request).then(res => { if (res && res.ok) cache.put(request, res.clone()); }).catch(() => {});
    return cached;
  }
  const fresh = await fetch(request);
  if (fresh && fresh.ok) {
    try { await cache.put(request, fresh.clone()); } catch {}
  }
  return fresh;
}

async function cacheOnFetch(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      try { await cache.put(request, fresh.clone()); } catch {}
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  let url;
  try { url = new URL(request.url); } catch { return; }
  if (jeAnalytika(url)) return;

  if (jeNavigace(request, url)) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.origin === self.location.origin) {
    // hudbu prohlížeč stahuje po kouscích (přehrávač) – necháme ji jít rovnou, mimo service worker
    if (/\/hudba\//.test(url.pathname)) return;
    // velké neměnné soubory (knihovny, model kamery, postavy, ikony) z mezipaměti; kód hry vždy čerstvý,
    // aby se po nahrání nové verze nepomíchala stará a nová část hry
    if (/\/(vendor|postavy|icons)\//.test(url.pathname)) event.respondWith(cacheFirst(request));
    else event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheOnFetch(request));
});
