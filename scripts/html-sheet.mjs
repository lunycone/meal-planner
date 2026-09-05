import { DAYS, JULIO, MARIA, agg } from './gen-core.mjs'
import { day, CAP, SOL_MIN, e, r } from './html-core.mjs'
import { writeFileSync } from 'fs'

const CSS = `
:root{--ink:#1a1a1a;--mut:#6b6b6b;--line:#dcd8d0;--bg:#faf8f5;--j:#2e7d32;--m:#c2185b;--warn:#b0871f;--bad:#b8453a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:32px 20px 60px}
h1{font-size:26px;margin:0 0 6px;letter-spacing:-.4px}
.lede{color:var(--mut);max-width:70ch;margin:0 0 24px}
.sheet{background:#fff;border:1px solid var(--line);border-radius:10px;padding:20px;margin:0 0 22px;page-break-after:always}
.eyebrow{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--mut)}
.title{font-size:19px;font-weight:700;margin:2px 0 4px}
.note{color:var(--mut);font-size:13px;max-width:95ch;margin-bottom:12px}
table{border-collapse:collapse;width:100%;font-size:12px;table-layout:fixed}
th,td{border:1px solid var(--line);padding:6px 7px;vertical-align:top;text-align:left}
th{background:#f3f0eb;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)}
.rowlab{background:#f8f6f2;font-weight:600;width:104px;font-size:11px}
.dish{font-weight:600;line-height:1.3}
.macro{color:var(--mut);font-size:11px;margin-top:2px}
.tot{background:#f8f6f2;font-size:11px}
.sw{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px}
.sw.j{background:var(--j)}.sw.m{background:var(--m)}
.foot{margin-top:10px;padding-top:9px;border-top:1px solid var(--line);font-size:12px;color:var(--mut)}
.kpi{font-variant-numeric:tabular-nums}
/* 6 sep 2026 -- papel real del usuario: Legal (8.5x14in / 216x356mm), no
   Folio como se penso al principio -- "legal" es una palabra clave de
   tamaño de pagina estandar en CSS, se puede pedir directamente.
   Margen mas justo (6mm) y tipografia/relleno mas compactos SOLO en
   impresion -- con el tamaño de antes, cada semana se quedaba un pelo mas
   alta que una pagina y la ultima linea (el recordatorio de perejil) se
   iba sola a una pagina nueva, casi en blanco, una por cada semana. */
@page{size:legal landscape;margin:6mm}
@media print{
  body{background:#fff;font-size:12px}
  .wrap{padding:0}
  .sheet{border:0;padding:4px 0;margin:0}
  .noprint{display:none}
  table{font-size:10.5px}
  th,td{padding:4px 5px}
  .macro{font-size:9.5px}
  .foot{margin-top:5px;padding-top:5px;font-size:10px}
}
button{font:inherit;padding:8px 16px;border:1px solid var(--line);background:#fff;border-radius:7px;cursor:pointer}
`

// 6 sep 2026 -- ${grams}g o ${factor} nunca coinciden los dos: si hay base
// escalable y falta kcal, grams trae el numero (el caso normal). Si el dia
// sobra kcal, el motor reduce el PLATO ENTERO en proporcion en vez de solo
// el almidon (WHOLE_DISH_FLOOR, nunca por debajo del 55%) -- grams se queda
// null y solo hay factor. Antes esto se imprimia como "— g", que no dice
// nada; ahora dice "ración al X%". Sin ninguno de los dos (plato sin base
// escalable, o ya en su punto exacto): "ración normal".
function macroBase(a){
  if (a.grams != null) return `${a.grams} g ${a.ingName ?? ''}`
  if (a.factor != null) return `ración al ${Math.round(a.factor*100)}%`
  return 'ración normal'
}

