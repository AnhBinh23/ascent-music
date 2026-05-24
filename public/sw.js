self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
});

self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};
  const title = data.title || 'Ascent Music';
  const options = {
    body:    data.body || '',
    icon:    '/icons/icon-192x192.png',
    badge:   '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});