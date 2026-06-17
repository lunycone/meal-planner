export const COOK_FAT = {
  cooked:  [{ name: 'Grasa cocción (vaca/coco)', kc: 115 }, { name: 'Aceite oliva por encima', kc: 120 }],
  drizzle: [{ name: 'Aceite oliva por encima', kc: 120 }],
}

// meals: which meal streams use this protein. omit = comida only.
// cookFat: 235 = cooked (sartén/horno), 120 = drizzle only (lata)
// prot/protu/protf: protein content (per100, per unit, or flat respectively)
export const PROTEIN = {
  'carne-picada':  { name: 'Carne picada',      ration: { grams: 100 },                          per100: 2.467, kc: 250, prot: 20,  cookFat: 235, preps: ['lima-cebolla','solo-cebolla','tomate-cebolla'], combos: 'shared',        meals: ['comida'] },
  'pollo':         { name: 'Pollo',             ration: { grams: 150 },                          per100: 1.00,  kc: 165, prot: 31,  cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida','cena'] },
  'bacalao':       { name: 'Bacalao',           ration: { grams: 150 },                          per100: 1.06,  kc: 82,  prot: 17,  cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida','cena'] },
  'huevos':        { name: 'Huevos',            ration: { units: 3 }, perUnit: 0.488, kcu: 72,  protu: 6,   cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida','cena'] },
  'lamb':          { name: 'Lamb',              ration: { grams: 120 },                          per100: 1.982, kc: 209, prot: 25,  cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida'] },
  'lomo':          { name: 'Lomo',              ration: { grams: 150 },                          per100: 0.66,  kc: 250, prot: 26,  cookFat: 235, preps: [],                                             combos: 'lomo',          meals: ['comida'] },
  'higado-bacalao':{ name: 'Hígado de bacalao', ration: { flat: 2.145, kc: 244, label: '½ lata 60g' }, protf: 2.4, cookFat: 120, preps: [],                                             combos: 'higado-bacalao', meals: ['comida'] },
  'higado-vaca':   { name: 'Hígado de vaca',    ration: { grams: 150 },                          per100: 1.653, kc: 173, prot: 26,  cookFat: 235, preps: [],                                             combos: 'higado-vaca',   meals: ['comida'] },
  'sardinas':      { name: 'Sardinas',           ration: { flat: 2.29, kc: 250, label: 'lata sardinas' }, protf: 25, cookFat: 120, preps: [],                                             combos: 'sardinas',      meals: ['desayuno','comida','cena'] },
  'caballa':       { name: 'Caballa',            ration: { flat: 3.49, kc: 300, label: 'lata caballa 120g' }, protf: 38, cookFat: 120, preps: [],                                             combos: 'sardinas',      meals: ['desayuno','comida','cena'] },
  'calamares':     { name: 'Calamares',          ration: { grams: 150 },                          per100: 1.760, kc: 92,  prot: 17,  cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida','cena'] },
  'mejillones':    { name: 'Mejillones (lata)',  ration: { grams: 150 },                          per100: 0.771, kc: 172, prot: 24,  cookFat: 120, preps: [],                                             combos: 'mejillones',    meals: ['cena'] },
  'cerdo-picado':  { name: 'Cerdo picado',       ration: { grams: 100 },                          per100: 1.899, kc: 260, prot: 21,  cookFat: 235, preps: ['lima-cebolla','solo-cebolla','tomate-cebolla'], combos: 'shared',        meals: ['comida'] },
  'pollock':       { name: 'Pollock',            ration: { grams: 150 },                          per100: 1.00,  kc: 82,  prot: 17,  cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['cena'] },
  'langosta':      { name: 'Langosta (picada)',  ration: { grams: 150 },                          per100: 1.99,  kc: 90,  prot: 20,  cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['cena'] },
  'ostras':        { name: 'Ostras (Malpeques)', ration: { units: 6 }, perUnit: 0.83, kcu: 50,  protu: 1.5, cookFat: 120, preps: [],                                             combos: 'shared',        meals: ['cena'] },
}
