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
import MobileApp from './mobile/MobileApp'
import useIsMobile from './mobile/useIsMobile'
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

// Sugerencias vistas / descartadas: por dispositivo y por día (las
// sugerencias dependen del día, así que mañana vuelven a salir si siguen
// aplicando).
const dayTag = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
function readTags(key) {
  try {
    const today = dayTag()
    return new Set((JSON.parse(localStorage.getItem(key)) ?? []).filter(t => t.endsWith('@' + today)))
  } catch { return new Set() }
}
function writeTags(key, set) { try { localStorage.setItem(key, JSON.stringify([...set])) } catch {} }

function IdeasPanel({ ideas, hiddenCount, onClose, onPick, onDismiss, onRestore }) {
  const [leaving, setLeaving] = useState(() => new Set())
  function leave(i, go) {
    setLeaving(l => new Set(l).add(i.id))
    setTimeout(() => { onDismiss(i); if (go && i.view) onPick(i.view) }, go && i.view ? 180 : 280)
  }
  return (
    <aside className="mp-ideas" aria-label="Sugerencias">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px 10px' }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>Sugerencias</span>
        <button className="mp-icon-btn" style={{ width: 30, height: 30 }} aria-label="Cerrar" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
      </div>
      {ideas.length === 0 && (
        <div className="mp-empty" style={{ padding: '26px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span className="mp-bubble" style={{ width: 38, height: 38, background: 'rgba(47,158,91,0.14)', color: 'var(--c-green)' }}><Icon name="check" size={18} stroke={2.6} /></span>
          Todo al día.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ideas.map((i, n) => (
          <div key={i.id} className={`mp-idea mp-in${leaving.has(i.id) ? ' is-leaving' : ''}`} style={{ animationDelay: `${60 + n * 60}ms` }}>
            <button type="button" className="mp-idea-main" onClick={() => leave(i, true)} title={i.view ? 'Abrir y quitar de la lista' : 'Hecho: quitar de la lista'}>
              <span className="mp-bubble" style={{ width: 32, height: 32, background: i.tint, color: i.color }}><Icon name={i.icon} size={16} stroke={2.2} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--c-ink-3)' }}>{i.when}</span>
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{i.title}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--c-ink-2)' }}>{i.detail}</span>
              </span>
            </button>
            <button type="button" className="mp-idea-x" aria-label={`Descartar: ${i.title}`} onClick={() => leave(i, false)}><Icon name="x" size={10} stroke={3} /></button>
          </div>
        ))}
      </div>
      {hiddenCount > 0 && (
        <button type="button" className="mp-idea-restore" onClick={onRestore}>Mostrar las {hiddenCount} descartadas hoy</button>
      )}
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
  const allIdeas = useMemo(
    () => computeInsights({ weekPlan, profiles, allIng, allCombos }),
    [weekPlan, profiles, allIng, allCombos]
  )
  const [dismissed, setDismissed] = useState(() => readTags('mp-ideas-dismissed'))
  const [seen, setSeen] = useState(() => readTags('mp-ideas-seen'))
  const tagOf = i => `${i.id}@${dayTag()}`
  const ideas = allIdeas.filter(i => !dismissed.has(tagOf(i)))
  const unseen = ideas.filter(i => !seen.has(tagOf(i))).length

  // Al abrir el panel, todo lo que se ve cuenta como visto (el número se va)
  useEffect(() => {
    if (!ideasOpen) return
    const next = new Set(seen)
    ideas.forEach(i => next.add(tagOf(i)))
    if (next.size !== seen.size) { setSeen(next); writeTags('mp-ideas-seen', next) }
  }, [ideasOpen, ideas.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss(i) {
    const next = new Set(dismissed).add(tagOf(i))
    setDismissed(next); writeTags('mp-ideas-dismissed', next)
  }
  function restoreDismissed() {
    const next = new Set()
    setDismissed(next); writeTags('mp-ideas-dismissed', next)
  }

  useEffect(() => { window.scrollTo({ top: 0 }) }, [view.value])

  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <MobileApp unseen={unseen} ideasOpen={ideasOpen} setIdeasOpen={setIdeasOpen}
        ideasPanel={ideasOpen && (
          <IdeasPanel ideas={ideas} hiddenCount={allIdeas.length - ideas.length}
            onClose={() => setIdeasOpen(false)} onDismiss={dismiss} onRestore={restoreDismissed}
            onPick={v => { setView(v); setIdeasOpen(false) }} />
        )} />
    )
  }

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
            {unseen > 0 && !ideasOpen && <span className="mp-badge">{unseen}</span>}
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

      {ideasOpen && (
        <IdeasPanel ideas={ideas} hiddenCount={allIdeas.length - ideas.length}
          onClose={() => setIdeasOpen(false)} onDismiss={dismiss} onRestore={restoreDismissed}
          onPick={v => { setView(v); setIdeasOpen(false) }} />
      )}
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
