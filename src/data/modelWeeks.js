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
export const MARIA_NO_BATIDO_CASERO = [0, 2] // indices sobre MODEL_DAY_KEYS: lun, mié
export const MARIA_MERIENDA_PORTATIL = 'd-yogur-platano-avena'

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
export const MARIA_DESAYUNO_DOWNGRADE = 'd-torta-garbanzo-50-huevo'
export const MARIA_DESAYUNO_DOWNGRADE_DAYS_BY_WEEK = {
  1: [1], 5: [2], 6: [1], 7: [2], 8: [1, 3],
}

export const MODEL_WEEKS = [
{ n:1, title:'The best balanced', note:'Breakfast changes by block for both. Lunch, snack and dinner change too.',
  DA:'d-burrito-maiz', DB:'d-burrito-maiz',
  DMA:'d-burrito-5050', DMB:'d-tortilla-cheddar-aguacate',
  CA:'c-rancho-aragones-xl', CB:'c-pollo-pure-patata-zanahoria',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-patata-tomate', NB:'n-turkey-patata-huevo' },

{ n:2, title:'Cheap — money rules', note:'Breakfast changes by block. Lunch pork -> chicken in block B; dinner and breakfast sardines -> cod for variety.',
  DA:'d-avena-leche-desnatada-miel', DB:'d-huevos-tostada-madre-miel-reforzado',
  DMA:'d-torta-garbanzo-50-huevo', DMB:'d-burrito-maiz',
  CA:'c-lomo-arroz-afgano', CB:'c-pollo-arroz-afgano-cebolla-limon',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-patata-tomate' },

{ n:3, title:'The cheapest possible without breaking anything', note:'Breakfast changes by block. Lunch pork -> turkey in block B; dinner egg -> cod.',
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-avena-leche-desnatada-miel',
  DMA:'d-torta-garbanzo-60', DMB:'d-burrito-maiz',
  CA:'c-lomo-arroz-afgano', CB:'c-turkey-glaseado',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-patata-3huevos', NB:'n-bacalao-patata-tomate' },

{ n:4, extrema:false, title:'WEIGHT GAIN — replaces max protein', note:'Breakfast changes by block. Lunch pork -> turkey in block B. Dinner cod -> turkey.',
  DA:'d-burrito-maiz', DB:'d-huevos-tostada-madre-miel-reforzado',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-lomo-arroz-afgano', CB:'c-turkey-garbanzos-huevo-sofrito',
  MA:'b-ganancia', MB:'b-ganancia-manzana',
  NA:'n-turkey-patata-huevo-cheddar', NB:'n-turkey-patata-huevo' },

{ n:5, title:'Max PCOS (Maria) + fiber margin', note:'Breakfast changes by block. Lunch lamb -> turkey. Dinner cod -> turkey.',
  DA:'d-tostada-madre-miel-platano', DB:'d-huevos-tostada-madre-miel-reforzado',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-cordero-pure-cebolla-laurel', CB:'c-turkey-cebolla-mostaza',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-patata-tomate', NB:'n-turkey-patata-huevo' },

{ n:6, title:'Seafood and fish first', note:'Your breakfast ROTATES daily (3 dishes A, 4 dishes B, none repeated in a block). Maria changes by block. Lunch mussels -> turkey in block B. Dinner cod (different recipe each block).',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-huevos-tostada-madre-miel-reforzado','d-avena-leche-desnatada-miel','d-tostada-madre-miel-platano'],
  DrotB:['d-burrito-maiz','d-avena-leche-desnatada-miel','d-huevos-tostada-madre-miel-reforzado','d-tostada-madre-miel-platano'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-mejillones-paella', CB:'c-turkey-pintas-huevo',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-ceviche-bacalao', NB:'n-sardinas-patata-huevo' },

{ n:7, title:'Poultry first (chicken and turkey)', note:'Your breakfast ROTATES (3 dishes A, 4 dishes B). Maria changes by block. Lunch chicken -> turkey. Dinner chicken -> turkey.',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-huevos-tostada-madre-miel-reforzado','d-avena-leche-desnatada-miel','d-tostada-madre-miel-platano'],
  DrotB:['d-burrito-maiz','d-avena-leche-desnatada-miel','d-huevos-tostada-madre-miel-reforzado','d-tostada-madre-miel-platano'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-pollo-arroz-afgano-cebolla-limon', CB:'c-turkey-pintas-huevo',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-fajitas-pollo-sin-tortilla', NB:'n-turkey-patata-huevo' },

{ n:8, title:'Legumes at lunch, finally', note:'Breakfast changes by block. Lunch pork tenderloin -> turkey, CB with black beans. Dinner cod -> egg burrito.',
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-burrito-maiz',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-solomillo-pure-manzana-batida', CB:'c-turkey-blackbeans-huevo-cheddar',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-pure-squash', NB:'n-burrito-harina-2huevos' },

{ n:9, title:'Beef and turkey, no liver', note:'Breakfast changes by block. Lunch beef -> turkey. Dinner sardines -> cod.',
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-burrito-maiz',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-carne-picada-patata-tomate-ajo', CB:'c-turkey-pintas-huevo',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-pure-simple' },

{ n:10, title:'Lentils, truly cheap', note:'Breakfast changes by block. Lunch pork -> chicken in block B. Dinner sardines -> cod.',
  DA:'d-burrito-maiz', DB:'d-avena-leche-desnatada-miel',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-costillas-lentejas-laurel-vino', CB:'c-pollo-pure-patata-zanahoria',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-patata-tomate' },

{ n:11, extrema:true, title:'EXTREME — absolute cost floor, no rules', note:'⚠ Reference only — deliberately breaks several digestive rules. Not for regular use.',
  DA:'d-torta-garbanzo-60', DB:'d-torta-garbanzo-60',
  DMA:'d-torta-garbanzo-60', DMB:'d-torta-garbanzo-60',
  CA:'c-lomo-arroz-afgano', CB:'c-lomo-patata-adobo',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-blackbeans-huevo-patata', NB:'n-garbanzos-huevo-patata' },

{ n:12, title:'BINDING — for diarrhea days', note:'Special week, not in rotation: only for diarrhea, not for regular use. No legumes, no onion/garlic (except the garlic in the rancho, kept on request), no nuts/seeds, no dairy at snack or breakfast (honey swapped for EVOO+salt), vegetables always well-cooked.',
  // 6 sep 2026 -- pedido explicito del usuario: "lo que mas me quita la
  // diarrea es el rancho o el estofado de ternera". El resto de la semana
  // (desayuno/merienda/cena) diseñado para acompañar sin romper el objetivo
  // astringente. Ya afinada en el HTML standalone (semanas-modelo-v2.html)
  // antes de traerla aqui -- mismos platos, mismas cantidades.
  DA:'d-huevos-tostada-aove', DB:'d-tostada-platano-aove-sal',
  DMA:'d-tostada-platano-aove-sal', DMB:'d-huevos-tostada-aove',
  CA:'c-estofado-ternera-patata-zanahoria', CB:'c-rancho-aragones-grande',
  MA:'m-astringente-platano-manzana', MB:'m-astringente-platano-manzana',
  NA:'n-pollo-hervido-arroz-zanahoria', NB:'n-turkey-patata-huevo' },

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
  DA:'d-torta-garbanzo-extrema', DB:'d-burrito-bacon',
  DMA:'d-torta-garbanzo-extrema', DMB:'d-burrito-bacon',
  CA:'c-rancho-aragones-xl', CB:'c-turkey-blackbeans-huevo-cheddar',
  MA:'b-clasico', MB:'b-clasico',
  NA:'n-turkey-patata-huevo-cheddar', NB:'n-bacalao-mejillones-cazuela' },
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
