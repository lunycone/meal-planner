// ─── Vitaminas y minerales por 100 g (referencia, aproximados) ───────────────
// Valores tipo USDA FoodData Central / Tabla Canadiense, por 100 g de la parte
// COMESTIBLE en crudo (en seco en granos y legumbres), que es como están las
// kcal de ingredients.js. La app los empareja por el nombre/clave del
// ingrediente (la primera línea que casa gana, de más a menos específica) y los
// marca como estimados si `est`. Lo que no casa con nada se enseña como «sin
// datos» (nunca se inventa un cero).
//
// Orden de cada fila: kcal de referencia (sirve para comprobar que casó con el
// alimento correcto y para pasar «unidades» a gramos), y después
//   fe   hierro mg        ca  calcio mg        mg  magnesio mg    k  potasio mg
//   zn   zinc mg          b12 B12 µg           fol folato µg DFE  c  vitamina C mg
//   a    vitamina A µg RAE   kv vitamina K µg  n3  omega-3 g (ALA+EPA+DHA)   se selenio µg
// La vitamina D no está: ya la tomáis en pastilla.
//
// Los enlatados y congelados llevan el valor del producto, no el del fresco
// (vitamina C de los pimientos congelados, folato de las legumbres secas…).

export const NUTRIENT_KEYS = ['fe', 'ca', 'mg', 'k', 'zn', 'b12', 'fol', 'c', 'a', 'kv', 'n3', 'se']

const R = (re, kcal, fe, ca, mg, k, zn, b12, fol, c, a, kv, n3, se, est = false) =>
  ({ re, kcal, est, v: { fe, ca, mg, k, zn, b12, fol, c, a, kv, n3, se } })

