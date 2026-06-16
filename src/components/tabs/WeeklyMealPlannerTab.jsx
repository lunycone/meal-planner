import { useState, useMemo, Fragment } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { PROTEIN } from '../../data/proteins'
import { PREP, COMBO_SETS } from '../../data/combos'
import { comboAgg, fmt, proteinCost, proteinKcal, ingKcal, fmtPortion } from '../../engine/calc'

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

// ─── Category maps for picker ─────────────────────────────────────────────────
const DESAYUNO_TAG_ORDER  = ['batido', 'yogur', 'huevo', 'batch', 'ocasional']
const DESAYUNO_TAG_LABELS = { batido: 'Batidos', yogur: 'Bowls & Yogur', huevo: 'Huevos', batch: 'Batch & especiales', ocasional: 'Ocasional' }

const PROTEIN_CAT_MAP = {
  'carne-picada': 'carnes', 'cerdo-picado': 'carnes', 'lamb': 'carnes', 'lomo': 'carnes',
  'pollo': 'aves',
  'bacalao': 'pescado', 'calamares': 'pescado', 'pollock': 'pescado', 'langosta': 'pescado',
  'sardinas': 'lata', 'caballa': 'lata',
  'mejillones': 'marisco', 'ostras': 'marisco',
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
  const agg = comboAgg(combo, allIng)

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
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => { onConfirm(combo.key); onClose() }}>Seleccionar</button>
        </div>
      </div>
    </div>
  )
}

