/**
 * PageCast Offline Service Worker (TASK-S4-OFF-02 / FR-075 / SEC-005)
 *
 * Implements strict, security-conscious app-shell caching:
 * - Cache-first for static immutable assets (scripts, styles, icons, fonts)
 * - Network-first for top-level HTML navigation
 * - STRICT BYPASS for authentication, publisher drafts, private sources, and server secrets
 */

const CACHE_VERSION = "pagecast-shell-v1";

// Safe public app-shell assets to precache during install
const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/icon.svg",
];

// Sensitive route patterns that MUST NEVER be cached under any circumstances (SEC-005)
const SENSITIVE_ROUTE_PATTERNS = [
  /\/api\/v1\/drafts(\/.*)?$/,
  /\/api\/v1\/sources(\/.*)?$/,
  /\/api\/v1\/bulletins\/compose$/,
  /\/publisher(\/.*)?$/,
  /supabase\.co/,
  /generativelanguage\.googleapis\.com/,
];

/**
 * Checks whether a request targets a sensitive, publisher, or authenticated endpoint.
 */
function isSensitiveRequest(request) {
  const url = request.url || "";

  // Check URL against sensitive patterns
  for (const pattern of SENSITIVE_ROUTE_PATTERNS) {
    if (pattern.test(url)) {
      return true;
    }
  }

  // Check for presence of authorization headers
  if (request.headers && request.headers.has("authorization")) {
    return true;
  }

  return false;
}

// 1. Service Worker Installation: Precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[PageCast SW] Precache warning:", err);
      })
  );
});

// 2. Service Worker Activation: Purge stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_VERSION) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event Handling: Selective Cache Policy
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== "GET" || !request.url.startsWith("http")) {
    return;
  }

  // Mandatory Security Exclusion: Bypass sensitive, auth, and publisher content
  if (isSensitiveRequest(request)) {
    return; // Pass through directly to network with zero caching
  }

  const url = new URL(request.url);

  // Strategy A: Next.js Static Chunks & Public Assets -> Cache-First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy B: HTML Page Navigations -> Network-First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If network is offline, attempt to serve cached page or fallback shell
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match("/");
        })
    );
  }
});
