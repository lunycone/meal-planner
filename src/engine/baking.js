import { comboAgg, ingCost } from './calc'
import { needAmount } from '../lib/needs'
import { packOf } from '../lib/packs'

export const BAKING_TYPES = [
  { value: 'any', label: 'Surprise me' }, { value: 'cookies', label: 'Cookies' },
  { value: 'cakes', label: 'Cakes & loaves' }, { value: 'muffins', label: 'Muffins' },
  { value: 'bars', label: 'Brownies & bars' }, { value: 'crumble', label: 'Crumbles' },
]
export const BAKING_SUGARS = [
  { value: 'none', label: 'No added sugar' }, { value: 'organic-white-sugar', label: 'Organic white' },
  { value: 'coconut-sugar', label: 'Coconut' },
]
const TEMP = '175°C / 350°F'
const SWEETENERS = /\b(?:stevia|erythritol|eritritol|xylitol|xilitol|sucralose|sucralosa|allulose|alulosa|aspartame|aspartamo|monk fruit|saccharin|sacarina|acesulfame|maltitol|sorbitol|sweetener|edulcorante)\b/i
const g = (k, grams) => ({ k, p: { grams } })
const egg = { k: 'eggs', p: { units: 1 } }
const spice = k => ({ k, p: {} })
const flavor = (name, ...items) => ({ name, items })
const CINNAMON = flavor('cinnamon', spice('cinnamon'))
const VANILLA = flavor('vanilla', spice('vanilla'))
const WALNUT = flavor('cinnamon & walnut', spice('cinnamon'), g('walnuts', 25))
const ALMOND = flavor('vanilla & almond', spice('vanilla'), g('almonds', 25))
const BLUEBERRY = flavor('blueberry', g('blueberries', 60))

// Amounts are per small batch. Each dough sets its own sugar range and method.
// Fruit-based recipes can run without added sugar. Shortbread and brownies keep
// some sugar for texture, so they are never offered in the no-added-sugar mode.
const FORMULAS = [
  {
    id: 'shortbread', type: 'cookies', name: 'shortbread cookies', texture: 'Crumbly, good for dunking',
    pieces: 10, active: 10, wait: 15, bake: [15, 19], sugar: [25, 40],
    base: [g('flour', 120), g('butter', 80), spice('salt')], flavors: [VANILLA, CINNAMON, ALMOND],
    prep: 'Cream softened butter and sugar. Mix in the flavor and salt, then work in the flour just until the dough holds together. Chill for 15 minutes.',
    shape: 'Roll about 7 mm thick, cut into even pieces and place on a parchment-lined tray.',
    done: 'The edges should be set and just starting to color. Cool completely on the tray.',
  },
  {
    id: 'oat-cookie', type: 'cookies', name: 'oat cookies', texture: 'Thin, crisp edges',
    pieces: 10, active: 10, bake: [13, 17], sugar: [24, 40],
    base: [g('oats', 65), g('flour', 55), g('butter', 55), egg, spice('salt')], flavors: [CINNAMON, VANILLA, WALNUT],
    prep: 'Whisk melted, cooled butter with sugar and egg. Fold in the oats, flour, salt and flavor.',
    shape: 'Scoop onto a lined tray and flatten each cookie to about 6 mm.',
    done: 'Bake until the edges feel set. Cool on the tray to firm up.',
  },
  {
    id: 'banana-cookie', type: 'cookies', name: 'banana oat cookies', texture: 'Soft and chewy',
    pieces: 8, active: 8, bake: [15, 19], sugar: [0, 15],
    base: [g('banana', 120), g('oats', 85), spice('salt')], flavors: [CINNAMON, VANILLA, WALNUT],
    prep: 'Mash the peeled banana well. Stir in everything else and let the oats absorb the moisture for a few minutes.',
    shape: 'Scoop onto a lined tray and flatten each cookie to about 1 cm.',
    done: 'The tops should feel set and the undersides lightly toasted. Cool before lifting.',
  },
  {
    id: 'banana-loaf', type: 'cakes', name: 'banana loaf', texture: 'Moist and sliceable',
    pieces: 8, active: 12, bake: [34, 44], sugar: [0, 35], vessel: 'a lined 18 × 9 cm loaf tin per batch',
    base: [g('banana', 200), g('flour', 150), g('butter', 40), egg, g('baking-powder', 6), spice('salt')], flavors: [CINNAMON, VANILLA, WALNUT, BLUEBERRY],
    prep: 'Mash peeled banana and whisk with egg, melted cooled butter and any sugar. Stir the baking powder and salt into the flour. Fold the flour mixture and flavor into the wet mixture just until combined.',
    done: 'A skewer in the center should come out free of wet batter. Cool before slicing.',
  },
  {
    id: 'yogurt-cake', type: 'cakes', name: 'yogurt cake', texture: 'Tender, lightly sweet',
    pieces: 8, active: 12, bake: [28, 36], sugar: [45, 70], vessel: 'a lined 18 cm round tin per batch',
    base: [g('flour', 150), g('greek-yogurt', 125), g('butter', 55), egg, g('baking-powder', 6), spice('salt')], flavors: [VANILLA, BLUEBERRY],
    prep: 'Whisk softened butter with sugar, then beat in egg and yogurt. Whisk the flour, baking powder and salt separately. Fold both mixtures together, then add the flavor.',
    done: 'The center should spring back and a skewer should come out free of wet batter.',
  },
  {
    id: 'apple-muffin', type: 'muffins', name: 'apple oat muffins', texture: 'Soft and moist',
    pieces: 6, active: 12, bake: [19, 24], sugar: [0, 30], vessel: 'six lined muffin cups per batch',
    base: [g('applesauce', 130), g('flour', 90), g('oats', 45), g('butter', 35), egg, g('baking-powder', 5), spice('salt')], flavors: [CINNAMON, WALNUT, BLUEBERRY],
    prep: 'Whisk the unsweetened applesauce, egg, melted cooled butter and any sugar. Combine flour, oats, baking powder and salt. Fold wet and dry together with the flavor just until mixed.',
    done: 'A skewer should come out free of wet batter. Let the muffins rest in the tin for 5 minutes.',
  },
  {
    id: 'cocoa-brownie', type: 'bars', name: 'cocoa brownies', texture: 'Dense, bittersweet',
    pieces: 8, active: 12, bake: [18, 24], sugar: [65, 95], vessel: 'a lined 15 cm square tin per batch',
    base: [g('flour', 45), g('cocoa', 24), g('butter', 65), egg, spice('salt')], flavors: [VANILLA, ALMOND],
    prep: 'Stir melted butter, sugar and cocoa together. Let cool slightly, whisk in the egg and salt, then fold in flour and the flavor.',
    done: 'The edges should be set and a skewer should pick up moist crumbs without wet batter. Cool before cutting.',
  },
  {
    id: 'oat-bar', type: 'bars', name: 'banana oat bars', texture: 'Soft and easy to portion',
    pieces: 8, active: 10, bake: [22, 28], sugar: [0, 25], vessel: 'a lined 18 cm square tin per batch',
    base: [g('banana', 200), g('oats', 145), g('butter', 35), egg, spice('salt')], flavors: [CINNAMON, WALNUT, ALMOND],
    prep: 'Mash peeled banana and stir in melted cooled butter, egg and any sugar. Mix in the oats, flavor and salt.',
    done: 'Bake until the middle feels set. Cool completely before slicing.',
  },
  {
    id: 'apple-crumble', type: 'crumble', name: 'apple crumble', texture: 'Tender fruit with a crisp topping',
    pieces: 4, active: 12, bake: [28, 38], sugar: [0, 30], vessel: 'a shallow 16 cm baking dish per batch',
    base: [g('apple', 350), g('oats', 55), g('flour', 30), g('butter', 45), spice('salt')], flavors: [CINNAMON, WALNUT, VANILLA],
    prep: 'Core and slice the apples. Toss with half the flavor. Rub cold butter into the flour, oats, salt, any sugar and the remaining flavor until crumbly.',
    shape: 'Put the apples in the baking dish and scatter the topping evenly over them.',
    done: 'Bake until the apples are tender and bubbling and the topping feels crisp.',
  },
]

