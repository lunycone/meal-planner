import { useState, useEffect } from 'react'
import useStore            from './store/useStore'
import { supabase }        from './store/storage'
import HomeView            from './views/HomeView'
import MealPlannerView     from './views/MealPlannerView'
import PlatosTab           from './components/tabs/PlatosTab'
import IngredientesTab     from './components/tabs/IngredientesTab'
import WeeklyMealPlannerTab from './components/tabs/WeeklyMealPlannerTab'
import ShoppingListTab     from './components/tabs/ShoppingListTab'
import BatchPrepTab        from './components/tabs/BatchPrepTab'
import AuthGate            from './components/AuthGate'
import ProfileSelector     from './components/ProfileSelector'
import SyncStatus          from './components/SyncStatus'
import { MEALS }           from './config/meals'

const CONFIG_TABS = [
  { id: 'platos',        label: 'Platos',         Component: PlatosTab },
  { id: 'ingredientes',  label: 'Ingredientes',   Component: IngredientesTab },
  { id: 'planificador',  label: 'Planificador',   Component: WeeklyMealPlannerTab },
  { id: 'compra',        label: 'Compra',         Component: ShoppingListTab },
  { id: 'batch',         label: 'Batch',          Component: BatchPrepTab },
]

function AppShell() {
  const activeView      = useStore(s => s.activeView)
  const activeMeal      = useStore(s => s.activeMeal)
  const setView         = useStore(s => s.setView)
  const activeConfigTab = CONFIG_TABS.find(t => t.id === activeView)

  const atHome = activeView === 'home'

  return (
    <div className="app-shell">
      {/* Navigation banner — always visible, Notion-style */}
      <nav className="tab-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          <button
            className={`tab-btn${atHome ? ' active' : ''}`}
            onClick={() => setView('home')}
          >
            Inicio
          </button>
          {CONFIG_TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn${activeView === t.id ? ' active' : ''}`}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="tab-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SyncStatus />
          <ProfileSelector />
          {supabase && (
            <button
              className="btn-ghost"
              style={{ fontSize: '0.72rem' }}
              onClick={() => supabase.auth.signOut()}
              title="Cerrar sesión"
            >
              Salir
            </button>
          )}
        </div>
      </nav>

      {/* Back button — only on non-home views */}
      {!atHome && (
        <div className="app-header">
          <button className="app-back-btn" onClick={() => setView('home')}>
            ←&nbsp;Inicio
          </button>
        </div>
      )}

      {/* Content */}
      {atHome                && <HomeView />}
      {activeView === 'meal' && <MealPlannerView />}
      {activeConfigTab       && <activeConfigTab.Component />}
    </div>
  )
}

export default function App() {
  // Con Supabase configurado, el gate real es la sesión de Supabase Auth
  // (persiste en localStorage entre recargas; onAuthStateChange detecta
  // login/logout en caliente, incluido el "Salir" del nav). Sin Supabase
  // (dev local), cae al gate de contraseña compartida de antes, que sigue
  // viviendo en sessionStorage.
  const [authed, setAuthed] = useState(() => {
    if (supabase) return null // null = "aún no lo sabemos", ver useEffect
    const pw = import.meta.env.VITE_APP_PASSWORD
    return !pw || sessionStorage.getItem('mp-auth') === '1'
  })

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (authed === null) return null // esperando a saber si hay sesión

  if (!authed) {
    return (
      <AuthGate onAuth={() => {
        if (!supabase) sessionStorage.setItem('mp-auth', '1')
        setAuthed(true)
      }} />
    )
  }

  return <AppShell />
}
