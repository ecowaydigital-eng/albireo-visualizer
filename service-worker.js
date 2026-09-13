const CACHE = "albireo-mvp-v1";
const ASSETS = ["./", "styles.css", "app.js", "favicon.svg", "manifest.webmanifest", "assets/albireo-1.png", "assets/albireo-2.png", "assets/albireo-4.png", "assets/albireo-9.png", "assets/albireo-10.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
