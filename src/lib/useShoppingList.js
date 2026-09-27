// Lista de la compra: el mismo cálculo para el Mac (ShoppingListTab) y el
// móvil (mobile/MCompra). Sacado tal cual de ShoppingListTab.
import { useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import { PROTEIN } from '../data/proteins'
import { ingCost, ingKcal, ingProt, ingFat, comboAgg, personLunchScale, comboScalableKey, dayKcal, personMealScalesTwoPass, personTargetForDay, slotForPerson } from '../engine/calc'
import { storeOf } from './stores'
import { aggregateIngredients, needAmount, needDim, packPlan, stockAvailable } from './needs'
import { fmtQtyUnit, fmtAmount, packOf } from './packs'
import { DAY_KEYS, addDays, mondayOf, weekKeyOf, fmtRange, activeProfilesOn, startOfDay } from './mealplan'
import { sessionDates, cookDateFor, rangeLabel } from './batchConfig'

// Orden lun..dom para resolver el indice que personTargetForDay/personMealScalesTwoPass
// necesitan — mismo orden que en Planificador/BatchPrepTab.
const ALL_DAY_KEYS = DAY_KEYS
const MEALS = ['desayuno', 'comida', 'merienda', 'cena']
const DAY_LETTER = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// ─── Ventanas ────────────────────────────────────────────────────────────────
// Un batch = una sesión de Ajustes (lib/batchConfig): { monday, si }. Su
// ventana son los días que cubre; «semana» = lunes–domingo de esa semana.
export function getWindow(ref, mode) {
  const monday = ref.monday
  const windowDates = mode === 'semana'
    ? DAY_KEYS.map((dayKey, i) => ({ date: addDays(monday, i), wk: weekKeyOf(monday), dayKey }))
    : sessionDates(monday, ref.si)
  const start = windowDates[0].date, end = windowDates[windowDates.length - 1].date
  return {
    start, end, monday, si: ref.si, days: windowDates.length, windowDates, rangeLabel: fmtRange(start, end),
    cookDate: cookDateFor(monday, ref.si), dayLabel: rangeLabel(windowDates.map(w => DAY_KEYS.indexOf(w.dayKey))),
  }
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
export { CAT_COLORS as CAT_PILL } from './stores'

// Lo que por defecto se da por «en casa»: especias y básicos de uso suelto
// (precio plano de céntimos, o $0: sal, comino, AOVE, agua…). Ojo: las
// sardinas también son precio plano ($1.15 la ½ lata) y SÍ se compran, de ahí
// el tope. Cada uno se puede mover a mano.
function defaultAtHome(ing) {
  return !!ing && ((ing.flat != null && ing.flat <= 0.10) || ing.perML === 0 || ing.per100 === 0)
}


export default function useShoppingList(batchRef, viewMode) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  const profiles  = useStore(s => s.profiles)

  const batchSettings = useStore(s => s.batchSettings)
  const batchWindow = useMemo(() => getWindow(batchRef, viewMode), [+batchRef.monday, batchRef.si, viewMode, batchSettings]) // eslint-disable-line react-hooks/exhaustive-deps

  // Marcado al comprar (por ventana) y «En casa» (para todas las semanas):
  // en el guardado compartido, así Julio y María ven lo mismo.
  // Marcas por sesión (la 1.ª conserva la clave de antes).
  const checksKey = `${viewMode}-${weekKeyOf(batchWindow.monday)}${viewMode === 'batch' && batchRef.si ? `-${batchRef.si}` : ''}`
  const shopChecks = useStore(s => s.shopChecks)
  const pantry     = useStore(s => s.pantry)
  const buyShopItem = useStore(s => s.buyShopItem)
  const setAtHome  = useStore(s => s.setAtHome)
  const stock      = useStore(s => s.stock)
  const stockLog   = useStore(s => s.stockLog)
  const checked = useMemo(() => new Set(shopChecks?.[checksKey] ?? []), [shopChecks, checksKey])
  const haveSet = useMemo(() => new Set(pantry?.have ?? []), [pantry])
  const missSet = useMemo(() => new Set(pantry?.miss ?? []), [pantry])
  // Despensa como estaba ANTES de esta compra: lo que entró al marcar
  // casillas de esta lista no cuenta, si no la fila se «cubriría» sola.
  const pantryBefore = useMemo(() => {
    const avail = stockAvailable(stock, allIng, batchWindow.start)
    const log = stockLog?.[checksKey] ?? {}
    for (const [k, v] of Object.entries(log)) if (avail[k] != null) avail[k] = Math.max(0, avail[k] - v)
    return avail
  }, [stock, stockLog, checksKey, allIng, batchWindow])
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
  const aggregatedItems = useMemo(() => aggregateIngredients({ weekPlan, windowDates: batchWindow.windowDates, profiles, allIng, allCombos }),
    [weekPlan, batchWindow, allCombos, allIng, profiles])

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
      if (v.units > 0) parts.push(`${+v.units.toFixed(1)} pcs`)
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
      if (data.qtyByUnit.grams && ing.unitGrams) qtyStr += `~${Math.ceil(data.qtyByUnit.grams / ing.unitGrams)} pcs `
      else if (data.qtyByUnit.grams) qtyStr += `${Math.round(data.qtyByUnit.grams)} g `
      if (data.qtyByUnit.units && ing.packSize) qtyStr += `~${(data.qtyByUnit.units / ing.packSize).toFixed(1)} ${ing.packLabel}s `
      else if (data.qtyByUnit.units) qtyStr += `${data.qtyByUnit.units} pcs `
      if (data.qtyByUnit.ml) qtyStr += `${Math.round(data.qtyByUnit.ml)} ml `
      if (data.qtyByUnit.serv) qtyStr += `${+data.qtyByUnit.serv.toFixed(1)} ${data.qtyByUnit.serv === 1 ? 'serving' : 'servings'}`
      qtyStr = qtyStr.trim()

      // Desglose por persona: "Julio+María: 150g×3d"
      const personEntries = Object.values(data.persons ?? {})
      const seen = {}
      personEntries.forEach(ps => {
        let q = ''
        if (ps.grams > 0) q = `${Math.round(ps.grams / ps.days)} g`
        else if (ps.units > 0) q = `${+(ps.units / ps.days).toFixed(1)} pcs`
        else if (ps.ml > 0) q = `${Math.round(ps.ml / ps.days)} ml`
        else if (ps.serv > 0) q = `${+(ps.serv / ps.days).toFixed(1)} serv`
        if (!q) return
        const v = `${q} × ${ps.days}`
        ;(seen[v] ??= []).push(ps.name)
      })
      const breakdown = Object.entries(seen).map(([v, names]) => `${names.join(' & ')}: ${v}`).join(' · ')

      const usedDays = new Set(Array.from(data.meals).map(t => t.split(' ')[0]))

      // Paquetes y despensa: lo que hay en casa se resta; lo que falta se
      // compra en paquetes enteros y lo que sobra vuelve a la despensa.
      const staple = isHome(ingKey)
      const pack = packOf(allIng[ingKey])
      const dim = needDim(data, pack)
      const need = dim ? needAmount(data, allIng[ingKey], pack ?? { dim }) : 0
      const pp = packPlan(ingKey, need, staple ? 0 : (pantryBefore[ingKey] ?? 0), allIng)
      const covered = !staple && need > 0 && pp.toBuy <= 0.0001
      let qty = qtyStr, note = '', cost = data.cost
      if (pp.use > 0 && !covered) note = `${fmtAmount(pp.use, dim)} from the pantry`
      if (pp.pack && pp.packs > 0) {
        qty = `${pp.packs} × ${fmtQtyUnit(pp.pack.qty, pp.pack.unit)}`
        const left = pp.leftover > pp.pack.amount * 0.03
          ? ` · ${fmtAmount(pp.leftover, dim)} ${pp.keeps === 'week' ? 'left over — use it this week' : 'stays in the pantry'}`
          : ''
        note = [note, `uses ${fmtAmount(need - pp.use, dim)}${left}`].filter(Boolean).join(' · ')
        if (pp.buyCost != null) cost = pp.buyCost
      } else if (pp.use > 0 && need > 0) {
        cost = data.cost * (pp.toBuy / need)
      }
      if (covered) { qty = `${fmtAmount(need, dim)} of ${fmtAmount(pantryBefore[ingKey], dim)}`; note = 'From the pantry'; cost = 0 }
      out.push({
        key: ingKey, name: ing.name, brand: ing.brand, store: storeOf(allIng[ingKey] ?? ing), cat: ing.cat ?? 'otro',
        qty, need: qtyStr, note, cost, eatCost: data.cost, breakdown, usedDays,
        home: staple || covered, covered, keeps: pp.keeps, dim,
        buyAmount: pp.pack ? (pp.packs ?? 0) * pp.pack.amount : pp.toBuy,
      })
    })
    return out
  }, [aggregatedItems, allIng, haveSet, missSet, pantryBefore]) // eslint-disable-line react-hooks/exhaustive-deps

  // Marcar = comprado: el paquete entra en la despensa (desmarcar lo saca).
  const toggleChecked = key => {
    const it = items.find(i => i.key === key)
    buyShopItem(checksKey, key, checked.has(key) ? 0 : (it?.buyAmount ?? 0))
  }

  return { batchWindow, people, items, batidoAgg, checked, toggleChecked, setHome, allIng, aggregatedItems }
}
