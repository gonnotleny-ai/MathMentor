const CACHE_NAME = 'mathmentor-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data.js',
  '/modules/dashboard.js',
  '/modules/library.js',
  '/modules/courses.js',
  '/modules/flashcards.js',
  '/modules/assistant.js',
  '/modules/state.js',
  '/modules/self-eval.js',
  '/modules/navigation.js',
  '/modules/auth.js',
  '/modules/api.js',
  '/modules/utils.js',
  '/modules/progress.js',
  '/modules/badges.js',
  '/modules/account.js',
  '/modules/generator.js',
  '/modules/teacher.js',
  '/modules/exam.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Ne pas intercepter les appels API et les CDN externes
  if (url.pathname.startsWith('/api/') || !url.origin.includes(self.location.origin)) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
