import { ING_KEYS, DISH_KEYS } from '../data/legacyKeys'

// Migración a version 2 (27 sep 2026): claves internas en español → inglés.
// Reescribe todo lo guardado que las nombra. Es idempotente (una clave que ya
// es nueva no está en los mapas), así que se puede aplicar a datos mixtos.
const ing = k => ING_KEYS[k] ?? k
const dish = k => DISH_KEYS[k] ?? k
const DISH_BY_LEN = Object.keys(DISH_KEYS).sort((a, b) => b.length - a.length)

const mapKeys = (obj, f) => obj ? Object.fromEntries(Object.entries(obj).map(([k, v]) => [f(k), v])) : obj
const fixItems = items => Array.isArray(items) ? items.map(it => it?.k ? { ...it, k: ing(it.k) } : it) : items
const fixCombo = c => c ? { ...c, items: fixItems(c.items), optionalItems: fixItems(c.optionalItems), ...(c.scalable ? { scalable: ing(c.scalable) } : {}) } : c
const fixMeal = m => m?.recipeKey ? { ...m, recipeKey: dish(m.recipeKey), ...(m.comboOptionals ? { comboOptionals: m.comboOptionals.map(ing) } : {}) } : m
const fixSlot = v => !v ? v : v.byPerson ? { byPerson: Object.fromEntries(Object.entries(v.byPerson).map(([p, m]) => [p, fixMeal(m)])) } : fixMeal(v)
const fixWeek = w => w ? Object.fromEntries(Object.entries(w).map(([k, v]) => [k, fixSlot(v)])) : w
const fixTup = id => { const old = DISH_BY_LEN.find(k => id.startsWith(k + '-')); return old ? DISH_KEYS[old] + id.slice(old.length) : id }

export function migrateKeysV2(s) {
  if (!s) return s
  const out = {
    ingredientOverrides: mapKeys(s.ingredientOverrides, ing),
    priceOverrides: mapKeys(s.priceOverrides, ing),
    deletedIngredients: (s.deletedIngredients ?? []).map(ing),
    comboOverrides: s.comboOverrides ? Object.fromEntries(Object.entries(s.comboOverrides).map(([k, v]) => [dish(k), fixCombo(v)])) : s.comboOverrides,
    deletedCombos: (s.deletedCombos ?? []).map(dish),
    customCombos: (s.customCombos ?? []).map(fixCombo),
    weekPlan: s.weekPlan ? Object.fromEntries(Object.entries(s.weekPlan).map(([wk, w]) => [wk, fixWeek(w)])) : s.weekPlan,
    customWeeks: (s.customWeeks ?? []).map(w => ({ ...w, slots: fixWeek(w.slots) })),
    shopChecks: s.shopChecks ? Object.fromEntries(Object.entries(s.shopChecks).map(([k, v]) => [k, (v ?? []).map(ing)])) : s.shopChecks,
    pantry: s.pantry ? { ...s.pantry, have: (s.pantry.have ?? []).map(ing), miss: (s.pantry.miss ?? []).map(ing) } : s.pantry,
    batchTups: s.batchTups ? Object.fromEntries(Object.entries(s.batchTups).map(([k, v]) => [k, (v ?? []).map(fixTup)])) : s.batchTups,
  }
  // Solo lo que venía guardado: un campo ausente no se escribe (si no, un
  // `undefined` pisaría el valor por defecto del store al fusionar).
  const next = { ...s }
  for (const [k, v] of Object.entries(out)) if (s[k] !== undefined) next[k] = v
  return next
}
