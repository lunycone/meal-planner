// ─── Etiquetas de ingredientes ──────────────────────────────────────────────
// Todas las reglas (digestión, carne roja en la cena, verdura, qué base se
// escala, qué platos comparten almidón…) leen ETIQUETAS, no el nombre interno.
// Los de fábrica traen las suyas aquí; los tuyos se deducen del nombre y la
// categoría (en inglés o en español) y se pueden corregir en su ficha
// (ingredientOverrides[key].tags / customIngredients[key].tags).

export const TAGS = ['veg', 'fruit', 'starch', 'legume', 'fructan', 'insoluble', 'red-meat', 'white-meat', 'fish', 'seafood', 'egg', 'dairy', 'nut']
export const TAG_LABEL = {
  veg: 'Vegetable', fruit: 'Fruit', starch: 'Starch (scalable base)', legume: 'Legume', fructan: 'Onion / garlic',
  insoluble: 'Insoluble fiber', 'red-meat': 'Red meat', 'white-meat': 'White meat', fish: 'Fish', seafood: 'Seafood',
  egg: 'Egg', dairy: 'Dairy', nut: 'Nuts & seeds',
}
export const TAG_HINT = {
  starch: 'The part that grows or shrinks to hit each person’s kcal',
  fructan: 'Counts for the once-a-day onion/garlic rule',
  legume: 'Counts for the once-a-day legume rule',
  insoluble: 'Counts for the once-a-day insoluble fiber rule',
  'red-meat': 'Kept out of dinners',
}

