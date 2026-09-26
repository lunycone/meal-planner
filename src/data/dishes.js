// AUTO-GENERATED dish catalog. See scratchpad/build_dishes.mjs for source of truth.
// Regenerate by editing that script and re-running it.

export const DISHES = {
  // 5 PLATOS NUEVOS (4 sep 2026): existian solo como nombre + cifra suelta
  // en el HTML original (Downloads/semanas-modelo.html), nunca como receta
  // real con ingredientes. Construidos fieles al nombre, a peticion expresa
  // del usuario ("que sean fieles al nombre aunque no cumplan las reglas").
  // No se han forzado a cumplir grasa<=15g ni ningun otro techo digestivo.
  'd-huevos-tostada-madre-miel': {
    name: 'Eggs + sourdough toast + honey', meals: ['desayuno'],
    items: [{ k: 'huevo', p: { units: 2 } }, { k: 'pan-masa-madre', p: { grams: 40 } }, { k: 'miel', p: { grams: 15 } }],
  },
  'd-huevos-tostada-miel': {
    name: 'Eggs + toast + honey', meals: ['desayuno'],
    items: [{ k: 'huevo', p: { units: 2 } }, { k: 'pan-masa-madre', p: { grams: 35 } }, { k: 'miel', p: { grams: 10 } }],
  },
  'd-tostada-2huevos': {
    name: 'Toast + 2 eggs', meals: ['desayuno'],
    items: [{ k: 'huevo', p: { units: 2 } }, { k: 'pan-masa-madre', p: { grams: 35 } }],
  },
  'd-avena-leche-desnatada-miel': {
    // 6 sep 2026: disenado para cumplir las DOS reglas del desayuno a la vez
    // (>=400 kcal, <=15g grasa) -- antes solo el burrito de maiz lo lograba.
    // 6 sep 2026 (2): leche 300->400g a peticion (+3-5g prot al dia entre
    // los dos) -- mismo ingrediente que ya llevaba, solo mas cantidad; la
    // leche desnatada apenas sube grasa (0.1g/100g), asi que no toca el
    // techo de grasa del desayuno.
    name: 'Oats with skim milk and honey', meals: ['desayuno'],
    items: [{ k: 'avena', p: { grams: 70 } }, { k: 'leche-desnatada', p: { grams: 400 } }, { k: 'miel', p: { grams: 15 } }], scalable: 'avena',
  },
  'd-tostada-madre-miel-platano': {
    // Mismo objetivo que el de arriba, con otra base (pan en vez de avena)
    // para dar variedad real sin repetir ingrediente principal.
    // 6 sep 2026 (2): pan 100->140g a peticion (+3-5g prot).
    name: 'Sourdough toast with honey and banana', meals: ['desayuno'],
    items: [{ k: 'pan-masa-madre', p: { grams: 140 } }, { k: 'banana', p: { grams: 120 } }, { k: 'miel', p: { grams: 15 } }],
  },
  'd-huevos-tostada-madre-miel-reforzado': {
    // 6 sep 2026: version con huevo de los dos platos de arriba -- llevaban
    // proteina (avena+leche desnatada ya daba 22g) pero sin huevo la sensacion
    // era de "no hay proteina real". Este la deja explicita: 20g, con huevo.
    // 6 sep 2026 (2): huevo 2->2.5 unidades a peticion (+3-5g prot).
    name: 'Scrambled eggs with sourdough toast and honey', meals: ['desayuno'],
    items: [{ k: 'huevo', p: { units: 2.5 } }, { k: 'pan-masa-madre', p: { grams: 90 } }, { k: 'miel', p: { grams: 10 } }], scalable: 'pan-masa-madre',
  },
  // Semana 12 (astringente) — variantes SIN miel de los dos platos de
  // arriba, pedidas por el usuario (aceite+sal en vez de miel). Platos
  // nuevos, no ediciones de los originales -- esos dos siguen usandose en
  // las otras 11 semanas, ya afinados para cumplir grasa<=15g ahi; anadir
  // AOVE a ESOS habria roto ese tope. Aqui no hay ese problema (grasa suelta
  // bastante mas baja para empezar).
  // 6 sep 2026 (2): pan 100->135g a peticion (+3-5g prot).
  'd-tostada-platano-aove-sal': {
    name: 'Sourdough toast with banana, EVOO and salt', meals: ['desayuno'],
    items: [{ k: 'pan-masa-madre', p: { grams: 135 } }, { k: 'banana', p: { grams: 120 } }, { k: 'aove', p: { ml: 10 } }, { k: 'sal', p: {} }],
  },
  // 6 sep 2026 (2): este plato YA estaba a 20g de grasa (huevo+AOVE), por
  // encima del techo de 15g, desde antes de hoy -- subir el huevo (como se
  // hizo primero) lo habria dejado peor (22.5g). Se sube pan en su lugar
  // (sin grasa) 90->125g: mismos +3g de proteina, sin empeorar lo que ya
  // estaba roto.
  'd-huevos-tostada-aove': {
    name: 'Scrambled eggs with sourdough toast and EVOO', meals: ['desayuno'],
    items: [{ k: 'huevo', p: { units: 2 } }, { k: 'pan-masa-madre', p: { grams: 125 } }, { k: 'aove', p: { ml: 10 } }], scalable: 'pan-masa-madre',
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
    name: 'Breakfast protein shake', meals: ['desayuno'],
    items: [{ k: 'proteina-polvo', p: { grams: 60 } }, { k: 'leche-desnatada', p: { grams: 400 } }, { k: 'banana', p: { grams: 40 } }],
  },
  'd-batido-proteico-cacao': {
    name: 'Cocoa protein shake', meals: ['desayuno'],
    items: [{ k: 'proteina-polvo', p: { grams: 65 } }, { k: 'leche-desnatada', p: { grams: 400 } }, { k: 'cacao', p: { grams: 10 } }],
  },
  'd-yogur-vaca-proteico-melon': {
    name: 'High-protein cow yogurt with melon', meals: ['desayuno'],
    items: [{ k: 'yogur-vaca', p: { grams: 350 } }, { k: 'proteina-polvo', p: { grams: 35 } }, { k: 'melon-cantalupo', p: { grams: 150 } }],
  },
  'd-yogur-cabra-proteico-mandarina': {
    name: 'High-protein goat yogurt with mandarin', meals: ['desayuno'],
    items: [{ k: 'yogur-cabra', p: { grams: 350 } }, { k: 'proteina-polvo', p: { grams: 35 } }, { k: 'mandarina', p: { units: 1 } }],
  },
  'd-yogur-platano-avena': {
    name: 'Yogurt + banana + oats', meals: ['desayuno'],
    items: [{ k: 'yogur-vaca', p: { grams: 150 } }, { k: 'banana', p: { grams: 80 } }, { k: 'avena', p: { grams: 30 } }],
  },
  'd-arroz-leche-simple': {
    name: 'Simple rice pudding', meals: ['desayuno'],
    items: [{ k: 'arroz', p: { grams: 40 } }, { k: 'leche', p: { grams: 250 } }],
  },
  // 6 sep 2026 (2): cheddar 20->32g a peticion (+3-5g prot).
  'd-tortilla-cheddar-aguacate': {
    name: 'Omelette + cheddar + avocado', meals: ['desayuno', 'cena'],
    items: [{ k: 'huevo', p: { units: 3 } }, { k: 'cheddar', p: { grams: 32 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-sardinas-huevo-cheddar': {
    name: 'Sardines + egg + cheddar', meals: ['desayuno', 'cena'],
    items: [{ k: 'sardina-media', p: {} }, { k: 'huevo', p: { units: 1 } }, { k: 'cheddar', p: { grams: 15 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-burrito-maiz': {
    name: '100% corn burrito', meals: ['desayuno', 'cena'],
    // AJUSTADO 3 sep 2026: era 60g masa + 3 huevos = 17,4 g de grasa, por
    // encima del techo de 15 g del desayuno. Se cambia un huevo por 20 g de
    // masa: misma kcal, misma funcion, 13 g de grasa y +72 kcal. La regla no
    // vale nada si el plato mas usado del catalogo la incumple.
    // 6 sep 2026 (2): masa 80->110g a peticion (+3-5g prot) -- se sube la
    // masa, NO el huevo, para no volver a acercarse al techo de grasa de
    // arriba (masa-harina apenas lleva grasa; +30g son +1.2g grasa, 13->14.2,
    // sigue bajo el techo de 15).
    // 6 sep 2026 (3): agua añadida -- la masa harina nixtamalizada (maiz)
    // necesita agua para hacerse masa de verdad, antes no estaba en ningun
    // sitio (el usuario lo hizo "a ojo": 440g masa + agua le dieron 916g,
    // ratio real ~1.08x). El huevo se cocina APARTE (revuelto) y se pone
    // dentro del burrito ya hecho -- no se mezcla crudo con la masa.
    items: [{ k: 'masa-harina', p: { grams: 110 } }, { k: 'agua', p: { grams: 119 } }, { k: 'huevo', p: { units: 2 } }],
  },
  'd-burrito-maiz-cheddar': {
    name: 'Corn burrito + cheddar', meals: ['desayuno', 'cena'],
    items: [{ k: 'masa-harina', p: { grams: 60 } }, { k: 'agua', p: { grams: 65 } }, { k: 'huevo', p: { units: 3 } }, { k: 'cheddar', p: { grams: 10 } }],
  },
  // 6 sep 2026 (2): harina de garbanzo 30->45g a peticion (+3-5g prot).
  // 6 sep 2026 (3): agua para las dos harinas juntas (ver comentario en
  // d-burrito-maiz).
  'd-burrito-5050': {
    name: '50/50 burrito (corn + chickpea)', meals: ['desayuno', 'cena'],
    items: [{ k: 'masa-harina', p: { grams: 30 } }, { k: 'harina-garbanzo', p: { grams: 45 } }, { k: 'agua', p: { grams: 81 } }, { k: 'huevo', p: { units: 3 } }],
  },
  'd-burrito-5050-cheddar': {
    name: '50/50 burrito + cheddar', meals: ['desayuno', 'cena'],
    items: [{ k: 'masa-harina', p: { grams: 30 } }, { k: 'harina-garbanzo', p: { grams: 30 } }, { k: 'agua', p: { grams: 65 } }, { k: 'huevo', p: { units: 3 } }, { k: 'cheddar', p: { grams: 10 } }],
  },
  'd-pan-huevos-aguacate': {
    name: 'Bread + eggs + avocado', meals: ['desayuno', 'cena'],
    items: [{ k: 'pan-masa-madre', p: { grams: 60 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-yogur-almendra-pumpkin-choco': {
    name: 'Yogurt, almonds, pumpkin seeds, chocolate', meals: ['desayuno'],
    items: [{ k: 'yogur-cabra', p: { grams: 150 } }, { k: 'almendras', p: { grams: 20 } }, { k: 'pumpkin-seeds', p: { grams: 20 } }, { k: 'chocolate-negro', p: { grams: 15 } }, { k: 'canela', p: {} }],
  },
  'd-socca-garbanzo-feta-huevos': {
    name: 'Chickpea socca with feta and eggs', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 60 } }, { k: 'feta-vaca', p: { grams: 30 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-bacon-huevos': {
    name: 'Bacon and eggs', meals: ['desayuno'],
    items: [{ k: 'bacon', p: { grams: 40 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-bacon-generoso-huevo': {
    name: 'Generous bacon + 1 egg', meals: ['desayuno'],
    items: [{ k: 'bacon', p: { grams: 60 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-burrito-bacon': {
    name: 'Bacon burrito', meals: ['desayuno'],
    items: [{ k: 'harina', p: { grams: 55 } }, { k: 'bacon', p: { grams: 40 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'd-overnight-oats-chocolate': {
    name: 'Chocolate overnight oats', meals: ['desayuno'],
    items: [{ k: 'avena', p: { grams: 45 } }, { k: 'yogur-cabra', p: { grams: 120 } }, { k: 'leche', p: { grams: 120 } }, { k: 'chia', p: { grams: 12 } }, { k: 'cacao', p: { grams: 8 } }, { k: 'miel', p: { grams: 10 } }],
  },
  // 6 sep 2026 (2): harina 60->75g a peticion (+3-5g prot) -- nombre
  // actualizado a "75g" para que siga diciendo la cantidad real (la key
  // 'd-torta-garbanzo-60' se queda igual, la referencian otras semanas).
  'd-torta-garbanzo-60': {
    name: 'Chickpea flatbread (75g) + EVOO', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 75 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-torta-garbanzo-80': {
    name: 'Chickpea flatbread (80g) + EVOO', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 80 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'd-torta-garbanzo-100': {
    name: 'Chickpea flatbread (100g) + EVOO', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 100 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'd-torta-garbanzo-50-huevo': {
    name: 'Chickpea flatbread (50g) + 1 egg + EVOO', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 50 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-torta-garbanzo-100-huevo': {
    name: 'Chickpea flatbread (100g) + 1 egg + EVOO', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 100 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-torta-garbanzo-120-huevo': {
    name: 'Chickpea flatbread (120g) + 1 egg + EVOO', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 120 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'd-torta-garbanzo-extrema': {
    name: 'Extreme chickpea flatbread (60-70g protein)', meals: ['desayuno'],
    items: [{ k: 'harina-garbanzo', p: { grams: 120 } }, { k: 'huevo', p: { units: 5 } }, { k: 'cheddar', p: { grams: 30 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'c-lomo-arroz-afgano': {
    name: 'Pork loin + Afghan rice', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'comino', p: {} }, { k: 'canela', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-mejillones-paella': {
    name: 'Paella-style mussels', meals: ['comida'],
    items: [{ k: 'mejillones', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'tomate-conserva', p: { grams: 50 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 30 } }], scalable: 'arroz',
  },
  'c-turkey-glaseado': {
    name: 'Turkey drumstick + sweet & sour glaze', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'miel', p: { grams: 10 } }, { k: 'pimenton', p: {} }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-pollo-arroz-afgano-cebolla-limon': {
    name: 'Chicken leg + Afghan rice + onion and lemon', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'canela', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-lomo-patata-adobo': {
    name: 'Pork loin + roast potato + paprika marinade', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'pimenton', p: {} }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-turkey-cebolla-mostaza': {
    name: 'Turkey + caramelized onion + mustard sauce', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'cebolla-amarilla', p: { grams: 100 } }, { k: 'mostaza', p: { grams: 15 } }, { k: 'miel', p: { grams: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-pollo-muslito-garbanzos-marroqui': {
    name: 'Chicken drumstick (Beretta) + chickpeas + Moroccan spices', meals: ['comida'],
    items: [{ k: 'pollo-muslito', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 80 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-turkey-cebolla-escabeche': {
    name: 'Turkey + caramelized onion, escabeche style', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'cebolla-amarilla', p: { grams: 100 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'vino-blanco', p: { ml: 30 } }, { k: 'vinagre', p: { ml: 20 } }, { k: 'pimienta-negra', p: {} }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-pollo-manzana-cebolla-arroz': {
    name: 'Chicken leg + apple-onion + rice', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 200 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'cebolla-amarilla', p: { grams: 80 } }, { k: 'manzana', p: { units: 0.5 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-solomillo-patata-mayonesa-limon': {
    // 6 sep 2026: no hay mayonesa en casa -- se quita del todo, no se
    // sustituye por otro ingrediente graso. Yogur da la acidez sin el aporte
    // de grasa de la mayonesa (144kcal/20g grasa por 25g -> practicamente 0).
    name: 'Pork tenderloin + potato + lemon cream', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 180 } }, { k: 'patata', p: { grams: 250 } }, { k: 'yogur-vaca', p: { grams: 40 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  'c-codillo-garbanzos-patata-laurel': {
    name: 'Spanish ham hock + chickpeas + potato + bay leaf', meals: ['comida'],
    items: [{ k: 'ham-hock', p: { grams: 120 } }, { k: 'garbanzos', p: { grams: 80 } }, { k: 'patata', p: { grams: 150 } }, { k: 'zanahoria', p: { grams: 60 } }, { k: 'laurel', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-codillo-pure-garbanzos-horno': {
    name: 'Ham hock on mash with oven-roasted chickpeas', meals: ['comida'],
    items: [{ k: 'ham-hock', p: { grams: 120 } }, { k: 'patata', p: { grams: 200 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'garbanzos', p: { grams: 70 } }, { k: 'pimenton', p: {} }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-turkey-setas-vino': {
    name: 'Turkey + mushrooms + wine (autumn)', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 80 } }, { k: 'setas', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'vino-blanco', p: { ml: 30 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-bangers-mash': {
    name: 'Bangers and mash', meals: ['comida'],
    items: [{ k: 'salchichas', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'cebolla-amarilla', p: { grams: 80 } }, { k: 'aove', p: { ml: 15 } }], scalable: 'patata',
  },
  'c-higado-cebolla-pure': {
    name: 'Beef liver + caramelized onion + mashed potato', meals: ['comida'],
    items: [{ k: 'higado-vaca', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'cebolla-amarilla', p: { grams: 100 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-higado-patatitas-especias': {
    name: 'Liver + spiced diced potatoes + onion', meals: ['comida'],
    items: [{ k: 'higado-vaca', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'cebolla-amarilla', p: { grams: 100 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  'c-hamhock-garbanzos-laurel-grande': {
    name: 'Ham hock + chickpeas + bay leaf (large serving)', meals: ['comida'],
    items: [{ k: 'ham-hock', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'laurel', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'garbanzos',
  },
  'c-albondigas-cerdo-picado': {
    name: 'Pork meatballs (Eataly) + tomato + mash', meals: ['comida'],
    items: [{ k: 'cerdo-picado', p: { grams: 120 } }, { k: 'huevo', p: { units: 0.5 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-contramuslo-ac-pure-setas': {
    name: 'Chicken thigh (Foodland AC) + butter-milk mash + mushrooms in wine', meals: ['comida'],
    items: [{ k: 'pollo-muslo-air', p: { grams: 150 } }, { k: 'patata', p: { grams: 300 } }, { k: 'leche', p: { grams: 80 } }, { k: 'mantequilla', p: { grams: 20 } }, { k: 'setas', p: { grams: 60 } }, { k: 'vino-blanco', p: { ml: 25 } }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  'c-carne-picada-patata-tomate-ajo': {
    name: 'Ground beef + potato + tomato-garlic', meals: ['comida'],
    items: [{ k: 'carne-picada', p: { grams: 120 } }, { k: 'patata', p: { grams: 250 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-contramuslo-farmboy-garbanzos': {
    name: 'Organic chicken thigh (Farm Boy) + extra chickpeas + tomato-cumin', meals: ['comida'],
    items: [{ k: 'pollo-muslo-farmboy', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 120 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'garbanzos',
  },
  'c-cordero-pure-cebolla-laurel': {
    name: 'Lamb + mashed potato + onion + bay leaf', meals: ['comida'],
    items: [{ k: 'lamb', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'cebolla-amarilla', p: { grams: 80 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata', // mantequilla recortada 15->8g (6 sep 2026, pasada de grasa)
  },
  'c-pollo-pure-patata-zanahoria': {
    name: 'Chicken leg + potato-carrot mash + paprika', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 180 } }, { k: 'patata', p: { grams: 250 } }, { k: 'zanahoria', p: { grams: 100 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata', // mantequilla recortada 15->8g
  },
  'c-solomillo-pure-manzana-batida': {
    name: 'Pork tenderloin + mashed potato + blended apple', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 180 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'manzana', p: { units: 0.5 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata', // mantequilla recortada 15->8g
  },
  'c-pollo-beretta-garbanzos-tomillo-limon': {
    name: 'Chicken leg (Beretta) + chickpeas + thyme and lemon', meals: ['comida'],
    items: [{ k: 'pollo-pierna', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'parsley', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'garbanzos',
  },
  'c-chili-carne-picada-blackbeans': {
    name: 'Ground beef chili + black beans + tomato + cumin-paprika', meals: ['comida'],
    items: [{ k: 'carne-picada', p: { grams: 100 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-pastel-carne-ricotta': {
    name: 'Cottage pie with baked ricotta', meals: ['comida'],
    items: [{ k: 'carne-picada', p: { grams: 100 } }, { k: 'patata', p: { grams: 250 } }, { k: 'leche', p: { grams: 60 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'ricotta', p: { grams: 60 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'aove', p: { ml: 15 } }], scalable: 'patata',
  },
  'c-solomillo-blackbeans-comino': {
    name: 'Pork tenderloin + black beans + cumin-paprika-tomato', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 150 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-turkey-blackbeans-comino': {
    name: 'Turkey drumstick + black beans + cumin-paprika-tomato', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-costillas-lentejas-laurel-vino': {
    name: 'Pork ribs + green lentils + bay leaf and wine', meals: ['comida'],
    items: [{ k: 'costillas-cerdo', p: { grams: 150 } }, { k: 'lentejas-verdes', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'vino-blanco', p: { ml: 20 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'lentejas-verdes',
  },
  'c-costillas-pintas-zanahoria': {
    name: 'Ribs + pinto beans + well-cooked carrot + bay leaf', meals: ['comida'],
    items: [{ k: 'costillas-cerdo', p: { grams: 150 } }, { k: 'romano-beans', p: { grams: 80 } }, { k: 'zanahoria', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'romano-beans',
  },
  'c-solomillo-pintas-pimenton': {
    name: 'Pork tenderloin + pinto beans + paprika and tomato', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 150 } }, { k: 'romano-beans', p: { grams: 100 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'romano-beans',
  },
  'c-lomo-pintas-cebolla-vino': {
    name: 'Pork loin + pinto beans + onion and white wine', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 180 } }, { k: 'romano-beans', p: { grams: 100 } }, { k: 'cebolla-amarilla', p: { grams: 80 } }, { k: 'vino-blanco', p: { ml: 30 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'romano-beans',
  },
  'c-turkey-pintas-huevo': {
    name: 'Turkey + pinto beans + egg', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 130 } }, { k: 'romano-beans', p: { grams: 100 } }, { k: 'huevo', p: { units: 1 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'romano-beans', // pavo recortado 180->130g (6 sep 2026, techo de proteina)
  },
  'c-pollo-pure-rustico-pipas': {
    name: 'Roast chicken leg + rustic mash + sunflower seeds', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 200 } }, { k: 'patata', p: { grams: 350 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'sunflower-seeds', p: { grams: 25 } }, { k: 'leche', p: { grams: 100 } }, { k: 'aove', p: { ml: 15 } }], scalable: 'patata',
  },
  'c-solomillo-blackbeans-huevo-tomate': {
    name: 'Pork tenderloin + black beans + egg + tomato', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 200 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'huevo', p: { units: 1 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-solomillo-blackbeans-huevo-mostaza': {
    name: 'Pork tenderloin + black beans + egg + honey mustard sauce', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 200 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'huevo', p: { units: 1 } }, { k: 'mostaza', p: { grams: 15 } }, { k: 'miel', p: { grams: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-solomillo-blackbeans-huevo-salsaverde': {
    name: 'Pork tenderloin + black beans + egg + salsa verde', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 200 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'huevo', p: { units: 1 } }, { k: 'parsley', p: {} }, { k: 'jalapeno', p: { units: 1 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'aove', p: { ml: 30 } }], scalable: 'black-beans',
  },
  'c-turkey-garbanzos-huevo-sofrito': {
    name: 'Turkey + chickpeas + egg + tomato-onion sofrito', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 140 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'huevo', p: { units: 1 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'garbanzos', // pavo recortado 200->140g
  },
  'c-turkey-blackbeans-huevo-cheddar': {
    name: 'Turkey + black beans + egg + cheddar', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 140 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'huevo', p: { units: 1 } }, { k: 'cheddar', p: { grams: 18 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'black-beans', // cheddar recortado 30->18g; pavo recortado 200->140g (techo de proteina)
  },
  'c-pollo-2huevos-garbanzos-crema': {
    name: 'Chicken leg + 2 eggs + chickpeas + chickpea cream', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'huevo', p: { units: 2 } }, { k: 'garbanzos', p: { grams: 80 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 30 } }], scalable: 'garbanzos',
  },
  'c-ens-garbanzos-aguacate-cheddar-pollo': {
    name: 'Chickpeas, avocado, cheddar and chicken leg + vinaigrette', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'cheddar', p: { grams: 30 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-ens-garbanzos-aguacate-feta-pollo': {
    name: 'Chickpeas, avocado, feta and chicken leg + vinaigrette', meals: ['comida'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'garbanzos', p: { grams: 100 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'feta-vaca', p: { grams: 40 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 20 } }], scalable: 'garbanzos',
  },
  'c-ens-blackbeans-aguacate-turkey-salsaroja': {
    name: 'Black beans, avocado, cheddar and turkey + homemade red salsa', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'cheddar', p: { grams: 20 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'jalapeno', p: { units: 1 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 15 } }], scalable: 'black-beans',
  },
  'c-ens-melon-feta-aguacate-solomillo': {
    name: 'Cantaloupe, feta, avocado and pork tenderloin', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 150 } }, { k: 'melon-cantalupo', p: { grams: 200 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'feta-vaca', p: { grams: 30 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'c-ens-manzana-feta-aguacate-solomillo': {
    name: 'Apple, feta, avocado and pork tenderloin', meals: ['comida'],
    items: [{ k: 'solomillo-cerdo', p: { grams: 150 } }, { k: 'manzana', p: { units: 0.5 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'feta-vaca', p: { grams: 30 } }, { k: 'vinagre', p: { ml: 10 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'c-lomo-tomate-pimiento-arroz': {
    name: 'Pork loin + tomato + green pepper + rice', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 150 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'pimiento-verde', p: { grams: 80 } }, { k: 'ajo', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'arroz',
  },
  'c-rancho-aragones-barato': {
    name: 'Aragonese rancho stew (cheap)', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 75 } }, { k: 'costillas-cerdo', p: { grams: 75 } }, { k: 'patata', p: { grams: 200 } }, { k: 'zanahoria', p: { grams: 100 } }, { k: 'arroz', p: { grams: 50 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'c-rancho-aragones-grande': {
    name: 'Aragonese rancho stew (large)', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 100 } }, { k: 'costillas-cerdo', p: { grams: 100 } }, { k: 'patata', p: { grams: 250 } }, { k: 'zanahoria', p: { grams: 120 } }, { k: 'arroz', p: { grams: 60 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  'c-rancho-aragones-xl': {
    name: 'Aragonese rancho stew (XL)', meals: ['comida'],
    items: [{ k: 'lomo-cerdo', p: { grams: 130 } }, { k: 'costillas-cerdo', p: { grams: 110 } }, { k: 'patata', p: { grams: 290 } }, { k: 'zanahoria', p: { grams: 140 } }, { k: 'arroz', p: { grams: 70 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 25 } }], scalable: 'patata',
  },
  // Semana 12 (astringente/diarrea) — pedido explicito del usuario: "lo que
  // mas me quita la diarrea es el rancho o el estofado de ternera". Sin
  // cebolla/ajo (fructanos) a proposito -- laurel y perejil solo para sabor,
  // ninguno de los dos dispara ninguna de las banderas digestivas del motor
  // (GOS/insoluble/fructano). Zanahoria "muy cocida" (no cruda) por lo mismo
  // que ya hace c-costillas-pintas-zanahoria.
  'c-estofado-ternera-patata-zanahoria': {
    name: 'Beef stew + potato + carrot (well-cooked)', meals: ['comida'],
    items: [{ k: 'ternera-guisar', p: { grams: 180 } }, { k: 'patata', p: { grams: 280 } }, { k: 'zanahoria', p: { grams: 150 } }, { k: 'laurel', p: {} }, { k: 'parsley', p: {} }, { k: 'aove', p: { ml: 20 } }], scalable: 'patata',
  },
  'n-mejillones-marinera-patata': {
    name: 'Mussels marinara + small sautéed potatoes', meals: ['cena'],
    items: [{ k: 'mejillones', p: { grams: 200 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'patata', p: { grams: 150 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 30 } }],
  },
  'n-bacalao-mantequilla-limon': {
    name: 'Cod with lemon butter', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 180 } }, { k: 'mantequilla', p: { grams: 25 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'vino-blanco', p: { ml: 20 } }, { k: 'aove', p: { ml: 30 } }],
  },
  'n-ceviche-bacalao': {
    name: 'Lime-cured cod ceviche + red onion + avocado', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'limon', p: { units: 1 } }, { k: 'cebolla-morada', p: { grams: 50 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'parsley', p: {} }, { k: 'aove', p: { ml: 30 } }],
  },
  'n-fajita-bowl-turkey': {
    name: 'Turkey fajita bowl', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'pimiento-verde', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'cheddar', p: { grams: 15 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-frittata-turkey-cheddar': {
    name: 'Baked turkey and cheddar frittata', meals: ['cena'],
    items: [{ k: 'huevo', p: { units: 3 } }, { k: 'turkey-drumstick', p: { grams: 100 } }, { k: 'cheddar', p: { grams: 20 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-shakshuka-turkey': {
    name: 'Green pepper and tomato shakshuka with shredded turkey', meals: ['cena'],
    items: [{ k: 'huevo', p: { units: 3 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'pimiento-verde', p: { grams: 80 } }, { k: 'turkey-drumstick', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 35 } }],
  },
  'n-burrito-pollo-arroz-pimientos': {
    name: 'Chicken burrito + rice + peppers', meals: ['cena'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'harina', p: { grams: 55 } }, { k: 'arroz', p: { grams: 75 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-burrito-pollo-blackbeans-pimientos': {
    name: 'Chicken burrito + black beans + peppers', meals: ['cena'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'harina', p: { grams: 55 } }, { k: 'black-beans', p: { grams: 80 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-sardinas-patata-huevo': {
    name: 'Sardines + potato + egg', meals: ['cena'],
    items: [{ k: 'sardina-media', p: {} }, { k: 'patata', p: { grams: 150 } }, { k: 'huevo', p: { units: 1 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-patata-3huevos': {
    name: 'Potato + 3 eggs', meals: ['cena'],
    items: [{ k: 'patata', p: { grams: 150 } }, { k: 'huevo', p: { units: 3 } }, { k: 'aove', p: { ml: 20 } }],
  },
  // Semana 12 (astringente/diarrea) — especie distinta a la comida de esa
  // semana (ternera/cerdo), arroz en vez de patata para variar la base sin
  // salirse de lo blando. Sin cebolla/ajo, pollo hervido (no frito/asado con
  // piel) -- lo mas suave posible.
  'n-pollo-hervido-arroz-zanahoria': {
    name: 'Boiled chicken + rice + carrot (well-cooked)', meals: ['cena'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 150 } }, { k: 'arroz', p: { grams: 70 } }, { k: 'zanahoria', p: { grams: 100 } }, { k: 'aove', p: { ml: 15 } }], scalable: 'arroz',
  },
  'n-turkey-patata-huevo': {
    name: 'Turkey + potato + egg', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 100 } }, { k: 'patata', p: { grams: 200 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-patata-4huevos': {
    name: 'Potato + 4 eggs', meals: ['cena'],
    items: [{ k: 'patata', p: { grams: 200 } }, { k: 'huevo', p: { units: 4 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-turkey-patata-huevo-cheddar': {
    name: 'Turkey + potato + egg + cheddar', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 100 } }, { k: 'patata', p: { grams: 200 } }, { k: 'huevo', p: { units: 2 } }, { k: 'cheddar', p: { grams: 15 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-blackbeans-huevo-patata': {
    name: 'Black beans + egg + potato', meals: ['cena'],
    items: [{ k: 'black-beans', p: { grams: 80 } }, { k: 'huevo', p: { units: 1 } }, { k: 'patata', p: { grams: 100 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-garbanzos-huevo-patata': {
    name: 'Chickpeas + egg + potato', meals: ['cena'],
    items: [{ k: 'garbanzos', p: { grams: 80 } }, { k: 'huevo', p: { units: 1 } }, { k: 'patata', p: { grams: 100 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-3huevos-patata120': {
    name: '3 eggs + potato', meals: ['cena'],
    items: [{ k: 'huevo', p: { units: 3 } }, { k: 'patata', p: { grams: 120 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-sopa-lentejas-huevo-escalfado': {
    name: 'Lentil soup with poached egg', meals: ['cena'],
    items: [{ k: 'lentejas-verdes', p: { grams: 80 } }, { k: 'huevo', p: { units: 1 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'zanahoria', p: { grams: 40 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-migas-patata-huevo': {
    name: 'Crispy potato migas with fried egg', meals: ['cena'],
    items: [{ k: 'patata', p: { grams: 250 } }, { k: 'huevo', p: { units: 2 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-huevos-rancheros': {
    name: 'Huevos rancheros', meals: ['cena'],
    items: [{ k: 'black-beans', p: { grams: 80 } }, { k: 'huevo', p: { units: 2 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'comino', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-pure-garbanzos-huevo-frito': {
    name: 'Warm chickpea purée with fried egg and paprika', meals: ['cena'],
    items: [{ k: 'garbanzos', p: { grams: 80 } }, { k: 'huevo', p: { units: 2 } }, { k: 'pimenton', p: {} }, { k: 'limon', p: { units: 0.25 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-huevos-flamenca': {
    name: 'Flamenco-style baked eggs', meals: ['cena'],
    items: [{ k: 'garbanzos', p: { grams: 50 } }, { k: 'huevo', p: { units: 2 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'pimiento-verde', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-tostadas-tomate-huevo': {
    name: 'Tomato toast with egg (pan tumaca)', meals: ['cena'],
    items: [{ k: 'pan-masa-madre', p: { grams: 120 } }, { k: 'tomate-conserva', p: { grams: 100 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-tostadas-aguacate-huevo': {
    name: 'Avocado toast with egg', meals: ['cena'],
    items: [{ k: 'pan-masa-madre', p: { grams: 120 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-bacalao-legumbre-lentejas': {
    name: 'Cod and lentil stew', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 100 } }, { k: 'lentejas-verdes', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 40 } }, { k: 'laurel', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-bacalao-garbanzos-tomate': {
    name: 'Cod + chickpeas + tomato', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 120 } }, { k: 'garbanzos', p: { grams: 120 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'aove', p: { ml: 35 } }],
  },
  'n-bacalao-blackbeans-comino': {
    name: 'Cod + black beans + tomato-cumin', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 120 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'tomate-conserva', p: { grams: 50 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 35 } }],
  },
  'n-bacalao-patata-tomate': {
    name: 'Cod + potato + tomato (no legumes)', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 100 } }, { k: 'patata', p: { grams: 200 } }, { k: 'tomate-conserva', p: { grams: 60 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-bacalao-pure-simple': {
    name: 'Cod + simple mashed potato', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 300 } }, { k: 'leche', p: { grams: 40 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'aove', p: { ml: 25 } }], // mantequilla recortada 15->8g
  },
  'n-bacalao-pure-squash': {
    name: 'Cod + potato-squash mash', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'squash-butternut', p: { grams: 150 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'aove', p: { ml: 25 } }], // mantequilla recortada 15->8g
  },
  // NUEVO 3 sep 2026 — variante con huevo, a peticion. El squash aporta pectina
  // (fibra soluble) en la cena, que es donde encaja: la calabaza en batido
  // desplaza sabor y el pure la absorbe sin notarse.
  'n-bacalao-pure-squash-huevo': {
    name: 'Cod + potato-squash mash + egg', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'squash-butternut', p: { grams: 150 } }, { k: 'huevo', p: { units: 1 } }, { k: 'mantequilla', p: { grams: 8 } }, { k: 'aove', p: { ml: 25 } }], // mantequilla recortada 15->8g
  },
  'n-bacalao-pure-zucchini': {
    name: 'Cod + potato-zucchini mash', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'zucchini', p: { grams: 120 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'leche', p: { grams: 30 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-bacalao-pure-puerro': {
    name: 'Cod + potato-leek mash', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'patata', p: { grams: 250 } }, { k: 'puerro', p: { units: 0.25 } }, { k: 'mantequilla', p: { grams: 15 } }, { k: 'leche', p: { grams: 40 } }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-turkey-mejillones-cazuela': {
    name: 'Turkey and mussel casserole', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'mejillones', p: { grams: 200 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-bacalao-mejillones-cazuela': {
    name: 'Cod and mussel casserole', meals: ['cena'],
    items: [{ k: 'bacalao', p: { grams: 150 } }, { k: 'mejillones', p: { grams: 200 } }, { k: 'tomate-conserva', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'n-burrito-harina-2huevos': {
    // scalableMax (6 sep 2026): sin esto, un dia de mucha kcal podia escalar
    // la harina hasta ~200g+ (4x el default) -- demasiada masa para una sola
    // cena. Tope a 150g (~2.7x); si aun asi falta, sale el aviso de snack.
    name: 'Flour burrito + 2 eggs', meals: ['cena'], scalableMax: 150,
    items: [{ k: 'harina', p: { grams: 55 } }, { k: 'huevo', p: { units: 2 } }, { k: 'aove', p: { ml: 10 } }],
  },
  'n-burrito-huevo-turkey-queso': {
    name: 'Egg, turkey and cheese burrito', meals: ['cena'],
    items: [{ k: 'harina', p: { grams: 55 } }, { k: 'huevo', p: { units: 3 } }, { k: 'turkey-drumstick', p: { grams: 60 } }, { k: 'cheddar', p: { grams: 10 } }, { k: 'aove', p: { ml: 15 } }],
  },
  'n-rancho-aragones-costillas': {
    name: 'Aragonese rancho stew (pork ribs)', meals: ['cena'],
    items: [{ k: 'costillas-cerdo', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'zanahoria', p: { grams: 100 } }, { k: 'arroz', p: { grams: 50 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-rancho-aragones-lomo': {
    name: 'Aragonese rancho stew (pork loin)', meals: ['cena'],
    items: [{ k: 'lomo-cerdo', p: { grams: 150 } }, { k: 'patata', p: { grams: 200 } }, { k: 'zanahoria', p: { grams: 100 } }, { k: 'arroz', p: { grams: 50 } }, { k: 'ajo', p: {} }, { k: 'aove', p: { ml: 20 } }],
  },
  'n-fajitas-pollo-sin-tortilla': {
    name: 'Chicken fajitas, no tortilla', meals: ['cena'],
    items: [{ k: 'pollo-pierna-generic', p: { grams: 180 } }, { k: 'pimiento-verde', p: { grams: 80 } }, { k: 'pimiento-amarillo', p: { grams: 80 } }, { k: 'cebolla-amarilla', p: { grams: 60 } }, { k: 'limon', p: { units: 0.5 } }, { k: 'comino', p: {} }, { k: 'pimenton', p: {} }, { k: 'aove', p: { ml: 25 } }],
  },
  'b-arandanos': {
    name: 'Blueberry shake', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'arandanos', p: { grams: 80 } }, { k: 'mantequilla', p: { grams: 25 } }],
  },
  'b-clasico': {
    name: 'Classic shake', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'mantequilla', p: { grams: 10 } }, { k: 'pumpkin-seeds', p: { grams: 20 } }], // mantequilla recortada 20->10g
  },
  'b-clasico-2': {
    name: 'Classic shake 2', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'almendras', p: { grams: 20 } }],
  },
  'b-citrico': {
    name: 'Citrus shake', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'yogur-cabra', p: { grams: 150 } }, { k: 'mandarina', p: { units: 1 } }, { k: 'arandanos', p: { grams: 80 } }, { k: 'mantequilla', p: { grams: 12 } }], // mantequilla recortada 25->12g
  },
  'm-proteina-portatil': {
    // 6 sep 2026: merienda de Maria para lunes/miercoles (trabaja, sin
    // batidora). Se agita en un shaker, no se cocina. Reemplaza el "cero
    // merienda" del Paso 4 -- sin esto, comida+cena tenian que compensar
    // ~800 kcal solas y eso disparaba la grasa del dia muy por encima de lo
    // razonable. Proteina en polvo + leche desnatada + banana: ~29g grasa
    // menos que el batido clasico, con mas proteina.
    name: 'Protein shake to go', meals: ['merienda'],
    items: [{ k: 'proteina-polvo', p: { grams: 35 } }, { k: 'leche-desnatada', p: { grams: 350 } }, { k: 'banana', p: { grams: 120 } }],
  },
  'b-melon': {
    name: 'Melon shake', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'melon-cantalupo', p: { grams: 200 } }, { k: 'mantequilla', p: { grams: 20 } }],
  },
  'b-aguacate-cacao': {
    name: 'Avocado and cocoa shake', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'aguacate', p: { units: 0.5 } }, { k: 'cacao', p: { grams: 5 } }, { k: 'banana', p: { grams: 120 } }],
  },
  'b-fruto-seco': {
    name: 'Nut shake', meals: ['merienda'],
    items: [{ k: 'avena', p: { grams: 100 } }, { k: 'kefir', p: { ml: 150 } }, { k: 'banana', p: { grams: 120 } }, { k: 'avellana', p: { grams: 20 } }, { k: 'mantequilla', p: { grams: 15 } }],
  },
  // Semana 12 (astringente/diarrea) — sin lacteos (leche/yogur/mantequilla),
  // sin frutos secos/semillas (INSOLUBLE_KEYS), sin citricos. Platano bien
  // maduro (mas astringente que verde) + manzana (mejor cocida/en compota en
  // la cocina real, aunque aqui solo exista la manzana cruda como ingrediente)
  // + miel para kcal facil de digerir.
  'm-astringente-platano-manzana': {
    // Version final (pedido del usuario): tostada + manzana hervida (la
    // compota YA ES esto -- "Lsm bio Unsweetened Apple Sauce", precio real
    // confirmado por el) en vez de platano -- se descarto el membrillo por
    // precio real ($2-3/ud, mucho mas caro que la compota).
    name: 'Sourdough toast with boiled apple and honey (binding)', meals: ['merienda'],
    items: [{ k: 'pan-masa-madre', p: { grams: 80 } }, { k: 'compota-manzana', p: { grams: 200 } }, { k: 'miel', p: { grams: 10 } }],
  },
  'b-blando': {
    name: 'Gentle shake (bad stomach day)', meals: ['merienda'],
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
    name: 'Weight-gain shake (quince)', meals: ['merienda'],
    items: [{ k: 'cebada-copos', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'membrillo', p: { grams: 150 } }, { k: 'aove', p: { ml: 15 } }], // aceite-coco (87% sat) -> AOVE (14% sat), misma densidad calorica
  },
  // Variante con manzana: mas facil de encontrar todo el ano y algo mas barata,
  // pero menos pectina y mas sorbitol. Misma tecnica: hervir y tirar el agua.
  'b-ganancia-manzana': {
    name: 'Weight-gain shake (apple)', meals: ['merienda'],
    items: [{ k: 'cebada-copos', p: { grams: 100 } }, { k: 'leche', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'manzana', p: { units: 1 } }, { k: 'aove', p: { ml: 15 } }], // aceite-coco (87% sat) -> AOVE (14% sat), misma densidad calorica
  },
}
