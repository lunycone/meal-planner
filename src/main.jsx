import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import './styles/theme.css'
import './styles/views.css'
import './styles/mobile.css'
import useStore from './store/useStore.js'
import { supabase } from './store/storage.js'

// Con Supabase, cada dispositivo vuelve a leer el estado compartido al volver
// a la app y cada 30 s mientras está a la vista: así lo que marca uno (plan,
// compra, tuppers) le aparece al otro sin recargar. El adaptador descarta la
// lectura si hay cambios locales aún guardándose (ver storage.js).
function startSharedRefresh() {
  if (!supabase) return
  const refresh = () => {
    if (document.visibilityState === 'visible') useStore.persist.rehydrate()
  }
  document.addEventListener('visibilitychange', refresh)
  window.addEventListener('focus', refresh)
  setInterval(refresh, 30000)
}

// Hydrate from async storage (Supabase) before first render
// With timeout protection - if Supabase takes >5sec, render anyway (local-only mode)
const HYDRATION_TIMEOUT = 5000

Promise.race([
  useStore.persist.rehydrate(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Hydration timeout')), HYDRATION_TIMEOUT)
  )
])
.then(() => {
  startSharedRefresh()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
.catch(err => {
  console.error('[hydration] Failed to hydrate store:', err.message)
  // Still render - allows local-only mode (data saves in browser, will sync when online)
  startSharedRefresh()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
