// Nurovia AI service worker
// Strategy: network-first for the app shell, cache fallback for offline launches.
// IMPORTANT: bump CACHE_NAME on every deploy so old hashes don't get served forever.

const CACHE_NAME = "nurovia-ai-v9";

// On install, immediately take over and force every open tab to reload
// so they pick up the new code.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
      self.clients.claim().then(() =>
        // tell every open client to reload itself — bypasses all stale caches
        self.clients.matchAll({ type: "window" }).then((clients) =>
          Promise.all(clients.map((c) => c.navigate(c.url).catch(() => undefined)))
        )
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never intercept LLM API calls
  if (
    url.hostname.includes("openai.com") ||
    url.hostname.includes("anthropic.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("deepseek.com") ||
    url.hostname.includes("openrouter.ai") ||
    url.hostname.includes("aliyuncs.com")
  ) {
    return;
  }

  // For everything same-origin — network only, no cache interception.
  // App is small (~300 KB initial) so the network round-trip cost is fine.
  // This guarantees users always see the freshest build after a deploy.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request).catch(() =>
        // Offline fallback for navigations only
        request.mode === "navigate" ? caches.match("/") : new Response("", { status: 503 })
      )
    );
    return;
  }
});