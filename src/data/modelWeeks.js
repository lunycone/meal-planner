// Semanas modelo — portado de scripts/weeks.mjs (6 sep 2026).
// Definicion en BLOQUES (no dia a dia): desayuno/comida/merienda siguen un
// patron B,A,A,A,B,B,B sobre lun..dom (ver expandModelWeek); cena tambien,
// para que Batch B cubra viernes-domingo completos igual que las demas.
//
// CA/CB, MA/MB, NA/NB = comida/merienda/cena por bloque. DA/DB = desayuno de
// Julio; DMA/DMB = desayuno de Maria (siempre distinto del suyo). DrotA/DrotB
// = cuando el desayuno de Julio ROTA dia a dia en vez de fijo por bloque.
//
// Los dishKey aqui referenciados viven en dishes.js — este archivo no
// calcula nada, solo declara que plato va en cada bloque. El calculo (kcal,
// grasa, escalado por persona) lo hace engine/calc.js en tiempo real, igual
// que para cualquier semana planificada a mano.

export const MODEL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const MODEL_DAY_KEYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

// Objetivo de kcal por dia de la semana — derivado del calendario real de
// entrenamiento (martes = voley de Maria, jueves/sabado = natacion de Julio).
// Se guarda aqui (no en el perfil) porque es especifico de este conjunto de
// 11 semanas; los perfiles del store siguen usando su kcalTarget plano salvo
// que se les añada kcalByDay (ver useStore.js).
export const MODEL_KCAL_BY_DAY = {
  julio: [3150, 3150, 3100, 3300, 3000, 3300, 3000],
  maria: [2500, 2900, 2500, 2750, 2500, 2750, 2500],
}

// Maria no toma merienda lunes ni miercoles (trabaja esos dias) -- se
// sustituye por algo que aguante en un tupper sin cocinar ni batidora.
// 6 sep 2026 (2): era un batido de proteina en polvo (41g) -- el usuario
// pidio explicitamente quitar la proteina en polvo de aqui tambien y pasar a
// algo normal (yogur+fruta), aunque suba menos la proteina, con tal de que
// siga sirviendo en tupper para el trabajo. d-yogur-platano-avena (yogur +
// platano + avena, sin cocinar, sin proteina en polvo: 291 kcal, 11 g prot,
// $0.91) cumple los dos: nada que batir ni cocinar, y baja su proteina en
// vez de subirla. Verificado (node, las 12 semanas): NO deja ningun dia por
// debajo de su objetivo de kcal (a diferencia del batido reforzado que se
// probo para Julio, que si lo hacia -- ver commit revertido 7241041) porque
// Maria suele estar en el regimen de "sobra kcal" (su objetivo ya esta por
// debajo del plato por defecto), no en el de "falta kcal" de Julio.
// 27 sep 2026: la merienda de María ya no es fija los lunes y miércoles
// («puede ser lo que sea»): lista vacía.
export const MARIA_NO_BATIDO_CASERO = [] // antes [0, 2]: lun, mié
export const MARIA_MERIENDA_PORTATIL = 'd-yogurt-banana-oats'

// 6 sep 2026 -- techo de proteina de Maria, mismo criterio que el de Julio
// (2,23 g/kg, ver CAP en scripts/html-core.mjs) aplicado a SU peso (58,4 kg)
// en vez del de el: 58.4*2.23 ≈ 130 g. Auditando las 12 semanas (personDayProt
// real) salia por encima en 8 de las 12, casi siempre por dos motivos
// distintos: (1) su desayuno normal (Tortilla+cheddar+aguacate, 25g)
// combinado con una comida especialmente proteica esa semana (comida es el
// MISMO plato que Julio, solo cambia la racion -- no se puede tocar por
// persona), arreglado con esta tabla bajandola a la torta de garbanzo con
// huevo (17g, un plato que YA usa en otras semanas del propio catalogo) los
// dias donde eso basta; y (2) el batido proteico portatil de lunes/miercoles
// -- ya resuelto arriba (MARIA_MERIENDA_PORTATIL). Con las dos cosas quedan
// solo 4 de 84 dias-persona por encima del techo (sabado semanas 7 y 9,
// martes/jueves semana 10) -- dias sueltos donde su comida/cena compartida
// con Julio es la que sube, no su desayuno ni su merienda.
export const MARIA_DESAYUNO_DOWNGRADE = 'd-chickpea-flatbread-50g-1-egg-evoo'
export const MARIA_DESAYUNO_DOWNGRADE_DAYS_BY_WEEK = {
  1: [1], 5: [2], 6: [1], 7: [2], 8: [1, 3],
}