const T = (...t) => t
export const DEFAULT_TAGS = {
  potato: T('starch'), rice: T('starch'), pasta: T('starch'), 'frozen-corn': T('starch'), artichoke: T('veg', 'fructan'),
  'sourdough-bread': T('starch'), 'bagel-queenst': T('starch'), oats: T('starch'), 'barley-flakes': T('starch'), 'kamut-flakes': T('starch'),
  buckwheat: T('starch'), flour: T('starch'), 'chickpea-flour': T('legume'), 'masa-harina': T('starch'), sugar: T(),
  'red-lentils': T('legume', 'starch'), 'green-lentils': T('legume', 'starch'), chickpeas: T('legume', 'starch'), 'black-beans': T('legume', 'starch'),
  'white-beans': T('legume', 'starch'), 'kidney-beans': T('legume', 'starch'), 'romano-beans': T('legume', 'starch'), 'cranberry-beans': T('legume', 'starch'),
  'whole-milk': T('dairy'), 'skim-milk': T('dairy'), 'whey-protein': T('dairy'), avocado: T('fruit'),
  passata: T('veg'), 'peeled-tomatoes': T('veg'), 'yellow-onion': T('veg', 'fructan'), 'red-onion': T('veg', 'fructan'), beet: T('veg'),
  lettuce: T('veg'), arugula: T('veg'), carrot: T('veg'), 'frozen-spinach': T('veg'), 'frozen-peas': T('veg', 'legume'), leek: T('veg', 'fructan'),
  tomato: T('veg'), cucumber: T('veg'), 'zucchini-a1': T('veg'), 'zucchini-organic': T('veg'), 'zucchini-ref': T('veg'), zucchini: T('veg'),
  asparagus: T('veg'), broccoli: T('veg', 'insoluble'), 'green-pepper': T('veg'), 'yellow-pepper': T('veg'), jalapeno: T('veg'), 'green-beans': T('veg'),
  blueberries: T('fruit'), strawberries: T('fruit'), banana: T('fruit'), mandarin: T('fruit'), orange: T('fruit'), cantaloupe: T('fruit'),
  hazelnuts: T('nut', 'insoluble'), macadamia: T('nut', 'insoluble'), 'pumpkin-seeds': T('nut', 'insoluble'), chia: T('nut', 'insoluble'),
  'sunflower-seeds': T('nut', 'insoluble'), almonds: T('nut', 'insoluble'), 'shredded-coconut': T('nut', 'insoluble'),
  'feta-cow': T('dairy'), 'feta-sheep': T('dairy'), 'goat-cheese': T('dairy'), ricotta: T('dairy'), cheddar: T('dairy'),
  'goat-yogurt': T('dairy'), 'cow-yogurt': T('dairy'), 'greek-yogurt': T('dairy'), 'sheep-yogurt': T('dairy'), kefir: T('dairy'),
  'sour-cream': T('dairy'), butter: T('dairy'), nachos: T(),
  lime: T('fruit'), lemon: T('fruit'), celery: T('veg'), 'sourdough-loaf': T('starch'), mushrooms: T('veg'),
  mussels: T('seafood'), octopus: T('seafood'), sausages: T('red-meat'), bacon: T('red-meat'), 'ground-pork': T('red-meat'),
  'cold-cuts': T('red-meat'), 'cooked-ham': T('red-meat'), 'smoked-salmon': T('fish'), 'ham-hock': T('red-meat'),
  'pork-ribs': T('red-meat'), 'pork-loin': T('red-meat'), 'pork-tenderloin': T('white-meat'), 'pork-rib-rack': T('red-meat'),
  'pork-loin-costco': T('red-meat'), 'pork-tenderloin-costco': T('white-meat'), 'pork-shoulder-costco': T('red-meat'),
  'pork-back-ribs-costco': T('red-meat'), 'pork-side-ribs-costco': T('red-meat'), 'beef-liver': T('red-meat'), cod: T('fish'),
  lamb: T('red-meat'), 'ground-beef': T('red-meat'), 'stew-beef': T('red-meat'),
  'chicken-leg-generic': T('white-meat'), 'turkey-drumstick': T('white-meat'), 'chicken-leg': T('white-meat'), 'chicken-drumstick': T('white-meat'),
  'chicken-thigh-foodland': T('white-meat'), 'chicken-thigh-beretta': T('white-meat'), 'chicken-drumstick-farmboy': T('white-meat'),
  'chicken-thigh-farmboy': T('white-meat'), 'chicken-thigh-boneless': T('white-meat'), 'chicken-breast': T('white-meat'),
  'chicken-breast-organic': T('white-meat'), 'chicken-drumstick-generic': T('white-meat'), 'chicken-drumstick-organic': T('white-meat'),
  'chicken-wings': T('white-meat'), 'chicken-wings-organic': T('white-meat'), 'whole-chicken-organic': T('white-meat'),
  cabbage: T('veg', 'insoluble'), kale: T('veg', 'insoluble'), 'hot-dog-buns': T('starch'), 'fresh-parsley': T('veg'),
  garlic: T('fructan'), 'black-pepper': T(), paprika: T(), cumin: T(), salt: T(),
  oregano: T(), 'oregano-greek': T(), thyme: T(), mint: T(), basil: T(), dill: T(), cilantro: T(), rosemary: T(), tarragon: T(),
  saffron: T(), nutmeg: T(), zaatar: T(), turmeric: T(), 'cajun-seasoning': T(), chipotle: T(), ginger: T(),
  'ravioli-spinach': T('starch', 'dairy'), 'ravioli-burrata': T('starch', 'dairy'), pepperoni: T('red-meat'), 'lasagna-sheets': T('starch'),
  'pasta-dimartino': T('starch'), striploin: T('red-meat'), shrimp: T('seafood'), 'brioche-buns': T('starch'), 'heavy-cream': T('dairy'),
  'salmon-fillet': T('fish'), arborio: T('starch'), gnocchi: T('starch'), mascarpone: T('dairy'), ladyfingers: T(), 'cream-cheese': T('dairy'),
  'digestive-biscuits': T(), espresso: T(), yeast: T(), sage: T(),
  parmesan: T('dairy'), mozzarella: T('dairy'), gouda: T('dairy'), 'balsamic-vinegar': T(), worcestershire: T(), 'coconut-milk': T(), 'soy-sauce': T(), 'butternut-squash': T('veg'), radishes: T('veg'), apple: T('fruit'), applesauce: T('fruit'), quince: T('fruit'),
  eggs: T('egg'), 'eggs-organic': T('egg'), 'canned-tomatoes': T('veg'), honey: T(),
  'mackerel-half-can': T('fish'), 'sardines-half-can': T('fish'), 'sardines-quarter-can': T('fish'),
}

