const CACHE_NAME = 'moon-shared-living-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/brand/moon-logo-black.png',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push notification event (for Progressier integration)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nueva notificación',
    icon: '/brand/moon-logo-black.png',
    badge: '/brand/moon-logo-black.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/brand/moon-logo-black.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/brand/moon-logo-black.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(': moon shared living', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/alojamientos')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
