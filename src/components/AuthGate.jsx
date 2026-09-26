import { useState, useRef } from 'react'
import { supabase } from '../store/storage'

// Login real con Supabase Auth (Julio/María, cuentas creadas a mano en el
// dashboard) cuando Supabase esta configurado. Si no lo esta (dev local sin
// proyecto Supabase), cae al gate de contraseña compartida de siempre --
// mismo patron que storage.js usa para elegir entre Supabase y localStorage.
export default function AuthGate({ onAuth }) {
  if (!supabase) return <PasswordGate onAuth={onAuth} />
  return <SupabaseLoginGate onAuth={onAuth} />
}

function SupabaseLoginGate({ onAuth }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [shake,    setShake]    = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      // Mensaje generico -- no confirmar si el email existe o no.
      setError('Email o contraseña incorrectos')
      setShake(true)
      setPassword('')
      setTimeout(() => setShake(false), 500)
      return
    }
    onAuth()
  }

  return (
    <div className="auth-gate">
      <div className="mp-bg" aria-hidden="true" />
      <div className={`auth-card${shake ? ' shake' : ''}`}>
        <span className="auth-orb" aria-hidden="true" />
        <h1 className="auth-title">meal planner</h1>
        <p className="auth-sub">Julio y María · inicia sesión para ver vuestra semana</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(null) }}
            autoFocus
            autoComplete="username"
          />
          <input
            type="password"
            className={`auth-input${error ? ' auth-input-error' : ''}`}
            placeholder="Contraseña"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null) }}
            autoComplete="current-password"
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={!email || !password || loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PasswordGate({ onAuth }) {
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
      <div className="mp-bg" aria-hidden="true" />
      <div className={`auth-card${shake ? ' shake' : ''}`}>
        <span className="auth-orb" aria-hidden="true" />
        <h1 className="auth-title">meal planner</h1>
        <p className="auth-sub">Julio y María · escribe la contraseña para entrar</p>

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
          {error && <p className="auth-error">Contraseña incorrecta</p>}
          <button type="submit" className="auth-btn" disabled={!value}>
            {value ? 'Entrar' : 'Escribe la contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
