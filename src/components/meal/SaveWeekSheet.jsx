import { useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import Overlay from '../ui/Overlay'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { addDays, fmtRange, fmtMoney, fmtShortDate, activeProfilesOn, weekStats } from '../../lib/mealplan'

// «Guardar semana»: la semana del Planificador pasa a ser una semana modelo
// propia, con nombre. Si la semana viene de «Editar» en Semanas modelo, ofrece
// actualizar esa misma o guardarla como nueva; si el nombre ya existe entre
// las tuyas, se actualiza esa en vez de duplicarla.
export default function SaveWeekSheet({ weekKey, monday, onClose, onSaved }) {
  const allIng    = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const profiles  = useStore(s => s.profiles)
  const week      = useStore(s => s.weekPlan[weekKey]) ?? {}
  const customWeeks = useStore(s => s.customWeeks) ?? []
  const editing   = useStore(s => s.editingWeek)
  const saveCustomWeek   = useStore(s => s.saveCustomWeek)
  const replaceModelWeek = useStore(s => s.replaceModelWeek)
  const setEditingWeek   = useStore(s => s.setEditingWeek)

  const linked = editing && editing.weekKey === weekKey ? editing : null
  const [mode, setMode] = useState(linked ? 'update' : 'new')
  const [name, setName] = useState(linked ? linked.name : `Week of ${fmtShortDate(monday)}`)

  const people = activeProfilesOn(profiles, addDays(monday, 2))
  const stats = useMemo(() => weekStats(week, people, allIng, allCombos), [week, allIng, allCombos]) // eslint-disable-line react-hooks/exhaustive-deps
  const clean = name.trim()
  const sameName = mode === 'new' ? customWeeks.find(w => w.name.trim().toLowerCase() === clean.toLowerCase()) : null

  function save() {
    if (!clean || !stats.planned) return
    const slots = JSON.parse(JSON.stringify(week))
    let ref
    if (mode === 'update' && linked?.kind === 'custom') {
      saveCustomWeek({ id: linked.id, name: clean, slots }); ref = { kind: 'custom', id: linked.id }
    } else if (mode === 'update' && linked?.kind === 'model') {
      ref = { kind: 'custom', id: replaceModelWeek(linked.id, { name: clean, slots }) }
    } else {
      ref = { kind: 'custom', id: saveCustomWeek({ id: sameName?.id ?? null, name: clean, slots }) }
    }
    setEditingWeek({ ...ref, name: clean, weekKey })
    onSaved?.(clean)
    onClose()
  }

  return (
    <Overlay onClose={onClose}>
      <div className="mp-sheet" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Save week">
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mp-bubble" style={{ width: 42, height: 42, background: 'rgba(139,111,232,0.15)', color: '#7154DA' }}><Icon name="sparkle" size={19} /></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Save week</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>{fmtRange(monday, addDays(monday, 6))} · will appear in Model weeks</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32 }} aria-label="Close" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {linked && (
            <Segmented label="How to save" value={mode} onChange={v => { setMode(v); setName(v === 'update' ? linked.name : `${linked.name} (2)`) }}
              options={[{ value: 'update', label: `Update “${linked.name.length > 22 ? linked.name.slice(0, 20) + '…' : linked.name}”` }, { value: 'new', label: 'Save as new' }]} />
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="mp-eyebrow">Name</span>
            <input className="mp-input" autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save() }} placeholder="For example: Cheap autumn" />
          </label>
          {sameName && <span style={{ fontSize: 12.5, color: '#8A5E08', marginTop: -6 }}>You already have a week with that name: it will be updated.</span>}
          {linked?.kind === 'model' && mode === 'update' && (
            <span className="mp-muted" style={{ fontSize: 12.5, marginTop: -6, lineHeight: 1.45 }}>This is a built-in week: your version will be saved and the original hidden (it can be restored).</span>
          )}

          <div className="pl-card" style={{ gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="mp-num" style={{ fontSize: 22, fontWeight: 700 }}>{stats.planned}<span className="mp-muted" style={{ fontSize: 14, fontWeight: 500 }}> / 28 meals</span></span>
              <span className="mp-num" style={{ fontSize: 17, fontWeight: 650 }}>{fmtMoney(stats.cost)}</span>
            </div>
            {stats.comida.length > 0 && <span className="mp-muted" style={{ fontSize: 12.5 }}>Lunches: {stats.comida.join(' · ')}</span>}
            <span className="mp-num" style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--c-ink-2)' }}>
              {stats.perPerson.map(x => <span key={x.p.id}>{x.p.name} {x.kcal} / {x.target} kcal</span>)}
            </span>
          </div>
        </div>

        <div className="mp-sheet-foot">
          {!stats.planned && <span className="mp-muted" style={{ fontSize: 12.5, marginRight: 'auto' }}>The week is empty.</span>}
          <button className="mp-btn mp-btn-glass" onClick={onClose}>Cancel</button>
          <button className="mp-btn mp-btn-dark" disabled={!clean || !stats.planned} onClick={save}>{mode === 'update' || sameName ? 'Save changes' : 'Save'}</button>
        </div>
      </div>
    </Overlay>
  )
}
