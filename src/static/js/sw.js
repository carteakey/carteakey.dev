// Service Worker for carteakey.dev
// Provides offline support and caching for better performance

const CACHE_VERSION = 'v1';
const CACHE_NAME = `carteakey-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/about/',
  '/posts/',
  '/css/tailwind.css',
  '/static/js/alpine.min.js',
  '/static/js/typeit.min.js',
  '/static/css/prism/prism-coy.css',
  '/static/css/prism/prism-twilight.css',
  '/img/avatar.png'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, fallback to network (for static assets)
  cacheFirst: async (request) => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  },
  
  // Network first, fallback to cache (for pages)
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      
      // Return offline page if available
      if (request.mode === 'navigate') {
        return caches.match('/');
      }
      throw error;
    }
  },
  
  // Stale while revalidate (for fonts, images)
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => cached);
    
    return cached || fetchPromise;
  }
};

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests
  if (url.origin !== location.origin) return;
  
  // Apply strategies based on request type
  let strategy;
  
  // Static assets (JS, CSS) - cache first
  if (/\.(js|css)$/.test(url.pathname)) {
    strategy = CACHE_STRATEGIES.cacheFirst;
  }
  // Fonts and images - stale while revalidate
  else if (/\.(woff2?|ttf|otf|eot|png|jpg|jpeg|gif|webp|avif|svg|ico)$/.test(url.pathname)) {
    strategy = CACHE_STRATEGIES.staleWhileRevalidate;
  }
  // HTML pages - network first
  else if (request.mode === 'navigate' || url.pathname.endsWith('/') || /\.html$/.test(url.pathname)) {
    strategy = CACHE_STRATEGIES.networkFirst;
  }
  // Default - network first
  else {
    strategy = CACHE_STRATEGIES.networkFirst;
  }
  
  event.respondWith(strategy(request));
});
