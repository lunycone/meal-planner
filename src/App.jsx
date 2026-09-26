import { useState, useEffect, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from './store/useStore'
import { supabase }        from './store/storage'
import HomeView            from './views/HomeView'
import PlannerView         from './views/PlannerView'
import PlatosTab           from './components/tabs/PlatosTab'
import IngredientesTab     from './components/tabs/IngredientesTab'
import ShoppingListTab     from './components/tabs/ShoppingListTab'
import BatchPrepTab        from './components/tabs/BatchPrepTab'
import AuthGate            from './components/AuthGate'
import SyncStatus          from './components/SyncStatus'
import Segmented           from './components/ui/Segmented'
import Icon                from './components/ui/Icon'
import { computeInsights } from './engine/insights'
import { PERSON_COLOR, activeProfilesOn } from './lib/mealplan'

const TABS = [
  { value: 'home',         label: 'Hoy',          Component: HomeView },
  { value: 'planificador', label: 'Planificador', Component: PlannerView },
  { value: 'compra',       label: 'Compra',       Component: ShoppingListTab },
  { value: 'batch',        label: 'Batch',        Component: BatchPrepTab },
  { value: 'platos',       label: 'Platos',       Component: PlatosTab },
  { value: 'ingredientes', label: 'Ingredientes', Component: IngredientesTab },
]

function PeopleToggle() {
  const profiles        = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const setActive       = useStore(s => s.setActiveProfile)
  const people = activeProfilesOn(profiles, new Date())
  return (
    <div className="mp-people" role="group" aria-label="Ver por persona">
      {people.map((p, i) => {
        const on = activeProfileId === p.id
        const dim = activeProfileId !== 'all' && !on
        return (
          <button key={p.id} type="button" className={`mp-avatar${on ? ' is-on' : ''}${dim ? ' is-dim' : ''}`}
            style={{ background: `linear-gradient(135deg, ${PERSON_COLOR[i % PERSON_COLOR.length]}CC, ${PERSON_COLOR[i % PERSON_COLOR.length]})` }}
            aria-pressed={on} title={on ? `Viendo solo a ${p.name} · pulsa para ver a todos` : `Ver solo a ${p.name}`}
            onClick={() => setActive(on ? 'all' : p.id)}>
            {p.initial}
          </button>
        )
      })}
    </div>
  )
}

function IdeasPanel({ ideas, onClose, onGo }) {
  return (
    <aside className="mp-ideas" aria-label="Sugerencias">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px 10px' }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>Sugerencias</span>
        <button className="mp-icon-btn" style={{ width: 30, height: 30 }} aria-label="Cerrar" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
      </div>
      {ideas.length === 0 && <div className="mp-empty" style={{ padding: 20 }}>Nada que revisar ahora mismo.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ideas.map((i, n) => (
          <button key={i.id} type="button" className="mp-in mp-row" onClick={() => i.view && onGo(i.view)}
            style={{ display: 'flex', gap: 12, padding: 12, border: 0, borderRadius: 18, background: 'rgba(255,255,255,0.85)', textAlign: 'left', cursor: i.view ? 'pointer' : 'default', animationDelay: `${60 + n * 60}ms` }}>
            <span className="mp-bubble" style={{ width: 32, height: 32, background: i.tint, color: i.color }}><Icon name={i.icon} size={16} stroke={2.2} /></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--c-ink-3)' }}>{i.when}</span>
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{i.title}</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--c-ink-2)' }}>{i.detail}</span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}

function AppShell() {
  const activeView = useStore(s => s.activeView)
  const setView    = useStore(s => s.setView)
  const weekPlan   = useStore(s => s.weekPlan)
  const profiles   = useStore(s => s.profiles)
  const allIng     = useStore(selectAllIng)
  const allCombos  = useStore(selectAllCombos)
  const [ideasOpen, setIdeasOpen] = useState(false)

  const view = TABS.find(t => t.value === activeView) ?? TABS[0]
  const ideas = useMemo(
    () => computeInsights({ weekPlan, profiles, allIng, allCombos }),
    [weekPlan, profiles, allIng, allCombos]
  )

  useEffect(() => { window.scrollTo({ top: 0 }) }, [view.value])

  return (
    <div className="mp-app">
      <div className="mp-bg" aria-hidden="true" />
      <header className="mp-top">
        <div className="mp-brand"><span className="mp-orb" aria-hidden="true" />meal planner</div>
        <Segmented className="mp-nav" thumbClass="mp-nav-lens" label="Secciones"
          options={TABS.map(t => ({ value: t.value, label: t.label }))}
          value={view.value} onChange={v => { setView(v); setIdeasOpen(false) }} />
        <div className="mp-top-right">
          <SyncStatus />
          <PeopleToggle />
          <button type="button" className={`mp-icon-btn${ideasOpen ? ' is-on' : ''}`} aria-label="Sugerencias" aria-expanded={ideasOpen}
            onClick={() => setIdeasOpen(o => !o)} style={{ position: 'relative' }}>
            <Icon name="bulb" size={18} />
            {ideas.length > 0 && <span className="mp-badge">{ideas.length}</span>}
          </button>
          {supabase && (
            <button type="button" className="mp-icon-btn" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => supabase.auth.signOut()}>
              <Icon name="logout" size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="mp-main" key={view.value}>
        <view.Component />
      </main>

      {ideasOpen && <IdeasPanel ideas={ideas} onClose={() => setIdeasOpen(false)} onGo={v => { setView(v); setIdeasOpen(false) }} />}
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
