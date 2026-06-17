import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import useStore from './store/useStore.js'

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
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
.catch(err => {
  console.error('[hydration] Failed to hydrate store:', err.message)
  // Still render - allows local-only mode (data saves in browser, will sync when online)
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
