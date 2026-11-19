import assert from 'node:assert/strict'
import { breakfastIdeas, diverseBreakfasts } from '../src/engine/breakfastIdeas'
import { glycemicCheck } from '../src/engine/calc'
import useStore, { selectAllIng, selectAllCombos } from '../src/store/useStore'
const memory = new Map()
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
const state = useStore.getState(), allIng = selectAllIng(state), allCombos = selectAllCombos(state)
const persons = state.profiles
const args = { allIng, allCombos, persons, days: ['jue'], seed: 19 }
const start = performance.now()
const ideas = breakfastIdeas(args)
console.log('Ideas:', ideas.length, 'elapsed ms:', Math.round(performance.now() - start), 'families:', [...new Set(ideas.map(i => i.family))])
assert(ideas.length >= 3)
assert(ideas.every(idea => Object.keys(idea.recipes).length === persons.length))
assert(ideas.every(idea => Object.values(idea.recipes).every(r => r.recipeSteps.length && r.items.every(i => i.k !== 'tahini'))))
const first = diverseBreakfasts(ideas), second = diverseBreakfasts(ideas, first.map(r => r.id))
assert(first.length === 3 && second.length > 0)
assert(second.every(r => !first.some(f => f.id === r.id)))
assert.equal(new Set(ideas.map(r => r.id)).size, ideas.length)
const both = breakfastIdeas({ ...args, persons: persons.slice(0, 2), days: ['lun', 'mar', 'mie', 'jue', 'vie'] })
assert(both.length && both.every(r => Object.keys(r.recipes).length === 2))
const covered = breakfastIdeas({ ...args, stock: Object.fromEntries(Object.keys(allIng).map(k => [k, 100000])) })
assert(covered.length && covered.every(r => r.coverage === 1))
const maria = persons.find(p => p.id === 'maria')
const solo = breakfastIdeas({ ...args, persons: [maria] })
assert(solo.length)
assert(solo.every(r => Object.keys(r.recipes).join() === maria.id))
const green = breakfastIdeas({ ...args, persons: [maria], onlyGreen: true })
assert(green.every(r => glycemicCheck(r.recipes[maria.id], allIng, 'desayuno').status === 'within'))
assert.deepEqual(breakfastIdeas({ ...args, allIng: {} }), [])
// Scope and person selection preserve everyone else's breakfasts and all other meals.
const wk = '2026-W47', old = { type: 'desayuno', recipeKey: 'existing' }
useStore.setState({ weekPlan: { [wk]: { 'jue-desayuno': old, 'vie-desayuno': old, 'jue-comida': old } } })
let writes = 0
const unsubscribe = useStore.subscribe(() => writes++)
state.applyBreakfastIdea(wk, ['jue'], solo[0].recipes, persons.map(p => p.id))
unsubscribe()
assert.equal(writes, 1)
let plan = useStore.getState().weekPlan[wk]
assert.deepEqual(plan['jue-desayuno'].byPerson.julio, old)
assert.deepEqual(plan['vie-desayuno'], old)
assert.deepEqual(plan['jue-comida'], old)
const recipeKey = plan['jue-desayuno'].byPerson.maria.recipeKey
assert(selectAllCombos(useStore.getState())[recipeKey].recipeSteps.length)
const count = useStore.getState().customCombos.length
state.applyBreakfastIdea(wk, ['jue', 'vie'], solo[0].recipes, persons.map(p => p.id))
assert.equal(useStore.getState().customCombos.length, count)
plan = useStore.getState().weekPlan[wk]
assert.equal(plan['vie-desayuno'].byPerson.maria.recipeKey, recipeKey)
assert.deepEqual(plan['vie-desayuno'].byPerson.julio, old)
console.log('Verified distinct ideas, solo/both portions, PCOS filter, recipe instructions, atomic apply and preservation of other meals.')
