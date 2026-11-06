// Run from the project root: npm run check:portions
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ING } from '../src/data/ingredients.js'
import { COMBO } from '../src/data/combos.js'
import { generateSmartPlan } from '../src/engine/smartWeek.js'
import { hasPasta, starchFamily } from '../src/lib/tags.js'
import { servingItems } from '../src/lib/portions.js'
import { packOf } from "../src/lib/packs.js"
import { aggregateIngredients, needAmount, packPlan } from '../src/lib/needs.js'
import { computeBatchMeal } from '../src/components/tabs/BatchPrepTab.jsx'
import Detail from '../src/components/meal/SmartDayDetail.jsx'
import { DAY_KEYS, dayForPerson, dayTotals, mealInfo } from '../src/lib/mealplan.js'
import { glycemicCheck, comboScalableKey, personMealScalesTwoPass, DRY_TO_COOKED, pcosCarbLevel, dishGlycemicLoad } from '../src/engine/calc.js'

const people = [
  { id: 'julio', name: 'Julio', kcalTarget: 3100, proteinTarget: 100, digestive: true, kcalByDay: [3150,3150,3100,3300,3000] },
  { id: 'maria', name: 'María', kcalTarget: 2600, proteinTarget: 100, pcos: true, protCap: 130, kcalByDay: [2500,2900,2500,2750,2500] },
]
const { results } = generateSmartPlan({ allIng: ING, allCombos: COMBO, people, source: 'ingredients', snackMode: 'new' })
assert.equal(results.length, 3)
const person = people[1], index = 1
for (const result of results) {
  const all = { ...COMBO, ...result.newDishes }
  const day = dayForPerson(result.slots, DAY_KEYS[index], person.id)
  const dinner = all[day.cena.recipeKey]
  assert.ok(!hasPasta(dinner, ING))
  const totals = dayTotals(day, person, index, ING, all)
  const scale = personMealScalesTwoPass(day, person, ING, all, totals.target).cena
  const items = servingItems(dinner, day.cena, scale)
  const html = renderToStaticMarkup(createElement(Detail, { result, people, days: result.days, allIng: ING, allCombos: all }))
  assert.ok(html.includes('Tuesday') && html.includes(dinner.name.replaceAll('&', '&amp;')))
  assert.ok(html.includes(dishGlycemicLoad({items}, ING).toFixed(1)))
  assert.equal(mealInfo(day,'cena',person,index,ING,all).pcos, pcosCarbLevel({items}, ING,'cena'))
  const dates = [{ wk: 'W', dayKey: 'mar', date: new Date(2026,10,3) }]
  const batch = computeBatchMeal('cena', dates, [person], ING, all, {W:result.slots})[0]
  const shopping = aggregateIngredients({weekPlan:{W:result.slots},windowDates:dates,people:[person],allIng:ING,allCombos:all})
  const expected = {}
  const scales = personMealScalesTwoPass(day,person,ING,all,totals.target)
  for (const [slot,meal] of Object.entries(day)) {
    for (const {k,p} of servingItems(all[meal.recipeKey],meal,scales[slot])) {
      const q = expected[k] ??= {}
      for (const [unit,amt] of Object.entries(p)) q[unit] = (q[unit] ?? 0) + amt
    }
  }
  for (const [k,q] of Object.entries(expected)) for (const [unit,amt] of Object.entries(q)) assert.equal(shopping[k].qtyByUnit[unit], amt)
  const base = items.find(it=>it.k===batch.personTotals[0].baseKey)
  if (base) assert.equal(batch.personTotals[0].baseGrams,base.p.grams)
  for (const item of batch.sharedItems) {
    for (const unit of ['grams','ml','units']) assert.equal(item[unit],items.filter(it=>it.k===item.key).reduce((s,it)=>s+(it.p[unit]??0),0))
  }

}
assert.ok(results.every(r => r.violations >= results[0].violations))
const split = generateSmartPlan({ allIng: ING, allCombos: COMBO, people, source: 'ingredients', snackMode: 'new', sessions: [[0,1,2],[3,4]], splitDinners: true, stock: { eggs: 3 } })
assert.equal(split.results.length, 3)
for (const week of split.results) {
  const [a,b] = week.parts
  assert.equal(a.plan.L,b.plan.L)
  assert.deepEqual(a.plan.B,b.plan.B)
  assert.deepEqual(a.plan.S,b.plan.S)
  assert.notEqual(a.plan.D,b.plan.D)
  assert.equal(Object.keys(week.slots).length,20)
  const combos = {...COMBO,...week.newDishes}
  const base = part => starchFamily(comboScalableKey(combos[part.plan.D], ING),ING)
  assert.notEqual(base(a),base(b))
  assert.ok([a,b].every(part => !hasPasta(combos[part.plan.D], ING)))
  const needs = aggregateIngredients({weekPlan:{W:week.slots},windowDates:week.days.map(i=>({wk:'W',dayKey:DAY_KEYS[i]})),people,allIng:ING,allCombos:combos})
  let checkout = 0
  for (const [k, data] of Object.entries(needs)) {
    const pack = packOf(ING[k])
    if (pack) checkout += packPlan(k,needAmount(data,ING[k],pack),k === 'eggs' ? 3 : 0,ING).buyCost ?? 0
  }
  assert.ok(Math.abs(week.packs.checkout-checkout)<0.00001)
  console.log([a,b].map(x=>combos[x.plan.D].name).join(' / '), week.warnings)
}
assert.equal(DRY_TO_COOKED['pasta-dimartino'], 2.5)
for (const r of results) console.log(r.newDishes[r.plan.D].name, r.cost.toFixed(2), r.warnings)
console.log('Verified Smart, Planner, Batch and Shopping for María on Tuesday across three generated options.')

