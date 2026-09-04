// Definicion de las 11 semanas.
// D  = tu desayuno (rota, NO Array(7).fill de uno solo)
// DM = desayuno de Maria (propio, distinto al tuyo — se restauro tras el
//      error del 3 sep: yo lo habia fusionado con el tuyo sin que lo pidieras)
// C = comida · M = merienda · N = cena. Cadencia maxima 4/7 por franja.

const ROT7 = [ // tu rotacion real de 7 dias distintos (existia en S6-S7 del
                // HTML viejo como DES_ROTATION; aqui se generaliza a todas)
  'd-burrito-maiz', 'd-overnight-oats-chocolate', 'b-blando',
  'd-pan-huevos-aguacate', 'd-yogur-almendra-pumpkin-choco',
  'd-tortilla-cheddar-aguacate', 'n-patata-3huevos',
]

export const WEEKS = [
{ n:1, title:'La mejor equilibrada', note:'Tu desayuno rota (7 platos distintos, no uno repetido). María mantiene el suyo, propio y separado.',
  D:ROT7,
  DM:Array(7).fill('d-burrito-5050'),
  C:['c-rancho-aragones-xl','c-rancho-aragones-xl','c-rancho-aragones-xl','c-rancho-aragones-xl','c-pollo-pure-rustico-pipas','c-pollo-pure-rustico-pipas','c-pollo-pure-rustico-pipas'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-frittata-turkey-cheddar','n-frittata-turkey-cheddar','n-frittata-turkey-cheddar','n-frittata-turkey-cheddar','n-bacalao-pure-simple','n-bacalao-pure-simple','n-bacalao-pure-simple'] },

{ n:2, title:'Barata — el dinero manda', note:'Cena de sardinas rota 3 dias con bacalao+patata+tomate. Desayuno tuyo fijo (coincide con el HTML viejo); el de María es su torta propia.',
  D:Array(7).fill('d-burrito-maiz'),
  DM:Array(7).fill('d-torta-garbanzo-50-huevo'),
  C:['c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-patata-adobo','c-lomo-patata-adobo','c-lomo-patata-adobo'],
  M:Array(7).fill('b-clasico-2'),
  N:['n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-bacalao-patata-tomate','n-bacalao-patata-tomate','n-bacalao-patata-tomate'] },

{ n:3, title:'La mas barata posible, sin romper nada', note:'Cenas de huevo cambiadas por sopa de lentejas. Desayuno de María: torta de garbanzo sin huevo, como en el original.',
  D:Array(7).fill('d-burrito-maiz'),
  DM:Array(7).fill('d-torta-garbanzo-60'),
  C:['c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-patata-adobo','c-lomo-patata-adobo','c-lomo-patata-adobo'],
  M:Array(7).fill('b-clasico-2'),
  N:['n-patata-3huevos','n-patata-3huevos','n-patata-3huevos','n-patata-3huevos','n-sopa-lentejas-huevo-escalfado','n-sopa-lentejas-huevo-escalfado','n-sopa-lentejas-huevo-escalfado'] },

{ n:4, title:'GANANCIA DE PESO — sustituye a la de proteina maxima', note:'Densidad calorica en la ventana segura de las 16:00 en vez de proteina bruta (213 g a 64 kg era contraproducente). Desayuno de María sin cambios respecto al original.',
  D:ROT7,
  DM:Array(7).fill('d-tortilla-cheddar-aguacate'),
  C:['c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-solomillo-pure-manzana-batida','c-solomillo-pure-manzana-batida','c-solomillo-pure-manzana-batida'],
  M:['b-ganancia','b-ganancia','b-ganancia','b-ganancia','b-ganancia-manzana','b-ganancia-manzana','b-ganancia-manzana'],
  N:['n-bacalao-pure-squash-huevo','n-bacalao-pure-squash-huevo','n-bacalao-pure-squash-huevo','n-bacalao-pure-squash-huevo','n-turkey-patata-huevo','n-turkey-patata-huevo','n-turkey-patata-huevo'] },

{ n:5, title:'PCOS maximo (Maria) + margen de fibra', note:'CADENCIA CORREGIDA: cebolla en la comida 7/7 -> 4/7. Desayuno de María: tortilla+cheddar+aguacate, como en el original.',
  D:Array(7).fill('d-burrito-maiz'),
  DM:Array(7).fill('d-tortilla-cheddar-aguacate'),
  C:['c-cordero-pure-cebolla-laurel','c-cordero-pure-cebolla-laurel','c-cordero-pure-cebolla-laurel','c-cordero-pure-cebolla-laurel','c-solomillo-pure-manzana-batida','c-solomillo-pure-manzana-batida','c-solomillo-pure-manzana-batida'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-bacalao-mantequilla-limon','n-bacalao-mantequilla-limon','n-bacalao-mantequilla-limon','n-shakshuka-turkey','n-shakshuka-turkey','n-shakshuka-turkey','n-shakshuka-turkey'] },

{ n:6, title:'Marisco y pescado como eje', note:'Mercurio bajo. Ceviche exige congelacion previa por anisakis. Tu desayuno rota (ya rotaba en el original); María mantiene tortilla+cheddar+aguacate.',
  D:ROT7,
  DM:Array(7).fill('d-tortilla-cheddar-aguacate'),
  C:Array(7).fill('c-mejillones-paella'),
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-mejillones-marinera-patata','n-mejillones-marinera-patata','n-mejillones-marinera-patata','n-bacalao-pure-squash','n-bacalao-pure-squash','n-bacalao-pure-squash','n-bacalao-pure-squash'] },

{ n:7, title:'Ave como eje (pollo y pavo)', note:'CADENCIA CORREGIDA: cebolla en comida 7/7 -> 4/7. Tu desayuno rota (igual que en el original); María mantiene tortilla+cheddar+aguacate.',
  D:ROT7,
  DM:Array(7).fill('d-tortilla-cheddar-aguacate'),
  C:['c-pollo-arroz-afgano-cebolla-limon','c-pollo-arroz-afgano-cebolla-limon','c-pollo-arroz-afgano-cebolla-limon','c-pollo-arroz-afgano-cebolla-limon','c-turkey-setas-vino','c-turkey-setas-vino','c-turkey-setas-vino'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-fajitas-pollo-sin-tortilla','n-fajitas-pollo-sin-tortilla','n-fajitas-pollo-sin-tortilla','n-fajitas-pollo-sin-tortilla','n-turkey-patata-huevo','n-turkey-patata-huevo','n-turkey-patata-huevo'] },

{ n:8, title:'Legumbre en comida, al fin en su sitio', note:'CADENCIA CORREGIDA: black beans en comida 7/7 -> 4/7. Desayuno de María: tortilla+cheddar+aguacate, como en el original.',
  D:Array(7).fill('b-blando'),
  DM:Array(7).fill('d-tortilla-cheddar-aguacate'),
  C:['c-solomillo-blackbeans-huevo-tomate','c-solomillo-blackbeans-huevo-tomate','c-solomillo-blackbeans-huevo-tomate','c-solomillo-blackbeans-huevo-tomate','c-solomillo-patata-mayonesa-limon','c-solomillo-patata-mayonesa-limon','c-solomillo-patata-mayonesa-limon'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['n-bacalao-pure-squash','n-bacalao-pure-squash','n-bacalao-pure-squash','n-burrito-harina-2huevos','n-burrito-harina-2huevos','n-burrito-harina-2huevos','n-burrito-harina-2huevos'] },

{ n:9, title:'Res y pavo, sin higado', note:'Higado fuera del batch por acumulacion de vitamina A. Desayuno de María: tostada+2 huevos como en el original.',
  D:Array(7).fill('d-burrito-maiz'),
  DM:Array(7).fill('d-tortilla-cheddar-aguacate'),
  C:['c-carne-picada-patata-tomate-ajo','c-carne-picada-patata-tomate-ajo','c-carne-picada-patata-tomate-ajo','c-carne-picada-patata-tomate-ajo','c-turkey-pintas-huevo','c-turkey-pintas-huevo','c-turkey-pintas-huevo'],
  M:['b-clasico','b-clasico','b-clasico','b-clasico','b-citrico','b-citrico','b-citrico'],
  N:['d-sardinas-huevo-cheddar','d-sardinas-huevo-cheddar','d-sardinas-huevo-cheddar','n-bacalao-pure-simple','n-bacalao-pure-simple','n-bacalao-pure-simple','n-bacalao-pure-simple'] },

{ n:10, title:'Lentejas, barata de verdad', note:'Desayuno de María: tortilla+cheddar+aguacate, como en el original.',
  D:Array(7).fill('d-burrito-maiz'),
  DM:Array(7).fill('d-tortilla-cheddar-aguacate'),
  C:['c-costillas-lentejas-laurel-vino','c-costillas-lentejas-laurel-vino','c-costillas-lentejas-laurel-vino','c-costillas-lentejas-laurel-vino','c-solomillo-patata-mayonesa-limon','c-solomillo-patata-mayonesa-limon','c-solomillo-patata-mayonesa-limon'],
  M:Array(7).fill('b-clasico-2'),
  N:['n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-sardinas-patata-huevo','n-bacalao-patata-tomate','n-bacalao-patata-tomate','n-bacalao-patata-tomate','n-bacalao-patata-tomate'] },

{ n:11, extrema:true, title:'EXTREMA — suelo absoluto de coste, sin ninguna regla', note:'Rompe a proposito. Los dos comen torta de garbanzo, como en el original: aqui no aplican las reglas de separacion.',
  D:Array(7).fill('d-torta-garbanzo-60'),
  DM:Array(7).fill('d-torta-garbanzo-60'),
  C:['c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-arroz-afgano','c-lomo-patata-adobo','c-lomo-patata-adobo','c-lomo-patata-adobo'],
  M:Array(7).fill('b-clasico-2'),
  N:['n-blackbeans-huevo-patata','n-blackbeans-huevo-patata','n-blackbeans-huevo-patata','n-blackbeans-huevo-patata','n-garbanzos-huevo-patata','n-garbanzos-huevo-patata','n-garbanzos-huevo-patata'] },
]
