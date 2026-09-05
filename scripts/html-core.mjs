import { agg, scaleLunch, scaleWholeDish, DAYS, JULIO, MARIA } from './gen-core.mjs'
import { WEEKS } from './weeks.mjs'
import { validateBlocks } from './blocks.mjs'
import { DISHES } from '../src/data/dishes.js'
import { writeFileSync } from 'fs'

const CAP = Math.round(JULIO.weightKg * JULIO.protCapGkg)
const SOL_MIN = 8, DES_KCAL_MIN = 400, DES_FAT_MAX = 15, CAD = 4
const e = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
const r = n => Math.round(n)

const AOVE_KCAL_ML = 9, AOVE_FAT_ML = 1, AOVE_CAP_ML = 30

// Suma AOVE extra a un agregado ya calculado (kcal/fat suben, coste no --
// el AOVE ya esta comprado y no se cuenta en precio, ver ingredients.js).
// Solo se usa para CERRAR HUECOS (need>0); nunca resta por debajo de lo que
// la receta ya llevaba.
function addAove(agg, extraMl){
  if (extraMl <= 0) return agg
  return { ...agg, kcal: agg.kcal + extraMl*AOVE_KCAL_ML, fat: agg.fat + extraMl*AOVE_FAT_ML }
}

const WHOLE_DISH_FLOOR = 0.55 // nunca menos del 55% del plato -- sigue siendo el mismo plato, no un bocado
const AOVE_CAP_ML_NO_MERIENDA = 40 // dias sin merienda: algo mas que el tope normal (30ml), pero sin llegar a los 60ml que dejaban platos con ~90g de grasa. El usuario prefiere quedarse corto de kcal antes que un plato demasiado aceitoso.
// Techo de grasa DIARIA para Maria en sus dias sin merienda (6 sep 2026).
// 100g/dia ~ 36% de sus 2500 kcal ese dia -- borde alto del rango AMDR
// (20-35%) pero no fuera, y realista dado que el desayuno solo ya consume
// 24-43g. El techo actua ANTES del AOVE: si D+C+N ya suman 100g de grasa
// sin anadir nada, no se anade ni un ml -- se acepta el hueco calorico en
// vez de seguir subiendo grasa.
const DAILY_FAT_CAP_MARIA_NO_MERIENDA = 100
// Maria no toma merienda lunes ni miercoles (trabaja esos dias, 5 sep 2026,
// Paso 4). Indices sobre DAYS = ['Lunes','Martes','Miércoles',...] -> 0 y 2.
const MARIA_NO_MERIENDA = [0, 2]

function day(w,i,p){
  // BUG 3 sep 2026: usaba w.D[i] para las dos personas. El desayuno de María
  // es propio (w.DM) y antes de este fix sus totales de kcal/coste estaban
  // calculados sobre TU desayuno, no el suyo.
  const desKey = p===JULIO ? w.D[i] : w.DM[i]
  const D=agg(desKey)
  const noMerienda = p===MARIA && MARIA_NO_MERIENDA.includes(i)
  // 6 sep 2026: el "cero merienda" (kcal:0) se sustituye por un batido
  // proteico para llevar (sin cocinar, apto para el trabajo) -- cierra
  // ~320 kcal limpias en vez de pedirle a comida+cena que compensen los
  // ~800 kcal enteros del batido casero, que era lo que disparaba la grasa.
  const M = noMerienda ? agg('m-proteina-portatil') : agg(w.M[i])
  const aoveCap = noMerienda ? AOVE_CAP_ML_NO_MERIENDA : AOVE_CAP_ML
  const target = p.kcal[i]
  const Craw = agg(w.C[i]), Nraw = agg(w.N[i])
  const fixed = D.kcal + M.kcal
  // El desayuno y la merienda NUNCA se tocan (avena fija en 100g). El plato
  // de comida y de cena es SIEMPRE el mismo para los dos -- lo unico que
  // cambia es la CANTIDAD, nunca la receta (5 sep 2026, correccion del
  // usuario: la idea de darle a Maria un plato distinto quedo descartada).
  //
  // Caso DEFICIT (el dia pide mas de lo que el plato de base da): se sube
  // solo el almidon (scaleLunch, tope de siempre: 107g arroz seco/300g
  // patata, por la glucosa) y si aun falta, un chorro de AOVE (9 kcal/ml,
  // volumen minimo, cero impacto glucemico, tope 30ml extra por plato).
  //
  // Caso SOBRANTE (el plato ya pesa mas de lo que el dia necesita incluso
  // con el almidon al minimo): NO se sube nada -- se reduce el plato ENTERO
  // en proporcion (menos carne, menos queso, menos aceite, no solo el
  // arroz), primero en la CENA y solo si no basta tambien en la comida.
  // Nunca por debajo de WHOLE_DISH_FLOOR (55% del plato: sigue siendo
  // reconociblemente el mismo plato).
  let C, N
  if (target - fixed - Craw.kcal - Nraw.kcal >= 0) {
    const C1 = scaleLunch(w.C[i], fixed+Nraw.kcal, target)
    N = scaleLunch(w.N[i], fixed+C1.kcal, target)
    C = scaleLunch(w.C[i], fixed+N.kcal, target)
    let need = target - (fixed + C.kcal + N.kcal)
    if (need > 0) {
      // Techo de grasa DIARIA (solo dias sin merienda): un presupuesto total
      // de ml compartido entre comida y cena, consumido en orden. Fuera de
      // esos dias no hay techo (Infinity) y cada plato mantiene su propio
      // tope independiente de siempre (aoveCap, 30ml) -- BUG corregido 6 sep
      // 2026: la primera version del techo restaba addC del tope de N por
      // error, dejando el mismo tope de 30ml repartido entre los dos platos
      // en TODOS los dias (incluidos los de Julio en semanas sin tocar),
      // lo que creaba deficits nuevos de cientos de kcal que no existian.
      let fatBudgetMl = noMerienda
        ? Math.max(0, DAILY_FAT_CAP_MARIA_NO_MERIENDA - (D.fat+C.fat+M.fat+N.fat)) / AOVE_FAT_ML
        : Infinity

      const addC = Math.min(aoveCap, fatBudgetMl, need/AOVE_KCAL_ML)
      C = addAove(C, addC)
      need -= addC*AOVE_KCAL_ML
      if (noMerienda) fatBudgetMl = Math.max(0, fatBudgetMl - addC)

      const addN = Math.min(aoveCap, fatBudgetMl, Math.max(0,need)/AOVE_KCAL_ML)
      N = addAove(N, addN)
    }
  } else {
    const wantMealsTotal = target - fixed // lo que comida+cena deben sumar juntos
    let factorN = (wantMealsTotal - Craw.kcal) / Nraw.kcal
    factorN = Math.max(WHOLE_DISH_FLOOR, Math.min(1, factorN))
    N = factorN < 1 ? scaleWholeDish(w.N[i], factorN) : Nraw
    const residual = wantMealsTotal - Craw.kcal - N.kcal
    let factorC = (Craw.kcal + residual) / Craw.kcal
    factorC = Math.max(WHOLE_DISH_FLOOR, Math.min(1, factorC))
    C = factorC < 1 ? scaleWholeDish(w.C[i], factorC) : Craw
  }

  const s=k=>D[k]+C[k]+M[k]+N[k]
  return {D,C,M,N,kcal:s('kcal'),prot:s('prot'),fat:s('fat'),cost:s('cost'),
          fibSol:s('fibSol'),target}
}
function slotCount(w,k,f){ return w[k].filter(x=>agg(x)[f]).length }