for (const source of ['dishes', 'country', 'surprise']) {
  const out = generateSmartPlan({ allIng: ING, allCombos: COMBO, people, source, seed: 2 })
  assert.ok(out.results.length > 0, source)
  for (const r of out.results) assert.ok(!hasPasta(({ ...COMBO, ...r.newDishes })[r.plan.D], ING), source)
}
const pastaKey = Object.keys(COMBO).find(k => hasPasta(COMBO[k], ING) && COMBO[k].meals?.includes('cena'))
assert.ok(pastaKey)
const locked = generateSmartPlan({ allIng: ING, allCombos: COMBO, people, locks: {parts:[{D:pastaKey}]} })
assert.equal(locked.results.length,0,'A locked dinner must still respect the pasta rule')
const strict = generateSmartPlan({ allIng: ING, allCombos: COMBO, people, source:'ingredients', snackMode:'new', strictRules:true })
assert.ok(strict.results.length)
assert.ok(strict.results.every(r=>!r.violations && !r.uncertainty))
const pasta = {items:[{ k:'pasta-dimartino',p:{grams:100} }]}
assert.equal(glycemicCheck(pasta,ING,'cena').status,'unknown')
assert.equal(glycemicCheck(pasta,{...ING,'pasta-dimartino':{...ING['pasta-dimartino'],gi:100}},'cena').status,'exceeded')
console.log('Verified pasta exclusion across sources and locks, strict ranking, and unknown versus high GI.')

const { reviewSaved } = require('../src/lib/reviewWeek.js')
const stored = { ...results[0].slots, 'lun-cena': { type:'desayuno', recipeKey:pastaKey } }
const savedReview = reviewSaved(stored,{},people,ING,{...COMBO,...results[0].newDishes},150)
assert.deepEqual(savedReview.skipped,['Mon'])
assert.ok(!savedReview.incoming['lun-cena'] && stored['lun-cena'])
assert.ok(savedReview.required)
const { buildPool, snackShortlist } = require('../src/engine/snackGen.js')
const pool = buildPool({ allIng:ING, dishes:COMBO, persons:people, mealSlot:'merienda', candidateSeed:1 })
const quick = snackShortlist(pool,1,{week:results[0].slots,allCombos:{...COMBO,...results[0].newDishes},dayIndex:1,portable:true})
assert.ok(quick.length)
for(const choice of quick) {
  assert.equal(choice.daily.maria.count,4)
  const catalog = {...COMBO,...results[0].newDishes,testSnack:choice.persons.maria.combo}
  const day = {...dayForPerson(results[0].slots,DAY_KEYS[1],'maria'),merienda:{type:'desayuno',recipeKey:'testSnack'}}
  assert.equal(choice.daily.maria.protein,dayTotals(day,people[1],1,ING,catalog).prot)
  assert.ok(pool.sols.find(s=>s.archId===choice.archetype).arch.portable)
}
assert.ok(snackShortlist(pool,1,{banned:quick.map(c=>c.key)}).every(c=>!quick.some(old=>old.key===c.key)))
console.log('Verified saved-week pasta guard, portable snacks, daily totals and rejected recipes.')
