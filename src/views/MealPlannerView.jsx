import { useState } from 'react'
import useStore, { selectMealPlan } from '../store/useStore'
import { MEALS, DAY_KEYS, DAY_LABELS } from '../config/meals'
import { MEAL_ICONS } from '../config/icons'
import { getWeekDayMap, streamSummary } from '../engine/plan'
import { fmt, kfmt } from '../engine/calc'

// ─── Day selector (multi-checkbox for "covers") ───────────────────────────────

function DaySelector({ value, onChange, exclude }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {DAY_KEYS.map(d => {
        if (d === exclude) return null
        const on = value.includes(d)
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(on ? value.filter(x => x !== d) : [...value, d])}
            style={{
              padding: '3px 9px', borderRadius: 99, fontSize: '0.72rem',
              border: '1px solid', cursor: 'pointer',
              background: on ? 'var(--brown)' : 'rgba(255,255,255,0.6)',
              color: on ? '#fff' : 'var(--muted)',
              borderColor: on ? 'var(--brown)' : 'rgba(210,195,178,0.6)',
              backdropFilter: 'blur(6px)',
            }}
          >{DAY_LABELS[d]}</button>
        )
      })}
    </div>
  )
}

// ─── Batch edit form ──────────────────────────────────────────────────────────

function MealBatchEditForm({ meal, batch, weekId, onClose }) {
  const setMealBatchOverride  = useStore(s => s.setMealBatchOverride)
  const resetMealBatchOverride = useStore(s => s.resetMealBatchOverride)
  const updateMealBatch       = useStore(s => s.updateMealBatch)

  const [protein,  setProtein]  = useState(batch.protein  ?? '')
  const [combo,    setCombo]    = useState(batch.combo    ?? '')
  const [note,     setNote]     = useState(batch.note     ?? '')
  const [kcalEst,  setKcalEst]  = useState(String(batch.kcalEst ?? ''))
  const [costEst,  setCostEst]  = useState(String(batch.costEst ?? ''))
  const [cookDay,  setCookDay]  = useState(batch.cookDay  ?? 'dom')
  const [covers,   setCovers]   = useState(batch.covers   ?? [])
  const [itemsText,setItemsText]= useState((batch.items ?? []).join('\n'))

  function save() {
    const data = {
      protein, combo, note,
      kcalEst:  parseFloat(kcalEst)  || batch.kcalEst,
      costEst:  parseFloat(costEst)  || batch.costEst,
      cookDay, covers,
      items: itemsText.split('\n').map(s => s.trim()).filter(Boolean),
    }
    if (batch.isCustom) {
      updateMealBatch(meal, weekId, batch.id, data)
    } else {
      setMealBatchOverride(meal, batch.id, data)
    }
    onClose()
  }

  function reset() { resetMealBatchOverride(meal, batch.id); onClose() }

  return (
    <div className="mpv-edit-form">
      {/* Protein + combo */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <div className="form-field" style={{ flex: 2 }}>
          <label>Proteína</label>
          <input className="form-input" value={protein} onChange={e => setProtein(e.target.value)} />
        </div>
        <div className="form-field" style={{ flex: 3 }}>
          <label>Combinación / acompañante</label>
          <input className="form-input" value={combo} onChange={e => setCombo(e.target.value)} />
        </div>
        <div className="form-field" style={{ width: 70 }}>
          <label>kcal est.</label>
          <input className="form-input" type="number" value={kcalEst} onChange={e => setKcalEst(e.target.value)} />
        </div>
        <div className="form-field" style={{ width: 70 }}>
          <label>$ est.</label>
          <input className="form-input" type="number" step="0.01" value={costEst} onChange={e => setCostEst(e.target.value)} />
        </div>
      </div>

      {/* Note */}
      <div className="form-field" style={{ marginBottom: 8 }}>
        <label>Nota</label>
        <input className="form-input" style={{ width: '100%' }} value={note} onChange={e => setNote(e.target.value)} />
      </div>

      {/* Schedule */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div className="form-field">
          <label>Día de cocina</label>
          <select className="form-input" value={cookDay} onChange={e => setCookDay(e.target.value)}>
            {DAY_KEYS.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
          </select>
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label>Días de consumo</label>
          <DaySelector value={covers} onChange={setCovers} exclude={cookDay} />
        </div>
      </div>

      {/* Items */}
      <div className="form-field" style={{ marginBottom: 10 }}>
        <label>Lista batch (una línea por ítem)</label>
        <textarea
          className="form-input"
          style={{ width: '100%', height: 80, resize: 'vertical', lineHeight: 1.5 }}
          value={itemsText}
          onChange={e => setItemsText(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn-primary" onClick={save}>Guardar</button>
        <button className="btn-ghost"   onClick={onClose}>Cancelar</button>
        {!batch.isCustom && (
          <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: '0.72rem' }} onClick={reset}>
            ↺ Original
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Batch block ──────────────────────────────────────────────────────────────

function MealBatchBlock({ meal, batch, weekId }) {
  const deleteMealBatch   = useStore(s => s.deleteMealBatch)
  const removeMealBatch   = useStore(s => s.removeMealBatch)
  const mealBatchOverrides = useStore(s => s.mealBatchOverrides)
  const isModified = !batch.isCustom && !!mealBatchOverrides[meal]?.[batch.id]

  const [open,       setOpen]       = useState(false)
  const [editing,    setEditing]    = useState(!batch.protein) // auto-open if new
  const [confirmDel, setConfirmDel] = useState(false)
  const [listOpen,   setListOpen]   = useState(false)

  const coversLabel = (batch.covers ?? []).map(d => DAY_LABELS[d]).join(' · ')

  function doDelete() {
    if (batch.isCustom) removeMealBatch(meal, weekId, batch.id)
    else deleteMealBatch(meal, batch.id)
  }

  return (
    <div className={`mpv-batch${(editing || confirmDel) ? ' is-active' : ''}`}>
      <div className="mpv-batch-top">
        <span className="mpv-batch-label" style={{ color: MEALS[meal]?.color }}>
          {DAY_LABELS[batch.cookDay] ?? batch.cookDay}
          {isModified && <span className="badge badge-modified" style={{ marginLeft: 6 }}>editado</span>}
        </span>
        <span className="mpv-batch-actions">
          <button className="mpv-batch-act-btn" title="Editar" onClick={() => { setEditing(e => !e); setConfirmDel(false) }}>✎</button>
          {!confirmDel
            ? <button className="mpv-batch-act-btn" onClick={() => setConfirmDel(true)}>✕</button>
            : <>
                <span style={{ fontSize: '0.72rem', color: 'var(--warn-ink)' }}>¿Ocultar?</span>
                <button className="btn-danger" style={{ padding: '1px 7px', fontSize: '0.7rem' }} onClick={doDelete}>Sí</button>
                <button className="btn-ghost"  style={{ padding: '1px 7px', fontSize: '0.7rem' }} onClick={() => setConfirmDel(false)}>No</button>
              </>
          }
        </span>
      </div>

      {batch.protein && <div className="mpv-batch-protein">{batch.protein}</div>}
      {batch.combo   && <div className="mpv-batch-combo">{batch.combo}</div>}

      <div className="mpv-batch-stats">
        {batch.costEst > 0 && <span className="mpv-bstat">{fmt(batch.costEst)}/plato</span>}
        {batch.kcalEst > 0 && <span className="mpv-bstat kc">{batch.kcalEst} kcal</span>}
        {coversLabel && <span className="mpv-bstat covers">{coversLabel}</span>}
      </div>

      {batch.note && <div className="mpv-batch-note">{batch.note}</div>}

      {(batch.items ?? []).length > 0 && (
        <>
          <button className="btn-pill" onClick={() => setListOpen(o => !o)} style={{ marginTop: 4 }}>
            {listOpen ? 'cerrar ▴' : 'ver lista batch ▾'}
          </button>
          <ul className={`mpv-items-list${listOpen ? ' open' : ''}`}>
            {batch.items.map((item, i) => {
              const isFresh = item.includes('→') || item.includes('al momento')
              return <li key={i} className={isFresh ? 'fresh' : ''}>{item}</li>
            })}
          </ul>
        </>
      )}

      {editing && (
        <MealBatchEditForm
          meal={meal} batch={batch} weekId={weekId}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}

// ─── Day override block ───────────────────────────────────────────────────────

function DayOverrideBlock({ day, override }) {
  return (
    <div className="mpv-override">
      <div className="mpv-override-label">{DAY_LABELS[day]} · día especial</div>
      {override.protein && <div className="mpv-override-protein">{override.protein}</div>}
      {override.combo   && <div className="mpv-override-combo">{override.combo}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: override.note ? 6 : 0 }}>
        {override.costEst && <span className="mpv-bstat">{fmt(override.costEst)}</span>}
        {override.kcalEst && <span className="mpv-bstat kc">{override.kcalEst} kcal</span>}
        <span className="mpv-bstat spec">no batch</span>
      </div>
      {override.note && <div className="mpv-override-note">{override.note}</div>}
    </div>
  )
}

// ─── Calendar strip (derived from batch data) ─────────────────────────────────

function MealCalendarStrip({ week, mealKey }) {
  const dayMap = getWeekDayMap(week)
  const batchColors = (week.batches ?? []).reduce((acc, b, i) => {
    acc[b.id] = i === 0 ? 'day-eat-0' : 'day-eat-1'
    return acc
  }, {})

  return (
    <div className="mpv-cal-strip">
      {DAY_KEYS.map(day => {
        const entry = dayMap[day]
        let cls = 'day-empty'
        let prot = '—', sub = ''
        if (entry?.type === 'cook') {
          cls  = 'day-cook'
          prot = entry.batch.protein?.split(' ')[0] ?? '↺'
          sub  = '↺'
        } else if (entry?.type === 'eat') {
          cls  = batchColors[entry.batch.id] ?? 'day-eat-0'
          prot = entry.batch.protein?.split(' ')[0] ?? ''
          sub  = entry.batch.combo?.split(' ')[0]  ?? ''
        } else if (entry?.type === 'special') {
          cls  = 'day-special'
          prot = entry.override.protein?.split(' ')[0] ?? '★'
          sub  = '★'
        }
        return (
          <div key={day} className={`mpv-cal-day ${cls}`}>
            <div className="cdn">{DAY_LABELS[day]}</div>
            <div className="cdp">{prot}</div>
            <div className="cds">{sub}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Week card ────────────────────────────────────────────────────────────────

function MealWeekCard({ week, mealKey }) {
  const addMealBatch   = useStore(s => s.addMealBatch)
  const removeMealWeek = useStore(s => s.removeMealWeek)
  const [confirmDel, setConfirmDel] = useState(false)

  const overrides = Object.entries(week.dayOverrides ?? {})

  return (
    <div className="mpv-week-card">
      <div className="mpv-week-header">
        <span className="mpv-week-label">{week.label}</span>
        <span className="mpv-week-meta">{(week.batches ?? []).length} batches</span>
        {week.isCustom && (
          <>
            {!confirmDel
              ? <button className="btn-ghost mpv-week-add" onClick={() => setConfirmDel(true)} style={{ color: '#c0392b', borderColor: 'rgba(240,192,184,0.6)' }}>✕</button>
              : <>
                  <span style={{ fontSize: '0.72rem', color: 'var(--warn-ink)' }}>¿Eliminar semana?</span>
                  <button className="btn-danger" onClick={() => removeMealWeek(mealKey, week.id)}>Sí</button>
                  <button className="btn-ghost" onClick={() => setConfirmDel(false)}>No</button>
                </>
            }
          </>
        )}
        <button className="btn-ghost mpv-week-add" onClick={() => addMealBatch(mealKey, week.id)}>+ Batch</button>
      </div>

      {/* Day overrides (special days) */}
      {overrides.map(([day, ov]) => (
        <DayOverrideBlock key={day} day={day} override={ov} />
      ))}

      {/* Batches */}
      {(week.batches ?? []).length === 0 && (
        <div style={{ padding: '1rem 1.4rem', fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
          Sin batches — pulsa "+ Batch" para añadir.
        </div>
      )}
      {(week.batches ?? []).map(batch => (
        <MealBatchBlock key={batch.id} meal={mealKey} batch={batch} weekId={week.id} />
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function MealEmptyState({ meal, mealKey }) {
  const addMealWeek = useStore(s => s.addMealWeek)
  const EmptyIcon = MEAL_ICONS[mealKey]
  return (
    <div className="mpv-empty">
      <div className="mpv-empty-icon"><EmptyIcon size={40} color={meal.color} /></div>
      <div className="mpv-empty-title">Sin planificar aún</div>
      <div className="mpv-empty-sub">
        Añade la primera semana para empezar a planificar {meal.label.toLowerCase()}.
      </div>
      <button className="btn-primary" onClick={() => addMealWeek(mealKey)}>
        + Añadir primera semana
      </button>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function MealPlannerView() {
  const activeMeal  = useStore(s => s.activeMeal)
  const meal        = MEALS[activeMeal]
  const Icon        = MEAL_ICONS[activeMeal]
  const weeks       = useStore(selectMealPlan(activeMeal))
  const addMealWeek = useStore(s => s.addMealWeek)
  const summary     = streamSummary(weeks)

  if (!meal) return null

  return (
    <div
      className="meal-planner-view"
      style={{ '--meal-color': meal.color, '--meal-bg': meal.colorBg }}
    >
      {/* Header */}
      <div className="mpv-header">
        <span className="mpv-icon"><Icon size={26} color={meal.color} /></span>
        <h2 className="mpv-title">{meal.label}</h2>
        <span className="mpv-target">{meal.kcalTarget[0]}–{meal.kcalTarget[1]} kcal/comida</span>
        {!summary.isEmpty && (
          <div className="mpv-stats-pill">
            <span>{summary.costLabel}<span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--muted)', marginLeft: 2 }}>/plato</span></span>
            <span className="sep">·</span>
            <span className="kc">{summary.kcalLabel}</span>
            <span className="sep">·</span>
            <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{summary.weekCount} sem</span>
          </div>
        )}
      </div>

      {/* Content */}
      {weeks.length === 0 ? (
        <MealEmptyState meal={meal} mealKey={activeMeal} />
      ) : (
        <>
          {/* Week cards */}
          <div className="mpv-weeks">
            {weeks.map(week => (
              <MealWeekCard key={week.id} week={week} mealKey={activeMeal} />
            ))}
          </div>

          {/* Add week button */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
            <button className="btn-ghost" onClick={() => addMealWeek(activeMeal)}>
              + Añadir semana
            </button>
          </div>

          {/* Calendar section */}
          <div className="mpv-cal-section">
            <div className="mpv-cal-label">Vista día a día</div>
            {weeks.map(week => (
              <div key={week.id} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 6 }}>
                  {week.label}
                </div>
                <MealCalendarStrip week={week} mealKey={activeMeal} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
