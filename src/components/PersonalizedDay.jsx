import useStore from '../store/useStore'
import { comboScalableKey, personMealScalesTwoPass, personTargetForDay, personDayKcal, slotForPerson } from '../engine/calc'

const MEALS = ['desayuno', 'comida', 'merienda', 'cena']

// Per-person personalization panel. Reacts to the global T/J/M/C selector:
//  · "Todos"      → differential line of the scalable lunch base per person
//  · single person → that person's scaled recipe + deficit/oil if capped
//
// 5 sep 2026 -- dos bugs de fondo, arreglados juntos:
//  1. lunchCombo se resolvia con `lunch?.type === 'plato'` -- el modelo
//     legacy (proteina+combo por separado). Todos los platos actuales
//     (incluidos los que SI llevan patata/arroz/legumbre, como "Pollo
//     pierna + pure...") usan el modelo de un solo plato (`type:
//     'desayuno'`, reutilizado para las 4 comidas) -- asi que scalableKey
//     salia SIEMPRE null y este panel SIEMPRE decia "sin base que escalar",
//     aunque la comida de hoy si tuviera una.
//  2. personLunchScale (una sola pasada, kcalTarget plano) no coincidia con
//     lo que Planificador/Batch ya sirven de verdad (dos pasadas +
//     objetivo especifico del dia) -- ahora usa personMealScalesTwoPass +
//     personTargetForDay, igual que el resto de la app.
export default function PersonalizedDay({ rawSlots, profiles, dayIdx, allIng, allCombos }) {
  const activeProfileId = useStore(s => s.activeProfileId)
  const validProfiles = profiles ?? []

  // La comida (la franja, no confundir con "plato") es SIEMPRE el mismo
  // plato para todos -- solo cambia la racion (regla del usuario) -- basta
  // con resolverla para un perfil cualquiera para saber que plato es.
  const repId = validProfiles[0]?.id ?? null
  const lunch = slotForPerson(rawSlots.comida, repId)
  const lunchCombo = lunch?.type === 'desayuno' ? allCombos[lunch.recipeKey] : null
  const scalableKey = lunchCombo ? comboScalableKey(lunchCombo, allIng) : null

  const scales = validProfiles.map(p => {
    const day = Object.fromEntries(MEALS.map(m => [m, slotForPerson(rawSlots[m], p.id)]))
    const target = personTargetForDay(p, dayIdx)
    const twoPass = personMealScalesTwoPass(day, p, allIng, allCombos, target)
    const kcalAchieved = personDayKcal(day, p, allIng, allCombos, dayIdx)
    return { p, s: twoPass.comida, target, kcalAchieved }
  })

  const wrap = {
    background: 'var(--t-tinted-bg)',
    borderRadius: 'var(--t-radius-lg)',
    padding: '1.25rem 1.5rem',
    border: '1px solid var(--t-border)',
  }
  const heading = {
    fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
    color: 'var(--t-text-faint)', letterSpacing: '0.1em', marginBottom: '0.85rem',
  }

  if (!lunch) return null

  // ── No scalable base today (e.g. lunch is a salad / 'otros') ──────────────
  if (!scalableKey) {
    return (
      <div style={wrap}>
        <div style={heading}>Comida personalizada</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--t-text-soft)', lineHeight: 1.55 }}>
          La comida de hoy no tiene una base que escale (arroz, patata, legumbre…),
          así que es <strong>igual para todos</strong>. Elige una comida con base para repartir
          kcal por persona.
        </div>
      </div>
    )
  }

  // ── Single person selected → their scaled recipe ─────────────────────────
  if (activeProfileId !== 'all') {
    const me = scales.find(x => x.p.id === activeProfileId)
    if (!me || !me.s) return null
    const { p, s, target, kcalAchieved } = me
    return (
      <div style={wrap}>
        <div style={heading}>Comida personalizada · {p.name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ fontFamily: 'var(--t-font-display)', fontSize: '1.6rem', fontWeight: 300, color: 'var(--t-text)', lineHeight: 1 }}>
            {s.ingName} {s.grams}g
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--t-text-faint)' }}>
            (base {s.defaultGrams}g · {s.deltaKcal >= 0 ? '+' : ''}{s.deltaKcal} kcal)
          </span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--t-text-faint)', marginBottom: s.deficitKcal > 0 ? '0.75rem' : 0 }}>
          Día: {kcalAchieved} / {target} kcal · proteína y resto compartidos
        </div>
        {s.deficitKcal > 0 && (
          <div style={{
            fontSize: '0.78rem', color: 'var(--t-text-soft)', background: 'rgba(154,123,67,0.06)',
            border: '1px solid var(--t-border)', borderRadius: 'var(--t-radius)',
            padding: '0.6rem 0.75rem', lineHeight: 1.5,
          }}>
            🫒 Para redondear, un chorrito de aceite (<strong>~{s.oilTbsp} cda</strong>) y listo.
            La base ya está en su punto cómodo.
          </div>
        )}
      </div>
    )
  }

  // ── "Todos" → differential line + deficit notes ──────────────────────────
  const ingName = scales.find(x => x.s)?.s.ingName ?? scalableKey
  const deficits = scales.filter(x => x.s && x.s.deficitKcal > 0)

  return (
    <div style={wrap}>
      <div style={heading}>Comida personalizada · Todos</div>

      <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.4rem 0.85rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--t-text)' }}>{ingName}</span>
        {scales.map(({ p, s }) => (
          <span key={p.id} style={{ fontSize: '0.85rem', color: 'var(--t-text-soft)' }}>
            <span style={{ color: 'var(--t-text-faint)' }}>{p.initial}</span>{' '}
            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{s ? `${s.grams}g` : '—'}</span>
          </span>
        ))}
      </div>

      <div style={{ fontSize: '0.74rem', color: 'var(--t-text-faint)', lineHeight: 1.5 }}>
        Comida y cena: mismo plato para todos, solo escala la base. Desayuno y merienda
        pueden ser un plato distinto por persona (ver arriba).
      </div>

      {deficits.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {deficits.map(({ p, s }) => (
            <div key={p.id} style={{ fontSize: '0.74rem', color: 'var(--t-text-soft)', lineHeight: 1.4 }}>
              🫒 {p.name}: un chorrito de aceite (~{s.oilTbsp} cda) para redondear.
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
