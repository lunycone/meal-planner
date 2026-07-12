export const PREP = {
  'lima-cebolla':  { name: 'Lima + cebolla',    items: [{ k: 'lima', p: { units: 0.5 } }, { k: 'cebolla-amarilla', p: { grams: 90 } }] },
  'solo-cebolla':  { name: 'Solo cebolla',      items: [{ k: 'cebolla-amarilla', p: { grams: 90 } }] },
  'tomate-cebolla':{ name: 'Tomate + cebolla',  items: [{ k: 'passata', p: { ml: 180 } }, { k: 'cebolla-amarilla', p: { grams: 90 } }] },
}

export const COMBO = {
  'ens-garbanzos': {
    base: 'legumbres',
    name: 'Ensalada garbanzos',
    items: [
      { k: 'garbanzos',        p: { grams: 80 } },
      { k: 'tomate-fresco',    p: { grams: 80 } },
      { k: 'aguacate',         p: { units: 0.5 } },
      { k: 'cebolla-morada',   p: { grams: 50 } },
      { k: 'feta-vaca',        p: { grams: 30 } },
    ],
  },
  'ens-mediterranea': {
    base: 'otros',
    name: 'Ensalada mediterránea',
    items: [
      { k: 'calabacin',     p: { grams: 100 } },
      { k: 'tomate-fresco', p: { grams: 80 } },
      { k: 'feta-vaca',     p: { grams: 30 } },
      { k: 'parsley',       p: {} },
      { k: 'beet',          p: { grams: 80 } },
    ],
  },
  'burger-bowl': {
    base: 'patata',
    name: 'Burger bowl',
    items: [
      { k: 'patata',         p: { grams: 200 } },
      { k: 'lechuga',        p: { serv: 1 } },
      { k: 'cebolla-amarilla', p: { grams: 50 } },
      { k: 'tomate-fresco',  p: { grams: 80 } },
      { k: 'aguacate',       p: { units: 0.5 } },
      { k: 'cheddar',        p: { grams: 30 } },
      { k: 'sour-cream',     p: { grams: 40 } },
    ],
  },
  'taco-bell': {
    base: 'otros',
    name: 'Taco bell',
    items: [
      { k: 'cheddar',       p: { grams: 30 } },
      { k: 'sour-cream',    p: { grams: 40 } },
      { k: 'tomate-fresco', p: { grams: 80 } },
      { k: 'aguacate',      p: { units: 0.5 } },
      { k: 'lechuga',       p: { serv: 1 } },
      { k: 'nachos',        p: { grams: 40 } },
    ],
  },
  'burrito-bowl': {
    base: 'otros',
    name: 'Burrito bowl',
    items: [
      { k: 'black-beans',    p: { grams: 80 } },
      { k: 'maiz',           p: { grams: 60 } },
      { k: 'cebolla-amarilla', p: { grams: 50 } },
      { k: 'apio',           p: { serv: 1 } },
      { k: 'yogur-cabra',    p: { grams: 50 } },
      { k: 'taco-seasoning', p: {} },
    ],
  },
  'taco-dip': {
    base: 'otros',
    name: 'Taco dip',
    items: [
      { k: 'black-beans',   p: { grams: 80 } },
      { k: 'sour-cream',    p: { grams: 40 } },
      { k: 'cebolla-morada',p: { grams: 50 } },
      { k: 'tomate-fresco', p: { grams: 80 } },
      { k: 'lechuga',       p: { serv: 1 } },
      { k: 'lima',          p: { units: 0.5 } },
      { k: 'aguacate',      p: { units: 0.5 } },
    ],
  },
  'ens-alubias': {
    base: 'legumbres',
    name: 'Ensalada alubias blancas',
    items: [{ k: 'alubias-blancas', p: { grams: 80 } }],
    incomplete: true,
  },
  'ens-lentejas': {
    base: 'legumbres',
    name: 'Ensalada lentejas',
    items: [{ k: 'lentejas-verdes', p: { grams: 80 } }],
    incomplete: true,
  },
  'lentejas-beet-rucula': {
    base: 'legumbres',
    name: 'Lentejas con beet y rúcula',
    items: [
      { k: 'lentejas-verdes', p: { grams: 80 } },
      { k: 'beet',            p: { grams: 80 } },
      { k: 'rucula',          p: { grams: 20 } },
    ],
  },
  'salsa-zanahoria-arroz': {
    base: 'arroz',
    name: 'Salsa zanahoria + arroz',
    blend: { label: 'Salsa', base: false },   // zanahoria+cebolla batidas; el arroz va aparte
    items: [
      { k: 'zanahoria',        p: { grams: 100 } },
      { k: 'arroz',            p: { grams: 75 } },
      { k: 'cebolla-amarilla', p: { grams: 50 } },
      { k: 'sour-cream',       p: { grams: 20 } },
    ],
  },
  'arroz-huevos-veg': {
    base: 'arroz',
    name: 'Arroz + 2 huevos + verde',
    variableIngredients: { huevo: [1, 2, 3] },
    items: [
      { k: 'arroz',  p: { grams: 75 } },
      { k: 'huevo',  p: { units: 2 } },
      { k: 'puerro', p: { units: 0.5 } },
    ],
    note: 'Julio: puerro · María: brócoli / espárragos',
  },
  'ens-legumbres-sc': {
    base: 'legumbres',
    name: 'Ensalada legumbres + sour cream',
    items: [
      { k: 'lentejas-verdes', p: { grams: 80 } },
      { k: 'sour-cream',      p: { grams: 40 } },
    ],
  },
  'lentejas-sep': {
    base: 'legumbres',
    name: 'Lentejas (por separado)',
    items: [{ k: 'lentejas-verdes', p: { grams: 80 } }],
  },
  'pure-patata': {
    base: 'patata',
    name: 'Puré patata + puerro/zanahoria',
    blend: { label: 'Puré', base: true },
    items: [
      { k: 'patata', p: { grams: 200 } },
      { k: 'puerro', p: { units: 0.5 } },
    ],
  },
  'pure-patata-leche-mantequilla': {
    base: 'patata',
    name: 'Puré de patata · leche, mantequilla y pimienta',
    blend: { label: 'Puré', base: true },
    items: [
      { k: 'patata',          p: { grams: 220 } },
      { k: 'leche',           p: { ml: 80 } },
      { k: 'mantequilla',     p: { grams: 20 } },
      { k: 'pimienta-negra',  p: {} },
    ],
  },
  'pure-patata-calabacin': {
    base: 'patata',
    name: 'Puré de patata con calabacín y leche',
    blend: { label: 'Puré', base: true },
    items: [
      { k: 'patata',        p: { grams: 180 } },
      { k: 'calabacin-org', p: { grams: 100 } },
      { k: 'leche',         p: { ml: 60 } },
      { k: 'pimienta-negra',p: {} },
    ],
  },
  'esparragos-j': {
    base: 'otros',
    name: 'Espárragos (María)',
    items: [{ k: 'esparragos', p: { grams: 120 } }],
    jessica: true,
  },
  'pasta-tomate-cross': {
    base: 'pasta',
    name: 'Pasta con tomate',
    items: [
      { k: 'pasta',   p: { grams: 100 } },
      { k: 'passata', p: { ml: 180 } },
    ],
  },
  'arroz-aguacate': {
    base: 'arroz',
    name: 'Arroz + aguacate',
    items: [
      { k: 'arroz',   p: { grams: 75 } },
      { k: 'aguacate',p: { units: 0.5 } },
    ],
  },
  'lentejas-rojas-espinaca': {
    base: 'legumbres',
    name: 'Lentejas rojas + espinaca',
    items: [
      { k: 'lentejas-rojas', p: { grams: 80 } },
      { k: 'espinaca',       p: { grams: 80 } },
      { k: 'zanahoria',      p: { grams: 100 } },
    ],
  },
  'patata-setas-puerro': {
    base: 'patata',
    name: 'Patata asada + setas',
    items: [
      { k: 'patata', p: { grams: 200 } },
      { k: 'setas',  p: { grams: 100 } },
      { k: 'puerro', p: { units: 0.5 } },
    ],
  },
  'patata-puerro-asada': {
    base: 'patata',
    name: 'Patata asada + puerro',
    items: [
      { k: 'patata', p: { grams: 200 } },
      { k: 'puerro', p: { units: 0.5 } },
    ],
  },
  'mejillones-arroz-tomate': {
    base: 'arroz',
    name: 'Arroz + tomate + puerro',
    items: [
      { k: 'arroz',   p: { grams: 75 } },
      { k: 'passata', p: { ml: 150 } },
      { k: 'puerro',  p: { units: 0.5 } },
    ],
  },
  'mejillones-patata-vapor': {
    base: 'patata',
    name: 'Patata al vapor + cebolla morada',
    items: [
      { k: 'patata',         p: { grams: 200 } },
      { k: 'cebolla-morada', p: { grams: 50 } },
      { k: 'parsley',        p: {} },
    ],
  },


  'tortilla-patata-cena': {
    base: 'patata',
    name: 'Tortilla de patata',
    variableIngredients: { huevo: [1, 2, 3, 4, 5] },
    items: [
      { k: 'huevo',              p: { units: 3 } },
      { k: 'patata',             p: { grams: 200 } },
      { k: 'cebolla-amarilla',   p: { grams: 60 } },
      { k: 'suet',               p: { grams: 20 } },
    ],
  },
  'patata-cargada-toppings': {
    base: 'patata',
    name: 'Patata asada + toppings (loaded potato)',
    items: [
      { k: 'patata',             p: { grams: 300 } },
      { k: 'sour-cream',         p: { grams: 50 } },
      { k: 'cheddar',            p: { grams: 40 } },
      { k: 'cebolla-morada',     p: { grams: 40 } },
      { k: 'jalapeno',           p: { units: 1 } },
    ],
  },
  'calabacin-asado-feta': {
    base: 'otros',
    name: 'Calabacín asado + limón + feta',
    items: [
      { k: 'calabacin',          p: { grams: 150 } },
      { k: 'feta-vaca',          p: { grams: 40 } },
      { k: 'limon',              p: { units: 0.5 } },
      { k: 'parsley',            p: {} },
    ],
  },
  'tostadas-aguacate': {
    base: 'otros',
    name: '4 Tostadas de aguacate',
    items: [
      { k: 'pan-masa-madre',     p: { grams: 200 } },
      { k: 'aguacate',           p: { units: 1 } },
      { k: 'tomate-fresco',      p: { grams: 80 } },
      { k: 'limon',              p: { units: 0.5 } },
    ],
  },
  'buckwheat-pesto': {
    base: 'otros',
    name: 'Buckwheat con pesto',
    noAove: true,
    items: [
      { k: 'buckwheat', p: { grams: 70 } },
      { k: 'pesto',     p: { grams: 30 } },
    ],
  },
  'huevos-turcos': {
    base: 'otros',
    name: 'Huevos turcos · yogur, ajo y pimentón',
    noAove: true,
    items: [
      { k: 'yogur-cabra', p: { grams: 120 } },
      { k: 'mantequilla', p: { grams: 15 } },
      { k: 'ajo',         p: {} },
      { k: 'pimenton',    p: {} },
      { k: 'arroz',       p: { grams: 50 } },
    ],
  },
  'tortilla-esparragos-beet-rabanos': {
    base: 'otros',
    name: 'Con espárragos, remolacha y rábanos',
    items: [
      { k: 'esparragos', p: { grams: 80 } },
      { k: 'beet',       p: { grams: 60 } },
      { k: 'rabanos',    p: { grams: 60 } },
      { k: 'arroz',      p: { grams: 50 } },
    ],
  },
  'hot-dog': {
    base: 'otros',
    name: 'Hot dog',
    items: [
      { k: 'hot-dog-buns', p: { units: 2 } },
      { k: 'mostaza',      p: { grams: 20 } },
      { k: 'ketchup',      p: { grams: 20 } },
    ],
  },
  'bocadillo-tortilla-patata': {
    base: 'otros',
    name: 'Bocadillo tortilla de patata',
    items: [
      { k: 'pan-masa-madre',  p: { grams: 180 } },
      { k: 'patata',          p: { grams: 100 } },
      { k: 'cebolla-amarilla',p: { grams: 60 } },
    ],
  },
  'bocadillo': {
    base: 'otros',
    name: 'Bocadillo',
    items: [
      { k: 'pan-masa-madre', p: { grams: 120 } },
    ],
    optionalItems: [
      { k: 'lechuga',        p: { serv: 1 } },
      { k: 'tomate-fresco',  p: { grams: 80 } },
      { k: 'aguacate',       p: { units: 0.5 } },
      { k: 'pimiento-verde', p: { grams: 60 } },
      { k: 'jalapeno',       p: { units: 1 } },
      { k: 'feta-vaca',      p: { grams: 30 } },
      { k: 'mostaza',        p: { grams: 10 } },
      { k: 'mayonesa',       p: { grams: 25 } },
      { k: 'bacon',          p: { grams: 40 } },
    ],
  },
  'ensalada-eataly': {
    base: 'otros',
    name: 'Ensalada Eataly (panzanella)',
    items: [
      { k: 'pan-masa-madre',  p: { grams: 60 } },
      { k: 'tomate-fresco',   p: { grams: 120 } },
      { k: 'pepino-ingles',   p: { grams: 100 } },
      { k: 'cebolla-morada',  p: { grams: 40 } },
      { k: 'vinagre',         p: { ml: 15 } },
    ],
  },

  // ── ECONÓMICOS (abundantes pero baratos · sin puerro) ────────────────────────
  'pure-patata-zanahoria': {
    base: 'patata',
    name: 'Puré patata-zanahoria + cebolla pochada',
    blend: { label: 'Puré', base: true },   // patata + zanahoria + cebolla se baten juntos
    items: [
      { k: 'patata',           p: { grams: 200 } },
      { k: 'zanahoria',        p: { grams: 80 } },
      { k: 'cebolla-amarilla', p: { grams: 60 } },
      { k: 'parsley',          p: {} },
    ],
  },
  'arroz-tomate-cebolla': {
    base: 'arroz',
    name: 'Arroz + tomate + cebolla',
    items: [
      { k: 'arroz',            p: { grams: 75 } },
      { k: 'passata',          p: { ml: 150 } },
      { k: 'cebolla-amarilla', p: { grams: 60 } },
      { k: 'parsley',          p: {} },
    ],
  },
  'patata-setas-zanahoria': {
    base: 'patata',
    name: 'Patata + setas + zanahoria',
    items: [
      { k: 'patata',           p: { grams: 200 } },
      { k: 'setas',            p: { grams: 70 } },
      { k: 'cebolla-amarilla', p: { grams: 60 } },
      { k: 'zanahoria',        p: { grams: 80 } },
      { k: 'parsley',          p: {} },
    ],
  },
  'arroz-sofrito': {
    base: 'arroz',
    name: 'Arroz sofrito',
    items: [
      { k: 'arroz',            p: { grams: 75 } },
      { k: 'passata',          p: { ml: 80 } },
      { k: 'zanahoria',        p: { grams: 80 } },
      { k: 'cebolla-amarilla', p: { grams: 60 } },
      { k: 'parsley',          p: {} },
    ],
  },
  'bandeja-asada-patata-zanahoria': {
    base: 'patata',
    name: 'Bandeja asada patata-zanahoria',
    items: [
      { k: 'patata',           p: { grams: 200 } },
      { k: 'zanahoria',        p: { grams: 100 } },
      { k: 'cebolla-amarilla', p: { grams: 60 } },
      { k: 'parsley',          p: {} },
    ],
  },
  'arroz-langosta-cremoso': {
    base: 'arroz',
    name: 'Arroz cremoso · mantequilla, cebolla y sour cream',
    items: [
      { k: 'arroz',            p: { grams: 80 } },
      { k: 'mantequilla',      p: { grams: 20 } },
      { k: 'cebolla-amarilla', p: { grams: 60 } },
      { k: 'leche',            p: { ml: 80 } },
      { k: 'sour-cream',       p: { grams: 40 } },
    ],
  },
  'patata-setas-cebolla': {
    base: 'patata',
    name: 'Patata asada + setas + cebolla',
    items: [
      { k: 'patata',           p: { grams: 200 } },
      { k: 'setas',            p: { grams: 100 } },
      { k: 'cebolla-amarilla', p: { grams: 80 } },
    ],
  },
  'patata-setas-esparragos': {
    base: 'patata',
    name: 'Patata asada + setas + espárragos',
    items: [
      { k: 'patata',           p: { grams: 200 } },
      { k: 'setas',            p: { grams: 80 } },
      { k: 'esparragos',       p: { grams: 120 } },
    ],
  },

  // ── DESAYUNOS ────────────────────────────────────────────────────────────────
  'desayuno-cheesecake-yogur': { tag: 'yogur', flags: ['rapido'], name: 'Cheesecake yogur cabra', variableIngredients: { huevo: [1, 2] }, items: [{ k: 'yogur-cabra', p: { grams: 170 } },{ k: 'huevo', p: { units: 1 } },{ k: 'arandanos', p: { grams: 10 } },{ k: 'canela', p: {} },] },
  'desayuno-tortilla-aguacate': { tag: 'huevo', flags: ['rapido'], name: 'Tortilla francesa + aguacate + setas', variableIngredients: { huevo: [1, 2, 3] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'aguacate', p: { units: 0.5 } },{ k: 'setas', p: { grams: 80 } },{ k: 'espinaca', p: { grams: 60 } },] },
  'desayuno-overnight-oats': { tag: 'batch', flags: ['batch'], name: 'Overnight oats', items: [{ k: 'avena', p: { grams: 50 } },{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'arandanos', p: { grams: 40 } },] },
  'desayuno-bowl-caballa': { tag: 'huevo', flags: ['rapido'], name: 'Bowl caballa + aguacate + limón', items: [{ k: 'caballa-media', p: {} },{ k: 'aguacate', p: { units: 0.5 } },{ k: 'limon', p: { units: 0.5 } },{ k: 'queso-cabra', p: { grams: 20 } },] },
  'desayuno-waffles-avena': { tag: 'ocasional', flags: ['ocasional'], name: 'Waffles avena + queso + berries', variableIngredients: { huevo: [1, 2] }, items: [{ k: 'avena', p: { grams: 60 } },{ k: 'huevo', p: { units: 1 } },{ k: 'arandanos', p: { grams: 40 } },{ k: 'feta-vaca', p: { grams: 30 } },] },
  'desayuno-tortilla-queso-fruta': { tag: 'huevo', flags: ['rapido'], name: 'Tortilla francesa + queso + fruta', variableIngredients: { huevo: [1, 2, 3] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'feta-vaca', p: { grams: 30 } },{ k: 'arandanos', p: { grams: 60 } },] },
  'desayuno-huevos-al-horno': { tag: 'huevo', flags: ['rapido'], name: 'Shakshuka (huevos + espinaca)', variableIngredients: { huevo: [1, 2, 3] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'passata', p: { ml: 100 } },{ k: 'espinaca', p: { grams: 60 } },{ k: 'feta-vaca', p: { grams: 20 } },] },
  'desayuno-tortilla-patata': { tag: 'huevo', flags: ['batch'], name: 'Tortilla de patata (batch)', variableIngredients: { huevo: [1, 2, 3, 4] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'patata', p: { grams: 150 } },{ k: 'cebolla-amarilla', p: { grams: 50 } },{ k: 'suet', p: { grams: 15 } },] },
  'desayuno-egg-muffins': { tag: 'huevo', flags: ['batch'], name: 'Egg Muffins Espinaca + Passata (batch)', variableIngredients: { huevo: [1, 2, 3] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'espinaca', p: { grams: 50 } },{ k: 'passata', p: { ml: 30 } },{ k: 'queso-cabra', p: { grams: 25 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-omelette-feta': { tag: 'huevo', flags: ['rapido'], name: 'Omelette Feta + Orégano', variableIngredients: { huevo: [1, 2, 3] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'feta-vaca', p: { grams: 40 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-pizza-sardinas-light': { tag: 'huevo', flags: ['batch'], name: 'Pizza Sardinas Light (batch)', variableIngredients: { huevo: [1, 2, 3] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'sardina-cuarto', p: {} },{ k: 'tomate-fresco', p: { grams: 40 } },{ k: 'cebolla-amarilla', p: { grams: 30 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-pizza-sardinas-max': { tag: 'huevo', flags: ['batch'], name: 'Pizza Sardinas Proteína Máxima (batch)', variableIngredients: { huevo: [1, 2, 3] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'sardina-media', p: {} },{ k: 'passata', p: { ml: 30 } },{ k: 'feta-vaca', p: { grams: 30 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-yogur-almendras-pumpkin': { tag: 'yogur', flags: ['rapido'], name: 'Yogur · Almendras · Pumpkin · Chocolate', items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'almendras', p: { grams: 20 } },{ k: 'pumpkin-seeds', p: { grams: 20 } },{ k: 'chocolate-negro', p: { grams: 15 } },{ k: 'canela', p: {} },] },
  'desayuno-yogur-pumpkin-coco': { tag: 'yogur', flags: ['rapido'], name: 'Yogur · Pumpkin Seeds · Coco · Canela', items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'pumpkin-seeds', p: { grams: 50 } },{ k: 'coco-rallado', p: { grams: 20 } },{ k: 'canela', p: {} },] },
  'desayuno-batido-yogur-leche-avena': { tag: 'batido', flags: ['rapido'], name: 'Batido: Yogur · Leche · Avena · Canela', items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'leche', p: { grams: 200 } },{ k: 'avena', p: { grams: 50 } },{ k: 'canela', p: {} },] },
  'desayuno-batido-leche-avena-banana': { tag: 'batido', flags: ['rapido'], name: 'Batido: Leche · Avena · Canela · Banana', items: [{ k: 'leche', p: { grams: 250 } },{ k: 'avena', p: { grams: 50 } },{ k: 'banana', p: { grams: 100 } },{ k: 'canela', p: {} },] },
  'desayuno-batido-leche-yogur-chocolate': { tag: 'batido', flags: ['rapido'], name: 'Batido: Leche · Yogur · Chocolate · Arándanos', items: [{ k: 'leche', p: { grams: 200 } },{ k: 'yogur-cabra', p: { grams: 100 } },{ k: 'chocolate-negro', p: { grams: 20 } },{ k: 'arandanos', p: { grams: 10 } },] },
  // Merienda económica: avena + leche mínima + banana + agua (implícita) · ~$0.50 · ~300 kcal
  'desayuno-batido-avena-economico': { tag: 'batido', flags: ['rapido', 'economico'], name: 'Batido económico: Avena · Banana · Leche · Canela', items: [{ k: 'avena', p: { grams: 50 } },{ k: 'banana', p: { grams: 120 } },{ k: 'leche', p: { grams: 100 } },{ k: 'canela', p: {} },] },
  'desayuno-yogur-sunflower-arandanos': { tag: 'yogur', flags: ['rapido'], name: 'Yogur · Sunflower Seeds · Arándanos', items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'sunflower-seeds', p: { grams: 25 } },{ k: 'arandanos', p: { grams: 25 } },] },
  'desayuno-huevo-queso': { tag: 'huevo', flags: ['rapido'], name: 'Huevo · Queso Feta · Simple', variableIngredients: { huevo: [1, 2, 3] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'feta-vaca', p: { grams: 30 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-brownie-chocolate': { tag: 'ocasional', flags: ['ocasional'], name: 'Brownie Chocolate Desayuno', variableIngredients: { huevo: [1, 2] }, items: [{ k: 'huevo', p: { units: 2 } },{ k: 'chocolate-negro', p: { grams: 30 } },{ k: 'almendras', p: { grams: 40 } },{ k: 'mantequilla', p: { grams: 20 } },{ k: 'canela', p: {} },] },
  'desayuno-magdalenas': { tag: 'ocasional', flags: ['ocasional'], name: 'Magdalenas yogur (ocasional)', variableIngredients: { huevo: [1, 2] }, items: [{ k: 'huevo', p: { units: 1 } },{ k: 'yogur-cabra', p: { grams: 80 } },{ k: 'harina', p: { grams: 60 } },{ k: 'azucar', p: { grams: 15 } },{ k: 'mantequilla', p: { grams: 25 } },] },
  'desayuno-magdalenas-chocolate': { tag: 'ocasional', flags: ['ocasional'], name: 'Magdalenas chocolate (ocasional)', variableIngredients: { huevo: [1, 2] }, items: [{ k: 'huevo', p: { units: 1 } },{ k: 'yogur-cabra', p: { grams: 80 } },{ k: 'harina', p: { grams: 60 } },{ k: 'azucar', p: { grams: 15 } },{ k: 'mantequilla', p: { grams: 25 } },{ k: 'chocolate-negro', p: { grams: 20 } },] },
  'desayuno-yogur-huevo-avena': { tag: 'yogur', flags: ['rapido'], name: 'Yogur cabra + huevo + avena', variableIngredients: { huevo: [1, 2] }, items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'huevo', p: { units: 1 } },{ k: 'avena', p: { grams: 50 } },] },
  'desayuno-tortitas-mantequilla-arandanos': { tag: 'tortita', flags: ['ocasional'], name: 'Tortitas · Mantequilla · Arándanos', variableIngredients: { huevo: [1, 2] }, items: [{ k: 'harina', p: { grams: 80 } },{ k: 'huevo', p: { units: 1 } },{ k: 'leche', p: { ml: 100 } },{ k: 'mantequilla', p: { grams: 15 } },{ k: 'arandanos', p: { grams: 60 } },] },
}

