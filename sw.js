const CACHE_NAME = 'apostas-ze-v4';

// Ficheiros essenciais a guardar em cache para funcionamento offline
const ASSETS_TO_CACHE = [
    './index.html',
    './app.js',
    './manifest.json'
];

// URL do Google Apps Script para garantir que nunca é apanhado pela cache estática
const SCRIPT_URL_PREFIX = "https://script.google.com/";

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

// Ativação e limpeza de caches antigas (limpa versões anteriores)
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

// Interceção de pedidos de rede
self.addEventListener('fetch', (event) => {
    const requestUrl = event.request.url;

    // 1. Ignora totalmente pedidos ao Google Apps Script ou APIs externas
    if (requestUrl.startsWith(SCRIPT_URL_PREFIX) || !requestUrl.startsWith(self.location.origin)) {
        return;
    }

    // 2. Estratégia Network First para o index.html e app.js (tenta a rede primeiro, se falhar usa a cache)
    // Garante que vês sempre as alterações mais recentes sem precisar de limpar a cache manualmente
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
