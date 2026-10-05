import { useMemo, useState } from 'react'
import useStore from '../../store/useStore'
import { batchSummary, suggestChanges } from '../../engine/microPlan'
import { makeByPersonSlot } from '../../engine/calc'
import { MEAL_LABEL, MEAL_STYLE, fmtMoney } from '../../lib/mealplan'
import { rangeLabel } from '../../lib/batchConfig'
import Segmented from '../ui/Segmented'
import Icon, { MEAL_ICON } from '../ui/Icon'

// Vitaminas del batch: cuánto de lo que necesita cada persona cubre el día de
// media (y día a día), y cambios sugeridos que se aceptan o se rechazan. Todo
// con el motor del plan (engine/microPlan.js): el efecto de cada cambio incluye
// el reescalado de la base, así que kcal y coste son los reales.

const ALL_DAY_KEYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
const LEVEL_C = { green: '#2F9E5B', yellow: '#B7791F', red: '#D64545' }
const level = r => r >= 0.9 ? 'green' : r >= 0.6 ? 'yellow' : 'red'
const pct = r => `${Math.round(Math.min(r, 9.99) * 100)}%`

const OPEN_KEY = 'bv-open', REJ_KEY = 'bv-rejected'
const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch { return d } }
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sin almacenamiento */ } }

const shortAdd = text => text.replace(/^Add /, '+').replace(/^More /, '+')

