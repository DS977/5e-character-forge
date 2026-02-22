// Offline cache for GitHub Pages (v0.1.2)
const CACHE = 'ccf-cache-v3';
const CORE = [
  '/5e-character-forge/',
  '/5e-character-forge/index.html',
  '/5e-character-forge/manifest.webmanifest',
  '/5e-character-forge/service-worker.js',
  '/5e-character-forge/assets/icon-192.png',
  '/5e-character-forge/assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  const isAppScope = url.pathname.startsWith('/5e-character-forge/');
  if (!isAppScope) return;

  const isHtml = req.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('/index.html') || url.pathname === '/5e-character-forge/';
  if (isHtml) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/5e-character-forge/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
      return res;
    }))
  );
});
