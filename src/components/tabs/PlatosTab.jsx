import { useState, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { ingCost, ingKcal, ingProt, ingFat, comboAgg, fmt, pcosCarbLevel, proteinLevel, kcalLevel, LEVEL_COLOR } from '../../engine/calc'
import PcosBadge from '../PcosBadge'

function portionLabel(p) {
  if (p.grams != null) return `${p.grams}g`
  if (p.units != null) return `${p.units} ud`
  if (p.ml    != null) return `${p.ml}ml`
  return '—'
}

const MEAL_ORDER  = ['desayuno', 'comida', 'merienda', 'cena']
const MEAL_LABELS = { desayuno: 'DESAYUNO', comida: 'COMIDA', merienda: 'MERIENDA', cena: 'CENA' }
const MEAL_ICONS  = { desayuno: '🍳', comida: '🍽️', merienda: '🥤', cena: '🌙' }

// ─── Recipe detail panel ─────────────────────────────────────────────────────
function RecipeDetail({ combo, allIng, onClose }) {
  const agg = comboAgg(combo, allIng)
  return (
    <div className="dz-detail">
      <div className="dz-detail-header">
        <div className="dz-detail-macros">
          <div className="dz-macro-block">
            <span className="dz-macro-val cost">{fmt(agg.cost)}</span>
            <span className="dz-macro-lbl">precio</span>
          </div>
          <div className="dz-macro-div"/>
          <div className="dz-macro-block">
            <span className="dz-macro-val kcal">{Math.round(agg.kcal)}</span>
            <span className="dz-macro-lbl">kcal</span>
          </div>
          <div className="dz-macro-div"/>
          <div className="dz-macro-block">
            <span className="dz-macro-val prot">{Math.round(agg.prot)}g</span>
            <span className="dz-macro-lbl">proteína</span>
          </div>
          <div className="dz-macro-div"/>
          <div className="dz-macro-block">
            <span className="dz-macro-val fat">{Math.round(agg.fat)}g</span>
            <span className="dz-macro-lbl">grasa</span>
          </div>
        </div>
        <button className="dz-close" onClick={onClose}>✕</button>
      </div>

      <table className="dz-ing-table">
        <thead>
          <tr>
            <th>Ingrediente</th>
            <th>Cantidad</th>
            <th>$</th>
            <th>Kcal</th>
            <th>Prot</th>
            <th>Grasa</th>
          </tr>
        </thead>
        <tbody>
          {combo.items.map((it, i) => {
            const ing  = allIng[it.k]
            const cost = ingCost(it.k, it.p, allIng)
            const kcal = ingKcal(it.k, it.p, allIng)
            const prot = ingProt(it.k, it.p, allIng)
            const fat  = ingFat(it.k, it.p, allIng)
            return (
              <tr key={it.k + i}>
                <td className="dz-td-name">{ing?.name ?? it.k}</td>
                <td className="dz-td-qty">{portionLabel(it.p)}</td>
                <td className="dz-td-cost">{fmt(cost)}</td>
                <td className="dz-td-kcal">{Math.round(kcal)}</td>
                <td className="dz-td-prot">{Math.round(prot)}g</td>
                <td className="dz-td-fat">{Math.round(fat)}g</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RecipeCard({ combo, mealType, isSelected, onClick }) {
  const allIng = useStore(selectAllIng)
  const agg = comboAgg(combo, allIng)
  const pLevel = proteinLevel(agg.prot, mealType)
  const kLevel = kcalLevel(agg.kcal, mealType)
  const pcosLevel = pcosCarbLevel(combo, allIng, mealType)
  return (
    <div className={`dz-card${isSelected ? ' is-open' : ''}`} onClick={onClick}>
      <div className="dz-card-name">
        {combo.name}
        {combo.jessica && <span className="badge badge-jessica" style={{ marginLeft: 6 }}>María</span>}
        {pcosLevel && <PcosBadge level={pcosLevel} />}
      </div>
      <div className="dz-card-stats">
        <span className="dz-stat-cost">{fmt(agg.cost)}</span>
        <span className="dz-stat-dot">·</span>
        <span className="dz-stat-kcal" style={{ color: LEVEL_COLOR[kLevel], fontWeight: 600 }}>{Math.round(agg.kcal)} kcal</span>
        <span className="dz-stat-dot">·</span>
        <span className="dz-stat-prot" style={{ color: LEVEL_COLOR[pLevel], fontWeight: 600 }}>{Math.round(agg.prot)}g prot</span>
        <span className="dz-stat-dot">·</span>
        <span className="dz-stat-fat">{Math.round(agg.fat)}g grasa</span>
      </div>
      <span className="sc-chevron">{isSelected ? '▲' : '▼'}</span>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function PlatosTab() {
  const allIng    = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)

  const [selectedKey, setSelectedKey] = useState(null)
  const [searchTerm, setSearchTerm]   = useState('')
  const [sortBy, setSortBy]           = useState('name')
  const [mealFilter, setMealFilter]   = useState('all')

  const toggle = (key) => setSelectedKey(prev => prev === key ? null : key)

  const grouped = useMemo(() => {
    let entries = Object.entries(allCombos).map(([key, combo]) => ({ key, combo }))

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      entries = entries.filter(r => r.combo.name.toLowerCase().includes(q))
    }

    const sorter = (a, b) => {
      const aggA = comboAgg(a.combo, allIng)
      const aggB = comboAgg(b.combo, allIng)
      if (sortBy === 'price') return aggA.cost - aggB.cost
      if (sortBy === 'kcal')  return aggA.kcal - aggB.kcal
      if (sortBy === 'prot')  return aggB.prot - aggA.prot
      return a.combo.name.localeCompare(b.combo.name)
    }

    const meals = mealFilter === 'all' ? MEAL_ORDER : [mealFilter]
    return meals
      .map(meal => ({
        meal,
        items: entries.filter(r => (r.combo.meals ?? []).includes(meal)).sort(sorter),
      }))
      .filter(g => g.items.length > 0)
  }, [allCombos, allIng, searchTerm, sortBy, mealFilter])

  const total = grouped.reduce((s, g) => s + g.items.length, 0)

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          Platos
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          Todos los platos ya montados — desayuno, comida, merienda y cena. Haz clic para ver ingredientes, precio y macros.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          className="picker-search"
          placeholder="Buscar plato…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-2)', color: 'var(--text)', fontSize: '0.875rem' }}
        >
          <option value="name">Nombre A-Z</option>
          <option value="price">Precio (menor a mayor)</option>
          <option value="kcal">Kcal (menor a mayor)</option>
          <option value="prot">Proteína (mayor a menor)</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['all', 'Todo', '📌'], ...MEAL_ORDER.map(m => [m, MEAL_LABELS[m], MEAL_ICONS[m]])].map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setMealFilter(key)}
            style={{
              padding: '0.5rem 1rem',
              border: `2px solid ${mealFilter === key ? 'var(--text)' : 'var(--border)'}`,
              background: mealFilter === key ? 'var(--card)' : 'transparent',
              color: 'var(--text)', borderRadius: '9999px', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: mealFilter === key ? 600 : 400, transition: 'all 0.2s',
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          <p>No hay platos que coincidan con tu búsqueda</p>
        </div>
      ) : (
        grouped.map(({ meal, items }) => (
          <div key={meal} style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {MEAL_ICONS[meal]} {MEAL_LABELS[meal]} ({items.length})
            </h3>
            {items.map(({ key, combo }) => {
              const isSelected = selectedKey === key
              return (
                <div key={key}>
                  <RecipeCard combo={combo} mealType={meal} isSelected={isSelected} onClick={() => toggle(key)} />
                  {isSelected && (
                    <RecipeDetail combo={combo} allIng={allIng} onClose={() => setSelectedKey(null)} />
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
