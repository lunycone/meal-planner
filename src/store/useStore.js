import { DEFAULT_BATCH, normalizeBatch, applyBatchSettings } from '../lib/batchConfig'
import { withEstimatedNutrition } from '../data/nutritionRef'
import { create } from 'zustand'
import { persist }  from 'zustand/middleware'
import { ING, CAT_LABELS, CAT_ORDER } from '../data/ingredients'
import { storeOf as storeOfIng, applyColorOverrides } from '../lib/stores'
import { COMBO }            from '../data/combos'
import { STORAGE_KEY, createStorageAdapter } from './storage'
import { migrateWeekKeys } from '../utils/date'
import { migrateKeysV2 } from './migrateKeys'

import { PLAN as PLAN_COMIDA   } from '../data/plans/comida'
import { PLAN as PLAN_DESAYUNO } from '../data/plans/desayuno'
import { PLAN as PLAN_MERIENDA } from '../data/plans/merienda'
import { PLAN as PLAN_CENA     } from '../data/plans/cena'

const BASE_PLANS = {
  desayuno: PLAN_DESAYUNO,
  comida:   PLAN_COMIDA,
  merienda: PLAN_MERIENDA,
  cena:     PLAN_CENA,
}

const MEAL_KEYS = ['desayuno', 'comida', 'merienda', 'cena']
const emptyPerMeal = (val) => Object.fromEntries(MEAL_KEYS.map(k => [k, val()]))

// Vistas validas para restaurar desde localStorage -- si un dia cambian los
// ids de tab y localStorage tiene guardado uno viejo, mejor caer a 'home'
// que dejar la pantalla en blanco (activeConfigTab/activeView sin match).
// Compra del Costco Business del 3 oct 2026, en g (zucchini 21 lb, champiñones
// 2.27 kg, 2 bolsas de pimientos de 1.13 kg, almendras 3 kg).
const BUSINESS_TRIP_STOCK = {
  'zucchini-costco':      { amount: 9525, addedAt: '2026-10-03T12:00:00.000Z' },
  'mushrooms-costco':     { amount: 2270, addedAt: '2026-10-03T12:00:00.000Z' },
  'yellow-pepper-costco': { amount: 2260, addedAt: '2026-10-03T12:00:00.000Z' },
  'almonds-costco':       { amount: 3000, addedAt: '2026-10-03T12:00:00.000Z' },
}
const VALID_VIEWS = ['home', 'meal', 'platos', 'ingredientes', 'planificador', 'compra', 'batch', 'mas', 'pantry']

// 26 sep 2026 -- la tab activa se guarda SOLO en localStorage (por
// dispositivo), nunca en el guardado compartido de Supabase: si fuera
// compartido, recargar en el movil de Maria te llevaria a la ultima tab que
// tocara Julio en el suyo. Asi cada uno conserva su propia posicion al
// recargar (F5) sin afectar al otro.
function readStoredView() {
  if (typeof window === 'undefined') return { activeView: 'home', activeMeal: null }
  try {
    const v = localStorage.getItem('mp-active-view')
    return {
      activeView: VALID_VIEWS.includes(v) ? v : 'home',
      activeMeal: localStorage.getItem('mp-active-meal') || null,
    }
  } catch { return { activeView: 'home', activeMeal: null } }
}
const initialView = readStoredView()

// Añade/quita `item` de la lista map[key]; conserva solo las 8 claves más
// recientes (orden de inserción) para que las marcas viejas no se acumulen.
function toggleIn(map, key, item) {
  const cur = new Set(map?.[key] ?? [])
  if (cur.has(item)) cur.delete(item); else cur.add(item)
  const rest = Object.entries(map ?? {}).filter(([k]) => k !== key).slice(-7)
  return Object.fromEntries([...rest, [key, [...cur]]])
}

// ─── Store ───────────────────────────────────────────────────────────────────

