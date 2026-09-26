// Lista de la compra: el mismo cálculo para el Mac (ShoppingListTab) y el
// móvil (mobile/MCompra). Sacado tal cual de ShoppingListTab.
import { useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import { PROTEIN } from '../data/proteins'
import { ingCost, ingKcal, ingProt, ingFat, comboAgg, personLunchScale, comboScalableKey, dayKcal, personMealScalesTwoPass, personTargetForDay, slotForPerson } from '../engine/calc'
import { storeOf } from './stores'
import { DAY_KEYS, addDays, mondayOf, weekKeyOf, fmtRange, activeProfilesOn, startOfDay } from './mealplan'

// Orden lun..dom para resolver el indice que personTargetForDay/personMealScalesTwoPass
// necesitan — mismo orden que en Planificador/BatchPrepTab.
const ALL_DAY_KEYS = DAY_KEYS
const MEALS = ['desayuno', 'comida', 'merienda', 'cena']
const DAY_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// ─── Ventanas ────────────────────────────────────────────────────────────────
// Batch del domingo: se cocina UNA vez (domingo) para lunes-viernes de la
// semana siguiente. offset 0 = la semana en curso (su batch ya se cocino),
// 1 = el proximo batch -- el que hay que comprar, y por eso el de por defecto.
export function getWindow(offset, mode) {
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
  // Precio fijo por racion (sardinas ½ lata, portion {}): cuenta como 1 racion
  return { val: p.serv ?? 1, unit: 'serv' }
}

// Color de la pastilla L-V por categoria (misma leyenda del lateral)
export const CAT_PILL = {
  carne: '#F2A0AE', proteina: '#F2A0AE', lacteo: '#F5C868', fresco: '#8FD4A8',
  legumbre: '#B7B0F0', base: '#E6C39A', otro: '#CFC3B5',
}

// Lo que por defecto se da por «en casa»: especias y básicos de uso suelto
// (precio plano de céntimos, o $0: sal, comino, AOVE, agua…). Ojo: las
// sardinas también son precio plano ($1.15 la ½ lata) y SÍ se compran, de ahí
// el tope. Cada uno se puede mover a mano.
function defaultAtHome(ing) {
  return !!ing && ((ing.flat != null && ing.flat <= 0.10) || ing.perML === 0 || ing.per100 === 0)
}


export default function useShoppingList(batchOffset, viewMode) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  const profiles  = useStore(s => s.profiles)

  const batchWindow = useMemo(() => getWindow(batchOffset, viewMode), [batchOffset, viewMode])

  // Marcado al comprar (por ventana) y «En casa» (para todas las semanas):
  // en el guardado compartido, así Julio y María ven lo mismo.
  const checksKey = `${viewMode}-${weekKeyOf(batchWindow.start)}`
  const shopChecks = useStore(s => s.shopChecks)
  const pantry     = useStore(s => s.pantry)
  const toggleShopCheck = useStore(s => s.toggleShopCheck)
  const setAtHome  = useStore(s => s.setAtHome)
  const checked = useMemo(() => new Set(shopChecks?.[checksKey] ?? []), [shopChecks, checksKey])
  const haveSet = useMemo(() => new Set(pantry?.have ?? []), [pantry])
  const missSet = useMemo(() => new Set(pantry?.miss ?? []), [pantry])
  const toggleChecked = key => toggleShopCheck(checksKey, key)
  const isHome = key => haveSet.has(key) || (defaultAtHome(allIng[key]) && !missSet.has(key))
  const setHome = (key, home) => setAtHome(key, home)

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
      ps[person.id].serv  += pp.serv  ?? (pp.grams == null && pp.ml == null && pp.units == null ? 1 : 0)
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
      if (data.qtyByUnit.serv) qtyStr += `${+data.qtyByUnit.serv.toFixed(1)} ${data.qtyByUnit.serv === 1 ? 'ración' : 'raciones'}`
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
        key: ingKey, name: ing.name, brand: ing.brand, store: storeOf(allIng[ingKey] ?? ing), cat: ing.cat ?? 'otro',
        qty: qtyStr, cost: data.cost, breakdown, usedDays, home: isHome(ingKey),
      })
    })
    return out
  }, [aggregatedItems, allIng, haveSet, missSet]) // eslint-disable-line react-hooks/exhaustive-deps


  return { batchWindow, people, items, batidoAgg, checked, toggleChecked, setHome, allIng }
}
