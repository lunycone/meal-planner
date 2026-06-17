import { useState, useRef } from 'react'

export default function AuthGate({ onAuth }) {
  const [value, setValue] = useState('')
  const [shake, setShake]   = useState(false)
  const [error, setError]   = useState(false)
  const inputRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    const pw = import.meta.env.VITE_APP_PASSWORD
    if (value === pw) {
      onAuth()
    } else {
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="auth-gate">
      <div className={`auth-card${shake ? ' shake' : ''}`}>
        <div className="auth-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="auth-title">Meal Planner</h1>
        <p className="auth-sub">Acceso privado · introduce la contraseña para continuar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            ref={inputRef}
            type="password"
            className={`auth-input${error ? ' auth-input-error' : ''}`}
            placeholder="Contraseña"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="auth-error">✕ Contraseña incorrecta</p>}
          <button type="submit" className="auth-btn" disabled={!value}>
            {value ? 'Entrar' : 'Escribe la contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
