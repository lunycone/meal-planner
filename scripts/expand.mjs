// Expande la definicion en bloques a los arrays de 7 dias que el resto del
// pipeline (html-core, html-sheet) ya sabe consumir.
//
// PATRON REAL (confirmado por el usuario, 4 sep 2026 -- descarta el intento
// anterior de "bloques consecutivos Lun-Jue / Jue-Dom", que estaba mal):
//   Lunes    -> B
//   Martes   -> A
//   Miercoles-> A
//   Jueves   -> A
//   Viernes  -> B
//   Sabado   -> B
//   Domingo  -> B
// A y B NO son bloques de dias consecutivos. A = Mar,Mie,Jue (3 dias
// seguidos). B = Vie,Sab,Dom,Lun (4 dias, cierra el fin de semana y abre la
// semana siguiente). Es el mismo patron para TODAS las franjas (desayuno,
// comida, merienda, cena) salvo que una franja declare 'ROTA'.
const PATTERN = ['B','A','A','A','B','B','B']  // Lun,Mar,Mie,Jue,Vie,Sab,Dom

export function expandWeek(w){
  const pick = k => PATTERN.map(block => w[block === 'A' ? k + 'A' : k + 'B'])
  // BUG corregido: la rama ROTA hacia [...DrotA, ...DrotB].slice(0,7), que
  // asigna los platos en orden fijo Lun->Dom SIN mirar PATTERN. Con
  // PATTERN = [B,A,A,A,B,B,B] eso desplazaba todo un dia: el lunes (que es
  // B) se llevaba el ultimo elemento de DrotA en vez del primero de DrotB.
  // Ahora ROTA consume DrotA y DrotB con su propio cursor por bloque, en el
  // mismo orden en que PATTERN los visita.
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
