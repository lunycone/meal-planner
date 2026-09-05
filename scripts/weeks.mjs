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
  // Paso final (6 sep 2026): DB violaba el techo de grasa de Julio (32g).
  // Reasignado dentro de los 8 desayunos que ya cumplen grasa<=15/19g.
  // "La mejor equilibrada" es la semana del burrito con huevo (favorito del
  // usuario) en los dos bloques -- pedido explicito de repetirlo mas (6 sep
  // 2026). Tambien saca el batido proteico (62g prot) de esta semana: sumado
  // a comida/cena ya empujaba el dia a 167g (techo 143g).
  DA:'d-burrito-maiz', DB:'d-burrito-maiz',
  // Paso 3 (5 sep 2026): DMA y DMB llevaban legumbre los DOS (burrito 50/50
  // y torta de garbanzo), asi que Maria comia GOS en desayuno 7/7 dias.
  // DMB (bloque de 4 dias) pasa a un desayuno sin legumbre -> GOS baja a 3/7.
  DMA:'d-burrito-5050', DMB:'d-tortilla-cheddar-aguacate',
  // Techo de grasa (6 sep 2026): CB (pollo+pipas de girasol, 66g grasa) era
  // el peor plato de todo el catalogo en esos dias sin merienda de Maria.
  // El Rancho aragones (CA) se queda intacto -- el usuario lo pidio
  // explicitamente ("el rancho no me lo quites, que me encanta"). Ojo: el
  // rancho lleva AJO (fructano) -- por eso CB no puede llevar cebolla/ajo
  // tampoco, o vuelve a dar 7/7. Pollo+pure patata-zanahoria no lleva ninguno.
  CA:'c-rancho-aragones-xl', CB:'c-pollo-pure-patata-zanahoria',     // cerdo -> pollo, menos grasa (66g -> 54g), sin fructanos
  MA:'b-clasico', MB:'b-citrico',
  // Cena con cebolla 7/7 (frittata + fajita bowl): revisado y descartado el
  // cambio de cebolla en su momento -- pero SI se cambian por el techo de
  // grasa (frittata 50g, fajita bowl 54g eran los otros dos peores). NA pasa
  // a bacalao (especie distinta de NB=pavo, evita el aviso de especie
  // repetida) y de paso es el mas bajo en grasa de todo el cambio (26g).
  NA:'n-bacalao-patata-tomate', NB:'n-turkey-patata-huevo' },        // bacalao / pavo, mucha menos grasa (50g/54g -> 26g/38g)

