import { useState } from 'react'
import Icon from '../components/ui/Icon'
import { addDays, fmtMoney } from '../lib/mealplan'
import { storeColor } from '../lib/stores'
import useShoppingList, { CAT_PILL } from '../lib/useShoppingList'
import { MHeader } from './MobileApp'

// Compra en el móvil («modo súper»): progreso siempre a la vista, lista
// separada por tienda con botones grandes y lo marcado baja al carro.
// Mismo cálculo y mismas marcas compartidas que la Compra del Mac.

export default function MCompra({ unseen, onIdeas }) {
  const [offset, setOffset] = useState(1)
  const [tab, setTab] = useState('buy')
  const { batchWindow, items, checked, toggleChecked, setHome } = useShoppingList(offset, 'batch')

  const buy = items.filter(i => !i.home)
  const home = items.filter(i => i.home).sort((a, b) => a.name.localeCompare(b.name))
  const pending = buy.filter(i => !checked.has(i.key))
  const done = buy.filter(i => checked.has(i.key))
  const total = buy.reduce((s, i) => s + i.cost, 0)
  const doneCost = done.reduce((s, i) => s + i.cost, 0)

  const byStore = {}
  pending.forEach(i => { const k = i.store ?? ''; (byStore[k] ??= []).push(i) })
  const order = Object.keys(byStore).filter(Boolean)
    .sort((a, b) => byStore[b].reduce((s, i) => s + i.cost, 0) - byStore[a].reduce((s, i) => s + i.cost, 0))
    .concat(byStore[''] ? [''] : [])
  const groups = order.map(k => ({ k, label: k || 'No store', color: k ? storeColor(k) : 'rgba(110,80,50,0.35)', rows: byStore[k].sort((a, b) => a.name.localeCompare(b.name)) }))
  if (done.length) groups.push({ k: '__done', label: 'In the cart', color: 'var(--c-green)', rows: done })

  const sunday = addDays(batchWindow.start, -1)
  const days = batchWindow.windowDates.map(w => w.dayKey)
  const sub = `Sunday ${sunday.getDate()} batch · Mon ${batchWindow.start.getDate()} – Fri ${batchWindow.end.getDate()}`

  return (
    <div className="m-page">
      <MHeader title="Shopping" sub={sub} unseen={unseen} onIdeas={onIdeas} />
      <div className="ms-nav">
        <button type="button" aria-label="Previous batch" onClick={() => setOffset(o => o - 1)}><Icon name="left" size={14} stroke={2.6} /></button>
        <button type="button" onClick={() => setOffset(1)} disabled={offset === 1}>Next batch</button>
        <button type="button" aria-label="Following batch" onClick={() => setOffset(o => o + 1)}><Icon name="right" size={14} stroke={2.6} /></button>
      </div>

      <section className="mc-progress">
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="mp-muted" style={{ fontSize: 13 }}>In the cart <strong className="mp-num" style={{ fontSize: 22, color: 'var(--c-ink)' }}>{done.length}</strong> / {buy.length}</span>
          <span className="mp-muted mp-num" style={{ fontSize: 13 }}><strong style={{ color: 'var(--c-ink)' }}>{fmtMoney(doneCost)}</strong> of {fmtMoney(total)}</span>
        </span>
        <span className="mc-bar"><span style={{ width: `${buy.length ? done.length / buy.length * 100 : 0}%` }} /></span>
        <div className="mc-seg" role="group" aria-label="List">
          <span aria-hidden="true" style={{ left: tab === 'buy' ? 3 : '50%' }} />
          <button type="button" aria-pressed={tab === 'buy'} onClick={() => setTab('buy')}>To buy · {pending.length}</button>
          <button type="button" aria-pressed={tab === 'home'} onClick={() => setTab('home')}>At home · {home.length}</button>
        </div>
      </section>

      {items.length === 0 && <div className="mp-empty" style={{ padding: '40px 10px' }}>No dishes planned for those days.</div>}

      {tab === 'buy' && groups.map(g => (
        <section key={g.k} className="mc-group">
          <span className="mc-group-head">
            <span className="mp-dot" style={{ width: 9, height: 9, background: g.color }} />{g.label}
            <span className="mp-muted mp-num" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600 }}>{g.rows.length}{g.k !== '__done' ? ` · ${fmtMoney(g.rows.reduce((s, i) => s + i.cost, 0))}` : ''}</span>
          </span>
          {g.rows.map(i => {
            const on = checked.has(i.key)
            return (
              <button key={i.key} type="button" className={`mc-row${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleChecked(i.key)}>
                <span className="mc-check"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="mc-name">{i.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mp-muted mp-num" style={{ fontSize: 12.5 }}>{i.qty}</span>
                    <span style={{ display: 'flex', gap: 2 }}>{days.map(d => <span key={d} style={{ width: 9, height: 6, borderRadius: 2, background: i.usedDays.has(d) ? (CAT_PILL[i.cat] ?? CAT_PILL.otro) : 'rgba(110,80,50,0.12)' }} />)}</span>
                  </span>
                </span>
                <span className="mp-num" style={{ fontSize: 14, fontWeight: 700 }}>{fmtMoney(i.cost)}</span>
              </button>
            )
          })}
        </section>
      ))}

      {tab === 'home' && (
        <section className="mc-group">
          <span className="mp-muted" style={{ fontSize: 12.5, lineHeight: 1.45, padding: '0 4px' }}>What you already have. If something runs out, mark it “Missing” and it goes back on the list.</span>
          {home.map(i => (
            <div key={i.key} className="mc-home">
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{i.name}</span>
                <span className="mp-muted mp-num" style={{ fontSize: 12 }}>{i.qty} this batch</span>
              </span>
              <button type="button" className="mc-miss" onClick={() => setHome(i.key, false)}>Missing</button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
