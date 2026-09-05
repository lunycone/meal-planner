import { useState, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import { PROTEIN } from '../data/proteins'
import { PREP } from '../data/combos'
import { comboAgg, fmt, proteinCost, proteinKcal, proteinProt, ingKcal, ingFat, ingFib, fmtPortion, personLunchScale, pcosCarbLevel, proteinLevel, kcalLevel, LEVEL_COLOR, slotForPerson, slotIsUniform } from '../engine/calc'
import PcosBadge from '../components/PcosBadge'
import DailyProgress from '../components/DailyProgress'
import PersonalizedDay from '../components/PersonalizedDay'
import ProfileSelector from '../components/ProfileSelector'
import SyncStatus from '../components/SyncStatus'

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

// ─── Combo detail modal (preview: coste · kcal · proteína · ingredientes) ─────
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
          <button className="btn-primary" onClick={() => onConfirm(combo.key)}>Seleccionar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Meal selector modal ──────────────────────────────────────────────────────

const MEAL_LABELS_PICKER = { desayuno: 'desayuno', comida: 'comida', merienda: 'merienda', cena: 'cena' }

function MealSelectorModal({ allIng, allCombos, onSelect, onClose, mealType }) {
  const [search, setSearch] = useState('')
  const [recipeDetail, setRecipeDetail] = useState(null)
  const [sortBy, setSortBy] = useState('name') // 'name' | 'price'

  // Every dish for this meal slot — one flat, searchable, sortable list.
  // No protein→combo step: each entry in allCombos is already a complete dish.
  const dishes = useMemo(() => {
    const q = search.toLowerCase()
    let list = Object.entries(allCombos)
      .filter(([, c]) => (c.meals ?? []).includes(mealType))
      .map(([k, c]) => ({ key: k, ...c, _agg: comboAgg(c, allIng) }))
    if (q) list = list.filter(d => d.name.toLowerCase().includes(q))
    if (sortBy === 'price') list = [...list].sort((a, b) => a._agg.cost - b._agg.cost)
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [allCombos, allIng, search, sortBy, mealType])

  function confirmMeal(recipeKey) {
    onSelect({ type: 'desayuno', recipeKey })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Selecciona {MEAL_LABELS_PICKER[mealType] ?? 'plato'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <input
            className="picker-search"
            placeholder="Buscar plato…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6, margin: '0.5rem 0 0.6rem' }}>
            {[['name', 'A-Z'], ['price', 'Precio ↑']].map(([key, label]) => (
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
          <div className="recipe-list">
            {dishes.length === 0 ? (
              <div className="combo-empty">No hay platos para {MEAL_LABELS_PICKER[mealType]}</div>
            ) : (
              dishes.map(recipe => {
                const pLevel = proteinLevel(recipe._agg.prot, mealType)
                const kLevel = kcalLevel(recipe._agg.kcal, mealType)
                return (
                <div
                  key={recipe.key}
                  className="recipe-option"
                  onClick={() => setRecipeDetail(recipe)}
                >
                  <div className="ro-name">
                    {recipe.name}
                    {recipe.jessica && <span className="badge badge-jessica" style={{ marginLeft: 6 }}>María</span>}
                    {pcosCarbLevel(recipe, allIng, mealType) && <PcosBadge level={pcosCarbLevel(recipe, allIng, mealType)} />}
                  </div>
                  <div className="ro-stats">
                    {fmt(recipe._agg.cost)} · <span style={{ color: LEVEL_COLOR[kLevel], fontWeight: 600 }}>{Math.round(recipe._agg.kcal)} kcal</span> · <span style={{ color: LEVEL_COLOR[pLevel], fontWeight: 600 }}>{Math.round(recipe._agg.prot)}g prot</span>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
      {recipeDetail && (
        <ComboDetailModal
          combo={recipeDetail}
          allIng={allIng}
          onConfirm={(key) => confirmMeal(key)}
          onClose={() => setRecipeDetail(null)}
        />
      )}
    </div>
  )
}


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
  const mealLabels = { desayuno: 'Desayuno', comida: 'Comida', merienda: 'Merienda', cena: 'Cena' }

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
      const protCost = proteinCost(proteinObj, false, meal.proteinUnits)
      const protKcal = proteinKcal(proteinObj, false, meal.proteinUnits)
      const protProt = proteinProt(proteinObj, false, meal.proteinUnits)
      const combAgg  = comboAgg(combo, allIng, meal.comboVariants || {})
      cost    = protCost + combAgg.cost
      kcal    = protKcal + combAgg.kcal + 235
      protein = protProt + (combAgg.prot ?? 0)
      fat     = combAgg.fat ?? 0
      fiber   = combAgg.fib ?? 0
      proteinKey  = meal.proteinKey
      const rationUnits = meal.proteinUnits ?? proteinObj.ration?.units
      const rationLabel = proteinObj.ration?.grams
        ? `${proteinObj.ration.grams}g`
        : (proteinObj.ration?.units != null
            ? `${rationUnits} ud`
            : (proteinObj.ration?.label ?? '1 ración'))
      ingredients = [
        { name: proteinObj.name, portion: rationLabel, kcal: protKcal, fib: 0 },
        ...(combo.items ?? []).map(it => {
          let portion = it.p
          if (meal.comboVariants?.[it.k] != null && it.p.units != null) {
            portion = { ...it.p, units: meal.comboVariants[it.k] }
          }
          return {
            name: allIng[it.k]?.name ?? it.k,
            portion: fmtPortion(portion),
            kcal: ingKcal(it.k, portion, allIng),
            fib: ingFib(it.k, portion, allIng),
          }
        }),
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

// Resuelve titulo/coste/kcal/proteina de UN plato ya resuelto (forma plana
// {type, recipeKey|proteinKey+comboKey}) -- compartido entre la vista
// "representante" (un solo plato) y la vista por-persona de abajo.
function getMealStats(meal, allIng, allCombos, gramsOverride) {
  if (!meal) return { title: '', cost: 0, kcal: 0, protein: 0 }
  if (meal.type === 'desayuno') {
    const recipe = allCombos[meal.recipeKey]
    if (!recipe) return { title: '', cost: 0, kcal: 0, protein: 0 }
    const agg = comboAgg(recipe, allIng)
    return { title: recipe.name, cost: agg.cost, kcal: agg.kcal, protein: agg.prot ?? 0 }
  }
  if (meal.type === 'plato') {
    const proteinObj = PROTEIN[meal.proteinKey]
    const combo = allCombos[meal.comboKey]
    if (!proteinObj || !combo) return { title: '', cost: 0, kcal: 0, protein: 0 }
    const protCost = proteinCost(proteinObj, false, meal.proteinUnits)
    const protKcal = proteinKcal(proteinObj, false, meal.proteinUnits)
    const protProt = proteinProt(proteinObj, false, meal.proteinUnits)
    const combAgg = comboAgg(combo, allIng, meal.comboVariants || {}, gramsOverride || {})
    return {
      title: `${proteinObj.name} + ${combo.name}`,
      cost: protCost + combAgg.cost,
      kcal: protKcal + combAgg.kcal + 235,
      protein: protProt + (combAgg.prot ?? 0),
    }
  }
  return { title: '', cost: 0, kcal: 0, protein: 0 }
}

function MealBlock({ time, mealType, meal, rawSlot, profiles, allIng, allCombos, onEdit, onClear, onDetail, gramsOverride }) {
  const mealLabels = { desayuno: 'Desayuno', comida: 'Comida', merienda: 'Merienda', cena: 'Cena' }

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

  // 5 sep 2026 -- desayuno y merienda pueden ser un plato DISTINTO por
  // persona (Julio y Maria, semana modelo cargada); comida y cena siguen la
  // regla de siempre (mismo plato, solo cambia la racion), asi que aqui
  // slotIsUniform les da "true" y caen en la vista de un solo plato de
  // abajo sin cambios. Con mas de un plato de verdad, se muestra una fila
  // por persona en vez de fingir que solo hay uno (antes: se veia SOLO el
  // plato del "representante" -- Julio -- como si Maria comiera lo mismo).
  const profileIds = (profiles ?? []).map(p => p.id)
  const uniform = profileIds.length <= 1 || slotIsUniform(rawSlot, profileIds)

  const header = (
    <div className="hmb-header">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="hmb-dot" />
          <span className="hmb-time">{time}</span>
        </div>
        <span className="hmb-label">{mealLabels[mealType]}</span>
      </div>
    </div>
  )

  if (!uniform) {
    const rows = profiles.map(p => ({ person: p, ...getMealStats(slotForPerson(rawSlot, p.id), allIng, allCombos) }))
    return (
      <div className={`home-meal-block filled home-meal-block--${mealType}`}>
        {header}
        <button className="hmb-content" onClick={onDetail}>
          {rows.map(r => (
            <div key={r.person.id} className="hmb-person-row">
              <span className="hmb-person-badge">{r.person.initial}</span>
              <div className="hmb-person-body">
                <span className="hmb-person-title">{r.title || 'Sin plato'}</span>
                <div className="hmb-person-stats">
                  {r.protein > 0 && <span><strong>{Math.round(r.protein)}g</strong> prot</span>}
                  <span><strong>{fmt(r.cost)}</strong></span>
                  <span><strong>{Math.round(r.kcal)}</strong> kcal</span>
                </div>
              </div>
            </div>
          ))}
        </button>
        <button className="hmb-clear" onClick={e => { e.stopPropagation(); onClear() }}>✕</button>
      </div>
    )
  }

  const { title, cost, kcal, protein } = getMealStats(meal, allIng, allCombos, gramsOverride)

  return (
    <div className={`home-meal-block filled home-meal-block--${mealType}`}>
      {header}
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

function DailySummary({ todayMeals, allIng, allCombos, comidaOverride }) {
  const { cost, kcal, protein } = useMemo(() => {
    let totalCost = 0, totalKcal = 0, totalProtein = 0, count = 0

    Object.entries(todayMeals).forEach(([mealType, meal]) => {
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
          const ov = mealType === 'comida' ? (comidaOverride || {}) : {}
          const protCost = proteinCost(proteinObj, false, meal.proteinUnits)
          const protKcal = proteinKcal(proteinObj, false, meal.proteinUnits)
          const protProt = proteinProt(proteinObj, false, meal.proteinUnits)
          const combAgg = comboAgg(combo, allIng, meal.comboVariants || {}, ov)
          totalCost += protCost + combAgg.cost
          totalKcal += protKcal + combAgg.kcal + 235
          totalProtein += protProt + (combAgg.prot ?? 0)
        }
      }
    })

    return { cost: totalCost, kcal: totalKcal, protein: totalProtein, count }
  }, [todayMeals, allCombos, allIng, comidaOverride])

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
          <div className="hds-value">{plannedCount}/4</div>
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

  // Per-person lunch scaling: when a single person is selected (not "Todos"),
  // their comida shows the scaled base portion (more rice/potato → more kcal).
  const profiles        = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const activeProfile   = activeProfileId === 'all'
    ? null
    : profiles.find(p => p.id === activeProfileId)

  // 5 sep 2026 -- un slot de weekPlan puede ser la forma plana de siempre o
  // { byPerson } (Julio y Maria con platos distintos, semana modelo cargada)
  // -- sin pasar por slotForPerson, meal.type salia undefined para esos
  // dias y CADA lector de todayMeals (MealBlock, DailySummary,
  // DailyProgress, PersonalizedDay...) se quedaba en 0/vacio aunque el slot
  // no fuera null: por eso "Hoy" mostraba las 4 franjas "rellenas" pero a
  // $0.00 / 0 kcal, y a la vez "Sin comidas planeadas para hoy" mas abajo.
  // Con un perfil concreto elegido arriba (T/J/M) se resuelve SU plato de
  // verdad; con "Todos" se usa un representante (el primer perfil valido
  // hoy), igual que hace el resto de tabs.
  const today0 = new Date(); today0.setHours(0, 0, 0, 0)
  const validProfiles = profiles.filter(p => {
    if (p.validoDesde && new Date(p.validoDesde) > today0) return false
    if (p.validoHasta && new Date(p.validoHasta) <= today0) return false
    return true
  })
  const repProfileId = activeProfileId !== 'all' ? activeProfileId : (validProfiles[0]?.id ?? null)

  const todayMeals = useMemo(() => ({
    desayuno: slotForPerson(currentWeek[slotKey('desayuno')], repProfileId),
    comida: slotForPerson(currentWeek[slotKey('comida')], repProfileId),
    merienda: slotForPerson(currentWeek[slotKey('merienda')], repProfileId),
    cena: slotForPerson(currentWeek[slotKey('cena')], repProfileId),
  }), [currentWeek, dayKey, repProfileId])
  const comidaScale = useMemo(
    () => (activeProfile ? personLunchScale(todayMeals, activeProfile, allIng, allCombos) : null),
    [activeProfile, todayMeals, allIng, allCombos]
  )
  const comidaOverride = comidaScale ? { [comidaScale.ingKey]: comidaScale.grams } : null

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
      {/* Profile + Sync — only visible on mobile (hidden from tab bar there) */}
      <div className="home-mobile-controls">
        <SyncStatus />
        <ProfileSelector />
      </div>

      <div className="home-meals">
        <MealBlock
          time="9:00"
          mealType="desayuno"
          meal={todayMeals.desayuno}
          rawSlot={currentWeek[slotKey('desayuno')]}
          profiles={validProfiles}
          allIng={allIng}
          allCombos={allCombos}
          onEdit={() => setModalOpen('select-desayuno')}
          onDetail={() => setModalOpen('detail-desayuno')}
          onClear={() => handleMealClear('desayuno')}
        />

        <MealBlock
          time="12:00"
          mealType="comida"
          meal={todayMeals.comida}
          rawSlot={currentWeek[slotKey('comida')]}
          profiles={validProfiles}
          allIng={allIng}
          allCombos={allCombos}
          gramsOverride={comidaOverride}
          onEdit={() => setModalOpen('select-comida')}
          onDetail={() => setModalOpen('detail-comida')}
          onClear={() => handleMealClear('comida')}
        />

        <MealBlock
          time="16:30"
          mealType="merienda"
          meal={todayMeals.merienda}
          rawSlot={currentWeek[slotKey('merienda')]}
          profiles={validProfiles}
          allIng={allIng}
          allCombos={allCombos}
          onEdit={() => setModalOpen('select-merienda')}
          onDetail={() => setModalOpen('detail-merienda')}
          onClear={() => handleMealClear('merienda')}
        />

        <MealBlock
          time="19:30"
          mealType="cena"
          meal={todayMeals.cena}
          rawSlot={currentWeek[slotKey('cena')]}
          profiles={validProfiles}
          allIng={allIng}
          allCombos={allCombos}
          onEdit={() => setModalOpen('select-cena')}
          onDetail={() => setModalOpen('detail-cena')}
          onClear={() => handleMealClear('cena')}
        />
      </div>

      <DailySummary todayMeals={todayMeals} allIng={allIng} allCombos={allCombos} comidaOverride={comidaOverride} />

      <div style={{ padding: '0 1.5rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <PersonalizedDay todayMeals={todayMeals} allIng={allIng} allCombos={allCombos} />
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
