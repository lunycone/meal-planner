// Copia exacta de la estructura de datos del HTML original
// (/Users/juliocalvo/Downloads/semanas-modelo.html), extraida linea por
// linea de su <script>, sin modificar ningun valor. Uso: verificacion, no
// generacion.
const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const BATIDO_A = { w1:'Batido clásico', w2:'Batido clásico 2', w3:'Batido clásico 2', w4:'Batido clásico', w5:'Batido clásico' };
const BATIDO_B = { w1:'Batido cítrico', w2:'Batido clásico 2', w3:'Batido clásico 2', w4:'Batido cítrico', w5:'Batido cítrico' };
const BASE = {
  w1: { title: 'La mejor equilibrada', mer:[751,751,751,751,735,735,735],
    com: ['Rancho aragonés (XL)','Rancho aragonés (XL)','Rancho aragonés (XL)','Rancho aragonés (XL)','Pollo asado + puré + pipas','Pollo asado + puré + pipas','Pollo asado + puré + pipas'],
    cen: ['Frittata turkey+cheddar','Frittata turkey+cheddar','Frittata turkey+cheddar','Fajita bowl turkey','Fajita bowl turkey','Fajita bowl turkey','Fajita bowl turkey'] },
  w2: { title: 'Barata — dinero manda', mer:[612,612,612,612,612,612,612],
    com: ['Lomo cerdo + arroz afgano','Lomo cerdo + arroz afgano','Lomo cerdo + arroz afgano','Lomo cerdo + arroz afgano','Lomo cerdo + patata + adobo','Lomo cerdo + patata + adobo','Lomo cerdo + patata + adobo'],
    cen: Array(7).fill('Sardinas + patata + huevo') },
  w3: { title: 'La más barata posible, sin romper nada', mer:[612,612,612,612,612,612,612],
    com: ['Lomo cerdo + arroz afgano','Lomo cerdo + arroz afgano','Lomo cerdo + arroz afgano','Lomo cerdo + arroz afgano','Lomo cerdo + patata + adobo','Lomo cerdo + patata + adobo','Lomo cerdo + patata + adobo'],
    cen: Array(7).fill('3 huevos + patata') },
  w4: { title: 'Proteína/rendimiento máximo (Julio)', mer:[751,751,751,751,735,735,735],
    com: ['Rancho aragonés (XL)','Rancho aragonés (XL)','Rancho aragonés (XL)','Rancho aragonés (XL)','Solomillo + puré + manzana','Solomillo + puré + manzana','Solomillo + puré + manzana'],
    cen: ['Turkey + mejillones en cazuela','Turkey + mejillones en cazuela','Turkey + mejillones en cazuela','Turkey + mejillones en cazuela','Bacalao + mejillones en cazuela','Bacalao + mejillones en cazuela','Bacalao + mejillones en cazuela'] },
  w5: { title: 'PCOS máximo (María) + margen de fibra (Julio)', mer:[751,751,751,751,735,735,735],
    com: ['Cordero + puré + cebolla + laurel','Cordero + puré + cebolla + laurel','Cordero + puré + cebolla + laurel','Cordero + puré + cebolla + laurel','Turkey + cebolla + mostaza','Turkey + cebolla + mostaza','Turkey + cebolla + mostaza'],
    cen: ['Bacalao con mantequilla de limón','Bacalao con mantequilla de limón','Bacalao con mantequilla de limón','Shakshuka de turkey','Shakshuka de turkey','Shakshuka de turkey','Shakshuka de turkey'] },
};
const DIGESTIVE = {
  w1: { desJ: ['Burrito maíz + 2 huevos','398 kcal · 19g prot'], desM: ['Burrito 50/50 (maíz+garbanzo)','441 kcal · 28g prot'],
    j: [[3150,153,8.98],[3150,153,8.98],[3100,150,8.83],[3300,150,9.18],[3000,137,10.57],[3300,151,11.60],[3000,137,10.57]],
    m: [[2500,123,7.45],[2900,145,8.65],[2500,123,7.45],[2750,129,8.02],[2500,118,9.25],[2750,131,10.11],[2500,118,9.25]] },
  w2: { desJ: ['Burrito maíz + 2 huevos','398 kcal · 19g prot'], desM: ['Torta garbanzo (50g) + huevo','446 kcal · 17g prot'],
    j: [[3150,155,8.69],[3150,155,8.69],[3100,152,8.55],[3300,162,9.11],[3000,153,8.91],[3300,170,9.85],[3000,153,8.91]],
    m: [[2500,116,5.99],[2900,137,7.10],[2500,116,5.99],[2750,129,6.68],[2500,120,6.43],[2750,135,7.22],[2500,120,6.43]] },
  w3: { desJ: ['Burrito maíz + 2 huevos','398 kcal · 19g prot'], desM: ['Torta garbanzo (60g), sin huevo','412 kcal · 13g prot'],
    j: [[3150,146,8.42],[3150,146,8.42],[3100,144,8.29],[3300,153,8.82],[3000,145,8.60],[3300,160,9.49],[3000,145,8.60]],
    m: [[2500,108,5.33],[2900,128,6.38],[2500,108,5.33],[2750,120,5.99],[2500,112,5.74],[2750,125,6.48],[2500,112,5.74]] },
  w4: { desJ: ['Overnight oats sin chía','404 kcal · 19g prot'], desM: ['Tortilla + cheddar + aguacate','511 kcal · 25g prot'],
    j: [[3150,174,8.38],[3150,174,8.38],[3100,171,8.24],[3300,184,8.78],[3000,190,11.72],[3300,213,12.94],[3000,190,11.72]],
    m: [[2500,129,7.61],[2900,156,8.67],[2500,129,7.61],[2750,146,8.27],[2500,148,10.51],[2750,167,11.53],[2500,148,10.51]] },
  w5: { desJ: ['Huevos + tostada masa madre + miel','280 kcal · 16g prot'], desM: ['Tortilla + cheddar + aguacate','511 kcal · 25g prot'],
    j: [[3150,149,12.89],[3150,149,12.89],[3100,147,12.65],[3300,156,13.23],[3000,142,12.13],[3300,157,13.30],[3000,142,12.13]],
    m: [[2500,113,9.76],[2900,134,11.64],[2500,113,9.76],[2750,125,10.71],[2500,114,10.31],[2750,127,11.28],[2500,114,10.31]] },
};
const WEEKS_1_5 = [];
['w1','w2','w3','w4','w5'].forEach((wk,idx) => {
  const b = BASE[wk], d = DIGESTIVE[wk];
  WEEKS_1_5.push({
    n: idx+1, group: 'digestivo',
    title: b.title,
    des: { j: d.desJ, m: d.desM },
    mer: b.mer.map((k,i) => [i<4 ? BATIDO_A[wk] : BATIDO_B[wk], k+' kcal']),
    com: b.com, cen: b.cen, j: d.j, m: d.m,
  });
});
const DES_ROTATION = [
  ['Burrito maíz + 2 huevos', '398 kcal · 19g prot'],
  ['Overnight oats sin chía', '404 kcal · 19g prot'],
  ['Batido blando ajustado', '441 kcal · 17g prot'],
  ['Huevos + tostada + miel', '280 kcal · 16g prot'],
  ['Yogur + plátano + avena', '314 kcal · 11g prot'],
  ['Tostada + 2 huevos', '277 kcal · 17g prot'],
  ['Arroz con leche simple', '386 kcal · 11g prot'],
];
const MARIA_DES_FIXED = ['Tortilla + cheddar + aguacate', '511 kcal · 25g prot'];
const NEW_WEEKS = {
  w6: { title: 'Marisco/pescado como eje',
    mer: ['Batido clásico','Batido clásico','Batido clásico','Batido clásico','Batido cítrico','Batido cítrico','Batido cítrico'].map((n,i)=>[n, (i<4?751:735)+' kcal']),
    com: Array(7).fill('Mejillones modo paella'),
    cen: ['Ceviche de bacalao','Ceviche de bacalao','Ceviche de bacalao','Mejillones a la marinera + patata','Mejillones a la marinera + patata','Mejillones a la marinera + patata','Mejillones a la marinera + patata'],
    j: [[3150,144,10.15],[3150,144,10.15],[3100,138,9.41],[3300,154,11.38],[3000,150,8.26],[3300,175,9.81],[3000,146,7.85]],
    m: [[2500,112,8.63],[2900,132,10.09],[2500,112,8.63],[2750,124,9.55],[2500,123,8.44],[2750,138,9.05],[2500,123,8.44]] },
  w7: { title: 'Ave como eje (pollo/pavo, no cerdo)',
    mer: ['Batido clásico','Batido clásico','Batido clásico','Batido clásico','Batido cítrico','Batido cítrico','Batido cítrico'].map((n,i)=>[n, (i<4?751:735)+' kcal']),
    com: ['Pollo + arroz afgano + cebolla y limón','Pollo + arroz afgano + cebolla y limón','Pollo + arroz afgano + cebolla y limón','Pollo + arroz afgano + cebolla y limón','Turkey + cebolla + escabeche','Turkey + cebolla + escabeche','Turkey + cebolla + escabeche'],
    cen: ['Fajitas de pollo sin tortilla','Fajitas de pollo sin tortilla','Fajitas de pollo sin tortilla','Fajitas de pollo sin tortilla','Turkey + patata + huevo','Turkey + patata + huevo','Turkey + patata + huevo'],
    j: [[3150,141,10.49],[3150,141,10.49],[3100,135,9.73],[3300,151,11.77],[3000,143,10.62],[3300,167,12.58],[3000,139,10.12]],
    m: [[2500,110,8.83],[2900,130,10.37],[2500,110,8.83],[2750,122,9.79],[2500,119,9.96],[2750,133,10.86],[2500,119,9.96]] },
};
const WEEKS_6_7 = ['w6','w7'].map((wk,idx) => {
  const w = NEW_WEEKS[wk];
  return { n: idx+6, group: 'digestivo', rotating: true, title: w.title,
    desRotation: DES_ROTATION, desM: MARIA_DES_FIXED,
    mer: w.mer, com: w.com, cen: w.cen, j: w.j, m: w.m };
});
const merStd = (mA,mB) => [mA,mA,mA,mA,mB,mB,mB].map((n,i)=>[n, (i<4?751:735)+' kcal']);
const merClasico2 = Array(7).fill(['Batido clásico 2','612 kcal']);
const WEEK_8 = {
  n: 8, group: 'digestivo', title: 'Legumbre en comida, al fin en su sitio',
  des: { j:['Batido blando ajustado','441 kcal · 17g prot'], m:['Tortilla + cheddar + aguacate','511 kcal · 25g prot'] },
  mer: merStd('Batido clásico','Batido cítrico'),
  com: ['Solomillo + black beans + huevo + tomate','Solomillo + black beans + huevo + tomate','Solomillo + black beans + huevo + tomate','Solomillo + black beans + huevo + tomate','Turkey + black beans + huevo + cheddar','Turkey + black beans + huevo + cheddar','Turkey + black beans + huevo + cheddar'],
  cen: ['Bacalao + puré de patata-zucchini','Bacalao + puré de patata-zucchini','Bacalao + puré de patata-zucchini','Burrito de harina + 2 huevos','Burrito de harina + 2 huevos','Burrito de harina + 2 huevos','Burrito de harina + 2 huevos'],
  j: [[3150,171,9.57],[3150,171,9.57],[3100,168,9.39],[3300,182,10.12],[3000,158,9.87],[3300,177,10.87],[3000,158,9.87]],
  m: [[2500,130,8.62],[2900,157,10.08],[2500,130,8.62],[2750,147,9.53],[2500,130,9.63],[2750,145,10.46],[2500,130,9.63]],
};
const WEEK_9 = {
  n: 9, group: 'digestivo', title: 'Res + pavo, sin hígado',
  des: { j:['Tostada + 2 huevos','277 kcal · 17g prot'], m:['Tortilla + cheddar + aguacate','511 kcal · 25g prot'] },
  mer: merStd('Batido clásico','Batido cítrico'),
  com: ['Carne picada de res + patata + tomate-ajo','Carne picada de res + patata + tomate-ajo','Carne picada de res + patata + tomate-ajo','Carne picada de res + patata + tomate-ajo','Turkey + alubias pintas + huevo','Turkey + alubias pintas + huevo','Turkey + alubias pintas + huevo'],
  cen: ['Sardinas + huevo + cheddar','Sardinas + huevo + cheddar','Sardinas + huevo + cheddar','Bacalao + puré de patata simple','Bacalao + puré de patata simple','Bacalao + puré de patata simple','Bacalao + puré de patata simple'],
  j: [[3150,139,14.01],[3150,139,14.01],[3100,137,13.74],[3300,146,14.81],[3000,158,10.40],[3300,176,11.32],[3000,158,10.40]],
  m: [[2500,107,10.41],[2900,125,12.55],[2500,107,10.41],[2750,118,11.75],[2500,124,9.27],[2750,139,10.04],[2500,124,9.27]],
};
const WEEK_10 = {
  n: 10, group: 'digestivo', title: 'Lentejas, barata de verdad',
  des: { j:['Burrito maíz + 2 huevos','398 kcal · 19g prot'], m:['Tortilla + cheddar + aguacate','511 kcal · 25g prot'] },
  mer: merClasico2,
  com: ['Costillas cerdo + lentejas verdes + laurel y vino','Costillas cerdo + lentejas verdes + laurel y vino','Costillas cerdo + lentejas verdes + laurel y vino','Costillas cerdo + lentejas verdes + laurel y vino','Lomo cerdo + patata asada + adobo','Lomo cerdo + patata asada + adobo','Lomo cerdo + patata asada + adobo'],
  cen: Array(7).fill('Sardinas + patata + huevo'),
  j: [[3150,152,8.45],[3150,152,8.45],[3100,149,8.32],[3300,159,8.85],[3000,153,8.91],[3300,170,9.85],[3000,153,8.91]],
  m: [[2500,118,7.69],[2900,139,8.76],[2500,118,7.69],[2750,131,8.36],[2500,125,8.26],[2750,139,9.04],[2500,125,8.26]],
};
const WEEK_11 = {
  n: 11, group: 'extrema', title: '⚠ EXTREMA — el suelo absoluto de coste, sin ninguna regla',
  des: { j:['Torta de garbanzo (60g) + AOVE','412 kcal · 13g prot'], m:['Torta de garbanzo (60g) + AOVE','412 kcal · 13g prot'] },
  mer: merClasico2,
  com: ['Lomo cerdo + arroz afgano','Lomo cerdo + arroz afgano','Lomo cerdo + arroz afgano','Lomo cerdo + arroz afgano','Lomo cerdo + patata asada + adobo','Lomo cerdo + patata asada + adobo','Lomo cerdo + patata asada + adobo'],
  cen: ['Black beans + huevo + patata','Black beans + huevo + patata','Black beans + huevo + patata','Black beans + huevo + patata','Garbanzos + huevo + patata','Garbanzos + huevo + patata','Garbanzos + huevo + patata'],
  j: [[3150,146,5.33],[3150,146,5.33],[3100,144,5.24],[3300,154,5.59],[3000,139,5.54],[3300,155,6.15],[3000,139,5.54]],
  m: [[2500,112,4.18],[2900,133,4.89],[2500,112,4.18],[2750,125,4.62],[2500,113,4.53],[2750,126,5.04],[2500,113,4.53]],
};

export const WEEKS = [...WEEKS_1_5, ...WEEKS_6_7, WEEK_8, WEEK_9, WEEK_10, WEEK_11]
