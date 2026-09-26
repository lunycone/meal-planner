import { create } from 'zustand'
import { persist }  from 'zustand/middleware'
import { ING, CAT_LABELS } from '../data/ingredients'
import { COMBO }            from '../data/combos'
import { STORAGE_KEY, createStorageAdapter } from './storage'
import { migrateWeekKeys } from '../utils/date'

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
const VALID_VIEWS = ['home', 'meal', 'platos', 'ingredientes', 'planificador', 'compra', 'batch']

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
          return { id: 'all', name: 'Todos', initial: 'T', kcalTarget: valid.reduce((sum, p) => sum + p.kcalTarget, 0), proteinTarget: valid.reduce((sum, p) => sum + (p.proteinTarget || 0), 0) }
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
          label: `Semana ${weekNum}`,
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
      toggleBatchTup(weekKey, tupId) {
        set(s => ({ batchTups: toggleIn(s.batchTups, weekKey, tupId) }))
      },

      // ── SEMANAS GUARDADAS (semanas modelo propias) ─────────────────────
      // «Guardar semana» copia los 28 huecos de una semana del plan con un
      // nombre. Las semanas modelo de fábrica (data/modelWeeks.js) no se
      // pueden borrar del código: se ocultan (hiddenModelWeeks) y se pueden
      // renombrar (modelWeekNames). Todo en el guardado compartido.
      customWeeks:      [],   // [{ id, name, slots, savedAt }]
      hiddenModelWeeks: [],   // [n]
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
      deleteWeek(kind, id) {
        if (kind === 'custom') set(s => ({ customWeeks: s.customWeeks.filter(w => w.id !== id) }))
        else set(s => ({ hiddenModelWeeks: [...new Set([...(s.hiddenModelWeeks ?? []), id])] }))
      },
      restoreModelWeeks() { set({ hiddenModelWeeks: [] }) },

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
      version: 1,
      migrate(state, version) {
        if (version < 1 && state?.weekPlan) return { ...state, weekPlan: migrateWeekKeys(state.weekPlan) }
        return state
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
        batchOverrides:      s.batchOverrides,
        deletedBatches:      s.deletedBatches,
        mealBatchOverrides:  s.mealBatchOverrides,
        mealDeletedBatches:  s.mealDeletedBatches,
        mealCustomWeeks:     s.mealCustomWeeks,
        weekPlan:            s.weekPlan,
        shopChecks:          s.shopChecks,
        pantry:              s.pantry,
        batchTups:           s.batchTups,
        customWeeks:         s.customWeeks,
        hiddenModelWeeks:    s.hiddenModelWeeks,
        modelWeekNames:      s.modelWeekNames,
        // activeView / activeMeal NOT persisted → always start at home
      }),
    }
  )
)

export default useStore

// ─── SELECTORS ───────────────────────────────────────────────────────────────

export function selectAllIng(s) {
  const deleted = new Set(s.deletedIngredients)
  const base    = { ...ING, ...s.customIngredients }
  const merged  = {}
  for (const [k, v] of Object.entries(base)) {
    if (deleted.has(k)) continue
    merged[k] = { ...v, ...s.ingredientOverrides[k], ...s.priceOverrides[k] }
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
    if (!deleted.has(key)) result[key] = { name: c.name, items: c.items, meals: c.meals ?? [], isCustom: true, customId: c.id }
  }
  return result
}

export function selectAllCats(s) {
  const base = { ...CAT_LABELS }
  for (const c of s.customCategories) base[c.key] = c.label
  return base
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
