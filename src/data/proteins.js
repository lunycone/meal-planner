export const COOK_FAT = {
  cooked:  [{ name: 'Grasa cocción (vaca/coco)', kc: 115 }, { name: 'Aceite oliva por encima', kc: 120 }],
  drizzle: [{ name: 'Aceite oliva por encima', kc: 120 }],
}

// cookFat: 235 = cooked (sartén/horno), 120 = drizzle only (lata, no cocción)
export const PROTEIN = {
  'carne-picada':  { name: 'Carne picada',       ration: { grams: 100 },                            per100: 2.467, kc: 250, cookFat: 235, preps: ['lima-cebolla','solo-cebolla','tomate-cebolla'], combos: 'shared' },
  'pollo':         { name: 'Pollo',              ration: { grams: 150 },                            per100: 1.00,  kc: 190, cookFat: 235, preps: [],                                             combos: 'shared' },
  'bacalao':       { name: 'Bacalao',            ration: { grams: 150 },                            per100: 1.06,  kc: 90,  cookFat: 235, preps: [],                                             combos: 'shared' },
  'huevos':        { name: 'Huevos',             ration: { units: 3 },  perUnit: 0.667, kcu: 72,                   cookFat: 235, preps: [],                                             combos: 'shared' },
  'lamb':          { name: 'Lamb',               ration: { grams: 120 },                            per100: 1.982, kc: 230, cookFat: 235, preps: [],                                             combos: 'shared' },
  'lomo':          { name: 'Lomo',               ration: { grams: 150 },                            per100: 0.725, kc: 170, cookFat: 235, preps: [],                                             combos: 'lomo' },
  'higado-bacalao':{ name: 'Hígado de bacalao',  ration: { flat: 2.145, kc: 350, label: '½ lata 60g' },           cookFat: 120, preps: [],                                             combos: 'higado-bacalao' },
  'higado-vaca':   { name: 'Hígado de vaca',     ration: { grams: 150 },                            per100: 1.653, kc: 135, cookFat: 235, preps: [],                                             combos: 'higado-vaca' },
  'sardinas':      { name: 'Sardinas / Caballa',  ration: { flat: 2.29, kc: 250, label: 'lata sardinas' }, altRation: { flat: 3.49, kc: 300, label: 'lata caballa' }, cookFat: 120, preps: [], combos: 'sardinas' },
  'calamares':     { name: 'Calamares',          ration: { grams: 150 },                            per100: 1.760, kc: 92,  cookFat: 235, preps: [],                                             combos: 'shared', sauce: true },
  'mejillones':    { name: 'Mejillones (lata)',  ration: { grams: 150 },                            per100: 0.771, kc: 172, cookFat: 120, preps: [],                                             combos: 'mejillones' },
  'cerdo-picado':  { name: 'Cerdo picado',       ration: { grams: 100 },                            per100: 1.899, kc: 260, cookFat: 235, preps: ['lima-cebolla','solo-cebolla','tomate-cebolla'], combos: 'shared' },
}
