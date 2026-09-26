import { useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { MODEL_WEEKS } from '../../data/modelWeeks'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { buildModelWeekSlots } from '../../lib/planActions'
import {
  DAY_KEYS, addDays, mondayOf, weekKeyOf, fmtRange, fmtMoney,
  activeProfilesOn, dayForPerson, dayTotals, shortName,
} from '../../lib/mealplan'

// Cargar una semana modelo en esta semana o en la del próximo batch. Cada
// fila enseña las cifras REALES de esa semana (mismo motor que el resto):
// coste de la semana para todos y kcal medias frente al objetivo.
export default function ModelWeekSheet({ initialTarget = 1, onClose, onLoaded }) {
  const allIng     = useStore(selectAllIng)
  const allCombos  = useStore(selectAllCombos)
  const profiles   = useStore(s => s.profiles)
  const weekPlan   = useStore(s => s.weekPlan)
  const replaceWeek = useStore(s => s.replaceWeek)
  const [target, setTarget] = useState(initialTarget) // 0 = esta semana, 1 = próximo batch
  const [sel, setSel] = useState(null)

  const monday = addDays(mondayOf(new Date()), target * 7)
  const wk = weekKeyOf(monday)
  const people = activeProfilesOn(profiles, addDays(monday, 2))
  const existing = Object.keys(weekPlan[wk] ?? {}).filter(k => weekPlan[wk][k]).length

  const rows = useMemo(() => MODEL_WEEKS.map(w => {
    const slots = buildModelWeekSlots(w.n)
    let cost = 0, hit = 0, n = 0
    const perPerson = people.map(p => {
      let kcal = 0, tgt = 0
      DAY_KEYS.forEach((dk, i) => {
        const t = dayTotals(dayForPerson(slots, dk, p.id), p, i, allIng, allCombos)
        cost += t.cost; kcal += t.kcal; tgt += t.target
        n++; if (Math.abs(t.kcal - t.target) <= t.target * 0.05) hit++
      })
      return { p, kcal: Math.round(kcal / 7), target: Math.round(tgt / 7) }
    })
    const comida = [...new Set(DAY_KEYS.map(dk => slots[`${dk}-comida`]?.byPerson?.julio?.recipeKey ?? slots[`${dk}-comida`]?.recipeKey))]
      .map(k => shortName(allCombos[k]?.name ?? k))
    return { w, cost, hit, n, perPerson, comida }
  }), [people.map(p => p.id).join(), allIng, allCombos]) // eslint-disable-line react-hooks/exhaustive-deps

  function load() {
    if (sel == null) return
    replaceWeek(wk, buildModelWeekSlots(sel))
    onLoaded?.(target)
    onClose()
  }

  const selRow = rows.find(r => r.w.n === sel)
  const thisMon = mondayOf(new Date())
  const targetLabel = o => {
    const m = addDays(thisMon, o * 7), r = fmtRange(m, addDays(m, 6))
    return o === 0 ? `Esta semana · ${r}` : o === 1 ? `Próximo batch · ${r}` : `Semana ${r}`
  }
  const targetOptions = [...new Set([0, 1, initialTarget])].sort((a, b) => a - b).map(o => ({ value: o, label: targetLabel(o) }))

  return (
    <div className="mp-overlay" onClick={onClose}>
      <div className="mp-sheet" style={{ maxWidth: 820, height: 'min(760px, calc(100vh - 48px))' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Semanas modelo">
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mp-bubble" style={{ width: 42, height: 42, background: 'rgba(139,111,232,0.15)', color: '#7154DA' }}><Icon name="layers" size={20} /></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Semanas modelo</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>Rellena las 28 comidas de una vez, con las raciones ya ajustadas.</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32 }} aria-label="Cerrar" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div style={{ padding: '0 24px 12px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Segmented label="Semana destino" value={target} onChange={setTarget} options={targetOptions} />
          {existing > 0 && <span className="mp-chip" style={{ color: '#B7791F' }}><Icon name="warn" size={13} />Sustituye {existing} de 28 comidas ya puestas</span>}
        </div>

        <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 0 }}>
          {rows.map(({ w, cost, hit, n, perPerson, comida }) => {
            const on = sel === w.n
            return (
              <button key={w.n} type="button" className="mp-row" aria-pressed={on} onClick={() => setSel(w.n)}
                style={{ display: 'grid', gridTemplateColumns: '38px minmax(0, 1fr) auto', gap: 14, alignItems: 'center', padding: '12px 14px', border: 0, cursor: 'pointer', textAlign: 'left', background: on ? '#FFFFFF' : 'rgba(255,255,255,0.5)', boxShadow: on ? '0 10px 24px rgba(110,80,50,0.12)' : 'none' }}>
                <span className="mp-bubble mp-num" style={{ width: 38, height: 38, background: on ? 'var(--c-ink)' : 'rgba(31,27,22,0.07)', color: on ? '#fff' : 'var(--c-ink)', fontWeight: 700, fontSize: 14 }}>{w.n}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 650, lineHeight: 1.3 }}>
                    {w.title.charAt(0) + w.title.slice(1).toLowerCase()}
                    {w.extrema && <span className="mp-tag" style={{ marginLeft: 8, background: 'rgba(214,69,69,0.12)', color: '#B53333' }}>solo referencia</span>}
                  </span>
                  <span className="mp-muted" style={{ fontSize: 12.5, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Comidas: {comida.join(' · ')}</span>
                  <span style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--c-ink-2)' }} className="mp-num">
                    {perPerson.map(x => <span key={x.p.id}>{x.p.name} {x.kcal} / {x.target} kcal</span>)}
                  </span>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span className="mp-num" style={{ fontSize: 17, fontWeight: 650 }}>{fmtMoney(cost)}</span>
                  <span className="mp-muted mp-num" style={{ fontSize: 11.5 }}>{hit}/{n} días ±5 %</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
          <span className="mp-muted" style={{ fontSize: 12.5, maxWidth: 420, lineHeight: 1.4 }}>
            {selRow ? (selRow.w.note ?? '').split('.')[0] + '.' : 'Elige una semana. El coste es de toda la semana para ' + people.map(p => p.name).join(' y ') + '.'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mp-btn mp-btn-glass" onClick={onClose}>Cancelar</button>
            <button className="mp-btn mp-btn-dark" disabled={sel == null} onClick={load}>Cargar semana {sel ?? ''}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

