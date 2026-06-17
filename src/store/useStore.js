import { create } from 'zustand'
import { persist }  from 'zustand/middleware'
import { ING, CAT_LABELS } from '../data/ingredients'
import { COMBO }            from '../data/combos'
import { STORAGE_KEY, createStorageAdapter } from './storage'

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

// ─── Store ───────────────────────────────────────────────────────────────────

const useStore = create(
  persist(
    (set, get) => ({

      // ── NAVIGATION (not persisted) ────────────────────────────────────────
      activeView: 'home',
      activeMeal: null,

      setView(view, meal = null) { set({ activeView: view, activeMeal: meal }) },

      // ── PROFILES ──────────────────────────────────────────────────────────
      profiles: [
        { id: 'julio', name: 'Julio', emoji: '👨', kcalTarget: 2900, active: true },
        { id: 'novia', name: 'Novia', emoji: '👩', kcalTarget: 2300, active: false },
        { id: 'hermana', name: 'Hermana', emoji: '👩', kcalTarget: 2000, active: false, validoHasta: '2026-07-08T17:00:00' },
      ],
      activeProfileId: 'julio',

      getActiveProfile() {
        const s = get()
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
    }),

    {
      name:    STORAGE_KEY,
      storage: createStorageAdapter(),
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
    if (!deleted.has(key)) result[key] = { name: c.name, items: c.items, isCustom: true, customId: c.id }
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
