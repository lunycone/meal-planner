import { useState, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import { PROTEIN } from '../data/proteins'
import { PREP } from '../data/combos'
import { comboAgg, fmt, proteinCost, proteinKcal, ingKcal, ingFat, ingFib, fmtPortion } from '../engine/calc'
import DailyProgress from '../components/DailyProgress'

// ─── Utility functions ────────────────────────────────────────────────────────

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return `${d.getUTCFullYear()}-W${String(Math.ceil((d - yearStart) / 86400000 / 7)).padStart(2, '0')}`
}

function formatDateShort(date) {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

function formatFullDate(date) {
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${date.getDate()} de ${months[date.getMonth()]}`
}

function getDayName(date) {
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  return days[date.getDay()]
}

function isToday(date) {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

function getTodayDayKey() {
  const today = new Date()
  const monday = new Date(today)
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  monday.setDate(diff)

  const DAY_KEYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    if (isToday(d)) return DAY_KEYS[i]
  }
  return null
}

// ─── Meal selector modal ──────────────────────────────────────────────────────

function MealSelectorModal({ allIng, allCombos, onSelect, onClose, mealType }) {
  const [step, setStep] = useState(mealType === 'desayuno' ? 'recipe' : 'protein')
  const [selectedProtein, setSelectedProtein] = useState(null)
  const [selectedPrep, setSelectedPrep] = useState(null)
  const [selectedCombo, setSelectedCombo] = useState(null)
  const [search, setSearch] = useState('')

  const desayunoRecipes = useMemo(() => {
    return Object.entries(allCombos)
      .filter(([k]) => k.startsWith('desayuno-'))
      .map(([k, c]) => ({ key: k, ...c }))
  }, [allCombos])

  const proteinList = useMemo(() => {
    const list = Object.entries(PROTEIN)
      .filter(([, p]) => (p.meals ?? ['comida']).includes(mealType))
      .map(([k, p]) => ({ key: k, ...p }))
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(p => p.name.toLowerCase().includes(q))
  }, [mealType, search])

  const prepList = selectedProtein ? (PROTEIN[selectedProtein]?.preps ?? []) : []

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

// ─── Cycle phase data ────────────────────────────────────────────────────────

const CYCLE_PHASES = [
  { id: 'menstrual',  name: 'Menstrual',  days: 'Días 1–5',   color: '#b85a5a', bg: 'rgba(184,90,90,0.07)',  border: 'rgba(184,90,90,0.18)' },
  { id: 'folicular',  name: 'Folicular',  days: 'Días 6–13',  color: '#9a7b43', bg: 'rgba(154,123,67,0.07)', border: 'rgba(154,123,67,0.18)' },
  { id: 'ovulatoria', name: 'Ovulatoria', days: 'Días 14–16', color: '#5a8a3a', bg: 'rgba(90,138,58,0.07)',  border: 'rgba(90,138,58,0.18)' },
  { id: 'lutea',      name: 'Lútea',      days: 'Días 17–28', color: '#7a5aaa', bg: 'rgba(122,90,170,0.07)', border: 'rgba(122,90,170,0.18)' },
]

function getPhaseScore(proteinKey) {
  const key = (proteinKey ?? '').toLowerCase()
  if (['bacalao','salmón','sardina','caballa','calamar','mejillon','pollock','langosta','ostra'].some(k => key.includes(k)))
    return {
      menstrual:  { stars: 2, note: 'Omega-3 reduce la inflamación menstrual. Aporta hierro no-hemo.' },
      folicular:  { stars: 3, note: 'Proteína ligera y omega-3. Apoya perfectamente la energía ascendente.' },
      ovulatoria: { stars: 3, note: 'Máximo antiinflamatorio. Perfecta combinación para la ovulación.' },
      lutea:      { stars: 3, note: 'B6 y omega-3 reducen retención de líquidos y mejoran el ánimo.' },
    }
  if (['carne-picada','lamb','lomo','cerdo'].some(k => key.includes(k)))
    return {
      menstrual:  { stars: 3, note: 'Hierro hemo biodisponible. Ideal para reponer durante la menstruación.' },
      folicular:  { stars: 1, note: 'Proteína más pesada en esta fase. Mejor optar por opciones ligeras.' },
      ovulatoria: { stars: 1, note: 'Puede ser proinflamatorio. Prefiere pescado o pollo en esta fase.' },
      lutea:      { stars: 3, note: 'Zinc y B12 apoyan el sistema nervioso en la fase lútea.' },
    }
  if (key.includes('hígado') || key.includes('higado'))
    return {
      menstrual:  { stars: 3, note: 'El superalimento menstrual: hierro, folato y B12 en abundancia.' },
      folicular:  { stars: 2, note: 'Nutricionalmente denso. Una vez por semana está muy bien.' },
      ovulatoria: { stars: 1, note: 'Demasiado intenso para esta fase. Opta por algo más ligero.' },
      lutea:      { stars: 2, note: 'B12 y zinc apoyan el sistema nervioso en la fase lútea.' },
    }
  if (key.includes('huevo') || key.includes('tortilla') || key.includes('desayuno'))
    return {
      menstrual:  { stars: 2, note: 'Fáciles de digerir. Aportan colina para el bienestar mental.' },
      folicular:  { stars: 3, note: 'Colina y vitaminas B. Energía limpia para la fase activa.' },
      ovulatoria: { stars: 2, note: 'Proteína completa. Combina con vegetales para potenciar el efecto.' },
      lutea:      { stars: 3, note: 'B6 y triptófano mejoran el sueño y el ánimo en fase lútea.' },
    }
  if (['pollo','pechuga','muslo'].some(k => key.includes(k)))
    return {
      menstrual:  { stars: 2, note: 'Proteína digestiva y suave para días de menor energía.' },
      folicular:  { stars: 3, note: 'Magra y rica en B3. Perfecta para la fase de mayor actividad.' },
      ovulatoria: { stars: 2, note: 'Buena opción combinada con vegetales crucíferos.' },
      lutea:      { stars: 2, note: 'Triptófano para mejorar el sueño en la fase final del ciclo.' },
    }
  return {
    menstrual:  { stars: 2, note: 'Añade una fuente de hierro si puedes (espinacas, semillas).' },
    folicular:  { stars: 2, note: 'Buena base. Complementa con vitamina C para mayor absorción.' },
    ovulatoria: { stars: 2, note: 'Añade vegetales crudos o fermentados para potenciar el efecto.' },
    lutea:      { stars: 2, note: 'Suma magnesio (semillas de calabaza, cacao) para esta fase.' },
  }
}

// ─── Meal detail modal ───────────────────────────────────────────────────────

function MealDetailModal({ mealType, meal, allIng, allCombos, onEdit, onClear, onClose }) {
  const [tab, setTab] = useState('nutricion')
  const mealLabels = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena' }

  if (!meal) return null

  let title = '', cost = 0, kcal = 0, fat = 0, protein = 0, fiber = 0
  let proteinKey = null, ingredients = []

  if (meal.type === 'desayuno') {
    const recipe = allCombos[meal.recipeKey]
    if (recipe) {
      title = recipe.name
      const agg = comboAgg(recipe, allIng)
      cost = agg.cost; kcal = agg.kcal; protein = agg.prot; fat = agg.fat ?? 0; fiber = agg.fib ?? 0
      ingredients = (recipe.items ?? []).map(it => ({
        name: allIng[it.k]?.name ?? it.k,
        portion: fmtPortion(it.p),
        kcal: ingKcal(it.k, it.p, allIng),
        fib: ingFib(it.k, it.p, allIng),
      }))
      proteinKey = meal.recipeKey
    }
  } else if (meal.type === 'plato') {
    const proteinObj = PROTEIN[meal.proteinKey]
    const combo = allCombos[meal.comboKey]
    if (proteinObj && combo) {
      title = `${proteinObj.name} + ${combo.name}`
      const protCost = proteinCost(proteinObj)
      const protKcal = proteinKcal(proteinObj)
      const combAgg  = comboAgg(combo, allIng)
      cost    = protCost + combAgg.cost
      kcal    = protKcal + combAgg.kcal + 235
      protein = (proteinObj.prot ?? 0) + (combAgg.prot ?? 0)
      fat     = combAgg.fat ?? 0
      fiber   = combAgg.fib ?? 0
      proteinKey  = meal.proteinKey
      const rationLabel = proteinObj.ration?.grams
        ? `${proteinObj.ration.grams}g`
        : (proteinObj.ration?.label ?? '1 ración')
      ingredients = [
        { name: proteinObj.name, portion: rationLabel, kcal: protKcal, fib: 0 },
        ...(combo.items ?? []).map(it => ({
          name: allIng[it.k]?.name ?? it.k,
          portion: fmtPortion(it.p),
          kcal: ingKcal(it.k, it.p, allIng),
          fib: ingFib(it.k, it.p, allIng),
        })),
      ]
    }
  }

  const carbs    = Math.max(0, (kcal - protein * 4 - fat * 9) / 4)
  const maxMacro = Math.max(protein, fat, carbs, fiber, 1)
  const phaseScore = getPhaseScore(proteinKey)
  const starLabel  = { 1: 'Evitar', 2: 'OK', 3: 'Ideal' }
  const macros = [
    { label: 'Proteína', value: protein, color: '#5a8a3a' },
    { label: 'Grasa',    value: fat,     color: '#9a7b43' },
    { label: 'Carboh.',  value: carbs,   color: '#6a7aaa' },
    { label: 'Fibra',    value: fiber,   color: '#3a8a7a' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="mds-sheet" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '1.75rem 1.75rem 0', position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', right: '1.5rem', top: '1.5rem',
            background: 'none', border: 'none', color: 'var(--t-text-faint)',
            fontSize: '1rem', cursor: 'pointer', lineHeight: 1, padding: 4,
          }}>✕</button>

          <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t-text-faint)', marginBottom: '0.45rem' }}>
            {mealLabels[mealType]}
          </div>
          <h2 style={{ fontFamily: 'var(--t-font-display)', fontOpticalSizing: 'auto', fontSize: '1.4rem', fontWeight: 300, color: 'var(--t-text)', lineHeight: 1.25, marginBottom: '1.25rem', paddingRight: '2rem' }}>
            {title}
          </h2>

          {/* Hero stats */}
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
            {[
              { val: Math.round(kcal),          lbl: 'kcal'     },
              { val: `${Math.round(protein)}g`, lbl: 'proteína' },
              { val: fmt(cost),                 lbl: 'coste'    },
            ].map(s => (
              <div key={s.lbl}>
                <div style={{ fontFamily: 'var(--t-font-display)', fontOpticalSizing: 'auto', fontSize: '1.9rem', fontWeight: 300, color: 'var(--t-text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--t-text-faint)', marginTop: '0.25rem' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--t-border)', padding: '0 1.75rem' }}>
          {[['nutricion','Nutrición'], ['ciclo','Ciclo menstrual']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === id ? 'var(--t-accent)' : 'transparent'}`,
              padding: '0.75rem 0', marginRight: '1.5rem',
              fontSize: '0.82rem', fontWeight: tab === id ? 600 : 400,
              color: tab === id ? 'var(--t-text)' : 'var(--t-text-faint)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>

          {tab === 'nutricion' && (
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t-text-faint)', marginBottom: '1rem' }}>Macronutrientes</div>
              {macros.map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
                  <div style={{ width: '60px', fontSize: '0.75rem', color: 'var(--t-text-soft)', flexShrink: 0 }}>{m.label}</div>
                  <div style={{ flex: 1, height: 4, background: 'var(--t-border)', borderRadius: 99 }}>
                    <div style={{ width: `${Math.min(100, m.value / maxMacro * 100)}%`, height: '100%', background: m.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ width: '38px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--t-text)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {Math.round(m.value)}g
                  </div>
                </div>
              ))}

              {ingredients.length > 0 && (
                <div style={{ marginTop: '1.75rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t-text-faint)', marginBottom: '0.75rem' }}>Ingredientes</div>
                  {ingredients.map((ing, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.6rem 0', borderBottom: '1px solid var(--t-border)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--t-text)' }}>{ing.name}</span>
                      <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, marginLeft: '1rem', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--t-text-faint)' }}>{ing.portion}</span>
                        {ing.kcal > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--t-text-faint)', minWidth: '48px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(ing.kcal)} kcal</span>}
                        {ing.fib > 0 && <span style={{ fontSize: '0.72rem', color: '#3a8a7a', minWidth: '38px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{ing.fib.toFixed(1)}g fib</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'ciclo' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--t-text-soft)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Cómo encaja esta comida en cada fase del ciclo.
              </p>
              {CYCLE_PHASES.map(phase => {
                const info = phaseScore[phase.id]
                return (
                  <div key={phase.id} style={{
                    padding: '1rem 1.25rem', borderRadius: '6px',
                    border: `1px solid ${phase.border}`, background: phase.bg,
                    marginBottom: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: phase.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: phase.color }}>{phase.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--t-text-faint)' }}>{phase.days}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[1,2,3].map(i => (
                            <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i <= info.stars ? phase.color : 'var(--t-border)' }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: phase.color, width: '36px', textAlign: 'right' }}>
                          {starLabel[info.stars]}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--t-text-soft)', lineHeight: 1.55, margin: 0 }}>
                      {info.note}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid var(--t-border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onEdit}>Cambiar</button>
          <button className="btn-danger" onClick={() => { onClear(); onClose() }}>Borrar</button>
        </div>

      </div>
    </div>
  )
}

// ─── Meal block ──────────────────────────────────────────────────────────────

function MealBlock({ time, mealType, meal, allIng, allCombos, onEdit, onClear, onDetail }) {
  const mealLabels = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena' }

  if (!meal) {
    return (
      <div className={`home-meal-block empty home-meal-block--${mealType}`} onClick={onEdit}>
        <div className="hmb-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="hmb-dot" />
              <span className="hmb-time">{time}</span>
            </div>
            <span className="hmb-label">{mealLabels[mealType]}</span>
          </div>
        </div>
        <button className="hmb-empty-btn">+ Agregar comida</button>
      </div>
    )
  }

  let title = ''
  let cost = 0
  let kcal = 0
  let protein = 0

  if (meal.type === 'desayuno') {
    const recipe = allCombos[meal.recipeKey]
    if (recipe) {
      title = recipe.name
      const agg = comboAgg(recipe, allIng)
      cost = agg.cost
      kcal = agg.kcal
      protein = agg.prot
    }
  } else if (meal.type === 'plato') {
    const proteinObj = PROTEIN[meal.proteinKey]
    const combo = allCombos[meal.comboKey]
    if (proteinObj && combo) {
      title = `${proteinObj.name} + ${combo.name}`
      const protCost = proteinCost(proteinObj)
      const protKcal = proteinKcal(proteinObj)
      const combAgg = comboAgg(combo, allIng)
      cost = protCost + combAgg.cost
      kcal = protKcal + combAgg.kcal + 235
      protein = (proteinObj.prot ?? 0) + (combAgg.prot ?? 0)
    }
  }

  return (
    <div className={`home-meal-block filled home-meal-block--${mealType}`}>
      <div className="hmb-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="hmb-dot" />
            <span className="hmb-time">{time}</span>
          </div>
          <span className="hmb-label">{mealLabels[mealType]}</span>
        </div>
      </div>
      <button className="hmb-content" onClick={onDetail}>
        <span className="hmb-title">{title}</span>
        <div className="hmb-stats">
          {protein > 0 && (
            <span className="hmb-stat key">
              <span className="hmb-stat-num">{Math.round(protein)}g</span>
              <span className="hmb-stat-lbl">proteína</span>
            </span>
          )}
          <span className="hmb-stat">
            <span className="hmb-stat-num">{fmt(cost)}</span>
          </span>
          <span className="hmb-stat">
            <span className="hmb-stat-num">{Math.round(kcal)}</span>
            <span className="hmb-stat-lbl">kcal</span>
          </span>
        </div>
      </button>
      <button className="hmb-clear" onClick={e => { e.stopPropagation(); onClear() }}>✕</button>
    </div>
  )
}

// ─── Daily summary ───────────────────────────────────────────────────────────

function DailySummary({ todayMeals, allIng, allCombos }) {
  const { cost, kcal, protein } = useMemo(() => {
    let totalCost = 0, totalKcal = 0, totalProtein = 0, count = 0

    Object.values(todayMeals).forEach(meal => {
      if (!meal) return
      count++

      if (meal.type === 'desayuno') {
        const recipe = allCombos[meal.recipeKey]
        if (recipe) {
          const agg = comboAgg(recipe, allIng)
          totalCost += agg.cost
          totalKcal += agg.kcal
          totalProtein += agg.prot ?? 0
        }
      } else if (meal.type === 'plato') {
        const proteinObj = PROTEIN[meal.proteinKey]
        const combo = allCombos[meal.comboKey]
        if (proteinObj && combo) {
          const protCost = proteinCost(proteinObj)
          const protKcal = proteinKcal(proteinObj)
          const combAgg = comboAgg(combo, allIng)
          totalCost += protCost + combAgg.cost
          totalKcal += protKcal + combAgg.kcal + 235
          totalProtein += (proteinObj.prot ?? 0) + (combAgg.prot ?? 0)
        }
      }
    })

    return { cost: totalCost, kcal: totalKcal, protein: totalProtein, count }
  }, [todayMeals, allCombos, allIng])

  const plannedCount = Object.values(todayMeals).filter(m => m).length

  return (
    <div className="home-daily-summary">
      <div className="hds-label">Resumen del día</div>
      <div className="hds-grid">
        <div className="hds-cell">
          <div className="hds-value">{fmt(cost)}</div>
          <div className="hds-unit">Coste</div>
        </div>
        <div className="hds-cell">
          <div className="hds-value">{Math.round(kcal)}</div>
          <div className="hds-unit">kcal</div>
        </div>
        <div className="hds-cell">
          <div className="hds-value">{Math.round(protein)}g</div>
          <div className="hds-unit">Proteína</div>
        </div>
        <div className={`hds-cell${plannedCount === 3 ? ' hds-cell--complete' : ''}`}>
          <div className="hds-value">{plannedCount}/3</div>
          <div className="hds-unit">Comidas</div>
        </div>
      </div>
    </div>
  )
}

// ─── Home view ────────────────────────────────────────────────────────────────

export default function HomeView() {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  const setMealSlot = useStore(s => s.setMealSlot)
  const clearMealSlot = useStore(s => s.clearMealSlot)

  const [modalOpen, setModalOpen] = useState(null) // null | 'select-TYPE' | 'detail-TYPE'

  const today = new Date()
  const weekKey = getISOWeek(today)
  const dayKey = getTodayDayKey()
  const dateStr = formatDateShort(today)
  const dayName = getDayName(today)
  const fullDate = formatFullDate(today)

  const currentWeek = weekPlan[weekKey] ?? {}
  const slotKey = (mealType) => `${dayKey}-${mealType}`

  const todayMeals = useMemo(() => ({
    desayuno: currentWeek[slotKey('desayuno')] ?? null,
    comida: currentWeek[slotKey('comida')] ?? null,
    cena: currentWeek[slotKey('cena')] ?? null,
  }), [currentWeek, dayKey])

  function handleMealSelect(mealType, mealData) {
    setMealSlot(weekKey, slotKey(mealType), mealData)
    setModalOpen(null)
  }

  function handleMealClear(mealType) {
    clearMealSlot(weekKey, slotKey(mealType))
  }

  // Detect modal type
  const modalType = modalOpen?.split('-')[0] // 'select' or 'detail'
  const mealTypeFromModal = modalOpen?.split('-')[1] // 'desayuno', 'comida', 'cena'

  return (
    <div className="home-view">
      <header className="home-header">
        <div>
          <h1 className="home-title">Hoy</h1>
          <p className="home-meta">Tu día</p>
        </div>
        <div className="home-date-block">
          <div className="home-date-day">{dayName}</div>
          <div className="home-date-rest">{fullDate}</div>
        </div>
      </header>

      <div className="home-meals">
        <MealBlock
          time="7:00"
          mealType="desayuno"
          meal={todayMeals.desayuno}
          allIng={allIng}
          allCombos={allCombos}
          onEdit={() => setModalOpen('select-desayuno')}
          onDetail={() => setModalOpen('detail-desayuno')}
          onClear={() => handleMealClear('desayuno')}
        />

        <MealBlock
          time="12:30"
          mealType="comida"
          meal={todayMeals.comida}
          allIng={allIng}
          allCombos={allCombos}
          onEdit={() => setModalOpen('select-comida')}
          onDetail={() => setModalOpen('detail-comida')}
          onClear={() => handleMealClear('comida')}
        />

        <MealBlock
          time="19:30"
          mealType="cena"
          meal={todayMeals.cena}
          allIng={allIng}
          allCombos={allCombos}
          onEdit={() => setModalOpen('select-cena')}
          onDetail={() => setModalOpen('detail-cena')}
          onClear={() => handleMealClear('cena')}
        />
      </div>

      <DailySummary todayMeals={todayMeals} allIng={allIng} allCombos={allCombos} />

      <div style={{ padding: '0 1.5rem', marginTop: '1.5rem' }}>
        <DailyProgress todayMeals={todayMeals} allIng={allIng} allCombos={allCombos} />
      </div>

      {/* Detail modal (when clicking a filled meal) */}
      {modalType === 'detail' && mealTypeFromModal && (
        <MealDetailModal
          mealType={mealTypeFromModal}
          meal={todayMeals[mealTypeFromModal]}
          allIng={allIng}
          allCombos={allCombos}
          onEdit={() => setModalOpen(`select-${mealTypeFromModal}`)}
          onClear={() => { handleMealClear(mealTypeFromModal); setModalOpen(null); }}
          onClose={() => setModalOpen(null)}
        />
      )}

      {/* Selector modal (when selecting a new meal) */}
      {modalType === 'select' && mealTypeFromModal && (
        <MealSelectorModal
          allIng={allIng}
          allCombos={allCombos}
          mealType={mealTypeFromModal}
          onSelect={(mealData) => handleMealSelect(mealTypeFromModal, mealData)}
          onClose={() => setModalOpen(null)}
        />
      )}
    </div>
  )
}
