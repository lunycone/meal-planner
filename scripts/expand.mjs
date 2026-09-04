// Expande la definicion en bloques (A=Lun-Jue, B=Vie-Dom) a los arrays de 7
// dias que el resto del pipeline (html-core, html-sheet) ya sabe consumir.
// Centraliza aqui la logica de "que significa un bloque" para que no vuelva
// a haber una reconstruccion de memoria que la rompa.
export function expandWeek(w){
  const rep4 = k => Array(4).fill(w[k])
  const rep3 = k => Array(3).fill(w[k])
  return {
    ...w,
    D:  w.DA === 'ROTA' ? [...w.DrotA, ...w.DrotB] : [...rep4('DA'), ...rep3('DB')],
    DM: [...rep4('DMA'), ...rep3('DMB')],
    C:  [...rep4('CA'), ...rep3('CB')],
    M:  [...rep4('MA'), ...rep3('MB')],
    N:  [...rep4('NA'), ...rep3('NB')],
  }
}

// La rotacion de S6/S7 declara 4 platos para A y 3 para B; si un dia repite
// alguno de los mismos, es intencional (venia asi del documento original,
// por escasez de desayunos "legales" bajo la regla de grasa<=15g).
