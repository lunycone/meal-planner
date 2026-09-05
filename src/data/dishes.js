// AUTO-GENERATED dish catalog. See scratchpad/build_dishes.mjs for source of truth.
// Regenerate by editing that script and re-running it.

export const DISHES = {
  // 5 PLATOS NUEVOS (4 sep 2026): existian solo como nombre + cifra suelta
  // en el HTML original (Downloads/semanas-modelo.html), nunca como receta
  // real con ingredientes. Construidos fieles al nombre, a peticion expresa
  // del usuario ("que sean fieles al nombre aunque no cumplan las reglas").
  // No se han forzado a cumplir grasa<=15g ni ningun otro techo digestivo.
  'd-huevos-tostada-madre-miel': {
    name: 'Huevos + tostada masa madre + miel', meals: ['desayuno'],
    items: [{ k: 'huevo', p: { units: 2 } }, { k: 'pan-masa-madre', p: { grams: 40 } }, { k: 'miel', p: { grams: 15 } }],
  },
  'd-huevos-tostada-miel': {
    name: 'Huevos + tostada + miel', meals: ['desayuno'],
    items: [{ k: 'huevo', p: { units: 2 } }, { k: 'pan-masa-madre', p: { grams: 35 } }, { k: 'miel', p: { grams: 10 } }],
  },
  'd-tostada-2huevos': {
    name: 'Tostada + 2 huevos', meals: ['desayuno'],
    items: [{ k: 'huevo', p: { units: 2 } }, { k: 'pan-masa-madre', p: { grams: 35 } }],
  },
  'd-avena-leche-desnatada-miel': {
    // 6 sep 2026: disenado para cumplir las DOS reglas del desayuno a la vez
    // (>=400 kcal, <=15g grasa) -- antes solo el burrito de maiz lo lograba.
    name: 'Avena con leche desnatada y miel', meals: ['desayuno'],
    items: [{ k: 'avena', p: { grams: 70 } }, { k: 'leche-desnatada', p: { grams: 300 } }, { k: 'miel', p: { grams: 15 } }], scalable: 'avena',
  },
  'd-tostada-madre-miel-platano': {
    // Mismo objetivo que el de arriba, con otra base (pan en vez de avena)
    // para dar variedad real sin repetir ingrediente principal.
    name: 'Tostada de masa madre con miel y plátano', meals: ['desayuno'],
    items: [{ k: 'pan-masa-madre', p: { grams: 100 } }, { k: 'banana', p: { grams: 120 } }, { k: 'miel', p: { grams: 15 } }],
  },
  'd-huevos-tostada-madre-miel-reforzado': {
    // 6 sep 2026: version con huevo de los dos platos de arriba -- llevaban
    // proteina (avena+leche desnatada ya daba 22g) pero sin huevo la sensacion
    // era de "no hay proteina real". Este la deja explicita: 20g, con huevo.
    name: 'Huevos revueltos con tostada de masa madre y miel', meals: ['desayuno'],
    items: [{ k: 'huevo', p: { units: 2 } }, { k: 'pan-masa-madre', p: { grams: 90 } }, { k: 'miel', p: { grams: 10 } }], scalable: 'pan-masa-madre',
  },
  // d-avena-huevo-platano RETIRADO (6 sep 2026): "vomitina", descartado por
  // el usuario. No usar esta combinacion en ningun plato futuro.
  //
  // 6 sep 2026 — grupo "bajo en IG, sin aceptar mas grasa" (tope 18-19g).
  // Antes de esto, el catalogo tenia una correlacion casi perfecta: bajo en
  // grasa = alto en IG (avena, pan, burrito) o bajo en IG = alto en grasa
  // (bacon, cheddar, aguacate). La salida es proteina en polvo + base lactea:
  // no es almidon (no sube IG) y aporta kcal sin apenas grasa.
  'd-batido-proteico-desayuno': {
    name: 'Batido proteico de desayuno', meals: ['desayuno'],
    items: [{ k: 'proteina-polvo', p: { grams: 60 } }, { k: 'leche-desnatada', p: { grams: 400 } }, { k: 'banana', p: { grams: 40 } }],
  },
  'd-batido-proteico-cacao': {
    name: 'Batido proteico de cacao', meals: ['desayuno'],
    items: [{ k: 'proteina-polvo', p: { grams: 65 } }, { k: 'leche-desnatada', p: { grams: 400 } }, { k: 'cacao', p: { grams: 10 } }],
  },
  'd-yogur-vaca-proteico-melon': {
    name: 'Yogur de vaca proteico con melón', meals: ['desayuno'],
    items: [{ k: 'yogur-vaca', p: { grams: 350 } }, { k: 'proteina-polvo', p: { grams: 35 } }, { k: 'melon-cantalupo', p: { grams: 150 } }],
  },
  'd-yogur-cabra-proteico-mandarina': {
    name: 'Yogur de cabra proteico con mandarina', meals: ['desayuno'],
    items: [{ k: 'yogur-cabra', p: { grams: 350 } }, { k: 'proteina-polvo', p: { grams: 35 } }, { k: 'mandarina', p: { units: 1 } }],
  },
  'd-yogur-platano-avena': {
    name: 'Yogur + plátano + avena', meals: ['desayuno'],
    items: [{ k: 'yogur-vaca', p: { grams: 150 } }, { k: 'banana', p: { grams: 80 } }, { k: 'avena', p: { grams: 30 } }],
  },
  'd-arroz-leche-simple': {
    name: 'Arroz con leche simple', meals: ['desayuno'],
    items: [{ k: 'arroz', p: { grams: 40 } }, { k: 'leche', p: { grams: 250 } }],
  },
  'd-tortilla-cheddar-aguacate': {
    name: 'Tortilla + cheddar + aguacate', meals: ['desayuno', 'cena'],
    items: [{ k: 'huevo', p: { units: 3 } }, { k: 'cheddar', p: { grams: 20 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-sardinas-huevo-cheddar': {
    name: 'Sardinas + huevo + cheddar', meals: ['desayuno', 'cena'],
    items: [{ k: 'sardina-media', p: {} }, { k: 'huevo', p: { units: 1 } }, { k: 'cheddar', p: { grams: 15 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-burrito-maiz': {
    name: 'Burrito 100% maíz', meals: ['desayuno', 'cena'],
    // AJUSTADO 3 sep 2026: era 60g masa + 3 huevos = 17,4 g de grasa, por
    // encima del techo de 15 g del desayuno. Se cambia un huevo por 20 g de
    // masa: misma kcal, misma funcion, 13 g de grasa y +72 kcal. La regla no
    // vale nada si el plato mas usado del catalogo la incumple.
    items: [{ k: 'masa-harina', p: { grams: 80 } }, { k: 'huevo', p: { units: 2 } }],
  },
  'd-burrito-maiz-cheddar': {
    name: 'Burrito maíz + cheddar', meals: ['desayuno', 'cena'],
    items: [{ k: 'masa-harina', p: { grams: 60 } }, { k: 'huevo', p: { units: 3 } }, { k: 'cheddar', p: { grams: 10 } }],
  },
  'd-burrito-5050': {
    name: 'Burrito 50/50 (maíz + garbanzo)', meals: ['desayuno', 'cena'],
    items: [{ k: 'masa-harina', p: { grams: 30 } }, { k: 'harina-garbanzo', p: { grams: 30 } }, { k: 'huevo', p: { units: 3 } }],
  },
  'd-burrito-5050-cheddar': {
    name: 'Burrito 50/50 + cheddar', meals: ['desayuno', 'cena'],
    items: [{ k: 'masa-harina', p: { grams: 30 } }, { k: 'harina-garbanzo', p: { grams: 30 } }, { k: 'huevo', p: { units: 3 } }, { k: 'cheddar', p: { grams: 10 } }],
  },
  'd-pan-huevos-aguacate': {
    name: 'Pan + huevos + aguacate', meals: ['desayuno', 'cena'],
    items: [{ k: 'pan-masa-madre', p: { grams: 60 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-yogur-almendra-pumpkin-choco': {
    name: 'Yogur, almendras, pumpkin, chocolate', meals: ['desayuno'],
    items: [{ k: 'yogur-cabra', p: { grams: 150 } }, { k: 'almendras', p: { grams: 20 } }, { k: 'pumpkin-seeds', p: { grams: 20 } }, { k: 'chocolate-negro', p: { grams: 15 } }, { k: 'canela', p: {} }],
  },
  'd-socca-garbanzo-feta-huevos': {
    name: 'Socca de garbanzo con feta y huevos', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 60 } }, { k: 'feta-vaca', p: { grams: 30 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-bacon-huevos': {
    name: 'Bacon y huevos', meals: ['desayuno'],
    items: [{ k: 'bacon', p: { grams: 40 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-bacon-generoso-huevo': {
    name: 'Bacon generoso + 1 huevo', meals: ['desayuno'],
    items: [{ k: 'bacon', p: { grams: 60 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-burrito-bacon': {
    name: 'Burrito con bacon', meals: ['desayuno'],
    items: [{ k: 'harina', p: { grams: 55 } }, { k: 'bacon', p: { grams: 40 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-overnight-oats-chocolate': {
    name: 'Overnight oats de chocolate', meals: ['desayuno'],
    items: [{ k: 'avena', p: { grams: 45 } }, { k: 'yogur-cabra', p: { grams: 120 } }, { k: 'leche', p: { grams: 120 } }, { k: 'chia', p: { grams: 12 } }, { k: 'cacao', p: { grams: 8 } }, { k: 'miel', p: { grams: 10 } }],
  },
  'd-torta-garbanzo-60': {
    name: 'Torta de garbanzo (60g) + AOVE', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 60 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-torta-garbanzo-80': {
    name: 'Torta de garbanzo (80g) + AOVE', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 80 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'd-torta-garbanzo-100': {
    name: 'Torta de garbanzo (100g) + AOVE', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 100 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'd-torta-garbanzo-50-huevo': {
    name: 'Torta de garbanzo (50g) + 1 huevo + AOVE', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 50 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-torta-garbanzo-100-huevo': {
    name: 'Torta de garbanzo (100g) + 1 huevo + AOVE', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 100 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-torta-garbanzo-120-huevo': {
    name: 'Torta de garbanzo (120g) + 1 huevo + AOVE', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 120 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-torta-garbanzo-extrema': {
    name: 'Torta de garbanzo extrema (60-70g proteína)', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 120 } }, { k: 'huevo', p: { units: 5 } }, { k: 'cheddar', p: { grams: 30 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'c-lomo-arroz-afgano': {
    name: 'Lomo cerdo + arroz afgano', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'comino', p: {} }, { k: 'canela', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-mejillones-paella': {
    name: 'Mejillones modo paella', meals: ['comida'],
    items: [{ k: 'mejillones', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'tomate-conserva', p: { grams: 50 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 30 } }], scalable: 'arroz',
  },
  'c-turkey-glaseado': {
    name: 'Turkey drumstick + glaseado agridulce', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'miel', p: { grams: 10 } }, { k: 'pimenton', p: {} }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-pollo-arroz-afgano-cebolla-limon': {
    name: 'Pollo pierna + arroz afgano + cebolla y limón', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'canela', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-lomo-patata-adobo': {
    name: 'Lomo cerdo + patata asada + adobo pimentón', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'pimenton', p: {} }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-turkey-cebolla-mostaza': {
    name: 'Turkey + cebolla caramelizada + salsa de mostaza', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'cebolla-amarilla', p: { grams: 100 } }, { k: 'mostaza', p: { grams: 15 } }, { k: 'miel', p: { grams: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-pollo-muslito-garbanzos-marroqui': {
    name: 'Pollo muslito (Beretta) + garbanzos + marroquí', meals: ['comida'],
    items: [{ k: 'pollo-muslito', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 80 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-turkey-cebolla-escabeche': {
    name: 'Turkey + cebolla caramelizada estilo escabeche', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'cebolla-amarilla', p: { grams: 100 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'vino-blanco', p: { ml: 30 } }, { k: 'vinagre', p: { ml: 20 } }, { k: 'pimienta-negra', p: {} }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-pollo-manzana-cebolla-arroz': {
    name: 'Pollo pierna + manzana-cebolla + arroz', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 200 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'cebolla-amarilla', p: { grams: 80 } }, { k: 'manzana', p: { units: 0.5 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-solomillo-patata-mayonesa-limon': {
    // 6 sep 2026: no hay mayonesa en casa -- se quita del todo, no se
    // sustituye por otro ingrediente graso. Yogur da la acidez sin el aporte
    // de grasa de la mayonesa (144kcal/20g grasa por 25g -> practicamente 0).
    name: 'Solomillo + patata + crema de limón', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 180 } }, { k: 'patata', p: { grams: 250 } }, { k: 'yogur-vaca', p: { grams: 40 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  'c-codillo-garbanzos-patata-laurel': {
    name: 'Codillo español + garbanzos + patata + laurel', meals: ['comida'],
    items: [{ k: 'ham-hock', p: { grams: 120 } }, { k: 'garbanzos', p: { grams: 80 } }, { k: 'patata', p: { grams: 150 } }, { k: 'zanahoria', p: { grams: 60 } }, { k: 'laurel', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-codillo-pure-garbanzos-horno': {
    name: 'Codillo sobre puré con garbanzos tostados al horno', meals: ['comida'],
    items: [{ k: 'ham-hock', p: { grams: 120 } }, { k: 'patata', p: { grams: 200 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'garbanzos', p: { grams: 70 } }, { k: 'pimenton', p: {} }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-turkey-setas-vino': {
    name: 'Turkey + setas + vino (otoñal)', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 80 } }, { k: 'setas', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'vino-blanco', p: { ml: 30 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-bangers-mash': {
    name: 'Bangers and mash', meals: ['comida'],
    items: [{ k: 'salchichas', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'cebolla-amarilla', p: { grams: 80 } }, { k: 'aove', p: { ml: 15 } }], scalable: 'patata',
  },
  'c-higado-cebolla-pure': {
    name: 'Hígado de vaca + cebolla caramelizada + puré de patata', meals: ['comida'],
    items: [{ k: 'higado-vaca', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'cebolla-amarilla', p: { grams: 100 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-higado-patatitas-especias': {
    name: 'Hígado + patatitas en dados con especias + cebolla', meals: ['comida'],
    items: [{ k: 'higado-vaca', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'cebolla-amarilla', p: { grams: 100 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  'c-hamhock-garbanzos-laurel-grande': {
    name: 'Ham hock + garbanzos + laurel (ración grande)', meals: ['comida'],
    items: [{ k: 'ham-hock', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'laurel', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'garbanzos',
  },
  'c-albondigas-cerdo-picado': {
    name: 'Albóndigas de cerdo picado (Eataly) + tomate + puré', meals: ['comida'],
    items: [{ k: 'cerdo-picado', p: { grams: 120 } }, { k: 'huevo', p: { units: 0.5 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-contramuslo-ac-pure-setas': {
    name: 'Contramuslo (Foodland AC) + puré con mantequilla y leche + setas al vino', meals: ['comida'],
    items: [{ k: 'pollo-muslo-air', p: { grams: 150 } }, { k: 'patata', p: { grams: 300 } }, { k: 'leche', p: { grams: 80 } }, { k: 'mantequilla', p: { grams: 20 } }, { k: 'setas', p: { grams: 60 } }, { k: 'vino-blanco', p: { ml: 25 } }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  'c-carne-picada-patata-tomate-ajo': {
    name: 'Carne picada de res + patata + tomate-ajo', meals: ['comida'],
    items: [{ k: 'carne-picada', p: { grams: 120 } }, { k: 'patata', p: { grams: 250 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-contramuslo-farmboy-garbanzos': {
    name: 'Contramuslo orgánico (Farm Boy) + garbanzos reforzados + tomate-comino', meals: ['comida'],
    items: [{ k: 'pollo-muslo-farmboy', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 120 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'garbanzos',
  },
  'c-cordero-pure-cebolla-laurel': {
    name: 'Cordero + puré de patata + cebolla + laurel', meals: ['comida'],
    items: [{ k: 'lamb', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'cebolla-amarilla', p: { grams: 80 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata', // mantequilla recortada 15->8g (6 sep 2026, pasada de grasa)
  },
  'c-pollo-pure-patata-zanahoria': {
    name: 'Pollo pierna + puré patata-zanahoria + pimentón', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 180 } }, { k: 'patata', p: { grams: 250 } }, { k: 'zanahoria', p: { grams: 100 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata', // mantequilla recortada 15->8g
  },
  'c-solomillo-pure-manzana-batida': {
    name: 'Solomillo + puré de patata + manzana batida', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 180 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'manzana', p: { units: 0.5 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata', // mantequilla recortada 15->8g
  },
  'c-pollo-beretta-garbanzos-tomillo-limon': {
    name: 'Pollo pierna (Beretta) + garbanzos + tomillo y limón', meals: ['comida'],
    items: [{ k: 'pollo-pierna', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'parsley', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'garbanzos',
  },
  'c-chili-carne-picada-blackbeans': {
    name: 'Chili de carne picada + black beans + tomate + comino-pimentón', meals: ['comida'],
    items: [{ k: 'carne-picada', p: { grams: 100 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-pastel-carne-ricotta': {
    name: 'Pastel de carne (cottage pie) con ricotta gratinada', meals: ['comida'],
    items: [{ k: 'carne-picada', p: { grams: 100 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'ricotta', p: { grams: 60 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'aove', p: { ml: 15 } }], scalable: 'patata',
  },
  'c-solomillo-blackbeans-comino': {
    name: 'Solomillo cerdo + black beans + comino-pimentón-tomate', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 150 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-turkey-blackbeans-comino': {
    name: 'Turkey drumstick + black beans + comino-pimentón-tomate', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-costillas-lentejas-laurel-vino': {
    name: 'Costillas cerdo + lentejas verdes + laurel y vino', meals: ['comida'],
    items: [{ k: 'costillas-cerdo', p: { grams: 150 } }, { k: 'lentejas-verdes', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'vino-blanco', p: { ml: 20 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'lentejas-verdes',
  },
  'c-costillas-pintas-zanahoria': {
    name: 'Costillas + alubias pintas + zanahoria muy cocida + laurel', meals: ['comida'],
    items: [{ k: 'costillas-cerdo', p: { grams: 150 } }, { k: 'romano-beans', p: { grams: 80 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'romano-beans',
  },
  'c-solomillo-pintas-pimenton': {
    name: 'Solomillo + alubias pintas + pimentón y tomate', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 150 } }, { k: 'romano-beans', p: { grams: 100 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'romano-beans',
  },
  'c-lomo-pintas-cebolla-vino': {
    name: 'Lomo cerdo + alubias pintas + cebolla y vino blanco', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 180 } }, { k: 'romano-beans', p: { grams: 100 } }, { k: 'cebolla-amarilla', p: { grams: 80 } }, { k: 'vino-blanco', p: { ml: 30 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'romano-beans',
  },
  'c-turkey-pintas-huevo': {
    name: 'Turkey + alubias pintas + huevo', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 130 } }, { k: 'romano-beans', p: { grams: 100 } }, { k: 'huevo', p: { units: 1 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'romano-beans', // pavo recortado 180->130g (6 sep 2026, techo de proteina)
  },
  'c-pollo-pure-rustico-pipas': {
    name: 'Pollo pierna asada + puré rústico + pipas de girasol', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 200 } }, { k: 'patata', p: { grams: 350 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'sunflower-seeds', p: { grams: 25 } }, { k: 'leche', p: { grams: 100 } }, { k: 'aove', p: { ml: 15 } }], scalable: 'patata',
  },
  'c-solomillo-blackbeans-huevo-tomate': {
    name: 'Solomillo + black beans + huevo + tomate', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 200 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'huevo', p: { units: 1 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-solomillo-blackbeans-huevo-mostaza': {
    name: 'Solomillo + black beans + huevo + salsa de mostaza y miel', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 200 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'huevo', p: { units: 1 } }, { k: 'mostaza', p: { grams: 15 } }, { k: 'miel', p: { grams: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-solomillo-blackbeans-huevo-salsaverde': {
    name: 'Solomillo + black beans + huevo + salsa verde', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 200 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'huevo', p: { units: 1 } }, { k: 'parsley', p: {} }, { k: 'jalapeno', p: { units: 1 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'aove', p: { ml: 30 } }], scalable: 'black-beans',
  },
  'c-turkey-garbanzos-huevo-sofrito': {
    name: 'Turkey + garbanzos + huevo + sofrito de tomate y cebolla', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 140 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'huevo', p: { units: 1 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'garbanzos', // pavo recortado 200->140g
  },
  'c-turkey-blackbeans-huevo-cheddar': {
    name: 'Turkey + black beans + huevo + cheddar', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 140 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'huevo', p: { units: 1 } }, { k: 'cheddar', p: { grams: 18 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans', // cheddar recortado 30->18g; pavo recortado 200->140g (techo de proteina)
  },
  'c-pollo-2huevos-garbanzos-crema': {
    name: 'Pollo pierna + 2 huevos + garbanzos + crema de garbanzo', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'huevo', p: { units: 2 } }, { k: 'garbanzos', p: { grams: 80 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 30 } }], scalable: 'garbanzos',
  },
  'c-ens-garbanzos-aguacate-cheddar-pollo': {
    name: 'Garbanzos, aguacate, cheddar y pollo pierna + vinagreta', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'cheddar', p: { grams: 30 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-ens-garbanzos-aguacate-feta-pollo': {
    name: 'Garbanzos, aguacate, feta y pollo pierna + vinagreta', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'feta-vaca', p: { grams: 40 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-ens-blackbeans-aguacate-turkey-salsaroja': {
    name: 'Black beans, aguacate, cheddar y turkey + salsa roja casera', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'cheddar', p: { grams: 20 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'jalapeno', p: { units: 1 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 15 } }], scalable: 'black-beans',
  },
  'c-ens-melon-feta-aguacate-solomillo': {
    name: 'Melón cantalupo, feta, aguacate y solomillo', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 150 } }, { k: 'melon-cantalupo', p: { grams: 200 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'feta-vaca', p: { grams: 30 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'c-ens-manzana-feta-aguacate-solomillo': {
    name: 'Manzana, feta, aguacate y solomillo', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 150 } }, { k: 'manzana', p: { units: 0.5 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'feta-vaca', p: { grams: 30 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'c-lomo-tomate-pimiento-arroz': {
    name: 'Lomo cerdo + tomate + pimiento verde + arroz', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'pimiento-verde', p: { grams: 80 } }, { k: 'ajo', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-rancho-aragones-barato': {
    name: 'Rancho aragonés (barato)', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 75 } }, { k: 'costillas-cerdo', p: { grams: 75 } }, { k: 'patata', p: { grams: 200 } }, { k: 'zanahoria', p: { grams: 100 } }, { k: 'arroz', p: { grams: 50 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-rancho-aragones-grande': {
    name: 'Rancho aragonés (grande)', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 100 } }, { k: 'costillas-cerdo', p: { grams: 100 } }, { k: 'patata', p: { grams: 250 } }, { k: 'zanahoria', p: { grams: 120 } }, { k: 'arroz', p: { grams: 60 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  'c-rancho-aragones-xl': {
    name: 'Rancho aragonés (XL)', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 130 } }, { k: 'costillas-cerdo', p: { grams: 110 } }, { k: 'patata', p: { grams: 290 } }, { k: 'zanahoria', p: { grams: 140 } }, { k: 'arroz', p: { grams: 70 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  'n-mejillones-marinera-patata': {
    name: 'Mejillones a la marinera + patata pequeña salteada', meals: ['cena'],
    items: [{ k: 'mejillones', p: { grams: 200 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'patata', p: { grams: 150 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 30 } }],
  },
  'n-bacalao-mantequilla-limon': {
    name: 'Bacalao con mantequilla de limón', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 180 } }, { k: 'mantequilla', p: { grams: 25 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'vino-blanco', p: { ml: 20 } }, { k: 'aove', p: { ml: 30 } }],
  },
  'n-ceviche-bacalao': {
    name: 'Ceviche de bacalao curado en lima + cebolla morada + aguacate', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'limon', p: { units: 1 } }, { k: 'cebolla-morada', p: { grams: 50 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'parsley', p: {} }, { k: 'aove', p: { ml: 30 } }],
  },
  'n-fajita-bowl-turkey': {
    name: 'Fajita bowl de turkey', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'pimiento-verde', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'cheddar', p: { grams: 15 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-frittata-turkey-cheddar': {
    name: 'Frittata al horno de turkey y cheddar', meals: ['cena'],
    items: [{ k: 'huevo', p: { units: 3 } }, { k: 'turkey-drumstick', p: { grams: 100 } }, { k: 'cheddar', p: { grams: 20 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-shakshuka-turkey': {
    name: 'Shakshuka de pimiento verde y tomate con turkey desmenuzado', meals: ['cena'],
    items: [{ k: 'huevo', p: { units: 3 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'pimiento-verde', p: { grams: 80 } }, { k: 'turkey-drumstick', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 35 } }],
  },
  'n-burrito-pollo-arroz-pimientos': {
    name: 'Burrito de pollo + arroz + pimientos', meals: ['cena'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'harina', p: { grams: 55 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-burrito-pollo-blackbeans-pimientos': {
    name: 'Burrito de pollo + black beans + pimientos', meals: ['cena'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'harina', p: { grams: 55 } }, { k: 'black-beans', p: { grams: 80 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-sardinas-patata-huevo': {
    name: 'Sardinas + patata + huevo', meals: ['cena'],
    items: [{ k: 'sardina-media', p: {} }, { k: 'patata', p: { grams: 150 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-patata-3huevos': {
    name: 'Patata + 3 huevos', meals: ['cena'],
    items: [{ k: 'patata', p: { grams: 150 } }, { k: 'huevo', p: { units: 3 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-turkey-patata-huevo': {
    name: 'Turkey + patata + huevo', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 100 } }, { k: 'patata', p: { grams: 200 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-patata-4huevos': {
    name: 'Patata + 4 huevos', meals: ['cena'],
    items: [{ k: 'patata', p: { grams: 200 } }, { k: 'huevo', p: { units: 4 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-turkey-patata-huevo-cheddar': {
    name: 'Turkey + patata + huevo + cheddar', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 100 } }, { k: 'patata', p: { grams: 200 } }, { k: 'huevo', p: { units: 2 } }, { k: 'cheddar', p: { grams: 15 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-blackbeans-huevo-patata': {
    name: 'Black beans + huevo + patata', meals: ['cena'],
    items: [{ k: 'black-beans', p: { grams: 80 } }, { k: 'huevo', p: { units: 1 } }, { k: 'patata', p: { grams: 100 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-garbanzos-huevo-patata': {
    name: 'Garbanzos + huevo + patata', meals: ['cena'],
    items: [{ k: 'garbanzos', p: { grams: 80 } }, { k: 'huevo', p: { units: 1 } }, { k: 'patata', p: { grams: 100 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-3huevos-patata120': {
    name: '3 huevos + patata', meals: ['cena'],
    items: [{ k: 'huevo', p: { units: 3 } }, { k: 'patata', p: { grams: 120 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-sopa-lentejas-huevo-escalfado': {
    name: 'Sopa de lentejas con huevo escalfado', meals: ['cena'],
    items: [{ k: 'lentejas-verdes', p: { grams: 80 } }, { k: 'huevo', p: { units: 1 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'zanahoria', p: { grams: 40 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-migas-patata-huevo': {
    name: 'Migas de patata crujiente con huevo frito', meals: ['cena'],
    items: [{ k: 'patata', p: { grams: 250 } }, { k: 'huevo', p: { units: 2 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-huevos-rancheros': {
    name: 'Huevos rancheros', meals: ['cena'],
    items: [{ k: 'black-beans', p: { grams: 80 } }, { k: 'huevo', p: { units: 2 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-pure-garbanzos-huevo-frito': {
    name: 'Puré de garbanzos caliente con huevo frito y pimentón', meals: ['cena'],
    items: [{ k: 'garbanzos', p: { grams: 80 } }, { k: 'huevo', p: { units: 2 } }, { k: 'pimenton', p: {} }, { k: 'limon', p: { units: 0.25 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-huevos-flamenca': {
    name: 'Huevos horneados a la flamenca', meals: ['cena'],
    items: [{ k: 'garbanzos', p: { grams: 50 } }, { k: 'huevo', p: { units: 2 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-tostadas-tomate-huevo': {
    name: 'Tostadas de tomate con huevo (pan tumaca)', meals: ['cena'],
    items: [{ k: 'pan-masa-madre', p: { grams: 120 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-tostadas-aguacate-huevo': {
    name: 'Tostadas de aguacate con huevo', meals: ['cena'],
    items: [{ k: 'pan-masa-madre', p: { grams: 120 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-bacalao-legumbre-lentejas': {
    name: 'Potaje de bacalao con lentejas', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 100 } }, { k: 'lentejas-verdes', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-bacalao-garbanzos-tomate': {
    name: 'Bacalao + garbanzos + tomate', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 120 } }, { k: 'garbanzos', p: { grams: 120 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'aove', p: { ml: 35 } }],
  },
  'n-bacalao-blackbeans-comino': {
    name: 'Bacalao + black beans + tomate-comino', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 120 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'tomate-conserva', p: { grams: 50 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 35 } }],
  },
  'n-bacalao-patata-tomate': {
    name: 'Bacalao + patata + tomate (sin legumbre)', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 100 } }, { k: 'patata', p: { grams: 200 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-bacalao-pure-simple': {
    name: 'Bacalao + puré de patata simple', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 300 } }, { k: 'leche', p: { grams: 40 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'aove', p: { ml: 25 } }], // mantequilla recortada 15->8g
  },
  'n-bacalao-pure-squash': {
    name: 'Bacalao + puré de patata-squash', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'squash-butternut', p: { grams: 150 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'aove', p: { ml: 25 } }], // mantequilla recortada 15->8g
  },
  // NUEVO 3 sep 2026 — variante con huevo, a peticion. El squash aporta pectina
  // (fibra soluble) en la cena, que es donde encaja: la calabaza en batido
  // desplaza sabor y el pure la absorbe sin notarse.
  'n-bacalao-pure-squash-huevo': {
    name: 'Bacalao + puré de patata-squash + huevo', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'squash-butternut', p: { grams: 150 } }, { k: 'huevo', p: { units: 1 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'aove', p: { ml: 25 } }], // mantequilla recortada 15->8g
  },
  'n-bacalao-pure-zucchini': {
    name: 'Bacalao + puré de patata-zucchini', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'zucchini', p: { grams: 120 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'leche', p: { grams: 30 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-bacalao-pure-puerro': {
    name: 'Bacalao + puré de patata-puerro', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'puerro', p: { units: 0.25 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'leche', p: { grams: 40 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-turkey-mejillones-cazuela': {
    name: 'Turkey y mejillones en cazuela', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'mejillones', p: { grams: 200 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-bacalao-mejillones-cazuela': {
    name: 'Bacalao y mejillones en cazuela', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'mejillones', p: { grams: 200 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-burrito-harina-2huevos': {
    name: 'Burrito de harina + 2 huevos', meals: ['cena'],
    items: [{ k: 'harina', p: { grams: 55 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'n-burrito-huevo-turkey-queso': {
    name: 'Burrito de huevo, turkey y queso', meals: ['cena'],
    items: [{ k: 'harina', p: { grams: 55 } }, { k: 'huevo', p: { units: 3 } }, { k: 'turkey-drumstick', p: { grams: 60 } }, { k: 'cheddar', p: { grams: 10 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-rancho-aragones-costillas': {
    name: 'Rancho aragonés (costillas de cerdo)', meals: ['cena'],
    items: [{ k: 'costillas-cerdo', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'zanahoria', p: { grams: 100 } }, { k: 'arroz', p: { grams: 50 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-rancho-aragones-lomo': {
    name: 'Rancho aragonés (lomo de cerdo)', meals: ['cena'],
    items: [{ k: 'lomo-cerdo', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'zanahoria', p: { grams: 100 } }, { k: 'arroz', p: { grams: 50 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-fajitas-pollo-sin-tortilla': {
    name: 'Fajitas de pollo sin tortilla', meals: ['cena'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 180 } }, { k: 'pimiento-verde', p: { grams: 80 } }, { k: 'pimiento-amarillo', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'b-arandanos': {
    name: 'Batido de arándanos', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'arandanos', p: { grams: 80 } }, { k: 'mantequilla', p: { grams: 25 } }],
  },
  'b-clasico': {
    name: 'Batido clásico', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'mantequilla', p: { grams: 10 } }, { k: 'pumpkin-seeds', p: { grams: 20 } }], // mantequilla recortada 20->10g
  },
  'b-clasico-2': {
    name: 'Batido clásico 2', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'almendras', p: { grams: 20 } }],
  },
  'b-citrico': {
    name: 'Batido cítrico', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'yogur-cabra', p: { grams: 150 } }, { k: 'mandarina', p: { units: 1 } }, { k: 'arandanos', p: { grams: 80 } }, { k: 'mantequilla', p: { grams: 12 } }], // mantequilla recortada 25->12g
  },
  'm-proteina-portatil': {
    // 6 sep 2026: merienda de Maria para lunes/miercoles (trabaja, sin
    // batidora). Se agita en un shaker, no se cocina. Reemplaza el "cero
    // merienda" del Paso 4 -- sin esto, comida+cena tenian que compensar
    // ~800 kcal solas y eso disparaba la grasa del dia muy por encima de lo
    // razonable. Proteina en polvo + leche desnatada + banana: ~29g grasa
    // menos que el batido clasico, con mas proteina.
    name: 'Batido proteico para llevar', meals: ['merienda'],
    items: [{ k: 'proteina-polvo', p: { grams: 35 } }, { k: 'leche-desnatada', p: { grams: 350 } }, { k: 'banana', p: { grams: 120 } }],
  },
  'b-melon': {
    name: 'Batido de melón', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'melon-cantalupo', p: { grams: 200 } }, { k: 'mantequilla', p: { grams: 20 } }],
  },
  'b-aguacate-cacao': {
    name: 'Batido aguacate y cacao', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'cacao', p: { grams: 5 } }, { k: 'banana', p: { grams: 120 } }],
  },
  'b-fruto-seco': {
    name: 'Batido fruto seco', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'kefir', p: { ml: 150 } }, { k: 'banana', p: { grams: 120 } }, { k: 'avellana', p: { grams: 20 } }, { k: 'mantequilla', p: { grams: 15 } }],
  },
  'b-blando': {
    name: 'Batido blando (día malo de estómago)', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'mantequilla', p: { grams: 12 } }], // mantequilla recortada 25->12g
  },
  // NUEVO 3 sep 2026 — BATIDO DE GANANCIA.
  // Hace un trabajo que ninguno de los ocho anteriores hacia: maxima densidad
  // calorica DENTRO de la ventana segura de las 16:00, con carga alta de fibra
  // SOLUBLE. Tres decisiones deliberadas:
  //   · Cebada en vez de avena: mas beta-glucano (6,0 vs 4,5 g/100g). Arrastra
  //     mas fructanos, pero a las 16:00 el pico de fermentacion cae fuera de la
  //     ventana vulnerable de la manana y solo queda el beneficio.
  //   · Membrillo (o manzana) cocido: pectina. HERVIR Y TIRAR EL AGUA — el
  //     sorbitol es hidrosoluble y se va; la pectina esta unida a la pared
  //     celular y se queda.
  //   · Aceite de coco refinado en vez de mantequilla o AOVE: no es mas barato
  //     ($0,23/100 kcal), es de sabor NEUTRO. A 64 kg y IMC 18,7 el limite no
  //     es el apetito de comer, es el espacio en el estomago: compra calorias
  //     sin volumen y sin sabor que estorbe.
  'b-ganancia': {
    name: 'Batido de ganancia (membrillo)', meals: ['merienda'],
    items: [{ k: 'cebada-copos', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'membrillo', p: { grams: 150 } }, { k: 'aove', p: { ml: 15 } }], // aceite-coco (87% sat) -> AOVE (14% sat), misma densidad calorica
  },
  // Variante con manzana: mas facil de encontrar todo el ano y algo mas barata,
  // pero menos pectina y mas sorbitol. Misma tecnica: hervir y tirar el agua.
  'b-ganancia-manzana': {
    name: 'Batido de ganancia (manzana)', meals: ['merienda'],
    items: [{ k: 'cebada-copos', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'manzana', p: { units: 1 } }, { k: 'aove', p: { ml: 15 } }], // aceite-coco (87% sat) -> AOVE (14% sat), misma densidad calorica
  },
}