export const MODEL_WEEKS = [
{ n:1, title:'The best balanced', note:'Breakfast changes by block for both. Lunch, snack and dinner change too.',
  DA:'d-100pct-corn-burrito', DB:'d-100pct-corn-burrito',
  DMA:'d-50-50-burrito-corn-chickpea', DMB:'d-omelette-cheddar-avocado',
  CA:'c-aragonese-rancho-stew-xl', CB:'c-chicken-leg-potato-carrot-mash-paprika',
  MA:'b-classic-shake', MB:'b-citrus-shake',
  NA:'n-cod-potato-tomato-no-legumes', NB:'n-turkey-potato-egg' },

{ n:2, title:'Cheap — money rules', note:'Breakfast changes by block. Lunch pork -> chicken in block B; dinner and breakfast sardines -> cod for variety.',
  DA:'d-oats-with-skim-milk-and-honey', DB:'d-scrambled-eggs-with-sourdough-toast-and-honey',
  DMA:'d-chickpea-flatbread-50g-1-egg-evoo', DMB:'d-100pct-corn-burrito',
  CA:'c-pork-loin-afghan-rice', CB:'c-chicken-leg-afghan-rice-onion-and-lemon',
  MA:'b-classic-shake-2', MB:'b-classic-shake-2',
  NA:'n-sardines-potato-egg', NB:'n-cod-potato-tomato-no-legumes' },

{ n:3, title:'The cheapest possible without breaking anything', note:'Breakfast changes by block. Lunch pork -> turkey in block B; dinner egg -> cod.',
  DA:'d-scrambled-eggs-with-sourdough-toast-and-honey', DB:'d-oats-with-skim-milk-and-honey',
  DMA:'d-chickpea-flatbread-75g-evoo', DMB:'d-100pct-corn-burrito',
  CA:'c-pork-loin-afghan-rice', CB:'c-turkey-drumstick-sweet-and-sour-glaze',
  MA:'b-classic-shake-2', MB:'b-classic-shake-2',
  NA:'n-potato-3-eggs', NB:'n-cod-potato-tomato-no-legumes' },

{ n:4, extrema:false, title:'WEIGHT GAIN — replaces max protein', note:'Breakfast changes by block. Lunch pork -> turkey in block B. Dinner cod -> turkey.',
  DA:'d-100pct-corn-burrito', DB:'d-scrambled-eggs-with-sourdough-toast-and-honey',
  DMA:'d-omelette-cheddar-avocado', DMB:'d-chickpea-flatbread-50g-1-egg-evoo',
  CA:'c-pork-loin-afghan-rice', CB:'c-turkey-chickpeas-egg-tomato-onion-sofrito',
  MA:'b-weight-gain-shake-quince', MB:'b-weight-gain-shake-apple',
  NA:'n-turkey-potato-egg-cheddar', NB:'n-turkey-potato-egg' },

{ n:5, title:'Max PCOS (Maria) + fiber margin', note:'Breakfast changes by block. Lunch lamb -> turkey. Dinner cod -> turkey.',
  DA:'d-sourdough-toast-with-honey-and-banana', DB:'d-scrambled-eggs-with-sourdough-toast-and-honey',
  DMA:'d-omelette-cheddar-avocado', DMB:'d-chickpea-flatbread-50g-1-egg-evoo',
  CA:'c-lamb-mashed-potato-onion-bay-leaf', CB:'c-turkey-caramelized-onion-mustard-sauce',
  MA:'b-classic-shake', MB:'b-citrus-shake',
  NA:'n-cod-potato-tomato-no-legumes', NB:'n-turkey-potato-egg' },

{ n:6, title:'Seafood and fish first', note:'Your breakfast ROTATES daily (3 dishes A, 4 dishes B, none repeated in a block). Maria changes by block. Lunch mussels -> turkey in block B. Dinner cod (different recipe each block).',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-scrambled-eggs-with-sourdough-toast-and-honey','d-oats-with-skim-milk-and-honey','d-sourdough-toast-with-honey-and-banana'],
  DrotB:['d-100pct-corn-burrito','d-oats-with-skim-milk-and-honey','d-scrambled-eggs-with-sourdough-toast-and-honey','d-sourdough-toast-with-honey-and-banana'],
  DMA:'d-omelette-cheddar-avocado', DMB:'d-chickpea-flatbread-50g-1-egg-evoo',
  CA:'c-paella-style-mussels', CB:'c-turkey-pinto-beans-egg',
  MA:'b-classic-shake', MB:'b-citrus-shake',
  NA:'n-lime-cured-cod-ceviche-red-onion-avocado', NB:'n-sardines-potato-egg' },

{ n:7, title:'Poultry first (chicken and turkey)', note:'Your breakfast ROTATES (3 dishes A, 4 dishes B). Maria changes by block. Lunch chicken -> turkey. Dinner chicken -> turkey.',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-scrambled-eggs-with-sourdough-toast-and-honey','d-oats-with-skim-milk-and-honey','d-sourdough-toast-with-honey-and-banana'],
  DrotB:['d-100pct-corn-burrito','d-oats-with-skim-milk-and-honey','d-scrambled-eggs-with-sourdough-toast-and-honey','d-sourdough-toast-with-honey-and-banana'],
  DMA:'d-omelette-cheddar-avocado', DMB:'d-chickpea-flatbread-50g-1-egg-evoo',
  CA:'c-chicken-leg-afghan-rice-onion-and-lemon', CB:'c-turkey-pinto-beans-egg',
  MA:'b-classic-shake', MB:'b-citrus-shake',
  NA:'n-chicken-fajitas-no-tortilla', NB:'n-turkey-potato-egg' },

{ n:8, title:'Legumes at lunch, finally', note:'Breakfast changes by block. Lunch pork tenderloin -> turkey, CB with black beans. Dinner cod -> egg burrito.',
  DA:'d-scrambled-eggs-with-sourdough-toast-and-honey', DB:'d-100pct-corn-burrito',
  DMA:'d-omelette-cheddar-avocado', DMB:'d-chickpea-flatbread-50g-1-egg-evoo',
  CA:'c-pork-tenderloin-mashed-potato-blended-apple', CB:'c-turkey-black-beans-egg-cheddar',
  MA:'b-classic-shake', MB:'b-citrus-shake',
  NA:'n-cod-potato-squash-mash', NB:'n-flour-burrito-2-eggs' },

{ n:9, title:'Beef and turkey, no liver', note:'Breakfast changes by block. Lunch beef -> turkey. Dinner sardines -> cod.',
  DA:'d-scrambled-eggs-with-sourdough-toast-and-honey', DB:'d-100pct-corn-burrito',
  DMA:'d-omelette-cheddar-avocado', DMB:'d-chickpea-flatbread-50g-1-egg-evoo',
  CA:'c-ground-beef-potato-tomato-garlic', CB:'c-turkey-pinto-beans-egg',
  MA:'b-classic-shake', MB:'b-citrus-shake',
  NA:'n-sardines-potato-egg', NB:'n-cod-simple-mashed-potato' },

{ n:10, title:'Lentils, truly cheap', note:'Breakfast changes by block. Lunch pork -> chicken in block B. Dinner sardines -> cod.',
  DA:'d-100pct-corn-burrito', DB:'d-oats-with-skim-milk-and-honey',
  DMA:'d-omelette-cheddar-avocado', DMB:'d-chickpea-flatbread-50g-1-egg-evoo',
  CA:'c-pork-ribs-green-lentils-bay-leaf-and-wine', CB:'c-chicken-leg-potato-carrot-mash-paprika',
  MA:'b-classic-shake-2', MB:'b-classic-shake-2',
  NA:'n-sardines-potato-egg', NB:'n-cod-potato-tomato-no-legumes' },

{ n:11, extrema:true, title:'EXTREME — absolute cost floor, no rules', note:'⚠ Reference only — deliberately breaks several digestive rules. Not for regular use.',
  DA:'d-chickpea-flatbread-75g-evoo', DB:'d-chickpea-flatbread-75g-evoo',
  DMA:'d-chickpea-flatbread-75g-evoo', DMB:'d-chickpea-flatbread-75g-evoo',
  CA:'c-pork-loin-afghan-rice', CB:'c-pork-loin-roast-potato-paprika-marinade',
  MA:'b-classic-shake-2', MB:'b-classic-shake-2',
  NA:'n-black-beans-egg-potato', NB:'n-chickpeas-egg-potato' },

{ n:12, title:'BINDING — for diarrhea days', note:'Special week, not in rotation: only for diarrhea, not for regular use. No legumes, no onion/garlic (except the garlic in the rancho, kept on request), no nuts/seeds, no dairy at snack or breakfast (honey swapped for EVOO+salt), vegetables always well-cooked.',
  // 6 sep 2026 -- pedido explicito del usuario: "lo que mas me quita la
  // diarrea es el rancho o el estofado de ternera". El resto de la semana
  // (desayuno/merienda/cena) diseñado para acompañar sin romper el objetivo
  // astringente. Ya afinada en el HTML standalone (semanas-modelo-v2.html)
  // antes de traerla aqui -- mismos platos, mismas cantidades.
  DA:'d-scrambled-eggs-with-sourdough-toast-and-evoo', DB:'d-sourdough-toast-with-banana-evoo-and-salt',
  DMA:'d-sourdough-toast-with-banana-evoo-and-salt', DMB:'d-scrambled-eggs-with-sourdough-toast-and-evoo',
  CA:'c-beef-stew-potato-carrot-well-cooked', CB:'c-aragonese-rancho-stew-large',
  MA:'m-sourdough-toast-with-boiled-apple-and-honey-binding', MB:'m-sourdough-toast-with-boiled-apple-and-honey-binding',
  NA:'n-boiled-chicken-rice-carrot-well-cooked', NB:'n-turkey-potato-egg' },

// 6 sep 2026 -- pedido explicito: semana de referencia (como la 11) que se
// pase un ~10% del techo de proteina de LOS DOS todos los dias (Julio
// 143g -> pasa de 157g; Maria 130g -> pasa de 143g), sin proteina en polvo
// (descartada explicitamente, ver commit b2cfb1c). Ya afinada en el HTML
// standalone antes de traerla aqui -- mismos platos, mismas cantidades.
// Verificado (node): Julio 152-178g (siempre >=157g) los 7 dias; Maria
// 152-154g (siempre >=143g) los 7 dias. Grasa muy por encima del techo de
// desayuno de siempre -- esperado, como la semana 11.
// 6 sep 2026 (3) -- version 2 (pavo martes-jueves, cerdo+bacalao el resto)
// seguia mal: desayuno garbanzo LOS 7 DIAS y comida con legumbre en los
// dos bloques a la vez (7/7) -- "piensa tambien en el gut". Redisenada
// respetando las cadencias de verdad (max 4/7 por franja): desayuno con
// legumbre solo 3/7, comida con legumbre solo 4/7, cena sin legumbre y
// sin cebolla/ajo mas de 4/7. Seis especies distintas en vez de pavo por
// todas partes. Verificado (node): Maria pasa el techo +10% los 7 dias;
// Julio lo pasa salvo martes/miercoles (151-154g, aun 5-8% sobre su
// techo de 143g) -- preferido a forzar mas legumbre solo por el 10% exacto.
{ n:13, extrema:true, title:'HIGH PROTEIN — deliberately over both ceilings', note:"⚠ Reference only — goes over Julio's and María's protein ceiling most days (~10% target, keeping the usual legume/onion-garlic cadence), no protein powder. Deliberately breaks the breakfast fat ceiling. Not for regular use.",
  DA:'d-extreme-chickpea-flatbread-60-70g-protein', DB:'d-bacon-burrito',
  DMA:'d-extreme-chickpea-flatbread-60-70g-protein', DMB:'d-bacon-burrito',
  CA:'c-aragonese-rancho-stew-xl', CB:'c-turkey-black-beans-egg-cheddar',
  MA:'b-classic-shake', MB:'b-classic-shake',
  NA:'n-turkey-potato-egg-cheddar', NB:'n-cod-and-mussel-casserole' },
]

// ─── Expansion de bloques a los 7 dias ───────────────────────────────────────
// Patron real (confirmado 4 sep 2026): NO son bloques consecutivos.
// A = Martes, Miercoles, Jueves (3 dias). B = Viernes, Sabado, Domingo, Lunes
// (4 dias, cierra el fin de semana y abre la semana siguiente). Mismo patron
// para las 4 franjas (desayuno, comida, merienda, cena) salvo que una franja
// declare 'ROTA'.
const PATTERN = ['B','A','A','A','B','B','B'] // lun,mar,mié,jue,vie,sáb,dom

export function expandModelWeek(w) {
  const pick = k => PATTERN.map(block => w[block === 'A' ? k + 'A' : k + 'B'])
  const pickRota = () => {
    let ia = 0, ib = 0
    return PATTERN.map(block => block === 'A' ? w.DrotA[ia++] : w.DrotB[ib++])
  }
  return {
    ...w,
    D:  w.DA === 'ROTA' ? pickRota() : pick('D'),
    DM: pick('DM'),
    C:  pick('C'),
    M:  pick('M'),
    N:  pick('N'),
  }
}

export function findModelWeek(n) {
  return MODEL_WEEKS.find(w => w.n === n)
}
