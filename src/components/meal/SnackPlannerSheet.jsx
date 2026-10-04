import { useMemo, useRef, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import Overlay from '../ui/Overlay'
import SheetGate from '../ui/SheetGate'
import Icon, { MEAL_ICON } from '../ui/Icon'
import Segmented from '../ui/Segmented'
import Spinner from '../ui/Spinner'
import useSnackWeeks from '../../lib/useSnackWeeks'
import { comboAgg, makeByPersonSlot, slotForPerson } from '../../engine/calc'
import { DAY_KEYS, DAY_SHORT, MEALS, MEAL_STYLE, PERSON_COLOR, activeProfilesOn, addDays, fmtMoney, fmtRange } from '../../lib/mealplan'

// «Plan snacks»: same look and flow as «Load model week → Smart».
//  · Three different weeks for the priority you pick (cheapest / more protein / more variety).
//  · Tap an option to open it; on the open one, «Not this one» swaps that recipe for another and
//    keeps the rest of the week (the recipe is also hidden from now on).
//  · Everything is built from your ingredients (engine/snackGen.js) in a Web Worker, so the
//    screen never freezes. Nothing touches your plan until «Apply to this week».
//  · «Save» turns a recipe into one of your dishes, so its ingredients count as tried.

const SLOT_NAME = { merienda: 'snack', desayuno: 'breakfast' }
const PRIORITY_OPTS = [{ value: 'price', label: 'Cheapest' }, { value: 'protein', label: 'More protein' }, { value: 'variety', label: 'More variety' }]
const PRIORITY_BEST = { price: 'Best price', protein: 'Most protein', variety: 'Most variety' }
const BATCH_OPTS = [{ value: 'auto', label: 'Batches: auto' }, { value: 'yes', label: 'Batch Mon–Fri' }, { value: 'no', label: 'No batches' }]
const NEW_OPTS = [{ value: 0, label: 'Only tried ingredients' }, { value: 1, label: 'Up to 1 new' }]
const randomSeed = () => 1 + Math.floor(Math.random() * 1e9)
const short = n => n.replace(/\s*\(.*$/, '').toLowerCase()
const line = it => (it.unit === 'taste' ? `${short(it.name)} to taste` : `${short(it.name)} ${it.qty} ${it.unit}`)
const dayRange = (a, len) => (len <= 1 ? DAY_SHORT[a] : `${DAY_SHORT[a]}–${DAY_SHORT[Math.min(6, a + len - 1)]}`)
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`

function SnackSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Building weeks">
      {[0, 1, 2].map(i => <div key={i} className="sw-card sw-skel" style={{ animationDelay: `${i * 120}ms` }} />)}
    </div>
  )
}

function SnackCard({ r, i, on, busy, best, persons, slot, allIng, colorOf, saved, openRecipes, onPick, onReject, onSave, onSaveAll, onToggleRecipe }) {
  const groups = r.days.filter(d => d.isStart)
  const ok = r.warnings.length === 0
  const ms = MEAL_STYLE[slot]
  const nameOf = id => persons.find(p => p.id === id)?.name ?? id
  const initialOf = p => p.initial ?? p.name[0]
  const newNames = r.novelty.map(k => short(allIng[k]?.name ?? k))
  const allSaved = groups.every(g => saved[g.candidateId])
  const servings = (g, p) => {
    const x = g.persons[p.id]
    return g.kind === 'batch'
      ? `${plural(x.portions, 'serving')} of the batch${x.items?.length ? ' + ' + x.items.map(line).join(', ') : ''}`
      : x.items.map(line).join(' · ')
  }
  return (
    <div className={`sw-card mp-in${on ? ' is-on' : ''}${busy ? ' is-busy' : ''}`} style={{ animationDelay: `${i * 70}ms` }}>
      <button type="button" className="sw-hit" aria-pressed={on} aria-label={`Option ${i + 1}: ${fmtMoney(r.cost)} for the week`} onClick={onPick} />
      <div className="sw-top">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="sw-radio" aria-hidden="true" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{i === 0 ? best : `Option ${i + 1}`}</span>
          <span className={`mp-tag ${ok ? 'sw-ok' : 'sw-warn'}`}>{ok ? '✓ All rules met' : `${r.warnings.length} note${r.warnings.length > 1 ? 's' : ''}`}</span>
          {newNames.length > 0 && <span className="mp-tag sw-newdish" title="Not in any of your dishes yet">new: {newNames.join(', ')}</span>}
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="mp-num" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{fmtMoney(r.cost)}<small className="mp-muted" style={{ fontSize: 12, fontWeight: 500 }}> for the week</small></span>
          <span className="mp-muted mp-num" style={{ fontSize: 11.5 }}>{r.perPerson.map(pp => `${initialOf(persons.find(p => p.id === pp.id))} ${pp.kcal} kcal/day`).join(' · ')}</span>
        </span>
      </div>

      <div className="sw-mains-1">
        {groups.map(g => (
          <div key={g.startDay} className="sw-grp">
            <span className="sw-dish">
              <span className="mp-bubble" style={{ width: 24, height: 24, background: ms.tint, color: ms.color }}><Icon name={MEAL_ICON[slot]} size={12} stroke={2.4} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="sw-days">{dayRange(g.startDay, g.coverDays)}</span>{g.label}
                {g.kind === 'batch' && <span className="mp-tag" style={{ marginLeft: 6 }}>batch ×{g.batches}</span>}
                {g.novelty.length > 0 && <span className="mp-tag sw-newdish">new</span>}
                <span className="sw-sub">{persons.map(p => `${initialOf(p)} ${g.persons[p.id].kcal} kcal`).join(' · ')}</span>
              </span>
            </span>
            {on && (
              <>
                <button type="button" className="sw-no" title="Not this one — find another" aria-label={`Not this ${SLOT_NAME[slot]}`} onClick={() => onReject(g)}><Icon name="x" size={9} stroke={3} />Not this one</button>
                <button type="button" className={`sw-act${saved[g.candidateId] ? ' is-on' : ''}`} disabled={!!saved[g.candidateId]} title="Save it as one of your dishes (its ingredients count as tried)" onClick={() => onSave(g)}>
                  <Icon name="star" size={11} stroke={2.4} fill={saved[g.candidateId] ? 'currentColor' : 'none'} />{saved[g.candidateId] ? 'Saved' : 'Save'}
                </button>
                <button type="button" className="sw-act" aria-expanded={!!openRecipes[g.startDay]} onClick={() => onToggleRecipe(g.startDay)}>{openRecipes[g.startDay] ? 'Hide recipe' : 'Recipe'}</button>
              </>
            )}
          </div>
        ))}
      </div>

      {on && (
        <div className="sw-more mp-in">
          {persons.map(p => {
            const pp = r.perPerson.find(x => x.id === p.id)
            return (
              <div key={p.id} className="sw-person">
                <span className="sw-person-head">
                  <span className="mp-dot" style={{ width: 9, height: 9, background: colorOf(p) }} /><strong>{p.name}</strong>
                  <span className="mp-muted mp-num">{pp.kcal} / {pp.target} kcal · {pp.hit}/{pp.days} days on target</span>
                </span>
                {groups.map(g => (
                  <span key={g.startDay} className="sw-line" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><Icon name={MEAL_ICON[slot]} size={12} stroke={2.4} color={ms.color} style={{ marginTop: 3 }} /><span className="mp-muted" style={{ marginRight: 6, flexShrink: 0, minWidth: 48 }}>{dayRange(g.startDay, g.coverDays)}</span><span style={{ flex: 1, minWidth: 0 }}>{servings(g, p)}</span></span>
                ))}
                <span className="sw-stats mp-num">
                  <span><strong>{pp.prot} g</strong> protein</span>
                  <span className="mp-muted">per {SLOT_NAME[slot]}, on average</span>
                </span>
              </div>
            )
          })}
          {groups.filter(g => openRecipes[g.startDay]).map(g => (
            <div key={g.startDay} className="sw-recipe mp-in">
              <strong>{g.label}</strong>
              {g.kind === 'batch' && <span><strong>Batch recipe</strong> (×{g.batches}): {g.persons[persons[0].id].slotsOfBatch.map(line).join(' · ')}</span>}
              <ol>{g.steps.map((st, k) => <li key={k}>{st}</li>)}</ol>
            </div>
          ))}
          {r.warnings.length > 0 && (
            <ul className="sw-warnings">{r.warnings.map((w, k) => <li key={k}>{nameOf(w.person)}: {w.msg}</li>)}</ul>
          )}
          {ok && <span className="sw-why">Legumes, onion/garlic and insoluble fiber at most once a day (counting the lunch and dinner you have planned), servings sized to each person’s kcal, and no more new ingredients than you allowed.</span>}
          <button type="button" className="sw-act" style={{ alignSelf: 'flex-start', margin: 0 }} disabled={allSaved} onClick={onSaveAll}>
            <Icon name="star" size={11} stroke={2.4} fill={allSaved ? 'currentColor' : 'none'} />{allSaved ? 'All saved' : 'Save all of this week'}
          </button>
        </div>
      )}
    </div>
  )
}

function SnackPlannerBody({ wk, week, monday, onClose, onApplied }) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const profiles = useStore(s => s.profiles)
  const setMealSlots = useStore(s => s.setMealSlots)
  const addCustomCombos = useStore(s => s.addCustomCombos)
  const removeCustomCombo = useStore(s => s.removeCustomCombo)

  const [tab, setTab] = useState('ideas')
  const [slot, setSlot] = useState('merienda')
  const [priority, setPriority] = useState('price')
  const [batches, setBatches] = useState('auto')
  const [novelty, setNovelty] = useState(1)
  const [seed, setSeed] = useState(1)
  const [candSeed, setCandSeed] = useState(randomSeed)
  const [shown, setShown] = useState([])      // recipes already shown (New ideas avoids them)
  const [banned, setBanned] = useState([])    // «Not this one»
  const [lock, setLock] = useState(null)      // { pins, candSeed, label } while swapping one recipe
  const [pick, setPick] = useState(0)
  const [saved, setSaved] = useState({})
  const [openRecipes, setOpenRecipes] = useState({})
  const [confirmDel, setConfirmDel] = useState(null)

  // Two people; the digestive one first (its «already tried» caps bind the shared recipe).
  const persons = useMemo(() => {
    const people = activeProfilesOn(profiles, addDays(monday, 2))
    return people.length === 2 ? [...people].sort((a, b) => (b.digestive ? 1 : 0) - (a.digestive ? 1 : 0)) : []
  }, [profiles, wk]) // eslint-disable-line react-hooks/exhaustive-deps
  const nameOf = id => profiles.find(p => p.id === id)?.name ?? id
  const colorOf = p => PERSON_COLOR[Math.max(0, profiles.findIndex(x => x.id === p.id)) % PERSON_COLOR.length]
  const ordered = [...persons].sort((a, b) => profiles.findIndex(x => x.id === a.id) - profiles.findIndex(x => x.id === b.id))

  // «Tried» = appears in one of YOUR dishes. Dishes the app composed or snacks made here don't count.
  const tried = useMemo(() => Object.fromEntries(Object.entries(allCombos)
    .filter(([, c]) => !c.snackGenerated && !/^gen-/.test(c.customId ?? ''))
    .map(([k, c]) => [k, { items: c.items }])), [allCombos])
  // The week as it is now, per person, so the weekly rules see the lunch and dinner you planned.
  const baseWeek = useMemo(() => {
    const out = {}
    for (const p of persons) {
      out[p.id] = DAY_KEYS.map(dk => {
        const day = {}
        MEALS.forEach(m => {
          const sl = slotForPerson(week[`${dk}-${m}`], p.id)
          const c = sl?.recipeKey ? allCombos[sl.recipeKey] : null
          if (c) day[m] = { items: c.items }
        })
        return day
      })
    }
    return out
  }, [persons, week, allCombos])

  // The options are built from the data as it was when the sheet opened. Saving a snack changes
  // your dishes (and so what counts as «tried»): without this the options would reshuffle
  // under your hands. Closing and reopening picks up the new data.
  const live = { allIng, tried, persons, baseWeek }
  const frozen = useRef(null)
  if (!frozen.current && persons.length === 2) frozen.current = live
  const data = frozen.current ?? live
  // Changes only with the data above: tells the worker to rebuild its recipes.
  const dataKey = useMemo(() => randomSeed(), [data.allIng, data.tried, data.persons]) // eslint-disable-line react-hooks/exhaustive-deps
  const args = useMemo(() => ({
    allIng: data.allIng, dishes: data.tried, persons: data.persons, dataKey, mealSlot: slot, baseWeek: data.baseWeek, noveltyMax: novelty, batches, priority, seed,
    candidateSeed: lock ? lock.candSeed : candSeed, avoidKeys: shown, banned, pinned: lock ? lock.pins : {},
    avoidWeight: lock ? 8 : 2.5, count: 3, restarts: 300,
  }), [data, dataKey, slot, novelty, batches, priority, seed, candSeed, shown, banned, lock])
  const snack = useSnackWeeks(args, data.persons.length === 2 && tab === 'ideas')
  const results = snack.out?.options ?? []
  const sel = results[Math.min(pick, results.length - 1)] ?? null

  // Changing an option starts over (what you said «no» to is remembered).
  const changeOpt = fn => v => { fn(v); setPick(0); setSeed(1); setShown([]); setLock(null); setSaved({}); setOpenRecipes({}); setCandSeed(randomSeed()) }
  const groupsOf = r => r.days.filter(d => d.isStart)
  function newIdeas() {
    setShown(sh => [...new Set([...sh, ...results.flatMap(r => groupsOf(r).map(g => g.candidateKey))])])
    setCandSeed(randomSeed()); setSeed(s => s + 1); setPick(0); setLock(null); setSaved({}); setOpenRecipes({})
  }
  // «Not this one»: keep the rest of the week, hide this recipe, find three others for that slot.
  function reject(r, g) {
    const pins = {}
    groupsOf(r).forEach(h => { if (h.startDay !== g.startDay) pins[h.startDay] = h.candidateId })
    setBanned(b => [...new Set([...b, g.candidateKey])])
    setLock({ pins, candSeed: r.candSeed, label: `${dayRange(g.startDay, g.coverDays)} ${SLOT_NAME[slot]}` })
    setPick(0); setSaved({}); setOpenRecipes({})
  }
  function backToWeeks() { setLock(null); setPick(0); setSeed(s => s + 1); setSaved({}); setOpenRecipes({}) }

  function saveGroups(r, gs) {
    addCustomCombos(gs.flatMap(g => Object.keys(g.persons).map(pid => ({
      name: `★ ${g.label} · ${nameOf(pid)}`, items: g.persons[pid].combo.items, snack: true, meals: [slot],
    }))))
    setSaved(m => ({ ...m, ...Object.fromEntries(gs.map(g => [g.candidateId, true])) }))
  }
  // Apply = one dish per recipe and person (not shown in Dishes), put into the week.
  function apply() {
    if (!sel) return
    const keyOf = (d, pid) => d.candidateId + '|' + pid
    const uniq = new Map()
    sel.days.forEach(d => Object.keys(d.persons).forEach(pid => {
      const k = keyOf(d, pid)
      if (!uniq.has(k)) uniq.set(k, { name: `${d.label} · ${nameOf(pid)}`, items: d.persons[pid].combo.items, snackGenerated: true })
    }))
    const entries = [...uniq.entries()]
    const ids = addCustomCombos(entries.map(([, v]) => v))
    const idOf = {}
    entries.forEach(([k], i) => { idOf[k] = 'custom-' + ids[i] })
    const slots = {}
    sel.days.forEach(d => {
      const by = {}
      Object.keys(d.persons).forEach(pid => { by[pid] = { type: 'desayuno', recipeKey: idOf[keyOf(d, pid)] } })
      slots[`${DAY_KEYS[d.dayIdx]}-${slot}`] = makeByPersonSlot(by)
    })
    setMealSlots(wk, slots)
    onApplied?.(`${SLOT_NAME[slot] === 'snack' ? 'Snacks' : 'Breakfasts'} added to this week`)
    onClose()
  }

  const savedCombos = Object.entries(allCombos).filter(([, c]) => c.snack)
  const subtitle = tab === 'ideas' ? 'Built from your ingredients, following your rules.' : 'Snacks you liked. Their ingredients count as tried.'
  const empty = !snack.busy && !snack.error && !results.length

  return (
    <Overlay onClose={onClose}>
      <div className="mp-sheet mw-sheet" style={{ maxWidth: 880, height: 'min(820px, calc(100dvh - 48px))' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Plan snacks">
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mp-bubble" style={{ width: 42, height: 42, background: 'rgba(139,111,232,0.15)', color: '#7154DA' }}><Icon name="sparkle" size={20} stroke={2.2} /></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{tab === 'ideas' ? (slot === 'merienda' ? 'Snack ideas' : 'Breakfast ideas') : 'Saved snacks'}</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>{subtitle}</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32 }} aria-label="Close" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div className="mw-bar">
          <Segmented label="Section" value={tab} onChange={v => { setTab(v); setConfirmDel(null) }}
            options={[{ value: 'ideas', label: 'Ideas' }, { value: 'saved', label: `Saved · ${savedCombos.length}` }]} />
          {tab === 'ideas' && <Segmented label="Meal" value={slot} onChange={changeOpt(setSlot)} options={[{ value: 'merienda', label: 'Snack' }, { value: 'desayuno', label: 'Breakfast' }]} />}
          <span className="mp-muted" style={{ fontSize: 12.5 }}>Week of {fmtRange(monday, addDays(monday, 6))}</span>
        </div>

        {tab === 'ideas' && (
          <>
            <div className="sw-controls">
              <Segmented label="Priority" value={priority} onChange={changeOpt(setPriority)} options={PRIORITY_OPTS} />
              <Segmented label="Batches" value={batches} onChange={changeOpt(setBatches)} options={BATCH_OPTS} />
              <Segmented label="New ingredients" value={novelty} onChange={changeOpt(setNovelty)} options={NEW_OPTS} />
              <button type="button" className="mp-btn mp-btn-dark mp-btn-sm sw-new" onClick={newIdeas} disabled={snack.busy || persons.length !== 2}>
                {snack.busy ? <Spinner size={14} stroke={2.6} color="#fff" /> : <Icon name="repeat" size={14} />}{snack.busy ? 'Thinking…' : 'New ideas'}
              </button>
            </div>
            <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 2 }}>
              {persons.length !== 2 && <div className="mp-empty" style={{ padding: 40 }}>Plan snacks needs exactly two active profiles this week.</div>}
              {persons.length === 2 && !lock && (
                <span className="sw-srcnote snk-note mp-in"><Icon name="leaf" size={13} /><span>New {SLOT_NAME[slot]} recipes made from your ingredients: an idea (oats, bowl, toast, cake…) with flavors that go together, sized to each person’s kcal. Open an option and tap <strong>Not this one</strong> on anything you don’t like.</span></span>
              )}
              {lock && (
                <div className="sw-lockbar mp-in">
                  <span>Other options for <strong>{lock.label}</strong>, keeping the rest of the week.</span>
                  <button type="button" className="ig-manage" onClick={backToWeeks}>Back to full weeks</button>
                </div>
              )}
              {persons.length === 2 && snack.busy && !results.length && <SnackSkeleton />}
              {snack.error && <div className="mp-empty">Couldn’t build a week: {snack.error}</div>}
              {empty && persons.length === 2 && (
                <div className="mp-empty" style={{ padding: 40 }}>
                  {lock ? 'No other recipe fits the rest of that week.' : 'No snack idea fits your rules right now. Try “Up to 1 new” or “No batches”.'}
                  {(lock || banned.length > 0) && <> <button type="button" className="ig-manage" onClick={lock ? backToWeeks : () => { setBanned([]); setSeed(s => s + 1) }}>{lock ? 'Back to full weeks' : 'Reset what you said no to'}</button></>}
                </div>
              )}
              {results.map((r, i) => (
                <SnackCard key={r.days.map(d => d.candidateId).join('|') + i} r={r} i={i} on={i === Math.min(pick, results.length - 1)} busy={snack.busy}
                  best={PRIORITY_BEST[priority]} persons={ordered} slot={slot} allIng={allIng} colorOf={colorOf} saved={saved} openRecipes={openRecipes}
                  onPick={() => setPick(i)} onReject={g => reject(r, g)} onSave={g => saveGroups(r, [g])} onSaveAll={() => saveGroups(r, groupsOf(r))}
                  onToggleRecipe={d => setOpenRecipes(o => ({ ...o, [d]: !o[d] }))} />
              ))}
            </div>
            <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
              <span className="mp-muted" style={{ fontSize: 12.5, lineHeight: 1.4, maxWidth: 400 }}>
                {snack.busy ? 'Trying combinations with today’s prices…'
                  : snack.out?.recipes ? `Compared ${snack.out.recipes} recipes across ${snack.out.tried.toLocaleString('en-US')} weeks.` : ''}
                {banned.length > 0 && <> · {plural(banned.length, 'idea')} you said no to <button type="button" className="ig-manage" onClick={() => { setBanned([]); setSeed(s => s + 1) }}>Reset</button></>}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="mp-btn mp-btn-glass" disabled={!sel || groupsOf(sel).every(g => saved[g.candidateId])} onClick={() => sel && saveGroups(sel, groupsOf(sel))}><Icon name="star" size={14} />Save</button>
                <button className="mp-btn mp-btn-dark" disabled={!sel || snack.busy} onClick={apply}>Apply to this week</button>
              </div>
            </div>
          </>
        )}

        {tab === 'saved' && (
          <>
            <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 0 }}>
              {savedCombos.length === 0 && (
                <div className="mp-empty" style={{ padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <span className="mp-bubble" style={{ width: 40, height: 40, background: 'rgba(31,27,22,0.06)', color: 'var(--c-ink-3)' }}><Icon name="star" size={18} /></span>
                  Nothing saved yet. Open an idea and tap Save on the ones you like.
                </div>
              )}
              {savedCombos.map(([key, c]) => {
                const agg = comboAgg({ items: c.items }, allIng)
                const asking = confirmDel === key
                const ms = MEAL_STYLE[c.meals?.[0] ?? 'merienda'] ?? MEAL_STYLE.merienda
                return (
                  <div key={key} className="mw-row">
                    <span className="mp-bubble" style={{ width: 38, height: 38, background: ms.tint, color: ms.color }}><Icon name="star" size={16} fill="currentColor" /></span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 650, lineHeight: 1.3 }}>{c.name.replace(/^★\s*/, '')}</span>
                      <span className="mp-muted" style={{ fontSize: 12.5, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.items.map(i => short(allIng[i.k]?.name ?? '')).filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="mw-side" style={{ pointerEvents: 'auto' }}>
                      {asking ? (
                        <span className="mw-confirm">
                          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Remove it?</span>
                          <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setConfirmDel(null)}>No</button>
                          <button className="mp-btn mp-btn-danger mp-btn-sm" onClick={() => { removeCustomCombo(c.customId); setConfirmDel(null) }}>Remove</button>
                        </span>
                      ) : (
                        <>
                          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span className="mp-num" style={{ fontSize: 17, fontWeight: 650 }}>{fmtMoney(agg.cost)}</span>
                            <span className="mp-muted mp-num" style={{ fontSize: 11.5 }}>{Math.round(agg.kcal)} kcal · {Math.round(agg.prot)} g</span>
                          </span>
                          <button type="button" className="mw-act" style={{ opacity: 1, transform: 'none' }} title="Remove" aria-label={`Remove ${c.name}`} onClick={() => setConfirmDel(key)}><Icon name="trash" size={13} /></button>
                        </>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
              <span className="mp-muted" style={{ fontSize: 12.5 }}>Saved snacks also show up in Dishes.</span>
              <button className="mp-btn mp-btn-glass" onClick={() => setTab('ideas')}>Back to ideas</button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  )
}

export default function SnackPlannerSheet(props) {
  return (
    <SheetGate title="Plan snacks" hint="Mixing ingredients…" icon="sparkle" onClose={props.onClose}>
      <SnackPlannerBody {...props} />
    </SheetGate>
  )
}