{ n:2, title:'Barata — el dinero manda', note:'Desayuno cambia de bloque. Comida cerdo -> pollo en bloque B (corrige repeticion de especie); cena y desayuno sardina -> bacalao para variar.',
  // DB (torta garbanzo, 24g grasa) violaba el techo. Reasignado.
  DA:'d-avena-leche-desnatada-miel', DB:'d-huevos-tostada-madre-miel-reforzado', // cabra-mandarina (46g prot) cambiado por uno de ~20g -- menos presion sobre el techo de proteina
  DMA:'d-torta-garbanzo-50-huevo', DMB:'d-burrito-maiz',
  CA:'c-lomo-arroz-afgano', CB:'c-pollo-arroz-afgano-cebolla-limon', // cerdo -> pollo
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-patata-tomate' },      // sardina -> bacalao

{ n:3, title:'La mas barata posible, sin romper nada', note:'Desayuno cambia de bloque. Comida cerdo -> pavo en bloque B (corrige repeticion de especie); cena huevo -> bacalao.',
  // DA/DB (torta garbanzo, 24g grasa) violaban el techo. Reasignado.
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-avena-leche-desnatada-miel', // cabra-mandarina (46g prot) cambiado por uno de ~20g
  DMA:'d-torta-garbanzo-60', DMB:'d-burrito-maiz',
  CA:'c-lomo-arroz-afgano', CB:'c-turkey-glaseado',                  // cerdo -> pavo
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-patata-3huevos', NB:'n-bacalao-patata-tomate' },             // huevo -> bacalao

{ n:4, title:'GANANCIA DE PESO — sustituye a la de proteina maxima', note:'Desayuno cambia de bloque. Comida cerdo -> pavo en bloque B (corrige repeticion de especie, mas kcal/proteina, coherente con el objetivo). Cena bacalao -> pavo.',
  // DA (16g) y DB (32g) violaban el techo. Semana de ganancia -> se eligen
  // los dos desayunos compliant de mayor kcal (419/424).
  DA:'d-burrito-maiz', DB:'d-huevos-tostada-madre-miel-reforzado', // batido de cacao (68g prot) y yogur cabra (46g) sacados -- empujaban el dia a 176g (techo 143g)
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-lomo-arroz-afgano', CB:'c-turkey-garbanzos-huevo-sofrito',   // cerdo -> pavo
  MA:'b-ganancia', MB:'b-ganancia-manzana',
  NA:'n-bacalao-pure-squash-huevo', NB:'n-turkey-patata-huevo' },    // bacalao -> pavo

{ n:5, title:'PCOS maximo (Maria) + margen de fibra', note:'Desayuno cambia de bloque. Comida cordero -> pavo. Cena bacalao -> pavo.',
  // DA/DB (torta garbanzo, 24g grasa) violaban el techo. Reasignado.
  DA:'d-tostada-madre-miel-platano', DB:'d-huevos-tostada-madre-miel-reforzado', // batido de cacao (68g prot) sacado
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  // Comida con cebolla 7/7 (cordero + turkey-mostaza): revisado y descartado
  // el cambio -- el usuario decide que aqui no pasa nada (5 sep 2026).
  CA:'c-cordero-pure-cebolla-laurel', CB:'c-turkey-cebolla-mostaza', // cordero -> pavo
  MA:'b-clasico', MB:'b-citrico',
  // Techo de grasa (6 sep 2026): bacalao con mantequilla (52g grasa) era uno
  // de los 3 peores del catalogo. Mismo pescado, sin mantequilla.
  // Techo de grasa: shakshuka de turkey (57g) era el peor plato de NB, y
  // encima cae en Lunes (dia sin merienda de Maria). Mismo pavo, menos grasa.
  NA:'n-bacalao-patata-tomate', NB:'n-turkey-patata-huevo' },        // bacalao -> pavo, sin mantequilla (52g -> 26g) / shakshuka -> pavo mas ligero (57g -> 38g)

{ n:6, title:'Marisco y pescado como eje', note:'Tu desayuno ROTA cada dia (3 platos A: Mar-Mie-Jue, 4 platos B: Vie-Sab-Dom-Lun, ninguno repetido en el mismo bloque). Maria cambia de bloque. Comida mejillon -> pavo en bloque B (antes el mismo plato los 7 dias, sin blocks reales). Cena bacalao -> bacalao (receta distinta), quitando el mejillon repetido de comida+cena.',
  // Los 7 platos ROTA violaban el techo de grasa (16-38g). Reasignados a
  // los 8 desayunos compliant que ya existen -- 3 en A, 4 en B, sin repetir
  // ninguno dentro del mismo bloque.
  DA:'ROTA', DB:'ROTA',
  // batido proteico (62g prot) sacado de la rotacion -- empujaba el dia por
  // encima del techo de proteina sumado a comida/cena.
  // Reordenado (6 sep 2026): la avena aporta la mayor parte de la fibra
  // soluble del desayuno (3.15g) -- puesta en Miercoles evita que ese dia
  // caiga por debajo del suelo de 8g (paso por 7.6g cuando caia Martes).
  DrotA:['d-huevos-tostada-madre-miel-reforzado','d-avena-leche-desnatada-miel','d-tostada-madre-miel-platano'],
  DrotB:['d-burrito-maiz','d-avena-leche-desnatada-miel','d-huevos-tostada-madre-miel-reforzado','d-tostada-madre-miel-platano'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  // Paso 3: CA (cebolla) y CB (cebolla+garbanzos) daban fructanos 7/7 en
  // comida. Turkey+glaseado (756kcal) se descarto por dar pocas kcal para
  // una comida (techo 1000-1100) -- CB pasa a Turkey+alubias pintas+huevo
  // (943kcal, mas cerca del objetivo): sin cebolla, con legumbre pero solo
  // en este bloque (GOS pasa a 4/7, dentro del limite).
  CA:'c-mejillones-paella', CB:'c-turkey-pintas-huevo',              // mejillon -> pavo, sin cebolla, mas sustancioso
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-ceviche-bacalao', NB:'n-sardinas-patata-huevo' },            // mejillon -> sardina (bacalao ya usado en bloque A de cena)

{ n:7, title:'Ave como eje (pollo y pavo)', note:'Tu desayuno ROTA (3 platos A: Mar-Mie-Jue, 4 platos B: Vie-Sab-Dom-Lun). Maria cambia de bloque. Comida pollo -> pavo. Cena pollo -> pavo.',
  // Misma reasignacion que S6 -- los 7 ROTA violaban el techo de grasa.
  DA:'ROTA', DB:'ROTA',
  // batido proteico (62g prot) sacado de la rotacion -- empujaba el dia por
  // encima del techo de proteina sumado a comida/cena.
  // Reordenado (6 sep 2026): la avena aporta la mayor parte de la fibra
  // soluble del desayuno (3.15g) -- puesta en Miercoles evita que ese dia
  // caiga por debajo del suelo de 8g (paso por 7.6g cuando caia Martes).
  DrotA:['d-huevos-tostada-madre-miel-reforzado','d-avena-leche-desnatada-miel','d-tostada-madre-miel-platano'],
  DrotB:['d-burrito-maiz','d-avena-leche-desnatada-miel','d-huevos-tostada-madre-miel-reforzado','d-tostada-madre-miel-platano'],
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  // Paso 3: mismo problema que S6 -- CB pasa a Turkey+alubias pintas+huevo
  // (943kcal) en vez de Turkey+glaseado (756kcal, insuficiente para comida).
  CA:'c-pollo-arroz-afgano-cebolla-limon', CB:'c-turkey-pintas-huevo', // pollo -> pavo, sin cebolla, mas sustancioso
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-fajitas-pollo-sin-tortilla', NB:'n-turkey-patata-huevo' },   // pollo -> pavo

{ n:8, title:'Legumbre en comida, al fin en su sitio', note:'Desayuno cambia de bloque. Comida solomillo(cerdo) -> pavo, CB con black beans. Cena bacalao -> burrito de huevo.',
  // DA (batido blando, 27g grasa) violaba el techo. Reasignado.
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-burrito-maiz', // batido proteico (62g prot) sacado
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  // Paso 3: CA y CB llevaban black beans los DOS (GOS 7/7 en comida). CA
  // (3 dias) pasa a un solomillo sin legumbre; CB (4 dias) se queda con la
  // legumbre -- sigue siendo "legumbre en comida", solo que no los 7 dias.
  // Techo de grasa: la mayonesa (51g) subia el Miercoles de Maria a 90g solo
  // entre comida y cena. Mismo cerdo sin legumbre, sin mayonesa (usa leche).
  CA:'c-solomillo-pure-manzana-batida', CB:'c-turkey-blackbeans-huevo-cheddar', // cerdo sin legumbre (51g -> 40g) -> pavo con legumbre
  MA:'b-clasico', MB:'b-citrico',
  NA:'n-bacalao-pure-squash', NB:'n-burrito-harina-2huevos' },

{ n:9, title:'Res y pavo, sin higado', note:'Desayuno cambia de bloque. Comida res -> pavo. Cena sardina -> bacalao.',
  // DA (pan+huevos+aguacate, 32g grasa) violaba el techo. Reasignado.
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-burrito-maiz',
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-carne-picada-patata-tomate-ajo', CB:'c-turkey-pintas-huevo', // vaca -> pavo
  MA:'b-clasico', MB:'b-citrico',
  // NA no tenia ingrediente escalable (sin patata/arroz) -> se quedaba fija
  // en 347 kcal pasara lo que pasara, y era la causa real del peor hueco de
  // Maria (S9 Miercoles, -504 kcal). Misma sardina, con patata escalable.
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-pure-simple' },        // sardina -> bacalao

{ n:10, title:'Lentejas, barata de verdad', note:'Desayuno cambia de bloque. Comida cerdo -> pollo en bloque B (corrige repeticion de especie). Cena sardina -> bacalao.',
  // DB (torta garbanzo, 24g grasa) violaba el techo. Reasignado.
  DA:'d-burrito-maiz', DB:'d-avena-leche-desnatada-miel', // batido de cacao (68g prot) sacado
  DMA:'d-tortilla-cheddar-aguacate', DMB:'d-torta-garbanzo-50-huevo',
  CA:'c-costillas-lentejas-laurel-vino', CB:'c-pollo-pure-patata-zanahoria', // cerdo -> pollo
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-sardinas-patata-huevo', NB:'n-bacalao-patata-tomate' },      // sardina -> bacalao

{ n:11, extrema:true, title:'EXTREMA — suelo absoluto de coste, sin ninguna regla', note:'Rompe a proposito: desayuno de garbanzo fijo para los dos (unico caso permitido, es la semana marcada como referencia extrema). Comida cerdo ambos bloques. Cena legumbre ambos bloques.',
  DA:'d-torta-garbanzo-60', DB:'d-torta-garbanzo-60',
  DMA:'d-torta-garbanzo-60', DMB:'d-torta-garbanzo-60',
  CA:'c-lomo-arroz-afgano', CB:'c-lomo-patata-adobo',
  MA:'b-clasico-2', MB:'b-clasico-2',
  NA:'n-blackbeans-huevo-patata', NB:'n-garbanzos-huevo-patata' },

{ n:12, title:'ASTRINGENTE — para días de diarrea', note:'Semana especial, no rotativa: para cuando hay diarrea, no para uso habitual. Sin legumbres, sin cebolla/ajo (salvo el ajo del rancho, que el usuario pidio explicitamente mantener), sin frutos secos/semillas, sin lacteos en merienda, verduras siempre muy cocidas.',
  // A peticion expresa del usuario (6 sep 2026): "lo que mas me quita la
  // diarrea es el rancho o el estofado de ternera" -- los dos van en comida,
  // uno por bloque. El resto de la semana (desayuno, merienda, cena) esta
  // pensado por mi para acompañar sin romper el objetivo astringente: nada
  // de legumbre/cebolla/ajo/frutos secos/lacteos con lactosa relevante,
  // verdura siempre muy cocida, arroz blanco y patata (sin piel) como base.
  // NO participa en las reglas de siempre (no hace falta variar desayuno
  // dia a dia, no hay techo de grasa que cumplir) -- es una semana de
  // rescate para pocos dias, no para repetir en bucle como las otras 11.
  //
  // Desayuno: huevo+tostada+miel <-> tostada+platano+miel (ya existentes,
  // sin lacteos, sin fruta acida, sin grasa alta).
  DA:'d-huevos-tostada-madre-miel-reforzado', DB:'d-tostada-madre-miel-platano',
  DMA:'d-tostada-madre-miel-platano', DMB:'d-huevos-tostada-madre-miel-reforzado',
  // Comida: los dos platos pedidos por el usuario. El rancho SI lleva ajo
  // (cantidad de sabor, no de bulto) -- se deja tal cual porque el propio
  // usuario dice que este plato en concreto le sienta bien a pesar de eso.
  CA:'c-estofado-ternera-patata-zanahoria', CB:'c-rancho-aragones-grande',
  // Merienda: nueva, sin lacteos ni frutos secos (ver dishes.js). Misma para
  // los dos bloques -- no hace falta variar en una semana de pocos dias.
  MA:'m-astringente-platano-manzana', MB:'m-astringente-platano-manzana',
  // Cena: especie distinta a la comida de ese dia (pollo/pavo vs
  // ternera/cerdo), siempre hervido/al horno simple, sin cebolla/ajo.
  NA:'n-pollo-hervido-arroz-zanahoria', NB:'n-turkey-patata-huevo' },
]
