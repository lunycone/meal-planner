import { useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { MODEL_WEEKS } from '../../data/modelWeeks'
import Overlay from '../ui/Overlay'
import Icon, { MEAL_ICON } from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { buildModelWeekSlots } from '../../lib/planActions'
import { addDays, mondayOf, weekKeyOf, fmtRange, fmtMoney, fmtShortDate, activeProfilesOn, weekStats, MEAL_STYLE, PERSON_COLOR, MEALS as MEALS_ALL, DAY_KEYS, dayForPerson, dayTotals } from '../../lib/mealplan'
import useSmartWeeks from '../../lib/useSmartWeeks'
import { COUNTRIES, COUNTRY_LABEL, missingFor } from '../../engine/cuisines'
import { dishPairs } from '../../engine/pairing'
import { batchSessions, coveredDays, cookDateFor, rangeLabel } from '../../lib/batchConfig'
import { stockAvailable } from '../../lib/needs'
import { VEG_DAILY_MIN, SOLUBLE_FIBER_DAILY_MIN } from '../../engine/weekRules'

// Titles shout in CAPS ('WEIGHT GAIN — …'): calm them down, keep acronyms.
const pretty = t => { const s = t.replace(/\b[A-Z]{3,}\b/g, w => w === 'PCOS' ? w : w.toLowerCase()); return s.charAt(0).toUpperCase() + s.slice(1) }

const SOURCE_OPTS = [{ value: 'dishes', label: 'Dishes' }, { value: 'ingredients', label: 'Ingredients' }, { value: 'surprise', label: 'Surprise' }, { value: 'country', label: 'Countries' }]
const COUNTRY_OPTS = [{ value: 'all', label: '🌍 All' }, ...COUNTRIES.map(c => ({ value: c.id, label: `${c.flag} ${c.label}` }))]
const randomSeed = () => 1 + Math.floor(Math.random() * 1e9)
const PRIORITY_OPTS = [{ value: 'price', label: 'Cheapest' }, { value: 'protein', label: 'More protein' }, { value: 'veg', label: 'More veg' }]
const planKeys = plan => [plan.L, plan.D, ...Object.values(plan.B), ...Object.values(plan.S)]
// Todas las claves de una opción (con varios días de batch, de cada sesión).
const allKeys = r => (r.parts ?? [r]).flatMap(p => planKeys(p.plan))
const mainKeys = r => (r.parts ?? [r]).flatMap(p => [p.plan.L, p.plan.D])
const PRIORITY_BEST = { price: 'Best price', protein: 'Most protein', veg: 'Most veg' }
const VEG_OPTS = [100, 150, 200].map(v => ({ value: v, label: `${v} g veg/day` }))

// Semanas modelo, en tres pestañas:
//  · Smart: la app genera la semana con los precios de hoy (engine/smartWeek)
//    y enseña las 3 mejores, con su coste y por qué.
//  · Saved: las tuyas (guardadas con «Save week») y las de fábrica. Se cargan,
//    se renombran, se editan en el Planificador o se archivan.
//  · Archive: lo archivado se restaura o se borra para siempre.
export default function ModelWeekSheet({ initialTarget = 1, initialTab = 'smart', onClose, onLoaded }) {
  const allIng      = useStore(selectAllIng)
  const allCombos   = useStore(selectAllCombos)
  const profiles    = useStore(s => s.profiles)
  const weekPlan    = useStore(s => s.weekPlan)
  const replaceWeek = useStore(s => s.replaceWeek)
  const customWeeks = useStore(s => s.customWeeks) ?? []
  const hidden      = useStore(s => s.hiddenModelWeeks) ?? []
  const deleted     = useStore(s => s.deletedModelWeeks) ?? []
  const names       = useStore(s => s.modelWeekNames) ?? {}
  const renameWeek  = useStore(s => s.renameWeek)
  const archiveWeek = useStore(s => s.archiveWeek)
  const unarchiveWeek = useStore(s => s.unarchiveWeek)
  const deleteWeekForever = useStore(s => s.deleteWeekForever)
  const saveCustomWeek = useStore(s => s.saveCustomWeek)
  const setEditingWeek = useStore(s => s.setEditingWeek)

  const [tab, setTab] = useState(initialTab)
  const [target, setTarget] = useState(initialTarget) // 0 = esta semana, 1 = próximo batch
  const [sel, setSel] = useState(null)                // 'c:<id>' | 'm:<n>'
  const [renaming, setRenaming] = useState(null)      // { key, value }
  const [confirmDel, setConfirmDel] = useState(null)
  const [priority, setPriority] = useState('price')
  const [vegMin, setVegMin] = useState(VEG_DAILY_MIN)
  const [seed, setSeed] = useState(0)
  const [shown, setShown] = useState([])       // parejas 'L|D' ya enseñadas (New ideas)
  const [exclude, setExclude] = useState([])   // rechazados en esta sesión
  const [locks, setLocks] = useState(null)     // { slot, label, locks } al cambiar un solo plato
  const [pick, setPick] = useState(0)
  const [savedAs, setSavedAs] = useState(null)

  const monday = addDays(mondayOf(new Date()), target * 7)
  const wk = weekKeyOf(monday)
  const people = activeProfilesOn(profiles, addDays(monday, 2))
  const existing = Object.keys(weekPlan[wk] ?? {}).filter(k => weekPlan[wk][k]).length
  const peopleKey = people.map(p => p.id).join()

  // ── Smart ──
  const dishPrefs = useStore(s => s.dishPrefs) ?? {}
  const rateDishes = useStore(s => s.rateDishes)
  const addGeneratedCombos = useStore(s => s.addGeneratedCombos)
  const [source, setSource] = useState('dishes') // 'dishes' | 'ingredients' | 'surprise' | 'country'
  const [country, setCountry] = useState('es')
  const resetDishPrefs = useStore(s => s.resetDishPrefs)
  const pairPrefs = useStore(s => s.pairPrefs) ?? {}
  const ratePairs = useStore(s => s.ratePairs)
  // Platos compuestos de una opción: lo que les gusta o no se aprende por parejas.
  const ratePlanPairs = (r, keys, delta) => keys.forEach(k => { const c = r?.newDishes?.[k]; if (c) ratePairs(dishPairs(c, allIng), delta) })
  const rejected = Object.values(dishPrefs).filter(v => v < 0).length
  // Días de batch (Ajustes): cada sesión se genera con sus días.
  const batchSettingsV = useStore(s => s.batchSettings)
  const sessions = useMemo(() => batchSessions(), [batchSettingsV])
  const covered = useMemo(() => coveredDays(), [batchSettingsV])
  // Batch de las 2 semanas anteriores a la de destino: no se repite.
  const recent = useMemo(() => {
    const out = new Set()
    for (const back of [1, 2]) {
      const w = weekPlan[weekKeyOf(addDays(monday, -7 * back))] ?? {}
      for (const dk of covered.map(i => DAY_KEYS[i])) for (const m of ['comida', 'cena']) {
        const v = w[`${dk}-${m}`]; const k = v?.byPerson ? Object.values(v.byPerson).find(Boolean)?.recipeKey : v?.recipeKey
        if (k) out.add(k)
      }
    }
    return [...out].sort()
  }, [weekPlan, wk, covered]) // eslint-disable-line react-hooks/exhaustive-deps
  // Despensa el domingo del batch (lo caducado no cuenta), redondeada para
  // que un gramo de más no relance el cálculo.
  const stockRaw = useStore(s => s.stock)
  const stock = useMemo(() => {
    const a = stockAvailable(stockRaw, allIng, cookDateFor(monday, 0))
    return Object.fromEntries(Object.entries(a).map(([k, v]) => [k, Math.round(v)]).sort())
  }, [stockRaw, allIng, wk]) // eslint-disable-line react-hooks/exhaustive-deps
  const smart = useSmartWeeks({ allIng, allCombos, people, priority, vegMin, seed, shown, exclude, prefs: dishPrefs, recent, stock, source, country: country === 'all' ? null : country, pairPrefs, sessions: sessions.map(x => x.days), locks: locks?.locks ?? {} }, tab === 'smart')
  const smartSel = smart.results[Math.min(pick, smart.results.length - 1)] ?? null
  // Lo ya planificado en la semana destino (solo los días de batch), para comparar.
  const planned = useMemo(() => {
    const w = weekPlan[wk]
    if (!w || !covered.some(i => MEALS_ALL.some(m => w[`${DAY_KEYS[i]}-${m}`]))) return null
    return people.reduce((sum, p) => sum + covered.reduce((t, i) => t + dayTotals(dayForPerson(w, DAY_KEYS[i], p.id), p, i, allIng, allCombos).cost, 0), 0)
  }, [wk, weekPlan, peopleKey, allIng, allCombos, covered]) // eslint-disable-line react-hooks/exhaustive-deps

  // «New ideas»: 3 semanas nuevas, sin repetir ninguna pareja ya enseñada.
  function newIdeas() {
    setShown(sh => [...new Set([...sh, ...smart.results.flatMap(r => (r.parts ?? [r]).map(p => `${p.plan.L}|${p.plan.D}`))])])
    setSeed(s => (source === 'surprise' ? randomSeed() : s + 1)); setPick(0); setSavedAs(null); setLocks(null)
  }
  // «Not this one»: se queda el resto de la semana y busca otro plato para
  // ese hueco; el rechazado pesa menos a partir de ahora.
  function reject(r, slot, pid = null, pi = 0) {
    const parts = r.parts ?? [r]
    const plan = parts[pi].plan
    const key = slot === 'L' ? plan.L : slot === 'D' ? plan.D : plan[slot][pid]
    rateDishes([key], -1)
    ratePlanPairs(r, [key], -1)
    setExclude(x => [...new Set([...x, key])])
    // Se queda todo lo demás (las otras sesiones enteras) y se busca otro para ese hueco.
    const full = p => ({ L: p.L, D: p.D, B: { ...p.B }, S: { ...p.S } })
    const keep = full(plan)
    if (slot === 'L' || slot === 'D') delete keep[slot]
    else delete keep[slot][pid]
    const partsLocks = parts.map((p, j) => (j === pi ? keep : full(p.plan)))
    const who = pid ? people.find(p => p.id === pid)?.name : null
    const what = { L: 'lunch', D: 'dinner', B: `${who}'s breakfast`, S: `${who}'s snack` }[slot]
    const label = parts.length > 1 ? `${what} (${sessions[pi]?.label ?? ''} batch)` : what
    setLocks({ slot, label, locks: { parts: partsLocks } }); setPick(0); setSavedAs(null)
  }
  function changeOpt(fn) { return v => { fn(v); setPick(0); setSeed(0); setShown([]); setLocks(null); setSavedAs(null) } }
  // «Surprise»: cada vez una semilla nueva al azar.
  const pickSource = v => { changeOpt(setSource)(v); if (v === 'surprise') setSeed(randomSeed()) }
  function saveSmart() {
    if (!smartSel) return
    addGeneratedCombos(smartSel.newDishes)
    const name = `Smart · ${PRIORITY_OPTS.find(o => o.value === priority).label.toLowerCase()} · ${fmtShortDate(new Date())}`
    saveCustomWeek({ name, slots: JSON.parse(JSON.stringify(smartSel.slots)) })
    rateDishes(allKeys(smartSel), 1)
    ratePlanPairs(smartSel, mainKeys(smartSel), 0.5)
    setSavedAs(name)
  }
  function loadSmart() {
    if (!smartSel) return
    addGeneratedCombos(smartSel.newDishes)
    replaceWeek(wk, JSON.parse(JSON.stringify(smartSel.slots)))
    if (!savedAs) { rateDishes(allKeys(smartSel), 1); ratePlanPairs(smartSel, mainKeys(smartSel), 0.5) }
    setEditingWeek(null)
    onLoaded?.(target)
    onClose()
  }

  // ── Saved / Archive ──
  const modelSlots = useMemo(() => Object.fromEntries(MODEL_WEEKS.map(w => [w.n, buildModelWeekSlots(w.n)])), [])
  const allRows = useMemo(() => {
    const mine = [...customWeeks]
      .sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''))
      .map(w => ({ key: `c:${w.id}`, kind: 'custom', id: w.id, name: w.name, slots: w.slots, archived: !!w.archived }))
    const factory = MODEL_WEEKS.filter(w => !deleted.includes(w.n))
      .map(w => ({ key: `m:${w.n}`, kind: 'model', id: w.n, num: w.n, name: names[w.n] ?? pretty(w.title), slots: modelSlots[w.n], note: w.note, extrema: !!w.extrema, archived: hidden.includes(w.n) }))
    return [...mine, ...factory]
  }, [customWeeks, hidden, deleted, names, modelSlots])
  const statsOf = useMemo(() => {
    const cache = {}
    return r => (cache[r.key] ??= weekStats(r.slots, people, allIng, allCombos))
  }, [allRows, peopleKey, allIng, allCombos]) // eslint-disable-line react-hooks/exhaustive-deps
  const rows = allRows.filter(r => !r.archived)
  const archivedRows = allRows.filter(r => r.archived)
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
    const row = allRows.find(r => r.key === renaming.key)
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
  const tabOptions = [
    { value: 'smart', label: 'Smart' },
    { value: 'saved', label: `Saved · ${rows.length}` },
    { value: 'archive', label: `Archive${archivedRows.length ? ` · ${archivedRows.length}` : ''}` },
  ]
  const subtitle = tab === 'smart' ? "Built from today's prices, following your rules."
    : tab === 'saved' ? 'Fills all 28 meals at once, with portions already adjusted.'
    : 'Archived weeks stay here until you restore them or delete them for good.'

  return (
    <Overlay onClose={onClose}>
      <div className="mp-sheet mw-sheet" style={{ maxWidth: 880, height: 'min(820px, calc(100dvh - 48px))' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Model weeks">
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mp-bubble" style={{ width: 42, height: 42, background: 'rgba(139,111,232,0.15)', color: '#7154DA' }}><Icon name={tab === 'smart' ? 'sparkle' : tab === 'archive' ? 'archive' : 'layers'} size={20} /></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Model weeks</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>{subtitle}</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32 }} aria-label="Close" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div className="mw-bar">
          <Segmented label="Section" value={tab} onChange={v => { setTab(v); setConfirmDel(null); setRenaming(null) }} options={tabOptions} />
          {tab !== 'archive' && <Segmented label="Target week" value={target} onChange={setTarget} options={targetOptions} />}
        </div>
        {tab !== 'archive' && existing > 0 && (
          <div style={{ padding: '0 24px 10px' }}>
            <span className="mp-chip" style={{ color: '#B7791F' }}><Icon name="warn" size={13} />Loading replaces the {existing} meals already planned that week</span>
          </div>
        )}

        {tab === 'smart' && (
          <>
            <div className="sw-controls">
              <Segmented label="Build from" value={source} onChange={pickSource} options={SOURCE_OPTS} />
              {(source === 'dishes' || source === 'ingredients') && <Segmented label="Priority" value={priority} onChange={changeOpt(setPriority)} options={PRIORITY_OPTS} />}
              <Segmented label="Vegetables per day" value={vegMin} onChange={changeOpt(setVegMin)} options={VEG_OPTS} />
              <button type="button" className="mp-btn mp-btn-dark mp-btn-sm sw-new" onClick={newIdeas} disabled={smart.busy}><Icon name={source === 'surprise' ? 'shuffle' : 'repeat'} size={14} />{source === 'surprise' ? 'Surprise me again' : 'New ideas'}</button>
              {source === 'country' && (
                <div className="sw-countries" role="group" aria-label="Country">
                  {COUNTRY_OPTS.map(o => (
                    <button key={o.value} type="button" className={`sw-country${country === o.value ? ' is-on' : ''}`} aria-pressed={country === o.value} onClick={() => changeOpt(setCountry)(o.value)}>{o.label}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 2 }}>
              {source === 'surprise' && !locks && (
                <span className="sw-srcnote mp-in"><Icon name="shuffle" size={13} />A random week of lunches and dinners built from your ingredients — new combinations and recipes from around the world. No priority to choose; the rules still apply.</span>
              )}
              {source === 'country' && !locks && (
                <span className="sw-srcnote mp-in"><Icon name="plate" size={13} /><span>
                  Dishes composed with {country === 'all' ? 'the flavors of each country' : `${COUNTRIES.find(c => c.id === country)?.label}’s flavors`}: a protein, a base, vegetables and seasonings that fit, all from your ingredients at today’s prices.
                  {country !== 'all' && missingFor(allIng, country).length > 0 && <> Add <strong>{missingFor(allIng, country).join(', ')}</strong> in Ingredients for more {COUNTRIES.find(c => c.id === country)?.label} ideas.</>}
                </span></span>
              )}
              {source === 'ingredients' && !locks && (
                <span className="sw-srcnote mp-in"><Icon name="leaf" size={13} />New lunches and dinners made from your ingredients — a protein, a base and two vegetables — using the pantry first and whole packs. Loading or saving a week adds its new dishes to Dishes.</span>
              )}
              {locks && (
                <div className="sw-lockbar mp-in">
                  <span>Other options for <strong>{locks.label}</strong>, keeping the rest of the week.</span>
                  <button type="button" className="ig-manage" onClick={() => { setLocks(null); setPick(0) }}>Back to full weeks</button>
                </div>
              )}
              {smart.busy && !smart.results.length && <SmartSkeleton />}
              {smart.error && <div className="mp-empty">Couldn't build a week: {smart.error}</div>}
              {!smart.busy && !smart.error && !smart.results.length && <div className="mp-empty" style={{ padding: 40 }}>{source === 'ingredients' ? 'Not enough tagged ingredients to compose dishes. Tag proteins, bases and vegetables in Ingredients.' : 'Not enough dishes to build a week. Add lunches and dinners in Dishes.'}</div>}
              {smart.results.map((r, i) => (
                <SmartCard key={allKeys(r).join() + i} r={r} i={i} on={i === pick} busy={smart.busy} onReject={(slot, pid, pi) => reject(r, slot, pid, pi)} sessions={sessions} covered={covered}
                  best={source === 'surprise' ? 'Surprise' : source === 'country' ? (country === 'all' ? 'World week' : COUNTRY_LABEL[country]) : PRIORITY_BEST[priority]} people={people} allCombos={r.newDishes ? { ...allCombos, ...r.newDishes } : allCombos} vegMin={vegMin}
                  planned={planned} onPick={() => setPick(i)} />
              ))}
            </div>
            <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
              <span className="mp-muted" style={{ fontSize: 12.5, lineHeight: 1.4, maxWidth: 380 }}>
                {savedAs ? <span style={{ color: 'var(--c-green)', fontWeight: 600 }}>Saved as “{savedAs}”</span>
                  : smart.busy ? 'Trying combinations with today’s prices…'
                  : smart.tried ? `${smart.composed ? `Composed ${smart.composed} dishes · ` : ''}Tried ${smart.tried.toLocaleString('en-US')} combinations with today’s prices.` : ''}
                {rejected > 0 && !savedAs && <> · {rejected} dish{rejected > 1 ? 'es' : ''} you said no to <button type="button" className="ig-manage" onClick={() => resetDishPrefs(true)}>Reset</button></>}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="mp-btn mp-btn-glass" disabled={!smartSel || !!savedAs} onClick={saveSmart}><Icon name="sparkle" size={14} />Save</button>
                <button className="mp-btn mp-btn-dark" disabled={!smartSel || smart.busy} onClick={loadSmart}>Load into {target === 0 ? 'this week' : target === 1 ? 'next batch' : 'that week'}</button>
              </div>
            </div>
          </>
        )}

        {tab === 'saved' && (
          <>
            <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 0 }}>
              {rows.length === 0 && <div className="mp-empty" style={{ padding: 40 }}>No saved weeks. Build one in Smart or save a week from the Planner.</div>}
              {rows.map((r, idx) => {
                const on = sel === r.key
                const header = idx === 0 && mineCount ? 'Your weeks' : idx === mineCount ? 'Built-in' : null
                const isRen = renaming?.key === r.key
                const st = statsOf(r)
                return (
                  <div key={r.key}>
                    {header && <div className="mp-eyebrow" style={{ padding: idx ? '14px 2px 6px' : '2px 2px 6px' }}>{header}</div>}
                    <div className={`mw-row${on ? ' is-on' : ''}`}>
                      {!isRen && <button type="button" className="mw-hit" aria-pressed={on} aria-label={`Choose ${r.name}`}
                        onClick={() => setSel(r.key)} onDoubleClick={() => load(r)} />}
                      <WeekBadge r={r} on={on} />
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                        {isRen ? (
                          <input className="mw-rename" autoFocus value={renaming.value} aria-label="New name"
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
                          {st.comida.length ? `Lunches: ${st.comida.join(' · ')}` : 'No lunches'}{st.planned < 28 ? ` · ${st.planned}/28` : ''}
                        </span>
                        <span style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--c-ink-2)' }} className="mp-num">
                          {st.perPerson.map(x => <span key={x.p.id}>{x.p.name} {x.kcal} / {x.target} kcal</span>)}
                        </span>
                      </span>
                      <span className="mw-side">
                        <span className="mw-actions">
                          <button type="button" className="mw-act" title="Rename" aria-label={`Rename ${r.name}`} onClick={() => setRenaming({ key: r.key, value: r.name })}><Icon name="edit" size={13} /></button>
                          <button type="button" className="mw-act" title="Edit its dishes in the Planner" aria-label={`Edit ${r.name}`} onClick={() => load(r, true)}><Icon name="cal" size={13} /></button>
                          <button type="button" className="mw-act" title="Archive" aria-label={`Archive ${r.name}`} onClick={() => { archiveWeek(r.kind, r.id); if (sel === r.key) setSel(null) }}><Icon name="archive" size={13} /></button>
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                          <span className="mp-num" style={{ fontSize: 17, fontWeight: 650 }}>{fmtMoney(st.cost)}</span>
                          <span className="mp-muted mp-num" style={{ fontSize: 11.5 }}>{st.hit}/{st.n} days ±5%</span>
                        </span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
              <span className="mp-muted" style={{ fontSize: 12.5, maxWidth: 440, lineHeight: 1.4 }}>
                {selRow?.note ? (selRow.note.split('.')[0] + '.') : selRow ? 'Double-click a week to load it directly.' : `Whole-week cost for ${people.map(p => p.name).join(' and ')}, at today’s prices.`}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="mp-btn mp-btn-glass" onClick={onClose}>Cancel</button>
                <button className="mp-btn mp-btn-dark" disabled={!selRow} onClick={() => load()}>{selRow ? `Load “${selRow.name.length > 28 ? selRow.name.slice(0, 26) + '…' : selRow.name}”` : 'Load week'}</button>
              </div>
            </div>
          </>
        )}

        {tab === 'archive' && (
          <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 0 }}>
            {archivedRows.length === 0 && (
              <div className="mp-empty" style={{ padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span className="mp-bubble" style={{ width: 40, height: 40, background: 'rgba(31,27,22,0.06)', color: 'var(--c-ink-3)' }}><Icon name="archive" size={18} /></span>
                Nothing archived. Archive the weeks you don’t use to keep Saved short.
              </div>
            )}
            {archivedRows.map(r => {
              const st = statsOf(r)
              const asking = confirmDel === r.key
              return (
                <div key={r.key} className="mw-row is-archived">
                  <WeekBadge r={r} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 650, lineHeight: 1.3 }}>{r.name}</span>
                    <span className="mp-muted mp-num" style={{ fontSize: 12.5 }}>{fmtMoney(st.cost)} · {st.comida.slice(0, 2).join(' · ') || 'No lunches'}</span>
                  </span>
                  {asking ? (
                    <span className="mw-confirm">
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>Delete for good?</span>
                      <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setConfirmDel(null)}>No</button>
                      <button className="mp-btn mp-btn-danger mp-btn-sm" onClick={() => { deleteWeekForever(r.kind, r.id); setConfirmDel(null) }}>Delete</button>
                    </span>
                  ) : (
                    <span className="mw-side" style={{ gap: 6 }}>
                      <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => unarchiveWeek(r.kind, r.id)}><Icon name="repeat" size={13} />Restore</button>
                      <button className="mp-btn mp-btn-sm pl-del" onClick={() => setConfirmDel(r.key)}><Icon name="trash" size={13} />Delete</button>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Overlay>
  )
}

function WeekBadge({ r, on = false }) {
  return (
    <span className="mp-bubble mp-num mw-num" style={{ background: on ? 'var(--c-ink)' : r.kind === 'custom' ? 'rgba(139,111,232,0.15)' : 'rgba(31,27,22,0.07)', color: on ? '#fff' : r.kind === 'custom' ? '#5B3FC4' : 'var(--c-ink)' }}>
      {r.kind === 'custom' ? <Icon name="sparkle" size={15} stroke={2.2} /> : r.num}
    </span>
  )
}

function SmartSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Building weeks">
      {[0, 1, 2].map(i => <div key={i} className="sw-card sw-skel" style={{ animationDelay: `${i * 120}ms` }} />)}
    </div>
  )
}

function SmartCard({ r, i, on, busy, best, people, allCombos, vegMin, planned, onPick, onReject, sessions, covered }) {
  const name = k => allCombos[k]?.name ?? k
  const ok = r.warnings.length === 0
  const colorOf = p => PERSON_COLOR[Math.max(0, people.findIndex(x => x.id === p.id)) % PERSON_COLOR.length]
  // Comparación con lo ya planificado, solo lunes–viernes de ambos lados.
  const saving = planned != null ? planned - r.cost : null
  const parts = r.parts ?? [r]
  const multi = parts.length > 1
  const free = [0, 1, 2, 3, 4, 5, 6].filter(x => !covered.includes(x))
  const No = ({ slot, pid, what, pi = 0 }) => on ? (
    <button type="button" className="sw-no" title={`Not this one — find another ${what}`} aria-label={`Not this ${what}`} onClick={() => onReject(slot, pid, pi)}>
      <Icon name="x" size={9} stroke={3} />Not this one
    </button>
  ) : null
  const Dish = ({ m, k, slot, pi }) => (
    <span className="sw-dish">
      <span className="mp-bubble" style={{ width: 24, height: 24, background: MEAL_STYLE[m].tint, color: MEAL_STYLE[m].color }}><Icon name={MEAL_ICON[m]} size={12} stroke={2.4} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>{name(k)}{allCombos[k]?.generated && <span className="mp-tag sw-newdish">{allCombos[k].country ? `${COUNTRIES.find(c => c.id === allCombos[k].country)?.flag ?? ''} ` : ''}new</span>}</span>
      <No slot={slot} pi={pi} what={m === 'comida' ? 'lunch' : 'dinner'} />
    </span>
  )
  return (
    <div className={`sw-card mp-in${on ? ' is-on' : ''}${busy ? ' is-busy' : ''}`} style={{ animationDelay: `${i * 70}ms` }}>
      <button type="button" className="sw-hit" aria-pressed={on} aria-label={`Option ${i + 1}: ${fmtMoney(r.cost)} for ${rangeLabel(covered)}`} onClick={onPick} />
      <div className="sw-top">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="sw-radio" aria-hidden="true" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{i === 0 ? best : `Option ${i + 1}`}</span>
          <span className={`mp-tag ${ok ? 'sw-ok' : 'sw-warn'}`}>{ok ? '✓ All rules met' : `${r.warnings.length} note${r.warnings.length > 1 ? 's' : ''}`}</span>
          {r.packs?.pantry >= 0.5 && <span className="mp-tag sw-pantry" title="Already paid for: it’s in the pantry"><Icon name="home" size={11} />{fmtMoney(r.packs.pantry)} from the pantry</span>}
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="mp-num" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{fmtMoney(r.cost)}<small className="mp-muted" style={{ fontSize: 12, fontWeight: 500 }}> {rangeLabel(covered)}</small></span>
          <span className="mp-muted mp-num" style={{ fontSize: 11.5 }} title={free.length ? 'If the free days were eaten the same way' : 'The whole week'}>
            {free.length ? `≈ ${fmtMoney(r.weekCost)}/week` : 'whole week'}{saving != null && Math.abs(saving) >= 1 ? ` · ${saving > 0 ? `${fmtMoney(saving)} less` : `${fmtMoney(-saving)} more`} than planned` : ''}
          </span>
        </span>
      </div>

      {parts.map((part, pi) => (
        <div key={pi} className="sw-mains sw-mains-1">
          <span className="mp-eyebrow">{sessions[pi]?.label ?? rangeLabel(part.days)} · {sessions[pi]?.cookLabel ?? ''} batch</span>
          <Dish m="comida" k={part.plan.L} slot="L" pi={pi} /><Dish m="cena" k={part.plan.D} slot="D" pi={pi} />
        </div>
      ))}

      {on && (
        <div className="sw-more mp-in">
          {people.map(p => {
            const s = r.perPerson.find(x => x.p.id === p.id)
            return (
              <div key={p.id} className="sw-person">
                <span className="sw-person-head">
                  <span className="mp-dot" style={{ width: 9, height: 9, background: colorOf(p) }} /><strong>{p.name}</strong>
                  <span className="mp-muted mp-num">{s.kcal} / {s.target} kcal · {s.hit}/{covered.length} days on target</span>
                </span>
                {parts.map((part, pi) => (
                  <span key={pi} style={{ display: 'contents' }}>
                    <span className="sw-line"><Icon name={MEAL_ICON.desayuno} size={12} stroke={2.4} color={MEAL_STYLE.desayuno.color} />{name(part.plan.B[p.id])}{multi && <span className="mp-muted"> · {sessions[pi]?.label}</span>}<No slot="B" pid={p.id} pi={pi} what="breakfast" /></span>
                    <span className="sw-line"><Icon name={MEAL_ICON.merienda} size={12} stroke={2.4} color={MEAL_STYLE.merienda.color} />{name(part.plan.S[p.id])}{multi && <span className="mp-muted"> · {sessions[pi]?.label}</span>}<No slot="S" pid={p.id} pi={pi} what="snack" /></span>
                  </span>
                ))}
                <span className="sw-stats mp-num">
                  <span><strong>{s.prot} g</strong> protein</span>
                  <span className={s.veg < vegMin ? 'is-low' : ''}><strong>{s.veg} g</strong> veg</span>
                  <span className={s.sol < SOLUBLE_FIBER_DAILY_MIN ? 'is-low' : ''}><strong>{s.sol} g</strong> soluble fiber</span>
                  <span className="mp-muted">per day</span>
                </span>
              </div>
            )
          })}
          {r.warnings.length > 0 && (
            <ul className="sw-warnings">{r.warnings.map(w => <li key={w}>{w}</li>)}</ul>
          )}
          {r.packs?.notes.length > 0 && (
            <ul className="sw-packs">{r.packs.notes.map(w => <li key={w}>{w}</li>)}</ul>
          )}
          {ok && <span className="sw-why">Legumes, onion/garlic and insoluble fiber at most once a day, no red meat at dinner, a different base at lunch and dinner, fiber and veg above the minimum, protein within limits and portions on target.</span>}
          {free.length > 0 && <span className="mp-muted" style={{ fontSize: 12 }}>{rangeLabel(free)} stay{free.length === 1 ? 's' : ''} free — not planned or shopped for. Change it in Settings.</span>}
        </div>
      )}
    </div>
  )
}
