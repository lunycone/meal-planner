import { useState, useMemo } from 'react'
import useStore, { selectAllIng } from '../../store/useStore'
import { CAT_ORDER, CAT_LABELS } from '../../data/ingredients'
import { PROTEIN } from '../../data/proteins'
import { PREP, COMBO } from '../../data/combos'
import { ingCost, ingKcal, ingProt, ingFat, comboAgg, fmt, proteinCost, proteinKcal } from '../../engine/calc'

// Utility to get ISO week key from date
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return `${d.getUTCFullYear()}-W${String(Math.ceil((d - yearStart) / 86400000 / 7)).padStart(2, '0')}`
}

// Helper to extract quantity from portion object
function getQtyValue(p) {
  if (p.grams != null) return { val: p.grams, unit: 'grams' }
  if (p.units != null) return { val: p.units, unit: 'units' }
  if (p.ml != null) return { val: p.ml, unit: 'ml' }
  if (p.serv != null) return { val: p.serv, unit: 'serv' }
  return { val: 0, unit: 'unknown' }
}

// ─── Main shopping list ──────────────────────────────────────────────────────
export default function ShoppingListTab() {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(s => {
    const deleted = new Set(s.deletedCombos)
    const result = {}
    for (const [k, v] of Object.entries(COMBO)) {
      if (deleted.has(k)) continue
      result[k] = s.comboOverrides[k] ? { ...v, ...s.comboOverrides[k] } : v
    }
    for (const c of s.customCombos) {
      const key = 'custom-' + c.id
      if (!deleted.has(key)) result[key] = { name: c.name, items: c.items, isCustom: true }
    }
    return result
  })
  const weekPlan = useStore(s => s.weekPlan)

  const [weekOffset, setWeekOffset] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('category') // 'category', 'cost', 'qty'

  const currentDate = new Date()
  const targetDate = new Date(currentDate)
  targetDate.setDate(targetDate.getDate() + weekOffset * 7)
  const weekKey = getISOWeek(targetDate)

  // Aggregate ingredients from week plan
  const aggregatedItems = useMemo(() => {
    const agg = {} // { ingredientKey: { qty, unit, cost, kcal, prot, fat, meals: [...] } }

    const currentWeek = weekPlan[weekKey] ?? {}

    Object.entries(currentWeek).forEach(([slotKey, meal]) => {
      if (!meal) return

      const [dayKey, mealType] = slotKey.split('-')

      if (meal.type === 'desayuno') {
        const recipe = allCombos[meal.recipeKey]
        if (recipe) {
          recipe.items.forEach(it => {
            const ingKey = it.k
            if (!agg[ingKey]) {
              agg[ingKey] = { qtyByUnit: {}, cost: 0, kcal: 0, prot: 0, fat: 0, meals: new Set() }
            }
            const { val, unit } = getQtyValue(it.p)
            if (!agg[ingKey].qtyByUnit[unit]) agg[ingKey].qtyByUnit[unit] = 0
            agg[ingKey].qtyByUnit[unit] += val
            agg[ingKey].cost += ingCost(ingKey, it.p, allIng)
            agg[ingKey].kcal += ingKcal(ingKey, it.p, allIng)
            agg[ingKey].prot += ingProt(ingKey, it.p, allIng)
            agg[ingKey].fat += ingFat(ingKey, it.p, allIng)
            agg[ingKey].meals.add(`${dayKey} ${mealType}`)
          })
        }
      } else if (meal.type === 'plato') {
        // Protein ration
        const protein = PROTEIN[meal.proteinKey]
        if (protein) {
          const ration = protein.ration
          if (ration.grams) {
            const ingKey = meal.proteinKey
            if (!agg[ingKey]) {
              agg[ingKey] = { qtyByUnit: {}, cost: 0, kcal: 0, prot: 0, fat: 0, meals: new Set() }
            }
            if (!agg[ingKey].qtyByUnit['grams']) agg[ingKey].qtyByUnit['grams'] = 0
            agg[ingKey].qtyByUnit['grams'] += ration.grams
            agg[ingKey].cost += proteinCost(protein)
            agg[ingKey].kcal += proteinKcal(protein)
            agg[ingKey].prot += (protein.prot ?? 0) * (ration.grams ?? 150) / 100
            agg[ingKey].fat += (protein.fat ?? 0) * (ration.grams ?? 150) / 100
            agg[ingKey].meals.add(`${dayKey} ${mealType}`)
          }
        }

        // Prep ingredients
        const prep = meal.prepKey ? PREP[meal.prepKey] : null
        if (prep) {
          prep.items.forEach(it => {
            const ingKey = it.k
            if (!agg[ingKey]) {
              agg[ingKey] = { qtyByUnit: {}, cost: 0, kcal: 0, prot: 0, fat: 0, meals: new Set() }
            }
            const { val, unit } = getQtyValue(it.p)
            if (!agg[ingKey].qtyByUnit[unit]) agg[ingKey].qtyByUnit[unit] = 0
            agg[ingKey].qtyByUnit[unit] += val
            agg[ingKey].cost += ingCost(ingKey, it.p, allIng)
            agg[ingKey].kcal += ingKcal(ingKey, it.p, allIng)
            agg[ingKey].prot += ingProt(ingKey, it.p, allIng)
            agg[ingKey].fat += ingFat(ingKey, it.p, allIng)
            agg[ingKey].meals.add(`${dayKey} ${mealType}`)
          })
        }

        // Combo ingredients
        const combo = allCombos[meal.comboKey]
        if (combo) {
          combo.items.forEach(it => {
            const ingKey = it.k
            if (!agg[ingKey]) {
              agg[ingKey] = { qtyByUnit: {}, cost: 0, kcal: 0, prot: 0, fat: 0, meals: new Set() }
            }
            const { val, unit } = getQtyValue(it.p)
            if (!agg[ingKey].qtyByUnit[unit]) agg[ingKey].qtyByUnit[unit] = 0
            agg[ingKey].qtyByUnit[unit] += val
            agg[ingKey].cost += ingCost(ingKey, it.p, allIng)
            agg[ingKey].kcal += ingKcal(ingKey, it.p, allIng)
            agg[ingKey].prot += ingProt(ingKey, it.p, allIng)
            agg[ingKey].fat += ingFat(ingKey, it.p, allIng)
            agg[ingKey].meals.add(`${dayKey} ${mealType}`)
          })
        }
      }
    })

    return agg
  }, [weekPlan, weekKey, allCombos, allIng])

  // Group by category and filter
  const grouped = useMemo(() => {
    const categories = {}

    Object.entries(aggregatedItems).forEach(([ingKey, data]) => {
      const ing = allIng[ingKey]
      if (!ing) return

      const cat = ing.cat ?? 'otro'
      if (!categories[cat]) categories[cat] = []

      // Format quantities
      let qtyStr = ''
      if (data.qtyByUnit.grams) qtyStr += `${Math.round(data.qtyByUnit.grams)}g `
      if (data.qtyByUnit.units) qtyStr += `${data.qtyByUnit.units} ud `
      if (data.qtyByUnit.ml) qtyStr += `${Math.round(data.qtyByUnit.ml)}ml `
      if (data.qtyByUnit.serv) qtyStr += `${data.qtyByUnit.serv} porción`
      qtyStr = qtyStr.trim()

      // Filter by search
      if (searchTerm && !ing.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return
      }

      categories[cat].push({
        key: ingKey,
        name: ing.name,
        qty: qtyStr,
        cost: data.cost,
        kcal: data.kcal,
        prot: data.prot,
        fat: data.fat,
        meals: Array.from(data.meals),
      })
    })

    // Sort items within each category
    Object.values(categories).forEach(items => {
      items.sort((a, b) => {
        if (sortBy === 'cost') return b.cost - a.cost
        if (sortBy === 'qty') return b.qty.localeCompare(a.qty)
        return a.name.localeCompare(b.name)
      })
    })

    return categories
  }, [aggregatedItems, allIng, searchTerm, sortBy])

  const totalCost = useMemo(
    () => Object.values(aggregatedItems).reduce((sum, item) => sum + item.cost, 0),
    [aggregatedItems]
  )

  // Copy to clipboard
  function copyToClipboard() {
    let text = `Lista de la compra - ${weekKey}\n\n`
    CAT_ORDER.forEach(cat => {
      if (!grouped[cat]) return
      text += `${CAT_LABELS[cat]?.toUpperCase()}\n`
      grouped[cat].forEach(item => {
        text += `  ☐ ${item.name} - ${item.qty} ($${item.cost.toFixed(2)})\n`
      })
      text += '\n'
    })
    text += `TOTAL: $${totalCost.toFixed(2)}`
    navigator.clipboard.writeText(text)
    alert('Copiado al portapapeles')
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Lista de la compra
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              Semana {weekKey} — Total: ${totalCost.toFixed(2)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-ghost" onClick={() => setWeekOffset(w => w - 1)}>← Sem anterior</button>
            <button className="btn-ghost" onClick={() => setWeekOffset(0)}>Hoy</button>
            <button className="btn-ghost" onClick={() => setWeekOffset(w => w + 1)}>Sem siguiente →</button>
            <button className="btn-primary" onClick={copyToClipboard}>📋 Copiar</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            className="picker-search"
            placeholder="Buscar ingrediente…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, maxWidth: '300px' }}
          />
          <select
            className="sort-select"
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
            <option value="category">Categoría</option>
            <option value="cost">Precio (mayor a menor)</option>
            <option value="qty">Cantidad</option>
          </select>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          <p>Sin ingredientes en el plan de esta semana</p>
        </div>
      ) : (
        <div>
          {CAT_ORDER.map(cat => {
            if (!grouped[cat]) return null
            return (
              <div key={cat} style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {CAT_LABELS[cat] ?? cat}
                </h3>
                <div>
                  {grouped[cat].map(item => (
                    <div
                      key={item.key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 80px 80px',
                        gap: '1rem',
                        padding: '0.75rem',
                        borderBottom: '1px solid var(--border)',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                          {item.meals.join(', ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 500 }}>{item.qty}</div>
                      <div style={{ textAlign: 'right' }}>${item.cost.toFixed(2)}</div>
                      <div style={{ textAlign: 'right', color: '#8b7355' }}>
                        {Math.round(item.prot)}g prot
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-2)', borderRadius: '0.5rem', textAlign: 'right' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
          Total: <span style={{ color: '#4a7a3a' }}>${totalCost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
