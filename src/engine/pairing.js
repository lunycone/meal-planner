// ─── Qué combina con qué ────────────────────────────────────────────────────
// Cada ingrediente se reduce a un CONCEPTO (chicken, rice, tomato, oregano…)
// leyendo su nombre, así que los que añadas entran solos. Con eso:
//   · EJEMPLOS: platos típicos de cada país escritos como conceptos. No se
//     copian: el algoritmo aprende de ellos qué parejas van juntas en cada
//     cocina (pollo+pimentón en España, cerdo+yogur solo en Grecia…) y cuánto
//     se parece un plato compuesto a un clásico (para darle nombre).
//   · CHOQUES: parejas que no pegan (pescado+queso, canela+soja…) salvo que
//     algún ejemplo de ESE país las use.
//   · Lo que aprende de ti: «Not this one» en un plato compuesto resta a sus
//     parejas (p. ej. cerdo+yogur) y cargar un plato les suma (pairPrefs).

const SKIP = /black-pepper|\bsalt\b|\bevoo\b|olive-oil|\bwater\b/
const CONCEPTS = [
  ['balsamic', /balsamic/], ['vinegar', /vinegar/], ['coconut', /coconut/], ['soy', /soy.?sauce|\bsoy\b/],
  // proteínas
  ['chicken', /chicken|pollo/], ['turkey', /turkey|pavo/], ['chorizo', /chorizo/], ['sausage', /sausage|bratwurst/],
  ['pork', /pork|\bham\b|ribs|bacon|cerdo/], ['beef', /beef|veal|steak|ternera/], ['lamb', /lamb|cordero/],
  ['salmon', /salmon/], ['tuna', /tuna|atun/], ['sardine', /sardine|mackerel/], ['cod', /\bcod\b|hake|haddock|pollock|tilapia|bacalao|fish/],
  ['mussel', /mussel|clam/], ['octopus', /octopus|squid|pulpo/], ['shrimp', /shrimp|prawn|gamba/], ['egg', /\beggs?\b|huevo/],
  // bases
  ['green-bean', /green-bean|green bean|haricot/], ['chickpea', /chickpea|garbanzo/], ['lentil', /lentil/],
  ['bean', /\bbeans?\b|pinto|romano|cranberry-bean|kidney|cannellini|-beans/], ['rice', /\brice\b|arroz/],
  ['potato', /potato|patata/], ['pasta', /pasta|noodle|spaghetti|penne|orzo|udon|soba|macaroni/],
  ['corn', /masa|tortilla|\bcorn\b/], ['grain', /bulgur|couscous|quinoa|freekeh/], ['bread', /bread|loaf|bagel/],
  // verduras
  ['squash', /squash|pumpkin/], ['tomato', /tomato|passata/], ['jalapeno', /jalape/],
  ['pepper', /pepper|pimiento/], ['zucchini', /zucchini|courgette|calabac/], ['eggplant', /eggplant|aubergine/],
  ['spinach', /spinach/], ['kale', /kale/], ['broccoli', /broccoli/], ['cauliflower', /cauliflower/], ['cabbage', /cabbage|coleslaw/],
  ['carrot', /carrot/], ['pea', /\bpeas?\b/], ['mushroom', /mushroom|champi/], ['onion', /onion|shallot/], ['leek', /leek/],
  ['garlic', /garlic/], ['cucumber', /cucumber/], ['celery', /celery/], ['artichoke', /artichoke/], ['asparagus', /asparagus/],
  ['beet', /\bbeet/], ['avocado', /avocado/], ['apple', /apple/],
  // condimentos
  ['paprika', /paprika|pimenton/], ['saffron', /saffron/], ['cumin', /cumin/], ['cinnamon', /cinnamon/], ['turmeric', /turmeric/],
  ['ginger', /ginger/], ['curry', /curry|garam/], ['chipotle', /chipotle|chili|chile|piri/], ['cajun', /cajun/], ['taco', /taco/],
  ['zaatar', /za.?atar/], ['oregano', /oregano/], ['thyme', /thyme/], ['rosemary', /rosemary/], ['basil', /basil/], ['dill', /\bdill/],
  ['mint', /\bmint\b/], ['cilantro', /cilantro|coriander/], ['parsley', /parsley/], ['bay', /\bbay\b/], ['tarragon', /tarragon/],
  ['nutmeg', /nutmeg/], ['sesame', /sesame/], ['tahini', /tahini/], ['pesto', /pesto/], ['lemon', /lemon/], ['lime', /\blime\b/],
  ['wine', /wine/], ['mustard', /mustard|dijon/], ['honey', /honey/],
  ['ketchup', /ketchup/], ['worcestershire', /worcester/], ['yogurt', /yogh?urt|kefir/], ['feta', /feta/], ['parmesan', /parmesan|parmigiano/],
  ['mozzarella', /mozzarella/], ['ricotta', /ricotta/], ['cheese', /cheese|cheddar|gouda|gruy|emmental|raclette/],
  ['butter', /\bbutter\b/], ['cream', /cream|crème|creme/], ['milk', /\bmilk\b/],
]
const KIND = {}
;['chicken', 'turkey', 'chorizo', 'sausage', 'pork', 'beef', 'lamb', 'salmon', 'tuna', 'sardine', 'cod', 'mussel', 'octopus', 'shrimp', 'egg'].forEach(c => { KIND[c] = 'P' })
;['chickpea', 'lentil', 'bean', 'rice', 'potato', 'pasta', 'corn', 'grain', 'bread'].forEach(c => { KIND[c] = 'B' })
;['green-bean', 'squash', 'tomato', 'jalapeno', 'pepper', 'zucchini', 'eggplant', 'spinach', 'kale', 'broccoli', 'cauliflower', 'cabbage', 'carrot', 'pea', 'mushroom', 'onion', 'leek', 'cucumber', 'celery', 'artichoke', 'asparagus', 'beet', 'avocado', 'apple'].forEach(c => { KIND[c] = 'V' })

