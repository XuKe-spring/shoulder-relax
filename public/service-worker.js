let timerId = null;
let intervalMs = 45 * 60 * 1000;

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    self.registration.showNotification("肩颈放松", {
      body: "该站起来活动一下了！来做个微休息吧",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: "shoulder-relax-reminder",
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });
  }, intervalMs);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE") {
    intervalMs = (event.data.interval ?? 45) * 60 * 1000;
    startTimer();
  } else if (event.data?.type === "STOP") {
    stopTimer();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
