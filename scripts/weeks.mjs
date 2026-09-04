// Definicion de las 11 semanas, ya corregidas.
// D = desayuno (unificado Julio/Maria) · C = comida · M = merienda · N = cena
// Arrays de 7. Cadencia maxima 4/7 por franja para GOS y fructanos.

export const WEEKS = [
{ n:1, title:'La mejor equilibrada', note:'Sin cambios de eje. Desayuno unificado y cadencia ya correcta.',
  D:Array(7).fill('d-burrito-maiz'),
  C:['c-rancho-aragones-xl','c-rancho-aragones-xl','c-rancho-aragones-xl','c-rancho-aragones-xl','c-pollo-pure-rustico-pipas','c-pollo-pure-rustico-pipas','c-pollo-pure-rustico-pipas'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-frittata-turkey-cheddar','n-frittata-turkey-cheddar','n-frittata-turkey-cheddar','n-frittata-turkey-cheddar','n-bacalao-pure-simple','n-bacalao-pure-simple','n-bacalao-pure-simple'] },

{ n:2, title:'Barata — el dinero manda', note:'Cena de sardinas rota 3 dias con bacalao+patata+tomate ($1,43, 1 g de grasa), que estaba comprada y sin usar.',
  D:Array(7).fill('d-burrito-maiz'),
  C:['c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-patata-adobo','c-lomo-patata-adobo','c-lomo-patata-adobo'],
  M:Array(7).fill('b-clasico-2'),
  N:['n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-bacalao-patata-tomate','n-bacalao-patata-tomate','n-bacalao-patata-tomate'] },

{ n:3, title:'La mas barata posible, sin romper nada', note:'Tres cenas de huevo cambiadas por sopa de lentejas con huevo escalfado ($1,15, la 2a mas barata del catalogo) — baja el coste Y sube la fibra soluble.',
  D:Array(7).fill('d-burrito-maiz'),
  C:['c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-patata-adobo','c-lomo-patata-adobo','c-lomo-patata-adobo'],
  M:Array(7).fill('b-clasico-2'),
  N:['n-patata-3huevos','n-patata-3huevos','n-patata-3huevos','n-patata-3huevos','n-sopa-lentejas-huevo-escalfado','n-sopa-lentejas-huevo-escalfado','n-sopa-lentejas-huevo-escalfado'] },

{ n:4, title:'GANANCIA DE PESO — sustituye a la de proteina maxima', note:'La antigua S4 empujaba 213 g de proteina a 64 kg: mas saciante, mas cara y mas sustrato proteolitico. Aqui el eje es densidad calorica en la ventana segura.',
  D:Array(7).fill('d-overnight-oats-chocolate'),
  C:['c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-solomillo-pure-manzana-batida','c-solomillo-pure-manzana-batida','c-solomillo-pure-manzana-batida'],
  M:['b-ganancia','b-ganancia','b-ganancia','b-ganancia','b-ganancia-manzana','b-ganancia-manzana','b-ganancia-manzana'],
  N:['n-bacalao-pure-squash-huevo','n-bacalao-pure-squash-huevo','n-bacalao-pure-squash-huevo','n-bacalao-pure-squash-huevo','n-turkey-patata-huevo','n-turkey-patata-huevo','n-turkey-patata-huevo'] },

{ n:5, title:'PCOS maximo (Maria) + margen de fibra', note:'CADENCIA CORREGIDA: la cebolla estaba en la comida 7/7. Tres dias pasan a solomillo+pure, que no lleva allium. Queda 4/7.',
  D:Array(7).fill('d-burrito-maiz'),
  C:['c-cordero-pure-cebolla-laurel','c-cordero-pure-cebolla-laurel','c-cordero-pure-cebolla-laurel','c-cordero-pure-cebolla-laurel','c-solomillo-pure-manzana-batida','c-solomillo-pure-manzana-batida','c-solomillo-pure-manzana-batida'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-bacalao-mantequilla-limon','n-bacalao-mantequilla-limon','n-bacalao-mantequilla-limon','n-shakshuka-turkey','n-shakshuka-turkey','n-shakshuka-turkey','n-shakshuka-turkey'] },

{ n:6, title:'Marisco y pescado como eje', note:'Mercurio bajo (mejillon, bacalao, sardina) y grasa minima. El ceviche exige congelacion previa por anisakis; si el bacalao no viene congelado, cocinarlo.',
  D:Array(7).fill('d-overnight-oats-chocolate'),
  C:Array(7).fill('c-mejillones-paella'),
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-mejillones-marinera-patata','n-mejillones-marinera-patata','n-mejillones-marinera-patata','n-bacalao-pure-squash','n-bacalao-pure-squash','n-bacalao-pure-squash','n-bacalao-pure-squash'] },

{ n:7, title:'Ave como eje (pollo y pavo)', note:'CADENCIA CORREGIDA: cebolla en la comida 7/7. Tres dias pasan a turkey+setas+vino. Queda 4/7.',
  D:Array(7).fill('d-burrito-maiz'),
  C:['c-pollo-arroz-afgano-cebolla-limon','c-pollo-arroz-afgano-cebolla-limon','c-pollo-arroz-afgano-cebolla-limon','c-pollo-arroz-afgano-cebolla-limon','c-turkey-setas-vino','c-turkey-setas-vino','c-turkey-setas-vino'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-fajitas-pollo-sin-tortilla','n-fajitas-pollo-sin-tortilla','n-fajitas-pollo-sin-tortilla','n-fajitas-pollo-sin-tortilla','n-turkey-patata-huevo','n-turkey-patata-huevo','n-turkey-patata-huevo'] },

{ n:8, title:'Legumbre en comida, al fin en su sitio', note:'CADENCIA CORREGIDA: black beans en la comida 7/7 era la carga de GOS mas alta de las once. Tres dias pasan a solomillo+patata. Queda 4/7.',
  D:Array(7).fill('d-overnight-oats-chocolate'),
  C:['c-solomillo-blackbeans-huevo-tomate','c-solomillo-blackbeans-huevo-tomate','c-solomillo-blackbeans-huevo-tomate','c-solomillo-blackbeans-huevo-tomate','c-solomillo-patata-mayonesa-limon','c-solomillo-patata-mayonesa-limon','c-solomillo-patata-mayonesa-limon'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-bacalao-pure-squash','n-bacalao-pure-squash','n-bacalao-pure-squash','n-burrito-harina-2huevos','n-burrito-harina-2huevos','n-burrito-harina-2huevos','n-burrito-harina-2huevos'] },

{ n:9, title:'Res y pavo, sin higado', note:'Higado fuera del batch por acumulacion de vitamina A: criterio correcto y se mantiene.',
  D:Array(7).fill('d-burrito-maiz'),
  C:['c-carne-picada-patata-tomate-ajo','c-carne-picada-patata-tomate-ajo','c-carne-picada-patata-tomate-ajo','c-carne-picada-patata-tomate-ajo','c-turkey-pintas-huevo','c-turkey-pintas-huevo','c-turkey-pintas-huevo'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['d-sardinas-huevo-cheddar','d-sardinas-huevo-cheddar','d-sardinas-huevo-cheddar','n-bacalao-pure-simple','n-bacalao-pure-simple','n-bacalao-pure-simple','n-bacalao-pure-simple'] },

{ n:10, title:'Lentejas, barata de verdad', note:'Cuarta mas barata de las once, no la segunda como decia la etiqueta anterior.',
  D:Array(7).fill('d-burrito-maiz'),
  C:['c-costillas-lentejas-laurel-vino','c-costillas-lentejas-laurel-vino','c-costillas-lentejas-laurel-vino','c-costillas-lentejas-laurel-vino','c-solomillo-patata-mayonesa-limon','c-solomillo-patata-mayonesa-limon','c-solomillo-patata-mayonesa-limon'],
  M:Array(7).fill('b-clasico-2'),
  N:['n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-bacalao-patata-tomate','n-bacalao-patata-tomate','n-bacalao-patata-tomate','n-bacalao-patata-tomate'] },

{ n:11, extrema:true, title:'EXTREMA — suelo absoluto de coste, sin ninguna regla', note:'Rompe a proposito: harina de garbanzo en desayuno y legumbre en cena los 7 dias. Referencia de coste, no semana para rotar. No usarla durante el curso.',
  D:Array(7).fill('d-torta-garbanzo-60'),
  C:['c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-patata-adobo','c-lomo-patata-adobo','c-lomo-patata-adobo'],
  M:Array(7).fill('b-clasico-2'),
  N:['n-blackbeans-huevo-patata','n-blackbeans-huevo-patata','n-blackbeans-huevo-patata','n-blackbeans-huevo-patata','n-garbanzos-huevo-patata','n-garbanzos-huevo-patata','n-garbanzos-huevo-patata'] },
]
