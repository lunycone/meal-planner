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

export const MODEL_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
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

// Maria no toma merienda lunes ni miercoles (trabaja esos dias) — el batido
// portatil (proteina en polvo + leche desnatada, ver dishes.js) la sustituye.
export const MARIA_NO_BATIDO_CASERO = [0, 2] // indices sobre MODEL_DAY_KEYS: lun, mié
export const MARIA_MERIENDA_PORTATIL = 'm-proteina-portatil'

export const MODEL_WEEKS = [
{ n:1, title:'La mejor equilibrada', note:'Desayuno cambia de bloque para los dos. Comida, merienda y cena tambien cambian.',
  DA:'d-burrito-maiz', DB:'d-burrito-maiz',
  DMA:'d-burrito-5050', DMB:'d-tortilla-cheddar-aguacate',
  CA:'c-rancho-aragones-xl', CB:'c-pollo-pure-patata-zanahoria',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-patata-tomate', NB:'n-turkey-patata-huevo' },

{ n:2, title:'Barata — el dinero manda', note:'Desayuno cambia de bloque. Comida cerdo -> pollo en bloque B; cena y desayuno sardina -> bacalao para variar.',
  DA:'d-avena-leche-desnatada-miel', DB:'d-huevos-tostada-madre-miel-reforzado',
  DMA:'d-torta-garbanzo-50-huevo', DMB:'d-burrito-maiz',
  CA:'c-lomo-arroz-afgano', CB:'c-pollo-arroz-afgano-cebolla-limon',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-patata-tomate' },

{ n:3, title:'La mas barata posible, sin romper nada', note:'Desayuno cambia de bloque. Comida cerdo -> pavo en bloque B; cena huevo -> bacalao.',
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-avena-leche-desnatada-miel',
  DMA:'d-torta-garbanzo-60', DMB:'d-burrito-maiz',
  CA:'c-lomo-arroz-afgano', CB:'c-turkey-glaseado',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-patata-3huevos', NB:'n-bacalao-patata-tomate' },

{ n:4, extrema:false, title:'GANANCIA DE PESO — sustituye a la de proteina maxima', note:'Desayuno cambia de bloque. Comida cerdo -> pavo en bloque B. Cena bacalao -> pavo.',
  DA:'d-burrito-maiz', DB:'d-huevos-tostada-madre-miel-reforzado',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-lomo-arroz-afgano', CB:'c-turkey-garbanzos-huevo-sofrito',
  MA:'b-ganancia', MB:'b-ganancia-manzana',
  NA:'n-bacalao-pure-squash-huevo', NB:'n-turkey-patata-huevo' },

{ n:5, title:'PCOS maximo (Maria) + margen de fibra', note:'Desayuno cambia de bloque. Comida cordero -> pavo. Cena bacalao -> pavo.',
  DA:'d-tostada-madre-miel-platano', DB:'d-huevos-tostada-madre-miel-reforzado',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-cordero-pure-cebolla-laurel', CB:'c-turkey-cebolla-mostaza',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-patata-tomate', NB:'n-turkey-patata-huevo' },

{ n:6, title:'Marisco y pescado como eje', note:'Tu desayuno ROTA cada dia (3 platos A, 4 platos B, ninguno repetido en el mismo bloque). Maria cambia de bloque. Comida mejillon -> pavo en bloque B. Cena bacalao (receta distinta cada bloque).',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-huevos-tostada-madre-miel-reforzado','d-avena-leche-desnatada-miel','d-tostada-madre-miel-platano'],
  DrotB:['d-burrito-maiz','d-avena-leche-desnatada-miel','d-huevos-tostada-madre-miel-reforzado','d-tostada-madre-miel-platano'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-mejillones-paella', CB:'c-turkey-pintas-huevo',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-ceviche-bacalao', NB:'n-sardinas-patata-huevo' },

{ n:7, title:'Ave como eje (pollo y pavo)', note:'Tu desayuno ROTA (3 platos A, 4 platos B). Maria cambia de bloque. Comida pollo -> pavo. Cena pollo -> pavo.',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-huevos-tostada-madre-miel-reforzado','d-avena-leche-desnatada-miel','d-tostada-madre-miel-platano'],
  DrotB:['d-burrito-maiz','d-avena-leche-desnatada-miel','d-huevos-tostada-madre-miel-reforzado','d-tostada-madre-miel-platano'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-pollo-arroz-afgano-cebolla-limon', CB:'c-turkey-pintas-huevo',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-fajitas-pollo-sin-tortilla', NB:'n-turkey-patata-huevo' },

{ n:8, title:'Legumbre en comida, al fin en su sitio', note:'Desayuno cambia de bloque. Comida solomillo(cerdo) -> pavo, CB con black beans. Cena bacalao -> burrito de huevo.',
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-burrito-maiz',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-solomillo-pure-manzana-batida', CB:'c-turkey-blackbeans-huevo-cheddar',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-pure-squash', NB:'n-burrito-harina-2huevos' },

{ n:9, title:'Res y pavo, sin higado', note:'Desayuno cambia de bloque. Comida res -> pavo. Cena sardina -> bacalao.',
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-burrito-maiz',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-carne-picada-patata-tomate-ajo', CB:'c-turkey-pintas-huevo',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-pure-simple' },

{ n:10, title:'Lentejas, barata de verdad', note:'Desayuno cambia de bloque. Comida cerdo -> pollo en bloque B. Cena sardina -> bacalao.',
  DA:'d-burrito-maiz', DB:'d-avena-leche-desnatada-miel',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-costillas-lentejas-laurel-vino', CB:'c-pollo-pure-patata-zanahoria',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-patata-tomate' },

{ n:11, extrema:true, title:'EXTREMA — suelo absoluto de coste, sin ninguna regla', note:'⚠ Solo referencia — rompe a proposito varias reglas digestivas. No usar como plantilla recurrente.',
  DA:'d-torta-garbanzo-60', DB:'d-torta-garbanzo-60',
  DMA:'d-torta-garbanzo-60', DMB:'d-torta-garbanzo-60',
  CA:'c-lomo-arroz-afgano', CB:'c-lomo-patata-adobo',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-blackbeans-huevo-patata', NB:'n-garbanzos-huevo-patata' },

{ n:12, title:'ASTRINGENTE — para días de diarrea', note:'Semana especial, no rotativa: solo para cuando hay diarrea, no para uso habitual. Sin legumbres, sin cebolla/ajo (salvo el ajo del rancho, mantenido a peticion expresa), sin frutos secos/semillas, sin lacteos en merienda ni desayuno (miel sustituida por AOVE+sal), verduras siempre muy cocidas.',
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
