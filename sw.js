const CACHE_NAME = 'apostas-ze-v2';

// Ficheiros essenciais a guardar em cache para funcionamento offline
const ASSETS_TO_CACHE = [
    './index.html',
    './app.js',
    './manifest.json'
];

// Instalação do Service Worker e criação da cache inicial
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] A guardar ficheiros em cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Ativação e limpeza de caches antigas (evita que fiques preso à versão anterior)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] A remover cache antiga:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceção de pedidos de rede (estratégia: Cache First, com fallback para a rede)
self.addEventListener('fetch', (event) => {
    // Ignora pedidos externos (como o Google Sheets API, CDNs do Tailwind, FontAwesome, etc.) para garantir que os dados estão sempre atualizados
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
