import { useState, useMemo, useEffect, Fragment } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { PROTEIN } from '../../data/proteins'
import { PREP, COMBO_SETS } from '../../data/combos'
import { comboAgg, fmt, proteinCost, proteinKcal, proteinProt, ingKcal, ingCost, fmtPortion, personLunchScale, dayKcal } from '../../engine/calc'

// Utility to get ISO week key from date
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return `${d.getUTCFullYear()}-W${String(Math.ceil((d - yearStart) / 86400000 / 7)).padStart(2, '0')}`
}

// Get actual dates for a week (Monday to Sunday)
function getWeekDates(weekOffset) {
  const now = new Date()
  const target = new Date(now.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000)

  // Get Monday of that week
  const day = target.getDay()
  const diff = target.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(target.setDate(diff))

  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

// Format date as "16 jun"
function formatDateShort(date) {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

// Check if date is today
function isToday(date) {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

// Days and meals
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_KEYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
const MEALS = ['desayuno', 'comida', 'cena']
const MEAL_LABELS = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena' }
const MONTH_INITIALS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

// ─── Batch windows (partición limpia de la semana, misma ISO week) ────────────
// Domingo: cocinas el dom anterior y comes lun→mar→mié→jue (4 días).
// Jueves:  cocinas el jue y comes vie→sáb→dom (3 días).
// Juntos cubren los 7 días sin solaparse ni cruzar de semana.
const BATCH_SUN_DAYS = ['lun', 'mar', 'mié', 'jue']   // 4 días
const BATCH_THU_DAYS = ['vie', 'sáb', 'dom']          // 3 días
const SUN_BATCH_ANCHORS = new Set(['lun', 'mar', 'mié', 'jue'])

// Returns which batch type a given anchor day belongs to.
function batchTypeFor(dayKey) {
  return SUN_BATCH_ANCHORS.has(dayKey) ? 'sun' : 'thu'
}

// Display-only list for the toggle label.
function batchDisplayDays(dayKey) {
  return SUN_BATCH_ANCHORS.has(dayKey) ? BATCH_SUN_DAYS : BATCH_THU_DAYS
}

// Opt-in segmented control shown at the confirm step of the meal picker.
function BatchApplyToggle({ dayKey, value, onChange }) {
  const days = batchDisplayDays(dayKey)
  const cookLabel = SUN_BATCH_ANCHORS.has(dayKey) ? 'domingo' : 'jueves'
  const pill = (active) => ({
    fontSize: '0.72rem', padding: '4px 12px', borderRadius: '99px',
    border: active ? '1px solid var(--t-accent)' : '1px solid var(--t-border)',
    background: active ? 'rgba(154,123,67,0.12)' : 'var(--t-surface)',
    color: active ? 'var(--t-text)' : 'var(--t-text-soft)',
    fontWeight: active ? 600 : 400, cursor: 'pointer',
  })
  return (
    <div style={{ marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-text-faint)' }}>Aplicar a</span>
      <div style={{ display: 'flex', gap: 5 }}>
        <button type="button" style={pill(!value)} onClick={() => onChange(false)}>Solo este día</button>
        <button type="button" style={pill(value)} onClick={() => onChange(true)} title={`Batch ${cookLabel}: ${days.join(' · ')}`}>
          Batch · {days.length} días
        </button>
      </div>
    </div>
  )
}

// ─── Category maps for picker ─────────────────────────────────────────────────
const DESAYUNO_TAG_ORDER  = ['batido', 'yogur', 'huevo', 'tortita', 'batch', 'ocasional']
const DESAYUNO_TAG_LABELS = { batido: 'Batidos', yogur: 'Bowls & Yogur', huevo: 'Huevos', tortita: 'Tortitas & pancakes', batch: 'Batch & especiales', ocasional: 'Ocasional' }

const PROTEIN_CAT_MAP = {
  'carne-picada': 'carnes', 'cerdo-picado': 'carnes', 'lamb': 'carnes', 'lomo': 'carnes',
  'pollo': 'aves',
  'bacalao': 'pescado', 'calamares': 'pescado', 'pollock': 'pescado', 'langosta': 'pescado',
  'sardinas': 'lata', 'caballa': 'lata',
  'mejillones': 'marisco', 'ostras': 'marisco', 'pulpo': 'marisco',
  'salchichas': 'carnes',
  'higado-bacalao': 'visceras', 'higado-vaca': 'visceras',
  'huevos': 'huevos',
}
const PROTEIN_CAT_ORDER  = ['carnes', 'aves', 'pescado', 'lata', 'marisco', 'visceras', 'huevos']
const PROTEIN_CAT_LABELS = {
  carnes:   '🥩 Carnes',
  aves:     '🐓 Aves',
  pescado:  '🐟 Pescado',
  lata:     '🐠 Pescado en lata',
  marisco:  '🦪 Marisco',
  visceras: '🫀 Vísceras',
  huevos:   '🥚 Huevos',
}

// Small meal-type indicator for the protein picker
function mealTag(meals) {
  const m = meals ?? ['comida']
  const hasC  = m.includes('comida')
  const hasCe = m.includes('cena')
  if (hasC && hasCe) return '🍽️🌙'
  if (hasC)  return '🍽️'
  if (hasCe) return '🌙'
  return ''
}

const COMBO_BASE_ORDER  = ['legumbres', 'patata', 'arroz', 'pasta', 'otros']
const COMBO_BASE_LABELS = {
  legumbres: '🫘 Legumbres',
  patata:    '🥔 Patata',
  arroz:     '🍚 Arroz',
  pasta:     '🍝 Pasta',
  otros:     '🥗 Otros',
}

// ─── Meal selector modal ──────────────────────────────────────────────────────
function ComboDetailModal({ combo, allIng, onConfirm, onClose }) {
  const [selectedOptionals, setSelectedOptionals] = useState([])
  const hasOptionals = (combo.optionalItems ?? []).length > 0

  const toggleOptional = (k) =>
    setSelectedOptionals(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])

  const agg = comboAgg(combo, allIng, {}, {}, selectedOptionals)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3>{combo.name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--t-text-faint)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Costo</div>
              <div style={{ fontFamily: 'var(--t-font-display)', fontSize: '1.25rem', fontWeight: 300 }}>{fmt(agg.cost)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--t-text-faint)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>kcal</div>
              <div style={{ fontFamily: 'var(--t-font-display)', fontSize: '1.25rem', fontWeight: 300 }}>{Math.round(agg.kcal)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--t-text-faint)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>proteína</div>
              <div style={{ fontFamily: 'var(--t-font-display)', fontSize: '1.25rem', fontWeight: 300 }}>{Math.round(agg.prot)}g</div>
            </div>
          </div>

          <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t-text-faint)', marginBottom: '0.75rem' }}>Ingredientes</div>
          {(combo.items ?? []).map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.5rem 0', borderBottom: '1px solid var(--t-border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--t-text)' }}>{allIng[it.k]?.name ?? it.k}</span>
              <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, marginLeft: '1rem', fontSize: '0.72rem', color: 'var(--t-text-faint)' }}>
                <span>{fmtPortion(it.p)}</span>
                {ingKcal(it.k, it.p, allIng) > 0 && <span style={{ minWidth: '42px', textAlign: 'right' }}>{Math.round(ingKcal(it.k, it.p, allIng))} kcal</span>}
              </div>
            </div>
          ))}

          {hasOptionals && (
            <>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t-accent)', marginTop: '1.25rem', marginBottom: '0.6rem' }}>
                Extras opcionales
              </div>
              {combo.optionalItems.map(oi => {
                const checked = selectedOptionals.includes(oi.k)
                const oiCost  = ingCost(oi.k, oi.p, allIng)
                const oiKcal  = ingKcal(oi.k, oi.p, allIng)
                return (
                  <div
                    key={oi.k}
                    onClick={() => toggleOptional(oi.k)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5rem 0.6rem', marginBottom: '0.3rem', borderRadius: '8px',
                      cursor: 'pointer',
                      background: checked ? 'rgba(154,123,67,0.10)' : 'var(--t-surface-alt, rgba(0,0,0,0.03))',
                      border: checked ? '1px solid var(--t-accent)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: checked ? 'none' : '1.5px solid var(--t-border)',
                        background: checked ? 'var(--t-accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {checked && <span style={{ color: '#fff', fontSize: '0.65rem', lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--t-text)' }}>{allIng[oi.k]?.name ?? oi.k}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--t-text-faint)', flexShrink: 0, marginLeft: 8 }}>
                      {fmtPortion(oi.p)}
                      {oiCost > 0 && <span style={{ marginLeft: 6 }}>+{fmt(oiCost)}</span>}
                      {oiKcal > 0 && <span style={{ marginLeft: 4 }}>· +{Math.round(oiKcal)} kcal</span>}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => { onConfirm(combo.key, selectedOptionals); onClose() }}>Seleccionar</button>
        </div>
      </div>
    </div>
  )
}

function MealSelectorModal({ allIng, allCombos, onSelect, onClose, dayKey, mealType, initialApplyToBatch = false }) {
  const [step, setStep] = useState(mealType === 'desayuno' ? 'recipe' : 'protein')
  const [selectedProtein, setSelectedProtein] = useState(null)
  const [selectedProteinUnits, setSelectedProteinUnits] = useState(null)
  const [selectedPrep, setSelectedPrep] = useState(null)
  const [selectedCombo, setSelectedCombo] = useState(null)
  const [search, setSearch] = useState('')
  const [comboDetail, setComboDetail] = useState(null)
  const [recipeDetail, setRecipeDetail] = useState(null)
  const [sortBy, setSortBy] = useState('default')       // protein picker: 'default' | 'value'
  const [comboSortBy, setComboSortBy] = useState('default') // combo picker: 'default' | 'price'
  // Context-aware default: ON when the rest of this batch window is empty
  // (building the batch) · OFF when siblings are already filled (one-off tweak).
  const [applyToBatch, setApplyToBatch] = useState(initialApplyToBatch)

  // Desayuno: grouped by tag
  const groupedDesayunos = useMemo(() => {
    const all = Object.entries(allCombos)
      .filter(([k, c]) => k.startsWith('desayuno-') || c.desayuno === true)
      .map(([k, c]) => ({ key: k, ...c }))
    const q = search.toLowerCase()
    const filtered = q ? all.filter(r => r.name.toLowerCase().includes(q)) : all
    const grouped = {}
    for (const r of filtered) {
      const tag = r.tag ?? 'otros'
      if (!grouped[tag]) grouped[tag] = []
      grouped[tag].push(r)
    }
    return DESAYUNO_TAG_ORDER.filter(t => grouped[t]).map(t => ({ tag: t, label: DESAYUNO_TAG_LABELS[t] ?? t, items: grouped[t] }))
  }, [allCombos, search])

  // Step 1: proteins grouped by category
  const groupedProteins = useMemo(() => {
    const list = Object.entries(PROTEIN)
      .filter(([, p]) => (p.meals ?? ['comida']).includes(mealType))
      .map(([k, p]) => ({ key: k, ...p }))
    const q = search.toLowerCase()
    const filtered = q ? list.filter(p => p.name.toLowerCase().includes(q)) : list
    const grouped = {}
    for (const p of filtered) {
      const cat = PROTEIN_CAT_MAP[p.key] ?? 'otros'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(p)
    }
    return PROTEIN_CAT_ORDER.filter(c => grouped[c]).map(c => ({ cat: c, label: PROTEIN_CAT_LABELS[c] ?? c, items: grouped[c] }))
  }, [mealType, search])

  // Flat list sorted by $/g protein (cheapest per gram of protein first)
  const sortedByValue = useMemo(() => {
    const list = Object.entries(PROTEIN)
      .filter(([, p]) => (p.meals ?? ['comida']).includes(mealType))
      .map(([k, p]) => ({ key: k, ...p }))
    const q = search.toLowerCase()
    const filtered = q ? list.filter(p => p.name.toLowerCase().includes(q)) : list
    return filtered
      .map(p => {
        const cost = proteinCost(p)
        const prot = proteinProt(p)
        return { ...p, _costPerG: prot > 0 ? cost / prot : Infinity }
      })
      .sort((a, b) => a._costPerG - b._costPerG)
  }, [mealType, search])

  // Step 2: Select prep (if protein has preps)
  const prepList = selectedProtein ? (PROTEIN[selectedProtein]?.preps ?? []) : []

  // Step 3: Select combo — all non-desayuno combos from allCombos (includes
  // custom combos created in the Combinaciones tab and all static ones).
  const allNonBreakfastCombos = useMemo(() => {
    const q = search.toLowerCase()
    const list = Object.entries(allCombos)
      .filter(([k, c]) => !k.startsWith('desayuno-') && !c.desayuno)
      .map(([k, c]) => ({ key: k, ...c }))
    return q ? list.filter(c => c.name.toLowerCase().includes(q)) : list
  }, [allCombos, search])

  const groupedCombos = useMemo(() => {
    const grouped = {}
    for (const c of allNonBreakfastCombos) {
      const base = c.base ?? 'otros'
      if (!grouped[base]) grouped[base] = []
      grouped[base].push(c)
    }
    // Show known bases first, then any unknown ones at the end
    const known = COMBO_BASE_ORDER.filter(b => grouped[b]).map(b => ({ base: b, label: COMBO_BASE_LABELS[b] ?? b, items: grouped[b] }))
    const unknown = Object.keys(grouped).filter(b => !COMBO_BASE_ORDER.includes(b)).map(b => ({ base: b, label: b, items: grouped[b] }))
    return [...known, ...unknown]
  }, [allNonBreakfastCombos])

  // Flat combo list sorted by price (cheapest first)
  const sortedCombosByPrice = useMemo(() => {
    return allNonBreakfastCombos
      .map(c => ({ ...c, _cost: comboAgg(c, allIng).cost }))
      .sort((a, b) => a._cost - b._cost)
  }, [allNonBreakfastCombos, allIng])

  function confirmMeal(comboKeyOverride = null, recipeKeyOverride = null, optionalsOverride = []) {
    if (mealType === 'desayuno') {
      onSelect({ type: 'desayuno', recipeKey: recipeKeyOverride ?? selectedPrep }, applyToBatch)
    } else {
      const units = selectedProteinUnits ?? PROTEIN[selectedProtein]?.ration?.units ?? null
      onSelect({ type: 'plato', proteinKey: selectedProtein, prepKey: selectedPrep || null, comboKey: comboKeyOverride ?? selectedCombo, comboOptionals: optionalsOverride, proteinUnits: units }, applyToBatch)
    }
    onClose()
  }

  if (mealType === 'desayuno') {
    return (
      <Fragment>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-dialog" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Selecciona desayuno</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <input
              className="picker-search"
              placeholder="Buscar receta…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="recipe-list">
              {groupedDesayunos.map(({ tag, label, items }) => (
                <div key={tag}>
                  <div className="picker-cat-label">{label}</div>
                  {items.map(recipe => {
                    const agg = comboAgg(recipe, allIng)
                    return (
                      <div
                        key={recipe.key}
                        className={`recipe-option${selectedPrep === recipe.key ? ' selected' : ''}`}
                        onClick={() => setRecipeDetail(recipe)}
                      >
                        <div className="ro-name">{recipe.name}</div>
                        <div className="ro-stats">
                          {fmt(agg.cost)} · {Math.round(agg.kcal)} kcal · {Math.round(agg.prot)}g prot
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <BatchApplyToggle dayKey={dayKey} value={applyToBatch} onChange={setApplyToBatch} />
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button
              className="btn-primary"
              disabled={!selectedPrep}
              onClick={confirmMeal}
            >
              Confirmar
            </button>
          </div>
        </div>
        {recipeDetail && (
          <ComboDetailModal
            combo={recipeDetail}
            allIng={allIng}
            onConfirm={(key, _opts) => {
              setSelectedPrep(key)
              confirmMeal(null, key, [])
            }}
            onClose={() => setRecipeDetail(null)}
          />
        )}
      </div>
      </Fragment>
    )
  }

  // Plato workflow
  return (
    <Fragment>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {step === 'protein' && 'Selecciona proteína'}
            {step === 'prep' && 'Selecciona preparación'}
            {step === 'combo' && 'Selecciona combinación'}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {step === 'protein' && (
            <>
              <input
                className="picker-search"
                placeholder="Buscar proteína…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 6, margin: '0.5rem 0 0.6rem' }}>
                {[['default', 'Por categoría'], ['value', '$/g proteína ↑']].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSortBy(key)}
                    style={{
                      fontSize: '0.68rem', padding: '3px 10px', borderRadius: '99px',
                      border: sortBy === key ? '1px solid var(--t-accent)' : '1px solid var(--t-border)',
                      background: sortBy === key ? 'rgba(154,123,67,0.12)' : 'var(--t-surface)',
                      color: sortBy === key ? 'var(--t-text)' : 'var(--t-text-soft)',
                      fontWeight: sortBy === key ? 600 : 400, cursor: 'pointer',
                    }}
                  >{label}</button>
                ))}
              </div>
              <div className="protein-list">
                {sortBy === 'value' ? (
                  sortedByValue.map(protein => (
                    <div key={protein.key}>
                      <div
                        className={`protein-option${selectedProtein === protein.key ? ' selected' : ''}`}
                        onClick={() => { setSelectedProtein(protein.key); setSelectedProteinUnits(null) }}
                      >
                        <div className="po-name">
                          {protein.name}
                          <span style={{ marginLeft: 5, fontSize: '0.7em', opacity: 0.7 }}>{mealTag(protein.meals)}</span>
                        </div>
                        <div className="po-detail">
                          {fmt(proteinCost(protein))} · {Math.round(proteinProt(protein))}g
                          <span style={{ marginLeft: 6, color: 'var(--t-accent)', fontWeight: 600 }}>
                            {fmt(protein._costPerG)}/g
                          </span>
                        </div>
                      </div>
                      {selectedProtein === protein.key && protein.variableRation && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 8px', background: 'rgba(154,123,67,0.06)', borderRadius: '0 0 8px 8px', marginTop: -4 }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--t-text-soft)' }}>Unidades:</span>
                          {protein.variableRation.map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={e => { e.stopPropagation(); setSelectedProteinUnits(n) }}
                              style={{
                                width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                                background: (selectedProteinUnits ?? protein.ration.units) === n ? 'var(--t-accent)' : 'var(--t-surface)',
                                color: (selectedProteinUnits ?? protein.ration.units) === n ? '#fff' : 'var(--t-text)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                              }}
                            >{n}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  groupedProteins.map(({ cat, label, items }) => (
                    <div key={cat}>
                      <div className="picker-cat-label">{label}</div>
                      {items.map(protein => (
                        <div key={protein.key}>
                          <div
                            className={`protein-option${selectedProtein === protein.key ? ' selected' : ''}`}
                            onClick={() => { setSelectedProtein(protein.key); setSelectedProteinUnits(null) }}
                          >
                            <div className="po-name">
                              {protein.name}
                              <span style={{ marginLeft: 5, fontSize: '0.7em', opacity: 0.7 }}>{mealTag(protein.meals)}</span>
                            </div>
                            <div className="po-detail">{fmt(proteinCost(protein))} · {Math.round(proteinProt(protein))}g</div>
                          </div>
                          {selectedProtein === protein.key && protein.variableRation && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 8px', background: 'rgba(154,123,67,0.06)', borderRadius: '0 0 8px 8px', marginTop: -4 }}>
                              <span style={{ fontSize: '0.78rem', color: 'var(--t-text-soft)' }}>Unidades:</span>
                              {protein.variableRation.map(n => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={e => { e.stopPropagation(); setSelectedProteinUnits(n) }}
                                  style={{
                                    width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                                    background: (selectedProteinUnits ?? protein.ration.units) === n ? 'var(--t-accent)' : 'var(--t-surface)',
                                    color: (selectedProteinUnits ?? protein.ration.units) === n ? '#fff' : 'var(--t-text)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                  }}
                                >{n}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {step === 'prep' && (
            <>
              <div className="prep-list">
                {prepList.length === 0 ? (
                  <div className="combo-empty">Sin preparaciones especiales</div>
                ) : (
                  prepList.map(prepKey => {
                    const prep = PREP[prepKey]
                    return (
                      <div
                        key={prepKey}
                        className={`prep-option${selectedPrep === prepKey ? ' selected' : ''}`}
                        onClick={() => setSelectedPrep(prepKey)}
                      >
                        <div className="po-name">{prep?.name ?? prepKey}</div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {step === 'combo' && (
            <>
              <input
                className="picker-search"
                placeholder="Buscar combinación…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 6, margin: '0.5rem 0 0.6rem' }}>
                {[['default', 'Por base'], ['price', 'Precio ↑']].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setComboSortBy(key)}
                    style={{
                      fontSize: '0.68rem', padding: '3px 10px', borderRadius: '99px',
                      border: comboSortBy === key ? '1px solid var(--t-accent)' : '1px solid var(--t-border)',
                      background: comboSortBy === key ? 'rgba(154,123,67,0.12)' : 'var(--t-surface)',
                      color: comboSortBy === key ? 'var(--t-text)' : 'var(--t-text-soft)',
                      fontWeight: comboSortBy === key ? 600 : 400, cursor: 'pointer',
                    }}
                  >{label}</button>
                ))}
              </div>
              <div className="combo-list">
                {comboSortBy === 'price' ? (
                  sortedCombosByPrice.length === 0
                    ? <div className="combo-empty">No hay combinaciones disponibles</div>
                    : sortedCombosByPrice.map(combo => (
                        <div
                          key={combo.key}
                          className={`combo-option${selectedCombo === combo.key ? ' selected' : ''}`}
                          onClick={() => setComboDetail(combo)}
                        >
                          <div className="co-name">{combo.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--t-text-faint)', marginTop: 2 }}>{fmt(combo._cost)}</div>
                        </div>
                      ))
                ) : (
                  groupedCombos.length === 0
                    ? <div className="combo-empty">No hay combinaciones disponibles</div>
                    : groupedCombos.map(({ base, label, items }) => (
                        <div key={base}>
                          <div className="picker-cat-label">{label}</div>
                          {items.map(combo => (
                            <div
                              key={combo.key}
                              className={`combo-option${selectedCombo === combo.key ? ' selected' : ''}`}
                              onClick={() => setComboDetail(combo)}
                            >
                              <div className="co-name">{combo.name}</div>
                            </div>
                          ))}
                        </div>
                      ))
                )}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {step === 'combo' && (
            <BatchApplyToggle dayKey={dayKey} value={applyToBatch} onChange={setApplyToBatch} />
          )}
          <button
            className="btn-ghost"
            onClick={() => {
              if (step === 'protein') onClose()
              else if (step === 'prep') { setSearch(''); setStep('protein') }
              else {
                setSearch('')
                const hasPre = (PROTEIN[selectedProtein]?.preps?.length ?? 0) > 0
                setStep(hasPre ? 'prep' : 'protein')
              }
            }}
          >
            ← Atrás
          </button>
          <button
            className="btn-primary"
            disabled={
              (step === 'protein' && !selectedProtein) ||
              (step === 'prep' && !selectedPrep && prepList.length > 0) ||
              (step === 'combo' && !selectedCombo)
            }
            onClick={() => {
              if (step === 'protein') {
                const prepLen = PROTEIN[selectedProtein]?.preps?.length ?? 0
                setSearch('')
                setStep(prepLen > 0 ? 'prep' : 'combo')
              } else if (step === 'prep') {
                setSearch('')
                setStep('combo')
              } else {
                confirmMeal()
              }
            }}
          >
            {step === 'combo' ? 'Confirmar' : 'Siguiente →'}
          </button>
        </div>
      </div>
      {comboDetail && (
        <ComboDetailModal
          combo={comboDetail}
          allIng={allIng}
          onConfirm={(comboKey, opts) => {
            setSelectedCombo(comboKey)
            confirmMeal(comboKey, null, opts)
          }}
          onClose={() => setComboDetail(null)}
        />
      )}
    </div>
    </Fragment>
  )
}

// ─── Meal slot cell ──────────────────────────────────────────────────────────
function getMealDetails(meal, allIng, allCombos) {
  if (!meal) return { title: '', cost: 0, kcal: 0, protein: 0 }

  if (meal.type === 'desayuno') {
    const recipe = allCombos[meal.recipeKey]
    if (!recipe) return { title: 'Desayuno no encontrado', cost: 0, kcal: 0, protein: 0 }
    const agg = comboAgg(recipe, allIng)
    return { title: recipe.name, cost: agg.cost, kcal: agg.kcal, protein: agg.prot ?? 0 }
  }

  if (meal.type === 'plato') {
    const protein = PROTEIN[meal.proteinKey]
    const combo = allCombos[meal.comboKey]
    if (!protein || !combo) return { title: 'Plato incompleto', cost: 0, kcal: 0, protein: 0 }
    const protCost = proteinCost(protein, false, meal.proteinUnits)
    const protKcal = proteinKcal(protein, false, meal.proteinUnits)
    const protProt = proteinProt(protein, false, meal.proteinUnits)
    const combAgg = comboAgg(combo, allIng, meal.comboVariants || {}, {}, meal.comboOptionals || [])
    return {
      title: `${protein.name} + ${combo.name}`,
      cost: protCost + combAgg.cost,
      kcal: protKcal + combAgg.kcal + 235,
      protein: protProt + (combAgg.prot ?? 0),
    }
  }

  return { title: 'Comida sin datos', cost: 0, kcal: 0, protein: 0 }
}

// ─── Meal detail modal (read-only view of a filled slot) ─────────────────────
function MealDetailModal({ meal, allIng, allCombos, onEdit, onClose }) {
  if (!meal) return null

  // ---- Desayuno ----
  if (meal.type === 'desayuno') {
    const recipe = allCombos[meal.recipeKey]
    if (!recipe) return null
    const agg = comboAgg(recipe, allIng)
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
          <div className="modal-header">
            <h3>{recipe.name}</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            {/* Stats */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem' }}>
              {[['Coste', '$' + agg.cost.toFixed(2)], ['kcal', Math.round(agg.kcal)], ['Proteína', Math.round(agg.prot) + 'g']].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--t-text-faint)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{l}</div>
                  <div style={{ fontFamily: 'var(--t-font-display)', fontSize: '1.2rem', fontWeight: 300 }}>{v}</div>
                </div>
              ))}
            </div>
            {/* Ingredients */}
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t-text-faint)', marginBottom: '0.6rem' }}>Ingredientes</div>
            {(recipe.items ?? []).map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.45rem 0', borderBottom: '1px solid var(--t-border)' }}>
                <span style={{ fontSize: '0.82rem' }}>{allIng[it.k]?.name ?? it.k}</span>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--t-text-faint)', flexShrink: 0, marginLeft: '1rem' }}>
                  <span>{fmtPortion(it.p)}</span>
                  {ingKcal(it.k, it.p, allIng) > 0 && <span style={{ minWidth: '44px', textAlign: 'right' }}>{Math.round(ingKcal(it.k, it.p, allIng))} kcal</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={onClose}>Cerrar</button>
            <button className="btn-primary" onClick={() => { onClose(); onEdit() }}>✏️ Cambiar</button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Plato ----
  if (meal.type === 'plato') {
    const protein = PROTEIN[meal.proteinKey]
    const combo   = allCombos[meal.comboKey]
    if (!protein || !combo) return null
    const pCost = proteinCost(protein, false, meal.proteinUnits)
    const pKcal = proteinKcal(protein, false, meal.proteinUnits)
    const pProt = proteinProt(protein, false, meal.proteinUnits)
    const cAgg  = comboAgg(combo, allIng, meal.comboVariants || {}, {}, meal.comboOptionals || [])
    const totalCost = pCost + cAgg.cost
    const totalKcal = pKcal + cAgg.kcal + 235
    const totalProt = pProt + (cAgg.prot ?? 0)
    // Protein portion label
    const r = protein.ration
    const portionLabel = r.grams != null ? `${r.grams}g`
      : r.units != null ? `${meal.proteinUnits ?? r.units} ud`
      : r.flat  != null ? `(precio fijo)`
      : '—'

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
          <div className="modal-header">
            <h3>{protein.name} + {combo.name}</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            {/* Totals */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem' }}>
              {[['Coste', '$' + totalCost.toFixed(2)], ['kcal', Math.round(totalKcal)], ['Proteína', Math.round(totalProt) + 'g']].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--t-text-faint)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{l}</div>
                  <div style={{ fontFamily: 'var(--t-font-display)', fontSize: '1.2rem', fontWeight: 300 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Protein block */}
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t-text-faint)', marginBottom: '0.5rem' }}>
              Proteína
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.45rem 0', borderBottom: '1px solid var(--t-border)', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{protein.name}</span>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--t-text-faint)', flexShrink: 0 }}>
                <span>{portionLabel}</span>
                <span style={{ minWidth: '44px', textAlign: 'right' }}>{Math.round(pKcal)} kcal</span>
              </div>
            </div>

            {/* Combo block */}
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t-text-faint)', marginBottom: '0.5rem' }}>
              {combo.name}
            </div>
            {(combo.items ?? []).map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.4rem 0', borderBottom: '1px solid var(--t-border)' }}>
                <span style={{ fontSize: '0.8rem' }}>{allIng[it.k]?.name ?? it.k}</span>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--t-text-faint)', flexShrink: 0, marginLeft: '1rem' }}>
                  <span>{fmtPortion(it.p)}</span>
                  {ingKcal(it.k, it.p, allIng) > 0 && <span style={{ minWidth: '44px', textAlign: 'right' }}>{Math.round(ingKcal(it.k, it.p, allIng))} kcal</span>}
                </div>
              </div>
            ))}
            {(meal.comboOptionals ?? []).length > 0 && combo.optionalItems && (
              <>
                {combo.optionalItems.filter(oi => meal.comboOptionals.includes(oi.k)).map((oi, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.4rem 0', borderBottom: '1px solid var(--t-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--t-accent)' }}>+ {allIng[oi.k]?.name ?? oi.k}</span>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--t-text-faint)', flexShrink: 0, marginLeft: '1rem' }}>
                      <span>{fmtPortion(oi.p)}</span>
                      {ingKcal(oi.k, oi.p, allIng) > 0 && <span style={{ minWidth: '44px', textAlign: 'right' }}>{Math.round(ingKcal(oi.k, oi.p, allIng))} kcal</span>}
                    </div>
                  </div>
                ))}
              </>
            )}
            {pKcal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--t-border)', fontSize: '0.72rem', color: 'var(--t-text-faint)' }}>
                <span>AOVE estimado</span>
                <span>235 kcal</span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={onClose}>Cerrar</button>
            <button className="btn-primary" onClick={() => { onClose(); onEdit() }}>✏️ Cambiar</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function MealSlot({ mealType, meal, allIng, allCombos, onEdit, onDetail, onClear }) {
  const isEmpty = !meal

  if (isEmpty) {
    return (
      <button className={`meal-slot empty meal-${mealType}`} onClick={onEdit}>
        <span className="slot-plus">+</span>
        <span className="slot-empty-text">{MEAL_LABELS[mealType]}</span>
      </button>
    )
  }

  const { title, cost, kcal, protein } = getMealDetails(meal, allIng, allCombos)

  return (
    <div className={`meal-slot filled meal-${mealType}`}>
      <button className="slot-main" onClick={onDetail ?? onEdit}>
        <span className="slot-type">{MEAL_LABELS[mealType]}</span>
        <span className="slot-title">{title}</span>
        <span className="slot-stats">
          {fmt(cost)} · {Math.round(kcal)} kcal
          {protein > 0 && ` · ${Math.round(protein)}g prot`}
        </span>
      </button>
      <button
        className="slot-clear"
        title="Quitar comida"
        onClick={e => {
          e.stopPropagation()
          onClear()
        }}
      >
        ✕
      </button>
    </div>
  )
}

function findCheapestBreakfast(allIng, allCombos) {
  return Object.entries(allCombos)
    .filter(([k]) => k.startsWith('desayuno-'))
    .map(([key, recipe]) => ({ key, cost: comboAgg(recipe, allIng).cost }))
    .sort((a, b) => a.cost - b.cost)[0]?.key
}

function findCheapestPlate(mealType, allIng, allCombos) {
  const options = []

  Object.entries(PROTEIN).forEach(([proteinKey, protein]) => {
    if (!(protein.meals ?? ['comida']).includes(mealType)) return
    const comboKeys = COMBO_SETS[protein.combos] ?? []
    comboKeys.forEach(comboKey => {
      const combo = allCombos[comboKey]
      if (!combo) return
      const cost = proteinCost(protein) + comboAgg(combo, allIng).cost
      options.push({ proteinKey, comboKey, cost })
    })
  })

  return options.sort((a, b) => a.cost - b.cost)[0]
}

// ─── Main tab ────────────────────────────────────────────────────────────────
export default function WeeklyMealPlannerTab() {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  const setMealSlot = useStore(s => s.setMealSlot)
  const clearMealSlot = useStore(s => s.clearMealSlot)
  const weekOffset    = useStore(s => s.weekOffset)
  const setWeekOffset = useStore(s => s.setWeekOffset)

  const [modalOpen, setModalOpen] = useState(null)   // { dayKey, mealType }
  const [detailOpen, setDetailOpen] = useState(null) // { dayKey, mealType }

  const currentDate = new Date()
  const targetDate = new Date(currentDate)
  targetDate.setDate(targetDate.getDate() + weekOffset * 7)
  const weekKey = getISOWeek(targetDate)
  const weekDates = getWeekDates(weekOffset)

  // ── Mobile responsive state ───────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Default selected day = today (or Monday if today not in this week)
  const todayIdx = weekDates.findIndex(d => isToday(d))
  const [selectedDayMobile, setSelectedDayMobile] = useState(
    () => DAY_KEYS[todayIdx >= 0 ? todayIdx : 0]
  )

  const currentWeek = weekPlan[weekKey] ?? {}
  const slotKey = (dayKey, mealType) => `${dayKey}-${mealType}`

  // Auto-clean corrupted plato slots: comboKey/proteinKey null (stale-closure
  // legacy bug) OR pointing to a combo that no longer exists in allCombos.
  // Runs once per week so the user never sees "Plato incompleto" on stale data.
  useEffect(() => {
    const week = weekPlan[weekKey] ?? {}
    DAY_KEYS.forEach(dayKey => {
      MEALS.forEach(mealType => {
        const key = `${dayKey}-${mealType}`
        const meal = week[key]
        if (!meal || meal.type !== 'plato') return
        const invalid = !meal.comboKey || !meal.proteinKey
                     || !allCombos[meal.comboKey] || !PROTEIN[meal.proteinKey]
        if (invalid) clearMealSlot(weekKey, key)
      })
    })
  }, [weekKey]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleMealSelect(dayKey, mealType, mealData, applyToBatch = false) {
    if (!applyToBatch) {
      setMealSlot(weekKey, slotKey(dayKey, mealType), mealData)
      return
    }

    if (batchTypeFor(dayKey) === 'sun') {
      // Batch Domingo: cocinas el dom anterior, comes lun→mar→mié→jue (misma semana).
      BATCH_SUN_DAYS.forEach(dk => setMealSlot(weekKey, slotKey(dk, mealType), mealData))
    } else {
      // Batch Jueves: cocinas el jue, comes vie→sáb→dom (misma semana).
      BATCH_THU_DAYS.forEach(dk => setMealSlot(weekKey, slotKey(dk, mealType), mealData))
    }
  }

  function handleMealClear(dayKey, mealType) {
    clearMealSlot(weekKey, slotKey(dayKey, mealType))
  }

  // Calculate day and week totals
  const dayTotals = useMemo(() => {
    const totals = {}
    DAY_KEYS.forEach(dayKey => {
      let dayC = 0, dayK = 0
      MEALS.forEach(meal => {
        const m = currentWeek[`${dayKey}-${meal}`]
        if (!m) return
        if (m.type === 'desayuno') {
          const recipe = allCombos[m.recipeKey]
          if (recipe) {
            const agg = comboAgg(recipe, allIng)
            dayC += agg.cost
            dayK += agg.kcal
          }
        } else if (m.type === 'plato') {
          const protein = PROTEIN[m.proteinKey]
          const combo = allCombos[m.comboKey]
          if (protein && combo) {
            const protCost = proteinCost(protein)
            const protKcal = proteinKcal(protein)
            const combAgg = comboAgg(combo, allIng, m.comboVariants || {}, {}, m.comboOptionals || [])
            dayC += protCost + combAgg.cost
            dayK += protKcal + combAgg.kcal + 235
          }
        }
      })
      totals[dayKey] = { cost: dayC, kcal: dayK }
    })
    return totals
  }, [currentWeek, allCombos, allIng])

  const weekTotals = useMemo(() => {
    let totalCost = 0, totalKcal = 0, filledSlots = 0
    Object.entries(dayTotals).forEach(([, { cost, kcal }]) => {
      totalCost += cost
      totalKcal += kcal
    })
    Object.values(currentWeek).forEach(meal => {
      if (meal) filledSlots++
    })
    return { totalCost, totalKcal, filledSlots }
  }, [dayTotals, currentWeek])

  const previousWeekKey = useMemo(() => {
    const previous = new Date(targetDate)
    previous.setDate(previous.getDate() - 7)
    return getISOWeek(previous)
  }, [targetDate])

  const previousWeek = weekPlan[previousWeekKey] ?? {}
  const hasPreviousWeek = Object.values(previousWeek).some(Boolean)
  const completion = Math.round((weekTotals.filledSlots / 21) * 100)
  const weekStatus = weekTotals.filledSlots === 0
    ? 'Pendiente'
    : weekTotals.filledSlots === 21
      ? 'Completa'
      : 'Parcial'

  // ── Per-person personalized kcal ──────────────────────────────────────────
  const profiles        = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const todayDate = new Date()
  const validProfiles = profiles.filter(p => {
    if (p.validoDesde && new Date(p.validoDesde) > todayDate) return false
    if (p.validoHasta && new Date(p.validoHasta) <= todayDate) return false
    return true
  })

  const personWeeklyAvg = useMemo(() => {
    if (validProfiles.length === 0) return []
    const filledDays = DAY_KEYS.filter(dk => MEALS.some(m => currentWeek[slotKey(dk, m)]))
    if (filledDays.length === 0) return []
    return validProfiles.map(person => {
      let total = 0
      filledDays.forEach(dk => {
        const day = Object.fromEntries(MEALS.map(m => [m, currentWeek[slotKey(dk, m)] ?? null]))
        const scale = personLunchScale(day, person, allIng, allCombos)
        total += scale ? scale.dayKcalAchieved : dayKcal(day, allIng, allCombos)
      })
      return { person, avg: Math.round(total / filledDays.length) }
    })
  }, [currentWeek, validProfiles, allIng, allCombos])

  // ── Per-person weekly cost (accounts for personalized base grams via personLunchScale) ──
  const personWeeklyCost = useMemo(() => {
    if (validProfiles.length === 0) return []
    const filledDays = DAY_KEYS.filter(dk => MEALS.some(m => currentWeek[slotKey(dk, m)]))
    if (filledDays.length === 0) return []
    return validProfiles.map(person => {
      let total = 0
      filledDays.forEach(dk => {
        const day = Object.fromEntries(MEALS.map(m => [m, currentWeek[slotKey(dk, m)] ?? null]))
        MEALS.forEach(mealType => {
          const meal = day[mealType]
          if (!meal) return
          if (meal.type === 'desayuno') {
            const recipe = allCombos[meal.recipeKey]
            if (recipe) total += comboAgg(recipe, allIng).cost
          } else if (meal.type === 'plato') {
            const protein = PROTEIN[meal.proteinKey]
            const combo   = allCombos[meal.comboKey]
            if (!protein || !combo) return
            total += proteinCost(protein, false, meal.proteinUnits)
            if (mealType === 'comida') {
              // Use personalized base grams (e.g. Julio gets more rice than María)
              const scale    = personLunchScale(day, person, allIng, allCombos)
              const overrides = scale ? { [scale.ingKey]: scale.grams } : {}
              total += comboAgg(combo, allIng, meal.comboVariants || {}, overrides, meal.comboOptionals || []).cost
            } else {
              total += comboAgg(combo, allIng, meal.comboVariants || {}, {}, meal.comboOptionals || []).cost
            }
          }
        })
      })
      return { person, cost: total }
    })
  }, [currentWeek, validProfiles, allIng, allCombos])

  // Day-column kcal personalised to the active profile (when one is selected).
  // When 'all' is selected → falls back to default dayTotals.kcal.
  const personalizedDayKcal = useMemo(() => {
    if (activeProfileId === 'all') return null
    const person = profiles.find(p => p.id === activeProfileId)
    if (!person) return null
    const result = {}
    DAY_KEYS.forEach(dk => {
      const day = Object.fromEntries(MEALS.map(m => [m, currentWeek[slotKey(dk, m)] ?? null]))
      const scale = personLunchScale(day, person, allIng, allCombos)
      result[dk] = scale ? scale.dayKcalAchieved : dayKcal(day, allIng, allCombos)
    })
    return result
  }, [activeProfileId, profiles, currentWeek, allIng, allCombos])

  function clearCurrentWeek() {
    DAY_KEYS.forEach(dayKey => {
      MEALS.forEach(mealType => clearMealSlot(weekKey, slotKey(dayKey, mealType)))
    })
  }

  function copyPreviousWeek() {
    clearCurrentWeek()
    DAY_KEYS.forEach(dayKey => {
      MEALS.forEach(mealType => {
        const key = slotKey(dayKey, mealType)
        if (previousWeek[key]) setMealSlot(weekKey, key, previousWeek[key])
      })
    })
  }

  function generateCheapDraft() {
    const breakfastKey = findCheapestBreakfast(allIng, allCombos)
    const lunch = findCheapestPlate('comida', allIng, allCombos)
    const dinner = findCheapestPlate('cena', allIng, allCombos)

    clearCurrentWeek()
    DAY_KEYS.forEach(dayKey => {
      if (breakfastKey) {
        setMealSlot(weekKey, slotKey(dayKey, 'desayuno'), {
          type: 'desayuno',
          recipeKey: breakfastKey,
        })
      }
      if (lunch) {
        setMealSlot(weekKey, slotKey(dayKey, 'comida'), {
          type: 'plato',
          proteinKey: lunch.proteinKey,
          prepKey: null,
          comboKey: lunch.comboKey,
        })
      }
      if (dinner) {
        setMealSlot(weekKey, slotKey(dayKey, 'cena'), {
          type: 'plato',
          proteinKey: dinner.proteinKey,
          prepKey: null,
          comboKey: dinner.comboKey,
        })
      }
    })
  }

  return (
    <div className="weekly-planner">
      <div className="weekly-hero">
        <div className="weekly-title-block">
          <span className="weekly-eyebrow">{weekKey}</span>
          <h2>Semana alimentaria</h2>
          <p>{formatDateShort(weekDates[0])} - {formatDateShort(weekDates[6])}</p>
        </div>

        <div className="weekly-nav" aria-label="Navegación de semana">
          <button className="icon-btn" title="Semana anterior" onClick={() => setWeekOffset(weekOffset - 1)}>←</button>
          <button className="btn-ghost" onClick={() => setWeekOffset(0)}>Hoy</button>
          <button className="icon-btn" title="Semana siguiente" onClick={() => setWeekOffset(weekOffset + 1)}>→</button>
        </div>
      </div>

      <div className="weekly-scoreboard">
        <div className="score-card primary">
          <span className="score-value">{weekTotals.filledSlots}/21</span>
          <span className="score-label">comidas</span>
          <span className="score-bar"><span style={{ width: `${completion}%` }} /></span>
        </div>
        <div className="score-card">
          <span className="score-value">
            {personWeeklyCost.length > 0
              ? fmt(personWeeklyCost.reduce((s, p) => s + p.cost, 0))
              : fmt(weekTotals.totalCost)}
          </span>
          <span className="score-label">
            coste semanal
            {personWeeklyCost.length > 0 && (
              <span style={{ display: 'block', fontSize: '0.6em', opacity: 0.75, marginTop: '2px' }}>
                {personWeeklyCost.map(({ person, cost }) => `${person.initial}: ${fmt(cost)}`).join(' · ')}
              </span>
            )}
          </span>
        </div>
        {personWeeklyAvg.length > 0 ? (
          personWeeklyAvg.map(({ person, avg }) => {
            const pct = Math.round((avg / person.kcalTarget) * 100)
            return (
              <div key={person.id} className="score-card">
                <span className="score-value" style={{ color: pct > 110 ? 'var(--t-danger)' : pct < 85 ? 'var(--t-text-soft)' : 'inherit' }}>
                  {avg}
                </span>
                <span className="score-label">{person.initial} kcal/día · {pct}%</span>
              </div>
            )
          })
        ) : (
          <div className="score-card">
            <span className="score-value">{Math.round(weekTotals.totalKcal / 7)}</span>
            <span className="score-label">kcal/día</span>
          </div>
        )}
        <div className={`score-card status-${weekStatus.toLowerCase()}`}>
          <span className="score-value">{weekStatus}</span>
          <span className="score-label">estado</span>
        </div>
      </div>

      <div className="weekly-actions">
        <button className="btn-primary" onClick={generateCheapDraft}>Generar barato</button>
        <button className="btn-ghost" disabled={!hasPreviousWeek} onClick={copyPreviousWeek}>Repetir anterior</button>
        <button className="btn-ghost" onClick={clearCurrentWeek}>Limpiar</button>
      </div>

      {isMobile ? (
        /* ── Mobile: day strip + stacked meal slots ── */
        <div className="planner-mobile">
          <div className="planner-day-strip">
            {DAY_KEYS.map((dayKey, i) => {
              const date = weekDates[i]
              const today = isToday(date)
              const filled = MEALS.filter(m => currentWeek[slotKey(dayKey, m)]).length
              const done   = filled === MEALS.length
              const partial = filled > 0 && !done
              return (
                <button
                  key={dayKey}
                  className={`day-strip-btn${selectedDayMobile === dayKey ? ' active' : ''}${today ? ' is-today' : ''}${done ? ' is-complete' : ''}${partial ? ' is-partial' : ''}`}
                  onClick={() => setSelectedDayMobile(dayKey)}
                >
                  <span className="dsb-name">{DAYS[i].slice(0, 3)}</span>
                  <span className="dsb-date">{date.getDate()}</span>
                  {today && <span className="dsb-today-dot" />}
                </button>
              )
            })}
          </div>

          <div className="planner-day-summary">
            <span>
              <span className="pds-label">Coste</span>
              {fmt(dayTotals[selectedDayMobile]?.cost ?? 0)}
            </span>
            <span>
              <span className="pds-label">Kcal</span>
              {Math.round(personalizedDayKcal
                ? (personalizedDayKcal[selectedDayMobile] ?? 0)
                : (dayTotals[selectedDayMobile]?.kcal ?? 0)
              )}
            </span>
          </div>

          <div className="planner-mobile-meals">
            {MEALS.map(mealType => {
              const key  = slotKey(selectedDayMobile, mealType)
              const meal = currentWeek[key]
              return (
                <div key={mealType} className="mobile-meal-row">
                  <MealSlot
                    mealType={mealType}
                    meal={meal}
                    allIng={allIng}
                    allCombos={allCombos}
                    onEdit={() => setModalOpen({ dayKey: selectedDayMobile, mealType })}
                    onDetail={meal ? () => setDetailOpen({ dayKey: selectedDayMobile, mealType }) : undefined}
                    onClear={() => handleMealClear(selectedDayMobile, mealType)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ── Desktop: 7-column grid ── */
        <div className="planner-board-scroll">
          <div className="planner-board">
            <div className="planner-header">
              <div className="planner-corner">Comida</div>
              {DAY_KEYS.map((dayKey, i) => {
                const date = weekDates[i]
                const today = isToday(date)
                const filled = MEALS.filter(mealType => currentWeek[slotKey(dayKey, mealType)]).length
                const done = filled === MEALS.length
                const partial = filled > 0 && !done
                return (
                  <div
                    key={dayKey}
                    className={`planner-day${today ? ' is-today' : ''}${done ? ' is-complete' : ''}${partial ? ' is-partial' : ''}`}
                  >
                    <div className="day-topline">
                      <span className="day-name">{DAYS[i]}</span>
                      {today && <span className="today-pill">Hoy</span>}
                    </div>
                    <div className="day-date">{date.getDate()} {MONTH_INITIALS[date.getMonth()]}</div>
                    <div className="day-totals">
                      <span>{fmt(dayTotals[dayKey]?.cost ?? 0)}</span>
                      <span>{Math.round(personalizedDayKcal ? (personalizedDayKcal[dayKey] ?? 0) : (dayTotals[dayKey]?.kcal ?? 0))} kcal</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {MEALS.map(mealType => (
              <div key={mealType} className="planner-row">
                <div className={`planner-meal-label meal-${mealType}`}>
                  <span>{MEAL_LABELS[mealType]}</span>
                </div>
                {DAY_KEYS.map(dayKey => {
                  const key = slotKey(dayKey, mealType)
                  const meal = currentWeek[key]
                  return (
                    <div key={key} className="planner-cell">
                      <MealSlot
                        mealType={mealType}
                        meal={meal}
                        allIng={allIng}
                        allCombos={allCombos}
                        onEdit={() => setModalOpen({ dayKey, mealType })}
                        onDetail={meal ? () => setDetailOpen({ dayKey, mealType }) : undefined}
                        onClear={() => handleMealClear(dayKey, mealType)}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {detailOpen && (() => {
        const detailMeal = currentWeek[slotKey(detailOpen.dayKey, detailOpen.mealType)]
        return (
          <MealDetailModal
            meal={detailMeal}
            allIng={allIng}
            allCombos={allCombos}
            onEdit={() => { setDetailOpen(null); setModalOpen(detailOpen) }}
            onClose={() => setDetailOpen(null)}
          />
        )
      })()}

      {modalOpen && (
        <MealSelectorModal
          allIng={allIng}
          allCombos={allCombos}
          dayKey={modalOpen.dayKey}
          mealType={modalOpen.mealType}
          initialApplyToBatch={
            // Default ON when ALL the batch siblings are empty (building a fresh batch).
            // OFF when any sibling already has a meal (avoid silent overwrites).
            (() => {
              const mt   = modalOpen.mealType
              const days = batchTypeFor(modalOpen.dayKey) === 'sun' ? BATCH_SUN_DAYS : BATCH_THU_DAYS
              return !days
                .filter(dk => dk !== modalOpen.dayKey)
                .some(dk => !!currentWeek[slotKey(dk, mt)])
            })()
          }
          onSelect={(mealData, applyToBatch) => {
            handleMealSelect(modalOpen.dayKey, modalOpen.mealType, mealData, applyToBatch)
            setModalOpen(null)
          }}
          onClose={() => setModalOpen(null)}
        />
      )}
    </div>
  )
}
