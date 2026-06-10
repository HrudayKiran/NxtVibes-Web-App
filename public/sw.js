self.addEventListener('push', (event) => {
  try {
    const data = event.data.json();
    const title = data.title || "NxtVibes";
    const options = {
      body: data.body || "New notification received",
      icon: data.icon || "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: data.url || "/messages",
      },
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error("Error displaying notification:", err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If there's an open window, focus it and redirect
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) return client.navigate(targetUrl);
          });
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
