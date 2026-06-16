import { useState, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { PROTEIN } from '../../data/proteins'
import { PREP, COMBO } from '../../data/combos'
import { comboAgg, fmt, proteinCost, proteinKcal } from '../../engine/calc'

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

// ─── Meal selector modal ──────────────────────────────────────────────────────
function MealSelectorModal({ allIng, allCombos, onSelect, onClose, dayKey, mealType }) {
  const [step, setStep] = useState(mealType === 'desayuno' ? 'recipe' : 'protein')
  const [selectedProtein, setSelectedProtein] = useState(null)
  const [selectedPrep, setSelectedPrep] = useState(null)
  const [selectedCombo, setSelectedCombo] = useState(null)
  const [search, setSearch] = useState('')

  // Desayuno: show list of recipes
  const desayunoRecipes = useMemo(() => {
    return Object.entries(allCombos)
      .filter(([k]) => k.startsWith('desayuno-'))
      .map(([k, c]) => ({ key: k, ...c }))
  }, [allCombos])

  // Step 1: Select protein
  const proteinList = useMemo(() => {
    const list = Object.entries(PROTEIN)
      .filter(([, p]) => (p.meals ?? ['comida']).includes(mealType))
      .map(([k, p]) => ({ key: k, ...p }))
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(p => p.name.toLowerCase().includes(q))
  }, [mealType, search])

  // Step 2: Select prep (if protein has preps)
  const prepList = selectedProtein ? (PROTEIN[selectedProtein]?.preps ?? []) : []

  // Step 3: Select combo
  const availableCombos = useMemo(() => {
    if (!selectedProtein) return []
    const protein = PROTEIN[selectedProtein]
    const comboSetKey = protein?.combos
    if (!comboSetKey) return []
    const baseComboSet = comboSetKey === 'shared' ? ['shared', mealType] : [comboSetKey]
    return Object.entries(allCombos)
      .filter(([k, c]) => !k.startsWith('desayuno-') && baseComboSet.includes(comboSetKey))
      .map(([k, c]) => ({ key: k, ...c }))
  }, [selectedProtein, allCombos, mealType])

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
              {desayunoRecipes
                .filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
                .map(recipe => {
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
    )
  }

  // Plato workflow
  return (
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
                {proteinList.map(protein => (
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
              <div className="combo-list">
                {availableCombos.map(combo => (
                  <div
                    key={combo.key}
                    className={`combo-option${selectedCombo === combo.key ? ' selected' : ''}`}
                    onClick={() => setSelectedCombo(combo.key)}
                  >
                    <div className="co-name">{combo.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn-ghost"
            onClick={() => {
              if (step === 'protein') onClose()
              else if (step === 'prep') setStep('protein')
              else setStep('prep')
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
                setStep(prepLen > 0 ? 'prep' : 'combo')
              } else if (step === 'prep') {
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
    </div>
  )
}

// ─── Meal slot cell ──────────────────────────────────────────────────────────
function MealSlot({ weekKey, dayKey, mealType, meal, allIng, allCombos, onEdit, onClear }) {
  const isEmpty = !meal

  if (isEmpty) {
    return (
      <button className="meal-slot empty" onClick={onEdit}>
        <span className="slot-empty-text">+ {mealType}</span>
      </button>
    )
  }

  let title = ''
  let cost = 0
  let kcal = 0

  if (meal.type === 'desayuno') {
    const recipe = allCombos[meal.recipeKey]
    if (recipe) {
      title = recipe.name
      const agg = comboAgg(recipe, allIng)
      cost = agg.cost
      kcal = agg.kcal
    }
  } else if (meal.type === 'plato') {
    const protein = PROTEIN[meal.proteinKey]
    const combo = allCombos[meal.comboKey]
    if (protein && combo) {
      title = `${protein.name} + ${combo.name}`
      const protCost = proteinCost(protein)
      const protKcal = proteinKcal(protein)
      const combAgg = comboAgg(combo, allIng)
      cost = protCost + combAgg.cost
      kcal = protKcal + combAgg.kcal + 235 // +235 for cooking fat
    }
  }

  return (
    <button className="meal-slot filled" onClick={onEdit}>
      <div className="slot-title">{title}</div>
      <div className="slot-stats">
        {fmt(cost)} · {Math.round(kcal)} kcal
      </div>
      <button
        className="slot-clear"
        onClick={e => {
          e.stopPropagation()
          onClear()
        }}
      >
        ✕
      </button>
    </button>
  )
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

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Planificador semanal
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            {formatDateShort(weekDates[0])} - {formatDateShort(weekDates[6])} · {weekKey}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
            {fmt(weekTotals.totalCost)} · {Math.round(weekTotals.totalKcal)} kcal · {weekTotals.filledSlots}/21 comidas planificadas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={() => setWeekOffset(w => w - 1)}>← Anterior</button>
          <button className="btn-ghost" onClick={() => setWeekOffset(0)}>Hoy</button>
          <button className="btn-ghost" onClick={() => setWeekOffset(w => w + 1)}>Siguiente →</button>
        </div>
      </div>

      <div className="week-grid">
        <div className="week-header">
          <div className="wh-corner" />
          {DAY_KEYS.map((dayKey, i) => {
            const date = weekDates[i]
            const today = isToday(date)
            return (
              <div key={dayKey} className={`wh-day${today ? ' is-today' : ''}`} style={today ? { background: 'var(--card)', borderRadius: '0.5rem', padding: '0.5rem' } : {}}>
                <div className="wh-name">{DAYS[i]}</div>
                <div className="wh-date">{date.getDate()} {['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][date.getMonth()]}</div>
                {today && <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 600 }}>HOY</div>}
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  {fmt(dayTotals[dayKey]?.cost ?? 0)} · {Math.round(dayTotals[dayKey]?.kcal ?? 0)} kcal
                </div>
              </div>
            )
          })}
        </div>

        {MEALS.map(mealType => (
          <div key={mealType} className="week-row">
            <div className="wr-meal-label">{mealType}</div>
            {DAY_KEYS.map(dayKey => {
              const key = slotKey(dayKey, mealType)
              const meal = currentWeek[key]
              return (
                <div key={key} className="wr-cell">
                  <MealSlot
                    weekKey={weekKey}
                    dayKey={dayKey}
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