export const MICROS_REF = [
  // ── Carnes y pescado (parte comestible, crudo) ──
  R(/beef.liver|liver/i,                         135, 4.9,   5, 18, 313, 4.0, 59.3, 290, 1.3, 4968, 3.1, 0.10, 38),
  R(/ground.beef|burger/i,                       254, 2.0,  12, 17, 273, 3.8,  2.14,  6, 0,     5, 1.5, 0.05, 15),
  R(/stew.beef|beef/i,                           220, 2.4,   6, 20, 330, 5.5,  2.4,   7, 0,     0, 1.5, 0.04, 24, true),
  R(/lamb/i,                                     209, 1.7,  10, 22, 300, 3.3,  2.5,  18, 0,     0, 2.0, 0.20, 21, true),
  R(/bacon/i,                                    458, 0.5,    6,  10, 210, 1.2,  0.7,  1, 0,     0, 0,   0.10, 20, true),
  R(/ground.pork/i,                              260, 0.9,  15, 16, 230, 2.0,  0.8,   5, 0.5,   2, 0,   0.10, 26, true),
  R(/pork.*(loin|tenderloin)/i,                  143, 0.8,  10, 25, 440, 1.8,  0.55,  6, 0.5,   2, 0,   0.03, 36, true),
  R(/pork|ham.hock|spareribs/i,                  260, 0.9,  15, 17, 300, 2.2,  0.7,   4, 0.5,   2, 0,   0.10, 27, true),
  R(/chicken.*wing/i,                            203, 0.5,  14, 15, 190, 1.2,  0.3,   4, 0,     47, 2,   0.20, 18, true),
  R(/chicken.*breast/i,                          120, 0.4,   4, 27, 340, 0.7,  0.3,   4, 0,      6, 0.3, 0.02, 22),
  R(/whole.chicken/i,                            215, 0.9,  11, 19, 189, 1.3,  0.3,   4, 0,     41, 2,   0.20, 17, true),
  R(/chicken/i,                                  172, 0.85, 10, 20, 220, 1.9,  0.3,   6, 0,     35, 2,   0.12, 20),
  R(/turkey/i,                                   159, 1.1,  12, 22, 215, 2.9,  1.5,   7, 0,     10, 0,   0.10, 21, true),
  R(/cod/i,                                       85, 0.38, 16, 29, 350, 0.5,  1.1,   7, 1,     12, 0.1, 0.44, 30),
  R(/smoked.salmon/i,                            117, 0.8,  11, 18, 175, 0.3,  3.3,   2, 0,      8, 0,   0.6,  32, true),
  R(/salmon/i,                                   203, 0.34,  9, 29, 363, 0.36, 4.5,  26, 3.9,   12, 0.1, 2.0,  36),
  R(/sardine/i,                                  208, 2.9, 382, 39, 397, 1.3,  8.9,  10, 0,     32, 2.6, 1.48, 52.7),
  R(/mussel/i,                                   172, 4.5,  33, 37, 268, 3.0, 22,    76, 13.6,  90, 0,   0.85, 90, true),
  R(/octopus/i,                                   82, 5.3,  53, 30, 350, 1.7, 36,    16, 5,     45, 0,   0.3,  44.8, true),
  R(/shrimp/i,                                    85, 0.5,  52, 37, 182, 1.1,  1.1,   3, 0,     54, 0,   0.3,  38, true),
  R(/\beggs?\b/i,                                143, 1.75, 56, 12, 138, 1.29, 0.89, 47, 0,    160, 0.3, 0.07, 30.7),

  // ── Lácteos ──
  R(/skim.milk/i,                                 34, 0.03, 125, 11, 156, 0.42, 0.45,  5, 0,     61, 0,   0,     2.9),
  R(/whole.milk|^milk/i,                          61, 0.03, 120, 11, 132, 0.4,  0.45,  5, 0,     36, 0.3, 0.08,  2.8),
  R(/greek/i,                                     97, 0.06, 100, 11, 141, 0.52, 0.75,  7, 0,     35, 0.2, 0.05,  9.7, true),
  R(/sheep.yogurt|ovino/i,                       103, 0.1, 170, 17, 140, 0.6, 0.6,  6, 4, 60, 0.3, 0.1, 2, true),
  R(/yogurt|yoghurt|kefir/i,                      61, 0.05, 121, 12, 155, 0.59, 0.37,  7, 0.5,   27, 0.2, 0.05,  2.2, true),
  R(/cheddar/i,                                  403, 0.68, 721, 28,  98, 3.1,  1.1,  27, 0,    300, 2.8, 0.3,  28),
  R(/feta/i,                                     264, 0.65, 493, 19,  62, 2.9,  1.7,  32, 0,    125, 1.8, 0.2,  15),
  R(/ricotta/i,                                  165, 0.38, 206, 11, 105, 0.9,  0.6,   8, 0,    130, 0,   0.1,  10, true),
  R(/parmesan/i,                                 431, 0.82,1184, 44,  92, 2.75, 1.2,   7, 0,    207, 1.7, 0.3,  22.5),
  R(/mozzarella/i,                               300, 0.44, 505, 20,  76, 2.92, 2.28,  7, 0,    174, 2.3, 0.22, 17),
  R(/gouda/i,                                    356, 0.24, 700, 29, 121, 3.9,  1.54, 21, 0,    165, 2.3, 0.3,  14.5),
  R(/^butter\b/i,                                    717, 0.02,  24,  2,  24, 0.09, 0.17,  3, 0,    684, 7,   0.32,  1),

  // ── Cereales y bases (en seco) ──
  R(/quinoa/i,                                   368, 4.57,  47, 197, 563, 3.10, 0, 184, 0,   1, 0,   0.26,  8.5),
  R(/brown.rice|arroz.integral/i,                367, 1.8,   23, 143, 223, 2.02, 0,  20, 0,   0, 1.9, 0.05, 23.4),
  R(/\brice\b|arroz|jasmine|basmati|arborio/i,   365, 1.1,   25,  35, 115, 1.5,  0,  11, 0,   0, 0.1, 0.03, 20, true),
  R(/pasta|spaghetti|penne|macaroni/i,           371, 1.3,   21,  53, 223, 1.41, 0,  18, 0,   0, 0.2, 0.05, 63.2),
  R(/rolled.oats|\boats?\b|avena/i,              379, 4.25,  52, 138, 362, 3.64, 0,  32, 0,   0, 2.0, 0.11, 28.9),
  R(/barley/i,                                   352, 2.5,   29,  79, 280, 2.13, 0,  23, 0,   1, 2.2, 0.10, 37.7),
  R(/buckwheat/i,                                343, 2.2,   18, 231, 460, 2.4,  0,  30, 0,   0, 7,   0.08,  8.3),
  R(/chickpea.flour|garbanzo.flour/i,            387, 4.86,  45, 166, 846, 2.81, 0, 437, 0,   1, 9,   0.10, 10.6, true),
  R(/masa.harina|masa/i,                         363, 8.5,  138,  93, 262, 1.8,  0, 256, 0,    0, 0.3, 0.02, 15, true),
  R(/flour|harina/i,                             364, 4.6,   15,  22, 107, 0.70, 0, 291, 0,   0, 0.3, 0.03, 33.9),
  R(/sourdough|bread/i,                          270, 3.0,   52,  30, 117, 1.0,  0,  60, 0,     0, 1,   0.05, 28, true),
  R(/potato/i,                                    77, 0.81,  12,  23, 421, 0.30, 0,  15, 19.7, 0, 2.1, 0.01, 0.3),
  R(/butternut|squash/i,                          45, 0.7,   48,  34, 352, 0.15, 0,  27, 21,  532, 1.1, 0.07, 0.5),

  // ── Legumbres (en seco) ──
  R(/red.lentil|pink.lentil/i,                   358, 7.39,  35,  47, 677, 3.27, 0, 479, 4.5, 2, 5.0, 0.10, 8.3),
  R(/lentil|lenteja/i,                           352, 6.51,  35,  47, 677, 3.27, 0, 479, 4.5, 2, 5.0, 0.10, 8.3),
  R(/chickpea|garbanzo/i,                        378, 4.31,  57,  79, 718, 2.76, 0, 557, 4,   3, 9,   0.10, 8.2),
  R(/black.bean/i,                               341, 5.0,  123, 171,1483, 3.65, 0, 444, 0,   0, 5.6, 0.28, 3.2),
  R(/white.bean|navy/i,                          337, 5.0,  147, 175,1185, 3.65, 0, 364, 4.5, 0, 2.5, 0.40, 5.4),
  R(/kidney/i,                                   333, 6.69,  83, 140,1406, 2.79, 0, 394, 4.5, 0, 19,  0.46, 3.2),
  R(/romano|pinto/i,                             347, 5.15, 113, 176,1393, 2.28, 0, 525, 6.3, 0, 5.6, 0.35, 8.2),

  // ── Verduras ──
  R(/garlic|ajo/i,                               149, 1.7,  181,  25, 401, 1.2,  0,   3, 24,   0, 1.7, 0,    14.2),
  R(/onion|cebolla/i,                             40, 0.21,  23,  10, 146, 0.17, 0,  19, 7.4,  0, 0.4, 0,    0.5),
  R(/carrot|zanahoria/i,                          41, 0.3,   33,  12, 320, 0.24, 0,  19, 5.9, 835, 13.2, 0,   0.1),
  R(/zucchini|courgette|calabac/i,                17, 0.35,  16,  18, 261, 0.32, 0,  24, 17.9, 10, 4.3, 0.02, 0.2),
  // Pimientos dulces congelados (Costco): se pierde parte de la vitamina C al escaldar y congelar.
  R(/yellow.pepper.costco|sweet.pepper.*frozen|frozen.*pepper/i, 27, 0.46, 11, 12, 212, 0.17, 0, 26, 90, 10, 7.4, 0.01, 0.3, true),
  R(/yellow.pepper|orange.pepper|red.pepper|sweet.pepper|pimiento/i, 27, 0.46, 11, 11, 205, 0.17, 0, 26, 150, 12, 7.4, 0.01, 0.3, true),  // vit C: 139-184 mg según la fuente
  R(/green.pepper/i,                              20, 0.34,  10,  10, 170, 0.13, 0,  10, 90,   18, 7.4, 0.01, 0, true),
  R(/jalape/i,                                    29, 0.25,  12,  15, 248, 0.14, 0,  14, 118.6, 54, 17.1, 0,   0),
  R(/peeled.tomato/i,                             21, 0.6, 20, 11, 240, 0.2, 0, 9, 9, 20, 3, 0, 0.6, true),
  R(/canned.tomato|passata|cherry.*canned/i,      32, 0.8, 30, 16, 290, 0.3, 0, 10, 9, 17, 3, 0, 0.6, true),
  R(/tomato|tomate/i,                             18, 0.27,  10,  11, 237, 0.17, 0,  15, 13.7, 42, 7.9, 0,    0),
  R(/cucumber|pepino/i,                           15, 0.28,  16,  13, 147, 0.2,  0,   7, 2.8,  5, 16.4, 0,    0.3),
  R(/lettuce|lechuga/i,                           17, 0.97,  33,  14, 247, 0.23, 0, 136, 4,   436, 102.5, 0.10, 0.4),
  R(/arugula|rocket/i,                            25, 1.46, 160,  47, 369, 0.47, 0,  97, 15,  119, 108.6, 0.17, 0.3),
  R(/frozen.spinach/i,                            29, 1.86, 201,  70, 450, 0.5,  0, 145, 9,   549, 580, 0.13, 1, true),
  R(/spinach|espinaca/i,                          23, 2.71,  99,  79, 558, 0.53, 0, 194, 28.1, 469, 482.9, 0.14, 1, true),
  R(/kale|col.rizada/i,                           49, 1.47, 150,  47, 491, 0.56, 0, 141, 120, 500, 704.8, 0.18, 0.9),
  R(/broccoli|br[oó]coli/i,                       34, 0.73,  47,  21, 316, 0.41, 0,  63, 89.2, 31, 101.6, 0.02, 2.5),
  R(/cabbage|repollo|col\b/i,                     25, 0.47,  40,  12, 170, 0.18, 0,  43, 36.6,  5, 76,  0.03, 0.3),
  R(/asparagus|esp[aá]rrago/i,                    20, 2.14,  24,  14, 202, 0.54, 0,  52, 5.6,  38, 41.6, 0,   2.3),
  R(/green.bean|judia|judía/i,                    31, 1.04,  37,  25, 211, 0.24, 0,  33, 12.2, 35, 14.4, 0.06, 0.6),
  R(/\bpeas?\b|guisante/i,                        77, 1.5,   25,  25, 150, 0.7,  0,  60, 10,   36, 24,  0.10, 1.8, true),
  R(/beet|remolacha/i,                            43, 0.8,   16,  23, 325, 0.35, 0, 109, 4.9,   2, 0.2, 0,    0.7),
  R(/leek|puerro/i,                               61, 2.1,   59,  28, 180, 0.12, 0,  64, 12,   83, 47,  0,    1),
  R(/celery|apio/i,                               14, 0.2,   40,  11, 260, 0.13, 0,  36, 3.1,  22, 29.3, 0,   0.4),
  R(/radish|r[aá]bano/i,                          16, 0.34,  25,  10, 233, 0.28, 0,  25, 14.8,  0, 1.3, 0,    0.6),
  R(/mushroom|champi|seta/i,                      22, 0.5,    3,   9, 318, 0.52, 0,  17, 2.1,   0, 0,   0,    9.3),
  R(/fresh.parsley|perejil/i,                     36, 6.2,  138,  50, 554, 1.07, 0, 152, 133,  421, 1640, 0.10, 0.1),
  R(/artichoke|alcachofa/i,                       47, 1.28,  44,  60, 370, 0.49, 0,  68, 11.7,  1, 14.8, 0,   0.2),

  // ── Fruta ──
  R(/avocado|aguacate/i,                         160, 0.55,  12,  29, 485, 0.64, 0,  81, 10,   7, 21,  0.11, 0.4),
  R(/banana|pl[aá]tano/i,                         89, 0.26,   5,  29, 400, 0.15, 0,  20, 8.7,  3, 0.5, 0.03, 1),
  R(/applesauce/i,                                42, 0.1,    4,   4,  75, 0.02, 0,   1, 1.2,  1, 0.5, 0,    0, true),
  R(/apple|manzana/i,                             52, 0.12,   6,   5, 107, 0.04, 0,   3, 4.6,  3, 2.2, 0.01, 0),
  R(/mandarin|clementine/i,                       53, 0.15,  37,  12, 166, 0.07, 0,  16, 26.7, 34, 0,  0,    0.1),
  R(/orange|naranja/i,                            47, 0.1,   40,  10, 181, 0.07, 0,  30, 53.2, 11, 0,  0,    0.5),
  R(/lemon|lim[oó]n/i,                            29, 0.6,   26,   8, 138, 0.06, 0,  11, 53,    1, 0,  0,    0.4),
  R(/\blime\b/i,                                  30, 0.6,   33,   6, 102, 0.11, 0,   8, 29.1,  2, 0.6, 0,    0.4),
  R(/cantaloupe|melon/i,                          34, 0.21,   9,  12, 267, 0.18, 0,  21, 36.7, 169, 2.5, 0.03, 0.4),
  R(/blueberr/i,                                  51, 0.28,   6,   8,  80, 0.16, 0,   6, 3,     3, 22,  0.12, 0.1, true),
  R(/strawberr/i,                                 35, 0.4,   15,  11, 148, 0.1,  0,  18, 41.4,  1, 2.2, 0.07, 0.4, true),
  R(/quince|membrillo/i,                          57, 0.7,   11,   8, 197, 0.04, 0,   3, 15,    2, 0,  0,    0, true),

  // ── Frutos secos y semillas ──
  R(/almond.butter/i,                            614, 3.5,  347, 279, 748, 3.3,  0,  53, 0,    0, 0,   0,    4.1, true),
  R(/peanut.butter/i,                            588, 1.9,   49, 154, 558, 2.5,  0,  87, 0,    0, 0,   0,    7.4, true),
  R(/almond/i,                                   579, 3.71, 269, 270, 733, 3.12, 0,  44, 0,    0, 0,   0,    4.1),
  R(/hazelnut/i,                                 628, 4.7,  114, 163, 680, 2.45, 0, 113, 6.3,   1, 14.2, 0.09, 2.4),
  R(/walnut/i,                                   654, 2.91,  98, 158, 441, 3.09, 0,  98, 1.3,   1, 2.7, 9.08, 4.9),
  R(/macadamia/i,                                718, 3.69,  85, 130, 368, 1.3,  0,  11, 1.2,   0, 5,   0.21, 3.6),
  R(/pumpkin.seed|pepita/i,                      559, 8.82,  46, 592, 809, 7.81, 0,  58, 1.9,   1, 7.3, 0.12, 9.4),
  R(/sunflower/i,                                584, 5.25,  78, 325, 645, 5.0,  0, 227, 1.4,   3, 2.7, 0.07, 53),
  R(/chia/i,                                     486, 7.72, 631, 335, 407, 4.58, 0,  49, 1.6,   0, 0,  17.83, 55.2),
  R(/flax|linaza/i,                              534, 5.73, 255, 392, 813, 4.34, 0,  87, 0.6,   0, 4.3, 22.8, 15, true),
  R(/coconut.milk/i,                             197, 1.64,  16,  37, 263, 0.67, 0,  16, 2.8,   0, 0.1, 0,    6.2, true),
  R(/coconut/i,                                  660, 3.32,  26,  90, 543, 2.01, 0,   8, 1.5,   0, 0.3, 0,    18.5),
  R(/tahini/i,                                   595, 8.95, 426,  95, 414, 4.62, 0,  98, 0,     1, 0,   0.39, 1.7, true),

  // ── Otros ──
  R(/honey|miel/i,                               304, 0.42,   6,   2,  52, 0.22, 0,   2, 0.5,   0, 0,   0,    0.8),
  R(/cocoa|cacao/i,                              228, 13.86, 128, 499,1524, 6.81, 0,  32, 0,     0, 2.5, 0,   14.3),
  R(/dark.chocolate|chocolate/i,                 598, 11.9,  73, 228, 715, 3.3,  0,  13, 0,     2, 7.3, 0.05, 6.8, true),
  R(/\bevoo\b|olive.oil|aove/i,                  884, 0.56,   1,   0,   1, 0,    0,   0, 0,     0, 60.2, 0.76, 0),
]

