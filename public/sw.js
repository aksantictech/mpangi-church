const CACHE_NAME = "mpangi-church-pwa-v5";
const APP_SHELL = ["/offline", "/install"];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(APP_SHELL)
      )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter(
                (key) =>
                  key !==
                  CACHE_NAME
              )
              .map((key) =>
                caches.delete(
                  key
                )
              )
          )
        ),
    ])
  );
});

async function networkFirst(
  request,
  fallback
) {
  const cache =
    await caches.open(
      CACHE_NAME
    );

  try {
    const response =
      await fetch(request);

    if (response.ok) {
      cache.put(
        request,
        response.clone()
      );
    }

    return response;
  } catch {
    return (
      (await cache.match(
        request
      )) ||
      (fallback
        ? await cache.match(
            fallback
          )
        : Response.error())
    );
  }
}

async function cacheFirst(
  request
) {
  const cache =
    await caches.open(
      CACHE_NAME
    );

  const cached =
    await cache.match(
      request
    );

  if (cached) {
    return cached;
  }

  try {
    const response =
      await fetch(request);

    if (response.ok) {
      cache.put(
        request,
        response.clone()
      );
    }

    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request =
    event.request;

  if (
    request.method !== "GET"
  ) {
    return;
  }

  if (
    request.mode ===
    "navigate"
  ) {
    event.respondWith(
      networkFirst(
        request,
        "/offline"
      )
    );
    return;
  }

  if (
    request.destination ===
      "style" ||
    request.destination ===
      "script"
  ) {
    event.respondWith(
      networkFirst(request)
    );
    return;
  }

  if (
    request.destination ===
      "image" ||
    request.destination ===
      "font"
  ) {
    event.respondWith(
      cacheFirst(request)
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Mpangi-church",
    body:
      "Nouvelle notification",
    url: "/notifications",
  };

  try {
    data = event.data
      ? event.data.json()
      : data;
  } catch {
    data.body = event.data
      ? event.data.text()
      : data.body;
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title ||
        "Mpangi-church",
      {
        body:
          data.body ||
          "Nouvelle notification",
        icon: "/api/pwa/icon",
        badge: "/api/pwa/icon",
        data: {
          url:
            data.url ||
            "/notifications",
        },
      }
    )
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const url =
      event.notification.data
        ?.url ||
      "/notifications";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled:
            true,
        })
        .then((clients) => {
          for (const client of clients) {
            if (
              "focus" in client
            ) {
              client.navigate(
                url
              );

              return client.focus();
            }
          }

          return self.clients.openWindow(
            url
          );
        })
    );
  }
);
