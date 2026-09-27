import { useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import Icon from '../components/ui/Icon'
import PlatosTab from '../components/tabs/PlatosTab'
import IngredientesTab from '../components/tabs/IngredientesTab'
import ModelWeekSheet from '../components/meal/ModelWeekSheet'
import { MODEL_WEEKS } from '../data/modelWeeks'
import { MHeader } from './MobileApp'

// Más: Platos, Ingredientes (las mismas pantallas que en el Mac, que ya se
// adaptan a pantalla estrecha), Semanas modelo, sugerencias y salir.

export default function MMas({ unseen, onIdeas, sub, onSub, onBack, onLogout }) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const customWeeks = useStore(s => s.customWeeks) ?? []
  const hiddenWeeks = useStore(s => s.hiddenModelWeeks) ?? []
  const deletedWeeks = useStore(s => s.deletedModelWeeks) ?? []
  const weekCount = MODEL_WEEKS.filter(w => !hiddenWeeks.includes(w.n) && !deletedWeeks.includes(w.n)).length + customWeeks.filter(w => !w.archived).length
  const openPlanner = useStore(s => s.openPlanner)
  const [models, setModels] = useState(false)

  if (sub === 'platos' || sub === 'ingredientes') {
    return (
      <div className="m-page m-sub">
        <button type="button" className="m-back" onClick={onBack}><Icon name="left" size={14} stroke={2.6} />More</button>
        {sub === 'platos' ? <PlatosTab /> : <IngredientesTab />}
      </div>
    )
  }

  const rows = [
    { l: 'Dishes', v: Object.keys(allCombos).length, icon: 'plate', c: '#2585BC', tint: 'rgba(46,155,214,0.15)', go: () => onSub('platos') },
    { l: 'Ingredients', v: Object.keys(allIng).length, icon: 'leaf', c: '#2F9E5B', tint: 'rgba(47,158,91,0.14)', go: () => onSub('ingredientes') },
    { l: 'Model weeks', v: weekCount, icon: 'layers', c: '#7154DA', tint: 'rgba(139,111,232,0.15)', go: () => setModels(true) },
    { l: 'Suggestions', v: unseen || '', icon: 'bulb', c: '#C1850C', tint: 'rgba(224,162,27,0.16)', go: onIdeas },
  ]
  return (
    <div className="m-page">
      <MHeader title="More" unseen={unseen} onIdeas={onIdeas} />
      <section className="mm-list">
        {rows.map(r => (
          <button key={r.l} type="button" onClick={r.go}>
            <span className="mm-ico" style={{ background: r.tint, color: r.c }}><Icon name={r.icon} size={18} /></span>
            <span style={{ flex: 1, fontSize: 15.5, fontWeight: 600 }}>{r.l}</span>
            <span className="mp-muted mp-num" style={{ fontSize: 13.5 }}>{r.v}</span>
            <Icon name="right" size={13} stroke={2.4} color="var(--c-ink-3)" />
          </button>
        ))}
      </section>
      {onLogout && <button type="button" className="mm-logout" onClick={onLogout}><Icon name="logout" size={16} />Sign out</button>}
      {models && <ModelWeekSheet initialTarget={1} onClose={() => setModels(false)} onLoaded={t => openPlanner(t, 0)} />}
    </div>
  )
}