const useStore = create(
  persist(
    (set, get) => ({

      // ── NAVIGATION (no en el guardado compartido -- ver readStoredView) ────
      activeView: initialView.activeView,
      activeMeal: initialView.activeMeal,
      weekOffset: 0,
      setWeekOffset(offset) { set({ weekOffset: offset }) },
      // Día desplegado en el Planificador (0 = lunes). null = hoy si cae en
      // la semana visible, si no el lunes.
      plannerDay: null,
      setPlannerDay(idx) { set({ plannerDay: idx }) },
      // Abrir el Planificador en una semana/día concretos (desde Hoy).
      openPlanner(offset, dayIdx = null) {
        get().setView('planificador')
        set({ weekOffset: offset, plannerDay: dayIdx })
      },

      setView(view, meal = null) {
        set({ activeView: view, activeMeal: meal })
        try {
          localStorage.setItem('mp-active-view', view)
          if (meal) localStorage.setItem('mp-active-meal', meal)
          else localStorage.removeItem('mp-active-meal')
        } catch {}
      },

      // ── PROFILES ──────────────────────────────────────────────────────────
      profiles: [
        // kcalByDay (lun..dom): objetivo real, derivado del calendario de
        // entrenamiento (martes = voley de Maria, jueves/sabado = natacion de
        // Julio) — usado por personMealScale/personLunchScale en vez del
        // kcalTarget plano cuando esta presente. kcalTarget se queda como
        // media/fallback para el scoreboard y para perfiles sin variacion.
        // digestive: aplica las reglas de semana de engine/weekRules.js (SII-M).
        // pcos / protCap: avisos del panel de sugerencias (engine/insights.js);
        // 130 g = 2,23 g/kg a 58,4 kg (ver modelWeeks.js).
        { id: 'julio',   name: 'Julio', initial: 'J', kcalTarget: 3100, proteinTarget: 100, digestive: true,
          kcalByDay: [3150, 3150, 3100, 3300, 3000, 3300, 3000] },
        { id: 'maria',   name: 'María', initial: 'M', kcalTarget: 2600, proteinTarget: 100, pcos: true, protCap: 130,
          kcalByDay: [2500, 2900, 2500, 2750, 2500, 2750, 2500] },
        { id: 'carla',   name: 'Carla', initial: 'C', kcalTarget: 2000, proteinTarget: 90, validoDesde: '2026-06-26', validoHasta: '2026-07-08T17:00:00' },
      ],
      activeProfileId: 'all',

      getActiveProfile() {
        const s = get()
        if (s.activeProfileId === 'all') {
          const today = new Date()
          const valid = s.profiles.filter(p =>
            (!p.validoDesde  || new Date(p.validoDesde)  <= today) &&
            (!p.validoHasta  || new Date(p.validoHasta)  >  today)
          )
          return { id: 'all', name: 'Everyone', initial: 'E', kcalTarget: valid.reduce((sum, p) => sum + p.kcalTarget, 0), proteinTarget: valid.reduce((sum, p) => sum + (p.proteinTarget || 0), 0) }
        }
        return s.profiles.find(p => p.id === s.activeProfileId) || s.profiles[0]
      },

      setActiveProfile(id) {
        set(s => ({
          profiles: s.profiles.map(p => ({ ...p, active: p.id === id })),
          activeProfileId: id
        }))
      },

      addProfile(name, kcalTarget, validoHasta = null) {
        set(s => {
          const id = 'profile-' + Date.now()
          return {
            profiles: [...s.profiles, { id, name, emoji: '👤', kcalTarget, active: false, ...(validoHasta && { validoHasta }) }]
          }
        })
      },

      removeProfile(id) {
        set(s => {
          const filtered = s.profiles.filter(p => p.id !== id)
          return {
            profiles: filtered,
            activeProfileId: s.activeProfileId === id ? (filtered[0]?.id || '') : s.activeProfileId
          }
        })
      },

      updateProfile(id, data) {
        set(s => ({
          profiles: s.profiles.map(p => p.id === id ? { ...p, ...data } : p)
        }))
      },

      // ── INGREDIENTS ───────────────────────────────────────────────────────
      priceOverrides:      {},
      ingredientOverrides: {},
      deletedIngredients:  [],
      customIngredients:   {},

      setPriceOverride(key, field, value) {
        set(s => ({ priceOverrides: { ...s.priceOverrides, [key]: { ...s.priceOverrides[key], [field]: value } } }))
      },
      resetPrice(key) {
        set(s => { const o = { ...s.priceOverrides }; delete o[key]; return { priceOverrides: o } })
      },
      setIngredientOverride(key, data) {
        set(s => ({ ingredientOverrides: { ...s.ingredientOverrides, [key]: { ...s.ingredientOverrides[key], ...data } } }))
      },
      resetIngredientOverride(key) {
        set(s => { const o = { ...s.ingredientOverrides }; delete o[key]; return { ingredientOverrides: o } })
      },
      deleteIngredient(key) {
        set(s => ({ deletedIngredients: [...s.deletedIngredients.filter(k => k !== key), key] }))
      },
      restoreIngredient(key) {
        set(s => ({ deletedIngredients: s.deletedIngredients.filter(k => k !== key) }))
      },
      addCustomIngredient(key, data) {
        set(s => ({ customIngredients: { ...s.customIngredients, [key]: data } }))
      },
      removeCustomIngredient(key) {
        set(s => { const ci = { ...s.customIngredients }; delete ci[key]; return { customIngredients: ci } })
      },

      // ── COMBOS ────────────────────────────────────────────────────────────
      comboOverrides:  {},
      deletedCombos:   [],
      customCombos:    [],

      setComboOverride(key, data) {
        set(s => ({ comboOverrides: { ...s.comboOverrides, [key]: data } }))
      },
      resetComboOverride(key) {
        set(s => { const o = { ...s.comboOverrides }; delete o[key]; return { comboOverrides: o } })
      },
      deleteCombo(key) {
        set(s => ({ deletedCombos: [...s.deletedCombos.filter(k => k !== key), key] }))
      },
      restoreCombo(key) {
        set(s => ({ deletedCombos: s.deletedCombos.filter(k => k !== key) }))
      },
      addCustomCombo(combo) {
        const id = Date.now().toString()
        set(s => ({ customCombos: [...s.customCombos, { ...combo, id }] }))
      },
      // Varios platos propios de una vez, con ids unicos (addCustomCombo usa
      // Date.now() y colisionaria en un bucle). Los usa el generador de meriendas.
      // Devuelve los ids.
      addCustomCombos(list) {
        const base = Date.now()
        const ids = list.map((_, i) => 'snk-' + (base + i))
        set(s => ({ customCombos: [...s.customCombos, ...list.map((c, i) => ({ ...c, id: ids[i] }))] }))
        return ids
      },
      // Platos compuestos por el generador por ingredientes ({ 'custom-gen-…': combo }):
      // se guardan como platos tuyos con su id fijo (`gen-…`), una sola vez.
      addGeneratedCombos(map) {
        set(s => {
          const have = new Set(s.customCombos.map(c => c.id))
          const add = Object.values(map ?? {}).filter(c => c.customId && !have.has(c.customId))
            .map(c => ({ id: c.customId, name: c.name, items: c.items, meals: c.meals ?? ['comida', 'cena'] }))
          return add.length ? { customCombos: [...s.customCombos, ...add] } : {}
        })
      },
      updateCustomCombo(id, data) {
        set(s => ({ customCombos: s.customCombos.map(c => c.id === id ? { ...c, ...data } : c) }))
      },
      removeCustomCombo(id) {
        set(s => ({ customCombos: s.customCombos.filter(c => c.id !== id) }))
      },

      // ── CATEGORIES ────────────────────────────────────────────────────────
      customCategories: [],
      addCustomCategory(label) {
        const key = 'custom-' + Date.now()
        set(s => ({ customCategories: [...s.customCategories, { key, label }] }))
      },
      removeCustomCategory(key) {
        set(s => ({ customCategories: s.customCategories.filter(c => c.key !== key) }))
      },

      // ── TIENDAS Y CATEGORÍAS: gestor (27 sep 2026) ──────────────────────
      // Una tienda existe si algún ingrediente la lleva o si se añadió a mano
      // (extraStores). Colores propios en storeColors / catColors; nombres de
      // categoría cambiados en catLabels; categorías de fábrica quitadas en
      // hiddenCats. Renombrar o borrar reescribe los ingredientes afectados
      // en UNA sola escritura.
      // Gustos para la semana inteligente: { recipeKey: n } (−1 por cada
      // «Not this one», +1 cada vez que cargas una semana que lo lleva).
      dishPrefs: {},
      rateDishes(keys, delta) {
        set(s => {
          const next = { ...s.dishPrefs }
          for (const k of keys) if (k) next[k] = Math.max(-5, Math.min(5, (next[k] ?? 0) + delta))
          return { dishPrefs: next }
        })
      },
      // Días de batch (Ajustes): [{ cook: 0..6, days }] — ver lib/batchConfig.js.
      batchSettings: DEFAULT_BATCH,
      setBatchSettings(next) { set({ batchSettings: normalizeBatch(next) }) },

      // Parejas de conceptos que aprende de ti ({ 'pork|yogurt': n }, ver
      // engine/pairing.js): «Not this one» en un plato compuesto resta a sus
      // parejas; cargar o guardar uno suma un poco.
      pairPrefs: {},
      ratePairs(pairs, delta) {
        set(s => {
          const next = { ...s.pairPrefs }
          for (const k of pairs) if (k) next[k] = Math.max(-3, Math.min(3, (next[k] ?? 0) + delta))
          return { pairPrefs: next }
        })
      },
      resetDishPrefs(onlyNegative = true) {
        const keep = m => (onlyNegative ? Object.fromEntries(Object.entries(m ?? {}).filter(([, v]) => v > 0)) : {})
        set(s => ({ dishPrefs: keep(s.dishPrefs), pairPrefs: keep(s.pairPrefs) }))
      },
      extraStores: [],
      storeColors: {},
      catColors:   {},
      catLabels:   {},
      hiddenCats:  [],
      addStore(name, color) {
        const n = name.trim()
        if (!n) return
        set(s => ({
          extraStores: [...new Set([...(s.extraStores ?? []), n])],
          storeColors: color ? { ...s.storeColors, [n]: color } : s.storeColors,
        }))
      },
      setStoreColor(name, color) { set(s => ({ storeColors: { ...s.storeColors, [name]: color } })) },
      renameStore(from, to) {
        const n = to.trim()
        if (!n || n === from) return
        set(s => {
          const all = selectAllIng(s)
          const ov = { ...s.ingredientOverrides }
          for (const [k, ing] of Object.entries(all)) if (storeOfIng(ing) === from) ov[k] = { ...ov[k], store: n }
          const colors = { ...s.storeColors }
          if (colors[from]) { colors[n] = colors[from]; delete colors[from] }
          const extra = (s.extraStores ?? []).map(x => x === from ? n : x)
          return { ingredientOverrides: ov, storeColors: colors, extraStores: [...new Set(extra)] }
        })
      },
      deleteStore(name) {
        set(s => {
          const all = selectAllIng(s)
          const ov = { ...s.ingredientOverrides }
          for (const [k, ing] of Object.entries(all)) if (storeOfIng(ing) === name) ov[k] = { ...ov[k], store: '' }
          const colors = { ...s.storeColors }; delete colors[name]
          return { ingredientOverrides: ov, storeColors: colors, extraStores: (s.extraStores ?? []).filter(x => x !== name) }
        })
      },
      addCategory(label, color) {
        const key = 'custom-' + Date.now()
        set(s => ({
          customCategories: [...s.customCategories, { key, label: label.trim() }],
          catColors: color ? { ...s.catColors, [key]: color } : s.catColors,
        }))
        return key
      },
      setCatColor(key, color) { set(s => ({ catColors: { ...s.catColors, [key]: color } })) },
      renameCategory(key, label) {
        const l = label.trim()
        if (!l) return
        set(s => s.customCategories.some(c => c.key === key)
          ? { customCategories: s.customCategories.map(c => c.key === key ? { ...c, label: l } : c) }
          : { catLabels: { ...s.catLabels, [key]: l } })
      },
      // Lo que llevaba esa categoría pasa a «Other».
      deleteCategory(key) {
        if (key === 'otro') return
        set(s => {
          const all = selectAllIng(s)
          const ov = { ...s.ingredientOverrides }
          const custom = { ...s.customIngredients }
          for (const [k, ing] of Object.entries(all)) {
            if (ing.cat !== key) continue
            if (custom[k]) custom[k] = { ...custom[k], cat: 'otro' }
            else ov[k] = { ...ov[k], cat: 'otro' }
          }
          const isCustom = s.customCategories.some(c => c.key === key)
          return {
            ingredientOverrides: ov, customIngredients: custom,
            customCategories: isCustom ? s.customCategories.filter(c => c.key !== key) : s.customCategories,
            hiddenCats: isCustom ? s.hiddenCats : [...new Set([...(s.hiddenCats ?? []), key])],
          }
        })
      },

      // ── LEGACY MENU (keeps existing MenuTab working) ───────────────────────
      batchOverrides: {},
      deletedBatches: [],

      setBatchOverride(batchId, data) {
        set(s => ({ batchOverrides: { ...s.batchOverrides, [batchId]: { ...s.batchOverrides[batchId], ...data } } }))
      },
      resetBatchOverride(batchId) {
        set(s => { const o = { ...s.batchOverrides }; delete o[batchId]; return { batchOverrides: o } })
      },
      deleteBatch(batchId) {
        set(s => ({ deletedBatches: [...s.deletedBatches.filter(k => k !== batchId), batchId] }))
      },
      restoreBatch(batchId) {
        set(s => ({ deletedBatches: s.deletedBatches.filter(k => k !== batchId) }))
      },

      // ── MEAL PLAN SYSTEM (new multi-meal) ─────────────────────────────────
      // Overrides on top of static plan batches
      mealBatchOverrides:  emptyPerMeal(() => ({})),
      mealDeletedBatches:  emptyPerMeal(() => []),
      // User-added weeks (for meals with empty base plans or extra weeks)
      mealCustomWeeks:     emptyPerMeal(() => []),

      setMealBatchOverride(meal, batchId, data) {
        set(s => ({
          mealBatchOverrides: {
            ...s.mealBatchOverrides,
            [meal]: { ...s.mealBatchOverrides[meal], [batchId]: { ...(s.mealBatchOverrides[meal][batchId] ?? {}), ...data } },
          },
        }))
      },
      resetMealBatchOverride(meal, batchId) {
        set(s => {
          const o = { ...s.mealBatchOverrides[meal] }; delete o[batchId]
          return { mealBatchOverrides: { ...s.mealBatchOverrides, [meal]: o } }
        })
      },
      deleteMealBatch(meal, batchId) {
        set(s => ({
          mealDeletedBatches: {
            ...s.mealDeletedBatches,
            [meal]: [...s.mealDeletedBatches[meal].filter(k => k !== batchId), batchId],
          },
        }))
      },
      restoreMealBatch(meal, batchId) {
        set(s => ({
          mealDeletedBatches: {
            ...s.mealDeletedBatches,
            [meal]: s.mealDeletedBatches[meal].filter(k => k !== batchId),
          },
        }))
      },

      // Add a blank week (for empty meal streams)
      addMealWeek(meal) {
        const existing = get().mealCustomWeeks[meal] ?? []
        const baseCount = (BASE_PLANS[meal] ?? []).length
        const weekNum = baseCount + existing.length + 1
        const week = {
          id: `w-custom-${Date.now()}`,
          label: `Week ${weekNum}`,
          isCustom: true,
          dayOverrides: {},
          batches: [],
        }
        set(s => ({
          mealCustomWeeks: {
            ...s.mealCustomWeeks,
            [meal]: [...(s.mealCustomWeeks[meal] ?? []), week],
          },
        }))
        return week.id
      },

      // Add a batch to a custom week
      addMealBatch(meal, weekId) {
        const batchId = `${weekId}-b${Date.now()}`
        const batch = {
          id: batchId, isCustom: true,
          cookDay: 'dom', covers: [],
          protein: '', combo: '', note: '',
          kcalEst: 0, costEst: 0, items: [],
        }
        set(s => ({
          mealCustomWeeks: {
            ...s.mealCustomWeeks,
            [meal]: (s.mealCustomWeeks[meal] ?? []).map(w =>
              w.id === weekId ? { ...w, batches: [...w.batches, batch] } : w
            ),
          },
        }))
        return batchId
      },

      // Update a custom batch in place
      updateMealBatch(meal, weekId, batchId, data) {
        set(s => ({
          mealCustomWeeks: {
            ...s.mealCustomWeeks,
            [meal]: (s.mealCustomWeeks[meal] ?? []).map(w =>
              w.id === weekId
                ? { ...w, batches: w.batches.map(b => b.id === batchId ? { ...b, ...data } : b) }
                : w
            ),
          },
        }))
      },

      // Remove a custom batch
      removeMealBatch(meal, weekId, batchId) {
        set(s => ({
          mealCustomWeeks: {
            ...s.mealCustomWeeks,
            [meal]: (s.mealCustomWeeks[meal] ?? []).map(w =>
              w.id === weekId ? { ...w, batches: w.batches.filter(b => b.id !== batchId) } : w
            ),
          },
        }))
      },

      // Remove a whole custom week
      removeMealWeek(meal, weekId) {
        set(s => ({
          mealCustomWeeks: {
            ...s.mealCustomWeeks,
            [meal]: (s.mealCustomWeeks[meal] ?? []).filter(w => w.id !== weekId),
          },
        }))
      },

      // ── WEEKLY MEAL PLANNER ───────────────────────────────────────────────
      weekPlan: {}, // { 'YYYY-Www': { 'lun-desayuno': {...}, 'lun-comida': {...}, ... } }

      setMealSlot(weekKey, slotKey, mealData) {
        set(s => ({
          weekPlan: {
            ...s.weekPlan,
            [weekKey]: {
              ...(s.weekPlan[weekKey] ?? {}),
              [slotKey]: mealData,
            },
          },
        }))
      },

      clearMealSlot(weekKey, slotKey) {
        set(s => {
          const week = { ...(s.weekPlan[weekKey] ?? {}) }
          delete week[slotKey]
          return {
            weekPlan: {
              ...s.weekPlan,
              [weekKey]: Object.keys(week).length === 0 ? undefined : week,
            },
          }
        })
      },

      // Merge several slots into one weekKey in a SINGLE set() call. Cada
      // set() dispara su propio storage.setItem (persist no las agrupa) --
      // rellenar una semana con N llamadas sueltas a setMealSlot lanza N
      // escrituras a Supabase casi simultaneas, y como son promesas de red
      // sin orden garantizado, la que termine de responder MAS TARDE gana,
      // no la que se llamo la ultima. Resultado real: "cargar semana modelo"
      // guardaba una semana a medias (o directamente vacia) al recargar,
      // aunque en pantalla se viera completa. Con una sola llamada aqui,
      // hay una sola escritura -- no hay carrera que perder.
      setMealSlots(weekKey, slotsPartial) {
        set(s => ({
          weekPlan: {
            ...s.weekPlan,
            [weekKey]: { ...(s.weekPlan[weekKey] ?? {}), ...slotsPartial },
          },
        }))
      },

      // ── MARCAS COMPARTIDAS (Compra / Batch) ────────────────────────────
      // Van en el guardado compartido (Supabase) para que lo que marca uno
      // en el súper o al llenar tuppers lo vea el otro. Se guardan solo las
      // últimas ventanas para que el estado no crezca sin fin.
      shopChecks: {},                 // { 'batch-2026-W40': [ingKey, …] }
      pantry:     { have: [], miss: [] }, // «En casa» marcado a mano (vale para todas las semanas)
      batchTups:  {},                 // { '2026-W40': [tupperId, …] }

      toggleShopCheck(windowKey, ingKey) {
        set(s => ({ shopChecks: toggleIn(s.shopChecks, windowKey, ingKey) }))
      },
      setAtHome(ingKey, home) {
        set(s => {
          const have = new Set(s.pantry?.have ?? []), miss = new Set(s.pantry?.miss ?? [])
          if (home) { have.add(ingKey); miss.delete(ingKey) } else { have.delete(ingKey); miss.add(ingKey) }
          return { pantry: { have: [...have], miss: [...miss] } }
        })
      },
      // ── DESPENSA CON CANTIDADES (27 sep 2026) ──────────────────────────
      // stock: lo que hay en casa, en la unidad base del paquete (g, ml o
      // unidades) y cuándo entró (para saber si ya caducó). Al marcar algo
      // como comprado entra el paquete entero (stockLog guarda cuánto, para
      // poder desmarcarlo); al marcar el batch como cocinado se descuenta lo
      // de lunes a viernes (cookedBatches, reversible).
      stock:         {},   // { ingKey: { amount, addedAt } }
      stockLog:      {},   // { checksKey: { ingKey: amount } }
      cookedBatches: {},   // { weekKey: { ingKey: amount } }

      setStock(ingKey, amount, addedAt) {
        set(s => {
          const stock = { ...s.stock }
          if (!(amount > 0.0001)) delete stock[ingKey]
          else stock[ingKey] = { amount, addedAt: addedAt ?? stock[ingKey]?.addedAt ?? new Date().toISOString() }
          return { stock }
        })
      },
      // Comprar: marca la casilla y mete en la despensa lo comprado.
      buyShopItem(checksKey, ingKey, amount) {
        set(s => {
          const was = (s.shopChecks?.[checksKey] ?? []).includes(ingKey)
          const stock = { ...s.stock }, log = { ...(s.stockLog?.[checksKey] ?? {}) }
          if (was) {
            const back = log[ingKey] ?? 0
            if (back > 0 && stock[ingKey]) {
              const left = stock[ingKey].amount - back
              if (left > 0.0001) stock[ingKey] = { ...stock[ingKey], amount: left }; else delete stock[ingKey]
            }
            delete log[ingKey]
          } else if (amount > 0) {
            stock[ingKey] = { amount: (stock[ingKey]?.amount ?? 0) + amount, addedAt: new Date().toISOString() }
            log[ingKey] = amount
          }
          const stockLog = { ...s.stockLog, [checksKey]: log }
          const keys = Object.keys(stockLog)
          if (keys.length > 8) keys.sort().slice(0, keys.length - 8).forEach(k => delete stockLog[k])
          return { shopChecks: toggleIn(s.shopChecks, checksKey, ingKey), stock, stockLog }
        })
      },
      // Batch cocinado: descuenta lo que se come de lunes a viernes.
      cookBatch(weekKey, usage) {
        set(s => {
          if (s.cookedBatches?.[weekKey]) return {}
          const stock = { ...s.stock }, took = {}
          for (const [k, need] of Object.entries(usage)) {
            const have = stock[k]?.amount ?? 0
            const t = Math.min(have, need)
            if (!(t > 0)) continue
            took[k] = t
            if (have - t > 0.0001) stock[k] = { ...stock[k], amount: have - t }; else delete stock[k]
          }
          const cookedBatches = { ...s.cookedBatches, [weekKey]: took }
          const keys = Object.keys(cookedBatches)
          if (keys.length > 8) keys.sort().slice(0, keys.length - 8).forEach(k => delete cookedBatches[k])
          return { stock, cookedBatches }
        })
      },
      uncookBatch(weekKey) {
        set(s => {
          const took = s.cookedBatches?.[weekKey]
          if (!took) return {}
          const stock = { ...s.stock }
          for (const [k, t] of Object.entries(took)) stock[k] = { amount: (stock[k]?.amount ?? 0) + t, addedAt: stock[k]?.addedAt ?? new Date().toISOString() }
          const cookedBatches = { ...s.cookedBatches }; delete cookedBatches[weekKey]
          return { stock, cookedBatches }
        })
      },
      toggleBatchTup(weekKey, tupId) {
        set(s => ({ batchTups: toggleIn(s.batchTups, weekKey, tupId) }))
      },

      // ── SEMANAS GUARDADAS (semanas modelo propias) ─────────────────────
      // «Guardar semana» copia los 28 huecos de una semana del plan con un
      // nombre. Las semanas modelo de fábrica (data/modelWeeks.js) no se
      // pueden borrar del código: se ocultan (hiddenModelWeeks) y se pueden
      // renombrar (modelWeekNames). Todo en el guardado compartido.
      // Archivo (26 sep 2026): archivar es reversible; dentro del archivo se
      // puede borrar para siempre. Semana propia archivada = `archived: true`;
      // de fábrica archivada = hiddenModelWeeks; de fábrica borrada para
      // siempre = deletedModelWeeks (no vuelve a salir en ningún sitio).
      customWeeks:      [],   // [{ id, name, slots, savedAt, archived? }]
      hiddenModelWeeks: [],   // [n] — archivadas
      deletedModelWeeks: [],  // [n] — borradas para siempre
      modelWeekNames:   {},   // { n: 'nombre' }
      // Semana modelo que se está editando en el Planificador (por dispositivo,
      // no se guarda): { kind: 'custom' | 'model', id, name, weekKey }
      editingWeek: null,
      setEditingWeek(v) { set({ editingWeek: v }) },

      saveCustomWeek({ id = null, name, slots }) {
        const newId = id ?? Date.now().toString(36)
        set(s => {
          const entry = { id: newId, name, slots, savedAt: new Date().toISOString() }
          const exists = s.customWeeks.some(w => w.id === newId)
          return { customWeeks: exists ? s.customWeeks.map(w => w.id === newId ? entry : w) : [...s.customWeeks, entry] }
        })
        return newId
      },
      // Guardar encima de una semana de fábrica: pasa a ser tuya con el mismo
      // nombre y la original se oculta (una sola escritura).
      replaceModelWeek(n, { name, slots }) {
        const newId = Date.now().toString(36)
        set(s => ({
          customWeeks: [...s.customWeeks, { id: newId, name, slots, savedAt: new Date().toISOString() }],
          hiddenModelWeeks: [...new Set([...(s.hiddenModelWeeks ?? []), n])],
        }))
        return newId
      },
      renameWeek(kind, id, name) {
        if (kind === 'custom') set(s => ({ customWeeks: s.customWeeks.map(w => w.id === id ? { ...w, name } : w) }))
        else set(s => ({ modelWeekNames: { ...s.modelWeekNames, [id]: name } }))
      },
      archiveWeek(kind, id) {
        if (kind === 'custom') set(s => ({ customWeeks: s.customWeeks.map(w => w.id === id ? { ...w, archived: true } : w) }))
        else set(s => ({ hiddenModelWeeks: [...new Set([...(s.hiddenModelWeeks ?? []), id])] }))
      },
      unarchiveWeek(kind, id) {
        if (kind === 'custom') set(s => ({ customWeeks: s.customWeeks.map(w => w.id === id ? { ...w, archived: false } : w) }))
        else set(s => ({ hiddenModelWeeks: (s.hiddenModelWeeks ?? []).filter(n => n !== id) }))
      },
      deleteWeekForever(kind, id) {
        if (kind === 'custom') set(s => ({ customWeeks: s.customWeeks.filter(w => w.id !== id) }))
        else set(s => ({
          hiddenModelWeeks: (s.hiddenModelWeeks ?? []).filter(n => n !== id),
          deletedModelWeeks: [...new Set([...(s.deletedModelWeeks ?? []), id])],
        }))
      },

      // Como setMealSlots, pero sustituye la semana ENTERA (no fusiona) --
      // para "Limpiar", "Cargar semana modelo", "Generar barato" y "Repetir
      // anterior", que primero querian borrar los huecos viejos y luego
      // rellenar: separarlo en clear()+N×set() tenia el mismo problema de
      // carrera de arriba. slots vacio equivale a limpiar la semana.
      replaceWeek(weekKey, slots) {
        set(s => ({
          weekPlan: {
            ...s.weekPlan,
            [weekKey]: Object.keys(slots).length === 0 ? undefined : slots,
          },
        }))
      },
    }),

    {
      name:    STORAGE_KEY,
      storage: createStorageAdapter(),
      // v1 (26 sep 2026): getISOWeek corregido — las claves de weekPlan
      // guardadas con la formula vieja se renumeran una sola vez.
      // v4 (3 oct 2026): se elimina la ficha duplicada 'cranberry-beans' (se llamaba
      // igual que 'romano-beans'): sus referencias pasan a 'romano-beans'.
      // v3 (3 oct 2026): la compra del Costco Business entra una sola vez en la
      // despensa (ver BUSINESS_TRIP_STOCK); si ya hay algo de eso, no se toca.
      version: 4,
      migrate(state, version) {
        let st = state
        if (version < 1 && st?.weekPlan) st = { ...st, weekPlan: migrateWeekKeys(st.weekPlan) }
        if (version < 2) st = migrateKeysV2(st)
        if (version < 3 && st) {
          const stock = { ...(st.stock ?? {}) }
          for (const [k, v] of Object.entries(BUSINESS_TRIP_STOCK)) if (!stock[k]) stock[k] = v
          st = { ...st, stock }
        }
        if (version < 4 && st) st = JSON.parse(JSON.stringify(st).replaceAll('"cranberry-beans"', '"romano-beans"'))
        return st
      },
      skipHydration: true,
      partialize: s => ({
        priceOverrides:      s.priceOverrides,
        ingredientOverrides: s.ingredientOverrides,
        deletedIngredients:  s.deletedIngredients,
        customIngredients:   s.customIngredients,
        comboOverrides:      s.comboOverrides,
        deletedCombos:       s.deletedCombos,
        customCombos:        s.customCombos,
        customCategories:    s.customCategories,
        extraStores:         s.extraStores,
        dishPrefs:           s.dishPrefs,
        pairPrefs:           s.pairPrefs,
        batchSettings:       s.batchSettings,
        storeColors:         s.storeColors,
        catColors:           s.catColors,
        catLabels:           s.catLabels,
        hiddenCats:          s.hiddenCats,
        batchOverrides:      s.batchOverrides,
        deletedBatches:      s.deletedBatches,
        mealBatchOverrides:  s.mealBatchOverrides,
        mealDeletedBatches:  s.mealDeletedBatches,
        mealCustomWeeks:     s.mealCustomWeeks,
        weekPlan:            s.weekPlan,
        shopChecks:          s.shopChecks,
        pantry:              s.pantry,
        stock:               s.stock,
        stockLog:            s.stockLog,
        cookedBatches:       s.cookedBatches,
        batchTups:           s.batchTups,
        customWeeks:         s.customWeeks,
        hiddenModelWeeks:    s.hiddenModelWeeks,
        deletedModelWeeks:   s.deletedModelWeeks,
        modelWeekNames:      s.modelWeekNames,
        // activeView / activeMeal NOT persisted → always start at home
      }),
    }
  )
)

