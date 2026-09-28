import { useMemo, useState } from 'react'
import useStore from '../../store/useStore'
import Icon, { MEAL_ICON } from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { comboAgg } from '../../engine/calc'
import { MEAL_STYLE, addDays, fmtMoney, weekKeyOf } from '../../lib/mealplan'

// ─── Date night ─────────────────────────────────────────────────────────────
// Cena de cita del sábado en doble ración: la otra mitad el domingo (cena o
// comida, a elegir). El presupuesto no cuenta (se enseña, no penaliza) y la
// carne roja en la cena vale. Opcional: postre, en el hueco de la merienda
// del sábado y del domingo. «Not this one» aprende como en la semana
// inteligente; no repite la cena de cita de las 4 semanas anteriores.

function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const rnd = () => 1 + Math.floor(Math.random() * 1e9)
const meal = k => ({ type: 'desayuno', recipeKey: k })
const PORTIONS = 4 // 2 personas × (sábado + domingo)

export default function DateNightPanel({ wk, monday, people, allIng, allCombos, target, onLoaded, onClose }) {
  const weekPlan = useStore(s => s.weekPlan)
  const dishPrefs = useStore(s => s.dishPrefs) ?? {}
  const rateDishes = useStore(s => s.rateDishes)
  const setMealSlots = useStore(s => s.setMealSlots)
  const [seed, setSeed] = useState(rnd)
  const [leftover, setLeftover] = useState('cena') // domingo: 'cena' | 'comida'
  const [withDessert, setWithDessert] = useState(true)
  const [pick, setPick] = useState(0)
  const [excluded, setExcluded] = useState([])

  const recent = useMemo(() => {
    const out = new Set()
    for (let b = 1; b <= 4; b++) {
      const w = weekPlan[weekKeyOf(addDays(monday, -7 * b))] ?? {}
      const v = w['sáb-cena']; const k = v?.byPerson ? Object.values(v.byPerson).find(Boolean)?.recipeKey : v?.recipeKey
      if (k) out.add(k)
    }
    return out
  }, [weekPlan, wk]) // eslint-disable-line react-hooks/exhaustive-deps

  const options = useMemo(() => {
    const pref = k => Math.max(-3, Math.min(3, dishPrefs[k] ?? 0))
    const mains = Object.entries(allCombos).filter(([k, c]) => c.date && !c.dessert && !excluded.includes(k))
    const desserts = Object.entries(allCombos).filter(([k, c]) => c.date && c.dessert && !excluded.includes(k))
    const score = k => hash(`${seed}:${k}`) / 4294967295 + (recent.has(k) ? 0.7 : 0) - pref(k) * 0.25
    const top = mains.map(([k]) => k).sort((a, b) => score(a) - score(b)).slice(0, 3)
    return top.map((k, i) => {
      const c = allCombos[k], a = comboAgg(c, allIng)
      const dk = desserts.length ? desserts.map(([x]) => x).sort((x, y) => hash(`${seed}:${i}:${x}`) - hash(`${seed}:${i}:${y}`))[0] : null
      const da = dk ? comboAgg(allCombos[dk], allIng) : null
      return { k, c, a, dk, dc: dk ? allCombos[dk] : null, da }
    })
  }, [seed, excluded, allCombos, allIng, recent, dishPrefs]) // eslint-disable-line react-hooks/exhaustive-deps

  const sel = options[Math.min(pick, options.length - 1)] ?? null
  const week = weekPlan[wk] ?? {}
  const slotKeys = ['sáb-cena', `dom-${leftover}`, ...(withDessert ? ['sáb-merienda', 'dom-merienda'] : [])]
  const busy = slotKeys.filter(k => week[k]).length

  function notThis(k) { rateDishes([k], -1); setExcluded(x => [...x, k]); setPick(0) }
  function load() {
    if (!sel) return
    const slots = { 'sáb-cena': meal(sel.k), [`dom-${leftover}`]: meal(sel.k) }
    if (withDessert && sel.dk) { slots['sáb-merienda'] = meal(sel.dk); slots['dom-merienda'] = meal(sel.dk) }
    setMealSlots(wk, slots)
    rateDishes([sel.k], 1)
    onLoaded?.(target)
    onClose()
  }

  const names = people.map(p => p.name).join(' & ')
  return (
    <>
      <div className="sw-controls">
        <Segmented label="Leftovers" value={leftover} onChange={setLeftover}
          options={[{ value: 'cena', label: 'Second half: Sun dinner' }, { value: 'comida', label: 'Sun lunch' }]} />
        <button type="button" className={`ig-chip${withDessert ? ' is-on' : ''}`} aria-pressed={withDessert} onClick={() => setWithDessert(v => !v)}
          style={withDessert ? { background: '#D9486A', color: '#fff' } : undefined}>♥ Dessert</button>
        <button type="button" className="mp-btn mp-btn-dark mp-btn-sm sw-new" onClick={() => { setSeed(rnd()); setPick(0) }}><Icon name="shuffle" size={14} />New ideas</button>
      </div>
      <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 2 }}>
        <span className="sw-srcnote mp-in" style={{ background: 'rgba(217,72,106,0.08)' }}>
          <span style={{ color: '#D9486A' }}>♥</span>
          Saturday dinner for {names || 'the two of you'}, cooked as a double batch — the other half is {leftover === 'cena' ? 'Sunday dinner' : 'Sunday lunch'}.
          Budget doesn’t count here and red meat is fine. Portions still adjust to each of you.
        </span>
        {options.length === 0 && <div className="mp-empty" style={{ padding: 40 }}>No date dishes left — press New ideas.</div>}
        {options.map((o, i) => {
          const on = i === pick
          const one = o.a.cost + (withDessert && o.da ? o.da.cost : 0) // una ración (con postre si va)
          return (
            <div key={o.k} className={`sw-card mp-in${on ? ' is-on' : ''}`} style={{ animationDelay: `${i * 70}ms` }}>
              <button type="button" className="sw-hit" aria-pressed={on} aria-label={`Option ${i + 1}: ${o.c.name}`} onClick={() => setPick(i)} />
              <div className="sw-top">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="sw-radio" aria-hidden="true" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{i === 0 ? '♥ Date night' : `Option ${i + 1}`}</span>
                  <span className="mp-tag" style={o.c.reheat === 'good' ? { background: 'rgba(47,158,91,0.12)', color: '#1F7A45' } : { background: 'rgba(224,162,27,0.14)', color: '#8A5E08' }}>
                    {o.c.reheat === 'good' ? '♻️ Keeps well for Sunday' : 'Best fresh on Sunday'}
                  </span>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="mp-num" style={{ fontSize: 20, fontWeight: 700 }}>{fmtMoney(one)}<small className="mp-muted" style={{ fontSize: 12, fontWeight: 500 }}> / person</small></span>
                  <span className="mp-muted mp-num" style={{ fontSize: 11.5 }}>{fmtMoney(one * 2)} for 2 · {fmtMoney(one * PORTIONS)} for 4 portions</span>
                  <span className="mp-muted mp-num" style={{ fontSize: 11.5 }}>≈ {Math.round(o.a.kcal)} kcal · {Math.round(o.a.prot)} g protein per base portion</span>
                </span>
              </div>
              <div className="sw-mains sw-mains-1">
                <span className="sw-dish">
                  <span className="mp-bubble" style={{ width: 24, height: 24, background: MEAL_STYLE.cena.tint, color: MEAL_STYLE.cena.color }}><Icon name={MEAL_ICON.cena} size={12} stroke={2.4} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>{o.c.name}</span>
                  {on && <button type="button" className="sw-no" onClick={() => notThis(o.k)}><Icon name="x" size={9} stroke={3} />Not this one</button>}
                </span>
                {withDessert && o.dc && (
                  <span className="sw-dish">
                    <span className="mp-bubble" style={{ width: 24, height: 24, background: 'rgba(217,72,106,0.12)', color: '#D9486A' }}>♥</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{o.dc.name}<span className="mp-muted" style={{ fontSize: 12 }}> · dessert, {Math.round(o.da.kcal)} kcal</span></span>
                    {on && <button type="button" className="sw-no" onClick={() => notThis(o.dk)}><Icon name="x" size={9} stroke={3} />Not this one</button>}
                  </span>
                )}
              </div>
              {on && (
                <div className="sw-more mp-in">
                  <span className="sw-why">{o.c.items.filter(it => it.k !== 'evoo' && it.k !== 'salt' && it.k !== 'black-pepper').map(it => allIng[it.k]?.name?.split(' (')[0]).filter(Boolean).join(' · ')}</span>
                  {o.c.note && <span className="mp-muted" style={{ fontSize: 12.5 }}>🍳 {o.c.note}</span>}
                  {withDessert && o.dc?.note && <span className="mp-muted" style={{ fontSize: 12.5 }}>♥ {o.dc.note}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
        <span className="mp-muted" style={{ fontSize: 12.5, lineHeight: 1.4, maxWidth: 380 }}>
          {busy > 0 ? `Replaces ${busy} meal${busy > 1 ? 's' : ''} already on Saturday/Sunday.` : `Goes on Saturday dinner and ${leftover === 'cena' ? 'Sunday dinner' : 'Sunday lunch'}${withDessert ? ', dessert in the snack slot' : ''}.`}
        </span>
        <button className="mp-btn mp-btn-dark" disabled={!sel} onClick={load}>♥ Plan the date</button>
      </div>
    </>
  )
}
