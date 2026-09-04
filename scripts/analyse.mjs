import { agg, scaleLunch, DAYS, JULIO, MARIA } from './gen-core.mjs'
import { WEEKS } from './weeks.mjs'
import { writeFileSync } from 'fs'

const PROT_CAP = Math.round(JULIO.weightKg * JULIO.protCapGkg)  // 143 g
const SOL_MIN = 8, DES_KCAL_MIN = 400, DES_FAT_MAX = 15, CADENCE = 4

function buildDay(w, i, person){
  const D = agg(w.D[i]), M = agg(w.M[i]), N = agg(w.N[i])
  const fixed = D.kcal + M.kcal + N.kcal
  const C = scaleLunch(w.C[i], fixed, person.kcal[i])
  const sum = k => D[k]+C[k]+M[k]+N[k]
  return { D, C, M, N,
    kcal: sum('kcal'), prot: sum('prot'), fat: sum('fat'),
    cost: sum('cost'), fibSol: sum('fibSol'), target: person.kcal[i] }
}

function analyse(w){
  const j = DAYS.map((_,i)=>buildDay(w,i,JULIO))
  const m = DAYS.map((_,i)=>buildDay(w,i,MARIA))
  const slot = (k,f) => w[k].filter(x=>agg(x)[f]).length
  return { j, m,
    jCost: j.reduce((s,d)=>s+d.cost,0), mCost: m.reduce((s,d)=>s+d.cost,0),
    warn: [
      ...['D','C','M','N'].flatMap(k => {
        const o=[]
        if(slot(k,'gos')>CADENCE) o.push(`GOS ${slot(k,'gos')}/7 en ${k}`)
        if(slot(k,'fruct')>CADENCE) o.push(`fructanos ${slot(k,'fruct')}/7 en ${k}`)
        return o
      }),
      ...(j.some(d=>d.prot>PROT_CAP) ? [`proteina > ${PROT_CAP} g (max ${Math.round(Math.max(...j.map(d=>d.prot)))})`] : []),
      ...(j.some(d=>d.fibSol<SOL_MIN) ? [`fibra soluble < ${SOL_MIN} g algun dia (min ${j.reduce((a,d)=>Math.min(a,d.fibSol),99).toFixed(1)})`] : []),
      ...(agg(w.D[0]).kcal<DES_KCAL_MIN ? [`desayuno ${Math.round(agg(w.D[0]).kcal)} kcal < ${DES_KCAL_MIN}`] : []),
      ...(agg(w.D[0]).fat>DES_FAT_MAX ? [`desayuno ${agg(w.D[0]).fat.toFixed(0)} g grasa > ${DES_FAT_MAX}`] : []),
    ] }
}

const R = WEEKS.map(w => ({ w, a: analyse(w) }))
console.log('SEM  coste J  coste M   total   protJ  solJ  avisos')
for(const {w,a} of R){
  const maxP = Math.round(Math.max(...a.j.map(d=>d.prot)))
  const minS = a.j.reduce((x,d)=>Math.min(x,d.fibSol),99)
  console.log(
    String(w.n).padStart(3),
    ('$'+a.jCost.toFixed(2)).padStart(8),
    ('$'+a.mCost.toFixed(2)).padStart(8),
    ('$'+(a.jCost+a.mCost).toFixed(2)).padStart(8),
    String(maxP).padStart(6),
    minS.toFixed(1).padStart(5),
    ' ', a.warn.join(' · ') || 'ok')
}
writeFileSync(new URL('./_result.json', import.meta.url),
  JSON.stringify(R.map(({w,a})=>({n:w.n,jCost:a.jCost,mCost:a.mCost})),null,1))
export { R, PROT_CAP }
