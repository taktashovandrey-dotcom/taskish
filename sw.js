// Simple service worker placeholder for future push support
self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  self.clients.claim()
})

self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'Напоминание', body: '' }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body }))
})
