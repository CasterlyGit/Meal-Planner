// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import SignedInApp from './SignedInApp'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
registerSW({ immediate: true })

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SignedInApp />
  </React.StrictMode>
)
