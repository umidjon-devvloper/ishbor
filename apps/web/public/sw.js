/* ISH BOR! — push xabarnomalari uchun service worker.
   Faqat push va bosish hodisalarini boshqaradi; sahifalarni kesh qilmaydi
   (SSR sayti uchun kesh keraksiz murakkablik qo'shardi). */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "ISH BOR!", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "ISH BOR!";
  const options = {
    body: payload.body || "",
    icon: "/logo-180.png",
    badge: "/logo-48.png",
    tag: payload.tag || "ish-bor",
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Sayt allaqachon ochiq bo'lsa — o'sha oynani ishlatamiz
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