function scaleItems(items, factor) {
  return items.map(({ k, p }) => ({
    k, p: Object.fromEntries(Object.entries(p).map(([unit, quantity]) => [unit, Math.round(quantity * factor * 1e4) / 1e4])),
  }))
}

export function bakingPortion(recipe) {
  return scaleItems(recipe.items, 1 / recipe.pieces)
}

export function bakingIdeas({ allIng, stock = {}, type = 'any', sugar = 'organic-white-sugar', sweetness = 'light', batches = 1 }) {
  if (!BAKING_SUGARS.some(option => option.value === sugar) || ![1, 2].includes(batches)) return []
  const ideas = []
  for (const formula of FORMULAS) {
    if (type !== 'any' && formula.type !== type) continue
    if (sugar === 'none' && formula.sugar[0] > 0) continue
    const light = formula.sugar[0] || Math.ceil(formula.sugar[1] / 2)
    const sugarGrams = sugar === 'none' ? 0 : (sweetness === 'classic' ? formula.sugar[1] : light) * batches
    for (const profile of formula.flavors) {
      const items = scaleItems([...formula.base, ...profile.items], batches)
      if (sugarGrams) items.push(g(sugar, sugarGrams))
      if (items.some(({ k }) => !allIng[k] || allIng[k].pend || SWEETENERS.test(allIng[k].name))) continue
      const pieces = formula.pieces * batches
      const missing = items.flatMap(({ k, p }) => {
        const ing = allIng[k]
        const pack = packOf(ing)
        const dim = pack?.dim ?? (p.grams != null ? 'g' : p.units != null ? 'unit' : null)
        const quantity = dim ? needAmount({ qtyByUnit: p }, ing, { dim }) : batches
        const shortfall = quantity - (stock[k] ?? 0)
        return stock[k] == null || shortfall > 0 ? [{ k, dim, shortfall }] : []
      })
      const unpriced = items.filter(({ k, p }) => ingCost(k, p, allIng) === 0 && allIng[k].flat !== 0).map(({ k }) => k)
      const name = `${profile.name[0].toUpperCase()}${profile.name.slice(1)} ${formula.name}`
      const pan = formula.vessel ? `Use ${formula.vessel}. ` : ''
      const steps = [
        `Preheat to ${TEMP}. ${pan}`.trim(),
        formula.prep,
        formula.shape ?? 'Divide the batter evenly among the prepared pans or cups.',
        `Bake for ${formula.bake.join('–')} minutes. ${formula.done}`,
        ...(sugarGrams && sugar === 'coconut-sugar' ? ['Coconut sugar darkens the dough. Use the texture cue to judge doneness.'] : []),
      ]
      const { kcal, cost } = comboAgg({ items: scaleItems(items, 1 / batches) }, allIng)
      ideas.push({
        id: [formula.id, profile.name, sugarGrams ? sugar : 'none', sugarGrams, batches].join('|'),
        formula: formula.id,
        name, items, steps, pieces, batches, sugarGrams, kcal: kcal / formula.pieces, cost: cost * batches, missing, unpriced,
        texture: formula.texture, minutes: formula.active + formula.bake[1] + (formula.wait ?? 0),
      })
    }
  }
  return ideas.sort((a, b) => a.missing.length - b.missing.length || a.minutes - b.minutes || a.cost - b.cost)
}
