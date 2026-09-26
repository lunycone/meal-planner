import { useState, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import Icon, { MEAL_ICON } from '../ui/Icon'
import Segmented from '../ui/Segmented'
import PlatoSheet from '../meal/PlatoSheet'
import { MEAL_STYLE, MEAL_LABEL, fmtMoney, mondayOf, addDays, weekKeyOf } from '../../lib/mealplan'
import { comboAgg, pcosCarbLevel, proteinLevel, kcalLevel, LEVEL_COLOR } from '../../engine/calc'
import PcosBadge from '../PcosBadge'

const MEAL_ORDER = ['desayuno', 'comida', 'merienda', 'cena']

// Fila de la lista: abre la ficha del plato (ver = editar, ver PlatoSheet).
function PlatoRow({ combo, mealType, agg, inPlan, modified, onOpen }) {
  const allIng = useStore(selectAllIng)
  const pLevel = proteinLevel(agg.prot, mealType)
  const kLevel = kcalLevel(agg.kcal, mealType)
  const pcosLevel = pcosCarbLevel(combo, allIng, mealType)
  return (
    <button type="button" className="pl-row" onClick={onOpen}>
      <span className="pl-row-name">
        <span>{combo.name}</span>
        {pcosLevel && <PcosBadge level={pcosLevel} />}
        {combo.isCustom && <span className="mp-tag" style={{ background: 'rgba(139,111,232,0.14)', color: '#5B3FC4' }}>Yours</span>}
        {modified && <span className="mp-tag" style={{ background: 'rgba(224,162,27,0.16)', color: '#8A5E08' }}>Modified</span>}
        {inPlan && <span className="mp-tag" style={{ background: 'rgba(47,158,91,0.13)', color: '#1F7A45' }}>In the plan</span>}
      </span>
      <span className="pl-row-stats mp-num">
        <span style={{ fontWeight: 650 }}>{fmtMoney(agg.cost)}</span>
        <span style={{ color: LEVEL_COLOR[kLevel] }}>{Math.round(agg.kcal)} kcal</span>
        <span style={{ color: LEVEL_COLOR[pLevel] }}>{Math.round(agg.prot)} g prot</span>
        <span className="mp-muted">{Math.round(agg.fat)} g fat</span>
      </span>
      <Icon name="right" size={13} stroke={2.4} color="var(--c-ink-3)" />
    </button>
  )
}

export default function PlatosTab() {
  const allIng    = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const comboOverrides = useStore(s => s.comboOverrides)
  const weekPlan  = useStore(s => s.weekPlan)

  const [open, setOpen]             = useState(undefined) // undefined = cerrada, null = nuevo, key = plato
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy]         = useState('name')
  const [mealFilter, setMealFilter] = useState('all')

  // Platos puestos esta semana o la que viene
  const inPlan = useMemo(() => {
    const set = new Set()
    const mon = mondayOf(new Date())
    ;[0, 1].forEach(o => Object.values(weekPlan[weekKeyOf(addDays(mon, o * 7))] ?? {}).forEach(v => {
      if (!v) return
      ;(v.byPerson ? Object.values(v.byPerson) : [v]).forEach(m => m?.recipeKey && set.add(m.recipeKey))
    }))
    return set
  }, [weekPlan])

  const aggs = useMemo(() => Object.fromEntries(Object.entries(allCombos).map(([k, c]) => [k, comboAgg(c, allIng)])), [allCombos, allIng])

  const grouped = useMemo(() => {
    let entries = Object.entries(allCombos).map(([key, combo]) => ({ key, combo }))
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      entries = entries.filter(r => r.combo.name.toLowerCase().includes(q) || (r.combo.items ?? []).some(it => (allIng[it.k]?.name ?? '').toLowerCase().includes(q)))
    }
    const meals = mealFilter === 'all' ? MEAL_ORDER : [mealFilter]
    const PCOS_RANK = { green: 0, yellow: 1, red: 2 }
    const sorter = (meal) => (a, b) => {
      const aggA = aggs[a.key], aggB = aggs[b.key]
      if (sortBy === 'pcos') {
        const rA = PCOS_RANK[pcosCarbLevel(a.combo, allIng, meal)] ?? 3
        const rB = PCOS_RANK[pcosCarbLevel(b.combo, allIng, meal)] ?? 3
        if (rA !== rB) return rA - rB
        return a.combo.name.localeCompare(b.combo.name)
      }
      if (sortBy === 'price') return aggA.cost - aggB.cost
      if (sortBy === 'kcal')  return aggA.kcal - aggB.kcal
      if (sortBy === 'prot')  return aggB.prot - aggA.prot
      return a.combo.name.localeCompare(b.combo.name)
    }
    return meals
      .map(meal => ({ meal, items: entries.filter(r => (r.combo.meals ?? []).includes(meal)).sort(sorter(meal)) }))
      .filter(g => g.items.length > 0)
  }, [allCombos, allIng, aggs, searchTerm, sortBy, mealFilter])

  const total = grouped.reduce((s, g) => s + g.items.length, 0)

  return (
    <div>
      <div className="mp-page-head mp-rise">
        <div className="mp-page-title">
          <h1>Dishes</h1>
          <span>{Object.keys(allCombos).length} dishes · {inPlan.size} in this or next week's plan</span>
        </div>
        <div className="mp-page-tools">
          <button className="mp-btn mp-btn-dark" onClick={() => setOpen(null)}><Icon name="plus" size={14} stroke={2.6} />New dish</button>
        </div>
      </div>

      <div className="mp-rise" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', animationDelay: '60ms' }}>
        <label className="mp-search" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Icon name="search" size={14} stroke={2.4} />
          <span className="sr-only">Search dish or ingredient</span>
          <input placeholder="Search dish or ingredient…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </label>
        <Segmented label="Meal" value={mealFilter} onChange={setMealFilter}
          options={[{ value: 'all', label: 'All' }, ...MEAL_ORDER.map(m => ({ value: m, label: MEAL_LABEL[m] }))]} />
        <Segmented label="Sort" value={sortBy} onChange={setSortBy}
          options={[{ value: 'name', label: 'A–Z' }, { value: 'price', label: 'Price' }, { value: 'kcal', label: 'Kcal' }, { value: 'prot', label: 'Protein' }, { value: 'pcos', label: 'PCOS' }]} />
      </div>

      {total === 0 ? (
        <div className="mp-empty" style={{ padding: 40 }}>No dishes match your search.</div>
      ) : (
        grouped.map(({ meal, items }) => (
          <section key={meal} style={{ marginBottom: 26 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>
              <span className="mp-bubble" style={{ width: 28, height: 28, background: MEAL_STYLE[meal].tint, color: MEAL_STYLE[meal].color }}><Icon name={MEAL_ICON[meal]} size={14} stroke={2.2} /></span>
              {MEAL_LABEL[meal]} <span className="mp-muted" style={{ fontWeight: 500, fontSize: 13 }}>{items.length}</span>
            </h3>
            <div className="pl-list">
              {items.map(({ key, combo }) => (
                <PlatoRow key={key} combo={combo} mealType={meal} agg={aggs[key]}
                  inPlan={inPlan.has(key)} modified={!combo.isCustom && !!comboOverrides[key]} onOpen={() => setOpen(key)} />
              ))}
            </div>
          </section>
        ))
      )}

      {open !== undefined && <PlatoSheet key={open ?? 'new'} comboKey={open} onClose={() => setOpen(undefined)} />}
    </div>
  )
}
