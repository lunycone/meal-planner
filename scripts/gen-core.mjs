// Generador de semanas modelo — calcula TODO desde dishes.js/ingredients.js.
// El HTML anterior tenia los numeros escritos a mano y no coincidian con el
// motor (Batido clasico: 751 en el PDF, 934 real). Aqui no hay numeros a mano.
import { ING } from '../src/data/ingredients.js'
import { DISHES } from '../src/data/dishes.js'
import { comboAgg, comboFibSol, dishGlycemicLoad, dishHasGOS,
         dishHasInsolubleFiber, dishHasAllium } from '../src/engine/calc.js'

export const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

// Kcal por dia. Confirmadas identicas en las 11 semanas del documento
// original del usuario -> derivadas de su calendario real de entrenamiento:
// Martes = Voley de Maria (su sesion mas larga) -> pico de Maria (2900).
// Jueves y Sabado = Natacion de Julio -> pico de Julio (3300).
// Se dejan como constante documentada, no adivinadas.
export const JULIO = { name:'Julio', weightKg:64, protCapGkg:2.23,
  kcal:[3150,3150,3100,3300,3000,3300,3000] }
export const MARIA = { name:'María',
  kcal:[2500,2900,2500,2750,2500,2750,2500] }

const SCALABLE = ['patata','arroz','pasta','maiz','avena','harina','buckwheat',
  'garbanzos','black-beans','lentejas-verdes','lentejas-rojas','alubias-blancas',
  'alubias-rojas','romano-beans','cranberry','pan-masa-madre']

export function agg(key){
  const d = DISHES[key]
  if(!d) throw new Error('plato inexistente: '+key)
  const a = comboAgg(d, ING)
  return { key, name:d.name, cost:a.cost, kcal:a.kcal, prot:a.prot,
    fat:a.fat, fibSol:comboFibSol(d,ING), gl:dishGlycemicLoad(d,ING),
    gos:dishHasGOS(d), insol:dishHasInsolubleFiber(d), fruct:dishHasAllium(d),
    k1: d.items.some(i=>i.k==='perejil-fresco') }
}

export function scaleLunch(lunchKey, fixedKcal, targetKcal){
  const d = DISHES[lunchKey]
  const base = agg(lunchKey)
  const item = d.items.find(i => SCALABLE.includes(i.k) && i.p.grams != null)
  if(!item) return { ...base, grams:null, capped:false }
  const ing = ING[item.k]
  const kcalG = ing.kc/100, defG = item.p.grams
  const need = targetKcal - (fixedKcal + base.kcal - defG*kcalG)
  const cookRatio = ({arroz:2.8, pasta:2.5, garbanzos:2.5, 'black-beans':2.5,
    'lentejas-verdes':2.0, 'lentejas-rojas':2.5, 'alubias-blancas':2.5,
    'alubias-rojas':2.5, 'romano-beans':2.5, cranberry:2.5})[item.k] ?? 1
  const max = Math.max(defG, Math.min(defG*4, 300/cookRatio))
  const g = Math.round(Math.max(Math.round(defG*0.5), Math.min(max, need/kcalG)))
  const dg = g - defG
  return { ...base, grams:g, ingKey:item.k, ingName:ing.name, defG,
    capped: need/kcalG > max,
    cost: base.cost + (ing.per100||0)*dg/100,
    kcal: base.kcal + dg*kcalG,
    prot: base.prot + (ing.prot||0)*dg/100,
    fat:  base.fat  + (ing.fat||0)*dg/100,
    fibSol: base.fibSol + (ing.fibSol ?? (ing.fib||0)*0.25)*dg/100 }
}
