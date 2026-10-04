// Roles de ingrediente para el generador de desayunos/meriendas (snackGen).
// Un ingrediente SIN rol no entra nunca en el generador (fallo seguro).
// Orden de resolucion: ficha del ingrediente (snackRole/snackTaste en
// ingredientOverrides o customIngredients) > esta tabla > nada. La sugerencia
// por nombre (suggestRole) solo propone, no asigna.

export const ROLES = {
  cereal:     'Cereal (oats, quinoa…)',
  flour:      'Flour',
  bread:      'Bread / bagel / pastry',
  liquid:     'Liquid (milk, kefir…)',
  yogurt:     'Yogurt / fresh cheese',
  fruit:      'Fruit',
  veg:        'Vegetable for baking',
  crunch:     'Crunch (nuts, seeds)',
  fat:        'Fat (butter, oil, nut butter)',
  sweetener:  'Sweetener',
  binder:     'Binder (egg)',
  protein:    'Protein powder',
  flavor:     'Flavor (cocoa, cinnamon…)',
  cured:      'Cold cuts',
  fiber:      'Fiber (flaxseed)',
}
export const TASTES = { sweet: 'Sweet', neutral: 'Neutral', savory: 'Savory' }

// [rol, sabor] por clave de ingrediente.
export const SNACK_ROLE = {
  'almonds': ['crunch', 'neutral'],
  'apple': ['fruit', 'sweet'],
  'applesauce': ['fruit', 'sweet'],
  'avocado': ['fruit', 'neutral'],
  'bagel-queenst': ['bread', 'neutral'],
  'banana': ['fruit', 'sweet'],
  'barley-flakes': ['cereal', 'neutral'],
  'beet': ['veg', 'sweet'],
  'blueberries': ['fruit', 'sweet'],
  'buckwheat': ['cereal', 'neutral'],
  'butter': ['fat', 'neutral'],
  'butternut-squash': ['veg', 'sweet'],
  'cantaloupe': ['fruit', 'sweet'],
  'carrot': ['veg', 'sweet'],
  'chia': ['crunch', 'neutral'],
  'chickpea-flour': ['flour', 'neutral'],
  'cinnamon': ['flavor', 'sweet'],
  'cocoa': ['flavor', 'sweet'],
  'coconut-oil': ['fat', 'neutral'],
  'cold-cuts': ['cured', 'savory'],
  'cooked-ham': ['cured', 'savory'],
  'cow-yogurt': ['yogurt', 'neutral'],
  'dark-chocolate': ['flavor', 'sweet'],
  'eggs': ['binder', 'neutral'],
  'eggs-organic': ['binder', 'neutral'],
  'evoo': ['fat', 'neutral'],
  'flour': ['flour', 'neutral'],
  'goat-yogurt': ['yogurt', 'neutral'],
  'greek-yogurt': ['yogurt', 'neutral'],
  'ground-flaxseed': ['fiber', 'neutral'],
  'hazelnuts': ['crunch', 'neutral'],
  'honey': ['sweetener', 'sweet'],
  'kamut-flakes': ['cereal', 'neutral'],
  'kefir': ['liquid', 'neutral'],
  'lemon': ['flavor', 'neutral'],
  'lime': ['flavor', 'neutral'],
  'macadamia': ['crunch', 'neutral'],
  'mandarin': ['fruit', 'sweet'],
  'nutmeg': ['flavor', 'neutral'],
  'oats': ['cereal', 'neutral'],
  'orange': ['fruit', 'sweet'],
  'peanut-butter': ['fat', 'neutral'],
  'pumpkin-seeds': ['crunch', 'neutral'],
  'quince': ['fruit', 'sweet'],
  'rice': ['cereal', 'neutral'],
  'ricotta': ['yogurt', 'neutral'],
  'salami': ['cured', 'savory'],
  'sheep-yogurt': ['yogurt', 'neutral'],
  'shredded-coconut': ['crunch', 'sweet'],
  'skim-milk': ['liquid', 'neutral'],
  'sourdough-bread': ['bread', 'neutral'],
  'sourdough-loaf': ['bread', 'neutral'],
  'strawberries': ['fruit', 'sweet'],
  'sugar': ['sweetener', 'sweet'],
  'sunflower-seeds': ['crunch', 'neutral'],
  'tahini': ['fat', 'neutral'],
  'vanilla': ['flavor', 'sweet'],
  'walnuts': ['crunch', 'neutral'],
  'water': ['liquid', 'neutral'],
  'whey-protein': ['protein', 'neutral'],
  'whole-milk': ['liquid', 'neutral'],
  'zucchini': ['veg', 'neutral'],
  'zucchini-a1': ['veg', 'neutral'],
  'zucchini-organic': ['veg', 'neutral'],
  'zucchini-ref': ['veg', 'neutral']
}

