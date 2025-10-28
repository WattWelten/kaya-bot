// KAYA Service Worker - Offline-Support & Caching

const CACHE_NAME = 'kaya-v2.1.0';
const STATIC_CACHE = 'kaya-static-v2.1.0';
const DYNAMIC_CACHE = 'kaya-dynamic-v2.1.0';

// Assets die sofort gecacht werden sollen
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - Cache Static Assets
self.addEventListener('install', (event) => {
  console.log('🔧 KAYA Service Worker: Install');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('⚠️ Einige Assets konnten nicht gecacht werden:', err);
      });
    })
  );
  
  self.skipWaiting(); // Aktivieren ohne Neuladen
});

// Activate Event - Cleanup alte Caches
self.addEventListener('activate', (event) => {
  console.log('🚀 KAYA Service Worker: Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Lösche alte Caches (nicht mehr aktuell)
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Lösche alten Cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim(); // Übernahme sofort
});

// Fetch Event - Cache-Strategie
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API-Requests: Network-First (immer aktuelle Daten)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/chat')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Fallback: Zeige Offline-Message
        return new Response(
          JSON.stringify({ error: 'Offline - Bitte Netzwerkverbindung prüfen' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }
  
  // Static Assets: Cache-First (schnell laden)
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Wenn gecacht: verwende Cache
        if (cachedResponse) {
          return cachedResponse;
        }
        // Sonst: hole vom Netzwerk
        return fetch(request).then((response) => {
          // Cache die Response für nächsten Mal
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }
  
  // Dynamic Content: Stale-While-Revalidate (schnell + aktuell)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Cache network response für nächstes Mal
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            // Filter chrome-extension URLs (nicht cachen)
            if (request.url.startsWith('chrome-extension://') || 
                request.url.startsWith('moz-extension://')) {
              return;
            }
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });
      
      // Verwende Cache sofort, aktualisiere im Hintergrund
      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync (optional für Offline-Requests)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  // Implementierung für Offline-Queue falls nötig
});

// Push Notifications (optional)
self.addEventListener('push', (event) => {
  console.log('📬 Push Notification:', event);
  // Implementierung für Benachrichtigungen falls nötig
});

console.log('✅ KAYA Service Worker geladen');


