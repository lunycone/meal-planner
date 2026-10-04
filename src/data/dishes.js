// AUTO-GENERATED dish catalog. See scratchpad/build_dishes.mjs for source of truth.
// Regenerate by editing that script and re-running it.

export const DISHES = {
  // 5 PLATOS NUEVOS (4 sep 2026): existian solo como nombre + cifra suelta
  // en el HTML original (Downloads/semanas-modelo.html), nunca como receta
  // real con ingredientes. Construidos fieles al nombre, a peticion expresa
  // del usuario ("que sean fieles al nombre aunque no cumplan las reglas").
  // No se han forzado a cumplir grasa<=15g ni ningun otro techo digestivo.
  'd-eggs-sourdough-toast-honey': {
    name: 'Eggs + sourdough toast + honey', meals: ['desayuno'],
    items: [{ k: 'eggs', p: { units: 2 } }, { k: 'sourdough-bread', p: { grams: 40 } }, { k: 'honey', p: { grams: 15 } }],
  },
  'd-eggs-toast-honey': {
    name: 'Eggs + toast + honey', meals: ['desayuno'],
    items: [{ k: 'eggs', p: { units: 2 } }, { k: 'sourdough-bread', p: { grams: 35 } }, { k: 'honey', p: { grams: 10 } }],
  },
  'd-toast-2-eggs': {
    name: 'Toast + 2 eggs', meals: ['desayuno'],
    items: [{ k: 'eggs', p: { units: 2 } }, { k: 'sourdough-bread', p: { grams: 35 } }],
  },
  'd-oats-with-skim-milk-and-honey': {
    // 6 sep 2026: disenado para cumplir las DOS reglas del desayuno a la vez
    // (>=400 kcal, <=15g grasa) -- antes solo el burrito de maiz lo lograba.
    // 6 sep 2026 (2): leche 300->400g a peticion (+3-5g prot al dia entre
    // los dos) -- mismo ingrediente que ya llevaba, solo mas cantidad; la
    // leche desnatada apenas sube grasa (0.1g/100g), asi que no toca el
    // techo de grasa del desayuno.
    name: 'Oats with skim milk and honey', meals: ['desayuno'],
    items: [{ k: 'oats', p: { grams: 70 } }, { k: 'skim-milk', p: { grams: 400 } }, { k: 'honey', p: { grams: 15 } }], scalable: 'oats',
  },
  'd-sourdough-toast-with-honey-and-banana': {
    // Mismo objetivo que el de arriba, con otra base (pan en vez de avena)
    // para dar variedad real sin repetir ingrediente principal.
    // 6 sep 2026 (2): pan 100->140g a peticion (+3-5g prot).
    name: 'Sourdough toast with honey and banana', meals: ['desayuno'],
    items: [{ k: 'sourdough-bread', p: { grams: 140 } }, { k: 'banana', p: { grams: 120 } }, { k: 'honey', p: { grams: 15 } }],
  },
  'd-scrambled-eggs-with-sourdough-toast-and-honey': {
    // 6 sep 2026: version con huevo de los dos platos de arriba -- llevaban
    // proteina (avena+leche desnatada ya daba 22g) pero sin huevo la sensacion
    // era de "no hay proteina real". Este la deja explicita: 20g, con huevo.
    // 6 sep 2026 (2): huevo 2->2.5 unidades a peticion (+3-5g prot).
    name: 'Scrambled eggs with sourdough toast and honey', meals: ['desayuno'],
    items: [{ k: 'eggs', p: { units: 2.5 } }, { k: 'sourdough-bread', p: { grams: 90 } }, { k: 'honey', p: { grams: 10 } }], scalable: 'sourdough-bread',
  },
  // Semana 12 (astringente) — variantes SIN miel de los dos platos de
  // arriba, pedidas por el usuario (aceite+sal en vez de miel). Platos
  // nuevos, no ediciones de los originales -- esos dos siguen usandose en
  // las otras 11 semanas, ya afinados para cumplir grasa<=15g ahi; anadir
  // AOVE a ESOS habria roto ese tope. Aqui no hay ese problema (grasa suelta
  // bastante mas baja para empezar).
  // 6 sep 2026 (2): pan 100->135g a peticion (+3-5g prot).
  'd-sourdough-toast-with-banana-evoo-and-salt': {
    name: 'Sourdough toast with banana, EVOO and salt', meals: ['desayuno'],
    items: [{ k: 'sourdough-bread', p: { grams: 135 } }, { k: 'banana', p: { grams: 120 } }, { k: 'evoo', p: { ml: 10 } }, { k: 'salt', p: {} }],
  },
  // 6 sep 2026 (2): este plato YA estaba a 20g de grasa (huevo+AOVE), por
  // encima del techo de 15g, desde antes de hoy -- subir el huevo (como se
  // hizo primero) lo habria dejado peor (22.5g). Se sube pan en su lugar
  // (sin grasa) 90->125g: mismos +3g de proteina, sin empeorar lo que ya
  // estaba roto.
  'd-scrambled-eggs-with-sourdough-toast-and-evoo': {
    name: 'Scrambled eggs with sourdough toast and EVOO', meals: ['desayuno'],
    items: [{ k: 'eggs', p: { units: 2 } }, { k: 'sourdough-bread', p: { grams: 125 } }, { k: 'evoo', p: { ml: 10 } }], scalable: 'sourdough-bread',
  },
  // d-avena-huevo-platano RETIRADO (6 sep 2026): "vomitina", descartado por
  // el usuario. No usar esta combinacion en ningun plato futuro.
  //
  // 6 sep 2026 — grupo "bajo en IG, sin aceptar mas grasa" (tope 18-19g).
  // Antes de esto, el catalogo tenia una correlacion casi perfecta: bajo en
  // grasa = alto en IG (avena, pan, burrito) o bajo en IG = alto en grasa
  // (bacon, cheddar, aguacate). La salida es proteina en polvo + base lactea:
  // no es almidon (no sube IG) y aporta kcal sin apenas grasa.
  'd-breakfast-protein-shake': {
    name: 'Breakfast protein shake', meals: ['desayuno'],
    items: [{ k: 'whey-protein', p: { grams: 60 } }, { k: 'skim-milk', p: { grams: 400 } }, { k: 'banana', p: { grams: 40 } }],
  },
  'd-cocoa-protein-shake': {
    name: 'Cocoa protein shake', meals: ['desayuno'],
    items: [{ k: 'whey-protein', p: { grams: 65 } }, { k: 'skim-milk', p: { grams: 400 } }, { k: 'cocoa', p: { grams: 10 } }],
  },
  'd-high-protein-cow-yogurt-with-melon': {
    name: 'High-protein cow yogurt with melon', meals: ['desayuno'],
    items: [{ k: 'cow-yogurt', p: { grams: 350 } }, { k: 'whey-protein', p: { grams: 35 } }, { k: 'cantaloupe', p: { grams: 150 } }],
  },
  'd-high-protein-goat-yogurt-with-mandarin': {
    name: 'High-protein goat yogurt with mandarin', meals: ['desayuno'],
    items: [{ k: 'goat-yogurt', p: { grams: 350 } }, { k: 'whey-protein', p: { grams: 35 } }, { k: 'mandarin', p: { grams: 74 } }],
  },
  'd-yogurt-banana-oats': {
    name: 'Yogurt + banana + oats', meals: ['desayuno'],
    items: [{ k: 'cow-yogurt', p: { grams: 150 } }, { k: 'banana', p: { grams: 80 } }, { k: 'oats', p: { grams: 30 } }],
  },
  'd-simple-rice-pudding': {
    name: 'Simple rice pudding', meals: ['desayuno'],
    items: [{ k: 'rice', p: { grams: 40 } }, { k: 'whole-milk', p: { grams: 250 } }],
  },
  // 6 sep 2026 (2): cheddar 20->32g a peticion (+3-5g prot).
  'd-omelette-cheddar-avocado': {
    name: 'Omelette + cheddar + avocado', meals: ['desayuno', 'cena'],
    items: [{ k: 'eggs', p: { units: 3 } }, { k: 'cheddar', p: { grams: 32 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'evoo', p: { ml: 10 } }],
  },
  'd-sardines-egg-cheddar': {
    name: 'Sardines + egg + cheddar', meals: ['desayuno', 'cena'],
    items: [{ k: 'sardines-half-can', p: {} }, { k: 'eggs', p: { units: 1 } }, { k: 'cheddar', p: { grams: 15 } }, { k: 'evoo', p: { ml: 10 } }],
  },
  'd-100pct-corn-burrito': {
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
    items: [{ k: 'masa-harina', p: { grams: 110 } }, { k: 'water', p: { grams: 119 } }, { k: 'eggs', p: { units: 2 } }],
  },
  'd-corn-burrito-cheddar': {
    name: 'Corn burrito + cheddar', meals: ['desayuno', 'cena'],
    items: [{ k: 'masa-harina', p: { grams: 60 } }, { k: 'water', p: { grams: 65 } }, { k: 'eggs', p: { units: 3 } }, { k: 'cheddar', p: { grams: 10 } }],
  },
  // 6 sep 2026 (2): harina de garbanzo 30->45g a peticion (+3-5g prot).
  // 6 sep 2026 (3): agua para las dos harinas juntas (ver comentario en
  // d-burrito-maiz).
  'd-50-50-burrito-corn-chickpea': {
    name: '50/50 burrito (corn + chickpea)', meals: ['desayuno', 'cena'],
    items: [{ k: 'masa-harina', p: { grams: 30 } }, { k: 'chickpea-flour', p: { grams: 45 } }, { k: 'water', p: { grams: 81 } }, { k: 'eggs', p: { units: 3 } }],
  },
  'd-50-50-burrito-cheddar': {
    name: '50/50 burrito + cheddar', meals: ['desayuno', 'cena'],
    items: [{ k: 'masa-harina', p: { grams: 30 } }, { k: 'chickpea-flour', p: { grams: 30 } }, { k: 'water', p: { grams: 65 } }, { k: 'eggs', p: { units: 3 } }, { k: 'cheddar', p: { grams: 10 } }],
  },
  'd-bread-eggs-avocado': {
    name: 'Bread + eggs + avocado', meals: ['desayuno', 'cena'],
    items: [{ k: 'sourdough-bread', p: { grams: 60 } }, { k: 'eggs', p: { units: 2 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'evoo', p: { ml: 10 } }],
  },
  'd-yogurt-almonds-pumpkin-seeds-chocolate': {
    name: 'Yogurt, almonds, pumpkin seeds, chocolate', meals: ['desayuno'],
    items: [{ k: 'goat-yogurt', p: { grams: 150 } }, { k: 'almonds', p: { grams: 20 } }, { k: 'pumpkin-seeds', p: { grams: 20 } }, { k: 'dark-chocolate', p: { grams: 15 } }, { k: 'cinnamon', p: {} }],
  },
  'd-chickpea-socca-with-feta-and-eggs': {
    name: 'Chickpea socca with feta and eggs', meals: ['desayuno'],
    items: [{ k: 'chickpea-flour', p: { grams: 60 } }, { k: 'feta-cow', p: { grams: 30 } }, { k: 'eggs', p: { units: 2 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'd-bacon-and-eggs': {
    name: 'Bacon and eggs', meals: ['desayuno'],
    items: [{ k: 'bacon', p: { grams: 40 } }, { k: 'eggs', p: { units: 2 } }, { k: 'evoo', p: { ml: 10 } }],
  },
  'd-generous-bacon-1-egg': {
    name: 'Generous bacon + 1 egg', meals: ['desayuno'],
    items: [{ k: 'bacon', p: { grams: 60 } }, { k: 'eggs', p: { units: 1 } }, { k: 'evoo', p: { ml: 10 } }],
  },
  'd-bacon-burrito': {
    name: 'Bacon burrito', meals: ['desayuno'],
    items: [{ k: 'flour', p: { grams: 55 } }, { k: 'bacon', p: { grams: 40 } }, { k: 'eggs', p: { units: 2 } }, { k: 'evoo', p: { ml: 10 } }],
  },
  'd-chocolate-overnight-oats': {
    name: 'Chocolate overnight oats', meals: ['desayuno'],
    items: [{ k: 'oats', p: { grams: 45 } }, { k: 'goat-yogurt', p: { grams: 120 } }, { k: 'whole-milk', p: { grams: 120 } }, { k: 'chia', p: { grams: 12 } }, { k: 'cocoa', p: { grams: 8 } }, { k: 'honey', p: { grams: 10 } }],
  },
  // 6 sep 2026 (2): harina 60->75g a peticion (+3-5g prot) -- nombre
  // actualizado a "75g" para que siga diciendo la cantidad real (la key
  // 'd-torta-garbanzo-60' se queda igual, la referencian otras semanas).
  'd-chickpea-flatbread-75g-evoo': {
    name: 'Chickpea flatbread (75g) + EVOO', meals: ['desayuno'],
    items: [{ k: 'chickpea-flour', p: { grams: 75 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'd-chickpea-flatbread-80g-evoo': {
    name: 'Chickpea flatbread (80g) + EVOO', meals: ['desayuno'],
    items: [{ k: 'chickpea-flour', p: { grams: 80 } }, { k: 'evoo', p: { ml: 25 } }],
  },
  'd-chickpea-flatbread-100g-evoo': {
    name: 'Chickpea flatbread (100g) + EVOO', meals: ['desayuno'],
    items: [{ k: 'chickpea-flour', p: { grams: 100 } }, { k: 'evoo', p: { ml: 25 } }],
  },
  'd-chickpea-flatbread-50g-1-egg-evoo': {
    name: 'Chickpea flatbread (50g) + 1 egg + EVOO', meals: ['desayuno'],
    items: [{ k: 'chickpea-flour', p: { grams: 50 } }, { k: 'eggs', p: { units: 1 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'd-chickpea-flatbread-100g-1-egg-evoo': {
    name: 'Chickpea flatbread (100g) + 1 egg + EVOO', meals: ['desayuno'],
    items: [{ k: 'chickpea-flour', p: { grams: 100 } }, { k: 'eggs', p: { units: 1 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'd-chickpea-flatbread-120g-1-egg-evoo': {
    name: 'Chickpea flatbread (120g) + 1 egg + EVOO', meals: ['desayuno'],
    items: [{ k: 'chickpea-flour', p: { grams: 120 } }, { k: 'eggs', p: { units: 1 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'd-extreme-chickpea-flatbread-60-70g-protein': {
    name: 'Extreme chickpea flatbread (60-70g protein)', meals: ['desayuno'],
    items: [{ k: 'chickpea-flour', p: { grams: 120 } }, { k: 'eggs', p: { units: 5 } }, { k: 'cheddar', p: { grams: 30 } }, { k: 'evoo', p: { ml: 25 } }],
  },
  'c-pork-loin-afghan-rice': {
    name: 'Pork loin + Afghan rice', meals: ['comida'],
    items: [{ k: 'pork-loin', p: { grams: 150 } }, { k: 'rice', p: { grams: 75 } }, { k: 'cumin', p: {} }, { k: 'cinnamon', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'rice',
  },
  'c-paella-style-mussels': {
    name: 'Paella-style mussels', meals: ['comida'],
    items: [{ k: 'mussels', p: { grams: 150 } }, { k: 'rice', p: { grams: 75 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'green-pepper', p: { grams: 60 } }, { k: 'canned-tomatoes', p: { grams: 50 } }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 30 } }], scalable: 'rice',
  },
  'c-turkey-drumstick-sweet-and-sour-glaze': {
    name: 'Turkey drumstick + sweet & sour glaze', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'rice', p: { grams: 75 } }, { k: 'carrot', p: { grams: 80 } }, { k: 'honey', p: { grams: 10 } }, { k: 'paprika', p: {} }, { k: 'vinegar', p: { ml: 10 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'rice',
  },
  'c-chicken-leg-afghan-rice-onion-and-lemon': {
    name: 'Chicken leg + Afghan rice + onion and lemon', meals: ['comida'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 150 } }, { k: 'rice', p: { grams: 75 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'lemon', p: { units: 0.5 } }, { k: 'cumin', p: {} }, { k: 'cinnamon', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'rice',
  },
  'c-pork-loin-roast-potato-paprika-marinade': {
    name: 'Pork loin + roast potato + paprika marinade', meals: ['comida'],
    items: [{ k: 'pork-loin', p: { grams: 150 } }, { k: 'potato', p: { grams: 250 } }, { k: 'paprika', p: {} }, { k: 'garlic', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato',
  },
  'c-turkey-caramelized-onion-mustard-sauce': {
    name: 'Turkey + caramelized onion + mustard sauce', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'potato', p: { grams: 200 } }, { k: 'yellow-onion', p: { grams: 100 } }, { k: 'mustard', p: { grams: 15 } }, { k: 'honey', p: { grams: 10 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato',
  },
  'c-chicken-drumstick-beretta-chickpeas-moroccan-spices': {
    name: 'Chicken drumstick (Beretta) + chickpeas + Moroccan spices', meals: ['comida'],
    items: [{ k: 'chicken-drumstick', p: { grams: 150 } }, { k: 'chickpeas', p: { grams: 80 } }, { k: 'canned-tomatoes', p: { grams: 60 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'chickpeas',
  },
  'c-turkey-caramelized-onion-escabeche-style': {
    name: 'Turkey + caramelized onion, escabeche style', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'potato', p: { grams: 200 } }, { k: 'yellow-onion', p: { grams: 100 } }, { k: 'carrot', p: { grams: 80 } }, { k: 'white-wine', p: { ml: 30 } }, { k: 'vinegar', p: { ml: 20 } }, { k: 'black-pepper', p: {} }, { k: 'bay-leaves', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato',
  },
  'c-chicken-leg-apple-onion-rice': {
    name: 'Chicken leg + apple-onion + rice', meals: ['comida'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 200 } }, { k: 'rice', p: { grams: 75 } }, { k: 'yellow-onion', p: { grams: 80 } }, { k: 'apple', p: { units: 0.5 } }, { k: 'vinegar', p: { ml: 10 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'rice',
  },
  'c-pork-tenderloin-potato-lemon-cream': {
    // 6 sep 2026: no hay mayonesa en casa -- se quita del todo, no se
    // sustituye por otro ingrediente graso. Yogur da la acidez sin el aporte
    // de grasa de la mayonesa (144kcal/20g grasa por 25g -> practicamente 0).
    name: 'Pork tenderloin + potato + lemon cream', meals: ['comida'],
    items: [{ k: 'pork-tenderloin', p: { grams: 180 } }, { k: 'potato', p: { grams: 250 } }, { k: 'cow-yogurt', p: { grams: 40 } }, { k: 'lemon', p: { units: 0.5 } }, { k: 'evoo', p: { ml: 25 } }], scalable: 'potato',
  },
  'c-spanish-ham-hock-chickpeas-potato-bay-leaf': {
    name: 'Spanish ham hock + chickpeas + potato + bay leaf', meals: ['comida'],
    items: [{ k: 'ham-hock', p: { grams: 120 } }, { k: 'chickpeas', p: { grams: 80 } }, { k: 'potato', p: { grams: 150 } }, { k: 'carrot', p: { grams: 60 } }, { k: 'bay-leaves', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'chickpeas',
  },
  'c-ham-hock-on-mash-with-oven-roasted-chickpeas': {
    name: 'Ham hock on mash with oven-roasted chickpeas', meals: ['comida'],
    items: [{ k: 'ham-hock', p: { grams: 120 } }, { k: 'potato', p: { grams: 200 } }, { k: 'whole-milk', p: { grams: 60 } }, { k: 'butter', p: { grams: 15 } }, { k: 'chickpeas', p: { grams: 70 } }, { k: 'paprika', p: {} }, { k: 'cumin', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato',
  },
  'c-turkey-mushrooms-wine-autumn': {
    name: 'Turkey + mushrooms + wine (autumn)', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'chickpeas', p: { grams: 80 } }, { k: 'mushrooms', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'white-wine', p: { ml: 30 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'chickpeas',
  },
  'c-bangers-and-mash': {
    name: 'Bangers and mash', meals: ['comida'],
    items: [{ k: 'sausages', p: { grams: 150 } }, { k: 'potato', p: { grams: 250 } }, { k: 'whole-milk', p: { grams: 60 } }, { k: 'butter', p: { grams: 15 } }, { k: 'yellow-onion', p: { grams: 80 } }, { k: 'evoo', p: { ml: 15 } }], scalable: 'potato',
  },
  'c-beef-liver-caramelized-onion-mashed-potato': {
    name: 'Beef liver + caramelized onion + mashed potato', meals: ['comida'],
    items: [{ k: 'beef-liver', p: { grams: 150 } }, { k: 'potato', p: { grams: 250 } }, { k: 'whole-milk', p: { grams: 60 } }, { k: 'butter', p: { grams: 15 } }, { k: 'yellow-onion', p: { grams: 100 } }, { k: 'vinegar', p: { ml: 10 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato',
  },
  'c-liver-spiced-diced-potatoes-onion': {
    name: 'Liver + spiced diced potatoes + onion', meals: ['comida'],
    items: [{ k: 'beef-liver', p: { grams: 150 } }, { k: 'potato', p: { grams: 250 } }, { k: 'yellow-onion', p: { grams: 100 } }, { k: 'green-pepper', p: { grams: 60 } }, { k: 'paprika', p: {} }, { k: 'cumin', p: {} }, { k: 'evoo', p: { ml: 25 } }], scalable: 'potato',
  },
  'c-ham-hock-chickpeas-bay-leaf-large-serving': {
    name: 'Ham hock + chickpeas + bay leaf (large serving)', meals: ['comida'],
    items: [{ k: 'ham-hock', p: { grams: 150 } }, { k: 'chickpeas', p: { grams: 100 } }, { k: 'carrot', p: { grams: 80 } }, { k: 'bay-leaves', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 25 } }], scalable: 'chickpeas',
  },
  'c-pork-meatballs-eataly-tomato-mash': {
    name: 'Pork meatballs (Eataly) + tomato + mash', meals: ['comida'],
    items: [{ k: 'ground-pork', p: { grams: 120 } }, { k: 'eggs', p: { units: 0.5 } }, { k: 'canned-tomatoes', p: { grams: 100 } }, { k: 'potato', p: { grams: 250 } }, { k: 'whole-milk', p: { grams: 60 } }, { k: 'butter', p: { grams: 15 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato',
  },
  'c-chicken-thigh-foodland-ac-butter-milk-mash-mushrooms': {
    name: 'Chicken thigh (Foodland AC) + butter-milk mash + mushrooms in wine', meals: ['comida'],
    items: [{ k: 'chicken-thigh-foodland', p: { grams: 150 } }, { k: 'potato', p: { grams: 300 } }, { k: 'whole-milk', p: { grams: 80 } }, { k: 'butter', p: { grams: 20 } }, { k: 'mushrooms', p: { grams: 60 } }, { k: 'white-wine', p: { ml: 25 } }, { k: 'evoo', p: { ml: 25 } }], scalable: 'potato',
  },
  'c-ground-beef-potato-tomato-garlic': {
    name: 'Ground beef + potato + tomato-garlic', meals: ['comida'],
    items: [{ k: 'ground-beef', p: { grams: 120 } }, { k: 'potato', p: { grams: 250 } }, { k: 'canned-tomatoes', p: { grams: 100 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'garlic', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato',
  },
  'c-organic-chicken-thigh-farm-boy-extra-chickpeas-tomato': {
    name: 'Organic chicken thigh (Farm Boy) + extra chickpeas + tomato-cumin', meals: ['comida'],
    items: [{ k: 'chicken-thigh-farmboy', p: { grams: 150 } }, { k: 'chickpeas', p: { grams: 120 } }, { k: 'canned-tomatoes', p: { grams: 80 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 25 } }], scalable: 'chickpeas',
  },
  'c-lamb-mashed-potato-onion-bay-leaf': {
    name: 'Lamb + mashed potato + onion + bay leaf', meals: ['comida'],
    items: [{ k: 'lamb', p: { grams: 150 } }, { k: 'potato', p: { grams: 250 } }, { k: 'whole-milk', p: { grams: 60 } }, { k: 'butter', p: { grams: 8 } }, { k: 'yellow-onion', p: { grams: 80 } }, { k: 'bay-leaves', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato', // mantequilla recortada 15->8g (6 sep 2026, pasada de grasa)
  },
  'c-chicken-leg-potato-carrot-mash-paprika': {
    name: 'Chicken leg + potato-carrot mash + paprika', meals: ['comida'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 180 } }, { k: 'potato', p: { grams: 250 } }, { k: 'carrot', p: { grams: 100 } }, { k: 'whole-milk', p: { grams: 60 } }, { k: 'butter', p: { grams: 8 } }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato', // mantequilla recortada 15->8g
  },
  'c-pork-tenderloin-mashed-potato-blended-apple': {
    name: 'Pork tenderloin + mashed potato + blended apple', meals: ['comida'],
    items: [{ k: 'pork-tenderloin', p: { grams: 180 } }, { k: 'potato', p: { grams: 250 } }, { k: 'whole-milk', p: { grams: 60 } }, { k: 'butter', p: { grams: 8 } }, { k: 'apple', p: { units: 0.5 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato', // mantequilla recortada 15->8g
  },
  'c-chicken-leg-beretta-chickpeas-thyme-and-lemon': {
    name: 'Chicken leg (Beretta) + chickpeas + thyme and lemon', meals: ['comida'],
    items: [{ k: 'chicken-leg', p: { grams: 150 } }, { k: 'chickpeas', p: { grams: 100 } }, { k: 'lemon', p: { units: 0.5 } }, { k: 'dried-parsley', p: {} }, { k: 'evoo', p: { ml: 25 } }], scalable: 'chickpeas',
  },
  'c-ground-beef-chili-black-beans-tomato-cumin-paprika': {
    name: 'Ground beef chili + black beans + tomato + cumin-paprika', meals: ['comida'],
    items: [{ k: 'ground-beef', p: { grams: 100 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'canned-tomatoes', p: { grams: 100 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-cottage-pie-with-baked-ricotta': {
    name: 'Cottage pie with baked ricotta', meals: ['comida'],
    items: [{ k: 'ground-beef', p: { grams: 100 } }, { k: 'potato', p: { grams: 250 } }, { k: 'whole-milk', p: { grams: 60 } }, { k: 'butter', p: { grams: 15 } }, { k: 'ricotta', p: { grams: 60 } }, { k: 'carrot', p: { grams: 80 } }, { k: 'canned-tomatoes', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'evoo', p: { ml: 15 } }], scalable: 'potato',
  },
  'c-pork-tenderloin-black-beans-cumin-paprika-tomato': {
    name: 'Pork tenderloin + black beans + cumin-paprika-tomato', meals: ['comida'],
    items: [{ k: 'pork-tenderloin', p: { grams: 150 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'canned-tomatoes', p: { grams: 60 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-turkey-drumstick-black-beans-cumin-paprika-tomato': {
    name: 'Turkey drumstick + black beans + cumin-paprika-tomato', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'canned-tomatoes', p: { grams: 60 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-pork-ribs-green-lentils-bay-leaf-and-wine': {
    name: 'Pork ribs + green lentils + bay leaf and wine', meals: ['comida'],
    items: [{ k: 'pork-ribs', p: { grams: 150 } }, { k: 'green-lentils', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'white-wine', p: { ml: 20 } }, { k: 'bay-leaves', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'green-lentils',
  },
  'c-ribs-pinto-beans-well-cooked-carrot-bay-leaf': {
    name: 'Ribs + pinto beans + well-cooked carrot + bay leaf', meals: ['comida'],
    items: [{ k: 'pork-ribs', p: { grams: 150 } }, { k: 'romano-beans', p: { grams: 80 } }, { k: 'carrot', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'bay-leaves', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'romano-beans',
  },
  'c-pork-tenderloin-pinto-beans-paprika-and-tomato': {
    name: 'Pork tenderloin + pinto beans + paprika and tomato', meals: ['comida'],
    items: [{ k: 'pork-tenderloin', p: { grams: 150 } }, { k: 'romano-beans', p: { grams: 100 } }, { k: 'canned-tomatoes', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'romano-beans',
  },
  'c-pork-loin-pinto-beans-onion-and-white-wine': {
    name: 'Pork loin + pinto beans + onion and white wine', meals: ['comida'],
    items: [{ k: 'pork-loin', p: { grams: 180 } }, { k: 'romano-beans', p: { grams: 100 } }, { k: 'yellow-onion', p: { grams: 80 } }, { k: 'white-wine', p: { ml: 30 } }, { k: 'bay-leaves', p: {} }, { k: 'evoo', p: { ml: 25 } }], scalable: 'romano-beans',
  },
  'c-turkey-pinto-beans-egg': {
    name: 'Turkey + pinto beans + egg', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 130 } }, { k: 'romano-beans', p: { grams: 100 } }, { k: 'eggs', p: { units: 1 } }, { k: 'canned-tomatoes', p: { grams: 60 } }, { k: 'cumin', p: {} }, { k: 'evoo', p: { ml: 25 } }], scalable: 'romano-beans', // pavo recortado 180->130g (6 sep 2026, techo de proteina)
  },
  'c-roast-chicken-leg-rustic-mash-sunflower-seeds': {
    name: 'Roast chicken leg + rustic mash + sunflower seeds', meals: ['comida'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 200 } }, { k: 'potato', p: { grams: 350 } }, { k: 'butter', p: { grams: 15 } }, { k: 'sunflower-seeds', p: { grams: 25 } }, { k: 'whole-milk', p: { grams: 100 } }, { k: 'evoo', p: { ml: 15 } }], scalable: 'potato',
  },
  'c-pork-tenderloin-black-beans-egg-tomato': {
    name: 'Pork tenderloin + black beans + egg + tomato', meals: ['comida'],
    items: [{ k: 'pork-tenderloin', p: { grams: 200 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'eggs', p: { units: 1 } }, { k: 'canned-tomatoes', p: { grams: 60 } }, { k: 'cumin', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-pork-tenderloin-black-beans-egg-honey-mustard-sauce': {
    name: 'Pork tenderloin + black beans + egg + honey mustard sauce', meals: ['comida'],
    items: [{ k: 'pork-tenderloin', p: { grams: 200 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'eggs', p: { units: 1 } }, { k: 'mustard', p: { grams: 15 } }, { k: 'honey', p: { grams: 10 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'black-beans',
  },
  'c-pork-tenderloin-black-beans-egg-salsa-verde': {
    name: 'Pork tenderloin + black beans + egg + salsa verde', meals: ['comida'],
    items: [{ k: 'pork-tenderloin', p: { grams: 200 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'eggs', p: { units: 1 } }, { k: 'dried-parsley', p: {} }, { k: 'jalapeno', p: { grams: 40 } }, { k: 'lemon', p: { units: 0.5 } }, { k: 'evoo', p: { ml: 30 } }], scalable: 'black-beans',
  },
  'c-turkey-chickpeas-egg-tomato-onion-sofrito': {
    name: 'Turkey + chickpeas + egg + tomato-onion sofrito', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 140 } }, { k: 'chickpeas', p: { grams: 100 } }, { k: 'eggs', p: { units: 1 } }, { k: 'canned-tomatoes', p: { grams: 100 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 25 } }], scalable: 'chickpeas', // pavo recortado 200->140g
  },
  'c-turkey-black-beans-egg-cheddar': {
    name: 'Turkey + black beans + egg + cheddar', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 140 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'eggs', p: { units: 1 } }, { k: 'cheddar', p: { grams: 18 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'black-beans', // cheddar recortado 30->18g; pavo recortado 200->140g (techo de proteina)
  },
  'c-chicken-leg-2-eggs-chickpeas-chickpea-cream': {
    name: 'Chicken leg + 2 eggs + chickpeas + chickpea cream', meals: ['comida'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 150 } }, { k: 'eggs', p: { units: 2 } }, { k: 'chickpeas', p: { grams: 80 } }, { k: 'lemon', p: { units: 0.5 } }, { k: 'cumin', p: {} }, { k: 'evoo', p: { ml: 30 } }], scalable: 'chickpeas',
  },
  'c-chickpeas-avocado-cheddar-and-chicken-leg-vinaigrette': {
    name: 'Chickpeas, avocado, cheddar and chicken leg + vinaigrette', meals: ['comida'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 150 } }, { k: 'chickpeas', p: { grams: 100 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'cheddar', p: { grams: 30 } }, { k: 'vinegar', p: { ml: 10 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'chickpeas',
  },
  'c-chickpeas-avocado-feta-and-chicken-leg-vinaigrette': {
    name: 'Chickpeas, avocado, feta and chicken leg + vinaigrette', meals: ['comida'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 150 } }, { k: 'chickpeas', p: { grams: 100 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'feta-cow', p: { grams: 40 } }, { k: 'vinegar', p: { ml: 10 } }, { k: 'evoo', p: { ml: 20 } }], scalable: 'chickpeas',
  },
  'c-black-beans-avocado-cheddar-and-turkey-homemade-red': {
    name: 'Black beans, avocado, cheddar and turkey + homemade red salsa', meals: ['comida'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'black-beans', p: { grams: 100 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'cheddar', p: { grams: 20 } }, { k: 'canned-tomatoes', p: { grams: 100 } }, { k: 'jalapeno', p: { grams: 40 } }, { k: 'yellow-onion', p: { grams: 40 } }, { k: 'lemon', p: { units: 0.5 } }, { k: 'cumin', p: {} }, { k: 'evoo', p: { ml: 15 } }], scalable: 'black-beans',
  },
  'c-cantaloupe-feta-avocado-and-pork-tenderloin': {
    name: 'Cantaloupe, feta, avocado and pork tenderloin', meals: ['comida'],
    items: [{ k: 'pork-tenderloin', p: { grams: 150 } }, { k: 'cantaloupe', p: { grams: 200 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'feta-cow', p: { grams: 30 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'c-apple-feta-avocado-and-pork-tenderloin': {
    name: 'Apple, feta, avocado and pork tenderloin', meals: ['comida'],
    items: [{ k: 'pork-tenderloin', p: { grams: 150 } }, { k: 'apple', p: { units: 0.5 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'feta-cow', p: { grams: 30 } }, { k: 'vinegar', p: { ml: 10 } }, { k: 'evoo', p: { ml: 25 } }],
  },
  'c-pork-loin-tomato-green-pepper-rice': {
    name: 'Pork loin + tomato + green pepper + rice', meals: ['comida'],
    items: [{ k: 'pork-loin', p: { grams: 150 } }, { k: 'rice', p: { grams: 75 } }, { k: 'canned-tomatoes', p: { grams: 80 } }, { k: 'green-pepper', p: { grams: 80 } }, { k: 'garlic', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'rice',
  },
  'c-aragonese-rancho-stew-cheap': {
    name: 'Aragonese rancho stew (cheap)', meals: ['comida'],
    items: [{ k: 'pork-loin', p: { grams: 75 } }, { k: 'pork-ribs', p: { grams: 75 } }, { k: 'potato', p: { grams: 200 } }, { k: 'carrot', p: { grams: 100 } }, { k: 'rice', p: { grams: 50 } }, { k: 'garlic', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato',
  },
  'c-aragonese-rancho-stew-large': {
    name: 'Aragonese rancho stew (large)', meals: ['comida'],
    items: [{ k: 'pork-loin', p: { grams: 100 } }, { k: 'pork-ribs', p: { grams: 100 } }, { k: 'potato', p: { grams: 250 } }, { k: 'carrot', p: { grams: 120 } }, { k: 'rice', p: { grams: 60 } }, { k: 'garlic', p: {} }, { k: 'evoo', p: { ml: 25 } }], scalable: 'potato',
  },
  'c-aragonese-rancho-stew-xl': {
    name: 'Aragonese rancho stew (XL)', meals: ['comida'],
    items: [{ k: 'pork-loin', p: { grams: 130 } }, { k: 'pork-ribs', p: { grams: 110 } }, { k: 'potato', p: { grams: 290 } }, { k: 'carrot', p: { grams: 140 } }, { k: 'rice', p: { grams: 70 } }, { k: 'garlic', p: {} }, { k: 'evoo', p: { ml: 25 } }], scalable: 'potato',
  },
  // Semana 12 (astringente/diarrea) — pedido explicito del usuario: "lo que
  // mas me quita la diarrea es el rancho o el estofado de ternera". Sin
  // cebolla/ajo (fructanos) a proposito -- laurel y perejil solo para sabor,
  // ninguno de los dos dispara ninguna de las banderas digestivas del motor
  // (GOS/insoluble/fructano). Zanahoria "muy cocida" (no cruda) por lo mismo
  // que ya hace c-costillas-pintas-zanahoria.
  'c-beef-stew-potato-carrot-well-cooked': {
    name: 'Beef stew + potato + carrot (well-cooked)', meals: ['comida'],
    items: [{ k: 'stew-beef', p: { grams: 180 } }, { k: 'potato', p: { grams: 280 } }, { k: 'carrot', p: { grams: 150 } }, { k: 'bay-leaves', p: {} }, { k: 'dried-parsley', p: {} }, { k: 'evoo', p: { ml: 20 } }], scalable: 'potato',
  },
  'n-mussels-marinara-small-saut-ed-potatoes': {
    name: 'Mussels marinara + small sautéed potatoes', meals: ['cena'],
    items: [{ k: 'mussels', p: { grams: 200 } }, { k: 'canned-tomatoes', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'potato', p: { grams: 150 } }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 30 } }],
  },
  'n-cod-with-lemon-butter': {
    name: 'Cod with lemon butter', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 180 } }, { k: 'butter', p: { grams: 25 } }, { k: 'lemon', p: { units: 0.5 } }, { k: 'white-wine', p: { ml: 20 } }, { k: 'evoo', p: { ml: 30 } }],
  },
  'n-lime-cured-cod-ceviche-red-onion-avocado': {
    name: 'Lime-cured cod ceviche + red onion + avocado', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 150 } }, { k: 'lemon', p: { units: 1 } }, { k: 'red-onion', p: { grams: 50 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'dried-parsley', p: {} }, { k: 'evoo', p: { ml: 30 } }],
  },
  'n-turkey-fajita-bowl': {
    name: 'Turkey fajita bowl', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'green-pepper', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'cheddar', p: { grams: 15 } }, { k: 'lemon', p: { units: 0.5 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 25 } }],
  },
  'n-baked-turkey-and-cheddar-frittata': {
    name: 'Baked turkey and cheddar frittata', meals: ['cena'],
    items: [{ k: 'eggs', p: { units: 3 } }, { k: 'turkey-drumstick', p: { grams: 100 } }, { k: 'cheddar', p: { grams: 20 } }, { k: 'yellow-onion', p: { grams: 40 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-green-pepper-and-tomato-shakshuka-with-shredded-turkey': {
    name: 'Green pepper and tomato shakshuka with shredded turkey', meals: ['cena'],
    items: [{ k: 'eggs', p: { units: 3 } }, { k: 'canned-tomatoes', p: { grams: 100 } }, { k: 'green-pepper', p: { grams: 80 } }, { k: 'turkey-drumstick', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 35 } }],
  },
  'n-chicken-burrito-rice-peppers': {
    name: 'Chicken burrito + rice + peppers', meals: ['cena'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 150 } }, { k: 'flour', p: { grams: 55 } }, { k: 'rice', p: { grams: 75 } }, { k: 'green-pepper', p: { grams: 60 } }, { k: 'yellow-onion', p: { grams: 40 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 15 } }],
  },
  'n-chicken-burrito-black-beans-peppers': {
    name: 'Chicken burrito + black beans + peppers', meals: ['cena'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 150 } }, { k: 'flour', p: { grams: 55 } }, { k: 'black-beans', p: { grams: 80 } }, { k: 'green-pepper', p: { grams: 60 } }, { k: 'yellow-onion', p: { grams: 40 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 15 } }],
  },
  'n-sardines-potato-egg': {
    name: 'Sardines + potato + egg', meals: ['cena'],
    items: [{ k: 'sardines-half-can', p: {} }, { k: 'potato', p: { grams: 150 } }, { k: 'eggs', p: { units: 1 } }, { k: 'evoo', p: { ml: 15 } }],
  },
  'n-potato-3-eggs': {
    name: 'Potato + 3 eggs', meals: ['cena'],
    items: [{ k: 'potato', p: { grams: 150 } }, { k: 'eggs', p: { units: 3 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  // Semana 12 (astringente/diarrea) — especie distinta a la comida de esa
  // semana (ternera/cerdo), arroz en vez de patata para variar la base sin
  // salirse de lo blando. Sin cebolla/ajo, pollo hervido (no frito/asado con
  // piel) -- lo mas suave posible.
  'n-boiled-chicken-rice-carrot-well-cooked': {
    name: 'Boiled chicken + rice + carrot (well-cooked)', meals: ['cena'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 150 } }, { k: 'rice', p: { grams: 70 } }, { k: 'carrot', p: { grams: 100 } }, { k: 'evoo', p: { ml: 15 } }], scalable: 'rice',
  },
  'n-turkey-potato-egg': {
    name: 'Turkey + potato + egg', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 100 } }, { k: 'potato', p: { grams: 200 } }, { k: 'eggs', p: { units: 2 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-potato-4-eggs': {
    name: 'Potato + 4 eggs', meals: ['cena'],
    items: [{ k: 'potato', p: { grams: 200 } }, { k: 'eggs', p: { units: 4 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-turkey-potato-egg-cheddar': {
    name: 'Turkey + potato + egg + cheddar', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 100 } }, { k: 'potato', p: { grams: 200 } }, { k: 'eggs', p: { units: 2 } }, { k: 'cheddar', p: { grams: 15 } }, { k: 'evoo', p: { ml: 15 } }],
  },
  'n-black-beans-egg-potato': {
    name: 'Black beans + egg + potato', meals: ['cena'],
    items: [{ k: 'black-beans', p: { grams: 80 } }, { k: 'eggs', p: { units: 1 } }, { k: 'potato', p: { grams: 100 } }, { k: 'evoo', p: { ml: 15 } }],
  },
  'n-chickpeas-egg-potato': {
    name: 'Chickpeas + egg + potato', meals: ['cena'],
    items: [{ k: 'chickpeas', p: { grams: 80 } }, { k: 'eggs', p: { units: 1 } }, { k: 'potato', p: { grams: 100 } }, { k: 'evoo', p: { ml: 15 } }],
  },
  'n-3-eggs-potato': {
    name: '3 eggs + potato', meals: ['cena'],
    items: [{ k: 'eggs', p: { units: 3 } }, { k: 'potato', p: { grams: 120 } }, { k: 'evoo', p: { ml: 25 } }],
  },
  'n-lentil-soup-with-poached-egg': {
    name: 'Lentil soup with poached egg', meals: ['cena'],
    items: [{ k: 'green-lentils', p: { grams: 80 } }, { k: 'eggs', p: { units: 1 } }, { k: 'yellow-onion', p: { grams: 40 } }, { k: 'carrot', p: { grams: 40 } }, { k: 'bay-leaves', p: {} }, { k: 'evoo', p: { ml: 15 } }],
  },
  'n-crispy-potato-migas-with-fried-egg': {
    name: 'Crispy potato migas with fried egg', meals: ['cena'],
    items: [{ k: 'potato', p: { grams: 250 } }, { k: 'eggs', p: { units: 2 } }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 25 } }],
  },
  'n-huevos-rancheros': {
    name: 'Huevos rancheros', meals: ['cena'],
    items: [{ k: 'black-beans', p: { grams: 80 } }, { k: 'eggs', p: { units: 2 } }, { k: 'canned-tomatoes', p: { grams: 60 } }, { k: 'paprika', p: {} }, { k: 'cumin', p: {} }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-warm-chickpea-pur-e-with-fried-egg-and': {
    name: 'Warm chickpea purée with fried egg and paprika', meals: ['cena'],
    items: [{ k: 'chickpeas', p: { grams: 80 } }, { k: 'eggs', p: { units: 2 } }, { k: 'paprika', p: {} }, { k: 'lemon', p: { units: 0.25 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-flamenco-style-baked-eggs': {
    name: 'Flamenco-style baked eggs', meals: ['cena'],
    items: [{ k: 'chickpeas', p: { grams: 50 } }, { k: 'eggs', p: { units: 2 } }, { k: 'canned-tomatoes', p: { grams: 80 } }, { k: 'green-pepper', p: { grams: 60 } }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-tomato-toast-with-egg-pan-tumaca': {
    name: 'Tomato toast with egg (pan tumaca)', meals: ['cena'],
    items: [{ k: 'sourdough-bread', p: { grams: 120 } }, { k: 'canned-tomatoes', p: { grams: 100 } }, { k: 'eggs', p: { units: 2 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-avocado-toast-with-egg': {
    name: 'Avocado toast with egg', meals: ['cena'],
    items: [{ k: 'sourdough-bread', p: { grams: 120 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'eggs', p: { units: 2 } }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-cod-and-lentil-stew': {
    name: 'Cod and lentil stew', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 100 } }, { k: 'green-lentils', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 40 } }, { k: 'bay-leaves', p: {} }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-cod-chickpeas-tomato': {
    name: 'Cod + chickpeas + tomato', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 120 } }, { k: 'chickpeas', p: { grams: 120 } }, { k: 'canned-tomatoes', p: { grams: 60 } }, { k: 'evoo', p: { ml: 35 } }],
  },
  'n-cod-black-beans-tomato-cumin': {
    name: 'Cod + black beans + tomato-cumin', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 120 } }, { k: 'black-beans', p: { grams: 120 } }, { k: 'canned-tomatoes', p: { grams: 50 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 35 } }],
  },
  'n-cod-potato-tomato-no-legumes': {
    name: 'Cod + potato + tomato (no legumes)', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 100 } }, { k: 'potato', p: { grams: 200 } }, { k: 'canned-tomatoes', p: { grams: 60 } }, { k: 'evoo', p: { ml: 25 } }],
  },
  'n-cod-simple-mashed-potato': {
    name: 'Cod + simple mashed potato', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 150 } }, { k: 'potato', p: { grams: 300 } }, { k: 'whole-milk', p: { grams: 40 } }, { k: 'butter', p: { grams: 8 } }, { k: 'evoo', p: { ml: 25 } }], // mantequilla recortada 15->8g
  },
  'n-cod-potato-squash-mash': {
    name: 'Cod + potato-squash mash', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 150 } }, { k: 'potato', p: { grams: 200 } }, { k: 'butternut-squash', p: { grams: 150 } }, { k: 'butter', p: { grams: 8 } }, { k: 'evoo', p: { ml: 25 } }], // mantequilla recortada 15->8g
  },
  // NUEVO 3 sep 2026 — variante con huevo, a peticion. El squash aporta pectina
  // (fibra soluble) en la cena, que es donde encaja: la calabaza en batido
  // desplaza sabor y el pure la absorbe sin notarse.
  'n-cod-potato-squash-mash-egg': {
    name: 'Cod + potato-squash mash + egg', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 150 } }, { k: 'potato', p: { grams: 200 } }, { k: 'butternut-squash', p: { grams: 150 } }, { k: 'eggs', p: { units: 1 } }, { k: 'butter', p: { grams: 8 } }, { k: 'evoo', p: { ml: 25 } }], // mantequilla recortada 15->8g
  },
  'n-cod-potato-zucchini-mash': {
    name: 'Cod + potato-zucchini mash', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 150 } }, { k: 'potato', p: { grams: 200 } }, { k: 'zucchini', p: { grams: 120 } }, { k: 'butter', p: { grams: 15 } }, { k: 'whole-milk', p: { grams: 30 } }, { k: 'evoo', p: { ml: 25 } }],
  },
  'n-cod-potato-leek-mash': {
    name: 'Cod + potato-leek mash', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 150 } }, { k: 'potato', p: { grams: 250 } }, { k: 'leek', p: { units: 0.25 } }, { k: 'butter', p: { grams: 15 } }, { k: 'whole-milk', p: { grams: 40 } }, { k: 'evoo', p: { ml: 25 } }],
  },
  'n-turkey-and-mussel-casserole': {
    name: 'Turkey and mussel casserole', meals: ['cena'],
    items: [{ k: 'turkey-drumstick', p: { grams: 150 } }, { k: 'mussels', p: { grams: 200 } }, { k: 'canned-tomatoes', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 25 } }],
  },
  'n-cod-and-mussel-casserole': {
    name: 'Cod and mussel casserole', meals: ['cena'],
    items: [{ k: 'cod', p: { grams: 150 } }, { k: 'mussels', p: { grams: 200 } }, { k: 'canned-tomatoes', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 25 } }],
  },
  'n-flour-burrito-2-eggs': {
    // scalableMax (6 sep 2026): sin esto, un dia de mucha kcal podia escalar
    // la harina hasta ~200g+ (4x el default) -- demasiada masa para una sola
    // cena. Tope a 150g (~2.7x); si aun asi falta, sale el aviso de snack.
    name: 'Flour burrito + 2 eggs', meals: ['cena'], scalableMax: 150,
    items: [{ k: 'flour', p: { grams: 55 } }, { k: 'eggs', p: { units: 2 } }, { k: 'evoo', p: { ml: 10 } }],
  },
  'n-egg-turkey-and-cheese-burrito': {
    name: 'Egg, turkey and cheese burrito', meals: ['cena'],
    items: [{ k: 'flour', p: { grams: 55 } }, { k: 'eggs', p: { units: 3 } }, { k: 'turkey-drumstick', p: { grams: 60 } }, { k: 'cheddar', p: { grams: 10 } }, { k: 'evoo', p: { ml: 15 } }],
  },
  'n-aragonese-rancho-stew-pork-ribs': {
    name: 'Aragonese rancho stew (pork ribs)', meals: ['cena'],
    items: [{ k: 'pork-ribs', p: { grams: 150 } }, { k: 'potato', p: { grams: 200 } }, { k: 'carrot', p: { grams: 100 } }, { k: 'rice', p: { grams: 50 } }, { k: 'garlic', p: {} }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-aragonese-rancho-stew-pork-loin': {
    name: 'Aragonese rancho stew (pork loin)', meals: ['cena'],
    items: [{ k: 'pork-loin', p: { grams: 150 } }, { k: 'potato', p: { grams: 200 } }, { k: 'carrot', p: { grams: 100 } }, { k: 'rice', p: { grams: 50 } }, { k: 'garlic', p: {} }, { k: 'evoo', p: { ml: 20 } }],
  },
  'n-chicken-fajitas-no-tortilla': {
    name: 'Chicken fajitas, no tortilla', meals: ['cena'],
    items: [{ k: 'chicken-leg-generic', p: { grams: 180 } }, { k: 'green-pepper', p: { grams: 80 } }, { k: 'yellow-pepper', p: { grams: 80 } }, { k: 'yellow-onion', p: { grams: 60 } }, { k: 'lemon', p: { units: 0.5 } }, { k: 'cumin', p: {} }, { k: 'paprika', p: {} }, { k: 'evoo', p: { ml: 25 } }],
  },
  'b-blueberry-shake': {
    name: 'Blueberry shake', meals: ['merienda'],
    items: [{ k: 'oats', p: { grams: 100 } }, { k: 'whole-milk', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'blueberries', p: { grams: 80 } }, { k: 'butter', p: { grams: 25 } }],
  },
  'b-classic-shake': {
    name: 'Classic shake', meals: ['merienda'],
    items: [{ k: 'oats', p: { grams: 100 } }, { k: 'whole-milk', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'butter', p: { grams: 10 } }, { k: 'pumpkin-seeds', p: { grams: 20 } }], // mantequilla recortada 20->10g
  },
  'b-classic-shake-2': {
    name: 'Classic shake 2', meals: ['merienda'],
    items: [{ k: 'oats', p: { grams: 100 } }, { k: 'whole-milk', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'almonds', p: { grams: 20 } }],
  },
  'b-citrus-shake': {
    name: 'Citrus shake', meals: ['merienda'],
    items: [{ k: 'oats', p: { grams: 100 } }, { k: 'goat-yogurt', p: { grams: 150 } }, { k: 'mandarin', p: { grams: 74 } }, { k: 'blueberries', p: { grams: 80 } }, { k: 'butter', p: { grams: 12 } }], // mantequilla recortada 25->12g
  },
  'm-protein-shake-to-go': {
    // 6 sep 2026: merienda de Maria para lunes/miercoles (trabaja, sin
    // batidora). Se agita en un shaker, no se cocina. Reemplaza el "cero
    // merienda" del Paso 4 -- sin esto, comida+cena tenian que compensar
    // ~800 kcal solas y eso disparaba la grasa del dia muy por encima de lo
    // razonable. Proteina en polvo + leche desnatada + banana: ~29g grasa
    // menos que el batido clasico, con mas proteina.
    name: 'Protein shake to go', meals: ['merienda'],
    items: [{ k: 'whey-protein', p: { grams: 35 } }, { k: 'skim-milk', p: { grams: 350 } }, { k: 'banana', p: { grams: 120 } }],
  },
  'b-melon-shake': {
    name: 'Melon shake', meals: ['merienda'],
    items: [{ k: 'oats', p: { grams: 100 } }, { k: 'whole-milk', p: { grams: 300 } }, { k: 'cantaloupe', p: { grams: 200 } }, { k: 'butter', p: { grams: 20 } }],
  },
  'b-avocado-and-cocoa-shake': {
    name: 'Avocado and cocoa shake', meals: ['merienda'],
    items: [{ k: 'oats', p: { grams: 100 } }, { k: 'whole-milk', p: { grams: 300 } }, { k: 'avocado', p: { units: 0.5 } }, { k: 'cocoa', p: { grams: 5 } }, { k: 'banana', p: { grams: 120 } }],
  },
  'b-nut-shake': {
    name: 'Nut shake', meals: ['merienda'],
    items: [{ k: 'oats', p: { grams: 100 } }, { k: 'kefir', p: { grams: 150 } }, { k: 'banana', p: { grams: 120 } }, { k: 'hazelnuts', p: { grams: 20 } }, { k: 'butter', p: { grams: 15 } }],
  },
  // Semana 12 (astringente/diarrea) — sin lacteos (leche/yogur/mantequilla),
  // sin frutos secos/semillas (INSOLUBLE_KEYS), sin citricos. Platano bien
  // maduro (mas astringente que verde) + manzana (mejor cocida/en compota en
  // la cocina real, aunque aqui solo exista la manzana cruda como ingrediente)
  // + miel para kcal facil de digerir.
  'm-sourdough-toast-with-boiled-apple-and-honey-binding': {
    // Version final (pedido del usuario): tostada + manzana hervida (la
    // compota YA ES esto -- "Lsm bio Unsweetened Apple Sauce", precio real
    // confirmado por el) en vez de platano -- se descarto el membrillo por
    // precio real ($2-3/ud, mucho mas caro que la compota).
    name: 'Sourdough toast with boiled apple and honey (binding)', meals: ['merienda'],
    items: [{ k: 'sourdough-bread', p: { grams: 80 } }, { k: 'applesauce', p: { grams: 200 } }, { k: 'honey', p: { grams: 10 } }],
  },
  'b-gentle-shake-bad-stomach-day': {
    name: 'Gentle shake (bad stomach day)', meals: ['merienda'],
    items: [{ k: 'oats', p: { grams: 100 } }, { k: 'whole-milk', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'butter', p: { grams: 12 } }], // mantequilla recortada 25->12g
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
  'b-weight-gain-shake-quince': {
    name: 'Weight-gain shake (quince)', meals: ['merienda'],
    items: [{ k: 'barley-flakes', p: { grams: 100 } }, { k: 'whole-milk', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'quince', p: { grams: 150 } }, { k: 'evoo', p: { ml: 15 } }], // aceite-coco (87% sat) -> AOVE (14% sat), misma densidad calorica
  },
  // Variante con manzana: mas facil de encontrar todo el ano y algo mas barata,
  // pero menos pectina y mas sorbitol. Misma tecnica: hervir y tirar el agua.
  'b-weight-gain-shake-apple': {
    name: 'Weight-gain shake (apple)', meals: ['merienda'],
    items: [{ k: 'barley-flakes', p: { grams: 100 } }, { k: 'whole-milk', p: { grams: 300 } }, { k: 'banana', p: { grams: 120 } }, { k: 'apple', p: { units: 1 } }, { k: 'evoo', p: { ml: 15 } }], // aceite-coco (87% sat) -> AOVE (14% sat), misma densidad calorica
  },
}
