import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register Service Worker (only in production)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.DEV) {
      // In dev: unregister all service workers and clear caches
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => caches.delete(cacheName));
      });
    } else {
      // In production: register service worker
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)