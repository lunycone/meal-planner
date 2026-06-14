import useStore, { selectMealPlan } from '../store/useStore'
import { MEALS, MEAL_ORDER } from '../config/meals'
import { MEAL_ICONS } from '../config/icons'
import { streamSummary } from '../engine/plan'

// ─── Meal card ────────────────────────────────────────────────────────────────

function MealCard({ mealKey }) {
  const meal   = MEALS[mealKey]
  const Icon   = MEAL_ICONS[mealKey]
  const weeks  = useStore(selectMealPlan(mealKey))
  const setView = useStore(s => s.setView)
  const summary = streamSummary(weeks)

  return (
    <button
      className="home-meal-card"
      style={{ '--meal-color': meal.color, '--meal-bg': meal.colorBg, '--meal-border': meal.colorBorder }}
      onClick={() => setView('meal', mealKey)}
    >
      <div className="hmc-top">
        <span className="hmc-icon"><Icon size={18} color={meal.color} /></span>
        <span className="hmc-label">{meal.label}</span>
        {!summary.isEmpty && (
          <span className="hmc-target">
            {meal.kcalTarget[0]}–{meal.kcalTarget[1]} kcal
          </span>
        )}
      </div>

      {summary.isEmpty ? (
        <div className="hmc-empty">Sin planificar — haz clic para empezar</div>
      ) : (
        <>
          <div className="hmc-preview">
            {summary.previewLines.map((line, i) => (
              <div key={i} className="hmc-preview-line">
                <span className="hmc-cook-day">{line.cookDay}</span>
                <span className="hmc-protein">{line.protein}</span>
                <span className="hmc-combo">· {line.combo}</span>
              </div>
            ))}
          </div>

          <div className="hmc-stats">
            <span className="hmc-stat cost">{summary.costLabel}<span className="hmc-stat-unit">/plato</span></span>
            <span className="hmc-sep">·</span>
            <span className="hmc-stat kcal">{summary.kcalLabel}</span>
            <span className="hmc-sep">·</span>
            <span className="hmc-stat muted">{summary.weekCount} sem</span>
          </div>
        </>
      )}

      <div className="hmc-arrow">→</div>
    </button>
  )
}

// ─── Weekly totals bar ────────────────────────────────────────────────────────

function WeekTotalsBar() {
  const comidaWeeks   = useStore(selectMealPlan('comida'))
  const desayunoWeeks = useStore(selectMealPlan('desayuno'))
  const meriendaWeeks = useStore(selectMealPlan('merienda'))
  const cenaWeeks     = useStore(selectMealPlan('cena'))

  const allStreams = [desayunoWeeks, comidaWeeks, meriendaWeeks, cenaWeeks]

  // Average daily cost: sum of all stream avg costs (per batch avg)
  const streamAvgCosts = allStreams.map(weeks => {
    const batches = weeks.flatMap(w => w.batches ?? [])
    if (!batches.length) return 0
    return batches.reduce((a, b) => a + (b.costEst ?? 0), 0) / batches.length
  })
  const streamAvgKcals = allStreams.map(weeks => {
    const batches = weeks.flatMap(w => w.batches ?? [])
    if (!batches.length) return 0
    return batches.reduce((a, b) => a + (b.kcalEst ?? 0), 0) / batches.length
  })

  const totalDailyCost = streamAvgCosts.reduce((a, b) => a + b, 0)
  const totalDailyKcal = streamAvgKcals.reduce((a, b) => a + b, 0)

  const hasAnyData = totalDailyCost > 0

  if (!hasAnyData) return null

  return (
    <div className="home-totals">
      <span className="ht-label">Resumen diario estimado</span>
      <span className="ht-stat">
        <span className="ht-value">${totalDailyCost.toFixed(2)}</span>
        <span className="ht-unit">/día</span>
      </span>
      <span className="ht-sep">·</span>
      <span className="ht-stat">
        <span className="ht-value">{Math.round(totalDailyKcal)}</span>
        <span className="ht-unit">kcal/día</span>
      </span>
    </div>
  )
}

// ─── Home view ────────────────────────────────────────────────────────────────

export default function HomeView() {
  return (
    <div className="home-view">
      <div className="home-header">
        <h2 className="home-title">Plan del mes</h2>
        <p className="home-sub">Selecciona una comida para ver y editar sus batches.</p>
      </div>

      <div className="home-grid">
        {MEAL_ORDER.map(key => <MealCard key={key} mealKey={key} />)}
      </div>

      <WeekTotalsBar />
    </div>
  )
}
