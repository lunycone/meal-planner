import { GEN_PREFIX } from './composeDishes'
import { rotationHeld, rotationPaused } from '../lib/rotation'

const SALAD_PREFIX = `${GEN_PREFIX}salad-`
export const isGeneratedSalad = key => key?.startsWith(SALAD_PREFIX) ?? false

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

export function saladDishes(allIng, stock = {}) {
  const held = rotationHeld(allIng, stock)
  const dishes = {}
  for (const salad of SALADS) {
    for (const dressingKey of salad.dressings) {
      const dressing = DRESSINGS[dressingKey]
      const items = [...salad.items, ...dressing.items]
      if (items.some(({ k }) => !allIng[k] || allIng[k].pend || rotationPaused(k, allIng[k], stock, held))) continue
      const key = `${SALAD_PREFIX}${salad.id}+${dressingKey}`
      dishes[key] = {
        customId: key.slice('custom-'.length),
        name: `${salad.name} with ${dressing.name}`,
        meals: ['comida'],
        items,
      }
    }
  }
  return dishes
}