export default useStore

// Colores de tiendas y categorías elegidos por el usuario → lib/stores.js
applyColorOverrides(useStore.getState().storeColors, useStore.getState().catColors)
// Días de batch → lib/batchConfig.js (lo leen Compra, Batch, Planificador, semana inteligente…)
applyBatchSettings(useStore.getState().batchSettings)
useStore.subscribe(s => applyBatchSettings(s.batchSettings))
useStore.subscribe(s => applyColorOverrides(s.storeColors, s.catColors))

// ─── SELECTORS ───────────────────────────────────────────────────────────────

export function selectAllIng(s) {
  const deleted = new Set(s.deletedIngredients)
  const base    = { ...ING, ...s.customIngredients }
  const merged  = {}
  for (const [k, v] of Object.entries(base)) {
    if (deleted.has(k)) continue
    // Sin kcal (p. ej. un ingrediente tuyo sin etiqueta): se estiman por el nombre.
    merged[k] = withEstimatedNutrition(k, { ...v, ...s.ingredientOverrides[k], ...s.priceOverrides[k] })
  }
  return merged
}

export function selectAllCombos(s) {
  const deleted = new Set(s.deletedCombos)
  const result  = {}
  for (const [k, v] of Object.entries(COMBO)) {
    if (deleted.has(k)) continue
    result[k] = s.comboOverrides[k] ? { ...v, ...s.comboOverrides[k] } : v
  }
  for (const c of s.customCombos) {
    const key = 'custom-' + c.id
    if (!deleted.has(key)) result[key] = { name: c.name, items: c.items, meals: c.meals ?? [], isCustom: true, customId: c.id, ...(c.snack ? { snack: true } : {}), ...(c.snackGenerated ? { snackGenerated: true } : {}), ...(c.scalable ? { scalable: c.scalable } : {}), ...(c.scalableMax != null ? { scalableMax: c.scalableMax } : {}), ...(c.noAove ? { noAove: true } : {}), ...(c.optionalItems ? { optionalItems: c.optionalItems } : {}) }
  }
  return result
}

