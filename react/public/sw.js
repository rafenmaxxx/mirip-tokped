// sw.js
const CACHE_NAME = "push-notifications-v1";
const QUEUE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 menit

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());

  // Start periodic sync
  startPeriodicSync();
});

// Periodic background sync
function startPeriodicSync() {
  setInterval(async () => {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "CHECK_QUEUE",
        timestamp: new Date().toISOString(),
      });
    });
  }, QUEUE_CHECK_INTERVAL);
}

// Push Notification
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title;
  const options = {
    body: data.body,
    icon: "/vite.svg",
    data: data.data,
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => {
        return self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
      })
      .then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: "PUSH_NOTIFICATION",
            payload: data,
          });
        });
      })
  );
});

// Notification Click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || "/react/";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message dari Client
self.addEventListener("message", (event) => {
  const { type, _ } = event.data;

  if (type === "USER_ONLINE") {
    // Trigger queue check ketika user online
    setTimeout(() => {
      event.waitUntil(
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "CHECK_QUEUE",
              timestamp: new Date().toISOString(),
            });
          });
        })
      );
    }, 1000);
  }
});
