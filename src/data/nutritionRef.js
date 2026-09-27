// ─── Nutrientes de referencia (aproximados, por 100 g en crudo) ─────────────
// Para los ingredientes que añades tú sin kcal: la app los estima por el
// NOMBRE (inglés o español) con esta tabla y los marca como estimados
// (`nutEst`). En su ficha se ven y se pueden corregir con la etiqueta.
// Valores USDA / etiquetas típicas: [kcal, proteína, grasa, hidratos, fibra].
// `u` = gramos de una unidad (para lo que se compra por pieza).

const R = (re, kc, prot, fat, carb, fib, u) => ({ re, kc, prot, fat, carb, fib, u })

export const NUTRITION_REF = [
  // Cereales, granos y bases (en seco)
  R(/quinoa/i, 368, 14.1, 6.1, 64.2, 7),
  R(/couscous|cusc[uú]s/i, 376, 12.8, 0.6, 77.4, 5),
  R(/bulgur/i, 342, 12.3, 1.3, 75.9, 12.5),
  R(/brown rice|arroz integral/i, 367, 7.5, 2.7, 76.2, 3.4),
  R(/basmati|jasmine|\brice\b|arroz/i, 360, 7, 0.7, 79, 0.4),
  R(/rice noodle|fideos? de arroz/i, 364, 6, 0.6, 80, 1.6),
  R(/udon|soba|ramen|noodle|fideo/i, 350, 12, 2, 72, 3),
  R(/spaghetti|penne|macaroni|fusilli|pasta/i, 360, 13, 1.5, 74, 2.5),
  R(/gnocchi|ñoqui/i, 150, 3.5, 0.3, 33, 1.5),
  R(/polenta|cornmeal|harina de ma[ií]z/i, 362, 8.1, 3.6, 76.9, 7.3),
  R(/oat|avena/i, 389, 16.9, 6.9, 66.3, 10.6),
  R(/barley|cebada/i, 354, 12.5, 2.3, 73.5, 17.3),
  R(/farro|spelt|espelta/i, 338, 14.6, 2.4, 70.2, 10.7),
  R(/buckwheat|trigo sarraceno/i, 343, 13.3, 3.4, 71.5, 10),
  R(/millet|mijo/i, 378, 11, 4.2, 72.9, 8.5),
  R(/tortilla/i, 300, 8, 7, 50, 3.5, 40),
  R(/bagel/i, 257, 10, 1.6, 50, 2.3, 100),
  R(/pita|naan|wrap/i, 275, 9, 1.2, 55, 2.2, 60),
  R(/bread|\bpan\b|loaf|baguette/i, 265, 9, 3.2, 49, 2.7),
  R(/cracker|galleta salada/i, 430, 9, 12, 70, 3),
  R(/flour|harina/i, 364, 10, 1, 76, 2.7),
  R(/sweet potato|boniato|batata|camote/i, 86, 1.6, 0.1, 20, 3),
  R(/potato|patata/i, 77, 2, 0.1, 17.5, 2.2),
  // Legumbres (en seco) y derivados
  R(/tofu/i, 144, 17.3, 8.7, 2.8, 2.3),
  R(/tempeh/i, 192, 20.3, 10.8, 7.6, 5),
  R(/edamame/i, 121, 11.9, 5.2, 8.9, 5.2),
  R(/soy ?bean|soja(?! sauce)/i, 446, 36.5, 19.9, 30.2, 9.3),
  R(/lentil|lenteja/i, 352, 24.6, 1.1, 63.4, 10.7),
  R(/chickpea|garbanzo/i, 364, 19.3, 6, 60.7, 17.4),
  R(/split pea|guisante seco/i, 341, 24.6, 1.2, 60.4, 25.5),
  R(/bean|jud[ií]a|alubia|frijol/i, 337, 22, 1.4, 61, 15),
  R(/hummus/i, 166, 7.9, 9.6, 14.3, 6),
  // Carnes, pescados, huevos
  R(/chicken breast|pechuga/i, 120, 22.5, 2.6, 0, 0),
  R(/chicken thigh|muslo/i, 177, 18, 12, 0, 0),
  R(/chicken wings?|wings?|alitas?/i, 203, 17.5, 12.9, 0, 0),
  R(/drumstick|chicken leg|jamoncito/i, 172, 18, 11, 0, 0),
  R(/chicken|pollo/i, 172, 19, 10, 0, 0),
  R(/turkey|pavo/i, 159, 20, 8, 0, 0),
  R(/ground beef|carne picada|minced beef/i, 254, 17, 20, 0, 0),
  R(/steak|sirloin|ribeye|filete|beef|ternera/i, 200, 21, 13, 0, 0),
  R(/lamb|cordero/i, 209, 25, 12, 0, 0),
  R(/tenderloin|solomillo/i, 143, 22, 3, 0, 0),
  R(/pork|cerdo|lomo/i, 200, 19, 13, 0, 0),
  R(/bacon|panceta|beicon/i, 540, 37, 42, 1.4, 0),
  R(/chorizo/i, 455, 24, 38, 2, 0),
  R(/ham|jam[oó]n/i, 145, 19, 7, 1.5, 0),
  R(/sausage|salchicha/i, 300, 14, 24, 3, 0),
  R(/salmon|salm[oó]n/i, 208, 20, 13, 0, 0),
  R(/tuna|at[uú]n/i, 116, 25.5, 0.8, 0, 0),
  R(/sardine|sardina/i, 208, 24.6, 11.5, 0, 0),
  R(/mackerel|caballa/i, 205, 18.6, 13.9, 0, 0),
  R(/shrimp|prawn|gamba|langostino/i, 85, 20, 0.5, 0, 0),
  R(/squid|calamar/i, 92, 15.6, 1.4, 3.1, 0),
  R(/mussel|mejill[oó]n/i, 86, 11.9, 2.2, 3.7, 0),
  R(/tilapia|cod|bacalao|hake|merluza|haddock|pollock|white fish|pescado/i, 82, 18, 0.7, 0, 0),
  R(/egg white|clara/i, 52, 10.9, 0.2, 0.7, 0),
  R(/\beggs?\b|huevo/i, 143, 12.6, 9.5, 0.7, 0, 50),
  // Lácteos
  R(/cottage/i, 98, 11.1, 4.3, 3.4, 0),
  R(/greek yogh?urt|yogur griego/i, 97, 9, 5, 3.9, 0),
  R(/skyr|quark/i, 63, 11, 0.2, 4, 0),
  R(/yogh?urt|yogur/i, 61, 3.5, 3.3, 4.7, 0),
  R(/kefir/i, 60, 3.5, 3.5, 4.5, 0),
  R(/cream cheese|queso crema/i, 342, 6, 34, 4, 0),
  R(/parmesan|parmigiano|grana/i, 431, 38, 29, 3.2, 0),
  R(/mozzarella/i, 280, 22, 21, 2.2, 0),
  R(/feta/i, 265, 14, 21, 4, 0),
  R(/ricotta/i, 174, 11, 13, 3, 0),
  R(/halloumi/i, 321, 22, 25, 2, 0),
  R(/goat cheese|queso de cabra/i, 290, 19, 23, 2, 0),
  R(/cheese|queso|cheddar|gouda|gruy|emmental|brie|manchego/i, 390, 25, 31, 1.5, 0),
  R(/heavy cream|whipping|nata/i, 340, 2.8, 36, 2.7, 0),
  R(/sour cream|crème fraîche|creme fraiche/i, 190, 2, 19, 4.6, 0),
  R(/\bbutter\b|mantequilla/i, 717, 0.9, 81, 0.1, 0),
  R(/oat milk|leche de avena/i, 45, 1, 1.5, 6.6, 0.8),
  R(/almond milk|leche de almendra/i, 15, 0.6, 1.1, 0.3, 0.3),
  R(/soy milk|leche de soja/i, 43, 3.3, 1.8, 3, 0.5),
  R(/milk|leche/i, 61, 3.2, 3.3, 4.8, 0),
  R(/whey|protein powder|prote[ií]na en polvo/i, 375, 80, 4, 8, 0),
  // Frutos secos, semillas, grasas
  R(/peanut butter|crema de cacahuete/i, 588, 25, 50, 20, 6),
  R(/almond butter/i, 614, 21, 56, 19, 10.3),
  R(/tahini/i, 595, 17, 54, 21, 9.3),
  R(/peanut|cacahuete|man[ií]/i, 567, 25.8, 49.2, 16.1, 8.5),
  R(/walnut|nuez|nueces/i, 654, 15.2, 65.2, 13.7, 6.7),
  R(/cashew|anacardo/i, 553, 18.2, 43.9, 30.2, 3.3),
  R(/pistachio|pistacho/i, 560, 20.2, 45.3, 27.2, 10.6),
  R(/pecan/i, 691, 9.2, 72, 13.9, 9.6),
  R(/almond|almendra/i, 579, 21.2, 49.9, 21.6, 12.5),
  R(/hazelnut|avellana/i, 628, 15, 61, 17, 9.7),
  R(/flax|lino/i, 534, 18.3, 42.2, 28.9, 27.3),
  R(/hemp|c[aá][ñn]amo/i, 553, 31.6, 48.8, 8.7, 4),
  R(/chia/i, 486, 17, 31, 42, 34),
  R(/sesame|s[eé]samo/i, 573, 17.7, 49.7, 23.5, 11.8),
  R(/pumpkin seed|pepita/i, 559, 30.2, 49.1, 10.7, 6),
  R(/sunflower seed|pipa/i, 584, 20.8, 51.5, 20, 8.6),
  R(/coconut milk|leche de coco/i, 197, 2, 21, 3, 0),
  R(/coconut|coco/i, 660, 6.9, 65, 24, 15.1),
  R(/olive oil|aceite de oliva|\boil\b|aceite/i, 884, 0, 100, 0, 0),
  R(/olive|aceituna/i, 115, 0.8, 10.7, 6.3, 3.2),
  R(/avocado|aguacate/i, 160, 2, 14.7, 8.5, 6.7, 150),
  // Verduras
  R(/mushroom|champi|seta/i, 22, 3.1, 0.3, 3.3, 1),
  R(/spinach|espinaca/i, 23, 2.9, 0.4, 3.6, 2.2),
  R(/kale|col rizada/i, 49, 4.3, 0.9, 8.8, 3.6),
  R(/broccoli|br[oó]coli/i, 34, 2.8, 0.4, 6.6, 2.6),
  R(/cauliflower|coliflor/i, 25, 1.9, 0.3, 5, 2),
  R(/brussels|coles de bruselas/i, 43, 3.4, 0.3, 9, 3.8),
  R(/cabbage|repollo|\bcol\b/i, 25, 1.3, 0.1, 5.8, 2.5),
  R(/zucchini|calabac[ií]n|courgette/i, 17, 1.2, 0.3, 3.1, 1),
  R(/squash|pumpkin|calabaza/i, 45, 1, 0.1, 11.7, 2),
  R(/eggplant|aubergine|berenjena/i, 25, 1, 0.2, 5.9, 3),
  R(/bell pepper|pepper|pimiento/i, 26, 1, 0.3, 6, 2),
  R(/jalape/i, 29, 0.9, 0.4, 6.5, 2.8),
  R(/tomato|tomate/i, 18, 0.9, 0.2, 3.9, 1.2),
  R(/cucumber|pepino/i, 15, 0.7, 0.1, 3.6, 0.5),
  R(/carrot|zanahoria/i, 41, 0.9, 0.2, 9.6, 2.8),
  R(/beet|remolacha/i, 43, 1.6, 0.2, 9.6, 2.8),
  R(/celery|apio/i, 16, 0.7, 0.2, 3, 1.6),
  R(/asparagus|esp[aá]rrago/i, 20, 2.2, 0.1, 3.9, 2.1),
  R(/green bean|jud[ií]a verde|haricot/i, 31, 1.8, 0.2, 7, 3.4),
  R(/\bpeas?\b|guisante/i, 81, 5.4, 0.4, 14, 5.5),
  R(/corn|ma[ií]z/i, 86, 3.3, 1.4, 19, 2.7),
  R(/leek|puerro/i, 61, 1.5, 0.3, 14, 1.8),
  R(/shallot|chalota/i, 72, 2.5, 0.1, 16.8, 3.2),
  R(/garlic|\bajo\b/i, 149, 6.4, 0.5, 33, 2.1),
  R(/onion|cebolla/i, 40, 1.1, 0.1, 9.3, 1.7),
  R(/lettuce|lechuga|arugula|r[uú]cula|mixed greens/i, 17, 1.4, 0.2, 3.3, 1.8),
  R(/radish|r[aá]bano/i, 16, 0.7, 0.1, 3.4, 1.6),
  R(/artichoke|alcachofa/i, 47, 3.3, 0.2, 10.5, 5.4),
  R(/ginger|jengibre/i, 80, 1.8, 0.8, 18, 2),
  // Frutas
  R(/banana|pl[aá]tano/i, 89, 1.1, 0.3, 23, 2.6, 120),
  R(/apple|manzana/i, 52, 0.3, 0.2, 14, 2.4, 180),
  R(/pear|pera/i, 57, 0.4, 0.1, 15, 3.1, 180),
  R(/orange|naranja/i, 47, 0.9, 0.1, 12, 2.4, 130),
  R(/mandarin|clementin|mandarina/i, 53, 0.8, 0.3, 13, 1.8, 75),
  R(/strawberr|fresa/i, 32, 0.7, 0.3, 7.7, 2),
  R(/blueberr|ar[aá]ndano/i, 57, 0.7, 0.3, 14, 2.4),
  R(/raspberr|frambuesa/i, 52, 1.2, 0.7, 12, 6.5),
  R(/grape|uva/i, 69, 0.7, 0.2, 18, 0.9),
  R(/mango/i, 60, 0.8, 0.4, 15, 1.6),
  R(/pineapple|pi[ñn]a/i, 50, 0.5, 0.1, 13, 1.4),
  R(/melon|mel[oó]n|cantaloupe/i, 34, 0.8, 0.2, 8, 0.9),
  R(/watermelon|sand[ií]a/i, 30, 0.6, 0.2, 7.6, 0.4),
  R(/kiwi/i, 61, 1.1, 0.5, 15, 3, 75),
  R(/peach|melocot[oó]n|nectarin/i, 39, 0.9, 0.3, 9.5, 1.5, 150),
  R(/date|d[aá]til/i, 282, 2.5, 0.4, 75, 8),
  R(/raisin|pasa/i, 299, 3.1, 0.5, 79, 3.7),
  R(/lemon|lim[oó]n/i, 29, 1.1, 0.3, 9.3, 2.8, 60),
  R(/lime|lima/i, 30, 0.7, 0.2, 10.5, 2.8, 67),
  // Salsas, dulces y otros
  R(/soy sauce|salsa de soja|tamari/i, 53, 8, 0.6, 5, 0.8),
  R(/miso/i, 198, 12, 6, 26, 5.4),
  R(/honey|miel/i, 304, 0.3, 0, 82, 0.2),
  R(/maple|arce/i, 260, 0, 0.1, 67, 0),
  R(/sugar|az[uú]car/i, 387, 0, 0, 100, 0),
  R(/dark chocolate|chocolate negro/i, 550, 6, 32, 60, 10.9),
  R(/chocolate/i, 535, 7.7, 30, 59, 3.4),
  R(/cocoa|cacao/i, 350, 20, 12, 58, 30),
  R(/pesto/i, 430, 5, 42, 6, 1),
  R(/mayonnaise|mayonesa|aioli/i, 680, 1, 75, 1, 0),
  R(/ketchup/i, 110, 1.5, 0.1, 26, 0.3),
  R(/mustard|mostaza/i, 70, 4.4, 4, 5.8, 3.3),
  R(/salsa|tomato sauce|passata|salsa de tomate/i, 33, 1.3, 0.2, 6, 1.5),
  R(/bbq|barbecue/i, 172, 0.8, 0.6, 41, 0.9),
  R(/hot sauce|sriracha/i, 93, 1.9, 0.9, 19, 2.2),
  R(/vinegar|vinagre/i, 20, 0, 0, 0.6, 0),
  R(/broth|stock|caldo/i, 7, 1, 0.2, 0.4, 0),
  R(/wine|vino/i, 83, 0.1, 0, 2.6, 0),
]

