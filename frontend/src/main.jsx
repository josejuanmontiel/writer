import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App/>
        </ErrorBoundary>
    </React.StrictMode>
)

// Registrar Service Worker para soporte PWA y modo Offline
if ('serviceWorker' in navigator && !window.go) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[PWA] Service Worker registrado exitosamente con scope:', reg.scope))
      .catch((err) => console.log('[PWA] Error registrando Service Worker:', err));
  });
}

