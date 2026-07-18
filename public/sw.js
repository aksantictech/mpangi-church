 const CACHE_PREFIX =
  "mpangi-church-pwa-";

const CACHE_NAME =
  `${CACHE_PREFIX}v6`;

const APP_SHELL = [
  "/offline",
  "/install",
];

function isSameOrigin(
  request
) {
  try {
    return (
      new URL(request.url).origin ===
      self.location.origin
    );
  } catch {
    return false;
  }
}

function isCacheableResponse(
  response
) {
  if (
    !response ||
    !response.ok ||
    response.type === "opaque"
  ) {
    return false;
  }

  const cacheControl =
    response.headers.get(
      "cache-control"
    ) || "";

  return !cacheControl
    .toLowerCase()
    .includes("no-store");
}

async function installAppShell() {
  const cache =
    await caches.open(
      CACHE_NAME
    );

  /*
   * Une route indisponible ne doit pas empêcher
   * complètement l’installation du service worker.
   */
  await Promise.allSettled(
    APP_SHELL.map(
      async (pathname) => {
        const request =
          new Request(pathname, {
            cache: "reload",
          });

        const response =
          await fetch(request);

        if (
          isCacheableResponse(
            response
          )
        ) {
          await cache.put(
            pathname,
            response
          );
        }
      }
    )
  );
}

async function removeOldCaches() {
  const keys =
    await caches.keys();

  await Promise.all(
    keys
      .filter(
        (key) =>
          key.startsWith(
            CACHE_PREFIX
          ) &&
          key !== CACHE_NAME
      )
      .map((key) =>
        caches.delete(key)
      )
  );
}

async function handleNavigation(
  event
) {
  try {
    /*
     * Navigation Preload évite d’attendre inutilement
     * le démarrage complet du service worker.
     */
    const preloadResponse =
      await event.preloadResponse;

    if (preloadResponse) {
      return preloadResponse;
    }

    /*
     * Les pages privées et personnalisées ne sont
     * jamais enregistrées dans le cache.
     */
    return await fetch(
      event.request
    );
  } catch {
    const cache =
      await caches.open(
        CACHE_NAME
      );

    const offlinePage =
      await cache.match(
        "/offline"
      );

    return (
      offlinePage ||
      new Response(
        "Application hors connexion.",
        {
          status: 503,
          headers: {
            "Content-Type":
              "text/plain; charset=utf-8",
          },
        }
      )
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

  const cachedResponse =
    await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response =
      await fetch(request);

    if (
      isCacheableResponse(
        response
      )
    ) {
      await cache.put(
        request,
        response.clone()
      );
    }

    return response;
  } catch {
    return Response.error();
  }
}

function readText(
  value,
  fallback,
  maximumLength
) {
  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  const text =
    value.trim();

  return (
    text || fallback
  ).slice(0, maximumLength);
}

function normalizeInternalUrl(
  value,
  fallback = "/notifications"
) {
  try {
    const candidate =
      typeof value === "string"
        ? value
        : fallback;

    const url =
      new URL(
        candidate,
        self.location.origin
      );

    if (
      url.origin !==
      self.location.origin
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

function normalizeAssetUrl(
  value,
  fallback
) {
  return normalizeInternalUrl(
    value,
    fallback
  );
}

function readPushPayload(
  event
) {
  const defaultPayload = {
    title: "Mpangi-church",
    body:
      "Nouvelle notification",
    url: "/notifications",
    type: "notification",
    icon: "/api/pwa/icon",
    badge: "/api/pwa/icon",
    tag: "",
  };

  if (!event.data) {
    return defaultPayload;
  }

  let payload;

  try {
    payload =
      event.data.json();
  } catch {
    try {
      payload = {
        body:
          event.data.text(),
      };
    } catch {
      payload = {};
    }
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    payload = {};
  }

  return {
    title: readText(
      payload.title,
      defaultPayload.title,
      120
    ),
    body: readText(
      payload.body,
      defaultPayload.body,
      500
    ),
    url: normalizeInternalUrl(
      payload.url,
      defaultPayload.url
    ),
    type: readText(
      payload.type,
      defaultPayload.type,
      64
    ),
    icon: normalizeAssetUrl(
      payload.icon,
      defaultPayload.icon
    ),
    badge: normalizeAssetUrl(
      payload.badge,
      defaultPayload.badge
    ),
    tag: readText(
      payload.tag,
      "",
      120
    ),
  };
}

async function openNotificationUrl(
  value
) {
  const relativeUrl =
    normalizeInternalUrl(
      value,
      "/notifications"
    );

  const targetUrl =
    new URL(
      relativeUrl,
      self.location.origin
    );

  const windowClients =
    await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

  /*
   * Une fenêtre déjà ouverte sur la bonne page
   * est simplement ramenée au premier plan.
   */
  for (
    const client of windowClients
  ) {
    try {
      const clientUrl =
        new URL(client.url);

      if (
        clientUrl.href ===
        targetUrl.href
      ) {
        return client.focus();
      }
    } catch {
      // On continue avec les autres fenêtres.
    }
  }

  /*
   * Si l’application est déjà ouverte sur une autre
   * page, elle est dirigée vers la destination.
   */
  for (
    const client of windowClients
  ) {
    if (
      "navigate" in client
    ) {
      try {
        const navigatedClient =
          await client.navigate(
            targetUrl.href
          );

        if (
          navigatedClient &&
          "focus" in
            navigatedClient
        ) {
          return navigatedClient.focus();
        }

        if (
          "focus" in client
        ) {
          return client.focus();
        }
      } catch {
        // openWindow sera utilisé comme solution de secours.
      }
    }
  }

  return self.clients.openWindow(
    targetUrl.href
  );
}

self.addEventListener(
  "install",
  (event) => {
    event.waitUntil(
      (async () => {
        await installAppShell();
        await self.skipWaiting();
      })()
    );
  }
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      (async () => {
        await removeOldCaches();

        if (
          "navigationPreload" in
          self.registration
        ) {
          await self.registration
            .navigationPreload
            .enable();
        }

        await self.clients.claim();
      })()
    );
  }
);

self.addEventListener(
  "fetch",
  (event) => {
    const request =
      event.request;

    if (
      request.method !== "GET" ||
      !isSameOrigin(request)
    ) {
      return;
    }

    if (
      request.mode ===
      "navigate"
    ) {
      event.respondWith(
        handleNavigation(event)
      );

      return;
    }

    const url =
      new URL(request.url);

    const isStaticNextAsset =
      url.pathname.startsWith(
        "/_next/static/"
      );

    const isCacheableAsset =
      isStaticNextAsset ||
      request.destination ===
        "style" ||
      request.destination ===
        "script" ||
      request.destination ===
        "image" ||
      request.destination ===
        "font";

    if (isCacheableAsset) {
      event.respondWith(
        cacheFirst(request)
      );
    }
  }
);

self.addEventListener(
  "push",
  (event) => {
    const payload =
      readPushPayload(event);

    const options = {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      data: {
        url: payload.url,
        type: payload.type,
      },
      timestamp: Date.now(),
    };

    if (payload.tag) {
      options.tag = payload.tag;
    }

    event.waitUntil(
      self.registration
        .showNotification(
          payload.title,
          options
        )
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const notificationData =
      event.notification.data;

    const url =
      notificationData &&
      typeof notificationData ===
        "object"
        ? notificationData.url
        : "/notifications";

    event.waitUntil(
      openNotificationUrl(url)
    );
  }
);