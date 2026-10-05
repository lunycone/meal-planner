// ─── Cocinas del mundo (por algoritmo) ──────────────────────────────────────
// Para «Countries» no hay recetas escritas: cada país es un PERFIL de sabor
// (qué proteínas, bases, verduras y condimentos le pegan, con un peso de 0 a
// 1) y el algoritmo compone platos con TUS ingredientes que encajan:
// proteína + base + 1–2 verduras + 0–2 condimentos + AOVE.
// Encima, pairing.js aporta lo que aprende de platos típicos de cada país
// (qué parejas van juntas, qué choca) y de ti («Not this one»), y el nombre
// del clásico al que más se parece el plato («Paella-style…»).
// Los perfiles leen el nombre del ingrediente, así que lo que añadas en
// Ingredientes entra solo; `missingFor` dice qué condimentos típicos faltan.
// Las reglas de siempre las pone después la semana inteligente.

import { GEN_PREFIX, ingredientPools, learnPortions, median, prettyName, vegName, lower } from './composeDishes'
import { conceptOf, link, setFit, closestExample } from './pairing'
import { tagsOf, starchFamily } from '../lib/tags'

const P = (id, label, flag, adj, prof) => ({ id, label, flag, adj, ...prof })

// [regex sobre «clave + nombre», peso]. Peso 0 o sin coincidencia = no encaja.
export const PROFILES = [
  P('es', 'Spain', '🇪🇸', 'Spanish-style', {
    protein: [[/chicken|pork|cod|hake|mussel|octopus|squid|shrimp|prawn|sardine|chorizo|egg/, 1], [/turkey/, 0.6], [/beef|lamb/, 0.5]],
    base: [[/potato|rice|chickpea|lentil|white-bean|alubia/, 1], [/pinto|romano|cranberry/, 0.8], [/pasta|noodle/, 0.2]],
    veg: [[/pepper|tomato|green-bean|artichoke|spinach|pea\b|peas/, 1], [/zucchini|carrot|mushroom|eggplant/, 0.6]],
    flavor: [[/paprika|pimenton|saffron|chorizo/, 1], [/garlic|bay|white-wine|sherry/, 0.8], [/parsley|lemon|onion|vinegar/, 0.5]],
    hints: ['saffron', 'chorizo'],
  }),
  P('fr', 'France', '🇫🇷', 'French-style', {
    protein: [[/chicken|pork-tenderloin|cod|mussel|salmon|trout|duck/, 1], [/turkey|beef|lamb|egg/, 0.8], [/pork/, 0.6]],
    base: [[/potato|green-lentil|puy/, 1], [/white-bean|flageolet/, 0.7], [/rice/, 0.6], [/pasta/, 0.3]],
    veg: [[/carrot|leek|mushroom|green-bean|haricot/, 1], [/zucchini|spinach|pea|tomato|pepper|eggplant/, 0.6]],
    flavor: [[/\bbutter\b|white-wine|mustard|dijon|thyme|shallot|tarragon|herbes/, 1], [/cream|bay|parsley|onion|nutmeg/, 0.8], [/garlic|lemon|cheese|gouda/, 0.5]],
    hints: ['thyme', 'tarragon'],
  }),
  P('it', 'Italy', '🇮🇹', 'Italian-style', {
    protein: [[/chicken|mussel|clam|ground-beef|ground-pork|sausage|meatball/, 1], [/cod|egg|turkey|tuna/, 0.7], [/pork/, 0.5]],
    base: [[/pasta|spaghetti|penne|gnocchi|polenta/, 1], [/rice|arborio/, 0.8], [/white-bean|cannellini|chickpea/, 0.7], [/potato/, 0.4]],
    veg: [[/tomato|passata|zucchini|artichoke|eggplant/, 1], [/spinach|broccoli|pepper|mushroom|kale/, 0.8], [/green-bean|pea/, 0.5]],
    flavor: [[/pesto|basil|oregano|parmesan|mozzarella|passata|balsamic/, 1], [/ricotta|garlic|white-wine|rosemary/, 0.8], [/lemon|onion|parsley/, 0.5]],
    hints: ['basil', 'oregano', 'parmesan', 'mozzarella', 'balsamic vinegar'],
  }),
  P('gr', 'Greece', '🇬🇷', 'Greek-style', {
    protein: [[/chicken|lamb|octopus|squid/, 1], [/pork|cod|ground-beef/, 0.8], [/egg/, 0.6]],
    base: [[/potato|rice|white-bean|gigantes|orzo/, 1], [/chickpea|lentil/, 0.8], [/pasta/, 0.6]],
    veg: [[/tomato|zucchini|spinach|green-bean|eggplant/, 1], [/pepper|cucumber|artichoke/, 0.8], [/carrot|cabbage/, 0.4]],
    flavor: [[/lemon|feta|oregano|dill|greek-yogurt/, 1], [/mint|yogurt|garlic|rosemary/, 0.7], [/cucumber|onion|parsley|cinnamon/, 0.5]],
    hints: ['oregano', 'dill', 'mint'],
  }),
  P('ch', 'Switzerland', '🇨🇭', 'Swiss-style', {
    protein: [[/pork|chicken|veal|sausage/, 1], [/turkey|egg|beef/, 0.8], [/cod|trout|perch/, 0.7]],
    base: [[/potato|pasta|spätzle|spaetzle/, 1], [/rice/, 0.7]],
    veg: [[/carrot|mushroom|leek|cabbage|green-bean/, 1], [/spinach|pea|broccoli/, 0.6]],
    flavor: [[/\bbutter\b|gouda|gruy|emmental|raclette|cheese|cheddar/, 1], [/cream|white-wine|milk|nutmeg/, 0.8], [/applesauce|apple|mustard|parsley/, 0.6]],
    hints: ['gouda', 'nutmeg'],
  }),
  P('us', 'USA', '🇺🇸', 'American-style', {
    protein: [[/chicken|turkey|ground-beef|ribs/, 1], [/pork|sausage|egg/, 0.8], [/cod|shrimp|salmon/, 0.7]],
    base: [[/potato|sweet-potato|mac|pasta|corn/, 1], [/rice|black-bean|kidney-bean|pinto/, 0.8]],
    veg: [[/green-bean|broccoli|corn|cabbage|coleslaw/, 1], [/carrot|pepper|celery|tomato/, 0.7]],
    flavor: [[/cheddar|cajun|ranch|ketchup/, 1], [/mustard|honey|paprika|\bbutter\b|sour-cream|taco|worcester/, 0.7], [/onion|garlic|vinegar|celery/, 0.5]],
    hints: ['cajun seasoning'],
  }),
  P('mx', 'Mexico', '🇲🇽', 'Mexican-style', {
    protein: [[/chicken|pork-shoulder|pork-loin|ground-beef|egg|carnitas/, 1], [/turkey|cod|shrimp/, 0.8]],
    base: [[/rice|black-bean|pinto|kidney-bean|masa|tortilla|corn/, 1], [/potato/, 0.3]],
    veg: [[/pepper|tomato|jalape|zucchini|corn|cabbage/, 1], [/carrot|spinach/, 0.4]],
    flavor: [[/cumin|lime|jalape|taco|avocado|cilantro|chipotle/, 1], [/sour-cream|paprika|cheddar/, 0.6], [/onion|garlic|lemon/, 0.5]],
    hints: ['cilantro', 'chipotle'],
    allowBase: /masa|tortilla|corn/i,
  }),
  P('uk', 'UK', '🇬🇧', 'British-style', {
    protein: [[/chicken|lamb|beef|sausage|cod|haddock/, 1], [/pork|turkey|egg/, 0.7]],
    base: [[/potato/, 1], [/rice|pasta/, 0.3]],
    veg: [[/pea\b|peas|carrot|leek|cabbage|broccoli/, 1], [/mushroom|green-bean|squash/, 0.6]],
    flavor: [[/\bbutter\b|worcester|mint|mustard/, 1], [/milk|cheddar|bay|thyme|rosemary/, 0.7], [/onion|parsley/, 0.5]],
    hints: ['worcestershire sauce', 'mint', 'thyme'],
  }),
  P('pt', 'Portugal', '🇵🇹', 'Portuguese-style', {
    protein: [[/cod|chicken|pork|octopus|sardine|mussel|clam|chorizo/, 1], [/egg|shrimp/, 0.7], [/turkey|beef/, 0.4]],
    base: [[/potato|rice/, 1], [/bean|chickpea/, 0.7], [/pasta/, 0.2]],
    veg: [[/kale|cabbage|pepper|tomato/, 1], [/carrot|spinach|pea|green-bean/, 0.6]],
    flavor: [[/paprika|garlic|bay|piri|chili|chipotle/, 1], [/lemon|white-wine|parsley|cilantro/, 0.8], [/onion|vinegar/, 0.5]],
    hints: ['piri-piri'],
  }),
  P('me', 'Middle East', '🇱🇧', 'Middle Eastern-style', {
    protein: [[/chicken|lamb/, 1], [/ground-beef|egg|kofta/, 0.8], [/cod/, 0.6]],
    base: [[/rice|chickpea|lentil|bulgur|couscous|freekeh/, 1], [/potato/, 0.5]],
    veg: [[/tomato|cucumber|eggplant|zucchini|cauliflower/, 1], [/spinach|pepper|green-bean|carrot/, 0.7]],
    flavor: [[/tahini|cumin|sumac|za.?atar|lemon/, 1], [/yogurt|mint|parsley|cinnamon|garlic/, 0.7], [/paprika|onion/, 0.5]],
    hints: ["za'atar", 'mint'],
  }),
  P('in', 'India', '🇮🇳', 'Indian-style', {
    protein: [[/chicken|egg/, 1], [/lamb|cod|shrimp/, 0.8], [/turkey/, 0.5]],
    base: [[/rice|lentil|chickpea/, 1], [/potato/, 0.7], [/bean/, 0.5]],
    veg: [[/tomato|spinach|cauliflower|pea\b|peas/, 1], [/carrot|pepper|green-bean|zucchini|eggplant/, 0.6]],
    flavor: [[/turmeric|cumin|ginger|garam|curry|coconut/, 1], [/yogurt|cilantro|garlic|cinnamon/, 0.8], [/onion|lemon|cream|chili/, 0.5]],
    hints: ['garam masala', 'curry powder'],
  }),
  P('jp', 'Japan', '🇯🇵', 'Japanese-style', {
    protein: [[/chicken|salmon|pork|egg/, 1], [/cod|beef|shrimp|tuna/, 0.8]],
    base: [[/rice/, 1], [/noodle|udon|soba/, 0.8], [/pasta/, 0.3], [/potato/, 0.3]],
    veg: [[/cabbage|spinach|mushroom|carrot/, 1], [/green-bean|broccoli|pea/, 0.6], [/zucchini|pepper/, 0.3]],
    flavor: [[/soy|ginger|sesame|mirin|rice-vinegar/, 1], [/honey|garlic|curry/, 0.5]],
    hints: ['sesame oil', 'rice vinegar', 'mirin'],
  }),
]
export const COUNTRIES = PROFILES.map(({ id, label, flag }) => ({ id, label, flag }))
export const COUNTRY_LABEL = Object.fromEntries(COUNTRIES.map(c => [c.id, `${c.flag} ${c.label}`]))