// Ingredientes que pesan tan poco o no aportan nada que contar (se ignoran en
// silencio, no cuentan como «sin datos»).
export const MICROS_NEGLIGIBLE = /salt|water|vinegar|black.pepper|paprika|cumin|cinnamon|bay.leaves|oregano|thyme|mint|basil|dill|rosemary|tarragon|saffron|nutmeg|turmeric|za.?atar|cajun|chipotle|sage|vanilla|yeast|soy.sauce|worcestershire|mustard|ketchup|white.wine|balsamic|dried.parsley|cilantro|coconut.oil|beef.suet|suet|lard|ginger|taco.seasoning|espresso|sugar/i

// Productos elaborados cuyo contenido depende de la marca (no se inventa): «sin datos».
export const MICROS_UNSUPPORTED = /ravioli|gnocchi|lasagna|pesto|nachos|\bbuns?\b|bagel|biscuit|ladyfinger|aioli|whey|protein.powder|cold.cuts|salami|pepperoni/i

// Gramos por «ración» de lo que se cuenta por trozo: el medio bote de sardinas,
// etc. (cuando el ingrediente no trae `unitGrams`).
export const FLAT_GRAMS = { 'sardines-half-can': 100, 'sardines-quarter-can': 50, 'mackerel-half-can': 120 }
