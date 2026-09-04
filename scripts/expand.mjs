// Expande la definicion en bloques a los arrays de 7 dias que el resto del
// pipeline (html-core, html-sheet) ya sabe consumir.
//
// EL CORTE NO CAE IGUAL EN TODAS LAS COMIDAS DEL JUEVES:
//   Desayuno / Comida / Merienda del jueves -> BLOQUE A (4 dias: Lun,Mar,Mie,Jue)
//   Cena del jueves                          -> BLOQUE B (arranca ahi, no el viernes)
// Por eso Batch B "empieza en la cena del jueves" (frase del propio catalogo
// original) y por eso jueves pertenece a los dos bloques a la vez: sus tres
// primeras comidas son de A, su cena ya es de B. B tiene igualmente 4 comidas
// (cena jue + vie + sab + dom) y A tiene 3 cenas + 4 del resto.
export function expandWeek(w){
  const rep4 = k => Array(4).fill(w[k])   // Lun,Mar,Mie,Jue
  const rep3 = k => Array(3).fill(w[k])   // Vie,Sab,Dom
  const cenaA3 = k => Array(3).fill(w[k]) // Lun,Mar,Mie (cena)
  const cenaB4 = k => Array(4).fill(w[k]) // Jue,Vie,Sab,Dom (cena)
  return {
    ...w,
    D:  w.DA === 'ROTA' ? [...w.DrotA, ...w.DrotB] : [...rep4('DA'), ...rep3('DB')],
    DM: [...rep4('DMA'), ...rep3('DMB')],
    C:  [...rep4('CA'), ...rep3('CB')],
    M:  [...rep4('MA'), ...rep3('MB')],
    N:  [...cenaA3('NA'), ...cenaB4('NB')],
  }
}
