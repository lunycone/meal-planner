import { WEEKS } from './weeks.mjs'
import { sheet, CSS } from './html-sheet.mjs'
import { DAYS, JULIO } from './gen-core.mjs'
import { day, CAP, SOL_MIN } from './html-core.mjs'
import { writeFileSync } from 'fs'

const costs = WEEKS.map(w=>{
  const j=DAYS.map((_,i)=>day(w,i,JULIO))
  return { n:w.n, title:w.title, extrema:!!w.extrema,
    cost:j.reduce((s,d)=>s+d.cost,0),
    prot:Math.max(...j.map(d=>d.prot)),
    sol:Math.min(...j.map(d=>d.fibSol)) }
})
const rank=[...costs].filter(c=>!c.extrema).sort((a,b)=>a.cost-b.cost)

const idx = `<section class="sheet">
<div class="eyebrow">Índice</div><div class="title">Las once, ordenadas por coste (solo Julio)</div>
<div class="note">Todos los números salen del motor de <code>dishes.js</code>. El HTML anterior los tenía escritos a mano y no coincidían: decía 751 kcal para el Batido clásico cuando la receta real da 934.</div>
<table><thead><tr><th>#</th><th>Semana</th><th>Coste/sem</th><th>Proteína máx</th><th>Fibra soluble mín</th></tr></thead><tbody>
${rank.map(c=>`<tr><td>${c.n}</td><td class="dish">${c.title}</td><td class="kpi">$${c.cost.toFixed(2)}</td>
<td class="kpi"${c.prot>CAP?' style="color:var(--bad);font-weight:700"':''}>${Math.round(c.prot)} g</td>
<td class="kpi"${c.sol<SOL_MIN?' style="color:var(--warn);font-weight:700"':''}>${c.sol.toFixed(1)} g</td></tr>`).join('')}
<tr><td>11</td><td class="dish">⚠ Extrema — solo referencia</td><td class="kpi">$${costs.find(c=>c.extrema).cost.toFixed(2)}</td><td>—</td><td>—</td></tr>
</tbody></table>
<div class="foot">Techo de proteína ${CAP} g = 2,23 g/kg a 64 kg. Suelo de fibra soluble ${SOL_MIN} g/día.
Rojo y ámbar son avisos reales, no adornos: la semana sigue siendo utilizable, pero sabes qué estás aceptando.</div>
</section>`

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Semanas modelo — Julio &amp; María</title><style>${CSS}</style></head><body><div class="wrap">
<h1>Semanas modelo · Julio &amp; María</h1>
<p class="lede">Once semanas con las reglas digestivas aplicadas y auditadas por el propio motor.
Cada casilla se calcula desde las recetas reales; no hay ningún número escrito a mano.
Las etiquetas <span class="tag gos">GOS</span> <span class="tag fr">fructanos</span>
<span class="tag ins">insoluble</span> <span class="tag k1">K1</span> marcan el plato, y los avisos
del pie marcan la <em>semana</em> — que es donde estaban los fallos que no se veían plato a plato.</p>
<p class="noprint"><button onclick="window.print()">Imprimir / Guardar PDF</button></p>
${idx}
${WEEKS.map(sheet).join('\n')}
</div></body></html>`

const out = new URL('../../semanas-modelo-v2.html', import.meta.url)
writeFileSync(out, html)
console.log('escrito:', out.pathname)
console.log('\nRanking por coste (Julio):')
rank.forEach((c,i)=>console.log(` ${i+1}. S${c.n} $${c.cost.toFixed(2)}  ${c.title}`))
