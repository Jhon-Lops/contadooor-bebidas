// Versão do cache - mude quando atualizar o app
const CACHE_NAME = 'drinkcounter-v1.2.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Arquivos para cache estático (app shell)
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// Instalação - cache dos arquivos estáticos
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Cacheando arquivos estáticos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Instalação completa');
        return self.skipWaiting(); // Ativa imediatamente
      })
      .catch(error => {
        console.error('Service Worker: Erro na instalação', error);
      })
  );
});

// Ativação - limpa caches antigos
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Remove caches antigos que não correspondem aos atuais
          if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
            console.log('Service Worker: Removendo cache antigo', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Ativação completa');
      return self.clients.claim(); // Toma controle de todas as tabs
    })
  );
});

// Intercepta requisições
self.addEventListener('fetch', event => {
  // Ignora requisições não GET
  if (event.request.method !== 'GET') return;
  
  // Ignora requisições do Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Retorna do cache se disponível
        if (cachedResponse) {
          return cachedResponse;
        }

        // Faz requisição para a rede
        return fetch(event.request)
          .then(networkResponse => {
            // Cache de respostas bem-sucedidas (exceto para APIs externas)
            if (!event.request.url.includes('http') || 
                event.request.url.includes('localhost') ||
                event.request.url.includes('127.0.0.1')) {
              
              return caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  // Clona a resposta antes de colocar no cache
                  cache.put(event.request, networkResponse.clone());
                  return networkResponse;
                });
            }
            
            return networkResponse;
          })
          .catch(error => {
            // Fallback para páginas - retorna página offline
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // Fallback para outros recursos
            console.log('Service Worker: Fetch falhou', error);
            throw error;
          });
      })
  );
});

// Mensagens do app principal
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});