function MealSelectorModal({ allIng, allCombos, onSelect, onClose, dayKey, mealType }) {
  const [step, setStep] = useState(mealType === 'desayuno' ? 'recipe' : 'protein')
  const [selectedProtein, setSelectedProtein] = useState(null)
  const [selectedPrep, setSelectedPrep] = useState(null)
  const [selectedCombo, setSelectedCombo] = useState(null)
  const [search, setSearch] = useState('')
  const [comboDetail, setComboDetail] = useState(null)

  // Desayuno: grouped by tag
  const groupedDesayunos = useMemo(() => {
    const all = Object.entries(allCombos)
      .filter(([k]) => k.startsWith('desayuno-'))
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

  // Step 2: Select prep (if protein has preps)
  const prepList = selectedProtein ? (PROTEIN[selectedProtein]?.preps ?? []) : []

  // Step 3: Select combo (grouped by base)
  const groupedCombos = useMemo(() => {
    if (!selectedProtein) return []
    const protein = PROTEIN[selectedProtein]
    const comboSetKey = protein?.combos
    if (!comboSetKey) return []
    const allowed = new Set(COMBO_SETS[comboSetKey] ?? [])
    const list = Object.entries(allCombos)
      .filter(([k]) => !k.startsWith('desayuno-') && allowed.has(k))
      .map(([k, c]) => ({ key: k, ...c }))
    const q = search.toLowerCase()
    const filtered = q ? list.filter(c => c.name.toLowerCase().includes(q)) : list
    const grouped = {}
    for (const c of filtered) {
      const base = c.base ?? 'otros'
      if (!grouped[base]) grouped[base] = []
      grouped[base].push(c)
    }
    return COMBO_BASE_ORDER.filter(b => grouped[b]).map(b => ({ base: b, label: COMBO_BASE_LABELS[b] ?? b, items: grouped[b] }))
  }, [selectedProtein, allCombos, search])

  function confirmMeal() {
    if (mealType === 'desayuno') {
      onSelect({ type: 'desayuno', recipeKey: selectedPrep })
    } else {
      onSelect({ type: 'plato', proteinKey: selectedProtein, prepKey: selectedPrep || null, comboKey: selectedCombo })
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
                        onClick={() => setSelectedPrep(recipe.key)}
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
              <div className="protein-list">
                {groupedProteins.map(({ cat, label, items }) => (
                  <div key={cat}>
                    <div className="picker-cat-label">{label}</div>
                    {items.map(protein => (
                      <div
                        key={protein.key}
                        className={`protein-option${selectedProtein === protein.key ? ' selected' : ''}`}
                        onClick={() => setSelectedProtein(protein.key)}
                      >
                        <div className="po-name">{protein.name}</div>
                        <div className="po-detail">{fmt(protein.ration?.price ?? (protein.per100 ?? 0) * (protein.ration?.grams ?? 150) / 100)}</div>
                      </div>
                    ))}
                  </div>
                ))}
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
              <div className="combo-list">
                {groupedCombos.length === 0 ? (
                  <div className="combo-empty">No hay combinaciones disponibles</div>
                ) : (
                  groupedCombos.map(({ base, label, items }) => (
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
          <button
            className="btn-ghost"
            onClick={() => {
              if (step === 'protein') onClose()
              else if (step === 'prep') { setSearch(''); setStep('protein') }
              else { setSearch(''); setStep('prep') }
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
          onConfirm={(comboKey) => {
            setSelectedCombo(comboKey)
            confirmMeal()
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
    const protCost = proteinCost(protein)
    const protKcal = proteinKcal(protein)
    const combAgg = comboAgg(combo, allIng)
    return {
      title: `${protein.name} + ${combo.name}`,
      cost: protCost + combAgg.cost,
      kcal: protKcal + combAgg.kcal + 235,
      protein: (protein.prot ?? 0) + (combAgg.prot ?? 0),
    }
  }

  return { title: 'Comida sin datos', cost: 0, kcal: 0, protein: 0 }
}

function MealSlot({ mealType, meal, allIng, allCombos, onEdit, onClear }) {
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
      <button className="slot-main" onClick={onEdit}>
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

  const [weekOffset, setWeekOffset] = useState(0)
  const [modalOpen, setModalOpen] = useState(null) // { dayKey, mealType }

  const currentDate = new Date()
  const targetDate = new Date(currentDate)
  targetDate.setDate(targetDate.getDate() + weekOffset * 7)
  const weekKey = getISOWeek(targetDate)
  const weekDates = getWeekDates(weekOffset)

  const currentWeek = weekPlan[weekKey] ?? {}
  const slotKey = (dayKey, mealType) => `${dayKey}-${mealType}`

  function handleMealSelect(dayKey, mealType, mealData) {
    setMealSlot(weekKey, slotKey(dayKey, mealType), mealData)
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
            const combAgg = comboAgg(combo, allIng)
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
  const avgDailyKcal = Math.round(weekTotals.totalKcal / 7)
  const weekStatus = weekTotals.filledSlots === 0
    ? 'Pendiente'
    : weekTotals.filledSlots === 21
      ? 'Completa'
      : 'Parcial'

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
          <button className="icon-btn" title="Semana anterior" onClick={() => setWeekOffset(w => w - 1)}>←</button>
          <button className="btn-ghost" onClick={() => setWeekOffset(0)}>Hoy</button>
          <button className="icon-btn" title="Semana siguiente" onClick={() => setWeekOffset(w => w + 1)}>→</button>
        </div>
      </div>

      <div className="weekly-scoreboard">
        <div className="score-card primary">
          <span className="score-value">{weekTotals.filledSlots}/21</span>
          <span className="score-label">comidas</span>
          <span className="score-bar"><span style={{ width: `${completion}%` }} /></span>
        </div>
        <div className="score-card">
          <span className="score-value">{fmt(weekTotals.totalCost)}</span>
          <span className="score-label">coste semanal</span>
        </div>
        <div className="score-card">
          <span className="score-value">{avgDailyKcal}</span>
          <span className="score-label">kcal/día</span>
        </div>
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
                    <span>{Math.round(dayTotals[dayKey]?.kcal ?? 0)} kcal</span>
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
                      onClear={() => handleMealClear(dayKey, mealType)}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <MealSelectorModal
          allIng={allIng}
          allCombos={allCombos}
          dayKey={modalOpen.dayKey}
          mealType={modalOpen.mealType}
          onSelect={(mealData) => {
            handleMealSelect(modalOpen.dayKey, modalOpen.mealType, mealData)
            setModalOpen(null)
          }}
          onClose={() => setModalOpen(null)}
        />
      )}
    </div>
  )
}
