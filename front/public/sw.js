self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.notification.body,
      icon: data.notification.icon || '/logo.png',
      badge: '/badge.png', // Optional
      data: {
        url: data.notification.data?.url || '/',
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
