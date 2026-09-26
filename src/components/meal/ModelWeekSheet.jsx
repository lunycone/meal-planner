import { useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { MODEL_WEEKS } from '../../data/modelWeeks'
import Overlay from '../ui/Overlay'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { buildModelWeekSlots } from '../../lib/planActions'
import { addDays, mondayOf, weekKeyOf, fmtRange, fmtMoney, activeProfilesOn, weekStats } from '../../lib/mealplan'

// Titles shout in CAPS ('WEIGHT GAIN — …'): calm them down, keep acronyms.
const pretty = t => { const s = t.replace(/\b[A-Z]{3,}\b/g, w => w === 'PCOS' ? w : w.toLowerCase()); return s.charAt(0).toUpperCase() + s.slice(1) }

// Semanas modelo: las tuyas (guardadas con «Guardar semana») arriba y las de
// fábrica debajo. Cualquiera se carga, se renombra, se edita (se carga en la
// semana destino y el Planificador queda enlazado para «Guardar cambios») o
// se elimina (las de fábrica solo se ocultan y se pueden restaurar).
export default function ModelWeekSheet({ initialTarget = 1, onClose, onLoaded }) {
  const allIng     = useStore(selectAllIng)
  const allCombos  = useStore(selectAllCombos)
  const profiles   = useStore(s => s.profiles)
  const weekPlan   = useStore(s => s.weekPlan)
  const replaceWeek = useStore(s => s.replaceWeek)
  const customWeeks = useStore(s => s.customWeeks) ?? []
  const hidden      = useStore(s => s.hiddenModelWeeks) ?? []
  const names       = useStore(s => s.modelWeekNames) ?? {}
  const renameWeek  = useStore(s => s.renameWeek)
  const deleteWeek  = useStore(s => s.deleteWeek)
  const restoreModelWeeks = useStore(s => s.restoreModelWeeks)
  const setEditingWeek = useStore(s => s.setEditingWeek)

  const [target, setTarget] = useState(initialTarget) // 0 = esta semana, 1 = próximo batch
  const [sel, setSel] = useState(null)          // 'c:<id>' | 'm:<n>'
  const [renaming, setRenaming] = useState(null) // { key, value }
  const [confirmDel, setConfirmDel] = useState(null)

  const monday = addDays(mondayOf(new Date()), target * 7)
  const wk = weekKeyOf(monday)
  const people = activeProfilesOn(profiles, addDays(monday, 2))
  const existing = Object.keys(weekPlan[wk] ?? {}).filter(k => weekPlan[wk][k]).length
  const peopleKey = people.map(p => p.id).join()

  const modelSlots = useMemo(() => Object.fromEntries(MODEL_WEEKS.map(w => [w.n, buildModelWeekSlots(w.n)])), [])
  const rows = useMemo(() => {
    const mine = [...customWeeks]
      .sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''))
      .map(w => ({ key: `c:${w.id}`, kind: 'custom', id: w.id, name: w.name, slots: w.slots, badge: 'Yours' }))
    const factory = MODEL_WEEKS.filter(w => !hidden.includes(w.n))
      .map(w => ({ key: `m:${w.n}`, kind: 'model', id: w.n, num: w.n, name: names[w.n] ?? pretty(w.title), slots: modelSlots[w.n], note: w.note, extrema: !!w.extrema }))
    return [...mine, ...factory].map(r => ({ ...r, stats: weekStats(r.slots, people, allIng, allCombos) }))
  }, [customWeeks, hidden, names, modelSlots, peopleKey, allIng, allCombos]) // eslint-disable-line react-hooks/exhaustive-deps

  const selRow = rows.find(r => r.key === sel)
  const mineCount = rows.filter(r => r.kind === 'custom').length

  function load(row = selRow, edit = false) {
    if (!row) return
    replaceWeek(wk, JSON.parse(JSON.stringify(row.slots)))
    setEditingWeek(edit ? { kind: row.kind, id: row.id, name: row.name, weekKey: wk } : null)
    onLoaded?.(target)
    onClose()
  }
  function commitRename() {
    if (!renaming) return
    const row = rows.find(r => r.key === renaming.key)
    const v = renaming.value.trim()
    if (row && v && v !== row.name) renameWeek(row.kind, row.id, v)
    setRenaming(null)
  }

  const thisMon = mondayOf(new Date())
  const targetLabel = o => {
    const m = addDays(thisMon, o * 7), r = fmtRange(m, addDays(m, 6))
    return o === 0 ? `This week · ${r}` : o === 1 ? `Next batch · ${r}` : `Week ${r}`
  }
  const targetOptions = [...new Set([0, 1, initialTarget])].sort((a, b) => a - b).map(o => ({ value: o, label: targetLabel(o) }))

  return (
    <Overlay onClose={onClose}>
      <div className="mp-sheet" style={{ maxWidth: 860, height: 'min(780px, calc(100dvh - 48px))' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Model weeks">
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mp-bubble" style={{ width: 42, height: 42, background: 'rgba(139,111,232,0.15)', color: '#7154DA' }}><Icon name="layers" size={20} /></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Model weeks</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>Fills all 28 meals at once, with portions already adjusted.</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32 }} aria-label="Close" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div style={{ padding: '0 24px 12px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Segmented label="Target week" value={target} onChange={setTarget} options={targetOptions} />
          {existing > 0 && <span className="mp-chip" style={{ color: '#B7791F' }}><Icon name="warn" size={13} />Replaces {existing} of 28 meals already planned</span>}
        </div>

        <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 0 }}>
          {rows.map((r, idx) => {
            const on = sel === r.key
            const header = idx === 0 && mineCount ? 'Your weeks' : idx === mineCount ? 'Built-in' : null
            const isRen = renaming?.key === r.key
            const isDel = confirmDel === r.key
            return (
              <div key={r.key}>
                {header && <div className="mp-eyebrow" style={{ padding: idx ? '14px 2px 6px' : '2px 2px 6px' }}>{header}</div>}
                <div className={`mw-row${on ? ' is-on' : ''}`}>
                  {!isRen && <button type="button" className="mw-hit" aria-pressed={on} aria-label={`Choose ${r.name}`}
                    onClick={() => setSel(r.key)} onDoubleClick={() => load(r)} />}
                  <span className="mp-bubble mp-num mw-num" style={{ background: on ? 'var(--c-ink)' : r.kind === 'custom' ? 'rgba(139,111,232,0.15)' : 'rgba(31,27,22,0.07)', color: on ? '#fff' : r.kind === 'custom' ? '#5B3FC4' : 'var(--c-ink)' }}>
                    {r.kind === 'custom' ? <Icon name="sparkle" size={15} stroke={2.2} /> : r.num}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    {isRen ? (
                      <input className="mw-rename" autoFocus value={renaming.value} aria-label="Nuevo nombre"
                        onChange={e => setRenaming({ ...renaming, value: e.target.value })}
                        onBlur={commitRename}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { e.stopPropagation(); setRenaming(null) } }} />
                    ) : (
                      <span style={{ fontSize: 14.5, fontWeight: 650, lineHeight: 1.3 }}>
                        {r.name}
                        {r.extrema && <span className="mp-tag" style={{ marginLeft: 8, background: 'rgba(214,69,69,0.12)', color: '#B53333' }}>reference only</span>}
                      </span>
                    )}
                    <span className="mp-muted" style={{ fontSize: 12.5, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.stats.comida.length ? `Lunches: ${r.stats.comida.join(' · ')}` : 'No lunches'}{r.stats.planned < 28 ? ` · ${r.stats.planned}/28` : ''}
                    </span>
                    <span style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--c-ink-2)' }} className="mp-num">
                      {r.stats.perPerson.map(x => <span key={x.p.id}>{x.p.name} {x.kcal} / {x.target} kcal</span>)}
                    </span>
                  </span>
                  {isDel ? (
                    <span className="mw-confirm">
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{r.kind === 'custom' ? 'Delete?' : 'Hide?'}</span>
                      <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setConfirmDel(null)}>No</button>
                      <button className="mp-btn mp-btn-danger mp-btn-sm" onClick={() => { deleteWeek(r.kind, r.id); setConfirmDel(null); if (sel === r.key) setSel(null) }}>Yes</button>
                    </span>
                  ) : (
                    <span className="mw-side">
                      <span className="mw-actions">
                        <button type="button" className="mw-act" title="Rename" aria-label={`Rename ${r.name}`} onClick={() => setRenaming({ key: r.key, value: r.name })}><Icon name="edit" size={13} /></button>
                        <button type="button" className="mw-act" title="Edit its dishes in the Planner" aria-label={`Edit ${r.name}`} onClick={() => load(r, true)}><Icon name="cal" size={13} /></button>
                        <button type="button" className="mw-act is-danger" title={r.kind === 'custom' ? 'Delete' : 'Hide'} aria-label={`Delete ${r.name}`} onClick={() => setConfirmDel(r.key)}><Icon name="trash" size={13} /></button>
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span className="mp-num" style={{ fontSize: 17, fontWeight: 650 }}>{fmtMoney(r.stats.cost)}</span>
                        <span className="mp-muted mp-num" style={{ fontSize: 11.5 }}>{r.stats.hit}/{r.stats.n} days ±5%</span>
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {hidden.length > 0 && (
            <button type="button" className="mp-idea-restore" onClick={restoreModelWeeks}>Restore {hidden.length === 1 ? 'the hidden built-in week' : `the ${hidden.length} hidden built-in weeks`}</button>
          )}
        </div>

        <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
          <span className="mp-muted" style={{ fontSize: 12.5, maxWidth: 440, lineHeight: 1.4 }}>
            {selRow?.note ? (selRow.note.split('.')[0] + '.') : selRow ? 'Double-click a week to load it directly.' : `Whole-week cost for ${people.map(p => p.name).join(' and ')}.`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mp-btn mp-btn-glass" onClick={onClose}>Cancel</button>
            <button className="mp-btn mp-btn-dark" disabled={!selRow} onClick={() => load()}>{selRow ? `Load “${selRow.name.length > 28 ? selRow.name.slice(0, 26) + '…' : selRow.name}”` : 'Load week'}</button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
