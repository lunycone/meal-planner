import { useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import Overlay from '../ui/Overlay'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { generateWeek } from '../../engine/snackGen'
import { makeByPersonSlot, slotForPerson } from '../../engine/calc'
import { DAY_KEYS, DAY_SHORT, MEALS, activeProfilesOn, addDays, fmtMoney } from '../../lib/mealplan'

// «Plan snacks» sheet. Builds a week of snacks (or breakfasts) from ingredients
// with engine/snackGen.js: archetype x flavor profile, kitchen-step amounts,
// batches Mon–Fri, a cap on never-tried ingredients, and the week's digestive
// rules. Day-locking + «Regenerate the rest», «Apply to this week» and
// «Save» (turns a snack you liked into your own dish, so it counts as tried).

const short = n => n.replace(/\s*\(.*$/, '').toLowerCase()
const line = it => `${short(it.name)} ${it.qty} ${it.unit}`

export default function SnackPlannerSheet({ wk, week, monday, onClose, onApplied }) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const profiles = useStore(s => s.profiles)
  const setMealSlots = useStore(s => s.setMealSlots)
  const addCustomCombos = useStore(s => s.addCustomCombos)
  const removeCustomCombo = useStore(s => s.removeCustomCombo)

  const [slot, setSlot] = useState('merienda')
  const [batches, setBatches] = useState('auto')
  const [novelty, setNovelty] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [pinned, setPinned] = useState({})
  const [open, setOpen] = useState({})
  const [candSeed, setCandSeed] = useState(() => 1 + Math.floor(Math.random() * 1e6))
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState({})
  const [showSaved, setShowSaved] = useState(false)

  // Two people: the digestive one first (its «already tried» caps bind the shared recipe).
  const people = activeProfilesOn(profiles, addDays(monday, 2))
  const persons = people.length === 2 ? [...people].sort((a, b) => (b.digestive ? 1 : 0) - (a.digestive ? 1 : 0)) : []
  const nameOf = id => profiles.find(p => p.id === id)?.name ?? id
  const initialOf = id => profiles.find(p => p.id === id)?.initial ?? nameOf(id)[0]

  // The week as it is now, per person, so the weekly rules (soluble fiber, protein,
  // once-a-day digestive rule) see the real breakfast, lunch and dinner.
  function baseWeekFor() {
    const out = {}
    for (const p of persons) {
      out[p.id] = DAY_KEYS.map(dk => {
        const day = {}
        MEALS.forEach(m => {
          const sl = slotForPerson(week[`${dk}-${m}`], p.id)
          const c = sl?.recipeKey ? allCombos[sl.recipeKey] : null
          if (c) day[m] = c
        })
        return day
      })
    }
    return out
  }

  function run({ keepPins, newCands }) {
    if (persons.length !== 2) { setError('Needs exactly two active profiles this week.'); return }
    // «Tried» = appears in one of YOUR dishes; snacks generated here don't count.
    const tried = Object.fromEntries(Object.entries(allCombos).filter(([, c]) => !c.snackGenerated && !c.generated))
    const cs = newCands ? 1 + Math.floor(Math.random() * 1e6) : candSeed
    if (newCands) setCandSeed(cs)
    const pins = keepPins ? pinned : {}
    if (!keepPins) setPinned({})
    const r = generateWeek({
      allIng, dishes: tried, persons, mealSlot: slot, noveltyMax: novelty, batches,
      seed: 1 + Math.floor(Math.random() * 1e6), candidateSeed: cs, restarts: 250,
      pinned: pins, baseWeek: baseWeekFor(),
    })
    setApplied(false)
    if (r.error) { setError(r.error + (keepPins && Object.keys(pins).length ? ' Try unlocking a day.' : '')); return }
    setError(null); setResult(r)
  }

  const togglePin = d => setPinned(p => {
    const n = { ...p }
    if (n[d.startDay] === d.candidateId) delete n[d.startDay]; else n[d.startDay] = d.candidateId
    return n
  })

  function apply() {
    const keyOf = (d, pid) => d.candidateId + '|' + pid
    const uniq = new Map()
    result.days.forEach(d => Object.keys(d.persons).forEach(pid => {
      const k = keyOf(d, pid)
      if (!uniq.has(k)) uniq.set(k, { name: `${d.label} · ${nameOf(pid)}`, items: d.persons[pid].combo.items, snackGenerated: true })
    }))
    const entries = [...uniq.entries()]
    const ids = addCustomCombos(entries.map(([, v]) => v))
    const idOf = {}
    entries.forEach(([k], i) => { idOf[k] = 'custom-' + ids[i] })
    const slots = {}
    result.days.forEach(d => {
      const by = {}
      Object.keys(d.persons).forEach(pid => { by[pid] = { type: 'desayuno', recipeKey: idOf[keyOf(d, pid)] } })
      slots[`${DAY_KEYS[d.dayIdx]}-${slot}`] = makeByPersonSlot(by)
    })
    setMealSlots(wk, slots)
    setApplied(true)
    onApplied?.()
  }

  // Save = your own dish per person (snack: true), NOT marked as generated: it counts as
  // «tried» for the novelty cap and shows up in Dishes.
  function saveDay(d) {
    addCustomCombos(Object.keys(d.persons).map(pid => ({
      name: `★ ${d.label} · ${nameOf(pid)}`, items: d.persons[pid].combo.items, snack: true, meals: [slot],
    })))
    setSaved(m => ({ ...m, [d.candidateId]: true }))
  }
  const savedCombos = Object.entries(allCombos).filter(([, c]) => c.snack)

  return (
    <Overlay onClose={onClose}>
      <div className="mp-sheet" style={{ maxWidth: 820, height: 'min(820px, calc(100dvh - 48px))' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Plan snacks">
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mp-bubble" style={{ width: 42, height: 42, background: 'rgba(139,111,232,0.15)', color: '#7154DA' }}><Icon name="sparkle" size={18} stroke={2.2} /></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Plan {slot === 'merienda' ? 'snacks' : 'breakfasts'}</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>Built from ingredients · same recipe for both, different servings</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32 }} aria-label="Close" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Segmented label="Meal" value={slot} onChange={v => { setSlot(v); setResult(null); setPinned({}) }}
              options={[{ value: 'merienda', label: 'Snack' }, { value: 'desayuno', label: 'Breakfast' }]} />
            <Segmented label="Batches" value={batches} onChange={setBatches}
              options={[{ value: 'auto', label: 'Auto' }, { value: 'yes', label: 'Batch Mon–Fri' }, { value: 'no', label: 'No batches' }]} />
            <Segmented label="New ingredients" value={novelty} onChange={setNovelty}
              options={[{ value: 0, label: '0 new' }, { value: 1, label: '1 new' }]} />
            <span style={{ flex: 1 }} />
            {result && Object.keys(pinned).length > 0 && (
              <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => run({ keepPins: true, newCands: false })}>Regenerate the rest</button>
            )}
            <button className="mp-btn mp-btn-dark mp-btn-sm" onClick={() => run({ keepPins: false, newCands: true })}><Icon name="sparkle" size={14} />{result ? 'Another week' : 'Plan the week'}</button>
          </div>

          {error && <span className="mp-chip" style={{ color: '#B7791F' }}><Icon name="warn" size={13} />{error}</span>}

          {result && (
            <>
              <span className="mp-muted mp-num" style={{ fontSize: 12.5 }}>
                {fmtMoney(result.cost)} for both · target per {slot === 'merienda' ? 'snack' : 'breakfast'}: {persons.map(p => `${p.name} ${result.targets[p.id]} kcal`).join(' · ')}
                {result.novelty.length > 0 && <> · <strong>new:</strong> {result.novelty.map(k => short(allIng[k]?.name ?? k)).join(', ')}</>}
              </span>
              {result.violations?.length > 0 && (
                <div className="mp-chip" style={{ color: '#B7791F', display: 'block', whiteSpace: 'normal' }}>
                  <strong>New notes from this {slot === 'merienda' ? 'snack' : 'breakfast'}:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>{result.violations.map((v, i) => <li key={i}>{nameOf(v.person)}: {v.msg}</li>)}</ul>
                </div>
              )}

              {result.days.map(d => {
                const cont = d.kind === 'batch' && !d.isStart
                const locked = pinned[d.startDay] === d.candidateId
                return (
                  <div key={d.dayIdx} className="sw-card" style={{ opacity: cont ? 0.7 : 1, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ width: 36 }}>{DAY_SHORT[d.dayIdx]}</strong>
                      <span style={{ flex: 1, minWidth: 170, fontSize: 14, fontWeight: cont ? 400 : 600, fontStyle: cont ? 'italic' : 'normal' }}>
                        {cont ? '↳ ' : ''}{d.label}
                        {d.kind === 'batch' && d.isStart && <span className="mp-tag" style={{ marginLeft: 6 }}>batch ×{d.batches} · {d.coverDays} days</span>}
                        {d.novelty.length > 0 && !cont && <span className="mp-tag" style={{ marginLeft: 6 }}>new</span>}
                      </span>
                      {persons.map(p => (
                        <span key={p.id} className="mp-muted mp-num" style={{ fontSize: 12 }}>
                          {initialOf(p.id)} {d.persons[p.id].kcal} kcal · {d.persons[p.id].prot} g{d.persons[p.id].portions ? ` · ${d.persons[p.id].portions} serv.` : ''}
                        </span>
                      ))}
                      <button className="mp-btn mp-btn-glass mp-btn-sm" title={locked ? 'Unlock' : 'Lock this day (and its batch) when regenerating'} onClick={() => togglePin(d)}>{locked ? '🔒' : '🔓'}</button>
                      {!cont && <button className="mp-btn mp-btn-glass mp-btn-sm" disabled={!!saved[d.candidateId]} title="Save it as one of your dishes (it counts as tried)" onClick={() => saveDay(d)}>{saved[d.candidateId] ? '★ Saved' : '☆ Save'}</button>}
                      {!cont && <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setOpen(o => ({ ...o, [d.dayIdx]: !o[d.dayIdx] }))}>{open[d.dayIdx] ? 'Hide' : 'Recipe'}</button>}
                    </div>
                    {!cont && open[d.dayIdx] && (
                      <div style={{ marginTop: 8, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {d.kind === 'batch' && <span><strong>Batch recipe</strong> (×{d.batches}): {d.persons[persons[0].id].slotsOfBatch.map(line).join(' · ')}</span>}
                        {persons.map(p => {
                          const x = d.persons[p.id]
                          return (
                            <span key={p.id}><strong>{p.name}:</strong>{' '}
                              {d.kind === 'batch'
                                ? <>{x.portions} serving(s) of the batch{x.items?.length ? ' + ' + x.items.map(line).join(', ') : ''}</>
                                : x.items.map(line).join(' · ')}
                            </span>
                          )
                        })}
                        <ol style={{ margin: '4px 0 0 18px', padding: 0 }}>{d.steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
                      </div>
                    )}
                  </div>
                )
              })}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="mp-btn mp-btn-dark mp-btn-sm" onClick={apply}><Icon name="check" size={14} stroke={2.6} />Apply to this week</button>
                {applied && <span className="mp-muted" style={{ fontSize: 12.5 }}>✓ Applied: the dishes were created and put in the week.</span>}
              </div>
            </>
          )}

          <div style={{ borderTop: '1px solid var(--c-line, rgba(0,0,0,0.08))', paddingTop: 10 }}>
            <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setShowSaved(v => !v)}>★ Saved ({savedCombos.length}) {showSaved ? '▲' : '▼'}</button>
            {showSaved && (savedCombos.length === 0
              ? <div className="mp-muted" style={{ fontSize: 12.5, marginTop: 6 }}>Nothing saved yet. Use ☆ Save on the ones you like.</div>
              : <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {savedCombos.map(([key, c]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{ flex: 1 }}>{c.name}</span>
                      <span className="mp-muted">{c.items.map(i => short(allIng[i.k]?.name ?? '')).filter(Boolean).slice(0, 4).join(', ')}</span>
                      <button className="mp-btn mp-btn-glass mp-btn-sm" title="Remove" onClick={() => removeCustomCombo(c.customId)}><Icon name="x" size={11} stroke={3} /></button>
                    </div>
                  ))}
                </div>)}
          </div>
        </div>
      </div>
    </Overlay>
  )
}