// Deducción para ingredientes nuevos (nombre en inglés o español).
const RULES = [
  [/lentil|chickpea|\bbeans?\b|garbanzo|lenteja|alubia|jud[ií]a|frijol|edamame|soy(?!\s*sauce)/i, ['legume', 'starch']],
  [/onion|garlic|leek|shallot|scallion|artichoke|cebolla|\bajo\b|puerro|chalota|alcachofa/i, ['fructan', 'veg']],
  [/tenderloin|solomillo/i, ['white-meat']],
  [/beef|pork|lamb|veal|bacon|\bham\b|sausage|chorizo|salami|liver|steak|ternera|cerdo|cordero|vaca|buey|salchicha|jam[oó]n|h[ií]gado/i, ['red-meat']],
  [/chicken|turkey|duck|pollo|pavo|pato/i, ['white-meat']],
  [/\bcod\b|salmon|tuna|sardine|mackerel|trout|hake|tilapia|haddock|pollock|fish|bacalao|at[uú]n|sardina|caballa|merluza|pescado|trucha/i, ['fish']],
  [/shrimp|prawn|mussel|octopus|squid|clam|scallop|crab|lobster|gamba|langostino|mejill[oó]n|pulpo|calamar|almeja|marisco/i, ['seafood']],
  [/\beggs?\b|huevo/i, ['egg']],
  [/rice|pasta|potato|oat|bread|flour|quinoa|couscous|noodle|tortilla|bagel|\bbun|arroz|patata|avena|\bpan\b|harina|fideo/i, ['starch']],
  [/yogh?urt|milk|cheese|kefir|cream|butter|yogur|leche|queso|nata|mantequilla/i, ['dairy']],
  [/\bnuts?\b|almond|hazelnut|walnut|pecan|cashew|pistachio|seed|avellana|almendra|nuez|pipa|semilla/i, ['nut', 'insoluble']],
  [/broccoli|kale|cabbage|brussels|cauliflower|br[oó]coli|col\b|coliflor/i, ['veg', 'insoluble']],
  [/berr|banana|apple|pear|orange|mandarin|melon|grape|mango|peach|plum|kiwi|pineapple|fruit|fresa|pl[aá]tano|manzana|pera|naranja|uva|mel[oó]n|fruta/i, ['fruit']],
  [/carrot|zucchini|squash|pepper|tomato|spinach|lettuce|cucumber|celery|mushroom|asparagus|eggplant|pumpkin|beet|radish|zanahoria|calabac|calabaza|pimiento|tomate|espinaca|lechuga|pepino|apio|seta|champi|esp[aá]rrago|berenjena/i, ['veg']],
]

export function guessTags(key, ing) {
  const text = `${ing?.name ?? ''} ${key ?? ''}`
  const out = new Set()
  for (const [re, tags] of RULES) if (re.test(text)) tags.forEach(t => out.add(t))
  if (out.has('white-meat')) out.delete('red-meat') // «pork tenderloin» es blanca
  if (ing?.cat === 'legumbre') { out.add('legume'); out.add('starch') }
  if (ing?.cat === 'lacteo') out.add('dairy')
  if (ing?.cat === 'fresco' && !['fruit', 'nut', 'dairy'].some(t => out.has(t))) out.add('veg')
  return [...out]
}

/** Etiquetas de un ingrediente (las guardadas, las de fábrica o las deducidas). */
export function tagsOf(key, allIng) {
  const ing = allIng?.[key]
  if (Array.isArray(ing?.tags)) return ing.tags
  return DEFAULT_TAGS[key] ?? guessTags(key, ing)
}
export function hasTag(key, tag, allIng) { return tagsOf(key, allIng).includes(tag) }

// Familia del almidón, para no repetir base en comida y cena el mismo día
// («no soportamos patata en comida y cena»).
const FAMILY = [
  [/potato|patata/i, 'potato'], [/rice|arroz/i, 'rice'], [/pasta|noodle|fideo/i, 'pasta'],
  [/bread|bagel|bun|loaf|flour|toast|harina|\bpan\b/i, 'bread'], [/corn|masa|ma[ií]z|tortilla/i, 'corn'],
  [/oat|barley|kamut|buckwheat|avena|cebada/i, 'grain'],
]
export function starchFamily(key, allIng) {
  const ing = allIng?.[key]
  const tags = tagsOf(key, allIng)
  if (!tags.includes('starch')) return null
  if (tags.includes('legume')) return 'legume'
  const text = `${key} ${ing?.name ?? ''}`
  for (const [re, fam] of FAMILY) if (re.test(text)) return fam
  return key
}
