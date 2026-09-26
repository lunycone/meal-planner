import { useState, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { ingCost, ingKcal, ingProt, ingFat, comboAgg, fmt, pcosCarbLevel, proteinLevel, kcalLevel, LEVEL_COLOR, ingredientUnitType } from '../../engine/calc'
import PcosBadge from '../PcosBadge'

function portionLabel(p) {
  if (p.grams != null) return `${p.grams}g`
  if (p.units != null) return `${p.units} ud`
  if (p.ml    != null) return `${p.ml}ml`
  return '—'
}

// ─── Helpers de porción (edición) ──────────────────────────────────────────
function defaultPortionFor(ing) {
  switch (ingredientUnitType(ing)) {
    case 'per100': return { grams: 100 }
    case 'perUnit': return { units: 1 }
    case 'perML':   return { ml: 100 }
    default:        return {}
  }
}
function portionQty(p) {
  if (p.grams != null) return p.grams
  if (p.units != null) return p.units
  if (p.ml    != null) return p.ml
  return ''
}
function portionUnit(p) {
  if (p.grams != null) return 'g'
  if (p.units != null) return 'ud'
  if (p.ml    != null) return 'ml'
  return ''
}
function withPortionQty(p, qty) {
  const n = qty === '' ? 0 : parseFloat(qty)
  if (isNaN(n)) return p
  if (p.grams != null) return { ...p, grams: n }
  if (p.units != null) return { ...p, units: n }
  if (p.ml    != null) return { ...p, ml: n }
  return p
}

const MEAL_ORDER  = ['desayuno', 'comida', 'merienda', 'cena']
const MEAL_LABELS = { desayuno: 'DESAYUNO', comida: 'COMIDA', merienda: 'MERIENDA', cena: 'CENA' }
const MEAL_ICONS  = { desayuno: '🍳', comida: '🍽️', merienda: '🥤', cena: '🌙' }

// ─── Recipe detail panel ─────────────────────────────────────────────────────
function RecipeDetail({ combo, allIng, onClose, onEdit, onDelete }) {
  const agg = comboAgg(combo, allIng)
  const [confirmDel, setConfirmDel] = useState(false)
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

      <div className="dz-detail-actions">
        <button className="btn-primary" onClick={onEdit}>✎ Editar plato</button>
        {!confirmDel ? (
          <button className="btn-danger" onClick={() => setConfirmDel(true)}>✕ Eliminar</button>
        ) : (
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem' }}>
            ¿Eliminar?
            <button className="btn-danger" onClick={onDelete}>Sí</button>
            <button className="btn-ghost" onClick={() => setConfirmDel(false)}>No</button>
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Recipe edit / create form ──────────────────────────────────────────────
function PlatoEditForm({ combo, allIng, onSave, onCancel, onDelete, canReset, onReset }) {
  const [name, setName]   = useState(combo.name ?? '')
  const [meals, setMeals] = useState(combo.meals ?? [])
  const [items, setItems] = useState(combo.items ?? [])
  const [pickerQuery, setPickerQuery] = useState('')
  const [confirmDel, setConfirmDel]   = useState(false)

  const toggleMeal = (m) => setMeals(ms => ms.includes(m) ? ms.filter(x => x !== m) : [...ms, m])

  const pickerMatches = useMemo(() => {
    if (!pickerQuery.trim()) return []
    const q = pickerQuery.toLowerCase()
    return Object.entries(allIng).filter(([, ing]) => ing.name.toLowerCase().includes(q)).slice(0, 8)
  }, [pickerQuery, allIng])

  function addItem(key) {
    setItems(its => [...its, { k: key, p: defaultPortionFor(allIng[key]) }])
    setPickerQuery('')
  }
  function removeItem(i) { setItems(its => its.filter((_, idx) => idx !== i)) }
  function updateQty(i, qty) {
    setItems(its => its.map((it, idx) => idx === i ? { ...it, p: withPortionQty(it.p, qty) } : it))
  }

  const liveAgg = useMemo(() => comboAgg({ items }, allIng), [items, allIng])
  const canSave = name.trim() && meals.length > 0 && items.length > 0

  return (
    <div className="dz-builder">
      <div className="dz-builder-head">
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 240, fontFamily: 'var(--t-font-display)', fontSize: '0.95rem' }}
          value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del plato"
        />
        {MEAL_ORDER.map(m => (
          <button
            key={m} type="button" onClick={() => toggleMeal(m)}
            style={{
              padding: '4px 12px', borderRadius: 999, fontSize: '0.74rem', cursor: 'pointer', background: 'transparent',
              border: `1.5px solid ${meals.includes(m) ? 'var(--ink)' : 'var(--t-border)'}`,
              color: meals.includes(m) ? 'var(--ink)' : 'var(--muted)',
              fontWeight: meals.includes(m) ? 600 : 400,
            }}
          >
            {MEAL_LABELS[m]}
          </button>
        ))}
        <button className="btn-primary" style={{ marginLeft: 'auto' }} disabled={!canSave} onClick={() => onSave({ name: name.trim(), meals, items })}>Guardar</button>
        <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
      </div>

      <div className="dz-builder-body">
        <div style={{ background: 'var(--t-bg)', border: '1px solid var(--line-soft)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>Añadir ingrediente</div>
          <input className="form-input" style={{ width: '100%' }} placeholder="Buscar…" value={pickerQuery} onChange={e => setPickerQuery(e.target.value)} />
          {pickerMatches.map(([key, ing]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--t-surface)', border: '1px solid var(--line-soft)', borderRadius: 6 }}>
              <span style={{ fontSize: '0.76rem' }}>{ing.name}</span>
              <button type="button" onClick={() => addItem(key)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--t-border)', background: 'var(--t-bg)', color: 'var(--brown)', cursor: 'pointer', flexShrink: 0 }}>+</button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Sin ingredientes todavía — búscalos a la izquierda.</div>}
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid var(--line-soft)', borderRadius: 6 }}>
              <span style={{ flex: 1, fontSize: '0.82rem' }}>{allIng[it.k]?.name ?? it.k}</span>
              <input className="form-input" style={{ width: 64, textAlign: 'right' }} value={portionQty(it.p)} onChange={e => updateQty(i, e.target.value)} />
              <span style={{ fontSize: '0.74rem', color: 'var(--muted)', width: 28 }}>{portionUnit(it.p)}</span>
              <button type="button" onClick={() => removeItem(i)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--t-border)', background: 'var(--t-bg)', color: 'var(--t-danger)', cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
          ))}
          {items.length > 0 && (
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--line-soft)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brown)' }}>{fmt(liveAgg.cost)}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--kcal)' }}>{Math.round(liveAgg.kcal)} kcal</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4a7a3a' }}>{Math.round(liveAgg.prot)}g prot</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7a4a6a' }}>{Math.round(liveAgg.fat)}g grasa</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--muted)', alignSelf: 'center' }}>se recalcula al momento</span>
            </div>
          )}
        </div>
      </div>

      {onDelete && (
        <div className="dz-detail-actions" style={{ marginTop: '0.75rem', padding: '0.9rem 0 0' }}>
          {canReset && <button className="btn-ghost" onClick={onReset}>↺ Restaurar original</button>}
          {!confirmDel ? (
            <button className="btn-danger" onClick={() => setConfirmDel(true)}>✕ Eliminar este plato</button>
          ) : (
            <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem' }}>
              ¿Eliminar?
              <button className="btn-danger" onClick={onDelete}>Sí</button>
              <button className="btn-ghost" onClick={() => setConfirmDel(false)}>No</button>
            </span>
          )}
        </div>
      )}
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
  const comboOverrides    = useStore(s => s.comboOverrides)
  const setComboOverride   = useStore(s => s.setComboOverride)
  const resetComboOverride = useStore(s => s.resetComboOverride)
  const deleteCombo       = useStore(s => s.deleteCombo)
  const addCustomCombo    = useStore(s => s.addCustomCombo)
  const updateCustomCombo = useStore(s => s.updateCustomCombo)
  const removeCustomCombo = useStore(s => s.removeCustomCombo)

  const [selectedKey, setSelectedKey] = useState(null)
  const [editingKey, setEditingKey]   = useState(null)
  const [creating, setCreating]       = useState(false)
  const [searchTerm, setSearchTerm]   = useState('')
  const [sortBy, setSortBy]           = useState('name')
  const [mealFilter, setMealFilter]   = useState('all')

  const toggle = (key) => {
    setSelectedKey(prev => prev === key ? null : key)
    setEditingKey(null)
  }

  function saveCombo(key, data) {
    const combo = allCombos[key]
    if (combo.isCustom) updateCustomCombo(combo.customId, data)
    else setComboOverride(key, data)
    setEditingKey(null)
  }

  function deleteComboByKey(key) {
    const combo = allCombos[key]
    if (combo.isCustom) removeCustomCombo(combo.customId)
    else deleteCombo(key)
    setEditingKey(null)
    setSelectedKey(null)
  }

  const grouped = useMemo(() => {
    let entries = Object.entries(allCombos).map(([key, combo]) => ({ key, combo }))

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      entries = entries.filter(r => r.combo.name.toLowerCase().includes(q))
    }

    const meals = mealFilter === 'all' ? MEAL_ORDER : [mealFilter]
    const PCOS_RANK = { green: 0, yellow: 1, red: 2 }

    const sorter = (meal) => (a, b) => {
      const aggA = comboAgg(a.combo, allIng)
      const aggB = comboAgg(b.combo, allIng)
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
      .map(meal => ({
        meal,
        items: entries.filter(r => (r.combo.meals ?? []).includes(meal)).sort(sorter(meal)),
      }))
      .filter(g => g.items.length > 0)
  }, [allCombos, allIng, searchTerm, sortBy, mealFilter])

  const total = grouped.reduce((s, g) => s + g.items.length, 0)

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Platos
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Todos los platos ya montados — desayuno, comida, merienda y cena. Haz clic para ver ingredientes, precio y macros.
          </p>
        </div>
        {!creating && <button className="btn-primary" onClick={() => setCreating(true)}>+ Nuevo plato</button>}
      </div>

      {creating && (
        <div style={{ marginBottom: '1.5rem' }}>
          <PlatoEditForm
            combo={{ name: '', items: [], meals: [] }}
            allIng={allIng}
            onSave={(data) => { addCustomCombo(data); setCreating(false) }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

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
          <option value="pcos">PCOS (mejor a peor)</option>
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
              const isEditing  = editingKey === key
              return (
                <div key={key}>
                  <RecipeCard combo={combo} mealType={meal} isSelected={isSelected} onClick={() => toggle(key)} />
                  {isSelected && isEditing && (
                    <PlatoEditForm
                      combo={combo}
                      allIng={allIng}
                      canReset={!combo.isCustom && !!comboOverrides[key]}
                      onReset={() => { resetComboOverride(key); setEditingKey(null) }}
                      onSave={(data) => saveCombo(key, data)}
                      onCancel={() => setEditingKey(null)}
                      onDelete={() => deleteComboByKey(key)}
                    />
                  )}
                  {isSelected && !isEditing && (
                    <RecipeDetail
                      combo={combo} allIng={allIng}
                      onClose={() => setSelectedKey(null)}
                      onEdit={() => setEditingKey(key)}
                      onDelete={() => deleteComboByKey(key)}
                    />
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
