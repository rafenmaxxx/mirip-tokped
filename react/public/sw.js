// sw.js - Perbaikan
const CACHE_NAME = "push-notifications-v1";
const QUEUE_CHECK_INTERVAL = 5 * 60 * 1000;

self.addEventListener("install", () => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(self.clients.claim());
});

// PUSH NOTIFICATION HANDLER - FIXED
self.addEventListener("push", (event) => {
  console.log("Push received:", event.data.text());

  if (!event.data) {
    console.error("Push event tanpa data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("Push data:", data);

    const title = data.title || "New Notification";
    const options = {
      body: data.body || "",
      icon: data.icon || "/vite.svg",
      badge: "/vite.svg",
      data: data.data || {},
      timestamp: Date.now(),
      vibrate: [200, 100, 200],
      actions: [
        {
          action: "open",
          title: "Open",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
    };

    event.waitUntil(
      self.registration
        .showNotification(title, options)
        .then(() => {
          console.log("Notification shown successfully");

          // Optional: Kirim ke clients jika perlu
          return self.clients.matchAll({ type: "window" });
        })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "PUSH_NOTIFICATION_RECEIVED",
              payload: data,
            });
          });
        })
        .catch((err) => {
          console.error("Error showing notification:", err);
        })
    );
  } catch (err) {
    console.error("Error parsing push data:", err);

    // Fallback untuk data plain text
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("New Message", {
        body: text,
        icon: "/vite.svg",
      })
    );
  }
});

// NOTIFICATION CLICK HANDLER
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification);
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || "/react/check";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Cari tab yang sudah terbuka
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        // Buka tab baru jika belum ada
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler untuk komunikasi dengan client
self.addEventListener("message", (event) => {
  console.log("SW received message:", event.data);

  if (event.data.type === "USER_ONLINE") {
    // Kirim pesan ke semua clients untuk check queue
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
  }
});
