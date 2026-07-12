import { useState, useMemo } from 'react'
import useStore, { selectAllIng } from '../../store/useStore'
import { CAT_ORDER, CAT_LABELS } from '../../data/ingredients'
import { PROTEIN } from '../../data/proteins'
import { PREP, COMBO } from '../../data/combos'
import { ingCost, ingKcal, ingProt, ingFat, comboAgg, fmt, proteinCost, proteinKcal, personLunchScale, comboScalableKey } from '../../engine/calc'

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return `${d.getUTCFullYear()}-W${String(Math.ceil((d - yearStart) / 86400000 / 7)).padStart(2, '0')}`
}

// js getDay(): 0=Sun 1=Mon … 6=Sat → app day key
const DOW_TO_DAYKEY = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

function fmtShortDate(d) {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ─── Batch-window navigation ─────────────────────────────────────────────────
// Two windows per week:
//   "Batch Dom" → covers Lun · Mar · Mié · Jue (4 days, cooked Sunday)
//   "Batch Jue" → covers Vie · Sáb · Dom        (3 days, cooked Thursday)
function getBatchWindow(offset) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dow = today.getDay() // 0=Sun … 6=Sat

  // Is today in the Fri-Sun window?
  const inFriSun = dow === 0 || dow >= 5

  // Start date of the current batch window (a Monday or a Friday)
  const curStart = new Date(today)
  if (inFriSun) {
    const backToFri = dow === 0 ? 2 : dow - 5
    curStart.setDate(today.getDate() - backToFri)
  } else {
    curStart.setDate(today.getDate() - (dow - 1)) // back to Monday
  }

  // Walk forward or backward by `offset` windows
  let start = new Date(curStart)
  let isFriWin = inFriSun
  const step = offset >= 0 ? 1 : -1
  for (let i = 0; i < Math.abs(offset); i++) {
    if (step > 0) {
      start.setDate(start.getDate() + (isFriWin ? 3 : 4))
      isFriWin = !isFriWin
    } else {
      start.setDate(start.getDate() - (isFriWin ? 4 : 3))
      isFriWin = !isFriWin
    }
  }

  const days = isFriWin ? 3 : 4
  const end = new Date(start)
  end.setDate(start.getDate() + days - 1)

  // Build list of { date, wk, dayKey } for each day in this window
  const windowDates = []
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    windowDates.push({ date: d, wk: getISOWeek(d), dayKey: DOW_TO_DAYKEY[d.getDay()] })
  }

  const label = isFriWin ? '☀️ Batch Jue' : '🌙 Batch Dom'
  const rangeLabel = `${fmtShortDate(start)} – ${fmtShortDate(end)}`

  return { start, end, days, isFriWin, windowDates, label, rangeLabel }
}

// Which profiles are active on a specific Date
function profilesActiveOn(profiles, date) {
  return profiles.filter(p => {
    if (p.validoDesde && new Date(p.validoDesde) > date) return false
    if (p.validoHasta && new Date(p.validoHasta) <= date) return false
    return true
  })
}

// Helper to extract quantity from portion object
function getQtyValue(p) {
  if (p.grams != null) return { val: p.grams, unit: 'grams' }
  if (p.units != null) return { val: p.units, unit: 'units' }
  if (p.ml != null) return { val: p.ml, unit: 'ml' }
  if (p.serv != null) return { val: p.serv, unit: 'serv' }
  return { val: 0, unit: 'unknown' }
}

