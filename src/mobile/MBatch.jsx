import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import Icon, { MEAL_ICON } from '../components/ui/Icon'
import { computeBatchMeal, buildSchedule, fmtQty } from '../components/tabs/BatchPrepTab'
import { getISOWeek } from '../utils/date'
import { MEALS, MEAL_LABEL, MEAL_STYLE, PERSON_COLOR, DAY_KEYS, addDays, fmtRange, activeProfilesOn, shortName } from '../lib/mealplan'
import { slotForPerson } from '../engine/calc'
import { MHeader } from './MobileApp'
import CookedButton from '../components/meal/CookedButton'
import BatchVitamins from '../components/meal/BatchVitamins'
import { stockAvailable } from '../lib/needs'
import useBatchNav from '../lib/useBatchNav'
import { cookDateFor, sessionDates, rangeLabel, DAY_LONG_EN } from '../lib/batchConfig'

// Batch en el móvil: cuántos tuppers llevas, un botón grande para cocinar y
// una fila por plato que se despliega (cantidades, ración de cada uno y sus
// tuppers). El modo cocina va paso a paso con temporizadores grandes que
// siguen corriendo aunque cambies de paso, y mantiene la pantalla encendida.

const LET = { lun: 'M', mar: 'T', 'mié': 'W', jue: 'T', vie: 'F', 'sáb': 'S', dom: 'S' }
const DAY3 = { lun: 'Mon', mar: 'Tue', 'mié': 'Wed', jue: 'Thu', vie: 'Fri', 'sáb': 'Sat', dom: 'Sun' }
// «Make X the night before and leave it in the fridge» ×N → one sentence
function visperaLine(list) {
  const fridge = [], rest = []
  list.forEach(v => { const m = /^Make (.+) the night before/.exec(v.text); if (m) fridge.push(m[1]); else rest.push(v.text.replace(/\.$/, '')) })
  return [fridge.length ? `have ready in the fridge: ${fridge.join(', ')}` : null, ...rest].filter(Boolean).join(' · ') + '.'
}
const fmtT = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function useWakeLock(on) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let lock = null, alive = true
    const get = () => navigator.wakeLock.request('screen').then(l => { if (alive) lock = l; else l.release() }).catch(() => {})
    get()
    const again = () => { if (document.visibilityState === 'visible') get() }
    document.addEventListener('visibilitychange', again)
    return () => { alive = false; document.removeEventListener('visibilitychange', again); lock?.release().catch(() => {}) }
  }, [on])
}

function CookMode({ steps, onExit, onTuppers }) {
  const [i, setI] = useState(0)
  const [timers, setTimers] = useState({}) // idx -> { left, running }
  useWakeLock(true)
  useEffect(() => {
    const id = setInterval(() => setTimers(ts => {
      let changed = false
      const next = { ...ts }
      for (const k in next) if (next[k].running) {
        changed = true
        const left = next[k].left - 1
        next[k] = left <= 0 ? { left: 0, running: false, done: true } : { ...next[k], left }
        if (left <= 0 && navigator.vibrate) navigator.vibrate([300, 150, 300])
      }
      return changed ? next : ts
    }), 1000)
    return () => clearInterval(id)
  }, [])

  const st = steps[i]
  const t = timers[i] ?? { left: (st.min ?? 0) * 60, running: false }
  const frac = st.min ? t.left / (st.min * 60) : 0
  const running = Object.entries(timers).filter(([k, v]) => v.running && +k !== i)
  const toggle = () => setTimers(ts => ({ ...ts, [i]: { left: t.left || st.min * 60, running: !t.running } }))
  const last = i === steps.length - 1

  return createPortal(
    <section className="mk" aria-label="Cook mode">
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>Step {i + 1} of {steps.length}</span>
        <button type="button" className="mk-x" aria-label="Exit cook mode" onClick={onExit}><Icon name="x" size={13} stroke={3} /></button>
      </span>
      <span className="mk-segs" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((_, k) => <button key={k} type="button" aria-label={`Step ${k + 1}`} onClick={() => setI(k)}
          style={{ background: k < i ? '#fff' : k === i ? '#F7D98A' : timers[k]?.running ? '#E0A21B' : 'rgba(255,255,255,0.18)' }} />)}
      </span>
      {running.length > 0 && (
        <span className="mk-running">
          {running.map(([k, v]) => <button key={k} type="button" onClick={() => setI(+k)}><Icon name="flame" size={12} />{shortName(steps[k].title)} · {fmtT(v.left)}</button>)}
        </span>
      )}
      <span className="mk-title">{st.title}</span>
      {st.sub && <span className="mk-sub">{st.sub}</span>}
      {st.list && <ul className="mk-list">{st.list.map((x, k) => <li key={k}>{x}</li>)}</ul>}
      {st.split?.length > 0 && <span className="mk-split">{st.split.map(s => `${s.name} ${s.label}`).join(' · ')}</span>}
      {st.min > 0 && (
        <button type="button" className="mk-timer" onClick={toggle} aria-label={t.running ? 'Pause' : 'Start'}
          style={{ background: `conic-gradient(#F7D98A 0 ${frac * 100}%, rgba(255,255,255,0.12) ${frac * 100}% 100%)` }}>
          <span>
            <strong className="mp-num">{fmtT(t.left)}</strong>
            <small><Icon name={t.running ? 'pause' : 'play'} size={11} fill="currentColor" />{t.done ? 'Ready!' : t.running ? 'Pause' : 'Tap to start'}</small>
          </span>
        </button>
      )}
      <span className="mk-nav">
        <button type="button" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>Back</button>
        <button type="button" className="is-main" onClick={() => last ? onTuppers() : setI(i + 1)}>{last ? 'See containers' : 'Next step'}</button>
      </span>
    </section>,
    document.body
  )
}