// Ingredientes que no se usan en ciertas franjas (regla del usuario: el aceite
// de coco sí en meriendas, no en desayunos).
export const NO_MEALS = { 'coconut-oil': ['desayuno'] }

export function snackRoleOf(key, allIng) {
  const ing = allIng?.[key]
  const ov = ing?.snackRole
  if (ov !== undefined) return ov ? { role: ov, taste: ing.snackTaste ?? 'neutral' } : null   // '' = a proposito sin rol
  const t = SNACK_ROLE[key]
  return t ? { role: t[0], taste: t[1] } : null
}

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Sugerencia por nombre (ingles o español). Devuelve { role, taste } o null.
const RULES = [
  [/\b(ham|salami|cold cuts|chorizo|mortadella|pepperoni|jamon|embutido|longaniza)\b/, 'cured', 'savory'],
  [/\b(nutmeg|cocoa|cacao|chocolate|cinnamon|canela|vanilla|vainilla)\b/, 'flavor', 'sweet'],
  [/\b(lemon|lime|limon)\b/, 'flavor', 'neutral'],
  [/\b(bagel|bread|toast|croissant|muffin|madalena|brioche|pita|pan|tostada)s?\b/, 'bread', 'neutral'],
  [/\b(kefir|milk|water|leche|agua)\b/, 'liquid', 'neutral'],
  [/\b(yogh?urt|skyr|ricotta|cottage|requeson|yogur)/, 'yogurt', 'neutral'],
  [/\b(oats?|quinoa|barley|kamut|buckwheat|cereal|flakes|rice|granola|avena|cebada|arroz)\b/, 'cereal', 'neutral'],
  [/\b(flour|harina|cornstarch|maicena)\b/, 'flour', 'neutral'],
  [/\b(flax|flaxseed|linaza|psyllium)\b/, 'fiber', 'neutral'],
  [/\b(applesauce|banana|apple|pear|strawberr|blueberr|raspberr|mandarin|orange|melon|cantaloupe|mango|pineapple|grape|kiwi|peach|cherry|quince|avocado|platano|manzana|fresa|arandano|naranja|compota|membrillo|aguacate)/, 'fruit', 'sweet'],
  [/\b(honey|sugar|syrup|maple|miel|azucar|sirope)\b/, 'sweetener', 'sweet'],
  [/\b(walnut|almond|hazelnut|pistachio|peanut(?! butter)|macadamia|cashew|seeds?|chia|nuez|nueces|almendra|avellana|semilla|coconut)/, 'crunch', 'neutral'],
  [/\b(butter|oil|tahini|peanut butter|nut butter|mantequilla|aceite)\b/, 'fat', 'neutral'],
  [/\beggs?\b|\bhuevos?\b/, 'binder', 'neutral'],
  [/\b(whey|protein powder)\b/, 'protein', 'neutral'],
  [/\b(carrot|zucchini|courgette|squash|pumpkin|beet|zanahoria|calabacin|calabaza|remolacha)\b/, 'veg', 'sweet'],
]
export function suggestRole(ing) {
  const n = norm(ing?.name)
  for (const [re, role, taste] of RULES) if (re.test(n)) return { role, taste }
  return null
}

// Ingredientes tuyos (creados en la app) sin rol de merienda.
export function customWithoutRole(allIng) {
  return Object.entries(allIng)
    .filter(([k, v]) => v.isCustom && !snackRoleOf(k, allIng))
    .map(([k, v]) => ({ key: k, name: v.name, suggestion: suggestRole(v) }))
}
