// Single source of truth for all ingredients.
// Campos precio: per100 ($/100g) · perUnit ($/ud) · perML ($/ml) · perServing ($/plato) · flat
// Campos kcal:   kc (kcal/100g) · kcu (kcal/ud) · kcml (kcal/ml) · kcs (kcal/plato) · kcf
// NOTA: legumbres/arroz/pasta en PESO SECO → kcal en seco.

export const ING = {
  // BASES
  patata:          { name: 'Patata',              cat: 'base',     per100: 0.093, kc: 77,  pack: '50 lb · $21.19',         per: '200g → $0.19' },
  arroz:           { name: 'Arroz',               cat: 'base',     per100: 0.18,  kc: 360, pack: '20 kg · $36.69',         per: '75g seco → $0.14' },
  pasta:           { name: 'Pasta',               cat: 'base',     per100: 0.66,  kc: 360, pack: '1 lb · $3.00',           per: '100g seco → $0.66' },
  maiz:            { name: 'Maíz congelado',      cat: 'base',     per100: 1.11,  kc: 85,  pack: '450 g · $4.99',          per: '60g → $0.67' },
  alcachofa:       { name: 'Alcachofa',           cat: 'base',     perUnit: 1.99, kcu: 67, pack: 'ud · $1.99',             per: 'ud → $1.99 · 67 kcal' },
  'pan-masa-madre':{ name: 'Pan masa madre',      cat: 'base',     per100: 0.70, kc: 265,  pack: 'hogaza · $7.00',          per: '100g → $0.70 · 265 kcal' },

  // LEGUMBRES (peso seco)
  'lentejas-rojas':  { name: 'Lentejas rojas',    cat: 'legumbre', per100: 0.15,  kc: 340, pack: '55 lb · $36.69',         per: '80g seco → $0.12' },
  'lentejas-verdes': { name: 'Lentejas verdes',   cat: 'legumbre', per100: 0.27,  kc: 350, pack: '10 lb · $12.09',         per: '80g seco → $0.22' },
  garbanzos:         { name: 'Garbanzos',         cat: 'legumbre', per100: 0.17,  kc: 364, pack: '55 lb · $42.99',         per: '80g seco → $0.14' },
  'black-beans':     { name: 'Black beans',       cat: 'legumbre', per100: 0.27,  kc: 340, pack: '10 lb · $12.09',         per: '80g seco → $0.22' },
  'alubias-blancas': { name: 'Alubias blancas',   cat: 'legumbre', per100: 0.42,  kc: 330, pack: '10 lb · $18.89',         per: '80g seco → $0.34' },
  cranberry:         { name: 'Cranberry beans',   cat: 'legumbre', per100: 0.44,  kc: 335, pack: '10 lb · $19.79',         per: '80g seco → $0.35' },

  // FRESCOS
  aguacate:          { name: 'Aguacate',          cat: 'fresco',   perUnit: 1.00, kcu: 250, pack: '1 ud · $1.00',          per: '½ → $0.50 · 125 kcal' },
  passata:           { name: 'Tomate passata',    cat: 'fresco',   perML: 0.004861, kcml: 0.33, pack: '720 ml · $3.50',   per: '½ bote → $1.75' },
  'cebolla-amarilla':{ name: 'Cebolla amarilla',  cat: 'fresco',   per100: 0.185, kc: 40,  pack: '10 lb · $8.39',         per: 'media ~$0.17' },
  'cebolla-morada':  { name: 'Cebolla morada',    cat: 'fresco',   per100: 0.216, kc: 40,  pack: '10 lb · $9.79',         per: 'media ~$0.20' },
  beet:              { name: 'Beet',              cat: 'fresco',   per100: 0.30,  kc: 43,  pack: '5 lb · $6.89',          per: 'med. ~$0.24' },
  lechuga:           { name: 'Lechuga',           cat: 'fresco',   perServing: 0.40, kcs: 10, pack: 'ud · $4.00',         per: '~$0.40/plato' },
  rucula:            { name: 'Rúcula',            cat: 'fresco',   per100: 2.11,  kc: 25,  pack: '900 g · $19.00',        per: 'solo batch' },
  zanahoria:         { name: 'Zanahoria',         cat: 'fresco',   per100: 0.33,  kc: 41,  pack: '5 lb · $7.49',          per: 'med. ~$0.20' },
  espinaca:          { name: 'Espinaca congelada',cat: 'fresco',   per100: 1.11,  kc: 23,  pack: '450 g · $4.99',         per: '80g → $0.89' },
  puerro:            { name: 'Puerro',            cat: 'fresco',   perUnit: 2.00, kcu: 55,  pack: '3 ud · $5.99',         per: '½ → $1.00 · 27 kcal' },
  'tomate-fresco':   { name: 'Tomate fresco (vine)', cat: 'fresco', per100: 0.88, kc: 18,  pack: '~0.14kg · $1.23',       per: '80g → $0.70 · 14 kcal' },
  'calabacin-a1':    { name: 'Calabacín A1',      cat: 'fresco',   per100: 0.45,  kc: 17,  pack: '5 lb · $10.29 (~2.27kg)', per: '100g → $0.45', note: 'solo si hay batch grande esa semana' },
  'calabacin-org':   { name: 'Calabacín orgánico',cat: 'fresco',   per100: 0.66,  kc: 17,  pack: '~0.23kg · $1.50',       per: '100g → $0.66', note: 'más manejable para semanas normales' },
  calabacin:         { name: 'Calabacín',         cat: 'fresco',   per100: 0.45,  kc: 17,  pack: 'A1 ref.',                per: '100g → $0.45', hideInTable: true },
  esparragos:        { name: 'Espárragos',        cat: 'fresco',   per100: 0.44,  kc: 20,  pack: '~0.68 kg · $2.97',      per: '120g → $0.53', jessica: true },
  brocoli:           { name: 'Brócoli',           cat: 'fresco',   per100: 0.55,  kc: 34,  pack: 'estimado · Jessica',    per: '—', est: true, jessica: true },
  'pimiento-verde': { name: 'Pimiento verde',   cat: 'fresco',   per100: 0.86,  kc: 30,  pack: '~0.28kg · $2.42',        per: '100g → $0.86 · 30 kcal' },
  jalapeno:          { name: 'Jalapeno',          cat: 'fresco',   per100: 0.95,  kc: 29,  pack: 'ud ~40g · $0.38',       per: 'ud → $0.38 · 12 kcal' },
  'green-beans':     { name: 'Ejotes / Green beans', cat: 'fresco', per100: 0.60,  kc: 31,  pack: 'bunch ~0.08kg · $0.48', per: '80g → $0.48 · 25 kcal' },

  // LÁCTEOS
  'feta-vaca':    { name: 'Feta (Krinos)',    cat: 'lacteo', per100: 1.59, kc: 265, pack: '3 kg · $47.59',   per: '30g → $0.48 · 80 kcal', tag: 'vaca' },
  'feta-oveja':   { name: 'Feta',            cat: 'lacteo', per100: 3.50, kc: 265, pack: '400 g · $13.99',  per: '30g → $1.05', tag: 'oveja' },
  'queso-cabra':  { name: 'Queso de cabra',  cat: 'lacteo', per100: 2.90, kc: 290, pack: '1 kg · $28.99',   per: '30g → $0.87' },
  cheddar:        { name: 'Cheddar',         cat: 'lacteo', per100: 4.90, kc: 400, pack: '300 g · $14.69',  per: '30g → $1.47 · 120 kcal' },
  'yogur-cabra':  { name: 'Yogur de cabra',  cat: 'lacteo', per100: 0.57, kc: 70,  pack: '750 g · $4.29',   per: '50g → $0.29' },
  'sour-cream':   { name: 'Sour cream',      cat: 'lacteo', per100: 0.70, kc: 190, pack: '500 ml · $3.49',  per: '40g → $0.28 · 76 kcal' },
  nachos:         { name: 'Nachos',          cat: 'lacteo', per100: 1.83, kc: 500, pack: '240 g · $4.39',   per: '40g → $0.73 · 200 kcal' },

  // OTROS
  aceite:           { name: 'Aceite de oliva',  cat: 'otro', flat: 0,    kcf: 0,  pack: 'ya tienes',        per: '~120 kcal/cda · NO contado' },
  lima:             { name: 'Lima',             cat: 'otro', perUnit: 1.00, kcu: 20, pack: 'ud · $1.00',    per: '½ → $0.50' },
  limon:            { name: 'Limón',            cat: 'otro', perUnit: 1.00, kcu: 17, pack: 'ud · $1.00',    per: '½ → $0.50' },
  apio:             { name: 'Apio',             cat: 'otro', perServing: 0.45, kcs: 8, pack: 'ud · $4.49',  per: '~$0.45/plato' },
  pan:              { name: 'Pan sourdough',    cat: 'otro', perUnit: 6.50, kcu: 0, pack: 'pieza · $6–7',   per: '~260 kcal/100g' },
  setas:            { name: 'Setas frescas',    cat: 'otro', per100: 1.54, kc: 22, pack: '227 g · $3.49',   per: '100g → $1.54' },
  mejillones:       { name: 'Mejillones (Canadian Cove Organic)', cat: 'otro', per100: 0.771, kc: 172, pack: '907 g · $6.99', per: '150g → $1.16 · 258 kcal' },
  'cerdo-picado':   { name: 'Cerdo picado (Heritage, Linton)', cat: 'otro', per100: 1.899, kc: 260, pack: 'kg · $18.99', per: '100g → $1.90 · 260 kcal' },
  mostaza:          { name: 'Mostaza (Koops)',  cat: 'otro', per100: 0.98, kc: 66, pack: '340 g · $3.33',   per: 'uso mínimo' },
  'taco-seasoning': { name: 'Taco seasoning',  cat: 'otro', flat: 0.10,   kcf: 15, pack: 'estimado',        per: '—', est: true },
  parsley:          { name: 'Perejil',          cat: 'otro', flat: 0.10,   kcf: 2,  pack: 'estimado',        per: '—', est: true },
  huevo:            { name: 'Huevo',            cat: 'otro', perUnit: 0.488, kcu: 72, pack: 'docena · $5.85', per: 'ud → $0.49 · 72 kcal' },
  tahini:           { name: 'Tahini',           cat: 'otro', pend: true,   pack: '—', per: 'taco dip, hummus' },
  'tomate-conserva':{ name: 'Tomate cherry/conserva', cat: 'otro', pend: true, pack: '—', per: 'ensaladas' },
  vinagre:          { name: 'Vinagre',          cat: 'otro', pend: true,   pack: '—', per: 'alioli, vinagretas' },
  alioli:           { name: 'Alioli',           cat: 'otro', pend: true,   pack: '—', per: 'calamares' },
}

export const CAT_LABELS = {
  base:    'Bases',
  legumbre:'Legumbres',
  fresco:  'Frescos y toppings',
  lacteo:  'Lácteos y quesos',
  otro:    'Otros',
}

export const CAT_ORDER = ['base', 'legumbre', 'fresco', 'lacteo', 'otro']
