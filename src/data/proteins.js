export const COOK_FAT = {
  cooked:  [{ name: 'Grasa cocción (vaca/coco)', kc: 115 }, { name: 'Aceite oliva por encima', kc: 120 }],
  drizzle: [{ name: 'Aceite oliva por encima', kc: 120 }],
}

// meals: which meal streams use this protein. omit = comida only.
// cookFat: 235 = cooked (sartén/horno), 120 = drizzle only (lata)
export const PROTEIN = {
  'carne-picada':  { name: 'Carne picada',      ration: { grams: 100 },                          per100: 2.467, kc: 250, cookFat: 235, preps: ['lima-cebolla','solo-cebolla','tomate-cebolla'], combos: 'shared',        meals: ['comida'] },
  'pollo':         { name: 'Pollo',             ration: { grams: 150 },                          per100: 1.00,  kc: 190, cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida'] },
  'bacalao':       { name: 'Bacalao',           ration: { grams: 150 },                          per100: 1.06,  kc: 90,  cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida','cena'] },
  'huevos':        { name: 'Huevos',            ration: { units: 3 }, perUnit: 0.667, kcu: 72,                  cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida'] },
  'lamb':          { name: 'Lamb',              ration: { grams: 120 },                          per100: 1.982, kc: 230, cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida'] },
  'lomo':          { name: 'Lomo',              ration: { grams: 150 },                          per100: 0.725, kc: 170, cookFat: 235, preps: [],                                             combos: 'lomo',          meals: ['comida'] },
  'higado-bacalao':{ name: 'Hígado de bacalao', ration: { flat: 2.145, kc: 350, label: '½ lata 60g' },         cookFat: 120, preps: [],                                             combos: 'higado-bacalao', meals: ['comida'] },
  'higado-vaca':   { name: 'Hígado de vaca',    ration: { grams: 150 },                          per100: 1.653, kc: 135, cookFat: 235, preps: [],                                             combos: 'higado-vaca',   meals: ['comida'] },
  'sardinas':      { name: 'Sardinas',           ration: { flat: 2.29, kc: 250, label: 'lata sardinas' },       cookFat: 120, preps: [],                                             combos: 'sardinas',      meals: ['desayuno','comida','cena'] },
  'caballa':       { name: 'Caballa',            ration: { flat: 3.49, kc: 300, label: 'lata caballa 120g' },   cookFat: 120, preps: [],                                             combos: 'sardinas',      meals: ['desayuno','comida','cena'] },
  'calamares':     { name: 'Calamares',          ration: { grams: 150 },                          per100: 1.760, kc: 92,  cookFat: 235, preps: [],                                             combos: 'shared',        meals: ['comida'] },
  'mejillones':    { name: 'Mejillones (lata)',  ration: { grams: 150 },                          per100: 0.771, kc: 172, cookFat: 120, preps: [],                                             combos: 'mejillones',    meals: ['cena'] },
  'cerdo-picado':  { name: 'Cerdo picado',       ration: { grams: 100 },                          per100: 1.899, kc: 260, cookFat: 235, preps: ['lima-cebolla','solo-cebolla','tomate-cebolla'], combos: 'shared',        meals: ['comida'] },
}
