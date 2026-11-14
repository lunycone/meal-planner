import assert from 'node:assert/strict'
import { ING } from '../src/data/ingredients'
import { bakingIdeas, bakingSettings, DEFAULT_BAKING_SETTINGS } from '../src/engine/baking'
import useStore from '../src/store/useStore'

const memory = new Map()
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
const ideas = options => bakingIdeas({ allIng: ING, ...options })
assert.deepEqual(bakingSettings({ sugar: 'stevia', type: 'invalid', batches: 3 }), DEFAULT_BAKING_SETTINGS)
assert.equal(ideas({ sugar: 'stevia' }).length, 0)
assert(ideas({ sugar: 'none' }).every(recipe => recipe.sugarGrams === 0 && !['shortbread', 'cocoa-brownie', 'yogurt-cake', 'oat-cookie'].includes(recipe.formula)))
const almost = ideas({ stock: { banana: 119, oats: 84, salt: 1, cinnamon: 1 } })[0]
assert.equal(almost.formula, 'banana-cookie')
assert(almost.pantryGap < 0.03)
assert(almost.reason.includes('Almost covered'))
const stocked = ideas({ stock: Object.fromEntries(Object.keys(ING).map(k => [k, 10000])) })[0]
assert.equal(stocked.missing.length, 0)
assert.equal(stocked.formula, 'banana-cookie')
assert.equal(stocked.bowls, 1)
const single = ideas({ sugar: 'coconut-sugar' })
const double = ideas({ sugar: 'coconut-sugar', batches: 2 })
for (const a of single) {
  const b = double.find(b => b.formula === a.formula && b.name === a.name)
  assert.equal(b.pieces, a.pieces * 2)
  assert.equal(b.sugarGrams, a.sugarGrams * 2)
  assert(Math.abs(b.kcal - a.kcal) < 0.001)
  assert(b.minutes > a.minutes)
  assert(b.steps.some(step => step.includes('Do not double')))
}
assert(!bakingIdeas({ allIng: { ...ING, vanilla: { ...ING.vanilla, name: 'Vanilla with sucralose' } } }).some(r => r.items.some(i => i.k === 'vanilla')))
useStore.getState().setBakingSetting('sugar', 'coconut-sugar')
useStore.getState().setBakingSetting('batches', 2)
useStore.getState().setBakingSetting('type', 'cookies')
assert.equal(useStore.persist.getOptions().partialize(useStore.getState()).bakingSettings.sugar, 'coconut-sugar')
const saved = memory.values().next().value
assert(saved)
useStore.setState({ bakingSettings: DEFAULT_BAKING_SETTINGS })
for (const key of memory.keys()) memory.set(key, saved)
await useStore.persist.rehydrate()
assert.deepEqual(useStore.getState().bakingSettings, { ...DEFAULT_BAKING_SETTINGS, sugar: 'coconut-sugar', batches: 2, type: 'cookies' })
console.log('Verified pantry quantities, effort ranking, sugar exclusions, double batches and preference reload.')
