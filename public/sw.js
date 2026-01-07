/* public/sw.js */

// Versão pra cache (se depois quiser cache offline)
const CACHE_NAME = 'database-v1'
const APP_SHELL = ['/mobile']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => null),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// (opcional) responder fetch com cache básico
self.addEventListener('fetch', (event) => {
  // aqui você pode customizar cache se quiser, por enquanto só passa reto
})

// ======= PUSH NOTIFICATIONS =======

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'Nova notificação', body: event.data?.text() || '' }
  }

  const title = data.title || 'Database'
  const body =
    data.body || 'Você tem uma atualização nas suas vendas / comissões.'
  const icon = data.icon || '/icons/icon-192.png'
  const badge = data.badge || '/icons/icon-192.png'
  const urlToOpen = data.url || '/mobile'

  const options = {
    body,
    icon,
    badge,
    data: {
      url: urlToOpen,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/mobile'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      }),
  )
})
