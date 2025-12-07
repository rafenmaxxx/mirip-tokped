self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title;
  const options = {
    body: data.body,
    icon: "/vite.svg",
    data: data.data,
  };

  event.waitUntil(self.registration.showNotification(title, options));

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
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