export default function BatchVitamins({ weekKey, weekData, batchDays, people, allIng, allCombos, stock }) {
  const setMealSlots = useStore(s => s.setMealSlots)
  const addCustomCombos = useStore(s => s.addCustomCombos)
  const allProfiles = useStore(s => s.profiles)
  const [open, setOpen] = useState(() => read(OPEN_KEY, true))
  const [personId, setPersonId] = useState(null)
  const [rejected, setRejected] = useState(() => new Set(read(REJ_KEY, [])))

  const days = useMemo(() => batchDays.map(b => ({ dayKey: b.dayKey, dayIdx: ALL_DAY_KEYS.indexOf(b.dayKey) })), [batchDays])
  const summaries = useMemo(() => people.map(person => ({ person, summary: batchSummary({ weekData, person, days, allIng, allCombos }) })), [people, weekData, days, allIng, allCombos])
  const rejKey = id => `${weekKey}|${id}`
  const rejectedHere = useMemo(() => new Set([...rejected].filter(x => x.startsWith(weekKey + '|')).map(x => x.slice(weekKey.length + 1))), [rejected, weekKey])
  const suggestions = useMemo(() => open ? suggestChanges({ weekData, people: summaries, days, allIng, allCombos, stock, rejected: rejectedHere }) : [], [open, weekData, summaries, days, allIng, allCombos, stock, rejectedHere])

  const cur = summaries.find(s => s.person.id === personId) ?? summaries[0]
  if (!cur || !cur.summary.plannedDays) return null
  const { person, summary } = cur
  const toggle = () => setOpen(o => { write(OPEN_KEY, !o); return !o })
  const daysLabel = rangeLabel(days.map(d => d.dayIdx))
  const lows = summary.rows.filter(r => r.avg < 0.9).length

  function reject(s) { const next = new Set(rejected); next.add(rejKey(s.id)); setRejected(next); write(REJ_KEY, [...next]) }
  function accept(s) {
    const combo = allCombos[s.recipeKey]
    const [id] = addCustomCombos([{
      name: `${combo.name} ${shortAdd(s.text)}`, meals: combo.meals ?? [s.mealType], items: s.items,
      // la copia sigue escalando la misma base por persona que el original
      ...(combo.scalable ? { scalable: combo.scalable } : {}), ...(combo.scalableMax != null ? { scalableMax: combo.scalableMax } : {}), ...(combo.noAove ? { noAove: true } : {}), ...(combo.optionalItems ? { optionalItems: combo.optionalItems } : {}),
    }])
    const key = 'custom-' + id
    const who = new Set(s.benefit.map(b => b.person.id))
    const slots = {}
    for (const dk of s.dayKeys) {
      const sk = `${dk}-${s.mealType}`
      const existing = weekData?.[sk] ?? null
      const map = existing?.byPerson ? { ...existing.byPerson } : Object.fromEntries(allProfiles.map(p => [p.id, existing]))
      for (const pid of who) if (map[pid]) map[pid] = { type: 'desayuno', recipeKey: key }
      slots[sk] = makeByPersonSlot(map)
    }
    setMealSlots(weekKey, slots)
  }

  return (
    <section className="mp-glass mp-card bv-card mp-rise">
      <div className="bv-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="mp-eyebrow">Vitamins &amp; minerals · {daysLabel}</span>
          <span className="mp-muted" style={{ fontSize: 12.5 }}>
            {lows === 0 ? `${person.name} covers everything on average.` : `${person.name} is short on ${lows} nutrient${lows > 1 ? 's' : ''} on average.`}
          </span>
        </div>
        <button type="button" className="pm-toggle" aria-expanded={open} onClick={toggle}>
          {open ? 'Hide' : 'Show'}<Icon name="right" size={12} stroke={2.6} style={{ transform: `rotate(${open ? 90 : 0}deg)`, transition: 'transform .25s var(--c-ease)' }} />
        </button>
      </div>

      {open && (
        <div className="bv-body">
          {summaries.length > 1 && <Segmented label="Person" value={person.id} onChange={setPersonId} options={summaries.map(s => ({ value: s.person.id, label: s.person.name }))} />}

          <div className="bv-grid">
            {[...summary.rows].sort((a, b) => a.avg - b.avg).map(r => (
              <div key={r.key} className="bv-row" title={`${r.label}: ${pct(r.avg)} of the daily need on average`}>
                <span className="bv-name">{r.label}</span>
                <span className="bv-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, r.avg * 100)}%`, background: LEVEL_C[level(r.avg)] }} /></span>
                <span className="bv-pct mp-num" style={{ color: LEVEL_C[level(r.avg)] }}>{pct(r.avg)}</span>
                <span className="bv-days" aria-label="By day">
                  {r.byDay.map((v, i) => <span key={i} className="bv-dot" title={`${days[i].dayKey}: ${v == null ? '—' : pct(v)}`} style={{ background: v == null ? 'rgba(110,80,50,0.12)' : LEVEL_C[level(v)] }} />)}
                </span>
              </div>
            ))}
          </div>

          <div className="bv-sugs">
            <span className="mp-eyebrow">Suggested changes</span>
            {suggestions.length === 0 && <span className="mp-muted" style={{ fontSize: 12.5 }}>{lows === 0 ? 'Nothing to improve.' : 'Nothing in your pantry that helps enough without changing calories or breaking your rules.'}</span>}
            {suggestions.map(s => (
              <div key={s.id} className="bv-sug mp-in">
                <span className="mp-bubble" style={{ width: 26, height: 26, background: MEAL_STYLE[s.mealType].tint, color: MEAL_STYLE[s.mealType].color }}><Icon name={MEAL_ICON[s.mealType]} size={13} stroke={2.4} /></span>
                <div className="bv-sug-main">
                  <strong>{s.text}</strong>
                  <span className="mp-muted bv-sug-sub">{MEAL_LABEL[s.mealType]} {rangeLabel(s.dayKeys.map(d => ALL_DAY_KEYS.indexOf(d)))} · {s.comboName.split(' + ')[0].split(' (')[0]}</span>
                  {s.benefit.map(b => (
                    <span key={b.person.id} className="bv-eff">
                      <b>{b.person.name}</b> {b.effects.map(e => `${e.label} ${Math.round(Math.min(e.before, 9.99) * 100)}→${Math.round(Math.min(e.after, 1) * 100)}%`).join(' · ')}
                      <span className="mp-muted"> · {b.dCost >= 0 ? '+' : '−'}{fmtMoney(Math.abs(b.dCost))}/day · {b.dKcal >= 0 ? '+' : '−'}{Math.abs(Math.round(b.dKcal))} kcal</span>
                    </span>
                  ))}
                </div>
                <div className="bv-sug-btns">
                  <button type="button" className="mp-btn mp-btn-dark mp-btn-sm" onClick={() => accept(s)}><Icon name="check" size={13} stroke={2.6} />Accept</button>
                  <button type="button" className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => reject(s)} aria-label={`Reject: ${s.text}`}><Icon name="x" size={11} stroke={3} />No</button>
                </div>
              </div>
            ))}
          </div>
          {rejectedHere.size > 0 && <button type="button" className="ig-manage" style={{ alignSelf: 'flex-start' }} onClick={() => { const next = new Set([...rejected].filter(x => !x.startsWith(weekKey + '|'))); setRejected(next); write(REJ_KEY, [...next]) }}>Show the {rejectedHere.size} rejected again</button>}
        </div>
      )}
    </section>
  )
}