function sheet(w, total=11){
  const j=DAYS.map((_,i)=>day(w,i,JULIO)), m=DAYS.map((_,i)=>day(w,i,MARIA))
  const jc=j.reduce((s,d)=>s+d.cost,0), mc=m.reduce((s,d)=>s+d.cost,0)
  const row=(lab,pick)=>`<tr><td class="rowlab">${lab}</td>`+
    DAYS.map((_,i)=>{const c=pick(i);return `<td><div class="dish">${e(c.name)}</div><div class="macro">${c.macro}</div></td>`}).join('')+'</tr>'

  // El desayuno vuelve a ser DOS filas separadas, con sus dos platos reales
  // (D = tuyo, DM = de Maria) — no una sola fila con el mismo plato repetido
  // para ambos, que fue el error del 3 sep.
  const D=row('🍳 Desayuno · Julio',i=>{const a=agg(w.D[i]);return{...a,macro:`${r(a.kcal)} kcal · ${r(a.prot)} g prot · ${a.fat.toFixed(0)} g grasa`}})
  const DM=row('🍳 Desayuno · María',i=>{const a=agg(w.DM[i]);return{...a,macro:`${r(a.kcal)} kcal · ${r(a.prot)} g prot`}})
  const C=row('🍽️ Comida',i=>{const a=j[i].C,b=m[i].C;return{...a,macro:`<span class="sw j"></span>${macroBase(a)} · ${r(a.kcal)} kcal<br><span class="sw m"></span>${macroBase(b)} · ${r(b.kcal)} kcal`}})
  // Maria no toma merienda lunes ni miercoles (Paso 4, 5 sep 2026): la fila
  // deja constancia de que ese dia es solo para Julio.
  // Maria lleva un batido proteico para llevar (sin cocinar) lunes/miercoles
  // en vez del batido casero de Julio -- ver m-proteina-portatil, 6 sep 2026.
  const NO_MERIENDA_MARIA = [0,2]
  const M=row('🥤 Merienda',i=>{
    const a=agg(w.M[i])
    if (!NO_MERIENDA_MARIA.includes(i)) return {...a, macro:`${r(a.kcal)} kcal · igual los dos`}
    const b=agg('m-proteina-portatil')
    return{...a, macro:`<span class="sw j"></span>${r(a.kcal)} kcal<br><span class="sw m"></span>${e(b.name)} · ${r(b.kcal)} kcal (para llevar)`}
  })
  // 6 sep 2026 -- N usaba agg(w.N[i]) (el plato SIN escalar) mientras que el
  // Total del dia de mas abajo ya sumaba el cena REAL (j[i].N/m[i].N, que se
  // reduce entero cuando sobra kcal) -- los dos numeros podian no cuadrar.
  // Ahora N usa el mismo dato real que el total, con el mismo formato que
  // Comida (grams/factor/normal) por si tambien viene reducida.
  const N=row('🌙 Cena',i=>{const a=j[i].N,b=m[i].N;return{...a,macro:`<span class="sw j"></span>${macroBase(a)} · ${r(a.kcal)} kcal<br><span class="sw m"></span>${macroBase(b)} · ${r(b.kcal)} kcal`}})
  const T=`<tr class="tot"><td class="rowlab">Total día</td>`+DAYS.map((_,i)=>{
    const a=j[i],b=m[i]
    const pf=a.prot>CAP?` style="color:var(--bad);font-weight:700"`:''
    const sf=a.fibSol<SOL_MIN?` style="color:var(--warn);font-weight:700"`:''
    return `<td class="kpi"><div><span class="sw j"></span>${r(a.kcal)} kcal · <span${pf}>${r(a.prot)} g</span> · <span${sf}>${a.fibSol.toFixed(1)} g sol</span> · $${a.cost.toFixed(2)}</div>`+
           `<div><span class="sw m"></span>${r(b.kcal)} kcal · ${r(b.prot)} g · $${b.cost.toFixed(2)}</div></td>`
  }).join('')+'</tr>'

  return `<section class="sheet">
    <div class="eyebrow">Semana modelo ${w.n} de ${total}${w.extrema?' · ⚠ SOLO REFERENCIA':''}</div>
    <div class="title">${e(w.title)}</div>
    <table><thead><tr><th class="rowlab">&nbsp;</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr></thead>
    <tbody>${D}${DM}${C}${M}${N}${T}</tbody></table>
    <div class="foot">Coste semana — <span class="sw j"></span>Julio $${jc.toFixed(2)} · <span class="sw m"></span>María $${mc.toFixed(2)} · <b>Total $${(jc+mc).toFixed(2)}</b> · <span style="opacity:.75">🌿 perejil 10g</span></div>
  </section>`
}
export { sheet, CSS }
