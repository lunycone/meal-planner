import { buildPool, fillSteps } from './snackGen'
import { personTargetForDay, glycemicCheck } from './calc'
import { DAY_KEYS, dayForPerson } from '../lib/mealplan'
import { reviewDay } from '../lib/reviewWeek'
import { needAmount } from '../lib/needs'
import { packOf } from '../lib/packs'

const excluded = /tahini|stevia|erythritol|eritritol|xylitol|xilitol|sucralose|sucralosa|allulose|alulosa|aspartame|aspartamo|monk[ -]fruit|saccharin|sacarina|acesulfame|maltitol|sorbitol|sweetener|edulcorante/i
const ingredientKey = combo => combo.items.map(i => i.k).sort().join('|')

// Reuses the existing flavor pairings and kitchen-sized portions, without searching a whole week.
export function breakfastIdeas({ allIng, allCombos, persons, days, week = {}, stock = {}, onlyGreen = false, seed = 1 }) {
  if (!persons.length || !days.length) return []
  const ingredients = Object.fromEntries(Object.entries(allIng).filter(([k, v]) => !v.pend && !excluded.test(k + ' ' + v.name)))
  const tried = Object.fromEntries(Object.entries(allCombos).filter(([, c]) => !c.snackGenerated && !/^gen-/.test(c.customId ?? '')))
  const sizedPeople = persons.map(p => {
    const target = days.reduce((sum, dk) => sum + personTargetForDay(p, DAY_KEYS.indexOf(dk)), 0) / days.length
    return { ...p, kcalTarget: target, kcalByDay: Array(7).fill(target) }
  }).sort((a, b) => Number(!!b.digestive) - Number(!!a.digestive))
  // The existing solver supports one or two people. Larger groups are solved individually.
  const pools = sizedPeople.length <= 2 ? [buildPool({ allIng: ingredients, dishes: tried, persons: sizedPeople, mealSlot: 'desayuno', candidateSeed: seed, portionOnly: true })]
    : sizedPeople.map(p => buildPool({ allIng: ingredients, dishes: tried, persons: [p], mealSlot: 'desayuno', candidateSeed: seed, portionOnly: true }))
  const baseline = {}
  for (const p of persons) for (const dk of days) {
    const day = dayForPerson(week, dk, p.id)
    baseline[p.id + dk] = reviewDay({ ...day, desayuno: null }, p, DAY_KEYS.indexOf(dk), allIng, allCombos).issues
  }
  const results = [], seen = new Set()
  for (const original of pools[0].sols) {
    if (original.archId === 'smoothie' && original.combo.items.some(i => ['butter', 'coconut-oil'].includes(i.k))) continue
    const servings = { ...original.persons }
    if (pools.length > 1) {
      const matches = pools.slice(1).map(pool => pool.byId[original.id])
      if (matches.some(x => !x)) continue
      matches.forEach(x => Object.assign(servings, x.persons))
    }
    const signature = original.archId + ':' + ingredientKey(original.combo)
    if (seen.has(signature)) continue
    if (pools.some(pool => (pool.novel[original.id]?.size ?? 2) > 1)) continue
    const pcosPeople = persons.filter(p => p.pcos)
    if (onlyGreen && !(pcosPeople.length ? pcosPeople : persons).every(p => glycemicCheck(servings[p.id].combo, ingredients, 'desayuno').status === 'within')) continue
    const notes = [], needs = {}, recipes = {}
    let issues = 0, repeats = 0, deviation = 0
    for (const p of persons) {
      const serving = servings[p.id]
      const method = original.archId === 'savory-toast' ? { ...original.arch, steps: ['Toast {bread}.', 'Top with {yogurt}, {cured} and {fat}.'] } : original.arch
      const measuredItems = serving.items.map((item, index) => {
        const portion = serving.combo.items[index].p
        return { ...item, q: portion.ml ?? item.qty, unit: portion.ml != null ? 'ml' : item.unit }
      })
      const steps = fillSteps(method, measuredItems.filter(i => i.slotId !== 'companion'), ingredients)
      if (serving.items.some(i => i.slotId === 'companion')) steps.push('Serve the listed milk alongside your breakfast.')
      recipes[p.id] = { name: original.label + ' · ' + p.name, items: serving.combo.items, recipeSteps: steps, ownerId: p.id, meals: ['desayuno'], snackGenerated: true }
      for (const dk of days) {
        const day = dayForPerson(week, dk, p.id)
        const catalog = { ...allCombos, __breakfastIdea: serving.combo }
        const reviewed = reviewDay({ ...day, desayuno: { type: 'desayuno', recipeKey: '__breakfastIdea' } }, p, DAY_KEYS.indexOf(dk), allIng, catalog)
        const added = reviewed.issues.filter(n => n.rule !== 'incomplete' && !baseline[p.id + dk].some(b => b.rule === n.rule && b.text === n.text))
        issues += added.filter(n => n.required).length
        added.forEach(n => notes.push(p.name + ': ' + n.text))
        deviation += Math.abs(serving.kcal - Math.max(400, personTargetForDay(p, DAY_KEYS.indexOf(dk)) * 0.15)) / 400
      }
      for (const dk of DAY_KEYS.filter(d => !days.includes(d))) {
        const previous = allCombos[dayForPerson(week, dk, p.id).desayuno?.recipeKey]
        if (previous && ingredientKey(previous) === ingredientKey(serving.combo)) repeats++
      }
      for (const [index, { k, p: portion }] of serving.combo.items.entries()) {
        if (!Object.keys(portion).length) continue
        const dim = packOf(ingredients[k])?.dim ?? (portion.ml != null ? 'ml' : portion.units != null ? 'unit' : 'g')
        const quantity = dim === 'ml' && serving.items[index]?.unit === 'ml' ? serving.items[index].qty : needAmount({ qtyByUnit: portion }, ingredients[k], { dim })
        needs[k] = (needs[k] ?? 0) + quantity * days.length
      }
    }
    const keys = Object.keys(needs)
    const coverage = keys.reduce((sum, k) => sum + Math.min(1, Math.max(0, stock[k] ?? 0) / (needs[k] || 1)), 0) / Math.max(1, keys.length)
    const family = original.archId
    const style = family === 'overnight-oats' ? 'Prepare tonight' : original.arch.taste === 'savory' ? 'Savory' : original.arch.minutes <= 5 ? 'Quick & sweet' : 'Warm breakfast'
    seen.add(signature)
    results.push({ id: signature, name: original.label, family, main: original.mainKey, style, recipes, notes: [...new Set(notes)],
      minutes: original.arch.minutes, issues, repeats, coverage, deviation,
      reason: `${style} · ~${original.arch.minutes} min${family === 'overnight-oats' ? ' prep + overnight rest' : ''}. ${coverage === 1 ? 'Measured ingredients covered by your pantry.' : coverage >= 0.7 ? 'Mostly covered by your pantry.' : 'Built from your ingredient catalog; check pantry quantities.'}` })
  }
  return results.sort((a, b) => a.issues - b.issues || a.repeats - b.repeats || b.coverage - a.coverage || a.deviation - b.deviation || a.minutes - b.minutes)
}

export { diverseBreakfasts } from '../lib/breakfastChoices'
