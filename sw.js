self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('contador-cache').then(cache => {
      return cache.addAll([
        '/home.html',
        '/style.css',
        '/index.js',
        '/manifest.json',
        '/assets/logo.png'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
