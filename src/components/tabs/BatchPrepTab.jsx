import { useState, useEffect, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { PROTEIN } from '../../data/proteins'
import { PREP } from '../../data/combos'
import { comboScalableKey, personMealScalesTwoPass, personTargetForDay, slotForPerson, DRY_TO_COOKED as COOK_RATIO } from '../../engine/calc'
import { getISOWeek } from '../../utils/date'
import Icon, { MEAL_ICON } from '../ui/Icon'
import { MEAL_STYLE, PERSON_COLOR, addDays, mondayOf, fmtRange } from '../../lib/mealplan'

// Orden de dias para resolver el indice (0=lun..6=dom) que necesita
// personTargetForDay/personMealScale — mismo orden que DAY_KEYS en el
// planificador semanal.
const ALL_DAY_KEYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

// ─── Ingredients that go on fresh each day — only for platos (comida/cena) ───
const FRESH_KEYS = new Set([
  'aguacate', 'lechuga', 'tomate-fresco', 'tomate-cherry', 'pepino',
  'apio', 'nachos', 'cheddar', 'sour-cream',
  'feta-vaca', 'feta-oveja',
])
const YOGUR_FRESH_IN_PLATO = new Set(['yogur-cabra', 'yogur-cabra-plain'])

// ─── Puré: que ingredientes se machacan CON la patata, no aparte ─────────────
// 6 sep 2026 -- el usuario, con razon: en "Pollo pierna + puré patata-
// zanahoria", la leche/mantequilla/zanahoria se mezclan con la patata para
// hacer el pure -- listarlas sueltas junto al pollo (que se hace APARTE, a
// la plancha/horno) da a entender que son independientes quando no lo son.
// Sin anadir metadatos nuevos a cada uno de los ~14 platos de "pure" del
// catalogo (tarea de contenido en si misma) -- heuristica generica: si el
// plato lleva leche+mantequilla juntas (el indicador real de que hay un
// pure), todo lo que este en esta lista se agrupa CON la base escalable
// (patata); lo demas (proteina, aove, especias, guarniciones aparte como
// setas/pipas/manzana) se queda en su propio grupo.
const PUREE_COMPANION_KEYS = new Set(['leche', 'mantequilla', 'zanahoria', 'cebolla-amarilla', 'squash-butternut', 'zucchini', 'puerro'])

// Separa sharedItems (mas la base, si se pasa) en { pureeItems, restItems }.
// Devuelve pureeItems=[] si el plato no lleva pure de verdad (sin leche+
// mantequilla juntas) -- en ese caso todo se queda en restItems, tal cual.
function splitPureeItems(sharedItems, baseName, baseQtyLabel) {
  const keys = new Set(sharedItems.map(it => it.key))
  const isPuree = keys.has('leche') && keys.has('mantequilla')
  if (!isPuree) return { isPuree: false, pureeItems: [], restItems: sharedItems }
  const pureeItems = sharedItems.filter(it => PUREE_COMPANION_KEYS.has(it.key))
  const restItems  = sharedItems.filter(it => !PUREE_COMPANION_KEYS.has(it.key))
  if (baseName && baseQtyLabel) pureeItems.unshift({ name: baseName, qty: baseQtyLabel, key: 'base' })
  return { isPuree: true, pureeItems, restItems }
}

// ─── Protein cook-loss: raw → cooked yield for meats/fish ────────────────────
// The batch total shows RAW grams (what you weigh and put in the oven).
// The per-tupper display shows COOKED grams (what actually lands in the box).
const PROTEIN_YIELD = {
  'lomo':        0.65,   // lomo al horno pierde ~35%
  'pollo':       0.65,
  'lamb':        0.65,
  'carne-picada': 0.70,
  'cerdo-picado': 0.70,
  'higado-vaca': 0.70,
  'bacalao':     0.75,
  'pollock':     0.75,
  'calamares':   0.75,
}

// ─── Dry → cooked weight ratios for legumes / grains ─────────────────────────
// 6 sep 2026 -- ya no es una copia local: era la misma tabla que
// DRY_TO_COOKED en engine/calc.js, mantenida a mano por separado, y por eso
// se desincronizo una vez (faltaba romano-beans aqui pero no alli, o al
// reves -- el bug real fue justo ese). Importada directamente para que no
// pueda volver a pasar.

// ─── Peso aprox. en gramos para ingredientes que vienen "por unidad" ─────────
// Solo se usa para estimar el peso total de un puré ya batido (donde no se
// puede medir cada ingrediente por separado). Valores de cocina, aproximados.
const UNIT_GRAMS = {
  'puerro':          100,
  'cebolla-amarilla': 110,
  'cebolla-morada':  110,
  'zanahoria':        70,
}
const unitToGrams = (key, units) => Math.round((UNIT_GRAMS[key] ?? 100) * units)

// ─── Cook methods — just the timer + label per dish. ─────────────────────────
// In practice most dishes share one tray/pot, so there's no oven-contention to
// model; we only need cookMin (the timer), a label and an emoji. The `resource`/
// `temp` fields are legacy metadata, kept for reference but no longer used.
const PROTEIN_COOK = {
  'carne-picada':   { resource: 'stove',    cookMin: 20, label: 'Sartén',          emoji: '🍳' },
  'cerdo-picado':   { resource: 'stove',    cookMin: 20, label: 'Sartén',          emoji: '🍳' },
  'pollo':          { resource: 'oven', temp: 200, cookMin: 40, label: 'Horno 200°', emoji: '🫕' },
  'bacalao':        { resource: 'oven', temp: 200, cookMin: 25, label: 'Horno 200° + salsa', emoji: '🫕' },
  'lamb':           { resource: 'oven', temp: 200, cookMin: 45, label: 'Horno 200°', emoji: '🫕' },
  'lomo':           { resource: 'oven', temp: 180, cookMin: 35, label: 'Horno 180°', emoji: '🫕' },
  'higado-vaca':    { resource: 'stove',    cookMin: 15, label: 'Sartén',          emoji: '🍳' },
  'higado-bacalao': { resource: 'none',     cookMin: 0,  label: 'Lata (sin cocción)', emoji: '🥫' },
  'sardinas':       { resource: 'none',     cookMin: 0,  label: 'Lata (sin cocción)', emoji: '🥫' },
  'caballa':        { resource: 'none',     cookMin: 0,  label: 'Lata (sin cocción)', emoji: '🥫' },
  'calamares':      { resource: 'stove',    cookMin: 10, label: 'Plancha',         emoji: '🍳' },
  'mejillones':     { resource: 'stove',    cookMin: 10, label: 'Vapor',           emoji: '♨️' },
  'pollock':        { resource: 'oven', temp: 200, cookMin: 25, label: 'Horno 200°', emoji: '🫕' },
  'langosta':       { resource: 'stove',    cookMin: 10, label: 'Sartén',          emoji: '🍳' },
  'ostras':         { resource: 'none',     cookMin: 0,  label: 'Crudo',           emoji: '🦪' },
  'huevos':         { resource: 'stove',    cookMin: 8,  label: 'Sartén',          emoji: '🍳' },
}

const BASE_COOK = {
  'arroz':           { resource: 'stove',    cookMin: 18, label: 'Olla 18 min',     emoji: '🍚' },
  'pasta':           { resource: 'none', alMomento: true, cookMin: 0, label: 'Cocer al servir (10 min)', emoji: '⚡' },
  'patata':          { resource: 'oven', temp: 200, cookMin: 30, label: 'Horno 200°', emoji: '🥔' },
  'garbanzos':       { resource: 'pressure', cookMin: 30, label: 'Olla presión',    emoji: '⚗️', soak: true },
  'black-beans':     { resource: 'pressure', cookMin: 35, label: 'Olla presión',    emoji: '⚗️', soak: true },
  'lentejas-rojas':  { resource: 'stove',    cookMin: 15, label: 'Olla 15 min',     emoji: '🍲' },
  'lentejas-verdes': { resource: 'stove',    cookMin: 20, label: 'Olla 20 min',     emoji: '🍲' },
  'avena':           { resource: 'none', overnight: true, cookMin: 0, label: 'Nevera (noche anterior)', emoji: '❄️' },
  'maiz':            { resource: 'stove',    cookMin: 10, label: 'Olla/sartén',     emoji: '🌽' },
  'alubias-blancas': { resource: 'pressure', cookMin: 35, label: 'Olla presión',    emoji: '⚗️', soak: true },
  'cranberry-beans': { resource: 'pressure', cookMin: 35, label: 'Olla presión',    emoji: '⚗️', soak: true },
  'alubias-rojas':   { resource: 'pressure', cookMin: 35, label: 'Olla presión',    emoji: '⚗️', soak: true },
}

// ─── Per-ingredient prep actions for the prep queue ──────────────────────────
const ING_PREP_ACTION = {
  'cebolla-amarilla':   { emoji: '🧅', action: 'Pela y pica finamente',           prepMin: 5  },
  'cebolla-roja':       { emoji: '🧅', action: 'Pela y pica en juliana',          prepMin: 5  },
  'cebolla-blanca':     { emoji: '🧅', action: 'Pela y pica finamente',           prepMin: 5  },
  'zanahoria':          { emoji: '🥕', action: 'Pela y trocea en dados',          prepMin: 5  },
  'puerro':             { emoji: '🌿', action: 'Limpia y corta en rodajas',       prepMin: 4  },
  'ajo':                { emoji: '🧄', action: 'Pela y lamina (o pica fino)',     prepMin: 3  },
  'pimiento-rojo':      { emoji: '🫑', action: 'Limpia, retira semillas y trocea', prepMin: 4 },
  'pimiento-verde':     { emoji: '🫑', action: 'Limpia, retira semillas y trocea', prepMin: 4 },
  'pimiento-amarillo':  { emoji: '🫑', action: 'Limpia, retira semillas y trocea', prepMin: 4 },
  'tomate':             { emoji: '🍅', action: 'Lava y trocea',                   prepMin: 4  },
  'tomate-triturado':   { emoji: '🍅', action: 'Abre la lata y reserva',         prepMin: 1  },
  'tomate-cherry':      { emoji: '🍅', action: 'Lava y parte por la mitad',      prepMin: 3  },
  'patata':             { emoji: '🥔', action: 'Pela y trocea en gajos',         prepMin: 8  },
  'boniato':            { emoji: '🍠', action: 'Pela y trocea en dados',         prepMin: 6  },
  'coliflor':           { emoji: '🥦', action: 'Lava y separa en ramitos',       prepMin: 5  },
  'brocoli':            { emoji: '🥦', action: 'Lava y separa en ramitos',       prepMin: 4  },
  'champiñon':          { emoji: '🍄', action: 'Limpia con papel húmedo y lamina', prepMin: 6 },
  'champiñones':        { emoji: '🍄', action: 'Limpia con papel húmedo y lamina', prepMin: 6 },
  'espinacas':          { emoji: '🥬', action: 'Lava bien las hojas',            prepMin: 3  },
  'kale':               { emoji: '🥬', action: 'Lava y retira el tallo central', prepMin: 4  },
  'apio':               { emoji: '🥬', action: 'Lava y corta en rodajas',        prepMin: 3  },
  'caldo-verduras':     { emoji: '🥣', action: 'Calienta o prepara el caldo',    prepMin: 5  },
  'caldo-pollo':        { emoji: '🥣', action: 'Calienta o prepara el caldo',    prepMin: 5  },
  'aceite-oliva':       { emoji: '🫒', action: 'Reserva para el sofrito',        prepMin: 1  },
  'pimiento-asado':     { emoji: '🫑', action: 'Abre la lata y escurre',        prepMin: 2  },
  'jengibre':           { emoji: '🫚', action: 'Pela y ralla',                   prepMin: 3  },
  'calabacin':          { emoji: '🥒', action: 'Lava y trocea en dados',         prepMin: 4  },
  'berenjena':          { emoji: '🍆', action: 'Lava, trocea y sala (30 min)',   prepMin: 5  },
  'limon':              { emoji: '🍋', action: 'Exprime',                         prepMin: 2  },
}

// ─── Scheduling constants ────────────────────────────────────────────────────
const PLATE_MIN = 12  // rough buffer for portioning + packing at the end

// ─── Desayuno cooking method (heuristic by name / ingredients) ───────────────
// Most desayunos that need the oven are bakes (cheesecake, muffins, bizcocho…).
// Overnight oats live in the fridge; yogur bowls & batidos need no cooking.
function desayunoMethod(name = '', keys = []) {
  const n = name.toLowerCase()
  if (/overnight|noche anterior|nevera/.test(n) || keys.includes('avena')) {
    return { mode: 'nevera', cookMin: 0, emoji: '❄️', label: 'Nevera (víspera)' }
  }
  // 6 sep 2026 -- masa harina nixtamalizada (maiz, key 'masa-harina') caia
  // por las rendijas: no es 'harina' (harina de trigo, cae en "baked" de
  // abajo) y su nombre ("Burrito 100% maiz") no contiene "tortilla" ni
  // "huevo" -- acababa en el ultimo caso, "Solo mezclar (sin coccion)",
  // que es mentira: la masa se cuece en comal/plancha, y el huevo se
  // revuelve APARTE (no se mezcla crudo con la masa) y se pone dentro del
  // burrito ya hecho. El usuario, con razon: "obviamente van separados".
  if (keys.includes('masa-harina')) {
    return { mode: 'griddle', cookMin: 10, emoji: '🫓', label: 'Comal/plancha la masa — huevo revuelto aparte, no se mezcla crudo' }
  }
  const baked = /cheesecake|brownie|magdalena|muffin|waffle|gofre|pizza|shakshuka|tortilla de patata|al horno|bizcocho|bread|pan |frittata/.test(n)
    || keys.includes('harina')
  if (baked) return { mode: 'oven', cookMin: 25, emoji: '🫕', label: 'Hornear 175°' }
  if (/tortilla|huevo|revuelto|scramble/.test(n)) {
    return { mode: 'stove', cookMin: 8, emoji: '🍳', label: 'Sartén' }
  }
  // yogur bowls, batidos, fruta… — just mix
  return { mode: 'nocook', cookMin: 0, emoji: '🥣', label: 'Solo mezclar (sin cocción)' }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function profilesActiveOn(profiles, date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  return profiles.filter(p => {
    if (p.validoDesde && new Date(p.validoDesde) > d) return false
    if (p.validoHasta && new Date(p.validoHasta) <= d) return false
    return true
  })
}

function fmtBaseDry(key, dryGrams) {
  const ratio = COOK_RATIO[key]
  if (!ratio || dryGrams <= 0) return `${Math.round(dryGrams)}g`
  return `${Math.round(dryGrams)}g seco → ~${Math.round(dryGrams * ratio)}g cocido`
}

function fmtQty({ grams = 0, ml = 0, units = 0, serv = 0 }) {
  const frac = { 0.25: '¼', 0.5: '½', 0.75: '¾' }
  const parts = []
  if (grams > 0) parts.push(`${Math.round(grams)}g`)
  if (ml    > 0) parts.push(`${Math.round(ml)}ml`)
  if (units > 0) parts.push(`${frac[units] ?? units} ud`)
  if (serv  > 0) parts.push(`×${serv}`)
  return parts.join(' + ') || '—'
}

function fmtMMSS(sec) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Core: compute quantities for one meal across all batch days ───────────────
// 6 sep 2026 — reescrito para ser CONSCIENTE DE LA PERSONA: cada dia y cada
// perfil resuelve su propio plato via slotForPerson (antes se asumia un unico
// `meal` compartido por todos). Cuando dos personas tienen el MISMO plato ese
// dia, siguen agrupadas en un solo lote (una sola olla); cuando difieren
// (semana modelo cargada: Julio burrito, Maria torta de garbanzo), salen como
// grupos separados -- cada uno es un lote de cocina distinto de verdad.
// Devuelve un ARRAY de grupos (antes devolvia un unico objeto o null).
// El tipo legacy 'plato' (proteina+combo por separado) ya no se soporta aqui
// -- el planificador lo auto-limpia en cuanto lo ve, ver WeeklyMealPlannerTab.
function computeBatchMeal(mealType, batchDays, profiles, allIng, allCombos, weekPlan) {
  const groups = {} // recipeKey -> { comboRef, scalableKey, meal, personMap, sharedAcc, freshSeen, freshItems }

  for (const { dayKey, date, wk } of batchDays) {
    const weekData    = weekPlan[wk] ?? {}
    const dayProfiles = profilesActiveOn(profiles, date)
    if (dayProfiles.length === 0) continue
    const dayIdx  = ALL_DAY_KEYS.indexOf(dayKey)
    const rawSlot = weekData[`${dayKey}-${mealType}`] ?? null

    for (const person of dayProfiles) {
      const meal = slotForPerson(rawSlot, person.id)
      if (!meal || meal.type !== 'desayuno') continue
      const comboRef = allCombos[meal.recipeKey]
      if (!comboRef) continue
      const scalableKey = comboScalableKey(comboRef, allIng)

      if (!groups[meal.recipeKey]) {
        groups[meal.recipeKey] = {
          comboRef, scalableKey, meal,
          personMap: {}, sharedAcc: {}, freshSeen: new Set(), freshItems: [],
        }
      }
      const g = groups[meal.recipeKey]
      if (!g.personMap[person.id]) {
        g.personMap[person.id] = {
          person, activeDays: 0,
          baseGrams: 0, baseKey: scalableKey,
          baseName: scalableKey ? (allIng[scalableKey]?.name ?? scalableKey) : null,
          recipeServings: 0,
          proteinGrams: 0, proteinUnits: 0, proteinServings: 0, // legacy 'plato' fields — se quedan a 0
        }
      }
      const pt = g.personMap[person.id]
      pt.activeDays++

      if (mealType === 'desayuno' || mealType === 'merienda' || !scalableKey) {
        // desayuno/merienda: una racion del plato, sin escalado por persona
        // (mismo criterio de siempre). Sin base escalable (p.ej. pescado sin
        // patata): tambien se cuenta como racion fija.
        pt.recipeServings += 1
      } else {
        // comida/cena: dos pasadas alternas (personMealScalesTwoPass) -- las
        // mismas cantidades exactas que ya usa el kcal mostrado en
        // Planificador, no un calculo aparte que podria no coincidir.
        const target = personTargetForDay(person, dayIdx)
        const dayForPerson = Object.fromEntries(
          MEALS.map(m => [m, slotForPerson(weekData[`${dayKey}-${m}`] ?? null, person.id)])
        )
        const twoPass = personMealScalesTwoPass(dayForPerson, person, allIng, allCombos, target)
        const scale = mealType === 'comida' ? twoPass.comida : twoPass.cena
        const defaultGrams = comboRef.items.find(it => it.k === scalableKey)?.p?.grams ?? 0
        if (scale?.grams != null) {
          pt.baseGrams += scale.grams
        } else if (scale?.wholeDishFactor != null && scale.wholeDishFactor < 1) {
          // El plato entero se reduce (sobra kcal) -- aqui solo se refleja en
          // la base; carne/queso/aceite del lote compartido no bajan por
          // persona (se sirve algo menos de todo al emplatar, a ojo).
          pt.baseGrams += Math.round(defaultGrams * scale.wholeDishFactor)
        } else {
          pt.baseGrams += defaultGrams
        }
      }
    }

    // Items compartidos del dia, multiplicados por cuantas personas de CADA
    // grupo comen ese dia concreto (no por todos los perfiles del dia).
    for (const g of Object.values(groups)) {
      const peopleToday = dayProfiles.filter(p => slotForPerson(rawSlot, p.id)?.recipeKey === g.meal.recipeKey).length
      if (peopleToday === 0) continue
      const addShared = (k, p) => {
        if (!g.sharedAcc[k]) g.sharedAcc[k] = { name: allIng[k]?.name ?? k, grams: 0, ml: 0, units: 0, serv: 0 }
        g.sharedAcc[k].grams += (p.grams ?? 0) * peopleToday
        g.sharedAcc[k].ml    += (p.ml    ?? 0) * peopleToday
        g.sharedAcc[k].units += (p.units ?? 0) * peopleToday
        // Ingredientes de precio fijo por racion (p.ej. sardinas ½ lata,
        // portion {}): sin gramos/ml/ud desaparecian del lote.
        if (p.grams == null && p.ml == null && p.units == null) g.sharedAcc[k].serv += (p.serv ?? 1) * peopleToday
      }
      // 6 sep 2026 -- BUG: esto excluia el ingrediente "escalable" (auto-
      // detectado por comboScalableKey, corre SIEMPRE, no solo en comida/
      // cena) de sharedItems sin mirar mealType. En desayuno/merienda esa
      // base nunca se trackea aparte (linea 252: solo se cuenta
      // recipeServings, nunca baseGrams) -- asi que el ingrediente
      // desaparecia por completo del batch y de la compra. Le paso a
      // "Tostada con platano, AOVE y sal": comboScalableKey elegia el pan
      // masa madre (mas kcal que el platano) y el pan simplemente no
      // aparecia en ningun lado. Solo excluir aqui cuando de verdad se
      // trackea aparte (comida/cena).
      const isPerPersonScaled = mealType === 'comida' || mealType === 'cena'
      for (const it of g.comboRef.items) {
        if (isPerPersonScaled && it.k === g.scalableKey) continue
        addShared(it.k, it.p)
      }
    }
  }

  return Object.values(groups).map(g => {
    const personTotals = Object.values(g.personMap)
    if (personTotals.length === 0) return null

    let recipePortionGrams = 0
    if (mealType === 'desayuno' || mealType === 'merienda') {
      for (const it of g.comboRef.items) recipePortionGrams += (it.p?.grams ?? 0) + (it.p?.ml ?? 0)
    }

    return {
      meal: g.meal, mealType, mealName: g.comboRef.name,
      proteinName: null, comboName: g.comboRef.name, prepName: null,
      personTotals, recipePortionGrams,
      sharedItems: Object.entries(g.sharedAcc)
        .map(([k, v]) => ({ key: k, ...v }))
        .filter(it => it.grams > 0 || it.ml > 0 || it.units > 0 || it.serv > 0),
      freshItems: g.freshItems,
      hasBase: !!g.scalableKey && personTotals.some(pt => pt.baseGrams > 0),
      blend: g.comboRef?.blend ?? null,
    }
  }).filter(Boolean)
}


// ─── THE PLAN ─────────────────────────────────────────────────────────────────
// Simple by design: gather the cooking jobs (each its own timer), the prep tasks,
// the night-before reminders and the no-cook notes. Everything runs in parallel —
// in practice most dishes share one tray/pot — so there is no oven-contention
// modelling. Total time ≈ the longest timer + a plating buffer.
function buildSchedule(mealDataList) {
  const jobs      = []   // cooking jobs { key, name, emoji, cookMin, qtyLabel, split, ... }
  const prepTasks = []   // active human prep { key, emoji, name, action, prepMin, qty }
  const vispera   = []   // night-before tasks { emoji, text }
  const noCook    = []   // raw / canned / al-momento notes { emoji, text }
  const seenJob   = new Set()
  const seenPrep  = new Set()

  // Per-person portioning so the cook never has to think at the end
  const proteinSplit = (bd) => bd.personTotals
    .filter(pt => pt.proteinGrams > 0 || pt.proteinUnits > 0 || pt.proteinServings > 0)
    .map(pt => ({ name: pt.person.name, label:
      pt.proteinGrams > 0 ? `${Math.round(pt.proteinGrams)}g`
      : pt.proteinUnits > 0 ? `${pt.proteinUnits} ud`
      : `${pt.proteinServings} rac.` }))

  const baseSplit = (bd, baseKey) => {
    const ratio = COOK_RATIO[baseKey]
    return bd.personTotals.filter(pt => pt.baseGrams > 0)
      .map(pt => ({ name: pt.person.name, label: ratio ? `${Math.round(pt.baseGrams * ratio)}g` : `${Math.round(pt.baseGrams)}g` }))
  }

  const desayunoSplit = (bd) => {
    const W = bd.recipePortionGrams || 0
    const totalPortions = bd.personTotals.reduce((s, p) => s + p.recipeServings, 0)
    // Per-tupper breakdown (same for everyone — equal portions)
    const perTupperItems = bd.sharedItems.map(it => {
      const g  = totalPortions > 0 ? Math.round(it.grams / totalPortions) : 0
      const ml = totalPortions > 0 ? Math.round(it.ml    / totalPortions) : 0
      const u  = totalPortions > 0 ? +(it.units / totalPortions).toFixed(2) : 0
      const sv = totalPortions > 0 ? +((it.serv ?? 0) / totalPortions).toFixed(2) : 0
      const qty = g > 0 ? `${g}g` : ml > 0 ? `${ml}ml` : u > 0 ? `${u} ud` : sv > 0 ? `×${sv}` : null
      return qty ? { name: it.name, qty } : null
    }).filter(Boolean)
    // 6 sep 2026 -- el usuario, con razon: "229g de masa por tortilla es
    // muchisimo, no cabe en ninguna sarten". No se toca NINGUNA cantidad
    // (la masa total de la receta sigue siendo la misma) -- solo se sugiere
    // en cuantas tortillas MAS PEQUEÑAS hacer esa misma masa, ~75g cada
    // una (tamaño real de tortilla que cabe en un comal/sarten casero, no
    // una bola enorme de una sola pieza).
    const isMasa = bd.sharedItems.some(it => it.key === 'masa-harina')
    return bd.personTotals.filter(pt => pt.recipeServings > 0)
      .map(pt => {
        let label = `${pt.recipeServings} tupper${pt.recipeServings > 1 ? 's' : ''}${W > 0 ? ` (~${Math.round(W)}g c/u)` : ''}`
        if (isMasa && W > 75) {
          const n = Math.max(2, Math.round(W / 75))
          label += ` → ${n} tortillas de ~${Math.round(W / n)}g (no una sola)`
        }
        return { name: pt.person.name, label, items: perTupperItems }
      })
  }

  const pushPrep = (sharedItems) => {
    for (const it of sharedItems) {
      const pr = ING_PREP_ACTION[it.key]
      if (pr && !seenPrep.has(it.key)) {
        seenPrep.add(it.key)
        prepTasks.push({ key: it.key, emoji: pr.emoji, name: it.name, action: pr.action, prepMin: pr.prepMin, qty: fmtQty(it) })
      }
    }
  }

  for (const { meal, batchData } of mealDataList) {
    if (!meal || !batchData) continue

    const jobsBefore = jobs.length

    if (meal.type === 'plato') {
      // protein
      if (!seenJob.has('p-' + meal.proteinKey)) {
        seenJob.add('p-' + meal.proteinKey)
        const pc = PROTEIN_COOK[meal.proteinKey]
        const totalG = Math.round(batchData.personTotals.reduce((s, p) => s + p.proteinGrams, 0))
        const qtyLabel = totalG > 0 ? `${totalG}g` : ''
        if (pc && pc.cookMin > 0) {
          jobs.push({ key: 'p-' + meal.proteinKey, name: batchData.proteinName, emoji: pc.emoji, cookMin: pc.cookMin, label: pc.label, qtyLabel, split: proteinSplit(batchData) })
        } else if (pc) {
          noCook.push({ emoji: pc.emoji, text: `${batchData.proteinName}: ${pc.label}${qtyLabel ? ` · ${qtyLabel}` : ''}`, split: proteinSplit(batchData) })
        } else if (batchData.proteinName) {
          // Unknown protein → don't drop it, just tell the cook to use their usual method
          noCook.push({ emoji: '🍽️', text: `${batchData.proteinName}: cocina a tu método habitual${qtyLabel ? ` · ${qtyLabel}` : ''}`, split: proteinSplit(batchData) })
        }
      }

      // base
      if (batchData.hasBase) {
        const baseKey  = batchData.personTotals[0]?.baseKey
        const baseName = batchData.personTotals[0]?.baseName
        if (!seenJob.has('b-' + baseKey)) {
          seenJob.add('b-' + baseKey)
          const bc = BASE_COOK[baseKey]
          const totalDry = Math.round(batchData.personTotals.reduce((s, p) => s + p.baseGrams, 0))
          const cooked   = COOK_RATIO[baseKey] ? Math.round(totalDry * COOK_RATIO[baseKey]) : null
          const qtyLabel = cooked ? `${totalDry}g seco → ~${cooked}g cocido` : `${totalDry}g`
          if (bc?.soak)      vispera.push({ emoji: '💧', text: `Pon en remojo ${totalDry}g de ${baseName} — cubre con agua abundante 8–12 h.` })
          if (bc?.overnight) vispera.push({ emoji: '❄️', text: `Deja ${baseName} en la nevera la noche anterior (${qtyLabel}).` })
          if (bc && bc.cookMin > 0) {
            jobs.push({ key: 'b-' + baseKey, name: baseName, emoji: bc.emoji, cookMin: bc.cookMin, label: bc.label, qtyLabel, split: baseSplit(batchData, baseKey) })
          } else if (bc?.alMomento) {
            noCook.push({ emoji: bc.emoji, text: `${baseName}: ${bc.label} (${qtyLabel})`, split: baseSplit(batchData, baseKey) })
          } else if (!bc) {
            // Unknown base → tell the cook to cook per package
            noCook.push({ emoji: '🍚', text: `${baseName}: cuece según el paquete (${qtyLabel})`, split: baseSplit(batchData, baseKey) })
          }
        }
      }

      pushPrep(batchData.sharedItems)

    } else if (meal.type === 'desayuno' && (batchData.mealType === 'comida' || batchData.mealType === 'cena')) {
      // 6 sep 2026 -- BUG: comida/cena de semana modelo tambien se guardan
      // con meal.type:'desayuno' (es solo la forma de guardado -- combo
      // directo, sin proteina separada -- no el momento del dia). Esta rama
      // solo miraba recipeServings (que SOLO se rellena para desayuno/
      // merienda, ver computeBatchMeal linea ~246) -- comida/cena usan
      // baseGrams en su lugar, asi que totalPortions siempre salia 0 y el
      // job nunca se creaba: comida y cena desaparecian enteras del Modo
      // cocina sin ningun aviso. Aqui se trata igual que la base del tipo
      // 'plato' de arriba (mismo BASE_COOK/COOK_RATIO), sin proteina aparte
      // porque en comida/cena la carne/pescado va fija dentro de
      // sharedItems (no se escala por persona, solo el almidon).
      if (batchData.hasBase) {
        const baseKey  = batchData.personTotals[0]?.baseKey
        const baseName = batchData.personTotals[0]?.baseName
        if (baseKey && !seenJob.has('b-' + meal.recipeKey)) {
          seenJob.add('b-' + meal.recipeKey)
          const bc = BASE_COOK[baseKey]
          const totalDry = Math.round(batchData.personTotals.reduce((s, p) => s + p.baseGrams, 0))
          const cooked   = COOK_RATIO[baseKey] ? Math.round(totalDry * COOK_RATIO[baseKey]) : null
          // 6 sep 2026 -- BUG: el numero de "Repartir" (1200g Julio, 1000g
          // Maria...) es la BASE escalable (patata/arroz/etc), pero en
          // ninguna parte de la tarjeta se decia que ese numero era eso --
          // ni la carne ni el resto de ingredientes lo mencionan (se
          // excluyen a proposito de "Lleva", ver computeBatchMeal linea
          // ~294, para no duplicar la cantidad ya escalada). El usuario:
          // "y la patata?? q cojones esta pasando" -- con razon, estaba ahi
          // pero invisible. Ahora el nombre de la base va delante del gramaje.
          const qtyLabel = `${baseName}: ${totalDry}g` + (cooked ? ` seco → ~${cooked}g cocido` : '')
          if (bc?.soak)      vispera.push({ emoji: '💧', text: `Pon en remojo ${totalDry}g de ${baseName} — cubre con agua abundante 8–12 h.` })
          if (bc?.overnight) vispera.push({ emoji: '❄️', text: `Deja ${baseName} en la nevera la noche anterior (${qtyLabel}).` })
          if (bc && bc.cookMin > 0) {
            jobs.push({ key: 'b-' + meal.recipeKey, name: batchData.mealName, emoji: bc.emoji, cookMin: bc.cookMin, label: bc.label, qtyLabel, split: baseSplit(batchData, baseKey) })
          } else if (bc?.alMomento) {
            noCook.push({ emoji: bc.emoji, text: `${batchData.mealName} — ${bc.label} (${qtyLabel})`, split: baseSplit(batchData, baseKey) })
          } else {
            noCook.push({ emoji: '🍚', text: `${batchData.mealName} — cuece según el paquete (${qtyLabel})`, split: baseSplit(batchData, baseKey) })
          }
        }
      } else if (!seenJob.has('m-' + meal.recipeKey)) {
        // Sin base escalable (p.ej. pescado sin patata): nota simple, sin timer.
        seenJob.add('m-' + meal.recipeKey)
        noCook.push({ emoji: '🍽️', text: `${batchData.mealName}: cocina a tu método habitual` })
      }
      pushPrep(batchData.sharedItems)
    } else if (meal.type === 'desayuno') {
      const totalPortions = batchData.personTotals.reduce((s, p) => s + p.recipeServings, 0)
      if (totalPortions > 0 && !seenJob.has('d-' + meal.recipeKey)) {
        seenJob.add('d-' + meal.recipeKey)
        const keys = batchData.sharedItems.map(it => it.key)
        const m    = desayunoMethod(batchData.mealName, keys)
        if (m.cookMin > 0) {
          jobs.push({ key: 'd-' + meal.recipeKey, name: batchData.mealName, emoji: m.emoji, cookMin: m.cookMin, label: m.label, qtyLabel: `${totalPortions} porciones`, split: desayunoSplit(batchData) })
        } else {
          // No-timer desayuno (overnight oats, batidos, yogur bowls): just mix & repartir
          if (m.mode === 'nevera') vispera.push({ emoji: '❄️', text: `Prepara ${batchData.mealName} la noche anterior y déjalo en la nevera.` })
          jobs.push({ key: 'd-' + meal.recipeKey, name: batchData.mealName, emoji: m.emoji, cookMin: 0, label: m.label, qtyLabel: `${totalPortions} porciones`, split: desayunoSplit(batchData), methodNote: m.label })
        }
      }
      pushPrep(batchData.sharedItems)
    }

    // Attach the meal's full ingredient list to its primary cooking job, so the
    // cook sees WHAT to mix/assemble (e.g. the cheesecake recipe), not just timing.
    if (jobs.length > jobsBefore) {
      const ingr = batchData.sharedItems.map(it => ({ name: it.name, qty: fmtQty(it) }))
      if (ingr.length > 0) {
        jobs[jobsBefore].ingredients      = ingr
        // 'Mezcla todo' es para desayuno/merienda (combo directo, todo va en
        // el mismo bol/batido); comida/cena y 'plato' llevan carne/pescado +
        // guarnicion aparte, no se "mezclan" -- 'Lleva' encaja mejor.
        const isMealSlot = batchData.mealType === 'comida' || batchData.mealType === 'cena'
        // 6 sep 2026 -- masa harina + huevo: el huevo NO se mezcla crudo con
        // la masa, se revuelve aparte y se pone dentro del burrito ya hecho
        // (ver desayunoMethod). 'Mezcla todo' era enganoso justo aqui -- el
        // label lo deja explicito en vez de dar por hecho que se entiende.
        const keys = batchData.sharedItems.map(it => it.key)
        const isMasaHuevo = keys.includes('masa-harina') && keys.includes('huevo')
        jobs[jobsBefore].ingredientsLabel = isMasaHuevo
          ? 'Masa+agua (huevo aparte, revuelto)'
          : (meal.type === 'desayuno' && !isMealSlot) ? 'Mezcla todo' : 'Lleva'
      }
    }
  }

  // ── Total time: everything cooks in parallel, so it's the longest timer + a
  //    plating buffer. (No oven-contention modelling — in practice most dishes
  //    share one tray/pot.)
  const longestCook = jobs.reduce((m, j) => Math.max(m, j.cookMin || 0), 0)
  const hasTimers   = jobs.some(j => (j.cookMin || 0) > 0)
  const totalMin    = hasTimers ? longestCook + PLATE_MIN : (jobs.length > 0 ? PLATE_MIN : 0)

  return { jobs, prepTasks, vispera, noCook, totalMin }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const MEAL_LABELS = { desayuno: 'Desayuno', comida: 'Comida', merienda: 'Merienda', cena: 'Cena' }
const MEAL_TIMES  = { desayuno: '9:00 am', comida: '12–1 pm', merienda: '4:30 pm', cena: '7:30 pm' }

// Agrupa la lista plana de lineas {header|total|text} (que ya calculaban
// cookLines/platoLines/desayunoLines) en cajas -- una caja nueva por cada
// header ('🥔 Puré', '🍗 Aparte'...), o una sola caja sin titulo si no hay
// ningun header (plato simple sin agrupacion). Solo cambia como se PINTA la
// info que el motor ya calculaba, no el calculo en si.
function groupStatLines(lines) {
  const groups = []
  let current = null
  for (const l of lines) {
    if (l.header) {
      current = { label: l.text, rows: [], total: null }
      groups.push(current)
      continue
    }
    if (!current) { current = { label: null, rows: [], total: null }; groups.push(current) }
    if (l.total) {
      const clean = l.text.replace(/^→\s*/, '')
      const i = clean.indexOf(': ')
      current.total = i >= 0 ? { label: clean.slice(0, i), value: clean.slice(i + 2) } : { label: clean, value: '' }
    } else {
      const i = l.text.indexOf(': ')
      current.rows.push(i >= 0 ? { name: l.text.slice(0, i), qty: l.text.slice(i + 2) } : { name: l.text, qty: '' })
    }
  }
  return groups
}

function StatBoxes({ lines }) {
  return groupStatLines(lines).map((g, gi) => (
    <div key={gi} className="batch-statbox">
      {g.label && <div className="batch-statbox-label">{g.label}</div>}
      <div>
        {g.rows.map((r, ri) => (
          <div key={ri} className="batch-statbox-row">
            <span>{r.name}</span>
            <span className="batch-statbox-qty">{r.qty}</span>
          </div>
        ))}
      </div>
      {g.total && (
        <div className="batch-statbox-total">
          <span>{g.total.label}</span>
          <span className="batch-statbox-total-val">{g.total.value}</span>
        </div>
      )}
    </div>
  ))
}

function MealSection({ mealType, batchData, showMealLabel = true, groupLabel = null }) {
  const catLbl  = { fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t-text-faint)', fontWeight: 700, marginBottom: '0.3rem' }

  return (
    <>
      {showMealLabel && (
        <div style={catLbl}>{MEAL_LABELS[mealType]} <span style={{ fontWeight: 400, opacity: 0.7 }}>· {MEAL_TIMES[mealType]}</span></div>
      )}

      {!batchData ? (
        <div className="batch-dish-card" style={{ color: 'var(--t-text-faint)', fontStyle: 'italic', fontSize: '0.8rem' }}>
          Sin planificar
        </div>
      ) : (
        <div className="batch-dish-card">
          {(() => {
            const persons = batchData.personTotals.filter(pt => pt.activeDays > 0 || pt.recipeServings > 0)
            // BUG corregido (6 sep 2026): batchData.meal.type es SIEMPRE
            // 'desayuno' (es el nombre del formato de plato unico, reutilizado
            // para las 4 comidas) -- comprobarlo aqui hacia que comida/cena
            // cayeran siempre en la rama de "una racion igual para todos" y
            // NUNCA mostraran los gramos de arroz/patata por persona en el
            // desglose de tupper (solo salian en el total del lote, arriba).
            // Lo que de verdad distingue "racion fija" de "racion personal"
            // es el mealType (la franja), no la forma del objeto.
            const isDesayuno = mealType === 'desayuno' || mealType === 'merienda'
            const baseKey = persons[0]?.baseKey
            const blend = batchData.blend
            const totalPersonDays = persons.reduce((s, p) => s + p.activeDays, 0)
            const R = n => Math.round(n)

            // ── COCINAR: everything that goes into the pots/blender, as totals ──
            const cookLines = []
            // protein (tipo legacy 'plato' -- para comida/cena de semana
            // modelo esto siempre sale 0, la proteina va dentro de sharedItems)
            const pg = persons.reduce((s, p) => s + p.proteinGrams, 0)
            const pu = persons.reduce((s, p) => s + p.proteinUnits, 0)
            const psv = persons.reduce((s, p) => s + p.proteinServings, 0)
            const proteinLines = []
            if (batchData.proteinName) {
              if (pg  > 0) proteinLines.push(`${batchData.proteinName}: ${R(pg)}g`)
              if (pu  > 0) proteinLines.push(`${batchData.proteinName}: ${pu} ud`)
              if (psv > 0) proteinLines.push(`${batchData.proteinName}: ${psv} raciones`)
            }
            // base
            let baseName = null, baseQty = null, baseTotalG = 0
            if (batchData.hasBase) {
              baseTotalG = persons.reduce((s, p) => s + p.baseGrams, 0)
              const ratio = COOK_RATIO[baseKey]
              baseName = persons[0]?.baseName
              // 6 sep 2026 -- "seco" pegado siempre, aunque la base fuera
              // patata (se pesa cruda, no es un seco que se hidrata como el
              // arroz o las lentejas) -- el usuario, riendose: "Patata: 250g
              // seco... no tiene sentido". Solo decir "seco" cuando de verdad
              // hay ratio seco->cocido (arroz, legumbre); si no, gramaje llano.
              baseQty = `${R(baseTotalG)}g${ratio ? ` seco → ~${R(baseTotalG * ratio)}g cocido` : ''}`
            }
            // 6 sep 2026 -- ver PUREE_COMPANION_KEYS/splitPureeItems arriba: el
            // usuario, con razon, "la mantequilla y la leche la mezclo con el
            // pure y la zanahoria tambien" -- listar todo suelto (patata por
            // un lado, leche/mantequilla/zanahoria como si fueran aparte del
            // pollo) no dice que unas cosas se machacan juntas y otras se
            // cocinan aparte. Si el plato lleva leche+mantequilla (el
            // indicador real de que hay pure), se agrupan visualmente.
            const { isPuree, pureeItems, restItems } = splitPureeItems(batchData.sharedItems, baseName, baseQty)
            if (isPuree) {
              cookLines.push({ header: true, text: '🥔 Puré — machacar todo junto' })
              pureeItems.forEach(it => cookLines.push({ text: `${it.name}: ${it.key === 'base' ? it.qty : fmtQty(it)}` }))
              // 6 sep 2026 -- el usuario, con razon: "sigues sin decirme el
              // total" -- listar cada ingrediente por separado no dice cuanto
              // pure sale en total. Suma grams+ml (1ml de leche ~ 1g, buena
              // aproximacion para saber cuanto ocupa/pesa el pure ya mezclado).
              const pureeTotalG = baseTotalG + pureeItems.reduce((s, it) => s + (it.key === 'base' ? 0 : (it.grams ?? 0) + (it.ml ?? 0)), 0)
              if (pureeTotalG > 0) cookLines.push({ text: `→ Total puré: ~${R(pureeTotalG)}g`, total: true })
              if (proteinLines.length || restItems.length) cookLines.push({ header: true, text: '🍗 Aparte' })
              proteinLines.forEach(l => cookLines.push({ text: l }))
              restItems.forEach(it => cookLines.push({ text: `${it.name}: ${fmtQty(it)}` }))
            } else {
              proteinLines.forEach(l => cookLines.push({ text: l }))
              if (baseName) cookLines.push({ text: `${baseName}: ${baseQty}` })
              batchData.sharedItems.forEach(it => cookLines.push({ text: `${it.name}: ${fmtQty(it)}` }))
            }

            // ── TUPPER lines per person ──
            function sharedPerRacion(it) {
              if (totalPersonDays <= 0) return null
              const g = R(it.grams / totalPersonDays), ml = R(it.ml / totalPersonDays), u = +(it.units / totalPersonDays).toFixed(2)
              const sv = +((it.serv ?? 0) / totalPersonDays).toFixed(2)
              return g > 0 ? `${g}g` : ml > 0 ? `${ml}ml` : u > 0 ? `${u} ud` : sv > 0 ? `×${sv}` : null
            }
            function desayunoLines() {
              const totalPortions = persons.reduce((s, p) => s + p.recipeServings, 0)
              return batchData.sharedItems.map(it => {
                const g = totalPortions > 0 ? R(it.grams / totalPortions) : 0
                const ml = totalPortions > 0 ? R(it.ml / totalPortions) : 0
                const u = totalPortions > 0 ? +(it.units / totalPortions).toFixed(2) : 0
                const sv = totalPortions > 0 ? +((it.serv ?? 0) / totalPortions).toFixed(2) : 0
                const qty = g > 0 ? `${g}g` : ml > 0 ? `${ml}ml` : u > 0 ? `${u} ud` : sv > 0 ? `×${sv}` : null
                return qty ? { text: `${it.name}: ${qty}` } : null
              }).filter(Boolean)
            }
            function platoLines(pt) {
              const proteinLines = []
              const protKey = batchData.meal.proteinKey
              const yield_ = PROTEIN_YIELD[protKey] ?? null
              if (pt.proteinGrams > 0) {
                const rawG = R(pt.proteinGrams / pt.activeDays)
                if (yield_) {
                  proteinLines.push(`${batchData.proteinName}: ~${R(rawG * yield_)}g cocinado (desde ${rawG}g crudo)`)
                } else {
                  proteinLines.push(`${batchData.proteinName}: ${rawG}g`)
                }
              }
              if (pt.proteinUnits > 0)     proteinLines.push(`${batchData.proteinName}: ${R(pt.proteinUnits / pt.activeDays)} ud`)
              if (pt.proteinServings > 0)  proteinLines.push(`${batchData.proteinName}: 1 ración`)
              let blendGrams = 0
              let baseName_ = null, baseQty_ = null, baseGramsPerDay = 0
              if (pt.baseGrams > 0) {
                const gPerDay = R(pt.baseGrams / pt.activeDays)
                if (blend && blend.base) { blendGrams += gPerDay }
                else {
                  const ratio = COOK_RATIO[baseKey]
                  baseName_ = pt.baseName
                  baseQty_ = `${gPerDay}g${ratio ? ` seco (~${R(gPerDay * ratio)}g cocido)` : ''}`
                  baseGramsPerDay = gPerDay
                }
              }
              // sharedItems per-racion, como objetos {key,name,qty} para poder
              // agrupar con splitPureeItems igual que en "Cocinar" de arriba.
              const perRacionItems = []
              batchData.sharedItems.forEach(it => {
                if (blend) {
                  if (totalPersonDays > 0) {
                    blendGrams += R(it.grams / totalPersonDays) + R(it.ml / totalPersonDays)
                    if (it.units) blendGrams += R(unitToGrams(it.key, it.units) / totalPersonDays)
                  }
                } else {
                  const pr = sharedPerRacion(it)
                  if (pr) {
                    const g  = totalPersonDays > 0 ? R(it.grams / totalPersonDays) : 0
                    const ml = totalPersonDays > 0 ? R(it.ml    / totalPersonDays) : 0
                    perRacionItems.push({ key: it.key, name: it.name, qty: pr, grams: g, ml })
                  }
                }
              })
              if (blend) {
                const lines = [...proteinLines]
                if (blendGrams > 0) lines.push(`🫕 ${blend.label} (batido): ~${blendGrams}g`)
                return lines.map(text => ({ text }))
              }
              // 6 sep 2026 -- mismo agrupado de pure que en "Cocinar" (ver
              // splitPureeItems arriba), aqui a nivel de racion individual.
              const isPuree = perRacionItems.some(it => it.key === 'leche') && perRacionItems.some(it => it.key === 'mantequilla')
              if (isPuree) {
                const pureeItems = perRacionItems.filter(it => PUREE_COMPANION_KEYS.has(it.key))
                const restItems  = perRacionItems.filter(it => !PUREE_COMPANION_KEYS.has(it.key))
                // 6 sep 2026 -- el usuario, con razon: "sigues sin decirme el
                // total" -- cada ingrediente por separado no dice cuanto pure
                // sale en total por raciоn. Suma grams+ml (1ml de leche ~ 1g).
                const pureeTotalG = baseGramsPerDay + pureeItems.reduce((s, it) => s + (it.grams ?? 0) + (it.ml ?? 0), 0)
                if (baseName_) pureeItems.unshift({ name: baseName_, qty: baseQty_ })
                const lines = [{ header: true, text: '🥔 Puré — machacar todo junto' }]
                pureeItems.forEach(it => lines.push({ text: `${it.name}: ${it.qty}` }))
                if (pureeTotalG > 0) lines.push({ text: `→ Total puré: ~${R(pureeTotalG)}g`, total: true })
                if (proteinLines.length || restItems.length) lines.push({ header: true, text: '🍗 Aparte' })
                proteinLines.forEach(l => lines.push({ text: l }))
                restItems.forEach(it => lines.push({ text: `${it.name}: ${it.qty}` }))
                return lines
              }
              const lines = proteinLines.map(text => ({ text }))
              if (baseName_) lines.push({ text: `${baseName_}: ${baseQty_}` })
              perRacionItems.forEach(it => lines.push({ text: `${it.name}: ${it.qty}` }))
              return lines
            }

            // Build per-person tupper data, then collapse identical ones.
            const built = persons.map(pt => ({
              name: pt.person.name,
              tuppers: isDesayuno ? pt.recipeServings : pt.activeDays,
              lines: isDesayuno ? desayunoLines() : platoLines(pt),
            }))
            const groups = []
            built.forEach(b => {
              const key = `${b.tuppers}|${b.lines.map(l => l.text).join('§')}`
              const g = groups.find(x => x.key === key)
              if (g) g.names.push(b.name)
              else groups.push({ key, names: [b.name], tuppers: b.tuppers, lines: b.lines })
            })

            return (
              <>
                <div className="batch-dish-head">
                  <div className="batch-dish-name">{batchData.mealName}</div>
                  <div className="batch-dish-avatars">
                    {persons.map(pt => (
                      <span key={pt.person.id} className="batch-avatar" title={pt.person.name}>{pt.person.initial}</span>
                    ))}
                  </div>
                </div>

                <div className="batch-body">
                  {/* ── COCINAR ── */}
                  <div>
                    <div className="batch-col-label">🍳 Cocinar — total del batch</div>
                    <StatBoxes lines={cookLines} />
                    {isDesayuno && (() => {
                      const totalPortions = persons.reduce((s, p) => s + p.recipeServings, 0)
                      const W = batchData.recipePortionGrams || 0
                      const dm = desayunoMethod(batchData.mealName, batchData.sharedItems.map(it => it.key))
                      const verb = dm.mode === 'oven' ? 'hornear y cortar' : dm.mode === 'stove' ? 'cuajar y cortar' : 'mezclar y repartir'
                      return (
                        <div className="batch-note">
                          → {verb} en {totalPortions} tuppers{W > 0 ? ` de ~${R(W)}g` : ''}
                        </div>
                      )
                    })()}
                  </div>

                  {/* ── TUPPER ── */}
                  <div>
                    <div className="batch-col-label">🥡 Tuppers</div>
                    {groups.map((g, gi) => (
                      <div key={gi} className="batch-tupper-card">
                        <div className="batch-tupper-head">
                          {g.names.map(n => <span key={n} className="batch-avatar batch-avatar-sm">{n.charAt(0)}</span>)}
                          <span className="batch-tupper-name">
                            {g.names.join(' y ')}{g.names.length > 1 ? ' (igual)' : ''}
                            {' — '}{g.tuppers} tupper{g.tuppers > 1 ? 's' : ''}
                          </span>
                        </div>
                        <StatBoxes lines={g.lines} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )
          })()}

          {batchData.freshItems.length > 0 && (
            <div className="batch-fresh">
              <div className="batch-col-label" style={{ color: '#b45309' }}>🥑 Al momento — añadir al servir (×ración)</div>
              {batchData.freshItems.map(it => (
                <div key={it.ingKey} className="batch-fresh-row">
                  {it.name}
                  {(it.portion.grams || it.portion.ml || it.portion.units)
                    ? `: ${fmtQty({ grams: it.portion.grams ?? 0, ml: it.portion.ml ?? 0, units: it.portion.units ?? 0 })}`
                    : ' (al gusto)'}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ─── COOK MODE — concurrent timer rack + prep checklist ──────────────────────
function CookMode({ schedule, title, onExit }) {
  const { jobs, prepTasks, vispera, noCook } = schedule

  // One timer per cooking job — they all count down concurrently & independently.
  const [timers, setTimers] = useState(() =>
    [...jobs].sort((a, b) => b.cookMin - a.cookMin).map(j => ({
      key: j.key, name: j.name, emoji: j.emoji, qty: j.qtyLabel, label: j.label, split: j.split ?? [],
      ingredients: j.ingredients ?? [], ingredientsLabel: j.ingredientsLabel,
      noTimer: (j.cookMin || 0) === 0, methodNote: j.methodNote,
      totalSec: j.cookMin * 60, remainingSec: j.cookMin * 60, status: 'idle',
    }))
  )
  const [donePrep, setDonePrep] = useState(() => new Set())

  // Single interval drives ALL running timers at once (decoupled from any "step").
  useEffect(() => {
    const id = setInterval(() => {
      setTimers(ts => {
        if (!ts.some(t => t.status === 'running')) return ts
        return ts.map(t => {
          if (t.status !== 'running') return t
          if (t.remainingSec <= 1) return { ...t, remainingSec: 0, status: 'done' }
          return { ...t, remainingSec: t.remainingSec - 1 }
        })
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const setStatus = (key, status, extra = {}) =>
    setTimers(ts => ts.map(t => t.key === key ? { ...t, status, ...extra } : t))

  const togglePrep = key => setDonePrep(s => {
    const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n
  })

  const STATUS_COLOR = { idle: 'var(--t-border)', running: '#ef4444', done: '#eab308', collected: '#22c55e' }

  const allDone = timers.length > 0 && timers.every(t => t.status === 'collected')

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{title} — Modo cocina</div>
        <button className="btn-ghost" onClick={onExit} style={{ fontSize: '0.8rem' }}>✕ Salir</button>
      </div>

      {/* Víspera reminder */}
      {vispera.length > 0 && (
        <div className="batch-vispera" style={{ marginBottom: '1rem' }}>
          <span className="batch-vispera-tag">🌙 Anoche (la víspera)</span>
          {vispera.map((v, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--t-text)', lineHeight: 1.6, marginTop: i === 0 ? '0.4rem' : 0 }}>{v.emoji} {v.text}</div>
          ))}
        </div>
      )}

      {/* Instruction */}
      <div style={{ fontSize: '0.78rem', color: 'var(--t-text-soft)', marginBottom: '0.75rem' }}>
        Arranca de la <strong>más larga a la más corta</strong>. Toca <strong>▶</strong> al cargar cada máquina — los timers corren <strong>a la vez</strong>. Mientras, ve haciendo la prep de abajo.
      </div>

      {/* Timer rack — concurrent */}
      {timers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {timers.map(t => {
            const color = STATUS_COLOR[t.status]
            const blink = t.status === 'done'
            return (
              <div key={t.key} style={{ border: `2px solid ${color}`, borderRadius: '0.75rem', padding: '0.85rem', background: blink ? 'rgba(234,179,8,0.12)' : 'var(--t-surface)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{t.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>{t.name}</span>
                </div>
                {t.qty && <div style={{ fontSize: '0.68rem', color: 'var(--t-text-faint)', marginBottom: '0.4rem' }}>{t.qty}</div>}

                {t.ingredients.length > 0 && (
                  <div style={{ border: '1px dashed var(--t-border)', borderRadius: '0.4rem', padding: '0.35rem 0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-text-faint)', fontWeight: 700, marginBottom: '0.15rem' }}>
                      {t.ingredientsLabel ?? 'Ingredientes'}
                    </div>
                    {t.ingredients.map((it, i) => (
                      <div key={i} style={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
                        {it.name}: <strong>{it.qty}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {t.split.length > 0 && (
                  <div style={{ background: 'rgba(154,123,67,0.1)', borderRadius: '0.4rem', padding: '0.35rem 0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-text-faint)', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Repartir
                    </div>
                    {t.split.map((s, i) => (
                      <div key={i} style={{ marginBottom: s.items?.length ? '0.4rem' : 0 }}>
                        <div style={{ fontSize: '0.76rem', lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 700, color: 'var(--t-accent)' }}>{s.name}</span>
                          {' '}<span style={{ fontWeight: 600 }}>{s.label}</span>
                        </div>
                        {s.items?.map((it, j) => (
                          <div key={j} style={{ fontSize: '0.68rem', color: 'var(--t-text-faint)', paddingLeft: '0.6rem', lineHeight: 1.55 }}>
                            {it.name}: <strong style={{ color: 'var(--t-text)', fontWeight: 600 }}>{it.qty}</strong>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {t.noTimer ? (
                  <>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: t.status === 'collected' ? '#22c55e' : 'var(--t-text-soft)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                      {t.status === 'collected' ? '✓ Hecho' : (t.methodNote || t.label)}
                    </div>
                    {t.status === 'collected'
                      ? <button className="btn-ghost" onClick={() => setStatus(t.key, 'idle')} style={{ fontSize: '0.72rem', width: '100%' }}>↺ Deshacer</button>
                      : <button className="btn-primary" onClick={() => setStatus(t.key, 'collected')} style={{ fontSize: '0.78rem', width: '100%' }}>✓ Hecho</button>}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: t.status === 'running' ? '#ef4444' : t.status === 'done' ? '#eab308' : 'var(--t-text-soft)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                      {t.status === 'collected' ? '✓ Hecho' : fmtMMSS(t.remainingSec)}
                    </div>

                    {t.status === 'idle' && (
                      <button className="btn-primary" onClick={() => setStatus(t.key, 'running')} style={{ fontSize: '0.78rem', width: '100%' }}>
                        ▶ Arrancar ({Math.round(t.totalSec / 60)} min)
                      </button>
                    )}
                    {t.status === 'running' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-ghost" onClick={() => setStatus(t.key, 'idle')} style={{ fontSize: '0.74rem', flex: 1 }}>⏸ Pausa</button>
                        <button className="btn-ghost" onClick={() => setStatus(t.key, 'collected')} style={{ fontSize: '0.74rem', flex: 1 }}>✓ Sacar ya</button>
                      </div>
                    )}
                    {t.status === 'done' && (
                      <button className="btn-primary" onClick={() => setStatus(t.key, 'collected')} style={{ fontSize: '0.78rem', width: '100%', background: '#22c55e' }}>
                        ✅ ¡Listo! Sacar y reservar
                      </button>
                    )}
                    {t.status === 'collected' && (
                      <button className="btn-ghost" onClick={() => setStatus(t.key, 'idle', { remainingSec: t.totalSec })} style={{ fontSize: '0.72rem', width: '100%' }}>↺ Reiniciar</button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* No-cook notes */}
      {noCook.length > 0 && (
        <div style={{ marginBottom: '1.25rem', fontSize: '0.78rem', color: 'var(--t-text-soft)' }}>
          {noCook.map((n, i) => <div key={i} style={{ lineHeight: 1.6 }}>{n.emoji} {n.text}</div>)}
        </div>
      )}

      {/* Prep checklist — while machines run */}
      {prepTasks.length > 0 && (
        <div>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t-text-faint)', fontWeight: 700, marginBottom: '0.5rem' }}>
            🔪 Mientras se cocina — prep ({donePrep.size}/{prepTasks.length})
          </div>
          {prepTasks.map(pt => {
            const done = donePrep.has(pt.key)
            return (
              <button key={pt.key} onClick={() => togglePrep(pt.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', textAlign: 'left', padding: '0.5rem 0.6rem', marginBottom: '0.3rem', border: '1px solid var(--t-border)', borderRadius: '0.5rem', background: done ? 'rgba(34,197,94,0.08)' : 'var(--t-surface)', cursor: 'pointer', opacity: done ? 0.6 : 1 }}>
                <span style={{ fontSize: '1rem', width: '20px' }}>{done ? '✅' : pt.emoji}</span>
                <span style={{ fontSize: '0.82rem', flex: 1, textDecoration: done ? 'line-through' : 'none' }}>
                  <strong>{pt.name}</strong> — {pt.action.toLowerCase()} · {pt.qty}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--t-text-faint)' }}>{pt.prepMin}'</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Done banner */}
      {allDone && (
        <div style={{ marginTop: '1.25rem', padding: '1rem', textAlign: 'center', background: 'rgba(34,197,94,0.1)', border: '2px solid #22c55e', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '2rem' }}>🎉</div>
          <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>¡Batch completado!</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--t-text-soft)', marginTop: '0.25rem' }}>
            Reparte en fiambreras por persona y día. Etiqueta con la fecha. Nevera ≤ 4 días · congelador ≤ 3 meses.
          </div>
          <button className="btn-primary" onClick={onExit} style={{ marginTop: '0.75rem' }}>✓ Finalizar</button>
        </div>
      )}
    </div>
  )
}

// ─── Batch card (plan view) ──────────────────────────────────────────────────
// ─── Main component ────────────────────────────────────────────────────────────
const MEALS    = ['desayuno', 'comida', 'merienda', 'cena']
// ── Ventana de batch ────────────────────────────────────────────────────────
// 26 sep 2026 -- cambio de rutina real del usuario: ya no se cocina dos veces
// por semana (martes/jueves). Ahora se cocina UNA sola vez, el domingo, y
// cubre de lunes a viernes (5 dias) de la MISMA semana que se muestra --
// el fin de semana (sab/dom) queda fuera del batch. El domingo en el que se
// cocina es el anterior a este lunes (weekMonday - 1 dia), no el domingo que
// cierra la semana mostrada (ese seria el que cocina para la semana
// SIGUIENTE). Como los 5 dias caen todos en la misma semana ISO que
// weekMonday, ya no hace falta el manejo de "cruce de semana" que si hacia
// falta con el batch de jueves (que llegaba hasta el lunes siguiente).
const WEEKDAY_DAYS = ['lun', 'mar', 'mié', 'jue', 'vie']

const DAY_LETTER = { lun: 'L', mar: 'M', 'mié': 'X', jue: 'J', vie: 'V' }

export default function BatchPrepTab() {
  const allIng        = useStore(selectAllIng)
  const allCombos     = useStore(selectAllCombos)
  const weekPlan      = useStore(s => s.weekPlan)
  const profiles      = useStore(s => s.profiles)
  const openPlanner   = useStore(s => s.openPlanner)

  // Por defecto, el PRÓXIMO batch (el de esta semana ya se cocinó el domingo
  // pasado). Estado propio: ya no comparte semana con el Planificador.
  const [offset, setOffset] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [detail, setDetail] = useState(false)

  const weekMonday  = useMemo(() => addDays(mondayOf(new Date()), offset * 7), [offset])
  const weekKey     = useMemo(() => getISOWeek(addDays(weekMonday, 3)), [weekMonday])
  const cookDate    = useMemo(() => addDays(weekMonday, -1), [weekMonday])

  const batchDays = useMemo(() => WEEKDAY_DAYS.map((dk, i) => ({
    dayKey: dk, wk: weekKey, date: addDays(weekMonday, i),
  })), [weekMonday, weekKey])

  const batchData = useMemo(() => Object.fromEntries(
    MEALS.map(mt => [mt, computeBatchMeal(mt, batchDays, profiles, allIng, allCombos, weekPlan)])
  ), [batchDays, profiles, allIng, allCombos, weekPlan])

  const schedule = useMemo(() =>
    buildSchedule(MEALS.flatMap(mt => (batchData[mt] || []).map(g => ({ meal: g.meal, batchData: g }))))
  , [batchData])

  // Tuppers hechos: en el guardado compartido (lo que llena uno lo ve el otro)
  const batchTups = useStore(s => s.batchTups)
  const toggleBatchTup = useStore(s => s.toggleBatchTup)
  const tups = useMemo(() => new Set(batchTups?.[weekKey] ?? []), [batchTups, weekKey])
  const toggleTup = id => toggleBatchTup(weekKey, id)

  // Tarjetas: un lote por plato y franja, con sus tuppers día × persona
  const weekData = weekPlan[weekKey] ?? {}
  const cards = MEALS.flatMap(mt => (batchData[mt] || []).map(g => {
    const key = g.meal.recipeKey
    const tupList = []
    batchDays.forEach(({ dayKey, date }) => {
      profilesActiveOn(profiles, date).forEach(person => {
        if (slotForPerson(weekData[`${dayKey}-${mt}`] ?? null, person.id)?.recipeKey === key) {
          tupList.push({ id: `${key}-${mt}-${dayKey}-${person.id}`, dayKey, person })
        }
      })
    })
    const persons = g.personTotals.filter(pt => pt.activeDays > 0)
    const scaled = (mt === 'comida' || mt === 'cena') && g.hasBase
    const maxBase = Math.max(1, ...persons.map(pt => pt.baseGrams))
    const shared = g.sharedItems.slice(0, 5).map(it => `${it.name.split(' (')[0].split(' · ')[0]} ${fmtQty(it)}`)
    const days = [...new Set(tupList.map(t => t.dayKey))]
    return { mt, g, key, tupList, persons, scaled, maxBase, shared, days }
  }))
  const packable = cards.filter(c => c.mt === 'comida' || c.mt === 'cena')
  const tupTotal = packable.reduce((s, c) => s + c.tupList.length, 0)
  const tupDone = packable.reduce((s, c) => s + c.tupList.filter(t => tups.has(t.id)).length, 0)
  const colorOf = p => PERSON_COLOR[Math.max(0, profiles.findIndex(x => x.id === p.id)) % PERSON_COLOR.length]
  const hasPlan = schedule.jobs.length > 0 || schedule.prepTasks.length > 0
  const label = offset === 1 ? 'Próximo batch' : offset === 0 ? 'Batch de esta semana' : offset < 0 ? 'Batch pasado' : 'Batch futuro'

  if (playing) {
    return <CookMode schedule={schedule} title={`Batch · domingo ${cookDate.getDate()}`} onExit={() => setPlaying(false)} />
  }

  return (
    <div className="bt">
      <section className="bt-left mp-rise">
        <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--c-ink-3)' }}>{label} · domingo</span>
        <span className="hoy-date mp-num">{cookDate.getDate()}</span>
        <span style={{ fontSize: 15, color: 'var(--c-ink-3)', marginTop: 10 }}>para lun {weekMonday.getDate()} – vie {addDays(weekMonday, 4).getDate()} · {fmtRange(weekMonday, addDays(weekMonday, 4)).split(' ').pop()}</span>

        <div className="mp-seg" style={{ gap: 0, alignSelf: 'flex-start', marginTop: 16 }}>
          <button type="button" aria-label="Batch anterior" onClick={() => setOffset(o => o - 1)} style={{ padding: '0 10px' }}><Icon name="left" size={12} stroke={2.6} /></button>
          <button type="button" onClick={() => setOffset(1)} style={{ fontWeight: 600, color: 'var(--c-ink)' }}>Próximo</button>
          <button type="button" aria-label="Batch siguiente" onClick={() => setOffset(o => o + 1)} style={{ padding: '0 10px' }}><Icon name="right" size={12} stroke={2.6} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 20 }}>
          <div className="bt-stat mp-rim"><span className="mp-muted" style={{ fontSize: 12 }}>Tiempo</span><span className="mp-num">{schedule.totalMin ? `≈ ${schedule.totalMin}′` : '—'}</span></div>
          <div className="bt-stat mp-rim"><span className="mp-muted" style={{ fontSize: 12 }}>Tuppers</span><span className="mp-num">{tupDone} / {tupTotal}</span></div>
        </div>

        {schedule.vispera.length > 0 && (
          <div className="bt-note mp-rim">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
              <span className="mp-bubble" style={{ width: 26, height: 26, background: 'rgba(255,255,255,0.85)', color: '#7154DA' }}><Icon name="moon" size={13} stroke={2.2} /></span>
              Sábado por la noche
            </span>
            <ul>
              {schedule.vispera.map((v, i) => <li key={i}>{v.text}</li>)}
            </ul>
          </div>
        )}

        {hasPlan && (
          <button className="mp-btn mp-btn-dark" style={{ marginTop: 14, height: 44, alignSelf: 'stretch' }} onClick={() => setPlaying(true)}>
            <Icon name="play" size={14} fill="currentColor" />Empezar a cocinar
          </button>
        )}
      </section>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cards.length === 0 && (
          <div className="mp-glass mp-card mp-empty" style={{ padding: '80px 20px' }}>
            Nada planificado de lunes a viernes en esta semana.<br />
            <button className="mp-btn mp-btn-dark" style={{ marginTop: 14 }} onClick={() => openPlanner(offset, 0)}><Icon name="cal" size={14} />Planificar la semana</button>
          </div>
        )}
        <section className="bt-cards" aria-label="Platos del batch">
          {cards.map((c, n) => {
            const st = MEAL_STYLE[c.mt]
            const tupsOn = c.tupList.filter(t => tups.has(t.id)).length
            const packs = c.mt === 'comida' || c.mt === 'cena'
            return (
              <article key={`${c.mt}-${c.key}`} className="bt-card mp-rim mp-rise" style={{ animationDelay: `${80 + n * 50}ms` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span className="mp-bubble" style={{ width: 44, height: 44, background: st.tint, color: st.color, boxShadow: `inset 0 1px 0 #fff, 0 6px 16px ${st.glow}` }}><Icon name={MEAL_ICON[c.mt]} size={20} /></span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span className="bt-card-name">{c.g.mealName}</span>
                      <span className="mp-muted" style={{ fontSize: 12.5 }}>{MEAL_LABELS[c.mt]} · {c.days.map(d => DAY_LETTER[d]).join(' ')} · {c.persons.map(pt => pt.person.name).join(' y ')}</span>
                    </span>
                  </span>
                  <span className="mp-tag mp-num" style={{ background: 'rgba(255,255,255,0.85)', color: 'var(--c-ink)', height: 24, fontSize: 12 }}>
                    {packs ? `${tupsOn}/${c.tupList.length} tuppers` : `${c.tupList.length} raciones`}
                  </span>
                </div>
                {c.shared.length > 0 && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--c-ink-2)' }}>{c.shared.join(' · ')}{c.g.sharedItems.length > 5 ? ` · +${c.g.sharedItems.length - 5}` : ''}</span>}
                {c.scaled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {c.persons.map(pt => (
                      <span key={pt.person.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                        <span style={{ width: 90, color: 'var(--c-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pt.person.name} · {pt.baseName?.split(' (')[0].toLowerCase()}</span>
                        <span style={{ flexGrow: 1, height: 7, borderRadius: 4, background: 'rgba(110,80,50,0.10)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${pt.baseGrams / c.maxBase * 100}%`, borderRadius: 4, background: colorOf(pt.person), animation: 'mp-grow 1.2s var(--c-ease) both' }} /></span>
                        <span className="mp-num" style={{ minWidth: 70, textAlign: 'right', fontWeight: 600 }}>{Math.round(pt.baseGrams)} g</span>
                      </span>
                    ))}
                  </div>
                )}
                {packs && (
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.tupList.map(t => {
                      const on = tups.has(t.id)
                      return (
                        <button key={t.id} type="button" className={`bt-tup${on ? ' is-on' : ''}`} aria-pressed={on}
                          title={`${t.person.name} · ${t.dayKey}`} onClick={() => toggleTup(t.id)}>
                          <span className="bt-tup-check"><Icon name="check" size={8} stroke={4} /></span>
                          {DAY_LETTER[t.dayKey]} {t.person.initial}
                        </button>
                      )
                    })}
                  </div>
                )}
              </article>
            )
          })}
        </section>

        {cards.length > 0 && (
          <section className="mp-glass mp-card mp-rise" style={{ animationDelay: '300ms' }}>
            <button type="button" className="bt-detail-toggle" aria-expanded={detail} onClick={() => setDetail(d => !d)}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Cantidades y pasos por plato</span>
              <span className="mp-muted" style={{ fontSize: 12.5 }}>Lote total, reparto por tupper y cómo se cocina cada cosa</span>
              <Icon name="right" size={14} stroke={2.4} style={{ marginLeft: 'auto', transform: detail ? 'rotate(90deg)' : 'none', transition: 'transform .35s var(--c-spring)' }} />
            </button>
            {detail && (
              <div style={{ marginTop: 14 }}>
                {MEALS.flatMap(mt => {
                  const groups = batchData[mt] || []
                  if (groups.length === 0) return [<MealSection key={mt} mealType={mt} batchData={null} />]
                  return groups.map((g, gi) => (
                    <MealSection key={`${mt}-${gi}`} mealType={mt} batchData={g} showMealLabel={gi === 0}
                      groupLabel={groups.length > 1 ? g.personTotals.map(pt => pt.person.initial).join(' y ') : null} />
                  ))
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