const textOf = (key, ing) => `${key} ${ing?.name ?? ''}`.toLowerCase()
function aff(list, key, ing) {
  const t = textOf(key, ing)
  let best = 0
  for (const [re, w] of list) if (w > best && re.test(t)) best = w
  return best
}

const ALWAYS = /^(evoo|salt|water|olive-oil|black-pepper)$/
const MAIN_TAGS = ['white-meat', 'red-meat', 'fish', 'seafood', 'egg', 'starch', 'legume']
const pricedAny = ing => ing && !ing.pend && !ing.hideInTable &&
  (ing.per100 != null || ing.perUnit != null || ing.perML != null || ing.perServing != null || ing.flat != null)

// Ración de un condimento: la del catálogo si la hay; si no, según cómo se vende.
function flavorPortion(key, ing, learned) {
  const l = learned[key]
  if (l?.grams.length) return { grams: median(l.grams) }
  if (l?.units.length) return { units: median(l.units) }
  if (l?.ml.length) return { ml: median(l.ml) }
  if (ing.flat != null || ing.perServing != null) return {}
  if (ing.perUnit != null) return { units: /lemon|lime/.test(key) ? 0.5 : 1 }
  const t = textOf(key, ing)
  if (ing.perML != null) return { ml: /coconut/.test(t) ? 80 : /wine/.test(t) ? 30 : 10 }
  if (/ginger|garlic|chipotle|jalape/.test(t)) return { grams: 6 }
  const kc = ing.kc ?? 100
  return { grams: kc >= 500 ? 12 : kc >= 400 ? 15 : kc >= 250 ? 25 : kc >= 100 ? 40 : 60 }
}

