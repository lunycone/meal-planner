import { DAYS, JULIO, MARIA, agg } from './gen-core.mjs'
import { WEEKS } from './weeks.mjs'
import { day, warns, CAP, SOL_MIN, e, r } from './html-core.mjs'
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
.flags{margin-top:12px;font-size:12px}
.flag{display:inline-block;background:#fdf6e3;border:1px solid #e8d9a8;color:var(--warn);border-radius:5px;padding:2px 8px;margin:0 6px 6px 0}
.flag.bad{background:#fdeeec;border-color:#efc4bf;color:var(--bad)}
.ok{color:var(--j);font-weight:600;font-size:12px}
.foot{margin-top:10px;padding-top:9px;border-top:1px solid var(--line);font-size:12px;color:var(--mut)}
.kpi{font-variant-numeric:tabular-nums}
.tag{font-size:10px;padding:1px 5px;border-radius:4px;background:#eee;color:var(--mut);margin-left:4px}
.tag.gos{background:#efe6f7;color:#6b4a8a}.tag.fr{background:#e6f0f7;color:#3a6b8a}
.tag.ins{background:#f7ece6;color:#8a5a3a}.tag.k1{background:#e8f5e9;color:#2e7d32}
@media print{body{background:#fff}.wrap{padding:0}.sheet{border:0;padding:8px 0}.noprint{display:none}}
button{font:inherit;padding:8px 16px;border:1px solid var(--line);background:#fff;border-radius:7px;cursor:pointer}
`

function tags(x){
  let t=''
  if(x.gos) t+='<span class="tag gos">GOS</span>'
  if(x.fruct) t+='<span class="tag fr">fructanos</span>'
  if(x.insol) t+='<span class="tag ins">insoluble</span>'
  if(x.k1) t+='<span class="tag k1">K1</span>'
  return t
}

function sheet(w){
  const j=DAYS.map((_,i)=>day(w,i,JULIO)), m=DAYS.map((_,i)=>day(w,i,MARIA))
  const jc=j.reduce((s,d)=>s+d.cost,0), mc=m.reduce((s,d)=>s+d.cost,0)
  const ws=warns(w,j)
  const row=(lab,pick)=>`<tr><td class="rowlab">${lab}</td>`+
    DAYS.map((_,i)=>{const c=pick(i);return `<td><div class="dish">${e(c.name)}${tags(c)}</div><div class="macro">${c.macro}</div></td>`}).join('')+'</tr>'

  const D=row('🍳 Desayuno',i=>{const a=agg(w.D[i]);return{...a,macro:`${r(a.kcal)} kcal · ${r(a.prot)} g prot · ${a.fat.toFixed(0)} g grasa`}})
  const C=row('🍽️ Comida',i=>{const a=j[i].C,b=m[i].C;return{...a,macro:`<span class="sw j"></span>${a.grams??'—'} g ${a.ingName??''} · ${r(a.kcal)} kcal<br><span class="sw m"></span>${b.grams??'—'} g · ${r(b.kcal)} kcal`}})
  const M=row('🥤 Merienda',i=>{const a=agg(w.M[i]);return{...a,macro:`${r(a.kcal)} kcal · ${a.fibSol.toFixed(1)} g fibra soluble`}})
  const N=row('🌙 Cena',i=>{const a=agg(w.N[i]);return{...a,macro:`${r(a.kcal)} kcal · ${r(a.prot)} g prot`}})
  const T=`<tr class="tot"><td class="rowlab">Total día</td>`+DAYS.map((_,i)=>{
    const a=j[i],b=m[i]
    const pf=a.prot>CAP?` style="color:var(--bad);font-weight:700"`:''
    const sf=a.fibSol<SOL_MIN?` style="color:var(--warn);font-weight:700"`:''
    return `<td class="kpi"><div><span class="sw j"></span>${r(a.kcal)} kcal · <span${pf}>${r(a.prot)} g</span> · <span${sf}>${a.fibSol.toFixed(1)} g sol</span> · $${a.cost.toFixed(2)}</div>`+
           `<div><span class="sw m"></span>${r(b.kcal)} kcal · ${r(b.prot)} g · $${b.cost.toFixed(2)}</div></td>`
  }).join('')+'</tr>'

  const flags = ws.length
    ? `<div class="flags">${ws.map(x=>`<span class="flag${w.extrema?' bad':''}">${e(x)}</span>`).join('')}</div>`
    : `<div class="flags"><span class="ok">✓ Sin avisos: cadencia, proteína, fibra soluble y desayuno dentro de límites.</span></div>`

  return `<section class="sheet">
    <div class="eyebrow">Semana modelo ${w.n} de ${WEEKS.length}${w.extrema?' · ⚠ SOLO REFERENCIA':''}</div>
    <div class="title">${e(w.title)}</div>
    <div class="note">${e(w.note)}</div>
    <table><thead><tr><th class="rowlab">&nbsp;</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr></thead>
    <tbody>${D}${C}${M}${N}${T}</tbody></table>
    ${flags}
    <div class="foot">Coste semana — <span class="sw j"></span>Julio $${jc.toFixed(2)} · <span class="sw m"></span>María $${mc.toFixed(2)} · <b>Total $${(jc+mc).toFixed(2)}</b>. La comida escala su base por persona; desayuno, merienda y cena son iguales para los dos.</div>
  </section>`
}
export { sheet, CSS }
