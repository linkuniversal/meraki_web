/* ==========================================================================
   MERAKI · SERVICE WORKER DE CACHÉ EXTREMA (0 MS EN NAVEGADOR)
   ========================================================================== */
const CACHE_NAME = 'meraki-fast-v1';
const GH_RAW_PREFIX = 'https://raw.githubusercontent.com/linkuniversal/meraki_web/main';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

function isImageRequest(url) {
    return url.pathname.startsWith('/media/') || /\.(webp|jpe?g|png|avif|gif|ico|svg)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (!url.protocol.startsWith('http')) return;

    // Nunca interceptar panel admin, subidas, login ni descargas parciales de video (206)
    if (
        url.pathname.endsWith('/admin.html') ||
        url.pathname.startsWith('/api/media') ||
        url.pathname.startsWith('/api/sync') ||
        url.searchParams.get('check') === '1' ||
        request.headers.has('x-admin-pass') ||
        request.headers.has('range') ||
        /\.(mp4|webm|mov)$/i.test(url.pathname)
    ) {
        return;
    }

    // 1. IMÁGENES: Cache-First (0 ms) + fallback automático a GitHub Raw si Pages aún no la desplegó
    if (isImageRequest(url)) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(request);
            if (cached) return cached;

            try {
                const netRes = await fetch(request);
                const cType = (netRes.headers.get('content-type') || '').toLowerCase();
                if (netRes.status === 200 && cType.startsWith('image/')) {
                    cache.put(request, netRes.clone());
                    return netRes;
                }
            } catch (_) {}

            // Si Pages devolvió 404 o text/html (SPA fallback), pedir directo a GitHub Raw
            if (url.origin === self.location.origin && url.pathname.startsWith('/media/')) {
                try {
                    const ghRes = await fetch(GH_RAW_PREFIX + url.pathname);
                    const ghType = (ghRes.headers.get('content-type') || '').toLowerCase();
                    if (ghRes.status === 200 && (ghType.startsWith('image/') || ghType === 'application/octet-stream')) {
                        cache.put(request, ghRes.clone());
                        return ghRes;
                    }
                } catch (_) {}
            }

            return fetch(request);
        })());
        return;
    }

    // 2. CATÁLOGO D1 Y RECURSOS ESTÁTICOS (CSS/JS/FUENTES): Stale-While-Revalidate
    if (
        url.pathname === '/api/catalog' ||
        /\.(css|js|woff2?)$/i.test(url.pathname) ||
        url.hostname === 'fonts.googleapis.com' ||
        url.hostname === 'fonts.gstatic.com'
    ) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(request);

            const networkPromise = fetch(request).then((netRes) => {
                if (netRes && netRes.status === 200) {
                    cache.put(request, netRes.clone());
                }
                return netRes;
            }).catch(() => null);

            if (cached) {
                event.waitUntil(networkPromise);
                return cached;
            }
            return (await networkPromise) || fetch(request);
        })());
        return;
    }

    // 3. NAVEGACIÓN HTML: Network-First para tomar deploys nuevos al instante + fallback offline
    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
                const netRes = await fetch(request);
                if (netRes && netRes.status === 200) {
                    cache.put(request, netRes.clone());
                }
                return netRes;
            } catch (_) {
                return (await cache.match(request)) || Response.error();
            }
        })());
    }
});