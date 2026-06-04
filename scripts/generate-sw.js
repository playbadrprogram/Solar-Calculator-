const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const CACHE_VERSION = 'solar-calc-v5';

// Generate sw.js
const swContent = `const CACHE_NAME = '${CACHE_VERSION}';
const BASE = '${BASE_PATH}';
const STATIC_ASSETS = [
  BASE + '/',
  BASE + '/manifest.json',
  BASE + '/favicon.svg',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match(BASE + '/');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
`;

// Generate manifest.json
const manifestContent = JSON.stringify({
  id: `${BASE_PATH}/`,
  name: "حاسبة المنظومة الشمسية",
  short_name: "Solar Calc",
  description: "أداة احترافية لحساب مكونات المنظومة الشمسية من الألواح والبطاريات والعاكس ومنظم الشحن",
  start_url: `${BASE_PATH}/`,
  scope: `${BASE_PATH ? BASE_PATH + '/' : '/'}`,
  display: "standalone",
  background_color: "#FFFBEB",
  theme_color: "#F59E0B",
  orientation: "any",
  dir: "rtl",
  lang: "ar",
  categories: ["utilities", "productivity"],
  icons: [
    {
      src: `${BASE_PATH}/icon-192.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: `${BASE_PATH}/icon-512.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: `${BASE_PATH}/icon-192.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: `${BASE_PATH}/icon-512.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: `${BASE_PATH}/favicon.svg`,
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any"
    }
  ],
  screenshots: [],
  prefer_related_applications: false
}, null, 2);

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'sw.js'), swContent);
fs.writeFileSync(path.join(publicDir, 'manifest.json'), manifestContent);
console.log(`Generated sw.js and manifest.json with BASE_PATH="${BASE_PATH}"`);