/** Nutrientes estimados por el nombre, en la base de precio del ingrediente. */
export function estimateNutrition(key, ing) {
  const text = `${ing?.name ?? ''} ${key ?? ''}`.replace(/[-_]/g, ' ')
  // Gana la coincidencia más larga: «coconut milk» antes que «milk»,
  // «rice vinegar» antes que «rice», «peanut butter» antes que «butter».
  let ref = null, best = 0
  for (const r of NUTRITION_REF) {
    const m = r.re.exec(text)
    if (m && m[0].length > best) { best = m[0].length; ref = r }
  }
  if (!ref) return null
  const out = { nutEst: true }
  if (ing.perUnit != null || (ing.packUnit === 'unit')) {
    const g = ing.unitGrams ?? ref.u ?? 100
    const f = g / 100
    Object.assign(out, { kcu: Math.round(ref.kc * f), protu: +(ref.prot * f).toFixed(1), fatu: +(ref.fat * f).toFixed(1), carbu: +(ref.carb * f).toFixed(1), fibu: +(ref.fib * f).toFixed(1) })
  } else if (ing.perML != null) {
    Object.assign(out, { kcml: ref.kc / 100, protml: ref.prot / 100, fatml: ref.fat / 100, carbml: ref.carb / 100 })
  } else if (ing.flat != null || ing.perServing != null) {
    return null // especias y raciones sueltas: sin base clara, mejor no inventar
  } else {
    Object.assign(out, { kc: ref.kc, prot: ref.prot, fat: ref.fat, carb: ref.carb, fib: ref.fib })
  }
  return out
}

const hasKcal = i => i.kc != null || i.kcu != null || i.kcml != null || i.kcs != null || i.kcf != null
/** El ingrediente con nutrientes estimados si no trae kcal; si trae kcal por
 *  100 g pero no proteína ni grasa, se reparten como en el de referencia. */
export function withEstimatedNutrition(key, ing) {
  if (!ing || ing.pend) return ing
  if (!hasKcal(ing)) {
    const est = estimateNutrition(key, ing)
    return est ? { ...ing, ...est } : ing
  }
  if (ing.kc != null && ing.prot == null && ing.fat == null) {
    const est = estimateNutrition(key, { name: ing.name })
    if (!est || !est.kc) return ing
    const f = ing.kc / est.kc
    return { ...ing, prot: +(est.prot * f).toFixed(1), fat: +(est.fat * f).toFixed(1), carb: +(est.carb * f).toFixed(1), fib: ing.fib ?? +(est.fib * f).toFixed(1), nutEst: true }
  }
  return ing
}
