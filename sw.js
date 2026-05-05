importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCVO0h2ofIwC6LYxRZz4Xpkgtu8dQp7UbQ",
  authDomain: "vibratsiya-d66b0.firebaseapp.com",
  projectId: "vibratsiya-d66b0",
  storageBucket: "vibratsiya-d66b0.firebasestorage.app",
  messagingSenderId: "192936323967",
  appId: "1:192936323967:web:c67cc0c8ec1c1512fb484a"
});

const messaging = firebase.messaging();

// Show notification when app is in background
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title || '⚡ Вибрация', {
    body: payload.notification.body || 'Как твоё состояние сейчас?',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'vibratsiya-reminder',
    renotify: true
  });
});

// Handle scheduled notifications via postMessage
let scheduleTimers = [];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE') {
    // Clear existing timers
    scheduleTimers.forEach(t => clearTimeout(t));
    scheduleTimers = [];

    const times = event.data.times || ['08:00', '13:00', '20:00'];
    const messages = [
      'Доброе утро! Как твоё состояние?',
      'Середина дня — как ты?',
      'Вечер. Отметь своё состояние.'
    ];

    times.forEach((t, i) => {
      const [h, m] = t.split(':').map(Number);
      const now = new Date();
      const next = new Date();
      next.setHours(h, m, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      const delay = next - now;

      const timer = setTimeout(() => {
        self.registration.showNotification('⚡ Вибрация', {
          body: messages[i % messages.length],
          icon: '/icon-192.png',
          tag: 'vib-' + i,
          renotify: true
        });
        // Repeat every 24h
        setInterval(() => {
          self.registration.showNotification('⚡ Вибрация', {
            body: messages[i % messages.length],
            icon: '/icon-192.png',
            tag: 'vib-' + i,
            renotify: true
          });
        }, 24 * 60 * 60 * 1000);
      }, delay);
      scheduleTimers.push(timer);
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => e.respondWith(
  caches.open('vib-v2').then(c =>
    c.match(e.request).then(r => r || fetch(e.request).then(res => {
      c.put(e.request, res.clone()); return res;
    }))
  )
));
