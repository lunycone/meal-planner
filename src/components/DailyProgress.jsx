import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import { comboAgg, proteinCost, proteinKcal } from '../engine/calc'

export default function DailyProgress() {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const activeProfile = useStore(s => s.getActiveProfile())
  const meals = useStore(s => s.meals)

  // Calculate today's kcal from meals
  let todayKcal = 0
  const today = new Date()
  const dayKey = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'][today.getDay() === 0 ? 6 : today.getDay() - 1]

  // Sum all meal types for today
  ['desayuno', 'comida', 'merienda', 'cena'].forEach(mealType => {
    const meal = meals[mealType]?.[dayKey]
    if (!meal) return

    if (meal.type === 'desayuno') {
      const recipe = allCombos[meal.recipeKey]
      if (recipe) {
        const agg = comboAgg(recipe, allIng)
        todayKcal += agg.kcal
      }
    } else if (meal.type === 'plato') {
      const protein = useStore.getState()['PROTEIN']?.[meal.proteinKey]
      const combo = allCombos[meal.comboKey]
      if (protein && combo) {
        const protKcal = proteinKcal(protein)
        const combAgg = comboAgg(combo, allIng)
        todayKcal += protKcal + combAgg.kcal + 235
      }
    }
  })

  const target = activeProfile.kcalTarget
  const percent = Math.min(100, (todayKcal / target) * 100)
  const remaining = Math.max(0, target - todayKcal)

  return (
    <div style={{
      background: 'var(--t-tinted-bg)',
      borderRadius: 'var(--t-radius-lg)',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      border: '1px solid var(--t-border)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t-text-faint)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            Progreso del día
          </div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--t-font-display)', fontWeight: 300, color: 'var(--t-text)' }}>
            {Math.round(todayKcal)} kcal
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--t-text-soft)' }}>
            de {target} kcal
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: remaining <= 0 ? 'var(--t-success)' : 'var(--t-accent)' }}>
            {remaining > 0 ? `+${Math.round(remaining)}` : '✓'} kcal
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: 'var(--t-border)',
        borderRadius: '99px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: remaining <= 0 ? 'var(--t-success)' : 'var(--t-accent)',
          transition: 'width 0.4s ease'
        }} />
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--t-text-faint)', marginTop: '0.6rem' }}>
        {percent.toFixed(0)}% del objetivo
      </div>
    </div>
  )
}
