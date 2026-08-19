const CACHE = "1001-dates-v151";
const CORE = [
  "./", "./index.html", "./styles-v151.css?v=151", "./styles.css?v=14", "./app-v151.js?v=151", "./app.js?v=14",
  "./engine-v14.js?v=14", "./engine.js?base=v13", "./data/seed.js", "./data/scenarios.js", "./data/kudago.generated.js",
  "./manifest.webmanifest", "./assets/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isDocument = event.request.mode === "navigate" || url.pathname.endsWith("index.html") || url.pathname.endsWith("/");
  if (isDocument) {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html"))));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => {
    const network = fetch(event.request).then((response) => {
      const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response;
    }).catch(() => cached);
    return cached || network;
  }));
});
