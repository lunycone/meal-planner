import { useState, useEffect, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { PROTEIN } from '../../data/proteins'
import { PREP } from '../../data/combos'
import { comboScalableKey, personLunchScale, dayKcal } from '../../engine/calc'

// ─── Ingredients that go on fresh each day — only for platos (comida/cena) ───
const FRESH_KEYS = new Set([
  'aguacate', 'lechuga', 'tomate-fresco', 'tomate-cherry', 'pepino',
  'apio', 'nachos', 'cheddar', 'sour-cream',
  'feta-vaca', 'feta-oveja',
])
const YOGUR_FRESH_IN_PLATO = new Set(['yogur-cabra', 'yogur-cabra-plain'])

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
const COOK_RATIO = {
  'garbanzos':       2.5,
  'black-beans':     2.5,
  'lentejas-rojas':  2.5,
  'lentejas-verdes': 2.0,
  'alubias-blancas': 2.5,
  'cranberry-beans': 2.5,
  'alubias-rojas':   2.5,
  'arroz':           2.8,
  'pasta':           2.5,
}

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
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return `${d.getUTCFullYear()}-W${String(Math.ceil((d - yearStart) / 86400000 / 7)).padStart(2, '0')}`
}

function getWeekMonday(weekOffset) {
  const now    = new Date()
  const target = new Date(now.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000)
  const day    = target.getDay()
  const diff   = target.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(new Date(target).setDate(diff))
}