/** Condimentos típicos del país que aún no están en Ingredientes. */
export function missingFor(allIng, country) {
  const prof = PROFILES.find(p => p.id === country)
  if (!prof) return []
  const names = Object.entries(allIng).map(([k, i]) => textOf(k, i).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-']/g, ' '))
  return prof.hints.filter(h => {
    const words = h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-']/g, ' ').split(' ')
    return !names.some(n => words.every(w => n.includes(w)))
  })
}

const PLURAL = { potato: 'potatoes' }
// Familia de un ingrediente para no repetir («feta & feta», «tomato, tomatoes»,
// «whole milk & skim milk»): la palabra que lo define.
const FAMILIES = ['yogurt', 'milk', 'onion', 'parsley', 'feta', 'cheese', 'butter', 'mustard', 'ketchup', 'lemon', 'lime', 'vinegar', 'wine', 'tomato', 'pepper', 'zucchini', 'bean', 'pea', 'spinach', 'cream', 'garlic', 'paprika', 'cumin', 'tahini', 'pesto', 'passata', 'honey', 'avocado', 'jalape', 'oregano', 'thyme', 'mint', 'basil', 'dill', 'cilantro', 'rosemary', 'saffron', 'turmeric', 'ginger', 'soy', 'coconut', 'chipotle']
function familyOfIng(key, ing) {
  const t = textOf(key, ing).replace(/tomatoes/g, 'tomato')
  if (/passata/.test(t)) return 'tomato'
  if (/coconut/.test(t)) return 'coconut'
  if (/soy/.test(t)) return 'soy'
  if (/sour-cream|sour cream/.test(t)) return 'cream'
  if (/cheddar|cheese|gouda|gruy|emmental|raclette|parmesan|mozzarella|ricotta/.test(t)) return 'cheese'
  return FAMILIES.find(f => t.includes(f)) ?? key
}
// Nombre corto y en minúsculas: sin marca, sin «5% plain», sin lo que va tras la coma.
function shortName(key, ing, maxWords = 3) {
  const fam = familyOfIng(key, ing)
  if (FAMILIES.includes(fam) && !['bean', 'pea', 'pepper', 'tomato', 'onion', 'cheese', 'vinegar', 'soy', 'coconut'].includes(fam)) return fam === 'jalape' ? 'jalapeño' : fam
  let n = prettyName(ing).split(',')[0].replace(/\b\d+%?\b|%/g, '').replace(/\b(organic|frozen|fresh|plain|a1|dried|bunch)\b/gi, '')
  if (n.includes(' / ')) n = n.split(' / ').pop()
  return n.replace(/\s+/g, ' ').trim().toLowerCase().split(' ').slice(0, maxWords).join(' ')
}
function joinAnd(xs) { return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} & ${xs[xs.length - 1]}` }

function composeFor(prof, allIng, allCombos, { stock = {}, limit = 24, pairPrefs = {} } = {}) {
  const learned = learnPortions(allCombos)
  const pools = ingredientPools(allIng, allCombos, { allowBase: prof.allowBase, stock })
  const withAff = (list, which) => list.map(c => ({ ...c, a: aff(prof[which], c.key, c.ing), c: conceptOf(c.key, c.ing) })).filter(c => c.a > 0)
  const mains = withAff([...pools.proteins, ...pools.eggs], 'protein')
  const bases = withAff([...pools.bases, ...pools.legumes], 'base')
  const veg = withAff(pools.veg, 'veg')
  const used = new Set([...mains, ...bases, ...veg].map(c => c.key))
  const flavors = Object.entries(allIng)
    .filter(([k, i]) => pricedAny(i) && !ALWAYS.test(k) && !used.has(k) && (!/\boil\b/.test(textOf(k, i)) || /sesame/.test(textOf(k, i))) && !tagsOf(k, allIng).some(t => MAIN_TAGS.includes(t) || t === 'nut'))
    .map(([k, i]) => ({ key: k, ing: i, a: aff(prof.flavor, k, i), p: flavorPortion(k, i, learned), fam: familyOfIng(k, i), c: conceptOf(k, i) }))
    .filter(f => f.a > 0)
  if (!mains.length || !bases.length || !veg.length) return {}

  const vegSets = []
  for (let i = 0; i < veg.length; i++) {
    vegSets.push([veg[i]])
    for (let j = i + 1; j < veg.length; j++) if (familyOfIng(veg[i].key, veg[i].ing) !== familyOfIng(veg[j].key, veg[j].ing)) vegSets.push([veg[i], veg[j]])
  }
  const out = [], fitMemo = new Map() // muchos cortes son el mismo concepto («pork»)
  for (const m of mains) for (const b of bases) for (const vs of vegSets) {
    const parts = [m, b, ...vs]
    const kcal = parts.reduce((s, c) => s + c.kcal, 0) + 135
    const cost = parts.reduce((s, c) => s + c.cost, 0)
    const prot = parts.reduce((s, c) => s + c.prot, 0)
    const vg = vs.reduce((s, v) => s + (v.p.grams ?? 0), 0)
    const flags = parts.reduce((s, c) => s + (c.tags.includes('legume') ? 1 : 0) + (c.tags.includes('insoluble') ? 1 : 0), 0)
    const fit = m.a + b.a + vs.reduce((s, v) => s + v.a, 0) / vs.length
    // Qué combina con qué (ejemplos del país, choques y lo aprendido de ti) y
    // cuánto se parece a un clásico: pesan tanto como el precio.
    const cs = parts.map(c => c.c)
    const ck = cs.join('|')
    let memo = fitMemo.get(ck)
    if (!memo) { memo = { pair: setFit(cs, prof.id, pairPrefs), typ: closestExample(cs, prof.id).score }; fitMemo.set(ck, memo) }
    const { pair, typ } = memo
    out.push({ m, b, vs, score: cost / kcal * 700 - prot * 0.02 - vg * 0.01 + flags * 0.4 - fit * 1.5 - pair * 0.8 - typ * 3 })
  }
  out.sort((x, y) => x.score - y.score)

  // Variedad (como composeDishes) y condimentos elegidos por cómo casan con el
  // plato; se reparten para no repetir siempre los mismos.
  const perMain = {}, perPair = new Set(), perBase = {}, perVegSet = {}, perVeg = {}, flavorUse = {}, perMainC = {}, perMB = {}
  const mainCap = Math.max(3, Math.ceil(limit / 6))
  const vegCap = Math.max(3, Math.ceil(limit / Math.max(1, veg.length) * 2))
  const res = {}
  let n = 0
  for (const d of out) {
    const pairK = `${d.m.kind}|${d.b.kind}`, bk = starchFamily(d.b.key, allIng) ?? d.b.key
    const vsKey = d.vs.map(v => v.key).join('+')
    if (perPair.has(pairK) || (perMain[d.m.kind] ?? 0) >= 3 || (perBase[bk] ?? 0) >= Math.ceil(limit / 2)) continue
    if ((perVegSet[vsKey] ?? 0) >= 2 || d.vs.some(v => (perVeg[v.key] ?? 0) >= vegCap)) continue
    // Variedad también por concepto: no seis «cerdo con arroz» con cortes distintos.
    const mbK = `${d.m.c}|${d.b.c}`
    if ((perMainC[d.m.c] ?? 0) >= mainCap || (perMB[mbK] ?? 0) >= 2) continue

    // Hasta dos condimentos de familias distintas que casen con lo que ya
    // lleva el plato (una tortilla puede no llevar ninguno).
    const dishCs = [d.m.c, d.b.c, ...d.vs.map(v => v.c)].filter(Boolean)
    const taken = new Set(d.vs.map(v => familyOfIng(v.key, v.ing)))
    const fl = []
    for (let round = 0; round < 2; round++) {
      let best = null, bestGain = 0.6
      const base = closestExample([...dishCs, ...fl.map(f => f.c)], prof.id).score
      for (const f of flavors) {
        if (taken.has(f.fam) || fl.includes(f)) continue
        const withF = [...dishCs, ...fl.map(x => x.c)]
        let links = 0, clash = false
        for (const c of withF) { const v = link(f.c, c, prof.id, pairPrefs); links += v; if (v <= -2) clash = true }
        if (clash) continue
        const gain = f.a + links / Math.max(1, withF.length) * 1.5
          + (closestExample([...withF, f.c], prof.id).score - base) * 4 - 0.35 * (flavorUse[f.key] ?? 0)
        if (gain > bestGain) { bestGain = gain; best = f }
      }
      if (!best) break
      fl.push(best); taken.add(best.fam)
    }
    // El clásico al que se parece; su nombre solo si comparte la proteína.
    const allCs = [...dishCs, ...fl.map(f => f.c)]
    const like = closestExample(allCs, prof.id)
    const named = like.score >= 0.4 && like.ex.c.includes(d.m.c)
    // Sin ningún condimento del país, solo vale si es un clásico tal cual (tortilla).
    if (!fl.length && !named) continue
    perPair.add(pairK); perMain[d.m.kind] = (perMain[d.m.kind] ?? 0) + 1; perBase[bk] = (perBase[bk] ?? 0) + 1
    perVegSet[vsKey] = (perVegSet[vsKey] ?? 0) + 1; d.vs.forEach(v => { perVeg[v.key] = (perVeg[v.key] ?? 0) + 1 })
    perMainC[d.m.c] = (perMainC[d.m.c] ?? 0) + 1; perMB[mbK] = (perMB[mbK] ?? 0) + 1
    fl.forEach(f => { flavorUse[f.key] = (flavorUse[f.key] ?? 0) + 1 })

    const items = [d.m, d.b, ...d.vs].map(c => ({ k: c.key, p: { ...c.p } }))
    fl.forEach(f => items.push({ k: f.key, p: { ...f.p } }))
    items.push({ k: 'evoo', p: { ml: 15 } })
    if (allIng.salt) items.push({ k: 'salt', p: { grams: 2 } })
    const baseName = shortName(d.b.key, d.b.ing); const bn = PLURAL[baseName] ?? baseName
    const extras = [...d.vs.map(v => lower(vegName(v.key, v.ing))), ...fl.map(f => shortName(f.key, f.ing, 2))]
    // Si se parece de verdad a un clásico, lleva su nombre («Paella-style…»).
    const style = named ? `${like.ex.n}-style` : prof.adj
    const name = `${style} ${shortName(d.m.key, d.m.ing, 4)} with ${bn} (${joinAnd(extras)})`
    const id = `gen-${prof.id}-${[d.m, d.b, ...d.vs, ...fl].map(c => c.key).join('+')}`
    res[GEN_PREFIX + id.slice(4)] = { name, meals: ['comida', 'cena'], items, generated: true, isCustom: true, customId: id, country: prof.id, like: named ? like.ex.n : null }
    if (++n >= limit) break
  }
  return res
}

/** Platos de un país (o de todos con country = null), compuestos con tus ingredientes. */
export function cuisineDishes(allIng, allCombos, { country = null, stock = {}, limit, pairPrefs = {} } = {}) {
  const out = {}
  for (const prof of PROFILES) {
    if (country && prof.id !== country) continue
    Object.assign(out, composeFor(prof, allIng, allCombos, { stock, pairPrefs, limit: limit ?? (country ? 30 : 6) }))
  }
  return out
}
