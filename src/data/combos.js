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
    items: [
      { k: 'patata', p: { grams: 200 } },
      { k: 'puerro', p: { units: 0.5 } },
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

  // ── DESAYUNOS ────────────────────────────────────────────────────────────────
  'desayuno-cheesecake-yogur': { tag: 'yogur', flags: ['rapido'], name: 'Cheesecake yogur cabra', items: [{ k: 'yogur-cabra', p: { grams: 170 } },{ k: 'huevo', p: { units: 1 } },{ k: 'arandanos', p: { grams: 10 } },{ k: 'canela', p: {} },] },
  'desayuno-tortilla-aguacate': { tag: 'huevo', flags: ['rapido'], name: 'Tortilla francesa + aguacate + setas', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'aguacate', p: { units: 0.5 } },{ k: 'setas', p: { grams: 80 } },{ k: 'espinaca', p: { grams: 60 } },] },
  'desayuno-overnight-oats': { tag: 'batch', flags: ['batch'], name: 'Overnight oats', items: [{ k: 'avena', p: { grams: 50 } },{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'arandanos', p: { grams: 40 } },] },
  'desayuno-bowl-caballa': { tag: 'huevo', flags: ['rapido'], name: 'Bowl caballa + aguacate + limón', items: [{ k: 'caballa-media', p: {} },{ k: 'aguacate', p: { units: 0.5 } },{ k: 'limon', p: { units: 0.5 } },{ k: 'queso-cabra', p: { grams: 20 } },] },
  'desayuno-waffles-avena': { tag: 'ocasional', flags: ['ocasional'], name: 'Waffles avena + queso + berries', items: [{ k: 'avena', p: { grams: 60 } },{ k: 'huevo', p: { units: 1 } },{ k: 'arandanos', p: { grams: 40 } },{ k: 'feta-vaca', p: { grams: 30 } },] },
  'desayuno-tortilla-queso-fruta': { tag: 'huevo', flags: ['rapido'], name: 'Tortilla francesa + queso + fruta', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'feta-vaca', p: { grams: 30 } },{ k: 'arandanos', p: { grams: 60 } },] },
  'desayuno-huevos-al-horno': { tag: 'huevo', flags: ['rapido'], name: 'Shakshuka (huevos + espinaca)', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'passata', p: { ml: 100 } },{ k: 'espinaca', p: { grams: 60 } },{ k: 'feta-vaca', p: { grams: 20 } },] },
  'desayuno-tortilla-patata': { tag: 'huevo', flags: ['batch'], name: 'Tortilla de patata (batch)', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'patata', p: { grams: 150 } },{ k: 'cebolla-amarilla', p: { grams: 50 } },{ k: 'suet', p: { grams: 15 } },] },
  'desayuno-egg-muffins': { tag: 'huevo', flags: ['batch'], name: 'Egg Muffins Espinaca + Passata (batch)', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'espinaca', p: { grams: 50 } },{ k: 'passata', p: { ml: 30 } },{ k: 'queso-cabra', p: { grams: 25 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-omelette-feta': { tag: 'huevo', flags: ['rapido'], name: 'Omelette Feta + Orégano', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'feta-vaca', p: { grams: 40 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-pizza-sardinas-light': { tag: 'huevo', flags: ['batch'], name: 'Pizza Sardinas Light (batch)', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'sardina-cuarto', p: {} },{ k: 'tomate-fresco', p: { grams: 40 } },{ k: 'cebolla-amarilla', p: { grams: 30 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-pizza-sardinas-max': { tag: 'huevo', flags: ['batch'], name: 'Pizza Sardinas Proteína Máxima (batch)', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'sardina-media', p: {} },{ k: 'passata', p: { ml: 30 } },{ k: 'feta-vaca', p: { grams: 30 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-yogur-almendras-pumpkin': { tag: 'yogur', flags: ['rapido'], name: 'Yogur · Almendras · Pumpkin · Chocolate', items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'almendras', p: { grams: 20 } },{ k: 'pumpkin-seeds', p: { grams: 20 } },{ k: 'chocolate-negro', p: { grams: 15 } },{ k: 'canela', p: {} },] },
  'desayuno-yogur-pumpkin-coco': { tag: 'yogur', flags: ['rapido'], name: 'Yogur · Pumpkin Seeds · Coco · Canela', items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'pumpkin-seeds', p: { grams: 50 } },{ k: 'coco-rallado', p: { grams: 20 } },{ k: 'canela', p: {} },] },
  'desayuno-batido-yogur-leche-avena': { tag: 'batido', flags: ['rapido'], name: 'Batido: Yogur · Leche · Avena · Canela', items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'leche', p: { grams: 200 } },{ k: 'avena', p: { grams: 50 } },{ k: 'canela', p: {} },] },
  'desayuno-batido-leche-avena-banana': { tag: 'batido', flags: ['rapido'], name: 'Batido: Leche · Avena · Canela · Banana', items: [{ k: 'leche', p: { grams: 250 } },{ k: 'avena', p: { grams: 50 } },{ k: 'banana', p: { grams: 100 } },{ k: 'canela', p: {} },] },
  'desayuno-batido-leche-yogur-chocolate': { tag: 'batido', flags: ['rapido'], name: 'Batido: Leche · Yogur · Chocolate · Arándanos', items: [{ k: 'leche', p: { grams: 200 } },{ k: 'yogur-cabra', p: { grams: 100 } },{ k: 'chocolate-negro', p: { grams: 20 } },{ k: 'arandanos', p: { grams: 10 } },] },
  'desayuno-yogur-sunflower-arandanos': { tag: 'yogur', flags: ['rapido'], name: 'Yogur · Sunflower Seeds · Arándanos', items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'sunflower-seeds', p: { grams: 25 } },{ k: 'arandanos', p: { grams: 25 } },] },
  'desayuno-huevo-queso': { tag: 'huevo', flags: ['rapido'], name: 'Huevo · Queso Feta · Simple', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'feta-vaca', p: { grams: 30 } },{ k: 'suet', p: { grams: 10 } },] },
  'desayuno-brownie-chocolate': { tag: 'ocasional', flags: ['ocasional'], name: 'Brownie Chocolate Desayuno', items: [{ k: 'huevo', p: { units: 2 } },{ k: 'chocolate-negro', p: { grams: 30 } },{ k: 'almendras', p: { grams: 40 } },{ k: 'mantequilla', p: { grams: 20 } },{ k: 'canela', p: {} },] },
  'desayuno-magdalenas': { tag: 'ocasional', flags: ['ocasional'], name: 'Magdalenas yogur (ocasional)', items: [{ k: 'huevo', p: { units: 1 } },{ k: 'yogur-cabra', p: { grams: 80 } },{ k: 'harina', p: { grams: 60 } },{ k: 'azucar', p: { grams: 15 } },{ k: 'mantequilla', p: { grams: 25 } },] },
  'desayuno-magdalenas-chocolate': { tag: 'ocasional', flags: ['ocasional'], name: 'Magdalenas chocolate (ocasional)', items: [{ k: 'huevo', p: { units: 1 } },{ k: 'yogur-cabra', p: { grams: 80 } },{ k: 'harina', p: { grams: 60 } },{ k: 'azucar', p: { grams: 15 } },{ k: 'mantequilla', p: { grams: 25 } },{ k: 'chocolate-negro', p: { grams: 20 } },] },
  'desayuno-yogur-huevo-avena': { tag: 'yogur', flags: ['rapido'], name: 'Yogur cabra + huevo + avena', items: [{ k: 'yogur-cabra', p: { grams: 150 } },{ k: 'huevo', p: { units: 1 } },{ k: 'avena', p: { grams: 50 } },] },
}

