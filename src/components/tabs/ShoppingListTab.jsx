import { useState, useMemo, useEffect } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { CAT_ORDER, CAT_LABELS } from '../../data/ingredients'
import { PROTEIN } from '../../data/proteins'
import { ingCost, ingKcal, ingProt, ingFat, comboAgg, personLunchScale, comboScalableKey, dayKcal, personMealScalesTwoPass, personTargetForDay, slotForPerson } from '../../engine/calc'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { DAY_KEYS, addDays, mondayOf, weekKeyOf, fmtRange, fmtMoney, activeProfilesOn, startOfDay } from '../../lib/mealplan'

// Orden lun..dom para resolver el indice que personTargetForDay/personMealScalesTwoPass
// necesitan — mismo orden que en Planificador/BatchPrepTab.
const ALL_DAY_KEYS = DAY_KEYS
const MEALS = ['desayuno', 'comida', 'merienda', 'cena']
const DAY_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// ─── Ventanas ────────────────────────────────────────────────────────────────
// Batch del domingo: se cocina UNA vez (domingo) para lunes-viernes de la
// semana siguiente. offset 0 = la semana en curso (su batch ya se cocino),
// 1 = el proximo batch -- el que hay que comprar, y por eso el de por defecto.
function getWindow(offset, mode) {
  const monday = addDays(mondayOf(new Date()), offset * 7)
  const n = mode === 'semana' ? 7 : 5
  const windowDates = DAY_KEYS.slice(0, n).map((dayKey, i) => {
    const d = addDays(monday, i)
    return { date: d, wk: weekKeyOf(monday), dayKey }
  })
  return { start: monday, end: addDays(monday, n - 1), days: n, windowDates, rangeLabel: fmtRange(monday, addDays(monday, n - 1)) }
}

// Helper to extract quantity from portion object
function getQtyValue(p) {
  if (p.grams != null) return { val: p.grams, unit: 'grams' }
  if (p.units != null) return { val: p.units, unit: 'units' }
  if (p.ml != null) return { val: p.ml, unit: 'ml' }
  if (p.serv != null) return { val: p.serv, unit: 'serv' }
  return { val: 0, unit: 'unknown' }
}

// Color de la pastilla L-V por categoria (misma leyenda del lateral)
const CAT_PILL = {
  carne: '#F2A0AE', proteina: '#F2A0AE', lacteo: '#F5C868', fresco: '#8FD4A8',
  legumbre: '#B7B0F0', base: '#E6C39A', otro: '#CFC3B5',
}

// Lo que por defecto se da por «en casa»: especias y básicos de uso suelto
// (precio plano o $0, ver ingredients.js). Cada uno se puede mover a mano.
function defaultAtHome(ing) {
  return ing && (ing.flat != null || ing.perML === 0 || ing.per100 === 0)
}

function readSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? '[]')) } catch { return new Set() }
}
function writeSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])) } catch {}
}

function Check({ on }) {
  return (
    <span className={`mp-check${on ? ' is-on' : ''}`} aria-hidden="true">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </span>
  )
}