const cache = new Map()
/** Concepto de un ingrediente (o null si es sal, aceite, agua…). */
export function conceptOf(key, ing) {
  const t = `${key} ${ing?.name ?? ''}`.toLowerCase()
  if (cache.has(t)) return cache.get(t)
  let c = null
  if (!SKIP.test(t)) for (const [name, re] of CONCEPTS) if (re.test(t)) { c = name; break }
  cache.set(t, c)
  return c
}
export const kindOfConcept = c => KIND[c] ?? 'F'
export const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)

// Platos típicos por país, como conceptos. Son ejemplos para aprender, no recetas.
const E = (n, c) => ({ n, c: c.split(' ') })
export const EXAMPLES = {
  es: [
    E('Paella', 'chicken rice pepper tomato paprika saffron garlic green-bean'), E('Spanish omelette', 'potato egg onion'),
    E('Lentejas', 'lentil chorizo carrot paprika bay garlic'), E('Garbanzos con espinacas', 'chickpea spinach cumin paprika garlic'),
    E('Bacalao a la vizcaína', 'cod potato pepper garlic parsley'), E('Pulpo a la gallega', 'octopus potato paprika'),
    E('Pollo al ajillo', 'chicken garlic wine parsley potato'), E('Fabada', 'bean chorizo pepper paprika'),
    E('Potaje de bacalao', 'cod chickpea spinach garlic'), E('Arroz con cerdo', 'pork pepper tomato garlic rice paprika'),
    E('Pisto con huevo', 'egg pepper tomato zucchini onion'), E('Mejillones a la marinera', 'mussel tomato onion wine garlic'),
    E('Patatas a la riojana', 'potato chorizo pepper paprika bay'), E('Pollo al chilindrón', 'chicken pepper tomato onion paprika'),
  ],
  fr: [
    E('Coq au vin', 'chicken wine mushroom onion thyme bay carrot'), E('Boeuf bourguignon', 'beef carrot wine thyme onion potato mushroom'),
    E('Poulet à la moutarde', 'chicken mustard cream potato thyme'), E('Petit salé aux lentilles', 'pork lentil carrot thyme bay'),
    E('Moules marinières', 'mussel wine parsley butter garlic potato'), E('Cabillaud au beurre', 'cod butter lemon parsley potato'),
    E('Ratatouille', 'zucchini eggplant tomato pepper thyme garlic'), E('Poulet à l’estragon', 'chicken tarragon cream rice mushroom'),
    E('Quiche', 'egg leek cheese cream'), E('Gratin dauphinois', 'potato cheese cream garlic nutmeg'),
    E('Blanquette', 'turkey mushroom cream rice carrot'), E('Hachis parmentier', 'beef potato milk butter carrot nutmeg'),
  ],
  it: [
    E('Pasta al pomodoro', 'pasta tomato basil garlic parmesan'), E('Ragù', 'pasta beef tomato carrot onion wine parmesan'),
    E('Pasta al pesto', 'pasta pesto green-bean potato'), E('Risotto ai funghi', 'rice mushroom parmesan wine butter onion'),
    E('Cacciatore', 'chicken tomato pepper mushroom rosemary wine'), E('Pasta alle cozze', 'pasta mussel tomato garlic parsley wine'),
    E('Frittata', 'egg zucchini potato parmesan'), E('Pollo al limone', 'chicken lemon rosemary potato garlic'),
    E('Pasta e fagioli', 'bean pasta tomato rosemary'), E('Merluzzo alla livornese', 'cod tomato oregano garlic'),
    E('Pasta ricotta e spinaci', 'pasta ricotta spinach tomato'), E('Pasta e broccoli', 'pasta broccoli garlic parmesan'),
    E('Caprese pasta', 'pasta tomato mozzarella basil'), E('Salsiccia e patate', 'sausage potato rosemary pepper'),
  ],
  gr: [
    E('Kotopoulo lemonato', 'chicken lemon oregano potato garlic'), E('Souvlaki with tzatziki', 'pork lemon oregano yogurt cucumber'),
    E('Kleftiko', 'lamb potato lemon oregano rosemary garlic'), E('Moussaka', 'beef eggplant tomato cinnamon cheese potato'),
    E('Spanakorizo', 'rice spinach lemon dill feta'), E('Fasolada', 'bean tomato carrot celery'),
    E('Avgolemono', 'chicken rice lemon egg'), E('Octopus with orzo', 'octopus pasta tomato wine'),
    E('Fasolakia', 'green-bean potato tomato'), E('Kolokithokeftedes', 'zucchini feta dill mint egg'),
    E('Bakaliaros', 'cod potato garlic lemon'), E('Fakes', 'lentil tomato bay vinegar'),
    E('Gyros bowl', 'chicken rice tomato cucumber yogurt oregano'), E('Briam', 'zucchini potato tomato eggplant oregano'),
  ],
  ch: [
    E('Rösti', 'potato egg cheese butter'), E('Zürcher Geschnetzeltes', 'pork mushroom cream wine potato'),
    E('Älplermagronen', 'pasta potato cheese milk onion apple'), E('Raclette', 'potato cheese'),
    E('Risotto ticinese', 'chicken rice mushroom cheese wine'), E('Bratwurst mit Zwiebeln', 'sausage onion potato mustard'),
    E('Berner Platte', 'pork cabbage potato bean'), E('Rüebli', 'carrot cream nutmeg potato'),
    E('Pasta mit Käse', 'pasta cheese cream nutmeg'),
  ],
  us: [
    E('Chicken & mash', 'chicken potato milk butter green-bean'), E('Chili', 'beef bean tomato cumin paprika pepper'),
    E('Mac & cheese', 'pasta cheese milk butter'), E('Jambalaya', 'turkey rice pepper celery tomato cajun'),
    E('Pulled pork & slaw', 'pork cabbage vinegar honey mustard'), E('Chowder', 'cod potato milk celery butter'),
    E('Meatloaf', 'beef potato ketchup onion'), E('Chicken broccoli rice', 'chicken broccoli rice cheese'),
    E('Honey mustard chicken', 'chicken honey mustard potato'), E('Cajun chicken', 'chicken corn pepper cajun rice'),
  ],
  mx: [
    E('Tinga', 'chicken tomato chipotle onion rice'), E('Carnitas', 'pork lime cumin corn onion cilantro'),
    E('Frijoles con arroz', 'bean rice cumin corn'), E('Huevos a la mexicana', 'egg tomato jalapeno onion corn'),
    E('Picadillo', 'beef tomato pepper cumin potato'), E('Fajitas', 'chicken pepper onion lime cumin'),
    E('Tacos de pescado', 'cod cabbage lime avocado corn'), E('Arroz rojo', 'rice tomato garlic cilantro'),
    E('Pollo con aguacate', 'chicken avocado lime cilantro'), E('Chile con carne', 'beef bean chipotle tomato cumin'),
  ],
  uk: [
    E('Shepherd’s pie', 'lamb potato carrot pea onion worcestershire'), E('Cottage pie', 'beef potato carrot onion worcestershire'),
    E('Fish pie', 'cod potato pea milk butter parsley'), E('Roast chicken', 'chicken potato carrot pea thyme'),
    E('Bangers & mash', 'sausage potato onion butter mustard'), E('Chicken & leek pie', 'chicken leek cream mushroom'),
    E('Steak & mushroom', 'beef mushroom mustard'), E('Lamb with mint', 'lamb mint potato pea'),
    E('Bubble & squeak', 'cabbage potato butter egg'),
  ],
  me: [
    E('Shawarma plate', 'chicken rice cumin lemon garlic yogurt tomato cucumber'), E('Mujadara', 'lentil rice onion cumin'),
    E('Lamb & rice', 'lamb rice cinnamon tomato'), E('Hummus bowl', 'chickpea tahini lemon garlic cumin'),
    E('Kofta', 'beef parsley onion cumin rice'), E('Shakshuka', 'egg tomato pepper cumin paprika'),
    E('Baba ganoush', 'eggplant tahini lemon garlic'), E('Fattoush', 'cucumber tomato mint parsley lemon'),
    E('Za’atar chicken', 'chicken zaatar lemon potato'), E('Roast cauliflower', 'cauliflower tahini cumin'),
  ],
  pt: [
    E('Bacalhau à Brás', 'cod potato egg onion parsley'), E('Frango piri-piri', 'chicken chipotle lemon garlic potato paprika'),
    E('Carne de porco à alentejana', 'pork mussel potato paprika garlic wine'), E('Arroz de bacalhau', 'rice cod tomato pepper'),
    E('Arroz de frango', 'rice chicken tomato bay wine'), E('Caldo verde', 'kale potato chorizo garlic'),
    E('Feijoada', 'bean chorizo cabbage carrot'), E('Polvo à lagareiro', 'octopus potato garlic'),
    E('Sardinhas assadas', 'sardine potato pepper'), E('Rojões', 'pork potato bay wine garlic'),
  ],
  in: [
    E('Butter chicken', 'chicken tomato yogurt ginger garlic cumin turmeric cream rice butter'), E('Dal', 'lentil turmeric cumin ginger garlic tomato rice'),
    E('Chana masala', 'chickpea tomato ginger cumin turmeric onion'), E('Chicken curry', 'chicken coconut ginger turmeric rice curry'),
    E('Palak', 'spinach cheese cream ginger'), E('Aloo gobi', 'potato cauliflower turmeric cumin ginger'),
    E('Fish curry', 'cod coconut turmeric ginger rice'), E('Egg curry', 'egg tomato onion turmeric rice'),
    E('Biryani', 'lamb yogurt ginger garlic rice cinnamon'), E('Aloo matar', 'pea potato cumin turmeric tomato'),
    E('Chicken tikka', 'chicken yogurt lemon cumin ginger rice'),
  ],
  jp: [
    E('Teriyaki chicken', 'chicken soy ginger rice honey'), E('Salmon rice bowl', 'salmon soy rice ginger'),
    E('Shogayaki', 'pork ginger soy cabbage rice'), E('Tamago rice', 'egg rice soy'),
    E('Oyakodon', 'chicken egg rice onion soy'), E('Gyudon', 'beef onion soy rice ginger'),
    E('Yakisoba', 'pasta soy cabbage pork carrot'), E('Japanese curry', 'chicken curry potato carrot rice onion'),
    E('Horenso', 'spinach soy sesame'), E('Mushroom rice', 'mushroom soy rice carrot'), E('Cod with ginger', 'cod soy ginger rice spinach'),
  ],
}