function formatDateShort(date) {
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

function profilesActiveOn(profiles, date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  return profiles.filter(p => {
    if (p.validoDesde && new Date(p.validoDesde) > d) return false
    if (p.validoHasta && new Date(p.validoHasta) <= d) return false
    return true
  })
}

function mealsMatch(a, b) {
  if (!a || !b) return false
  if (a.type !== b.type) return false
  if (a.type === 'desayuno') return a.recipeKey === b.recipeKey
  return a.proteinKey === b.proteinKey && a.comboKey === b.comboKey
}

function fmtBaseDry(key, dryGrams) {
  const ratio = COOK_RATIO[key]
  if (!ratio || dryGrams <= 0) return `${Math.round(dryGrams)}g`
  return `${Math.round(dryGrams)}g seco → ~${Math.round(dryGrams * ratio)}g cocido`
}

function fmtQty({ grams = 0, ml = 0, units = 0 }) {
  const frac = { 0.25: '¼', 0.5: '½', 0.75: '¾' }
  const parts = []
  if (grams > 0) parts.push(`${Math.round(grams)}g`)
  if (ml    > 0) parts.push(`${Math.round(ml)}ml`)
  if (units > 0) parts.push(`${frac[units] ?? units} ud`)
  return parts.join(' + ') || '—'
}

function fmtMMSS(sec) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Core: compute quantities for one meal across all batch days ───────────────
function computeBatchMeal(meal, mealType, batchDays, profiles, allIng, allCombos, weekPlan) {
  if (!meal) return null

  const personMap  = {}
  const sharedAcc  = {}
  const freshSeen  = new Set()
  const freshItems = []

  let comboRef    = null
  let scalableKey = null
  let prepRef     = null

  if (meal.type === 'plato') {
    comboRef    = allCombos[meal.comboKey]
    scalableKey = comboRef ? comboScalableKey(comboRef, allIng) : null
    prepRef     = meal.prepKey ? PREP[meal.prepKey] : null
  } else if (meal.type === 'desayuno') {
    comboRef = allCombos[meal.recipeKey]
  }

  for (const { dayKey, date, wk } of batchDays) {
    const weekData    = weekPlan[wk] ?? {}
    const dayProfiles = profilesActiveOn(profiles, date)
    if (dayProfiles.length === 0) continue

    const day = Object.fromEntries(
      ['desayuno', 'comida', 'cena'].map(m => [m, weekData[`${dayKey}-${m}`] ?? null])
    )

    for (const person of dayProfiles) {
      if (!personMap[person.id]) {
        personMap[person.id] = {
          person, activeDays: 0,
          proteinGrams: 0, proteinUnits: 0, proteinServings: 0,
          baseGrams: 0, baseKey: scalableKey,
          baseName: scalableKey ? (allIng[scalableKey]?.name ?? scalableKey) : null,
          recipeServings: 0,
        }
      }
      const pt = personMap[person.id]
      pt.activeDays++

      if (meal.type === 'plato') {
        const protein = PROTEIN[meal.proteinKey]
        if (protein) {
          const r = protein.ration
          if      (r.grams != null) pt.proteinGrams    += r.grams
          else if (r.units != null) pt.proteinUnits    += meal.proteinUnits ?? r.units
          else                      pt.proteinServings += 1
        }
        if (scalableKey && comboRef) {
          const scale        = mealType === 'comida' ? personLunchScale(day, person, allIng, allCombos) : null
          const defaultGrams = comboRef.items.find(it => it.k === scalableKey)?.p?.grams ?? 0
          pt.baseGrams += scale ? scale.grams : defaultGrams
        }
      } else if (meal.type === 'desayuno') {
        pt.recipeServings += 1
      }
    }

    const dayN = dayProfiles.length
    const addShared = (k, p) => {
      if (!sharedAcc[k]) sharedAcc[k] = { name: allIng[k]?.name ?? k, grams: 0, ml: 0, units: 0 }
      sharedAcc[k].grams += (p.grams ?? 0) * dayN
      sharedAcc[k].ml    += (p.ml    ?? 0) * dayN
      sharedAcc[k].units += (p.units ?? 0) * dayN
    }
    const markFresh = (k, p) => {
      if (freshSeen.has(k)) return
      freshSeen.add(k)
      freshItems.push({ ingKey: k, name: allIng[k]?.name ?? k, portion: p })
    }

    if (comboRef) {
      for (const it of comboRef.items) {
        if (it.k === scalableKey) continue
        const isFresh = meal.type === 'plato' && (
          FRESH_KEYS.has(it.k) || YOGUR_FRESH_IN_PLATO.has(it.k)
        )
        if (isFresh) { markFresh(it.k, it.p); continue }
        addShared(it.k, it.p)
      }
    }
    if (prepRef) {
      for (const it of prepRef.items) addShared(it.k, it.p)
    }
  }

  const personTotals = Object.values(personMap)
  if (personTotals.length === 0) return null

  // Weight of ONE recipe serving (for desayuno per-person portioning in grams)
  let recipePortionGrams = 0
  if (meal.type === 'desayuno' && comboRef) {
    for (const it of comboRef.items) recipePortionGrams += (it.p?.grams ?? 0) + (it.p?.ml ?? 0)
  }

  const proteinName = meal.type === 'plato' ? (PROTEIN[meal.proteinKey]?.name ?? null) : null
  const comboName   = meal.type === 'plato'
    ? (allCombos[meal.comboKey]?.name ?? null)
    : (allCombos[meal.recipeKey]?.name ?? null)
  const prepName    = meal.prepKey ? (PREP[meal.prepKey]?.name ?? null) : null
  const mealName    = proteinName ? `${proteinName} + ${comboName}` : (comboName ?? '—')

  return {
    meal, mealType, mealName, proteinName, comboName, prepName,
    personTotals, recipePortionGrams,
    sharedItems: Object.entries(sharedAcc)
      .map(([k, v]) => ({ key: k, ...v }))
      .filter(it => it.grams > 0 || it.ml > 0 || it.units > 0),
    freshItems,
    hasBase: !!scalableKey && personTotals.some(pt => pt.baseGrams > 0),
    blend: comboRef?.blend ?? null,   // si está, base + sharedItems se baten juntos
  }
}

// ─── Daily kcal via personLunchScale (accurate, includes AOVE tip) ────────────
function computeDailyKcalPerPerson(repMeals, batchProfiles, allIng, allCombos) {
  if (!batchProfiles || batchProfiles.length === 0) return []
  const day = { desayuno: repMeals.desayuno, comida: repMeals.comida, cena: repMeals.cena }
  return batchProfiles.map(person => {
    const scale = personLunchScale(day, person, allIng, allCombos)
    if (scale) {
      return { person, kcalDay: scale.dayKcalAchieved, oilTbsp: scale.oilTbsp, cappedHigh: scale.cappedHigh }
    }
    return { person, kcalDay: Math.round(dayKcal(day, allIng, allCombos)), oilTbsp: 0, cappedHigh: false }
  }).filter(p => p.kcalDay > 0)
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
      const qty = g > 0 ? `${g}g` : ml > 0 ? `${ml}ml` : u > 0 ? `${u} ud` : null
      return qty ? { name: it.name, qty } : null
    }).filter(Boolean)
    return bd.personTotals.filter(pt => pt.recipeServings > 0)
      .map(pt => ({
        name: pt.person.name,
        label: `${pt.recipeServings} tupper${pt.recipeServings > 1 ? 's' : ''}${W > 0 ? ` (~${Math.round(W)}g c/u)` : ''}`,
        items: perTupperItems,
      }))
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
        jobs[jobsBefore].ingredientsLabel = meal.type === 'desayuno' ? 'Mezcla todo' : 'Lleva'
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
const MEAL_LABELS = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena' }
const MEAL_TIMES  = { desayuno: '9:00 am', comida: '12–1 pm', cena: '7:30 pm' }

