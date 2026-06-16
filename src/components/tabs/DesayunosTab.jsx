import { useState, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos, selectAllCats } from '../../store/useStore'
import { ingCost, ingKcal, ingProt, ingFat, comboAgg, fmt, kfmt } from '../../engine/calc'
import { CAT_ORDER } from '../../data/ingredients'

// helpers
function pType(ing) {
  if (!ing) return 'grams'
  if (ing.per100 != null) return 'grams'
  if (ing.perUnit != null) return 'units'
  if (ing.perML != null) return 'ml'
  if (ing.perServing != null) return 'serv'
  return 'grams'
}
function buildP(it) {
  if (it.pType === 'grams') return { grams: it.qty }
  if (it.pType === 'units') return { units: it.qty }
  if (it.pType === 'ml')    return { ml: it.qty }
  return { serv: it.qty }
}
function portionLabel(p) {
  if (p.grams != null) return `${p.grams}g`
  if (p.units != null) return `${p.units} ud`
  if (p.ml    != null) return `${p.ml}ml`
  return '—'
}
const UNIT_LABEL = { grams: 'g', units: 'ud', ml: 'ml', serv: 'porción' }

// ─── Recipe detail panel ─────────────────────────────────────────────────────
function RecipeDetail({ comboKey, combo, allIng, isBase, onEdit, onClose }) {
  const deleteCombo       = useStore(s => s.deleteCombo)
  const removeCustomCombo = useStore(s => s.removeCustomCombo)
  const [confirmDel, setConfirmDel] = useState(false)

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
          {combo.items.map(it => {
            const ing  = allIng[it.k]
            const cost = ingCost(it.k, it.p, allIng)
            const kcal = ingKcal(it.k, it.p, allIng)
            const prot = ingProt(it.k, it.p, allIng)
            const fat  = ingFat(it.k, it.p, allIng)
            return (
              <tr key={it.k}>
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

      {combo.note && <div className="dz-note">📌 {combo.note}</div>}

      <div className="dz-detail-actions">
        <button className="btn-primary" onClick={() => { onEdit(isBase ? comboKey : combo); onClose() }}>✎ Editar</button>
        {!confirmDel
          ? <button className="btn-danger" style={{ marginLeft: 'auto' }} onClick={() => setConfirmDel(true)}>✕ {isBase ? 'Ocultar' : 'Eliminar'}</button>
          : <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.82rem' }}>
              ¿{isBase ? 'Ocultar' : 'Eliminar'}?
              <button className="btn-danger" onClick={() => { isBase ? deleteCombo(comboKey) : removeCustomCombo(combo.id); onClose() }}>Sí</button>
              <button className="btn-ghost" onClick={() => setConfirmDel(false)}>No</button>
            </span>
        }
      </div>
    </div>
  )
}

// ─── Mini builder for new desayuno recipes ──────────────────────────────────
function DesayunoBuilder({ onClose }) {
  const allIng           = useStore(selectAllIng)
  const allCats          = useStore(selectAllCats)
  const addCustomCombo   = useStore(s => s.addCustomCombo)
  const catOrder = [...CAT_ORDER, ...useStore(s => s.customCategories).map(c => c.key)]

  const [search,    setSearch]    = useState('')
  const [comboName, setComboName] = useState('')
  const [items,     setItems]     = useState([])

  const inKeys = new Set(items.map(it => it.k))

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return Object.entries(allIng).filter(([, ing]) =>
      !ing.pend && !ing.hideInTable && (!q || ing.name.toLowerCase().includes(q))
    )
  }, [allIng, search])

  function addItem(key) {
    if (inKeys.has(key)) return
    const ing = allIng[key]
    const type = pType(ing)
    const defaultQty = type === 'grams' ? 100 : type === 'ml' ? 100 : 1
    setItems(prev => [...prev, { k: key, qty: defaultQty, pType: type }])
  }

  function removeItem(key) { setItems(prev => prev.filter(it => it.k !== key)) }
  function setQty(key, qty) { setItems(prev => prev.map(it => it.k === key ? { ...it, qty } : it)) }

  const totalCost = items.reduce((a, it) => a + ingCost(it.k, buildP(it), allIng), 0)
  const totalKcal = items.reduce((a, it) => a + ingKcal(it.k, buildP(it), allIng), 0)
  const totalProt = items.reduce((a, it) => a + ingProt(it.k, buildP(it), allIng), 0)

  function save() {
    if (!items.length || !comboName.trim()) return
    addCustomCombo({ name: comboName.trim(), items: items.map(it => ({ k: it.k, p: buildP(it) })), desayuno: true })
    onClose()
  }

  return (
    <div className="dz-builder">
      <div className="dz-builder-head">
        <input className="combo-name-input" placeholder="Nombre de la receta…" value={comboName} onChange={e => setComboName(e.target.value)} />
        <button className="btn-primary" disabled={!items.length || !comboName.trim()} onClick={save}>Guardar receta</button>
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
      </div>
      <div className="dz-builder-body">
        <div className="ing-picker" style={{ maxHeight: 260 }}>
          <div className="picker-head">
            <input className="picker-search" placeholder="Buscar ingrediente…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="picker-body">
            {catOrder.map(cat => {
              const entries = filtered.filter(([, ing]) => ing.cat === cat)
              if (!entries.length) return null
              return (
                <div key={cat}>
                  <div className="picker-cat-label">{allCats[cat] ?? cat}</div>
                  {entries.map(([key, ing]) => (
                    <div key={key} className={`picker-item${inKeys.has(key) ? ' in-combo' : ''}`} onClick={() => addItem(key)}>
                      <span className="pi-name">{ing.name}</span>
                      <span className="pi-price">{ing.per100 != null ? `$${ing.per100.toFixed(2)}/100g` : ing.perUnit != null ? `$${ing.perUnit.toFixed(2)}/ud` : '—'}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {items.length === 0 ? (
            <div className="combo-empty">Haz clic en un ingrediente para añadirlo.</div>
          ) : (
            <>
              {items.map(it => {
                const ing = allIng[it.k]
                const p   = buildP(it)
                return (
                  <div key={it.k} className="combo-item-row">
                    <span className="ci-name">{ing?.name ?? it.k}</span>
                    <div className="ci-qty">
                      {it.pType !== 'serv' ? (
                        <>
                          <input className="ci-qty-input" type="number" min="0"
                            step={it.pType === 'grams' || it.pType === 'ml' ? 10 : 0.25}
                            value={it.qty}
                            onChange={e => setQty(it.k, parseFloat(e.target.value) || 0)}
                          />
                          <span className="ci-unit">{UNIT_LABEL[it.pType]}</span>
                        </>
                      ) : <span className="ci-unit">1 porción</span>}
                    </div>
                    <span className="ci-cost">{fmt(ingCost(it.k, p, allIng))}</span>
                    <span className="ci-kcal">{kfmt(ingKcal(it.k, p, allIng))}</span>
                    <button className="ci-remove" onClick={() => removeItem(it.k)}>✕</button>
                  </div>
                )
              })}
              <div className="combo-total-bar" style={{ marginTop: 8 }}>
                <div className="ct-stat"><span className="ct-label">$</span><span className="ct-value">{fmt(totalCost)}</span></div>
                <div className="ct-stat"><span className="ct-label">kcal</span><span className="ct-value kcal">{kfmt(totalKcal)}</span></div>
                <div className="ct-stat"><span className="ct-label">prot</span><span className="ct-value" style={{ color: '#4a7a3a' }}>{Math.round(totalProt)}g</span></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Recipe card ─────────────────────────────────────────────────────────────
function RecipeCard({ comboKey, combo, allIng, isSelected, onClick }) {
  const agg = comboAgg(combo, allIng)
  return (
    <div className={`dz-card${isSelected ? ' is-open' : ''}`} onClick={onClick}>
      <div className="dz-card-name">{combo.name}</div>
      <div className="dz-card-stats">
        <span className="dz-stat-cost">{fmt(agg.cost)}</span>
        <span className="dz-stat-dot">·</span>
        <span className="dz-stat-kcal">{Math.round(agg.kcal)} kcal</span>
        <span className="dz-stat-dot">·</span>
        <span className="dz-stat-prot">{Math.round(agg.prot)}g prot</span>
        <span className="dz-stat-dot">·</span>
        <span className="dz-stat-fat">{Math.round(agg.fat)}g grasa</span>
      </div>
      <span className="sc-chevron">{isSelected ? '▲' : '▼'}</span>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function DesayunosTab() {
  const allIng     = useStore(selectAllIng)
  const allCombos  = useStore(selectAllCombos)
  const customCombos = useStore(s => s.customCombos)

  const [selectedKey, setSelectedKey] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name', 'price', 'kcal', 'prot'

  const toggle = (key) => setSelectedKey(prev => prev === key ? null : key)

  // Base desayuno combos (key starts with 'desayuno-')
  const baseRecipes = useMemo(() => {
    let recipes = Object.entries(allCombos)
      .filter(([key]) => key.startsWith('desayuno-'))
      .map(([key, combo]) => ({ key, combo }))

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      recipes = recipes.filter(r => r.combo.name.toLowerCase().includes(q))
    }

    recipes.sort((a, b) => {
      const agg_a = comboAgg(a.combo, allIng)
      const agg_b = comboAgg(b.combo, allIng)
      if (sortBy === 'price') return agg_a.cost - agg_b.cost
      if (sortBy === 'kcal') return agg_a.kcal - agg_b.kcal
      if (sortBy === 'prot') return agg_b.prot - agg_a.prot
      return a.combo.name.localeCompare(b.combo.name)
    })

    return recipes
  }, [allCombos, allIng, searchTerm, sortBy])

  // Custom desayuno combos (flagged with desayuno: true)
  const customRecipes = useMemo(() => {
    let recipes = customCombos
      .filter(c => c.desayuno)
      .map(c => ({ key: '__dz__' + c.id, combo: c }))

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      recipes = recipes.filter(r => r.combo.name.toLowerCase().includes(q))
    }

    recipes.sort((a, b) => {
      const agg_a = comboAgg(a.combo, allIng)
      const agg_b = comboAgg(b.combo, allIng)
      if (sortBy === 'price') return agg_a.cost - agg_b.cost
      if (sortBy === 'kcal') return agg_a.kcal - agg_b.kcal
      if (sortBy === 'prot') return agg_b.prot - agg_a.prot
      return a.combo.name.localeCompare(b.combo.name)
    })

    return recipes
  }, [customCombos, allIng, searchTerm, sortBy])

  function handleEdit() {
    setShowBuilder(true)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Recetas de desayuno
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Haz clic en una receta para ver el desglose completo de ingredientes, precio y macros.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowBuilder(v => !v)}>
          {showBuilder ? 'Cerrar' : '+ Nueva receta'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          className="picker-search"
          placeholder="Buscar receta…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            background: 'var(--bg-2)',
            color: 'var(--text)',
            fontSize: '0.875rem',
          }}
        >
          <option value="name">Nombre A-Z</option>
          <option value="price">Precio (menor a mayor)</option>
          <option value="kcal">Kcal (menor a mayor)</option>
          <option value="prot">Proteína (mayor a menor)</option>
        </select>
      </div>

      {showBuilder && <DesayunoBuilder onClose={() => setShowBuilder(false)} />}

      {/* Custom recipes */}
      {customRecipes.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Mis recetas ({customRecipes.length})</div>
          {customRecipes.map(({ key, combo }) => {
            const isSelected = selectedKey === key
            return (
              <div key={key}>
                <RecipeCard comboKey={key} combo={combo} allIng={allIng} isSelected={isSelected} onClick={() => toggle(key)} />
                {isSelected && (
                  <RecipeDetail comboKey={key} combo={combo} allIng={allIng} isBase={false}
                    onEdit={handleEdit} onClose={() => setSelectedKey(null)} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Base recipes */}
      {baseRecipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          <p>No hay recetas que coincidan con tu búsqueda</p>
        </div>
      ) : (
        <>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Recetas base ({baseRecipes.length})</div>
          {baseRecipes.map(({ key, combo }) => {
            const isSelected = selectedKey === key
            return (
              <div key={key}>
                <RecipeCard comboKey={key} combo={combo} allIng={allIng} isSelected={isSelected} onClick={() => toggle(key)} />
                {isSelected && (
                  <RecipeDetail comboKey={key} combo={combo} allIng={allIng} isBase
                    onEdit={handleEdit} onClose={() => setSelectedKey(null)} />
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
