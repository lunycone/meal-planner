import { useState } from 'react'
import useStore            from './store/useStore'
import HomeView            from './views/HomeView'
import MealPlannerView     from './views/MealPlannerView'
import PlatosTab           from './components/tabs/PlatosTab'
import DesayunosTab        from './components/tabs/DesayunosTab'
import IngredientesTab     from './components/tabs/IngredientesTab'
import CombinacionesTab    from './components/tabs/CombinacionesTab'
import WeeklyMealPlannerTab from './components/tabs/WeeklyMealPlannerTab'
import ShoppingListTab     from './components/tabs/ShoppingListTab'
import MenuTab             from './components/tabs/MenuTab'
import AuthGate            from './components/AuthGate'
import ProfileSelector     from './components/ProfileSelector'
import SyncStatus          from './components/SyncStatus'
import { MEALS }           from './config/meals'

const CONFIG_TABS = [
  { id: 'platos',        label: 'Platos',         Component: PlatosTab },
  { id: 'desayunos',     label: 'Desayunos',      Component: DesayunosTab },
  { id: 'combinaciones', label: 'Combinaciones',  Component: CombinacionesTab },
  { id: 'ingredientes',  label: 'Ingredientes',   Component: IngredientesTab },
  { id: 'planificador',  label: 'Planificador',   Component: WeeklyMealPlannerTab },
  { id: 'compra',        label: 'Compra',         Component: ShoppingListTab },
  { id: 'menu',          label: 'Menú mensual',   Component: MenuTab },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SyncStatus />
          <ProfileSelector />
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
  // Auth gate — persists in sessionStorage (cleared when browser closes)
  const [authed, setAuthed] = useState(() => {
    const pw = import.meta.env.VITE_APP_PASSWORD
    if (!pw) return true                          // no password → open
    return sessionStorage.getItem('mp-auth') === '1'
  })

  if (!authed) {
    return (
      <AuthGate onAuth={() => {
        sessionStorage.setItem('mp-auth', '1')
        setAuthed(true)
      }} />
    )
  }

  return <AppShell />
}
