import { GEN_PREFIX } from './composeDishes'
import { rotationHeld, rotationPaused } from '../lib/rotation'

const PREFIXES = { salads: `${GEN_PREFIX}salad-`, bowls: `${GEN_PREFIX}bowl-` }
export const isBatchLunchDish = key => typeof key === 'string' &&
  (key.startsWith(PREFIXES.salads) || key.startsWith(PREFIXES.bowls))

const grams = (k, grams) => ({ k, p: { grams } })
const ml = (k, ml) => ({ k, p: { ml } })
const units = (k, units) => ({ k, p: { units } })
const oil = ml('evoo', 15)
const lemon = units('lemon', 0.25)

const DRESSINGS = {
  olive: { name: 'extra virgin olive oil', items: [oil] },
  lemon: { name: 'lemon vinaigrette', items: [oil, lemon, grams('fresh-parsley', 5)] },
  dijon: { name: 'Dijon vinaigrette', items: [oil, grams('mustard', 6), ml('vinegar', 8)] },
  balsamic: { name: 'balsamic vinaigrette', items: [oil, ml('balsamic-vinegar', 10)] },
  yogurt: { name: 'lemon dill yogurt', items: [oil, grams('greek-yogurt', 40), lemon, { k: 'dill', p: {} }] },
  lime: { name: 'lime dressing', items: [oil, units('lime', 0.25)] },
  ginger: { name: 'ginger soy sauce', items: [oil, ml('soy-sauce', 10), grams('ginger', 5)] },
  tomato: { name: 'tomato cumin sauce', items: [oil, ml('passata', 60), { k: 'cumin', p: {} }] },
  paprika: { name: 'paprika lemon oil', items: [oil, lemon, { k: 'paprika', p: {} }] },
}

// Each salad has a base the planner can scale and dressings that suit its ingredients.
// Beans and grains use dry weights, as in the ingredient catalog.
const SALADS = [
  { id: 'romano-chicken', name: 'Romano bean, chicken, arugula & feta salad', dressings: ['olive', 'lemon'],
    items: [grams('romano-beans', 70), grams('chicken-breast', 95), grams('arugula', 65), grams('feta-cow', 25), grams('pumpkin-seeds', 12)] },
  { id: 'potato-chicken', name: 'Chicken, potato & green bean salad', dressings: ['dijon', 'yogurt'],
    items: [grams('potato', 250), grams('chicken-breast', 120), grams('green-beans', 110), grams('arugula', 35)] },
  { id: 'potato-egg', name: 'Egg, potato & cucumber salad', dressings: ['yogurt', 'dijon'],
    items: [grams('potato', 240), units('eggs', 2), grams('cucumber', 100), grams('arugula', 50)] },
  { id: 'potato-salmon', name: 'Salmon, potato & beet salad', dressings: ['dijon', 'yogurt'],
    items: [grams('potato', 230), grams('salmon-fillet', 115), grams('beet', 100), grams('arugula', 45)] },
  { id: 'rice-shrimp', name: 'Shrimp, rice, cucumber & pepper salad', dressings: ['lime', 'lemon'],
    items: [grams('rice', 70), grams('shrimp', 130), grams('cucumber', 85), grams('yellow-pepper', 95), grams('pumpkin-seeds', 10)] },
  { id: 'rice-chicken', name: 'Chicken, rice, tomato & carrot salad', dressings: ['dijon', 'lime'],
    items: [grams('rice', 75), grams('chicken-breast', 120), grams('carrot', 100), grams('tomato', 90)] },
  { id: 'rice-salmon', name: 'Salmon, rice & cucumber salad', dressings: ['lime', 'yogurt'],
    items: [grams('rice', 65), grams('salmon-fillet', 110), grams('cucumber', 115), grams('arugula', 45), grams('sunflower-seeds', 10)] },
  { id: 'buckwheat-egg', name: 'Buckwheat, egg, beet & walnut salad', dressings: ['balsamic', 'dijon'],
    items: [grams('buckwheat', 70), units('eggs', 2), grams('beet', 100), grams('arugula', 45), grams('walnuts', 12)] },
  { id: 'buckwheat-chicken', name: 'Chicken, buckwheat, pepper & feta salad', dressings: ['lemon', 'balsamic'],
    items: [grams('buckwheat', 70), grams('chicken-breast', 110), grams('yellow-pepper', 105), grams('arugula', 50), grams('feta-cow', 20)] },
  { id: 'chickpea-carrot', name: 'Chickpea, roasted carrot & feta salad', dressings: ['balsamic', 'lemon'],
    items: [grams('chickpeas', 75), grams('carrot', 130), grams('arugula', 45), grams('feta-cow', 30), grams('pumpkin-seeds', 12)] },
  { id: 'lentil-egg', name: 'Green lentil, egg & roast carrot salad', dressings: ['dijon', 'balsamic'],
    items: [grams('green-lentils', 70), units('eggs', 2), grams('carrot', 130), grams('arugula', 45)] },
  { id: 'white-bean-shrimp', name: 'White bean, shrimp & tomato salad', dressings: ['lemon', 'olive'],
    items: [grams('white-beans', 70), grams('shrimp', 110), grams('tomato', 120), grams('arugula', 45)] },
]

