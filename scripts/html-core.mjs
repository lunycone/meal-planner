import { agg, scaleLunch, DAYS, JULIO, MARIA } from './gen-core.mjs'
import { WEEKS } from './weeks.mjs'
import { writeFileSync } from 'fs'

const CAP = Math.round(JULIO.weightKg * JULIO.protCapGkg)
const SOL_MIN = 8, DES_KCAL_MIN = 400, DES_FAT_MAX = 15, CAD = 4
const e = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
const r = n => Math.round(n)

function day(w,i,p){
  // BUG 3 sep 2026: usaba w.D[i] para las dos personas. El desayuno de María
  // es propio (w.DM) y antes de este fix sus totales de kcal/coste estaban
  // calculados sobre TU desayuno, no el suyo.
  const desKey = p===JULIO ? w.D[i] : w.DM[i]
  const D=agg(desKey), M=agg(w.M[i]), N=agg(w.N[i])
  const C=scaleLunch(w.C[i], D.kcal+M.kcal+N.kcal, p.kcal[i])
  const s=k=>D[k]+C[k]+M[k]+N[k]
  return {D,C,M,N,kcal:s('kcal'),prot:s('prot'),fat:s('fat'),cost:s('cost'),
          fibSol:s('fibSol'),target:p.kcal[i]}
}
function slotCount(w,k,f){ return w[k].filter(x=>agg(x)[f]).length }

function warns(w,j){
  const o=[]
  for(const k of ['D','DM','C','M','N']){
    const g=slotCount(w,k,'gos'), f=slotCount(w,k,'fruct')
    const nm={D:'desayuno Julio',DM:'desayuno María',C:'comida',M:'merienda',N:'cena'}[k]
    if(g>CAD) o.push(`Legumbre en ${nm} ${g}/7 (max ${CAD})`)
    if(f>CAD) o.push(`Cebolla/ajo/puerro en ${nm} ${f}/7 (max ${CAD})`)
  }
  const mp=Math.max(...j.map(d=>d.prot))
  if(mp>CAP) o.push(`Proteína hasta ${r(mp)} g (techo ${CAP} g a 64 kg)`)
  const ms=Math.min(...j.map(d=>d.fibSol))
  if(ms<SOL_MIN) o.push(`Fibra soluble baja a ${ms.toFixed(1)} g (suelo ${SOL_MIN})`)
  // El desayuno ahora rota (hasta 7 platos distintos) y es propio de cada
  // persona: hay que auditar CADA dia de D y de DM, no solo D[0] como antes
  // -- eso escondia infracciones en los 6 dias no muestreados.
  for(const [who,arr] of [['Julio',w.D],['María',w.DM]]){
    const days = [...new Set(arr)].map(agg)
    for(const d of days){
      if(d.kcal<DES_KCAL_MIN) o.push(`Desayuno ${who} "${d.name}" ${r(d.kcal)} kcal (suelo ${DES_KCAL_MIN})`)
      if(d.fat>DES_FAT_MAX) o.push(`Desayuno ${who} "${d.name}" ${d.fat.toFixed(0)} g grasa (techo ${DES_FAT_MAX})`)
    }
  }
  return o
}
export { day, warns, slotCount, CAP, SOL_MIN, DES_KCAL_MIN, DES_FAT_MAX, e, r }