function MealSection({ mealType, batchData, status }) {
  const border  = { paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--t-border)' }
  const catLbl  = { fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t-text-faint)', fontWeight: 700, marginBottom: '0.3rem' }
  const secHead = { fontSize: '0.7rem', fontWeight: 700, color: 'var(--t-text-soft)', marginBottom: '0.4rem', marginTop: '0.6rem' }
  const muted   = { fontSize: '0.72rem', color: 'var(--t-text-faint)', paddingLeft: '0.75rem' }
  const accent  = { fontWeight: 700, color: 'var(--t-accent)' }
  const rowStyle = { fontSize: '0.82rem', color: 'var(--t-text)', paddingLeft: '0.75rem', lineHeight: 1.8 }

  return (
    <div style={border}>
      <div style={catLbl}>{MEAL_LABELS[mealType]} <span style={{ fontWeight: 400, opacity: 0.7 }}>· {MEAL_TIMES[mealType]}</span></div>

      {!batchData ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--t-text-faint)', fontStyle: 'italic' }}>
          {status === 'empty' ? 'Sin planificar' : 'Sin batch uniforme este periodo'}
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>{batchData.mealName}</div>

          {(() => {
            const persons = batchData.personTotals.filter(pt => pt.activeDays > 0 || pt.recipeServings > 0)
            const isDesayuno = batchData.meal.type === 'desayuno'
            const baseKey = persons[0]?.baseKey
            const blend = batchData.blend
            const totalPersonDays = persons.reduce((s, p) => s + p.activeDays, 0)
            const R = n => Math.round(n)

            // ── COCINAR: everything that goes into the pots/blender, as totals ──
            const cookLines = []
            // protein
            const pg = persons.reduce((s, p) => s + p.proteinGrams, 0)
            const pu = persons.reduce((s, p) => s + p.proteinUnits, 0)
            const psv = persons.reduce((s, p) => s + p.proteinServings, 0)
            if (batchData.proteinName) {
              if (pg  > 0) cookLines.push(`${batchData.proteinName}: ${R(pg)}g`)
              if (pu  > 0) cookLines.push(`${batchData.proteinName}: ${pu} ud`)
              if (psv > 0) cookLines.push(`${batchData.proteinName}: ${psv} raciones`)
            }
            // base
            if (batchData.hasBase) {
              const totalDry = persons.reduce((s, p) => s + p.baseGrams, 0)
              const ratio = COOK_RATIO[baseKey]
              const baseName = persons[0]?.baseName
              cookLines.push(`${baseName}: ${R(totalDry)}g seco${ratio ? ` → ~${R(totalDry * ratio)}g cocido` : ''}`)
            }
            // shared (pot or blender contents)
            batchData.sharedItems.forEach(it => cookLines.push(`${it.name}: ${fmtQty(it)}`))

            // ── TUPPER lines per person ──
            function sharedPerRacion(it) {
              if (totalPersonDays <= 0) return null
              const g = R(it.grams / totalPersonDays), ml = R(it.ml / totalPersonDays), u = +(it.units / totalPersonDays).toFixed(2)
              return g > 0 ? `${g}g` : ml > 0 ? `${ml}ml` : u > 0 ? `${u} ud` : null
            }
            function desayunoLines() {
              const totalPortions = persons.reduce((s, p) => s + p.recipeServings, 0)
              return batchData.sharedItems.map(it => {
                const g = totalPortions > 0 ? R(it.grams / totalPortions) : 0
                const ml = totalPortions > 0 ? R(it.ml / totalPortions) : 0
                const u = totalPortions > 0 ? +(it.units / totalPortions).toFixed(2) : 0
                const qty = g > 0 ? `${g}g` : ml > 0 ? `${ml}ml` : u > 0 ? `${u} ud` : null
                return qty ? `${it.name}: ${qty}` : null
              }).filter(Boolean)
            }
            function platoLines(pt) {
              const lines = []
              const protKey = batchData.meal.proteinKey
              const yield_ = PROTEIN_YIELD[protKey] ?? null
              if (pt.proteinGrams > 0) {
                const rawG = R(pt.proteinGrams / pt.activeDays)
                if (yield_) {
                  lines.push(`${batchData.proteinName}: ~${R(rawG * yield_)}g cocinado (desde ${rawG}g crudo)`)
                } else {
                  lines.push(`${batchData.proteinName}: ${rawG}g`)
                }
              }
              if (pt.proteinUnits > 0)     lines.push(`${batchData.proteinName}: ${R(pt.proteinUnits / pt.activeDays)} ud`)
              if (pt.proteinServings > 0)  lines.push(`${batchData.proteinName}: 1 ración`)
              let blendGrams = 0
              if (pt.baseGrams > 0) {
                const gPerDay = R(pt.baseGrams / pt.activeDays)
                if (blend && blend.base) { blendGrams += gPerDay }
                else {
                  const ratio = COOK_RATIO[baseKey]
                  lines.push(`${pt.baseName}: ${gPerDay}g seco${ratio ? ` (~${R(gPerDay * ratio)}g cocido)` : ''}`)
                }
              }
              batchData.sharedItems.forEach(it => {
                if (blend) {
                  if (totalPersonDays > 0) {
                    blendGrams += R(it.grams / totalPersonDays) + R(it.ml / totalPersonDays)
                    if (it.units) blendGrams += R(unitToGrams(it.key, it.units) / totalPersonDays)
                  }
                } else {
                  const pr = sharedPerRacion(it)
                  if (pr) lines.push(`${it.name}: ${pr}`)
                }
              })
              if (blend && blendGrams > 0) lines.push(`🫕 ${blend.label} (batido): ~${blendGrams}g`)
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
              const key = `${b.tuppers}|${b.lines.join('§')}`
              const g = groups.find(x => x.key === key)
              if (g) g.names.push(b.name)
              else groups.push({ key, names: [b.name], tuppers: b.tuppers, lines: b.lines })
            })

            return (
              <>
                {/* ── COCINAR ── */}
                <div style={secHead}>🍳 Cocinar — total del batch</div>
                {cookLines.map((l, i) => (
                  <div key={'c' + i} style={{ ...muted, lineHeight: 1.7, paddingLeft: '0.5rem' }}>{l}</div>
                ))}
                {isDesayuno && (() => {
                  const totalPortions = persons.reduce((s, p) => s + p.recipeServings, 0)
                  const W = batchData.recipePortionGrams || 0
                  const dm = desayunoMethod(batchData.mealName, batchData.sharedItems.map(it => it.key))
                  const verb = dm.mode === 'oven' ? 'hornear y cortar' : dm.mode === 'stove' ? 'cuajar y cortar' : 'mezclar y repartir'
                  return (
                    <div style={{ ...muted, marginTop: '0.25rem', paddingLeft: '0.5rem', fontStyle: 'italic' }}>
                      → {verb} en {totalPortions} tuppers{W > 0 ? ` de ~${R(W)}g` : ''}
                    </div>
                  )
                })()}

                {/* ── TUPPER ── */}
                <div style={{ ...secHead, marginTop: '0.9rem' }}>🥡 En cada tupper</div>
                {groups.map((g, gi) => (
                  <div key={gi} style={{ ...rowStyle, marginBottom: '0.4rem' }}>
                    <div>
                      <span style={accent}>{g.names.join(' y ')}</span>
                      {g.names.length > 1 ? ' (igual)' : ''}
                      {' — '}{g.tuppers} tupper{g.tuppers > 1 ? 's' : ''}
                    </div>
                    {g.lines.map((l, i) => (
                      <div key={i} style={{ ...muted, lineHeight: 1.7, paddingLeft: '0.5rem' }}>{l}</div>
                    ))}
                  </div>
                ))}
              </>
            )
          })()}

          {batchData.freshItems.length > 0 && (
            <>
              <div style={{ ...secHead, color: '#b45309' }}>🥑 Al momento — añadir al servir (×ración)</div>
              {batchData.freshItems.map(it => (
                <div key={it.ingKey} style={{ fontSize: '0.82rem', color: 'var(--t-text)', paddingLeft: '0.75rem', lineHeight: 1.7, opacity: 0.85 }}>
                  {it.name}
                  {(it.portion.grams || it.portion.ml || it.portion.units)
                    ? `: ${fmtQty({ grams: it.portion.grams ?? 0, ml: it.portion.ml ?? 0, units: it.portion.units ?? 0 })}`
                    : ' (al gusto)'}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
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
        <div style={{ marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(99,102,241,0.08)', borderLeft: '3px solid #6366f1', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366f1', fontWeight: 700, marginBottom: '0.3rem' }}>
            🌙 Anoche (la víspera)
          </div>
          {vispera.map((v, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--t-text)', lineHeight: 1.6 }}>{v.emoji} {v.text}</div>
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
function BatchCard({ title, cookLabel, coverDays, mealSections, schedule, kcalSummary, onPlay }) {
  const hasPlan = schedule.jobs.length > 0 || schedule.prepTasks.length > 0

  return (
    <div style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)', borderRadius: '0.75rem', padding: '1.25rem', flex: 1, minWidth: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '2px solid var(--t-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</div>
          {hasPlan && (
            <button className="btn-primary" onClick={onPlay} style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', whiteSpace: 'nowrap' }}>
              ▶ Cocinar
            </button>
          )}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--t-text-soft)' }}>
          🍳 Cocinar: <strong>{cookLabel}</strong> · Cubre: {coverDays.join(' · ')}
        </div>
      </div>

      {mealSections}

      {/* Kcal del día */}
      {kcalSummary.length > 0 && (
        <div style={{ margin: '0.75rem 0', padding: '0.6rem 0.9rem', background: 'rgba(154,123,67,0.08)', borderRadius: '0.5rem', borderLeft: '3px solid var(--t-accent)' }}>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t-text-faint)', fontWeight: 700, marginBottom: '0.3rem' }}>
            Kcal del día <span style={{ textTransform: 'none', fontWeight: 500, opacity: 0.7 }}>· rango ok ±15%</span>
          </div>
          {kcalSummary.map(({ person, kcalDay }) => {
            const target = person.kcalTarget || 0
            const pct = target ? Math.round(kcalDay / target * 100) : null
            const deficit = target ? Math.max(0, target - kcalDay) : 0
            const surplus = target ? Math.max(0, kcalDay - target) : 0
            const inRange = pct !== null && pct >= 85 && pct <= 115
            // Honest note: small gaps → a splash of oil; big gaps are a menu
            // problem, not a slider problem — say so instead of dumping oil.
            let note = null
            if (deficit > 240) {
              note = { color: '#b45309', text: `⚠️ Plan corto ~${deficit} kcal — añade un snack o un 2º componente (no lo cierres a base de aceite)` }
            } else if (deficit > 0) {
              note = { color: 'var(--t-text-faint)', text: `🫒 +${Math.max(1, Math.round(deficit / 120))} cda AOVE al emplatear y cierras el hueco` }
            } else if (surplus > target * 0.15) {
              note = { color: '#b45309', text: `↑ ~${surplus} kcal de más — baja la base o salta el AOVE` }
            }
            return (
              <div key={person.id} style={{ fontSize: '0.82rem', color: 'var(--t-text)', lineHeight: 1.8 }}>
                <span style={{ fontWeight: 700, color: 'var(--t-accent)' }}>{person.name}</span>
                {' · '}<span style={{ fontWeight: 600 }}>{kcalDay.toLocaleString()} kcal/día</span>
                {pct !== null && (
                  <span style={{ fontSize: '0.72rem', color: inRange ? '#22c55e' : 'var(--t-text-faint)', marginLeft: '0.4rem' }}>
                    ({pct}%){inRange ? ' ✓ en rango' : ''}
                  </span>
                )}
                {note && (
                  <span style={{ display: 'block', fontSize: '0.72rem', color: note.color, paddingLeft: '0.5rem' }}>
                    {note.text}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Víspera */}
      {schedule.vispera.length > 0 && (
        <div style={{ margin: '0.75rem 0', padding: '0.6rem 0.9rem', background: 'rgba(99,102,241,0.07)', borderLeft: '3px solid #6366f1', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366f1', fontWeight: 700, marginBottom: '0.3rem' }}>
            🌙 La víspera
          </div>
          {schedule.vispera.map((v, i) => (
            <div key={i} style={{ fontSize: '0.78rem', color: 'var(--t-text)', lineHeight: 1.6 }}>{v.emoji} {v.text}</div>
          ))}
        </div>
      )}

      {/* Total time — simple, everything en paralelo */}
      {hasPlan && schedule.totalMin > 0 && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--t-border)', fontSize: '0.78rem', color: 'var(--t-text-soft)' }}>
          ⏱ <strong>~{schedule.totalMin} min</strong> · todo a la vez (lo más largo + emplatar)
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
const MEALS    = ['desayuno', 'comida', 'cena']
// ── Ventanas de batch (partición limpia de la semana) ──────────────────────────
// Batch Domingo: cocinas el dom anterior, comes lun→mar→mié→jue (4 días).
// Batch Jueves:  cocinas el jue, comes vie→sáb→dom (3 días).
const SUN_DAYS = ['lun', 'mar', 'mié', 'jue']
const THU_DAYS = ['vie', 'sáb', 'dom']

export default function BatchPrepTab() {
  const allIng        = useStore(selectAllIng)
  const allCombos     = useStore(selectAllCombos)
  const weekPlan      = useStore(s => s.weekPlan)
  const profiles      = useStore(s => s.profiles)
  const weekOffset    = useStore(s => s.weekOffset)
  const setWeekOffset = useStore(s => s.setWeekOffset)

  const [playBatch, setPlayBatch] = useState(null) // 'sun' | 'thu' | null

  const weekMonday  = useMemo(() => getWeekMonday(weekOffset), [weekOffset])
  const weekKey     = useMemo(() => getISOWeek(new Date(weekMonday.getTime() + 3 * 86400000)), [weekMonday])
  const weekSunday  = useMemo(() => new Date(weekMonday.getTime() + 6 * 86400000), [weekMonday])

  // Cook days (no se comen de su propio batch, sólo cocinan).
  const sunCookDate = useMemo(() => new Date(weekMonday.getTime() - 86400000),     [weekMonday]) // dom anterior
  const thuCookDate = useMemo(() => new Date(weekMonday.getTime() + 3 * 86400000), [weekMonday]) // jue

  const sunBatchDays = useMemo(() => SUN_DAYS.map((dk, i) => ({
    dayKey: dk, wk: weekKey,
    date: new Date(weekMonday.getTime() + i * 86400000),       // lun(0)→jue(3)
  })), [weekMonday, weekKey])

  const thuBatchDays = useMemo(() => THU_DAYS.map((dk, i) => ({
    dayKey: dk, wk: weekKey,
    date: new Date(weekMonday.getTime() + (4 + i) * 86400000), // vie(4)→dom(6)
  })), [weekMonday, weekKey])

  const batchDetect = useMemo(() => {
    const detect = (days) => {
      const result = {}
      for (const mt of MEALS) {
        const meals   = days.map(({ dayKey, wk }) => (weekPlan[wk] ?? {})[`${dayKey}-${mt}`] ?? null)
        const nonNull = meals.filter(Boolean)
        const first   = nonNull[0] ?? null
        const uniform = nonNull.length > 0 && nonNull.every(m => mealsMatch(m, first))
        result[mt] = { meal: uniform ? first : null, status: nonNull.length === 0 ? 'empty' : uniform ? 'batch' : 'varied' }
      }
      return result
    }
    return { sun: detect(sunBatchDays), thu: detect(thuBatchDays) }
  }, [weekPlan, sunBatchDays, thuBatchDays])

  const sunData = useMemo(() => Object.fromEntries(
    MEALS.map(mt => [mt, batchDetect.sun[mt].meal
      ? computeBatchMeal(batchDetect.sun[mt].meal, mt, sunBatchDays, profiles, allIng, allCombos, weekPlan)
      : null
    ])
  ), [batchDetect, sunBatchDays, profiles, allIng, allCombos, weekPlan])

  const thuData = useMemo(() => Object.fromEntries(
    MEALS.map(mt => [mt, batchDetect.thu[mt].meal
      ? computeBatchMeal(batchDetect.thu[mt].meal, mt, thuBatchDays, profiles, allIng, allCombos, weekPlan)
      : null
    ])
  ), [batchDetect, thuBatchDays, profiles, allIng, allCombos, weekPlan])

  const sunKcalSummary = useMemo(() => {
    const rep = { desayuno: batchDetect.sun.desayuno.meal, comida: batchDetect.sun.comida.meal, cena: batchDetect.sun.cena.meal }
    return computeDailyKcalPerPerson(rep, profilesActiveOn(profiles, sunBatchDays[0].date), allIng, allCombos)
  }, [batchDetect.sun, sunBatchDays, profiles, allIng, allCombos])

  const thuKcalSummary = useMemo(() => {
    const rep = { desayuno: batchDetect.thu.desayuno.meal, comida: batchDetect.thu.comida.meal, cena: batchDetect.thu.cena.meal }
    return computeDailyKcalPerPerson(rep, profilesActiveOn(profiles, thuBatchDays[0].date), allIng, allCombos)
  }, [batchDetect.thu, thuBatchDays, profiles, allIng, allCombos])

  const sunSchedule = useMemo(() =>
    buildSchedule(MEALS.map(mt => ({ meal: batchDetect.sun[mt].meal, batchData: sunData[mt] })))
  , [batchDetect, sunData])

  const thuSchedule = useMemo(() =>
    buildSchedule(MEALS.map(mt => ({ meal: batchDetect.thu[mt].meal, batchData: thuData[mt] })))
  , [batchDetect, thuData])

  // ── COOK MODE ───────────────────────────────────────────────────────────────
  if (playBatch) {
    const schedule = playBatch === 'sun' ? sunSchedule : thuSchedule
    const title    = playBatch === 'sun' ? '🌙 Batch Domingo' : '☀️ Batch Jueves'
    return <CookMode schedule={schedule} title={title} onExit={() => setPlayBatch(null)} />
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Prep Batch
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            {weekKey} · {formatDateShort(weekMonday)} – {formatDateShort(weekSunday)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={() => setWeekOffset(weekOffset - 1)}>← Anterior</button>
          <button className="btn-ghost" onClick={() => setWeekOffset(0)}>Hoy</button>
          <button className="btn-ghost" onClick={() => setWeekOffset(weekOffset + 1)}>Siguiente →</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <BatchCard
          title="🌙 Batch Domingo"
          cookLabel={`dom ${formatDateShort(sunCookDate)}`}
          coverDays={['Lun', 'Mar', 'Mié', 'Jue']}
          schedule={sunSchedule}
          kcalSummary={sunKcalSummary}
          onPlay={() => setPlayBatch('sun')}
          mealSections={MEALS.map(mt => (
            <MealSection key={mt} mealType={mt} batchData={sunData[mt]} status={batchDetect.sun[mt].status} />
          ))}
        />
        <BatchCard
          title="☀️ Batch Jueves"
          cookLabel={`jue ${formatDateShort(thuCookDate)}`}
          coverDays={['Vie', 'Sáb', 'Dom']}
          schedule={thuSchedule}
          kcalSummary={thuKcalSummary}
          onPlay={() => setPlayBatch('thu')}
          mealSections={MEALS.map(mt => (
            <MealSection key={mt} mealType={mt} batchData={thuData[mt]} status={batchDetect.thu[mt].status} />
          ))}
        />
      </div>
    </div>
  )
}
