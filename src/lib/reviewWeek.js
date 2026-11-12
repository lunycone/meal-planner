import { DAY_KEYS, DAY_SHORT, dayForPerson, dayTotals } from './mealplan'
import { hasPasta, hasWholeLegumes } from './tags'
import { comboAgg, comboFibSol, dishHasAllium, dishHasGOS, dishHasInsolubleFiber, glycemicCheck } from '../engine/calc'
import { dishVegGrams, SOLUBLE_FIBER_DAILY_MIN, VEG_DAILY_MIN } from '../engine/weekRules'

export function reviewDay(day, person, i, allIng, allCombos, vegMin = VEG_DAILY_MIN) {
  const totals = dayTotals(day, person, i, allIng, allCombos)
  const issues = []
  const add = (rule, text) => issues.push({ rule, text, required: person.smartRequired?.[rule] !== false })
  if (!totals.resolved || totals.planned < 4) add('incomplete', 'Incomplete day')
  const dishes = Object.values(totals.resolved ?? {})
  if (totals.planned === 4) {
    if (Math.abs(totals.kcal - totals.target) > totals.target * 0.05) add('kcal', `${totals.kcal} / ${totals.target} kcal`)
    if ((totals.rawProtein ?? totals.prot) < person.proteinTarget) add('protLow', `Below ${person.proteinTarget} g protein`)
    if (dishes.length && dishes.reduce((n,d) => n + dishVegGrams(d, allIng), 0) < vegMin) add('veg', `Below ${vegMin} g vegetables`)
    if (dishes.length && dishes.reduce((n,d) => n + comboFibSol(d, allIng), 0) < SOLUBLE_FIBER_DAILY_MIN) add('sol', 'Below soluble fiber target')
  }
  if ((totals.rawProtein ?? totals.prot) > person.protCap) add('protHigh', `Above ${person.protCap} g protein`)
  if (person.digestive) {
    for (const test of [dishHasGOS, dishHasAllium, dishHasInsolubleFiber]) {
      if (dishes.filter(d => test(d,allIng)).length > 1) { add('dig', 'Repeated digestive food group'); break }
    }
    const b = totals.resolved?.desayuno
    if (b && (comboAgg(b,allIng).kcal < 400 || comboAgg(b,allIng).fat > 15 || [dishHasGOS,dishHasAllium,dishHasInsolubleFiber].some(test => test(b,allIng)))) add('breakfast', 'Breakfast exceeds digestive profile limits')
  }
  if (person.pcos) for (const [slot,label] of [['desayuno','Breakfast'],['cena','Dinner']]) {
    const dish = totals.resolved?.[slot]
    if (!dish) continue
    const check = glycemicCheck(dish,allIng,slot)
    if (check.status !== 'within') add('gl', label + (check.status === 'unknown' ? ' GI incomplete' : ' glycemic load exceeds limit'))
  }
  return { totals, issues }
}

export function reviewSaved(slots, current, people, allIng, allCombos, vegMin) {
  const incoming = { ...slots }
  const skipped = [], notes = []
  let required = false
  for (const [i,dk] of DAY_KEYS.entries()) {
    if (!Object.keys(slots).some(k => k.startsWith(dk + '-'))) continue
    const restrictedDinner = people.some(p => {
      const meal = dayForPerson(slots,dk,p.id).cena
      const dish = allCombos[meal?.recipeKey ?? meal?.comboKey]
      return hasPasta(dish, allIng) || hasWholeLegumes(dish, allIng)
    })
    if (restrictedDinner) { delete incoming[dk + '-cena']; skipped.push(DAY_SHORT[i]) }
    for (const p of people) {
      const day = dayForPerson({...current,...incoming},dk,p.id)
      const {issues} = reviewDay(day,p,i,allIng,allCombos,vegMin)
      if (issues.length) notes.push(`${DAY_SHORT[i]} · ${p.name} · ${issues.map(x=>x.text).join(', ')}`)
      required ||= issues.some(x=>x.required)
    }
  }
  return { incoming, skipped, notes, required }
}