export default function MBatch({ unseen, onIdeas }) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  const profiles = useStore(s => s.profiles)
  const batchTups = useStore(s => s.batchTups)
  const toggleBatchTup = useStore(s => s.toggleBatchTup)

  const nav = useBatchNav('batch')
  const [open, setOpen] = useState(null)
  const [cooking, setCooking] = useState(false)
  const listRef = useRef(null)

  const monday = nav.ref.monday
  const wk = getISOWeek(addDays(monday, 3))
  const cookDate = cookDateFor(monday, nav.ref.si)
  const batchDays = useMemo(() => sessionDates(monday, nav.ref.si), [+monday, nav.ref.si]) // eslint-disable-line react-hooks/exhaustive-deps
  const daysLabel = rangeLabel(batchDays.map(b => DAY_KEYS.indexOf(b.dayKey)))
  const batchData = useMemo(() => Object.fromEntries(MEALS.map(mt => [mt, computeBatchMeal(mt, batchDays, profiles, allIng, allCombos, weekPlan)])), [batchDays, profiles, allIng, allCombos, weekPlan])
  const schedule = useMemo(() => buildSchedule(MEALS.flatMap(mt => (batchData[mt] || []).map(g => ({ meal: g.meal, batchData: g })))), [batchData])
  const stockRaw = useStore(s => s.stock)
  const stockNow = useMemo(() => stockAvailable(stockRaw, allIng, cookDate), [stockRaw, allIng, +cookDate]) // eslint-disable-line react-hooks/exhaustive-deps
  const batchPeople = useMemo(() => activeProfilesOn(profiles, batchDays[0].date).filter(p => p.id !== 'all'), [profiles, batchDays])
  const tups = new Set(batchTups?.[wk] ?? [])
  const week = weekPlan[wk] ?? {}

  // Primero lo que va en tupper (comida, cena); luego desayunos y meriendas
  const rows = ['comida', 'cena', 'desayuno', 'merienda'].flatMap(mt => (batchData[mt] || []).map(g => {
    const key = g.meal.recipeKey
    const list = []
    batchDays.forEach(({ dayKey, date }) => activeProfilesOn(profiles, date).forEach(person => {
      if (slotForPerson(week[`${dayKey}-${mt}`] ?? null, person.id)?.recipeKey === key) list.push({ id: `${key}-${mt}-${dayKey}-${person.id}`, dayKey, person })
    }))
    const persons = g.personTotals.filter(pt => pt.activeDays > 0)
    return { mt, g, key, list, persons, packs: mt === 'comida' || mt === 'cena', days: [...new Set(list.map(t => t.dayKey))] }
  }))
  const packable = rows.filter(r => r.packs)
  const total = packable.reduce((s, r) => s + r.list.length, 0)
  const done = packable.reduce((s, r) => s + r.list.filter(t => tups.has(t.id)).length, 0)
  const colorOf = p => PERSON_COLOR[Math.max(0, profiles.findIndex(x => x.id === p.id)) % PERSON_COLOR.length]

  const steps = useMemo(() => {
    const out = []
    if (schedule.prepTasks.length) out.push({ title: 'Prep the ingredients', list: schedule.prepTasks.map(t => `${t.name}: ${t.action}${t.qty ? ` (${t.qty})` : ''}`) })
    ;[...schedule.jobs].sort((a, b) => (b.cookMin || 0) - (a.cookMin || 0)).forEach(j => out.push({
      title: j.name, sub: [j.label, j.qtyLabel].filter(Boolean).join(' · '), min: j.cookMin || 0, split: j.split,
      list: (j.ingredients ?? []).length ? j.ingredients.map(x => `${x.name}${x.qty ? `: ${x.qty}` : ''}`) : null,
    }))
    if (schedule.noCook.length) out.push({ title: 'No heat', list: schedule.noCook.map(n => n.text) })
    out.push({ title: 'Split into containers', sub: `${total} lunch and dinner containers, per person and day. Each person's portion is already calculated.` })
    return out
  }, [schedule, total])

  return (
    <div className="m-page">
      <MHeader title={`${DAY_LONG_EN[(cookDate.getDay() + 6) % 7]} ${cookDate.getDate()}`} sub={`batch for ${daysLabel} · ${fmtRange(batchDays[0].date, batchDays[batchDays.length - 1].date)}`} unseen={unseen} onIdeas={onIdeas} />
      <div className="ms-nav">
        <button type="button" aria-label="Previous batch" onClick={nav.prev}><Icon name="left" size={14} stroke={2.6} /></button>
        <button type="button" onClick={nav.reset} disabled={nav.isNext}>Next batch</button>
        <button type="button" aria-label="Following batch" onClick={nav.next}><Icon name="right" size={14} stroke={2.6} /></button>
      </div>

      {rows.length === 0 ? (
        <div className="mp-empty" style={{ padding: '40px 10px' }}>Nothing planned for {daysLabel} that week.</div>
      ) : (
        <>
          <section className="mc-progress">
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="mp-muted" style={{ fontSize: 13 }}><strong className="mp-num" style={{ fontSize: 22, color: 'var(--c-ink)' }}>{done}</strong> / {total} containers</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>{schedule.totalMin ? `≈ ${schedule.totalMin}′ · ` : ''}{rows.length} dishes</span>
            </span>
            <span className="mc-bar"><span style={{ width: `${total ? done / total * 100 : 0}%` }} /></span>
          </section>
          <button type="button" className="mb-cook" onClick={() => setCooking(true)}><Icon name="play" size={14} fill="currentColor" />Start cooking</button>
          <CookedButton monday={monday} si={nav.ref.si} className="mb-cooked" />
          {schedule.vispera.length > 0 && (
            <span className="mb-vispera"><Icon name="moon" size={16} color="#7154DA" style={{ flexShrink: 0, marginTop: 1 }} /><span><strong>Night before:</strong> {visperaLine(schedule.vispera)}</span></span>
          )}
          <BatchVitamins weekKey={wk} weekData={week} batchDays={batchDays} people={batchPeople} allIng={allIng} allCombos={allCombos} stock={stockNow} />
          <section className="mb-list" ref={listRef}>
            {rows.map((r, n) => {
              const id = `${r.mt}-${r.key}`, isOpen = open === id
              const st = MEAL_STYLE[r.mt]
              const k = r.list.filter(t => tups.has(t.id)).length
              const pct = r.list.length ? k / r.list.length * 100 : 0
              return (
                <div key={id} style={{ borderTop: n ? '1px solid rgba(110,80,50,0.08)' : 0 }}>
                  <button type="button" className="mb-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : id)}>
                    <span className="mp-bubble" style={{ width: 38, height: 38, background: st.tint, color: st.color }}><Icon name={MEAL_ICON[r.mt]} size={18} /></span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{shortName(r.g.mealName)}</span>
                      <span className="mp-muted" style={{ fontSize: 12 }}>{MEAL_LABEL[r.mt]} · {r.days.map(d => LET[d]).join(' ')}</span>
                    </span>
                    {r.packs
                      ? <span className="mb-ring" style={{ background: `conic-gradient(var(--c-green) 0 ${pct}%, rgba(110,80,50,0.12) ${pct}% 100%)` }}><span className="mp-num">{k}/{r.list.length}</span></span>
                      : <span className="mp-muted mp-num" style={{ fontSize: 12 }}>{r.list.length} serv.</span>}
                  </button>
                  {isOpen && (
                    <div className="mb-body mp-in">
                      {r.g.sharedItems.length > 0 && <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--c-ink-2)' }}>{r.g.sharedItems.map(it => `${it.name.split(' (')[0]} ${fmtQty(it)}`).join(' · ')}</span>}
                      {r.packs && r.g.hasBase && (
                        <span style={{ fontSize: 12.5, color: 'var(--c-ink-2)' }}>
                          {r.persons.map((pt, j) => <span key={pt.person.id}>{j ? ' · ' : ''}<strong style={{ color: colorOf(pt.person) }}>{pt.person.name}</strong> {Math.round(pt.baseGrams)} g</span>)} of {r.persons[0]?.baseName?.split(' (')[0].toLowerCase()}
                        </span>
                      )}
                      {r.packs && (
                        <span className="mb-tups">
                          {r.list.map(t => {
                            const on = tups.has(t.id)
                            return (
                              <button key={t.id} type="button" aria-pressed={on} className={on ? 'is-on' : ''} onClick={() => toggleBatchTup(wk, t.id)}>
                                <span className="mb-tick"><Icon name="check" size={9} stroke={4} /></span>{DAY3[t.dayKey]} · {t.person.name}
                              </button>
                            )
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        </>
      )}

      {cooking && <CookMode steps={steps} onExit={() => setCooking(false)}
        onTuppers={() => { setCooking(false); setOpen(rows.find(r => r.packs) ? `${rows.find(r => r.packs).mt}-${rows.find(r => r.packs).key}` : null) }} />}
    </div>
  )
}