export function selectAllCats(s) {
  const base = {}
  for (const [k, v] of Object.entries(CAT_LABELS)) if (!(s.hiddenCats ?? []).includes(k)) base[k] = s.catLabels?.[k] ?? v
  for (const c of s.customCategories) base[c.key] = c.label
  return base
}

/** Orden de categorías visibles: las de fábrica y luego las tuyas. */
export function selectCatOrder(s) {
  return [...CAT_ORDER.filter(k => !(s.hiddenCats ?? []).includes(k)), ...s.customCategories.map(c => c.key)]
}

/** Merged plan for a meal: static base + custom weeks + overrides + deletions */
export function selectMealPlan(meal) {
  return function(s) {
    const base      = BASE_PLANS[meal] ?? []
    const custom    = s.mealCustomWeeks?.[meal] ?? []
    const all       = [...base, ...custom]
    const overrides = s.mealBatchOverrides?.[meal]  ?? {}
    const deleted   = new Set(s.mealDeletedBatches?.[meal] ?? [])
    return all.map(week => ({
      ...week,
      batches: (week.batches ?? [])
        .filter(b => !deleted.has(b.id))
        .map(b   => (!b.isCustom && overrides[b.id]) ? { ...b, ...overrides[b.id] } : b),
    }))
  }
}