const FISH = ['cod', 'salmon', 'tuna', 'sardine', 'mussel', 'octopus', 'shrimp']
const CLASH_GROUPS = [
  [FISH, ['cheese', 'parmesan', 'mozzarella', 'ketchup', 'cinnamon', 'worcestershire', 'yogurt', 'feta', 'mint', 'honey', 'balsamic', 'ricotta']],
  [['pork', 'sausage', 'chorizo'], ['yogurt', 'dill', 'cinnamon', 'coconut', 'feta', 'mint', 'tahini']],
  [['beef', 'lamb'], ['dill', 'coconut', 'tarragon']],
  [['egg'], ['cinnamon', 'balsamic', 'honey', 'coconut', 'worcestershire']],
  [['cinnamon'], ['cheese', 'parmesan', 'mozzarella', 'soy', 'dill', 'mustard', 'ketchup', 'vinegar', 'balsamic', 'wine']],
  [['dill'], ['cumin', 'soy', 'coconut', 'chipotle', 'turmeric', 'ginger']],
  [['soy'], ['parmesan', 'mozzarella', 'cheese', 'feta', 'yogurt', 'oregano', 'basil', 'balsamic', 'paprika', 'tahini']],
  [['coconut'], ['cheese', 'parmesan', 'mozzarella', 'feta', 'butter', 'yogurt', 'milk', 'wine', 'balsamic', 'mustard', 'ketchup', 'worcestershire']],
  [['mint'], ['paprika', 'soy', 'mustard', 'ketchup', 'cheese']],
  [['ketchup'], ['feta', 'parmesan', 'dill', 'yogurt']],
  [['tahini'], ['cheese', 'parmesan', 'mozzarella', 'butter', 'cream']],
  [['yogurt'], ['wine']],
  [['turmeric'], ['parmesan', 'mozzarella', 'balsamic', 'worcestershire']],
]
const CLASH = new Set()
for (const [a, b] of CLASH_GROUPS) for (const x of a) for (const y of b) if (x !== y) CLASH.add(pairKey(x, y))

