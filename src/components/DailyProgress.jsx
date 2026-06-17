import useStore from '../store/useStore'
import { comboAgg, proteinKcal, proteinProt } from '../engine/calc'
import { PROTEIN } from '../data/proteins'

function calcMealKcal(meal, allIng, allCombos) {
  if (!meal) return 0
  if (meal.type === 'desayuno') {
    const recipe = allCombos[meal.recipeKey]
    if (!recipe) return 0
    return comboAgg(recipe, allIng).kcal
  }
  if (meal.type === 'plato') {
    const protein = PROTEIN[meal.proteinKey]
    const combo   = allCombos[meal.comboKey]
    if (!protein || !combo) return 0
    return proteinKcal(protein) + comboAgg(combo, allIng).kcal + 235
  }
  return 0
}

function calcMealProt(meal, allIng, allCombos) {
  if (!meal) return 0
  if (meal.type === 'desayuno') {
    const recipe = allCombos[meal.recipeKey]
    if (!recipe) return 0
    return comboAgg(recipe, allIng).prot ?? 0
  }
  if (meal.type === 'plato') {
    const protein = PROTEIN[meal.proteinKey]
    const combo   = allCombos[meal.comboKey]
    if (!protein || !combo) return 0
    return proteinProt(protein) + (comboAgg(combo, allIng).prot ?? 0)
  }
  return 0
}

export default function DailyProgress({ todayMeals, allIng, allCombos }) {
  const profiles       = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)

  const today = new Date()
  const validProfiles = profiles.filter(p => !p.validoHasta || new Date(p.validoHasta) > today)

  // Total kcal y proteína planeadas hoy (comida compartida)
  const totalKcal = Math.round(
    Object.values(todayMeals).reduce((sum, meal) => sum + calcMealKcal(meal, allIng, allCombos), 0)
  )
  const totalProt = Math.round(
    Object.values(todayMeals).reduce((sum, meal) => sum + calcMealProt(meal, allIng, allCombos), 0)
  )

  if (totalKcal === 0) {
    return (
      <div style={{
        background: 'var(--t-tinted-bg)',
        borderRadius: 'var(--t-radius-lg)',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--t-border)',
        fontSize: '0.85rem',
        color: 'var(--t-text-faint)',
      }}>
        Sin comidas planeadas para hoy
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--t-tinted-bg)',
      borderRadius: 'var(--t-radius-lg)',
      padding: '1.25rem 1.5rem',
      border: '1px solid var(--t-border)',
    }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t-text-faint)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
        Reparto por persona
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: validProfiles.length > 1 ? 'repeat(auto-fit, minmax(120px, 1fr))' : '1fr',
        gap: '0.75rem',
      }}>
        {validProfiles.map(p => {
          const kcalPercent = Math.round((totalKcal / p.kcalTarget) * 100)
          const protPercent = Math.round((totalProt / (p.proteinTarget || 1)) * 100)
          const isActive = activeProfileId === p.id || activeProfileId === 'all'

          return (
            <div
              key={p.id}
              style={{
                padding: '0.75rem',
                background: isActive ? 'rgba(154,123,67,0.08)' : 'rgba(0,0,0,0.02)',
                border: isActive ? '1px solid var(--t-accent)' : '1px solid var(--t-border)',
                borderRadius: 'var(--t-radius)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--t-text-soft)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {p.initial} {p.name}
              </div>
              <div style={{ fontFamily: 'var(--t-font-display)', fontSize: '1.2rem', fontWeight: 300, color: kcalPercent > 100 ? 'var(--t-danger)' : 'var(--t-text)', lineHeight: 1, marginBottom: '0.3rem' }}>
                {kcalPercent}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--t-text-faint)', marginBottom: '0.5rem' }}>
                {totalKcal} / {p.kcalTarget} kcal
              </div>
              <div style={{ fontFamily: 'var(--t-font-display)', fontSize: '1rem', fontWeight: 300, color: protPercent > 100 ? 'var(--t-danger)' : 'var(--t-text)', lineHeight: 1, marginBottom: '0.2rem' }}>
                {protPercent}%
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--t-text-faint)' }}>
                {totalProt} / {p.proteinTarget || 0}g proteína
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