// ─── Main shopping list ──────────────────────────────────────────────────────
export default function ShoppingListTab() {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  const profiles  = useStore(s => s.profiles)

  const [batchOffset, setBatchOffset] = useState(1)
  const [viewMode, setViewMode] = useState('batch') // 'batch' | 'semana'
  const [tab, setTab] = useState('buy')             // 'buy' | 'home'
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('category')
  const [copied, setCopied] = useState(false)

  const batchWindow = useMemo(() => getWindow(batchOffset, viewMode), [batchOffset, viewMode])

  // Marcado al comprar: por dispositivo y por ventana (cada batch empieza
  // limpio). «En casa» es por dispositivo y vale para todas las semanas.
  const checksKey = `mp-compra-checks-${viewMode}-${weekKeyOf(batchWindow.start)}`
  const [checked, setChecked] = useState(() => readSet(checksKey))
  useEffect(() => { setChecked(readSet(checksKey)) }, [checksKey])
  const [haveSet, setHaveSet] = useState(() => readSet('mp-compra-have'))
  const [missSet, setMissSet] = useState(() => readSet('mp-compra-miss'))

  function toggleChecked(key) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      writeSet(checksKey, next)
      return next
    })
  }
  const isHome = key => haveSet.has(key) || (defaultAtHome(allIng[key]) && !missSet.has(key))
  function setHome(key, home) {
    const h = new Set(haveSet), m = new Set(missSet)
    if (home) { h.add(key); m.delete(key) } else { h.delete(key); m.add(key) }
    setHaveSet(h); setMissSet(m); writeSet('mp-compra-have', h); writeSet('mp-compra-miss', m)
  }

  // Who's active across this batch window
  const people = useMemo(() => {
    const ids = new Map()
    batchWindow.windowDates.forEach(({ date }) => activeProfilesOn(profiles, startOfDay(date)).forEach(p => ids.set(p.id, p)))
    return [...ids.values()]
  }, [batchWindow, profiles])
  // Compat con el bloque de agregado (usa este nombre)
  const profilesActiveOn = activeProfilesOn

  // Aggregate ingredients for the current batch window only.
  // 6 sep 2026 — reescrito para ser CONSCIENTE DE LA PERSONA: cada slot puede
  // ser la forma plana (mismo plato para todos, como escribe el picker manual)
  // o la forma { byPerson } (Julio y Maria comen platos distintos ese dia,
  // como carga "semana modelo"). Antes esta funcion asumia siempre la forma
  // plana y un unico `meal.recipeKey` para todo el dia — con byPerson, ese
  // acceso directo no encontraba nada y la lista salia vacia ($0.00), aunque
  // el Planificador y el Batch sí mostraran platos. Ahora cada persona activa
  // resuelve su propio plato via slotForPerson, igual que esos otros tabs.
  // Comida/cena ademas usan personMealScalesTwoPass (mismas dos pasadas que
  // el kcal mostrado en Planificador/Batch) para que los gramos de la base
  // escalable y el AOVE de autocierre coincidan con lo que de verdad se sirve.
  // El tipo legacy 'plato' (proteina+combo por separado) ya no se soporta
  // aqui — el planificador lo auto-limpia en cuanto lo ve (ver
  // WeeklyMealPlannerTab), igual que ya asumia el Batch tab.
  const aggregatedItems = useMemo(() => {
    const agg = {}

    // persons: { [id]: { name, grams, units, ml, serv, days } }
    function ensureAgg(ingKey) {
      if (!agg[ingKey]) agg[ingKey] = { qtyByUnit: {}, cost: 0, kcal: 0, prot: 0, fat: 0, meals: new Set(), persons: {} }
    }
    function trackPerson(ingKey, person, pp) {
      const ps = agg[ingKey].persons
      if (!ps[person.id]) ps[person.id] = { name: person.name, grams: 0, units: 0, ml: 0, serv: 0, days: 0 }
      ps[person.id].grams += pp.grams ?? 0
      ps[person.id].units += pp.units ?? 0
      ps[person.id].ml    += pp.ml    ?? 0
      ps[person.id].serv  += pp.serv  ?? 0
      ps[person.id].days  += 1
    }
    // Racion de UNA persona para UNA comida — se suma al agregado y se
    // registra en el desglose por persona.
    function addForPerson(ingKey, portion, mealTag, person) {
      ensureAgg(ingKey)
      const { val, unit } = getQtyValue(portion)
      if (!agg[ingKey].qtyByUnit[unit]) agg[ingKey].qtyByUnit[unit] = 0
      agg[ingKey].qtyByUnit[unit] += val
      agg[ingKey].cost += ingCost(ingKey, portion, allIng)
      agg[ingKey].kcal += ingKcal(ingKey, portion, allIng)
      agg[ingKey].prot += ingProt(ingKey, portion, allIng)
      agg[ingKey].fat  += ingFat(ingKey, portion, allIng)
      agg[ingKey].meals.add(mealTag)
      trackPerson(ingKey, person, portion)
    }

    function scalePortion(p, factor) {
      if (factor === 1) return p
      const out = { ...p }
      if (out.grams != null) out.grams = Math.round(out.grams * factor)
      if (out.ml    != null) out.ml    = Math.round(out.ml    * factor)
      if (out.units != null) out.units = Math.round(out.units * factor * 2) / 2
      return out
    }

    batchWindow.windowDates.forEach(({ date, wk, dayKey }) => {
      const weekData = weekPlan[wk] ?? {}
      const dayProfiles = profilesActiveOn(profiles, date)
      if (dayProfiles.length === 0) return
      const dayIdx = ALL_DAY_KEYS.indexOf(dayKey)

      for (const mealType of MEALS) {
        const rawSlot = weekData[`${dayKey}-${mealType}`] ?? null
        if (!rawSlot) continue
        const mealTag = `${dayKey} ${mealType}`
        const isScalable = mealType === 'comida' || mealType === 'cena'

        dayProfiles.forEach(person => {
          const meal = slotForPerson(rawSlot, person.id)
          if (!meal || meal.type !== 'desayuno') return
          const combo = allCombos[meal.recipeKey]
          if (!combo) return

          let scale = null
          let scalableKey = null
          if (isScalable) {
            scalableKey = comboScalableKey(combo, allIng)
            const target = personTargetForDay(person, dayIdx)
            const dayForPerson = Object.fromEntries(
              MEALS.map(m => [m, slotForPerson(weekData[`${dayKey}-${m}`] ?? null, person.id)])
            )
            const twoPass = personMealScalesTwoPass(dayForPerson, person, allIng, allCombos, target)
            scale = mealType === 'comida' ? twoPass.comida : twoPass.cena
          }

          const wholeFactor = (scale?.wholeDishFactor != null && scale.wholeDishFactor < 1) ? scale.wholeDishFactor : 1

          combo.items.forEach(it => {
            if (it.k === scalableKey && scale?.grams != null) {
              addForPerson(it.k, { ...it.p, grams: scale.grams }, mealTag, person)
            } else {
              addForPerson(it.k, scalePortion(it.p, wholeFactor), mealTag, person)
            }
          })
          if (combo.optionalItems && meal.comboOptionals?.length > 0) {
            combo.optionalItems
              .filter(oi => meal.comboOptionals.includes(oi.k))
              .forEach(it => addForPerson(it.k, scalePortion(it.p, wholeFactor), mealTag, person))
          }
          // AOVE de autocierre (personMealScale): el chorro extra que cierra
          // el hueco de kcal cuando la base ya esta al tope — mismo aceite
          // que ya se cuenta en Planificador/Batch, aqui como ingrediente mas.
          if (scale?.oilMlApplied > 0) {
            addForPerson('aove', { ml: scale.oilMlApplied }, mealTag, person)
          }
        })
      }    // end mealType loop
    })     // end windowDates.forEach

    return agg
  }, [weekPlan, batchWindow, allCombos, allIng, profiles])

  // ── Batido merienda suggestions aggregate ─────────────────────────────────
  const batidoAgg = useMemo(() => {
    const validProfiles = profiles.filter(p => {
      const now = new Date()
      if (p.validoDesde && new Date(p.validoDesde) > now) return false
      if (p.validoHasta && new Date(p.validoHasta) <= now) return false
      return true
    })
    if (validProfiles.length === 0) return []

    const batidos = Object.entries(allCombos)
      .filter(([, r]) => r.tag === 'batido')
      .map(([key, r]) => { const a = comboAgg(r, allIng); return { key, recipe: r, name: r.name.replace('Batido: ', '').replace('Batido económico: ', ''), kcal: a.kcal, cost: a.cost } })

    if (batidos.length === 0) return []

    // Per ingredient accumulator: { [ingKey]: { name, grams, ml, units, cost } }
    const acc = {}
    const addToAcc = (k, p) => {
      const ing = allIng[k]
      if (!ing) return
      if (!acc[k]) acc[k] = { name: ing.name, grams: 0, ml: 0, units: 0, cost: 0 }
      acc[k].grams += p.grams ?? 0
      acc[k].ml    += p.ml    ?? 0
      acc[k].units += p.units ?? 0
      acc[k].cost  += ingCost(k, p, allIng)
    }

    batchWindow.windowDates.forEach(({ date, wk, dayKey }) => {
      const weekData = weekPlan[wk] ?? {}
      const dayProfiles = profilesActiveOn(profiles, new Date(date))
      if (dayProfiles.length === 0) return
      const day = Object.fromEntries(['desayuno','comida','cena'].map(m => [m, weekData[`${dayKey}-${m}`] ?? null]))
      if (!['desayuno','comida','cena'].some(m => day[m])) return

      dayProfiles.forEach(person => {
        const scale = personLunchScale(day, person, allIng, allCombos)
        const achieved = scale ? scale.dayKcalAchieved : dayKcal(day, allIng, allCombos)
        const deficit = Math.round(person.kcalTarget - achieved)
        if (deficit < 150) return
        const best = batidos.reduce((a, b) => Math.abs(a.kcal - deficit) <= Math.abs(b.kcal - deficit) ? a : b)
        best.recipe.items.forEach(it => addToAcc(it.k, it.p))
      })
    })

    return Object.entries(acc).map(([k, v]) => {
      const parts = []
      if (v.grams > 0) parts.push(`${Math.round(v.grams)}g`)
      if (v.ml    > 0) parts.push(`${Math.round(v.ml)}ml`)
      if (v.units > 0) parts.push(`${+v.units.toFixed(1)} ud`)
      return { key: k, name: v.name, qty: parts.join(' + '), cost: v.cost }
    })
  }, [weekPlan, batchWindow, profiles, allCombos, allIng])

  // Filas: una por ingrediente, con cantidad a comprar, días en que se usa y
  // si está «en casa».
  const items = useMemo(() => {
    const out = []
    Object.entries(aggregatedItems).forEach(([ingKey, data]) => {
      // allIng covers combos/misc; proteins like lomo/pollo live only in PROTEIN
      const ing = allIng[ingKey]
        ?? (PROTEIN[ingKey] ? { name: PROTEIN[ingKey].name, cat: 'proteina' } : null)
      if (!ing) return

      // Cantidades. unitGrams (banana): se compra por pieza, redondeo hacia
      // arriba. packSize/packLabel (huevo): en paquete cerrado, decimal exacto.
      let qtyStr = ''
      if (data.qtyByUnit.grams && ing.unitGrams) qtyStr += `~${Math.ceil(data.qtyByUnit.grams / ing.unitGrams)} ud `
      else if (data.qtyByUnit.grams) qtyStr += `${Math.round(data.qtyByUnit.grams)} g `
      if (data.qtyByUnit.units && ing.packSize) qtyStr += `~${(data.qtyByUnit.units / ing.packSize).toFixed(1)} ${ing.packLabel}s `
      else if (data.qtyByUnit.units) qtyStr += `${data.qtyByUnit.units} ud `
      if (data.qtyByUnit.ml) qtyStr += `${Math.round(data.qtyByUnit.ml)} ml `
      if (data.qtyByUnit.serv) qtyStr += `${data.qtyByUnit.serv} porción`
      qtyStr = qtyStr.trim()

      // Desglose por persona: "Julio+María: 150g×3d"
      const personEntries = Object.values(data.persons ?? {})
      const seen = {}
      personEntries.forEach(ps => {
        let q = ''
        if (ps.grams > 0) q = `${Math.round(ps.grams / ps.days)} g`
        else if (ps.units > 0) q = `${+(ps.units / ps.days).toFixed(1)} ud`
        else if (ps.ml > 0) q = `${Math.round(ps.ml / ps.days)} ml`
        else if (ps.serv > 0) q = `${+(ps.serv / ps.days).toFixed(1)} rac`
        if (!q) return
        const v = `${q} × ${ps.days}`
        ;(seen[v] ??= []).push(ps.name)
      })
      const breakdown = Object.entries(seen).map(([v, names]) => `${names.join(' y ')}: ${v}`).join(' · ')

      const usedDays = new Set(Array.from(data.meals).map(t => t.split(' ')[0]))
      out.push({
        key: ingKey, name: ing.name, brand: ing.brand, store: ing.store, cat: ing.cat ?? 'otro',
        qty: qtyStr, cost: data.cost, breakdown, usedDays, home: isHome(ingKey),
      })
    })
    return out
  }, [aggregatedItems, allIng, haveSet, missSet]) // eslint-disable-line react-hooks/exhaustive-deps

  const q = searchTerm.trim().toLowerCase()
  const buy = items.filter(i => !i.home)
  const home = items.filter(i => i.home)
  const visible = (tab === 'buy' ? buy : home).filter(i => !q || i.name.toLowerCase().includes(q))
  const sorted = [...visible].sort((a, b) =>
    sortBy === 'cost' ? b.cost - a.cost
    : sortBy === 'name' ? a.name.localeCompare(b.name)
    : (CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat)) || a.name.localeCompare(b.name))

  const buyTotal = buy.reduce((s, i) => s + i.cost, 0)
  const done = buy.filter(i => checked.has(i.key))
  const doneCost = done.reduce((s, i) => s + i.cost, 0)
  const byCat = CAT_ORDER.map(c => ({ c, cost: buy.filter(i => i.cat === c).reduce((s, i) => s + i.cost, 0) })).filter(x => x.cost > 0.004)
  const maxCat = Math.max(0.01, ...byCat.map(x => x.cost))
  const catsPresent = CAT_ORDER.filter(c => buy.some(i => i.cat === c))
  const freezeMeat = viewMode === 'batch' && buy.some(i => (i.cat === 'carne' || i.cat === 'proteina') && (i.usedDays.has('jue') || i.usedDays.has('vie')))
  const batchSunday = addDays(batchWindow.start, -1)
  const dayCols = batchWindow.windowDates.map(w => w.dayKey)

  function copyToClipboard() {
    let text = `Compra · ${viewMode === 'batch' ? 'batch' : 'semana'} ${batchWindow.rangeLabel}\n\n`
    CAT_ORDER.forEach(cat => {
      const list = buy.filter(i => i.cat === cat)
      if (!list.length) return
      text += `${(CAT_LABELS[cat] ?? cat).toUpperCase()}\n`
      list.forEach(i => { text += `  ☐ ${i.name} — ${i.qty} (${fmtMoney(i.cost)})\n` })
      text += '\n'
    })
    text += `TOTAL: ${fmtMoney(buyTotal)}`
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }).catch(() => {})
  }

  let lastCat = null
  const gridCols = `26px minmax(0, 1.1fr) minmax(0, 1.2fr) repeat(${dayCols.length}, 34px) 70px 28px`

  return (
    <div className="compra">
      <div className="mp-page-head mp-rise">
        <div className="mp-page-title">
          <h1>Compra</h1>
          <span>{viewMode === 'batch' ? `batch del domingo ${batchSunday.getDate()} · lun ${batchWindow.start.getDate()} – vie ${batchWindow.end.getDate()}` : `semana ${batchWindow.rangeLabel}`}{people.length ? ` · ${people.map(p => p.name).join(' y ')}` : ''}</span>
        </div>
        <div className="mp-page-tools">
          <Segmented label="Lista" value={tab} onChange={setTab}
            options={[{ value: 'buy', label: `Por comprar · ${buy.length}` }, { value: 'home', label: `En casa · ${home.length}` }]} />
          <Segmented label="Periodo" value={viewMode} onChange={v => setViewMode(v)}
            options={[{ value: 'batch', label: 'Batch L–V' }, { value: 'semana', label: 'Semana L–D' }]} />
          <div className="mp-seg" style={{ gap: 0 }}>
            <button type="button" aria-label="Anterior" onClick={() => setBatchOffset(o => o - 1)} style={{ padding: '0 10px' }}><Icon name="left" size={12} stroke={2.6} /></button>
            <button type="button" onClick={() => setBatchOffset(1)} style={{ fontWeight: 600, color: 'var(--c-ink)' }} title="El próximo batch">Próximo</button>
            <button type="button" aria-label="Siguiente" onClick={() => setBatchOffset(o => o + 1)} style={{ padding: '0 10px' }}><Icon name="right" size={12} stroke={2.6} /></button>
          </div>
        </div>
      </div>

      <div className="compra-grid">
        <section className="compra-list mp-glass mp-rise" style={{ animationDelay: '80ms' }}>
          <div className="compra-tools">
            <label className="mp-search" style={{ flex: 1, maxWidth: 320 }}>
              <Icon name="search" size={14} stroke={2.4} />
              <span className="sr-only">Buscar ingrediente</span>
              <input placeholder="Buscar ingrediente…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </label>
            <Segmented label="Ordenar" value={sortBy} onChange={setSortBy}
              options={[{ value: 'category', label: 'Categoría' }, { value: 'cost', label: 'Precio' }, { value: 'name', label: 'A–Z' }]} />
            {tab === 'buy' && <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={copyToClipboard} disabled={!buy.length}><Icon name={copied ? 'check' : 'copy'} size={14} />{copied ? 'Copiada' : 'Copiar lista'}</button>}
          </div>

          {items.length === 0 && (
            <div className="mp-empty" style={{ padding: '60px 20px' }}>
              No hay platos planificados en estos días.<br />
              <button className="mp-btn mp-btn-dark" style={{ marginTop: 14 }} onClick={() => useStore.getState().openPlanner(batchOffset, 0)}><Icon name="cal" size={14} />Abrir en el Planificador</button>
            </div>
          )}

          {tab === 'buy' && sorted.length > 0 && (
            <>
              <div className="compra-head" style={{ gridTemplateColumns: gridCols }}>
                <span /><span>Producto</span><span>Compras</span>
                {dayCols.map(d => <span key={d} style={{ textAlign: 'center' }}>{DAY_LETTER[DAY_KEYS.indexOf(d)]}</span>)}
                <span style={{ textAlign: 'right' }}>Precio</span><span />
              </div>
              {sorted.map((i, n) => {
                const on = checked.has(i.key)
                const header = sortBy === 'category' && i.cat !== lastCat ? (lastCat = i.cat, CAT_LABELS[i.cat] ?? i.cat) : null
                return (
                  <div key={i.key}>
                    {header && <div className="compra-cat">{header}</div>}
                    <div className={`compra-row mp-in${on ? ' is-done' : ''}`} style={{ gridTemplateColumns: gridCols, animationDelay: `${Math.min(n, 20) * 22}ms` }}>
                      <button type="button" className="compra-hit" aria-pressed={on} aria-label={`${on ? 'Desmarcar' : 'Marcar'} ${i.name}`} onClick={() => toggleChecked(i.key)} />
                      <Check on={on} />
                      <span className="compra-name" title={i.breakdown}>
                        <span>{i.name}</span>
                        {(i.brand || i.breakdown) && <small>{i.brand ? `${i.brand}${i.store ? ' · ' + i.store : ''}` : i.breakdown}</small>}
                      </span>
                      <span className="compra-qty mp-num">{i.qty}</span>
                      {dayCols.map(d => (
                        <span key={d} style={{ display: 'flex', justifyContent: 'center' }}>
                          <span className="compra-pill" style={i.usedDays.has(d) ? { background: CAT_PILL[i.cat] ?? CAT_PILL.otro, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' } : undefined} />
                        </span>
                      ))}
                      <span className="mp-num" style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 600 }}>{fmtMoney(i.cost)}</span>
                      <button type="button" className="compra-mini" title="Ya lo tengo en casa" onClick={() => setHome(i.key, true)}><Icon name="home" size={13} /></button>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {tab === 'home' && (
            <>
              <p className="mp-muted" style={{ margin: '4px 0 12px', fontSize: 13, lineHeight: 1.5 }}>
                Especias, aceite y lo que ya tienes. No entra en el total; si se acaba, pásalo a «Falta» y vuelve a la lista.
              </p>
              <div className="compra-home">
                {sorted.map((i, n) => (
                  <div key={i.key} className="compra-home-row mp-in" style={{ animationDelay: `${Math.min(n, 20) * 22}ms` }}>
                    <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{i.name}</span>
                      <span className="mp-muted mp-num" style={{ fontSize: 12 }}>{i.qty} esta {viewMode === 'batch' ? 'tanda' : 'semana'}{i.cost > 0.004 ? ` · ${fmtMoney(i.cost)}` : ''}</span>
                    </span>
                    <Segmented label={`${i.name}: en casa`} value="have" onChange={v => v === 'miss' && setHome(i.key, false)}
                      options={[{ value: 'have', label: 'Hay' }, { value: 'miss', label: 'Falta' }]} />
                  </div>
                ))}
                {sorted.length === 0 && <div className="mp-empty">Nada marcado como en casa.</div>}
              </div>
            </>
          )}

          {tab === 'buy' && batidoAgg.length > 0 && (
            <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px dashed var(--c-line-2)' }}>
              <span className="mp-eyebrow">Batidos de merienda sugeridos · no incluidos arriba</span>
              {batidoAgg.map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: '1px solid var(--c-line)', fontSize: 13.5 }}>
                  <span>{item.name}</span><span className="mp-muted mp-num">{item.qty} · {fmtMoney(item.cost)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="compra-aside">
          <section className="mp-glass mp-card mp-rise" style={{ animationDelay: '160ms', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="mp-muted" style={{ fontSize: 12, fontWeight: 600 }}>En el carro</span>
            <span className="mp-num" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em' }}>{done.length}<span style={{ fontSize: 16, color: 'var(--c-ink-3)' }}> / {buy.length}</span></span>
            {buy.length > 0 && buy.length <= 36 ? (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${buy.length}, minmax(0, 1fr))`, gap: 3 }}>
                {buy.map(i => <span key={i.key} style={{ height: 8, borderRadius: 4, background: checked.has(i.key) ? 'var(--c-green)' : 'rgba(110,80,50,0.12)', transition: 'background .4s' }} />)}
              </div>
            ) : (
              <span style={{ height: 8, borderRadius: 4, background: 'rgba(110,80,50,0.12)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${buy.length ? done.length / buy.length * 100 : 0}%`, background: 'var(--c-green)', transition: 'width .4s' }} /></span>
            )}
            <span className="mp-muted mp-num" style={{ fontSize: 12.5 }}>{fmtMoney(doneCost)} de {fmtMoney(buyTotal)} en el carro</span>
          </section>

          {byCat.length > 0 && (
            <section className="mp-glass mp-card mp-rise" style={{ animationDelay: '220ms', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Dónde va el dinero</span>
              {byCat.map(({ c, cost }) => (
                <div key={c} style={{ display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr) 58px', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--c-ink-2)' }}>{CAT_LABELS[c] ?? c}</span>
                  <span style={{ height: 7, borderRadius: 4, background: 'rgba(110,80,50,0.08)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${cost / maxCat * 100}%`, borderRadius: 4, background: CAT_PILL[c] ?? CAT_PILL.otro, animation: 'mp-grow 1s var(--c-ease) both' }} /></span>
                  <span className="mp-num" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMoney(cost)}</span>
                </div>
              ))}
            </section>
          )}

          {catsPresent.length > 0 && (
            <section className="mp-glass mp-card mp-rise" style={{ animationDelay: '280ms', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Cuándo se come</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--c-ink-2)' }}>Cada fila marca los días en que ese producto está en algún plato.</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                {catsPresent.map(c => <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 18, height: 12, borderRadius: 4, background: CAT_PILL[c] ?? CAT_PILL.otro }} />{CAT_LABELS[c] ?? c}</span>)}
              </div>
            </section>
          )}

          {viewMode === 'batch' && (
            <section className="mp-card mp-rise compra-tip" style={{ animationDelay: '340ms' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Frescura, resuelta</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: '#3A342D' }}>
                Todo se cocina el domingo {batchSunday.getDate()}; lo de jueves y viernes va al congelador ya hecho.
                {freezeMeat ? ' Por eso la carne y el pescado de esos días se pueden comprar con el resto.' : ''}
              </span>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
