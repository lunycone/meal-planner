export const PREP = {
  'lima-cebolla':  { name: 'Lima + cebolla',    items: [{ k: 'lima', p: { units: 0.5 } }, { k: 'cebolla-amarilla', p: { grams: 90 } }] },
  'solo-cebolla':  { name: 'Solo cebolla',      items: [{ k: 'cebolla-amarilla', p: { grams: 90 } }] },
  'tomate-cebolla':{ name: 'Tomate + cebolla',  items: [{ k: 'passata', p: { ml: 180 } }, { k: 'cebolla-amarilla', p: { grams: 90 } }] },
}

export const COMBO = {
  'ens-garbanzos': {
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
    name: 'Ensalada alubias blancas',
    items: [{ k: 'alubias-blancas', p: { grams: 80 } }],
    incomplete: true,
  },
  'ens-lentejas': {
    name: 'Ensalada lentejas',
    items: [{ k: 'lentejas-verdes', p: { grams: 80 } }],
    incomplete: true,
  },
  'lentejas-beet-rucula': {
    name: 'Lentejas con beet y rúcula',
    items: [
      { k: 'lentejas-verdes', p: { grams: 80 } },
      { k: 'beet',            p: { grams: 80 } },
      { k: 'rucula',          p: { grams: 20 } },
    ],
  },
  'salsa-zanahoria-arroz': {
    name: 'Salsa zanahoria + arroz',
    items: [
      { k: 'zanahoria',        p: { grams: 100 } },
      { k: 'arroz',            p: { grams: 75 } },
      { k: 'cebolla-amarilla', p: { grams: 50 } },
      { k: 'sour-cream',       p: { grams: 20 } },
    ],
  },
  'arroz-huevos-veg': {
    name: 'Arroz + 2 huevos + verde',
    items: [
      { k: 'arroz',  p: { grams: 75 } },
      { k: 'huevo',  p: { units: 2 } },
      { k: 'puerro', p: { units: 0.5 } },
    ],
    note: 'Julio: puerro · María: brócoli / espárragos',
  },
  'ens-legumbres-sc': {
    name: 'Ensalada legumbres + sour cream',
    items: [
      { k: 'lentejas-verdes', p: { grams: 80 } },
      { k: 'sour-cream',      p: { grams: 40 } },
    ],
  },
  'lentejas-sep': {
    name: 'Lentejas (por separado)',
    items: [{ k: 'lentejas-verdes', p: { grams: 80 } }],
  },
  'pure-patata': {
    name: 'Puré patata + puerro/zanahoria',
    items: [
      { k: 'patata', p: { grams: 200 } },
      { k: 'puerro', p: { units: 0.5 } },
    ],
  },
  'esparragos-j': {
    name: 'Espárragos (María)',
    items: [{ k: 'esparragos', p: { grams: 120 } }],
    jessica: true,
  },
  'pasta-tomate-cross': {
    name: 'Pasta con tomate',
    items: [
      { k: 'pasta',   p: { grams: 100 } },
      { k: 'passata', p: { ml: 180 } },
    ],
  },
  'arroz-aguacate': {
    name: 'Arroz + aguacate',
    items: [
      { k: 'arroz',   p: { grams: 75 } },
      { k: 'aguacate',p: { units: 0.5 } },
    ],
  },
  'lentejas-rojas-espinaca': {
    name: 'Lentejas rojas + espinaca',
    items: [
      { k: 'lentejas-rojas', p: { grams: 80 } },
      { k: 'espinaca',       p: { grams: 80 } },
      { k: 'zanahoria',      p: { grams: 100 } },
    ],
  },
  'patata-setas-puerro': {
    name: 'Patata asada + setas',
    items: [
      { k: 'patata', p: { grams: 200 } },
      { k: 'setas',  p: { grams: 100 } },
      { k: 'puerro', p: { units: 0.5 } },
    ],
  },
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
}