const BOWLS = [
  { id: 'chicken-broccoli-rice', name: 'Chicken, broccoli & rice bowl', dressings: ['ginger', 'lime'],
    items: [grams('rice', 85), grams('chicken-breast', 125), grams('broccoli', 125), grams('carrot', 75)] },
  { id: 'salmon-rice', name: 'Salmon, roasted pepper & rice bowl', dressings: ['ginger', 'lemon'],
    items: [grams('rice', 80), grams('salmon-fillet', 115), grams('yellow-pepper', 110), grams('carrot', 85), grams('sunflower-seeds', 10)] },
  { id: 'pork-potato', name: 'Pork tenderloin, roasted potato & green bean bowl', dressings: ['dijon', 'paprika'],
    items: [grams('potato', 280), grams('pork-tenderloin', 125), grams('green-beans', 145), grams('pumpkin-seeds', 10)] },
  { id: 'chicken-squash-potato', name: 'Chicken, roast squash & crispy potato bowl', dressings: ['yogurt', 'paprika'],
    items: [grams('potato', 250), grams('chicken-breast', 110), grams('butternut-squash', 160), grams('feta-cow', 20)] },
  { id: 'cod-potato', name: 'Cod, potato & roasted pepper bowl', dressings: ['paprika', 'lemon'],
    items: [grams('potato', 280), grams('cod', 150), grams('yellow-pepper', 115), grams('green-beans', 90)] },
  { id: 'egg-buckwheat', name: 'Egg, buckwheat & roasted broccoli bowl', dressings: ['ginger', 'dijon'],
    items: [grams('buckwheat', 85), units('eggs', 2), grams('broccoli', 120), grams('carrot', 95), grams('pumpkin-seeds', 10)] },
  { id: 'pork-buckwheat', name: 'Pork tenderloin, buckwheat & roasted beet bowl', dressings: ['balsamic', 'dijon'],
    items: [grams('buckwheat', 85), grams('pork-tenderloin', 110), grams('beet', 105), grams('carrot', 95), grams('walnuts', 10)] },
  { id: 'shrimp-rice', name: 'Shrimp, rice & sautéed green bean bowl', dressings: ['ginger', 'lime'],
    items: [grams('rice', 85), grams('shrimp', 135), grams('green-beans', 110), grams('carrot', 85)] },
  { id: 'black-bean-chicken', name: 'Black bean, chicken & roasted pepper bowl', dressings: ['lime', 'tomato'],
    items: [grams('black-beans', 85), grams('chicken-breast', 100), grams('yellow-pepper', 110), grams('carrot', 90)] },
  { id: 'chickpea-squash', name: 'Chickpea, roasted squash & feta bowl', dressings: ['tomato', 'yogurt'],
    items: [grams('chickpeas', 90), grams('butternut-squash', 150), grams('carrot', 85), grams('feta-cow', 30), grams('pumpkin-seeds', 12)] },
  { id: 'lentil-egg', name: 'Green lentil, egg & roasted carrot bowl', dressings: ['tomato', 'dijon'],
    items: [grams('green-lentils', 85), units('eggs', 2), grams('carrot', 130), grams('beet', 90)] },
  { id: 'romano-pork', name: 'Romano bean, pork tenderloin & roasted vegetable bowl', dressings: ['tomato', 'paprika'],
    items: [grams('romano-beans', 85), grams('pork-tenderloin', 100), grams('yellow-pepper', 105), grams('carrot', 95)] },
]

const RECIPES = { salads: SALADS, bowls: BOWLS }
export const isBatchLunchSource = source => Object.hasOwn(RECIPES, source)

export function batchLunchDishes(source, allIng, stock = {}) {
  const held = rotationHeld(allIng, stock)
  const dishes = {}
  for (const recipe of RECIPES[source]) {
    for (const dressingKey of recipe.dressings) {
      const dressing = DRESSINGS[dressingKey]
      const items = [...recipe.items, ...dressing.items]
      if (items.some(({ k }) => !allIng[k] || allIng[k].pend || rotationPaused(k, allIng[k], stock, held))) continue
      const key = `${PREFIXES[source]}${recipe.id}+${dressingKey}`
      dishes[key] = {
        customId: key.slice('custom-'.length),
        name: `${recipe.name} with ${dressing.name}`,
        meals: ['comida'],
        items,
      }
    }
  }
  return dishes
}
