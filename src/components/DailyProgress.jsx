import useStore from '../store/useStore'
import { comboAgg, proteinProt, personDayKcal, personTargetForDay, slotForPerson } from '../engine/calc'
import { PROTEIN } from '../data/proteins'

const MEALS = ['desayuno', 'comida', 'merienda', 'cena']

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
    return proteinProt(protein, false, meal.proteinUnits) + (comboAgg(combo, allIng, meal.comboVariants || {}).prot ?? 0)
  }
  return 0
}

// 5 sep 2026 -- reescrito para resolver el dia de CADA persona por
// separado (slotForPerson) y usar el mismo motor que Planificador/Batch
// (personDayKcal + personTargetForDay): antes usaba personLunchScale (una
// sola pasada, solo escala la comida, kcalTarget PLANO) sobre el dia del
// representante compartido -- por eso el % de aqui no coincidia con el
// 101% que ya mostraba Planificador para el mismo dia (aqui salia 92%,
// con el objetivo plano de Julio -3100- en vez del especifico del dia
// -3300 el sabado-, y sin el cierre de AOVE ni la doble pasada comida<->
// cena). Ademas, al usar SIEMPRE el dia del representante, Julio y Maria
// mostraban la MISMA proteina aunque comieran platos distintos.
export default function DailyProgress({ rawSlots, profiles, dayIdx, allIng, allCombos }) {
  const activeProfileId = useStore(s => s.activeProfileId)
  const validProfiles = profiles ?? []

  const rows = validProfiles.map(p => {
    const day = Object.fromEntries(MEALS.map(m => [m, slotForPerson(rawSlots[m], p.id)]))
    const kcal = personDayKcal(day, p, allIng, allCombos, dayIdx)
    const prot = Math.round(MEALS.reduce((s, m) => s + calcMealProt(day[m], allIng, allCombos), 0))
    const target = personTargetForDay(p, dayIdx)
    return { person: p, kcal, prot, target }
  })

  const totalKcal = rows.reduce((s, r) => s + r.kcal, 0)

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
        {rows.map(({ person: p, kcal, prot, target }) => {
          const kcalPercent = target ? Math.round((kcal / target) * 100) : null
          const protPercent = Math.round((prot / (p.proteinTarget || 1)) * 100)
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
                {kcal} / {target} kcal
              </div>
              <div style={{ fontFamily: 'var(--t-font-display)', fontSize: '1rem', fontWeight: 300, color: protPercent > 100 ? 'var(--t-danger)' : 'var(--t-text)', lineHeight: 1, marginBottom: '0.2rem' }}>
                {protPercent}%
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--t-text-faint)' }}>
                {prot} / {p.proteinTarget || 0}g proteína
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
