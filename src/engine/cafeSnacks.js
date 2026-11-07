import { CAFE_SNACKS } from '../data/cafeSnacks'
import { comboAgg } from './calc'
import { DAY_KEYS, dayForPerson } from '../lib/mealplan'
import { needAmount } from '../lib/needs'
import { packOf } from '../lib/packs'
import { reviewDay } from '../lib/reviewWeek'
import { testedIngredients } from './tolerance'

const piece = new Set(['lemon', 'apple'])
const pinch = new Set(['basil', 'cinnamon'])
const portion = (key, amount) => pinch.has(key) ? {} : piece.has(key) ? { units: amount } : { grams: amount }

// Food, preview and planner all use the same items. Culinary quantities don't
// change unit when the household edits a price or switches to a different pack.
export function cafeMenu({ person, dayIndex, week, allIng, allCombos, tried, stock, openPacks, feedback, noveltyMax, larger, toGo }) {
  const familiar = testedIngredients(tried)
  const day = dayForPerson(week, DAY_KEYS[dayIndex], person.id)
  const results = []
  for (const recipe of CAFE_SNACKS) {
    if (toGo && !recipe.travel) continue
    if (!recipe.items.every(([k]) => allIng[k])) continue
    const novel = recipe.items.map(([k]) => k).filter(k => !familiar[k])
    if (novel.length > noveltyMax) continue
    const key = 'cafe-' + recipe.id
    const previous = feedback?.[person.id]?.[key]
    const items = recipe.items.map(([k, regular, generous]) => ({ k, p: portion(k, larger ? generous : regular) }))
    const combo = { name: recipe.name, items }
    const catalog = Object.create(allCombos)
    catalog[key] = combo
    const projected = { ...day, merienda: { type: 'desayuno', recipeKey: key } }
    const { issues, totals } = reviewDay(projected, person, dayIndex, allIng, catalog)
    const onHand = items.filter(({ k, p }) => {
      const pack = packOf(allIng[k])
      const dim = pack?.dim ?? (p.units != null ? 'unit' : 'g')
      const need = needAmount({ qtyByUnit: p }, allIng[k], { dim })
      return need > 0 && stock[k] >= need
    }).map(({ k }) => k)
    results.push({ ...recipe, key, items, novel, previous, totals, issues, macros: comboAgg(combo, allIng),
      onHand, open: onHand.filter(k => openPacks.includes(k)) })
  }
  const misses = r => r.issues.filter(issue => issue.required && issue.rule !== 'incomplete').length
  const pantryShare = r => r.onHand.length / r.items.length
  const fullness = r => r.previous === 'enough' ? 1 : r.previous === 'hungry' ? -1 : 0
  return results.sort((a, b) => misses(a) - misses(b) || fullness(b) - fullness(a) ||
    b.open.length - a.open.length || pantryShare(b) - pantryShare(a))
}
