/// <reference types="vite-plugin-pwa/client" />
// @ts-check

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

// Precache dos assets gerados pelo build (mesmo comportamento do generateSW anterior)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
self.skipWaiting()
clientsClaim()

/**
 * Notificacoes push (Web Push / VAPID).
 * Payload enviado pelo backend: { title, body, url, tag? }
 */
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Check Fácil', body: event.data.text() }
  }

  const opcoes = {
    body: payload.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.tag || 'checkfacil',
    data: { url: payload.url || '/' },
    // Android: agrupa por tag e vibra
    renotify: true,
    vibrate: [100, 50, 100],
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Check Fácil', opcoes))
})

/** Clique na notificacao: foca a janela (ou abre) na URL do payload. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlDestino = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if ('focus' in janela) {
          janela.focus()
          if (janela.navigate) {
            janela.navigate(urlDestino)
          }
          return
        }
      }
      return self.clients.openWindow(urlDestino)
    })
  )
})
