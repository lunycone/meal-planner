import { useState } from 'react'
import useStore from '../../store/useStore'
import { CAT_ORDER, CAT_LABELS } from '../../data/ingredients'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { storeColor } from '../../lib/stores'
import { DAY_KEYS, addDays, fmtMoney } from '../../lib/mealplan'
import useShoppingList, { CAT_PILL } from '../../lib/useShoppingList'

const DAY_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function Check({ on }) {
  return (
    <span className={`mp-check${on ? ' is-on' : ''}`} aria-hidden="true">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </span>
  )
}

// ─── Main shopping list ──────────────────────────────────────────────────────
export default function ShoppingListTab() {
  const [batchOffset, setBatchOffset] = useState(1)
  const [viewMode, setViewMode] = useState('batch') // 'batch' | 'semana'
  const [tab, setTab] = useState('buy')             // 'buy' | 'home'
  const [searchTerm, setSearchTerm] = useState('')
  // Por tienda por defecto: así la lista sale ya separada por supermercado
  const [sortBy, setSortByState] = useState(() => { try { return localStorage.getItem('mp-compra-sort') || 'store' } catch { return 'store' } })
  const setSortBy = v => { setSortByState(v); try { localStorage.setItem('mp-compra-sort', v) } catch {} }
  const [copied, setCopied] = useState(false)

  const { batchWindow, people, items, batidoAgg, checked, toggleChecked, setHome } = useShoppingList(batchOffset, viewMode)

  const q = searchTerm.trim().toLowerCase()
  const buy = items.filter(i => !i.home)
  const home = items.filter(i => i.home)
  const visible = (tab === 'buy' ? buy : home).filter(i => !q || i.name.toLowerCase().includes(q))
  // Tiendas de esta lista, de la que más gasto a la que menos; «Sin tienda» al final
  const storeTotals = {}
  buy.forEach(i => { const k = i.store ?? ''; storeTotals[k] = storeTotals[k] ?? { cost: 0, n: 0 }; storeTotals[k].cost += i.cost; storeTotals[k].n++ })
  const storeOrder = Object.keys(storeTotals).filter(Boolean).sort((a, b) => storeTotals[b].cost - storeTotals[a].cost).concat(storeTotals[''] ? [''] : [])
  const storeRank = k => { const r = storeOrder.indexOf(k ?? ''); return r === -1 ? 99 : r }
  const byCatOrder = (a, b) => (CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat)) || a.name.localeCompare(b.name)
  const sorted = [...visible].sort((a, b) =>
    sortBy === 'cost' ? b.cost - a.cost
    : sortBy === 'name' ? a.name.localeCompare(b.name)
    : sortBy === 'store' ? (storeRank(a.store) - storeRank(b.store)) || byCatOrder(a, b)
    : byCatOrder(a, b))

  const buyTotal = buy.reduce((s, i) => s + i.cost, 0)
  const done = buy.filter(i => checked.has(i.key))
  const doneCost = done.reduce((s, i) => s + i.cost, 0)
  const byCat = CAT_ORDER.map(c => ({ c, cost: buy.filter(i => i.cat === c).reduce((s, i) => s + i.cost, 0) })).filter(x => x.cost > 0.004)
  const maxCat = Math.max(0.01, ...byCat.map(x => x.cost))
  const catsPresent = CAT_ORDER.filter(c => buy.some(i => i.cat === c))
  const batchSunday = addDays(batchWindow.start, -1)
  const dayCols = batchWindow.windowDates.map(w => w.dayKey)

  function copyToClipboard() {
    let text = `Compra · ${viewMode === 'batch' ? 'batch' : 'semana'} ${batchWindow.rangeLabel}\n\n`
    const groupsForCopy = sortBy === 'store'
      ? storeOrder.map(k => [k || 'Sin tienda', buy.filter(i => (i.store ?? '') === k)])
      : CAT_ORDER.map(c => [CAT_LABELS[c] ?? c, buy.filter(i => i.cat === c)])
    groupsForCopy.forEach(([label, list]) => {
      if (!list.length) return
      text += `${label.toUpperCase()}\n`
      list.forEach(i => { text += `  ☐ ${i.name} — ${i.qty} (${fmtMoney(i.cost)})\n` })
      text += '\n'
    })
    text += `TOTAL: ${fmtMoney(buyTotal)}`
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }).catch(() => {})
  }

  let lastCat = null
  const gridCols = `26px minmax(0, 1.1fr) minmax(0, 1.2fr) repeat(${dayCols.length}, 34px) 70px 28px`

  return (
    <div className="compra">
      <div className="mp-page-head mp-rise">
        <div className="mp-page-title">
          <h1>Compra</h1>
          <span>{viewMode === 'batch' ? `batch del domingo ${batchSunday.getDate()} · lun ${batchWindow.start.getDate()} – vie ${batchWindow.end.getDate()}` : `semana ${batchWindow.rangeLabel}`}{people.length ? ` · ${people.map(p => p.name).join(' y ')}` : ''}</span>
        </div>
        <div className="mp-page-tools">
          <Segmented label="Lista" value={tab} onChange={setTab}
            options={[{ value: 'buy', label: `Por comprar · ${buy.length}` }, { value: 'home', label: `En casa · ${home.length}` }]} />
          <Segmented label="Periodo" value={viewMode} onChange={v => setViewMode(v)}
            options={[{ value: 'batch', label: 'Batch L–V' }, { value: 'semana', label: 'Semana L–D' }]} />
          <div className="mp-seg" style={{ gap: 0 }}>
            <button type="button" aria-label="Anterior" onClick={() => setBatchOffset(o => o - 1)} style={{ padding: '0 10px' }}><Icon name="left" size={12} stroke={2.6} /></button>
            <button type="button" onClick={() => setBatchOffset(1)} style={{ fontWeight: 600, color: 'var(--c-ink)' }} title="El próximo batch">Próximo</button>
            <button type="button" aria-label="Siguiente" onClick={() => setBatchOffset(o => o + 1)} style={{ padding: '0 10px' }}><Icon name="right" size={12} stroke={2.6} /></button>
          </div>
        </div>
      </div>

      <div className="compra-grid">
        <section className="compra-list mp-glass mp-rise" style={{ animationDelay: '80ms' }}>
          <div className="compra-tools">
            <label className="mp-search" style={{ flex: 1, maxWidth: 320 }}>
              <Icon name="search" size={14} stroke={2.4} />
              <span className="sr-only">Buscar ingrediente</span>
              <input placeholder="Buscar ingrediente…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </label>
            <Segmented label="Ordenar" value={sortBy} onChange={setSortBy}
              options={[{ value: 'store', label: 'Tienda' }, { value: 'category', label: 'Categoría' }, { value: 'cost', label: 'Precio' }, { value: 'name', label: 'A–Z' }]} />
            {tab === 'buy' && <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={copyToClipboard} disabled={!buy.length}><Icon name={copied ? 'check' : 'copy'} size={14} />{copied ? 'Copiada' : 'Copiar lista'}</button>}
          </div>

          {items.length === 0 && (
            <div className="mp-empty" style={{ padding: '60px 20px' }}>
              No hay platos planificados en estos días.<br />
              <button className="mp-btn mp-btn-dark" style={{ marginTop: 14 }} onClick={() => useStore.getState().openPlanner(batchOffset, 0)}><Icon name="cal" size={14} />Abrir en el Planificador</button>
            </div>
          )}

          {tab === 'buy' && sorted.length > 0 && (
            <>
              <div className="compra-head" style={{ gridTemplateColumns: gridCols }}>
                <span /><span>Producto</span><span>Compras</span>
                {dayCols.map(d => <span key={d} style={{ textAlign: 'center' }}>{DAY_LETTER[DAY_KEYS.indexOf(d)]}</span>)}
                <span style={{ textAlign: 'right' }}>Precio</span><span />
              </div>
              {sorted.map((i, n) => {
                const on = checked.has(i.key)
                const gk = sortBy === 'store' ? (i.store ?? '') : sortBy === 'category' ? i.cat : null
                const header = gk !== null && gk !== lastCat ? (lastCat = gk, true) : false
                const st = storeTotals[i.store ?? '']
                return (
                  <div key={i.key}>
                    {header && sortBy === 'category' && <div className="compra-cat">{CAT_LABELS[i.cat] ?? i.cat}</div>}
                    {header && sortBy === 'store' && (
                      <div className="compra-cat compra-store">
                        <span className="mp-dot" style={{ width: 10, height: 10, background: i.store ? storeColor(i.store) : 'rgba(110,80,50,0.35)' }} />
                        {i.store ?? 'Sin tienda'}
                        <span className="mp-muted mp-num" style={{ fontWeight: 500 }}>{st ? `${st.n} · ${fmtMoney(st.cost)}` : ''}</span>
                      </div>
                    )}
                    <div className={`compra-row mp-in${on ? ' is-done' : ''}`} style={{ gridTemplateColumns: gridCols, animationDelay: `${Math.min(n, 20) * 22}ms` }}>
                      <button type="button" className="compra-hit" aria-pressed={on} aria-label={`${on ? 'Desmarcar' : 'Marcar'} ${i.name}`} onClick={() => toggleChecked(i.key)} />
                      <Check on={on} />
                      <span className="compra-name" title={i.breakdown}>
                        <span>{i.name}</span>
                        {(i.brand || i.breakdown) && <small>{i.brand ? `${i.brand}${i.store ? ' · ' + i.store : ''}` : i.breakdown}</small>}
                      </span>
                      <span className="compra-qty mp-num">{i.qty}</span>
                      {dayCols.map(d => (
                        <span key={d} style={{ display: 'flex', justifyContent: 'center' }}>
                          <span className="compra-pill" style={i.usedDays.has(d) ? { background: CAT_PILL[i.cat] ?? CAT_PILL.otro, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' } : undefined} />
                        </span>
                      ))}
                      <span className="mp-num" style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 600 }}>{fmtMoney(i.cost)}</span>
                      <button type="button" className="compra-mini" title="Ya lo tengo en casa" onClick={() => setHome(i.key, true)}><Icon name="home" size={13} /></button>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {tab === 'home' && (
            <>
              <p className="mp-muted" style={{ margin: '4px 0 12px', fontSize: 13, lineHeight: 1.5 }}>
                Especias, aceite y lo que ya tienes. No entra en el total; si se acaba, pásalo a «Falta» y vuelve a la lista.
              </p>
              <div className="compra-home">
                {sorted.map((i, n) => (
                  <div key={i.key} className="compra-home-row mp-in" style={{ animationDelay: `${Math.min(n, 20) * 22}ms` }}>
                    <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{i.name}</span>
                      <span className="mp-muted mp-num" style={{ fontSize: 12 }}>{i.qty} esta {viewMode === 'batch' ? 'tanda' : 'semana'}{i.cost > 0.004 ? ` · ${fmtMoney(i.cost)}` : ''}</span>
                    </span>
                    <Segmented label={`${i.name}: en casa`} value="have" onChange={v => v === 'miss' && setHome(i.key, false)}
                      options={[{ value: 'have', label: 'Hay' }, { value: 'miss', label: 'Falta' }]} />
                  </div>
                ))}
                {sorted.length === 0 && <div className="mp-empty">Nada marcado como en casa.</div>}
              </div>
            </>
          )}

          {tab === 'buy' && batidoAgg.length > 0 && (
            <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px dashed var(--c-line-2)' }}>
              <span className="mp-eyebrow">Batidos de merienda sugeridos · no incluidos arriba</span>
              {batidoAgg.map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: '1px solid var(--c-line)', fontSize: 13.5 }}>
                  <span>{item.name}</span><span className="mp-muted mp-num">{item.qty} · {fmtMoney(item.cost)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="compra-aside">
          <section className="mp-glass mp-card mp-rise" style={{ animationDelay: '160ms', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="mp-muted" style={{ fontSize: 12, fontWeight: 600 }}>En el carro</span>
            <span className="mp-num" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em' }}>{done.length}<span style={{ fontSize: 16, color: 'var(--c-ink-3)' }}> / {buy.length}</span></span>
            {buy.length > 0 && buy.length <= 36 ? (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${buy.length}, minmax(0, 1fr))`, gap: 3 }}>
                {buy.map(i => <span key={i.key} style={{ height: 8, borderRadius: 4, background: checked.has(i.key) ? 'var(--c-green)' : 'rgba(110,80,50,0.12)', transition: 'background .4s' }} />)}
              </div>
            ) : (
              <span style={{ height: 8, borderRadius: 4, background: 'rgba(110,80,50,0.12)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${buy.length ? done.length / buy.length * 100 : 0}%`, background: 'var(--c-green)', transition: 'width .4s' }} /></span>
            )}
            <span className="mp-muted mp-num" style={{ fontSize: 12.5 }}>{fmtMoney(doneCost)} de {fmtMoney(buyTotal)} en el carro</span>
          </section>

          {sortBy === 'store' && storeOrder.length > 0 && (
            <section className="mp-glass mp-card mp-rise" style={{ animationDelay: '220ms', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Por tienda</span>
              {storeOrder.map(k => (
                <div key={k || 'none'} style={{ display: 'grid', gridTemplateColumns: '12px minmax(0, 1fr) auto', gap: 9, alignItems: 'center', fontSize: 13 }}>
                  <span className="mp-dot" style={{ width: 9, height: 9, background: k ? storeColor(k) : 'rgba(110,80,50,0.35)' }} />
                  <span style={{ color: 'var(--c-ink-2)' }}>{k || 'Sin tienda'} <span className="mp-muted">· {storeTotals[k].n}</span></span>
                  <span className="mp-num" style={{ fontWeight: 650 }}>{fmtMoney(storeTotals[k].cost)}</span>
                </div>
              ))}
              {storeTotals[''] && <span className="mp-muted" style={{ fontSize: 12, lineHeight: 1.45 }}>Asigna tienda a lo que falta en Ingredientes: un toque en su etiqueta.</span>}
            </section>
          )}

          {sortBy !== 'store' && byCat.length > 0 && (
            <section className="mp-glass mp-card mp-rise" style={{ animationDelay: '220ms', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Dónde va el dinero</span>
              {byCat.map(({ c, cost }) => (
                <div key={c} style={{ display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr) 58px', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--c-ink-2)' }}>{CAT_LABELS[c] ?? c}</span>
                  <span style={{ height: 7, borderRadius: 4, background: 'rgba(110,80,50,0.08)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${cost / maxCat * 100}%`, borderRadius: 4, background: CAT_PILL[c] ?? CAT_PILL.otro, animation: 'mp-grow 1s var(--c-ease) both' }} /></span>
                  <span className="mp-num" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMoney(cost)}</span>
                </div>
              ))}
            </section>
          )}

          {catsPresent.length > 0 && (
            <section className="mp-glass mp-card mp-rise" style={{ animationDelay: '280ms', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Cuándo se come</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--c-ink-2)' }}>Cada fila marca los días en que ese producto está en algún plato.</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                {catsPresent.map(c => <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 18, height: 12, borderRadius: 4, background: CAT_PILL[c] ?? CAT_PILL.otro }} />{CAT_LABELS[c] ?? c}</span>)}
              </div>
            </section>
          )}

        </aside>
      </div>
    </div>
  )
}