// Which combos each protein group gets
export const COMBO_SETS = {
  shared: [
    'ens-garbanzos','ens-mediterranea','burger-bowl','taco-bell',
    'burrito-bowl','taco-dip','ens-alubias','ens-lentejas',
    'lentejas-beet-rucula','arroz-aguacate','lentejas-rojas-espinaca','patata-setas-puerro',
    'calabacin-asado-limon','esparragos-feta-vinagre','verduras-arco-iris','espinaca-queso-crema',
    'puerro-crema-limon','coliflor-tahini','lentejas-rojas-con-curry','black-beans-cumin',
    'alubias-tomate-oregano','tomate-feta-pepino-verano','aguacate-tomate-cilantro','patata-crema-setas-invierno',
    'zanahoria-puerro-pure-calido','lentejas-mediterranea-beet','arroz-cilantro-lima-asiatico','garbanzos-tostados-citrico',
    'pasta-salsa-tomate-batch','arroz-tomado-comino','ensalada-eataly','bocadillo','bocadillo-tortilla-patata',
    'pure-patata-zanahoria','pure-patata-leche-mantequilla','pure-patata-calabacin','arroz-tomate-cebolla','patata-setas-zanahoria','patata-puerro-asada','patata-setas-cebolla','patata-setas-esparragos','arroz-sofrito','bandeja-asada-patata-zanahoria',
    'huevos-turcos','tortilla-esparragos-beet-rabanos','buckwheat-pesto',
  ],
  salchichas: [
    'hot-dog',
    'ens-garbanzos','ens-mediterranea','burger-bowl','taco-bell','burrito-bowl','taco-dip','ens-alubias','ens-lentejas',
    'lentejas-beet-rucula','arroz-aguacate','lentejas-rojas-espinaca','patata-setas-puerro','patata-setas-cebolla',
    'calabacin-asado-limon','esparragos-feta-vinagre','verduras-arco-iris','espinaca-queso-crema',
    'pure-patata-zanahoria','pure-patata-leche-mantequilla','arroz-tomate-cebolla','patata-setas-zanahoria',
    'patata-puerro-asada','patata-crema-setas-invierno','arroz-sofrito','bandeja-asada-patata-zanahoria',
    'pasta-salsa-tomate-batch','bocadillo','bocadillo-tortilla-patata',
  ],
  langosta: [
    'arroz-langosta-cremoso',
    'ens-garbanzos','ens-mediterranea','burger-bowl','taco-bell','burrito-bowl','taco-dip','ens-alubias','ens-lentejas',
    'lentejas-beet-rucula','arroz-aguacate','lentejas-rojas-espinaca','patata-setas-puerro','patata-setas-cebolla',
    'calabacin-asado-limon','esparragos-feta-vinagre','verduras-arco-iris','espinaca-queso-crema',
    'puerro-crema-limon','coliflor-tahini','lentejas-rojas-con-curry','black-beans-cumin',
    'alubias-tomate-oregano','tomate-feta-pepino-verano','aguacate-tomate-cilantro','patata-crema-setas-invierno',
    'zanahoria-puerro-pure-calido','lentejas-mediterranea-beet','arroz-cilantro-lima-asiatico','garbanzos-tostados-citrico',
    'pasta-salsa-tomate-batch','arroz-tomado-comino','ensalada-eataly','bocadillo',
    'pure-patata-zanahoria','arroz-tomate-cebolla','patata-setas-zanahoria','arroz-sofrito','bandeja-asada-patata-zanahoria',
  ],
  lomo:          ['salsa-zanahoria-arroz','ens-garbanzos','ens-mediterranea','burger-bowl','taco-bell','burrito-bowl','taco-dip','ens-alubias','ens-lentejas','lentejas-beet-rucula','arroz-aguacate','lentejas-rojas-espinaca','patata-setas-puerro','calabacin-asado-limon','esparragos-feta-vinagre','verduras-arco-iris','espinaca-queso-crema','puerro-crema-limon','lentejas-rojas-con-curry','black-beans-cumin','alubias-tomate-oregano','patata-crema-setas-invierno','zanahoria-puerro-pure-calido','lentejas-mediterranea-beet','arroz-cilantro-lima-asiatico','garbanzos-tostados-citrico','pasta-salsa-tomate-batch','arroz-tomado-comino','pure-patata-zanahoria','arroz-tomate-cebolla','patata-setas-zanahoria','arroz-sofrito','bandeja-asada-patata-zanahoria'],
  'higado-bacalao': ['arroz-huevos-veg','ens-legumbres-sc','coliflor-tahini','tomate-feta-pepino-verano'],
  'higado-vaca':    ['lentejas-sep','pure-patata','esparragos-j','verduras-arco-iris','espinaca-queso-crema','zanahoria-puerro-pure-calido'],
  sardinas:         ['pasta-tomate-cross','ens-garbanzos','ens-mediterranea','burger-bowl','taco-bell','burrito-bowl','taco-dip','ens-alubias','ens-lentejas','lentejas-beet-rucula','arroz-aguacate','lentejas-rojas-espinaca','patata-setas-puerro','calabacin-asado-limon','esparragos-feta-vinagre','tomate-feta-pepino-verano','patata-crema-setas-invierno','lentejas-mediterranea-beet','pasta-salsa-tomate-batch','ensalada-eataly','bocadillo','pure-patata-zanahoria','arroz-tomate-cebolla','patata-setas-zanahoria','arroz-sofrito','bandeja-asada-patata-zanahoria'],
  mejillones:       ['mejillones-arroz-tomate','mejillones-patata-vapor','ens-mediterranea','arroz-aguacate','patata-setas-puerro','pure-patata','esparragos-feta-vinagre','verduras-arco-iris','espinaca-queso-crema'],
  desayuno: [
    'desayuno-cheesecake-yogur','desayuno-tortilla-aguacate',
    'desayuno-overnight-oats','desayuno-bowl-caballa','desayuno-waffles-avena',
    'desayuno-tortilla-queso-fruta','desayuno-huevos-al-horno','desayuno-yogur-huevo-avena',
    'desayuno-tortilla-patata','desayuno-egg-muffins','desayuno-omelette-feta',
    'desayuno-pizza-sardinas-light','desayuno-pizza-sardinas-max',
    'desayuno-yogur-almendras-pumpkin','desayuno-yogur-pumpkin-coco',
    'desayuno-batido-yogur-leche-avena','desayuno-batido-leche-avena-banana','desayuno-batido-leche-yogur-chocolate',
    'desayuno-yogur-sunflower-arandanos','desayuno-huevo-queso',
    'desayuno-brownie-chocolate','desayuno-magdalenas','desayuno-magdalenas-chocolate',
    'desayuno-tortitas-mantequilla-arandanos',
  ],
}