// ─── Week (Mon-Sun) navigation ───────────────────────────────────────────────
function getWeekWindow(offset) {
  const today = new Date(); today.setHours(0,0,0,0)
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const windowDates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    windowDates.push({ date: d, wk: getISOWeek(d), dayKey: DOW_TO_DAYKEY[d.getDay()] })
  }
  return { start: monday, end: sunday, days: 7, isFriWin: false, windowDates, label: '📅 Semana', rangeLabel: `${fmtShortDate(monday)} – ${fmtShortDate(sunday)}` }
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
  const profiles  = useStore(s => s.profiles)

  const [batchOffset, setBatchOffset] = useState(0)
  const [viewMode, setViewMode] = useState('batch') // 'batch' | 'semana'
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('category')

  const batchWindow = useMemo(
    () => viewMode === 'semana' ? getWeekWindow(batchOffset) : getBatchWindow(batchOffset),
    [batchOffset, viewMode]
  )

  // Who's active across this batch window
  const badgeInfo = useMemo(() => {
    const initialsSet = new Set()
    let minN = Infinity, maxN = 0
    batchWindow.windowDates.forEach(({ date }) => {
      const d = new Date(date); d.setHours(0,0,0,0)
      const dp = profilesActiveOn(profiles, d)
      dp.forEach(p => initialsSet.add(p.initial))
      if (dp.length < minN) minN = dp.length
      if (dp.length > maxN) maxN = dp.length
    })
    if (minN === Infinity) minN = 1
    if (maxN === 0) maxN = 1
    return {
      label: minN === maxN ? `×${minN}` : `×${minN}→${maxN}`,
      initials: [...initialsSet].join('+'),
    }
  }, [batchWindow, profiles])

  // Aggregate ingredients for the current batch window only.
  // Fixed ingredients (protein, veggies, toppings) → × dayN (profiles active that day).
  // Scalable bases in comida → sum of each person's personalised portion.
  const aggregatedItems = useMemo(() => {
    const agg = {}

    // persons: { [id]: { name, grams, units, ml, serv, days } }
    function ensureAgg(ingKey) {
      if (!agg[ingKey]) agg[ingKey] = { qtyByUnit: {}, cost: 0, kcal: 0, prot: 0, fat: 0, meals: new Set(), persons: {} }
    }
    function trackPerson(ingKey, person, pp) {
      const ps = agg[ingKey].persons
      if (!ps[person.id]) ps[person.id] = { name: person.name, grams: 0, units: 0, ml: 0, serv: 0, days: 0 }
      ps[person.id].grams += pp.grams ?? 0
      ps[person.id].units += pp.units ?? 0
      ps[person.id].ml    += pp.ml    ?? 0
      ps[person.id].serv  += pp.serv  ?? 0
      ps[person.id].days  += 1
    }
    // perPersonPortion = un-scaled portion for one person (optional)
    function addIng(ingKey, portion, mealTag, perPersonPortion = null, profs = null) {
      ensureAgg(ingKey)
      const { val, unit } = getQtyValue(portion)
      if (!agg[ingKey].qtyByUnit[unit]) agg[ingKey].qtyByUnit[unit] = 0
      agg[ingKey].qtyByUnit[unit] += val
      agg[ingKey].cost += ingCost(ingKey, portion, allIng)
      agg[ingKey].kcal += ingKcal(ingKey, portion, allIng)
      agg[ingKey].prot += ingProt(ingKey, portion, allIng)
      agg[ingKey].fat  += ingFat(ingKey, portion, allIng)
      agg[ingKey].meals.add(mealTag)
      if (perPersonPortion && profs) {
        profs.forEach(p => trackPerson(ingKey, p, perPersonPortion))
      }
    }

    function scaledGramsPortion(p, n) { return { ...p, grams: (p.grams ?? 0) * n } }
    function scaledUnitsPortion(p, n) { return { ...p, units: (p.units ?? 0) * n } }

    batchWindow.windowDates.forEach(({ date, wk, dayKey }) => {
      const weekData = weekPlan[wk] ?? {}
      const dayProfiles = profilesActiveOn(profiles, date)
      const dayN = Math.max(1, dayProfiles.length)

      for (const mealType of ['desayuno', 'comida', 'cena']) {
        const slotKey = `${dayKey}-${mealType}`
        const meal = weekData[slotKey]
        if (!meal) continue
        const mealTag = `${dayKey} ${mealType}`

        if (meal.type === 'desayuno') {
          const recipe = allCombos[meal.recipeKey]
          if (!recipe) continue
          recipe.items.forEach(it => {
            const p = it.p
            if (p.grams != null) addIng(it.k, scaledGramsPortion(p, dayN), mealTag, p, dayProfiles)
            else if (p.units != null) addIng(it.k, scaledUnitsPortion(p, dayN), mealTag, p, dayProfiles)
            else addIng(it.k, p, mealTag, null, null)
          })
        } else if (meal.type === 'plato') {
          // ── Protein ────────────────────────────────────────────────────────
          const protein = PROTEIN[meal.proteinKey]
          if (protein) {
            const ration = protein.ration
            if (ration.grams != null) {
              const ingKey = meal.proteinKey
              ensureAgg(ingKey)
              const totalGrams = ration.grams * dayN
              if (!agg[ingKey].qtyByUnit['grams']) agg[ingKey].qtyByUnit['grams'] = 0
              agg[ingKey].qtyByUnit['grams'] += totalGrams
              agg[ingKey].cost += proteinCost(protein) * dayN
              agg[ingKey].kcal += proteinKcal(protein) * dayN
              agg[ingKey].prot += (protein.prot ?? 0) * totalGrams / 100
              agg[ingKey].meals.add(mealTag)
              dayProfiles.forEach(p => trackPerson(ingKey, p, { grams: ration.grams }))
            } else if (ration.units != null) {
              const ingKey = meal.proteinKey === 'huevos' ? 'huevo' : meal.proteinKey
              const perPerson = meal.proteinUnits ?? ration.units
              ensureAgg(ingKey)
              if (!agg[ingKey].qtyByUnit['units']) agg[ingKey].qtyByUnit['units'] = 0
              agg[ingKey].qtyByUnit['units'] += perPerson * dayN
              agg[ingKey].cost += proteinCost(protein, false, meal.proteinUnits) * dayN
              agg[ingKey].kcal += proteinKcal(protein, false, meal.proteinUnits) * dayN
              agg[ingKey].prot += (protein.protu ?? 0) * perPerson * dayN
              agg[ingKey].meals.add(mealTag)
              dayProfiles.forEach(p => trackPerson(ingKey, p, { units: perPerson }))
            } else if (ration.flat != null) {
              const ingKey = meal.proteinKey
              ensureAgg(ingKey)
              if (!agg[ingKey].qtyByUnit['serv']) agg[ingKey].qtyByUnit['serv'] = 0
              agg[ingKey].qtyByUnit['serv'] += dayN
              agg[ingKey].cost += proteinCost(protein) * dayN
              agg[ingKey].kcal += proteinKcal(protein) * dayN
              agg[ingKey].prot += (protein.protf ?? 0) * dayN
              agg[ingKey].meals.add(mealTag)
              dayProfiles.forEach(p => trackPerson(ingKey, p, { serv: 1 }))
            }
          }
          // ── Prep ──────────────────────────────────────────────────────────
          const prep = meal.prepKey ? PREP[meal.prepKey] : null
          if (prep) {
            prep.items.forEach(it => {
              const p = it.p
              if (p.grams != null) addIng(it.k, scaledGramsPortion(p, dayN), mealTag, p, dayProfiles)
              else if (p.units != null) addIng(it.k, scaledUnitsPortion(p, dayN), mealTag, p, dayProfiles)
              else addIng(it.k, p, mealTag, null, null)
            })
          }
          // ── Combo ─────────────────────────────────────────────────────────
          const combo = allCombos[meal.comboKey]
          if (combo) {
            const scalableKey = mealType === 'comida' ? comboScalableKey(combo, allIng) : null
            const day = Object.fromEntries(
              ['desayuno', 'comida', 'cena'].map(m => [m, weekData[`${dayKey}-${m}`] ?? null])
            )
            combo.items.forEach(it => {
              if (it.k === scalableKey && it.p.grams != null) {
                // Scalable base: track personalized grams per person
                let totalGrams = 0
                dayProfiles.forEach(person => {
                  const scale = personLunchScale(day, person, allIng, allCombos)
                  const pg = scale ? scale.grams : (it.p.grams ?? 0)
                  totalGrams += pg
                  ensureAgg(it.k)
                  trackPerson(it.k, person, { grams: pg })
                })
                addIng(it.k, { ...it.p, grams: totalGrams }, mealTag)
              } else {
                const p = it.p
                if (p.grams != null) addIng(it.k, scaledGramsPortion(p, dayN), mealTag, p, dayProfiles)
                else if (p.units != null) addIng(it.k, scaledUnitsPortion(p, dayN), mealTag, p, dayProfiles)
                else addIng(it.k, p, mealTag, null, null)
              }
            })
            if (combo.optionalItems && meal.comboOptionals?.length > 0) {
              combo.optionalItems
                .filter(oi => meal.comboOptionals.includes(oi.k))
                .forEach(it => {
                  const p = it.p
                  if (p.grams != null) addIng(it.k, scaledGramsPortion(p, dayN), mealTag, p, dayProfiles)
                  else if (p.units != null) addIng(it.k, scaledUnitsPortion(p, dayN), mealTag, p, dayProfiles)
                  else addIng(it.k, p, mealTag, null, null)
                })
            }
          }
        }
      }    // end mealType loop
    })     // end windowDates.forEach

    return agg
  }, [weekPlan, batchWindow, allCombos, allIng, profiles])

  // Group by category and filter
  const grouped = useMemo(() => {
    const categories = {}

    Object.entries(aggregatedItems).forEach(([ingKey, data]) => {
      // allIng covers combos/misc; proteins like lomo/pollo live only in PROTEIN
      const ing = allIng[ingKey]
        ?? (PROTEIN[ingKey] ? { name: PROTEIN[ingKey].name, cat: 'proteina' } : null)
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

      // Build per-person breakdown string: "Julio 150g×3d · María 150g×3d"
      const personEntries = Object.values(data.persons ?? {})
      let breakdown = ''
      if (personEntries.length > 0) {
        const parts = personEntries.map(ps => {
          let q = ''
          if (ps.grams > 0) q = `${Math.round(ps.grams / ps.days)}g`
          else if (ps.units > 0) q = `${+(ps.units / ps.days).toFixed(1)} ud`
          else if (ps.ml > 0) q = `${Math.round(ps.ml / ps.days)}ml`
          else if (ps.serv > 0) q = `${+(ps.serv / ps.days).toFixed(1)} rac`
          return q ? `${ps.name}: ${q}×${ps.days}d` : null
        }).filter(Boolean)
        // Collapse identical entries: "Julio: 150g×3d · María: 150g×3d" → "Julio+María: 150g×3d"
        const seen = {}
        parts.forEach(p => { const [, v] = p.split(': '); if (!seen[v]) seen[v] = []; seen[v].push(p.split(': ')[0]) })
        breakdown = Object.entries(seen).map(([v, names]) => `${names.join('+')}: ${v}`).join(' · ')
      }

      categories[cat].push({
        key: ingKey,
        name: ing.name,
        brand: ing.brand,
        store: ing.store,
        qty: qtyStr,
        cost: data.cost,
        kcal: data.kcal,
        prot: data.prot,
        fat: data.fat,
        meals: Array.from(data.meals),
        breakdown,
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
    let text = `Lista de la compra - ${batchWindow.label} ${batchWindow.rangeLabel}\n\n`
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
              {batchWindow.label} · {batchWindow.rangeLabel} — Total: ${totalCost.toFixed(2)}
              <span style={{ marginLeft: '0.75rem', background: 'rgba(154,123,67,0.12)', color: 'var(--t-accent)', borderRadius: '99px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                {badgeInfo.label} {badgeInfo.initials}
              </span>
            </p>
          </div>
          <div className="sl-nav-row">
            <div className="sl-nav-week">
              <button className="btn-ghost sl-nav-btn" onClick={() => setBatchOffset(w => w - 1)}>←</button>
              <button className="btn-ghost sl-nav-btn" onClick={() => setBatchOffset(0)}>Hoy</button>
              <button className="btn-ghost sl-nav-btn" onClick={() => setBatchOffset(w => w + 1)}>→</button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['batch', 'Batch'], ['semana', 'Semana']].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); setBatchOffset(0) }}
                  style={{
                    fontSize: '0.72rem', padding: '3px 10px', borderRadius: '99px', cursor: 'pointer',
                    border: viewMode === mode ? '1px solid var(--t-accent)' : '1px solid var(--t-border)',
                    background: viewMode === mode ? 'rgba(154,123,67,0.12)' : 'var(--t-surface)',
                    color: viewMode === mode ? 'var(--t-text)' : 'var(--t-text-soft)',
                    fontWeight: viewMode === mode ? 600 : 400,
                  }}
                >{label}</button>
              ))}
            </div>
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
                    <div key={item.key} className="sl-row">
                      <div className="sl-row-name">
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        {item.brand && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--t-accent)', fontWeight: 600, marginTop: '0.15rem' }}>
                            {item.brand}
                            <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {item.store}</span>
                          </div>
                        )}
                        {item.breakdown && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--t-accent)', fontWeight: 600, marginTop: '0.15rem' }}>
                            {item.breakdown}
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                          {item.meals.join(', ')}
                        </div>
                      </div>
                      <div className="sl-row-qty">{item.qty}</div>
                      <div className="sl-row-cost">${item.cost.toFixed(2)}</div>
                      <div className="sl-row-prot">{Math.round(item.prot)}g prot</div>
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
