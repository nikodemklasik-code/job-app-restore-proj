/* eslint-disable no-undef */
/**
 * Service Worker for Web Push Notifications (VAPID)
 *
 * Handles:
 * - push: Show a notification when a push event is received
 * - notificationclick: Navigate to the URL specified in the notification data
 */

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'MultivoHub', body: event.data.text() };
  }

  const options = {
    body: data.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag ?? 'multivohub-notification',
    data: { url: data.url ?? '/' },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'MultivoHub', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus an existing tab if open
        for (const client of windowClients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