const EX_PAIRS = {}, ALL_PAIRS = new Set()
for (const [country, list] of Object.entries(EXAMPLES)) {
  const set = (EX_PAIRS[country] = new Set())
  for (const ex of list) for (let i = 0; i < ex.c.length; i++) for (let j = i + 1; j < ex.c.length; j++) {
    const k = pairKey(ex.c[i], ex.c[j]); set.add(k); ALL_PAIRS.add(k)
  }
}

const clampPref = v => Math.max(-3, Math.min(3, v ?? 0))
/** Cuánto pegan dos conceptos en un país (+ lo aprendido de ti). */
export function link(a, b, country, pairPrefs) {
  if (!a || !b || a === b) return 0
  const k = pairKey(a, b)
  const inCountry = country ? EX_PAIRS[country]?.has(k) : ALL_PAIRS.has(k)
  let v = inCountry ? 1 : ALL_PAIRS.has(k) ? 0.3 : 0
  if (CLASH.has(k) && !inCountry) v -= 3
  return v + 0.8 * clampPref(pairPrefs?.[k])
}
/** Encaje de un conjunto de conceptos: media de lo positivo + suma de los choques. */
export function setFit(cs, country, pairPrefs) {
  let pos = 0, neg = 0, n = 0
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    if (!cs[i] || !cs[j] || cs[i] === cs[j]) continue
    const v = link(cs[i], cs[j], country, pairPrefs); n++
    if (v >= 0) pos += v; else neg += v
  }
  return (n ? pos / n : 0) * 3 + neg
}
/** El clásico al que más se parece (Jaccard) y cuánto. */
export function closestExample(cs, country) {
  const A = new Set(cs.filter(Boolean))
  let best = null, score = 0
  for (const ex of EXAMPLES[country] ?? []) {
    let inter = 0
    for (const c of ex.c) if (A.has(c)) inter++
    const j = inter / (A.size + ex.c.length - inter)
    if (j > score) { score = j; best = ex }
  }
  return { ex: best, score }
}

/** Parejas de un plato que cuentan para aprender de ti: las de sus condimentos
 *  (lo que suele hacer raro un plato: cerdo+yogur); si no lleva, proteína+verdura. */
export function dishPairs(combo, allIng) {
  const cs = [...new Set((combo?.items ?? []).map(it => conceptOf(it.k, allIng[it.k])).filter(Boolean))]
  const out = [], fallback = []
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    const ka = kindOfConcept(cs[i]), kb = kindOfConcept(cs[j])
    if (ka === 'F' || kb === 'F') out.push(pairKey(cs[i], cs[j]))
    else if ((ka === 'P' && kb === 'V') || (ka === 'V' && kb === 'P')) fallback.push(pairKey(cs[i], cs[j]))
  }
  return out.length ? out : fallback
}
