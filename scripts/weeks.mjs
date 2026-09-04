// Definicion de las 11 semanas en BLOQUES, no dia a dia.
// A = Lunes-Jueves (4 dias) · B = Jueves-Domingo (3 dias, la cena del jueves
// ya es de B, siguiendo el patron "Menu B empieza en la cena del jueves").
// DA/DB = tu desayuno bloque A/B (o 'ROTA' + array de 7 si rota dia a dia).
// DMA/DMB = desayuno de Maria, bloque A/B (mismo patron, casi siempre fijo).
// CA/CB = comida bloque A/B. MA/MB = merienda. NA/NB = cena.
//
// Expansion a array de 7 se hace en gen-core: A cubre Lun-Jue, B cubre Vie-Dom,
// salvo el desayuno del bloque B que tambien vale para la cena del jueves si
// se declarase asi (no aplica aqui: desayuno no cambia a media semana en
// ningun ejemplo real del documento).

export const WEEKS = [
{ n:1, title:'La mejor equilibrada', note:'Desayuno fijo toda la semana (A=B). Comida y merienda y cena SI cambian entre bloques.',
  DA:'d-burrito-maiz', DB:'d-burrito-maiz',
  DMA:'d-burrito-5050', DMB:'d-burrito-5050',
  CA:'c-rancho-aragones-xl', CB:'c-pollo-pure-rustico-pipas',       // cerdo -> pollo
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-frittata-turkey-cheddar', NB:'n-fajita-bowl-turkey' },      // pavo ambos (documento original asi lo tenia)

{ n:2, title:'Barata — el dinero manda', note:'Todo fijo salvo el acompañamiento de comida (misma proteina, cerdo, como en el original).',
  DA:'d-burrito-maiz', DB:'d-burrito-maiz',
  DMA:'d-torta-garbanzo-50-huevo', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-lomo-arroz-afgano', CB:'c-lomo-patata-adobo',               // cerdo ambos (documento original)
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-sardinas-patata-huevo' },

{ n:3, title:'La mas barata posible, sin romper nada', note:'Estructura identica a S2, cena de huevo fija.',
  DA:'d-burrito-maiz', DB:'d-burrito-maiz',
  DMA:'d-torta-garbanzo-60', DMB:'d-torta-garbanzo-60',
  CA:'c-lomo-arroz-afgano', CB:'c-lomo-patata-adobo',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-patata-3huevos', NB:'n-patata-3huevos' },

{ n:4, title:'GANANCIA DE PESO — sustituye a la de proteina maxima', note:'Comida cerdo ambos bloques (igual que S2/S4 original). Cena SI cambia de especie: pavo -> bacalao.',
  DA:'d-overnight-oats-chocolate', DB:'d-overnight-oats-chocolate',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-tortilla-cheddar-aguacate',
  CA:'c-lomo-arroz-afgano', CB:'c-solomillo-pure-manzana-batida',   // cerdo ambos, corte distinto
  MA:'b-ganancia', MB:'b-ganancia-manzana',
  NA:'n-bacalao-pure-squash-huevo', NB:'n-turkey-patata-huevo' },   // bacalao -> pavo

{ n:5, title:'PCOS maximo (Maria) + margen de fibra', note:'CADENCIA: cordero A, pavo B en comida. Cena bacalao A, pavo B.',
  DA:'d-burrito-maiz', DB:'d-burrito-maiz',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-tortilla-cheddar-aguacate',
  CA:'c-cordero-pure-cebolla-laurel', CB:'c-turkey-cebolla-mostaza', // cordero -> pavo
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-mantequilla-limon', NB:'n-shakshuka-turkey' },      // bacalao -> pavo

{ n:6, title:'Marisco y pescado como eje', note:'Desayuno ROTA cada dia para ti; Maria fija. Comida fija (mejillon ambos bloques, es el eje de la semana). Cena bacalao -> mejillon.',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-burrito-maiz','d-overnight-oats-chocolate','b-blando','d-pan-huevos-aguacate'],
  DrotB:['d-yogur-almendra-pumpkin-choco','d-tortilla-cheddar-aguacate','n-patata-3huevos'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-tortilla-cheddar-aguacate',
  CA:'c-mejillones-paella', CB:'c-mejillones-paella',
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-ceviche-bacalao', NB:'n-mejillones-marinera-patata' },      // bacalao -> mejillon

{ n:7, title:'Ave como eje (pollo y pavo)', note:'Desayuno ROTA. Comida pollo -> pavo. Cena pollo -> pavo.',
  DA:'ROTA', DB:'ROTA',
  DrotA:['d-burrito-maiz','d-overnight-oats-chocolate','b-blando','d-pan-huevos-aguacate'],
  DrotB:['d-yogur-almendra-pumpkin-choco','d-tortilla-cheddar-aguacate','n-patata-3huevos'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-tortilla-cheddar-aguacate',
  CA:'c-pollo-arroz-afgano-cebolla-limon', CB:'c-turkey-setas-vino', // pollo -> pavo
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-fajitas-pollo-sin-tortilla', NB:'n-turkey-patata-huevo' },  // pollo -> pavo

{ n:8, title:'Legumbre en comida, al fin en su sitio', note:'Comida solomillo(cerdo) -> pavo, ambas con black beans. Cena bacalao -> burrito de huevo (sin proteina animal fuerte, aceptable).',
  DA:'b-blando', DB:'b-blando',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-tortilla-cheddar-aguacate',
  CA:'c-solomillo-blackbeans-huevo-tomate', CB:'c-turkey-blackbeans-huevo-cheddar', // cerdo -> pavo
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-pure-squash', NB:'n-burrito-harina-2huevos' },

{ n:9, title:'Res y pavo, sin higado', note:'Comida res -> pavo. Cena sardina -> bacalao.',
  DA:'d-pan-huevos-aguacate', DB:'d-pan-huevos-aguacate',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-tortilla-cheddar-aguacate',
  CA:'c-carne-picada-patata-tomate-ajo', CB:'c-turkey-pintas-huevo', // vaca -> pavo
  MA:'b-clasico', MB:'b-citrico',
  NA:'d-sardinas-huevo-cheddar', NB:'n-bacalao-pure-simple' },      // sardina -> bacalao

{ n:10, title:'Lentejas, barata de verdad', note:'Comida cerdo ambos bloques (costillas -> lomo, igual patron que S2/S4). Cena sardina fija.',
  DA:'d-burrito-maiz', DB:'d-burrito-maiz',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-tortilla-cheddar-aguacate',
  CA:'c-costillas-lentejas-laurel-vino', CB:'c-lomo-patata-adobo',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-sardinas-patata-huevo' },

{ n:11, extrema:true, title:'EXTREMA — suelo absoluto de coste, sin ninguna regla', note:'Rompe a proposito. Los dos comen torta de garbanzo. Comida cerdo ambos bloques. Cena legumbre ambos bloques (rompe fibra insoluble y PCOS a proposito).',
  DA:'d-torta-garbanzo-60', DB:'d-torta-garbanzo-60',
  DMA:'d-torta-garbanzo-60', DMB:'d-torta-garbanzo-60',
  CA:'c-lomo-arroz-afgano', CB:'c-lomo-patata-adobo',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-blackbeans-huevo-patata', NB:'n-garbanzos-huevo-patata' },
]