function warns(w,j){
  const o=[]
  // NUEVO 4 sep 2026: validacion de la regla de bloques. w aqui ya trae los
  // campos originales *A/*B (no expandidos), asi que validateBlocks puede
  // comprobar directamente que el bloque B cambia de especie respecto al A.
  o.push(...validateBlocks(w, DISHES))
  // 6 sep 2026 -- CORREGIDO: todo este bloque (cadencia GOS/fructano, techo
  // de grasa/kcal de desayuno, techo de proteina, suelo de fibra soluble) es
  // el protocolo digestivo de JULIO (motivo intestinal) -- confirmado por el
  // usuario, NO aplica a Maria (ella tiene lo suyo aparte, PCOS/carga
  // glicemica). Antes 'DM' (desayuno de Maria) entraba en la cadencia y el
  // bucle de kcal/grasa comprobaba a los dos -- avisos falsos del tipo
  // "Desayuno Maria... 43g grasa" que no significan nada para ella.
  for(const k of ['D','C','M','N']){
    const g=slotCount(w,k,'gos'), f=slotCount(w,k,'fruct')
    const nm={D:'desayuno Julio',C:'comida',M:'merienda',N:'cena'}[k]
    if(g>CAD) o.push(`Legumbre en ${nm} ${g}/7 (max ${CAD})`)
    if(f>CAD) o.push(`Cebolla/ajo/puerro en ${nm} ${f}/7 (max ${CAD})`)
  }
  const mp=Math.max(...j.map(d=>d.prot))
  if(mp>CAP) o.push(`Proteína hasta ${r(mp)} g (techo ${CAP} g a 64 kg)`)
  const ms=Math.min(...j.map(d=>d.fibSol))
  if(ms<SOL_MIN) o.push(`Fibra soluble baja a ${ms.toFixed(1)} g (suelo ${SOL_MIN})`)
  // Desayuno rota (hasta 7 platos distintos): auditar CADA dia de D (Julio),
  // no solo D[0] -- eso escondia infracciones en los 6 dias no muestreados.
  const desDays = [...new Set(w.D)].map(agg)
  for(const d of desDays){
    if(d.kcal<DES_KCAL_MIN) o.push(`Desayuno Julio "${d.name}" ${r(d.kcal)} kcal (suelo ${DES_KCAL_MIN})`)
    if(d.fat>DES_FAT_MAX) o.push(`Desayuno Julio "${d.name}" ${d.fat.toFixed(0)} g grasa (techo ${DES_FAT_MAX})`)
  }
  return o
}
export { day, warns, slotCount, CAP, SOL_MIN, DES_KCAL_MIN, DES_FAT_MAX, e, r }
