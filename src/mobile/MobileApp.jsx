import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { supabase } from '../store/storage'
import Icon from '../components/ui/Icon'
import { PERSON_COLOR, activeProfilesOn } from '../lib/mealplan'
import MHoy from './MHoy'
import MSemana from './MSemana'
import MCompra from './MCompra'
import MBatch from './MBatch'
import MMas from './MMas'

// ─── App móvil ───────────────────────────────────────────────────────────────
// Misma app y mismos datos que en el Mac, con pantallas pensadas para el
// pulgar: Hoy (carrusel), Semana (lista de días), Compra (modo súper), Batch
// (modo cocina) y Más. Barra de pestañas abajo.

const TABS = [
  { id: 'home', label: 'Today', icon: 'sun' },
  { id: 'planificador', label: 'Week', icon: 'cal' },
  { id: 'compra', label: 'Shop', icon: 'bag' },
  { id: 'batch', label: 'Batch', icon: 'pot' },
  { id: 'mas', label: 'More', icon: 'more' },
]
const tabOf = v => (v === 'platos' || v === 'ingredientes' || v === 'mas') ? 'mas' : (TABS.some(t => t.id === v) ? v : 'home')

export function People({ rings }) {
  const profiles = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const setActive = useStore(s => s.setActiveProfile)
  const people = activeProfilesOn(profiles, new Date())
  return (
    <div className="m-people" role="group" aria-label="View by person">
      {people.map((p, i) => {
        const on = activeProfileId === p.id, dim = activeProfileId !== 'all' && !on
        const c = PERSON_COLOR[i % PERSON_COLOR.length]
        const pct = rings?.[p.id]
        return (
          <button key={p.id} type="button" className={`m-avatar${on ? ' is-on' : ''}${dim ? ' is-dim' : ''}${pct != null ? ' has-ring' : ''}`} aria-pressed={on}
            aria-label={on ? `Showing only ${p.name}` : `Show only ${p.name}`} onClick={() => setActive(on ? 'all' : p.id)}
            style={pct != null ? { background: `conic-gradient(${c} 0 ${Math.min(100, pct)}%, rgba(110,80,50,0.14) ${Math.min(100, pct)}% 100%)` } : undefined}>
            <span style={{ background: `linear-gradient(135deg, ${c}CC, ${c})` }}>{p.initial}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Bulb({ unseen, onOpen }) {
  return (
    <button type="button" className="m-bulb" aria-label="Suggestions" onClick={onOpen}>
      <Icon name="bulb" size={18} />
      {unseen > 0 && <span className="mp-badge">{unseen}</span>}
    </button>
  )
}

export function MHeader({ title, sub, unseen, onIdeas }) {
  return (
    <header className="m-head">
      {sub && <span className="m-sub">{sub}</span>}
      <div className="m-head-row">
        <h1>{title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <People />
          <Bulb unseen={unseen} onOpen={onIdeas} />
        </div>
      </div>
    </header>
  )
}

export default function MobileApp({ unseen, setIdeasOpen, ideasPanel }) {
  const activeView = useStore(s => s.activeView)
  const setView = useStore(s => s.setView)
  const tab = tabOf(activeView)
  const idx = TABS.findIndex(t => t.id === tab)
  const scroller = useRef(null)

  useEffect(() => { scroller.current?.scrollTo({ top: 0 }) }, [tab, activeView])

  const common = { unseen, onIdeas: () => setIdeasOpen(true) }
  let screen
  if (tab === 'home') screen = <MHoy {...common} />
  else if (tab === 'planificador') screen = <MSemana {...common} />
  else if (tab === 'compra') screen = <MCompra {...common} />
  else if (tab === 'batch') screen = <MBatch {...common} />
  else screen = <MMas {...common} sub={activeView} onSub={v => setView(v)} onBack={() => setView('mas')}
    onLogout={supabase ? () => supabase.auth.signOut() : null} />

  return (
    <div className="m-app">
      <div className="mp-bg" aria-hidden="true" />
      <main className="m-scroll" ref={scroller} key={tab}>
        {screen}
      </main>
      <nav className="m-tabs" aria-label="Sections">
        <span className="m-tabs-lens" aria-hidden="true" style={{ left: `calc(6px + ${idx} * (100% - 12px) / ${TABS.length})` }} />
        {TABS.map(t => (
          <button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined}
            className={tab === t.id ? 'is-on' : ''} onClick={() => { setView(t.id); setIdeasOpen(false) }}>
            <Icon name={t.icon} size={22} />{t.label}
          </button>
        ))}
      </nav>
      {ideasPanel}
    </div>
  )
}
