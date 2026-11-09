// Keksfabrik service worker: lets the game open offline and as an installed app.
// Raise CACHE with every game update (see CLAUDE.md) so old files are cleared out.
const CACHE = 'keksfabrik-v56';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('keksfabrik-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The version file is how the game notices updates: never cache it.
  if (url.origin === location.origin && url.pathname.endsWith('/version.json')) return;

  // The game page: always ask the server for the newest version first (skipping the
  // browser's 10-minute page cache), and fall back to the saved copy when offline.
  // admin.html (the owner's version) is kept apart, so players never get it from the cache.
  if (req.mode === 'navigate' || (url.origin === location.origin && /\/(index|admin)\.html$/.test(url.pathname))) {
    const key = url.pathname.endsWith('/admin.html') ? './admin.html' : './index.html';
    e.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); } return res; })
        .catch(() => caches.match(key).then((r) => r || caches.match('./')))
    );
    return;
  }

  // Icons, manifest and fonts: answer from the cache, refresh it in the background.
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin === location.origin || fonts) {
    e.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((hit) => {
        const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      }))
    );
  }
});

// Push notifications (gifts, friend requests, admin messages, club prizes, global events).
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: e.data ? e.data.text() : '' }; }
  const title = d.title || 'Cookie Factory';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '', icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: 'kf-' + title.slice(0, 24), data: { url: d.url || './' }
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    // Admin alerts open admin.html; everything else opens (or focuses) the game.
    const admin = /admin\.html$/.test(target);
    for (const c of list) { if ('focus' in c && admin === /admin\.html/.test(c.url)) return c.focus(); }
    return self.clients.openWindow ? self.clients.openWindow(target) : null;
  }));
});
