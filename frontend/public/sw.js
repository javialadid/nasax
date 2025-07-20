/** The pictures for epic lack headers for the browser to cache the images, 
 * making the user experience painful with slow reloads. This worker acts as a cache 
 * for EPIC pictures
 */
const CACHE_NAME = 'epic-images-v1';
const IMAGE_URL_PATTERN = /\/EPIC\/archive\/natural\/.*\.png$/;
const MAX_CACHE_ITEMS = 100; // Maximum number of images to cache

self.addEventListener('install', event => {
  console.log('[SW] Install event');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method === 'GET' && IMAGE_URL_PATTERN.test(request.url)) {    
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const response = await cache.match(request);
        if (response) {
          return response;
        }
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
          // Purge oldest images if cache size exceeds limit
          const keys = await cache.keys();
          if (keys.length > MAX_CACHE_ITEMS) {
            // Delete oldest entries (FIFO)
            for (let i = 0; i < keys.length - MAX_CACHE_ITEMS; i++) {
              await cache.delete(keys[i]);
            }
          }
        }
        return networkResponse;
      })
    );
  }
}); 