// Which combos each protein group gets
export const COMBO_SETS = {
  shared: [
    'ens-garbanzos','ens-mediterranea','burger-bowl','taco-bell',
    'burrito-bowl','taco-dip','ens-alubias','ens-lentejas',
    'lentejas-beet-rucula','arroz-aguacate','lentejas-rojas-espinaca','patata-setas-puerro',
  ],
  lomo:          ['salsa-zanahoria-arroz','ens-garbanzos','ens-mediterranea','burger-bowl','taco-bell','burrito-bowl','taco-dip','ens-alubias','ens-lentejas','lentejas-beet-rucula','arroz-aguacate','lentejas-rojas-espinaca','patata-setas-puerro'],
  'higado-bacalao': ['arroz-huevos-veg','ens-legumbres-sc'],
  'higado-vaca':    ['lentejas-sep','pure-patata','esparragos-j'],
  sardinas:         ['pasta-tomate-cross','ens-garbanzos','ens-mediterranea','burger-bowl','taco-bell','burrito-bowl','taco-dip','ens-alubias','ens-lentejas','lentejas-beet-rucula','arroz-aguacate','lentejas-rojas-espinaca','patata-setas-puerro'],
  mejillones:       ['mejillones-arroz-tomate','mejillones-patata-vapor','ens-mediterranea','arroz-aguacate','patata-setas-puerro','pure-patata'],
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
  ],
}
