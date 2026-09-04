// Definicion de las 11 semanas en BLOQUES, no dia a dia.
//
// EL CORTE (ver expand.mjs): Desayuno/Comida/Merienda siguen 4/3 (Lun-Jue /
// Vie-Dom). Cena sigue 3/4 (Lun-Mie / Jue-Dom) porque Batch B empieza en la
// cena del jueves.
//
// REGLA DE DESAYUNO (fijada 4 sep 2026, corrige el error de la version
// anterior): NINGUN desayuno se repite los 7 dias. Bloque A y bloque B usan
// SIEMPRE platos distintos, tanto para Julio como para Maria. Si Julio rota
// dia a dia (S6/S7), Maria sigue el patron A/B de 2 platos minimo.
//
// CA/CB, MA/MB, NA/NB = comida/merienda/cena por bloque.

export const WEEKS = [
{ n:1, title:'La mejor equilibrada', note:'Desayuno cambia de bloque para los dos. Comida, merienda y cena tambien cambian.',
  DA:'d-burrito-maiz', DB:'d-pan-huevos-aguacate',
  DMA:'d-burrito-5050', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-rancho-aragones-xl', CB:'c-pollo-pure-rustico-pipas',        // cerdo -> pollo
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-frittata-turkey-cheddar', NB:'n-fajita-bowl-turkey' },       // pavo ambos (documento original)

{ n:2, title:'Barata — el dinero manda', note:'Desayuno cambia de bloque. Comida cerdo ambos bloques (documento original); cena y desayuno sardina -> bacalao para variar.',
  DA:'d-burrito-maiz', DB:'d-torta-garbanzo-60',
  DMA:'d-torta-garbanzo-50-huevo', DMB:'d-burrito-maiz',
  CA:'c-lomo-arroz-afgano', CB:'c-lomo-patata-adobo',                // cerdo ambos (documento original)
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-patata-tomate' },      // sardina -> bacalao

{ n:3, title:'La mas barata posible, sin romper nada', note:'Desayuno cambia de bloque. Comida cerdo ambos; cena huevo -> bacalao.',
  DA:'d-burrito-maiz', DB:'d-torta-garbanzo-60',
  DMA:'d-torta-garbanzo-60', DMB:'d-burrito-maiz',
  CA:'c-lomo-arroz-afgano', CB:'c-lomo-patata-adobo',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-patata-3huevos', NB:'n-bacalao-patata-tomate' },             // huevo -> bacalao

{ n:4, title:'GANANCIA DE PESO — sustituye a la de proteina maxima', note:'Desayuno cambia de bloque. Comida cerdo ambos (corte distinto). Cena bacalao -> pavo.',
  DA:'d-overnight-oats-chocolate', DB:'d-pan-huevos-aguacate',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-lomo-arroz-afgano', CB:'c-solomillo-pure-manzana-batida',    // cerdo ambos, corte distinto
  MA:'b-ganancia', MB:'b-ganancia-manzana',
  NA:'n-bacalao-pure-squash-huevo', NB:'n-turkey-patata-huevo' },    // bacalao -> pavo

{ n:5, title:'PCOS maximo (Maria) + margen de fibra', note:'Desayuno cambia de bloque. Comida cordero -> pavo. Cena bacalao -> pavo.',
  DA:'d-burrito-maiz', DB:'d-torta-garbanzo-60',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-cordero-pure-cebolla-laurel', CB:'c-turkey-cebolla-mostaza', // cordero -> pavo
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-mantequilla-limon', NB:'n-shakshuka-turkey' },       // bacalao -> pavo

{ n:6, title:'Marisco y pescado como eje', note:'Tu desayuno ROTA cada dia (4 platos A, 4 platos B, ninguno repetido en el mismo bloque). Maria cambia de bloque. Comida fija (mejillon, eje de la semana). Cena bacalao -> mejillon.',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-burrito-maiz','d-overnight-oats-chocolate','b-blando','d-pan-huevos-aguacate'],
  DrotB:['d-yogur-almendra-pumpkin-choco','d-torta-garbanzo-50-huevo','n-patata-3huevos','d-burrito-maiz'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-mejillones-paella', CB:'c-mejillones-paella',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-ceviche-bacalao', NB:'n-mejillones-marinera-patata' },       // bacalao -> mejillon

{ n:7, title:'Ave como eje (pollo y pavo)', note:'Tu desayuno ROTA. Maria cambia de bloque. Comida pollo -> pavo. Cena pollo -> pavo.',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-burrito-maiz','d-overnight-oats-chocolate','b-blando','d-pan-huevos-aguacate'],
  DrotB:['d-yogur-almendra-pumpkin-choco','d-torta-garbanzo-50-huevo','n-patata-3huevos','d-burrito-maiz'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-pollo-arroz-afgano-cebolla-limon', CB:'c-turkey-setas-vino', // pollo -> pavo
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-fajitas-pollo-sin-tortilla', NB:'n-turkey-patata-huevo' },   // pollo -> pavo

{ n:8, title:'Legumbre en comida, al fin en su sitio', note:'Desayuno cambia de bloque. Comida solomillo(cerdo) -> pavo, ambas con black beans. Cena bacalao -> burrito de huevo.',
  DA:'b-blando', DB:'d-burrito-maiz',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-solomillo-blackbeans-huevo-tomate', CB:'c-turkey-blackbeans-huevo-cheddar', // cerdo -> pavo
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-pure-squash', NB:'n-burrito-harina-2huevos' },

{ n:9, title:'Res y pavo, sin higado', note:'Desayuno cambia de bloque. Comida res -> pavo. Cena sardina -> bacalao.',
  DA:'d-pan-huevos-aguacate', DB:'d-burrito-maiz',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-carne-picada-patata-tomate-ajo', CB:'c-turkey-pintas-huevo', // vaca -> pavo
  MA:'b-clasico', MB:'b-citrico',
  NA:'d-sardinas-huevo-cheddar', NB:'n-bacalao-pure-simple' },       // sardina -> bacalao

{ n:10, title:'Lentejas, barata de verdad', note:'Desayuno cambia de bloque. Comida cerdo ambos (costillas -> lomo). Cena sardina -> bacalao.',
  DA:'d-burrito-maiz', DB:'d-torta-garbanzo-60',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-costillas-lentejas-laurel-vino', CB:'c-lomo-patata-adobo',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-patata-tomate' },      // sardina -> bacalao

{ n:11, extrema:true, title:'EXTREMA — suelo absoluto de coste, sin ninguna regla', note:'Rompe a proposito: desayuno de garbanzo fijo para los dos (unico caso permitido, es la semana marcada como referencia extrema). Comida cerdo ambos bloques. Cena legumbre ambos bloques.',
  DA:'d-torta-garbanzo-60', DB:'d-torta-garbanzo-60',
  DMA:'d-torta-garbanzo-60', DMB:'d-torta-garbanzo-60',
  CA:'c-lomo-arroz-afgano', CB:'c-lomo-patata-adobo',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-blackbeans-huevo-patata', NB:'n-garbanzos-huevo-patata' },
]
