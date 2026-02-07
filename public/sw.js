// Minimal service worker to prevent 404 errors
// This is a placeholder - can be expanded for PWA features

const CACHE_NAME = 'fitsense-v1';

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Let all requests pass through to network
  // This prevents the service worker from interfering with API calls
});
