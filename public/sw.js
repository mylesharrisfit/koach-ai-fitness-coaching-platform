const CACHE_NAME = 'koach-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
];

// Install event — cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event — cache-first for assets, network-first for API
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests — network first
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/invoke')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request).catch(() => new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Assets — cache first
  event.respondWith(
    caches.match(request).then(response => {
      if (response) return response;
      return fetch(request).then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        return response;
      }).catch(() => caches.match('/offline.html'));
    })
  );
});

// Push notification event
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const { title, body, icon, badge, tag, actions, vibrate, sound } = data;

  const options = {
    body,
    icon: icon || '/icon-192x192.png',
    badge: badge || '/icon-badge.png',
    tag,
    actions,
    vibrate,
    requireInteraction: false,
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    self.registration.showNotification(title || 'KOACH AI', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action) {
    // Action button clicked
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: event.action,
          notificationData: event.notification.data,
        });
      });
    });
  } else {
    // Notification body clicked
    const url = event.notification.data?.url || '/';
    self.clients.matchAll({ type: 'window' }).then(clients => {
      for (let client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    });
  }
});
