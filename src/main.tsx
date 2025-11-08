// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import SignedInApp from './SignedInApp'   // <- the wrapper we made
import './index.css'
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SignedInApp />
  </React.StrictMode>
)
