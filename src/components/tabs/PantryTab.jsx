import { useMemo, useState } from 'react'
import useStore, { selectAllIng } from '../../store/useStore'
import Icon from '../ui/Icon'
import { packOf, keepsOf, KEEPS_DAYS, UNIT_LABEL, WEIGHT_UNITS, VOLUME_UNITS, fmtAmount, toBase } from '../../lib/packs'
import { catColor } from '../../lib/stores'

// ─── Despensa ────────────────────────────────────────────────────────────────
// Lo que hay en casa, con cantidades. Entra solo al marcar algo como comprado
// en la Compra (el paquete entero) y sale al marcar el batch como cocinado;
// aquí se corrige a mano. El generador de semanas usa primero lo que hay
// (la cebolla de la bolsa de 10 lb pasa de una semana a otra) y evita que se
// tire lo que caduca en la semana.

const GROUPS = [
  { keeps: 'week', title: 'Use this week', hint: 'Fresh: goes off in about a week' },
  { keeps: 'weeks', title: 'Keeps a few weeks', hint: 'Onion, carrot, squash, eggs, yogurt…' },
  { keeps: 'months', title: 'Freezer & cupboard', hint: 'Meat and fish once frozen, rice, legumes, nuts…' },
]
const DAY = 86400000

// Unidad en la que se edita: la del paquete (lb, kg, units…) o la base.
function editUnit(ing, fallbackDim) {
  const pack = packOf(ing)
  if (pack) return pack.unit
  return fallbackDim === 'ml' ? 'ml' : fallbackDim === 'unit' ? 'unit' : 'g'
}
const unitFactor = u => WEIGHT_UNITS[u] ?? VOLUME_UNITS[u] ?? 1
const dimOfUnit = u => (u in WEIGHT_UNITS ? 'g' : u in VOLUME_UNITS ? 'ml' : 'unit')

function Row({ k, ing, entry, allIng }) {
  const setStock = useStore(s => s.setStock)
  const pack = packOf(ing)
  const unit = editUnit(ing)
  const dim = dimOfUnit(unit)
  const [draft, setDraft] = useState(null)
  const keeps = keepsOf(k, ing, allIng)
  const age = entry.addedAt ? Math.floor((Date.now() - new Date(entry.addedAt)) / DAY) : 0
  const left = KEEPS_DAYS[keeps] - age
  const shown = +(entry.amount / unitFactor(unit)).toFixed(unit === 'g' || unit === 'ml' ? 0 : 2)
  function commit() {
    if (draft == null) return
    const v = parseFloat(String(draft).replace(',', '.'))
    if (Number.isFinite(v)) setStock(k, toBase(v, unit))
    setDraft(null)
  }
  return (
    <div className={`pt-row mp-in${left < 0 ? ' is-old' : ''}`}>
      <span className="mp-dot" style={{ width: 9, height: 9, background: catColor(ing.cat ?? 'otro'), flexShrink: 0 }} />
      <span className="pt-name">
        <span>{ing.name}</span>
        <small className="mp-muted">
          {pack ? `${+(entry.amount / pack.amount).toFixed(2)} of a ${fmtAmount(pack.amount, pack.dim)} pack · ` : ''}
          {left < 0 ? 'past its date — check it' : keeps === 'months' ? (age < 1 ? 'added today' : `added ${age} day${age === 1 ? '' : 's'} ago`) : left <= 2 ? `use in ${Math.max(0, left)} day${left === 1 ? '' : 's'}` : `≈ ${left} days left`}
        </small>
      </span>
      <label className="pt-amt">
        <span className="sr-only">{ing.name} amount</span>
        <input className="mp-input mp-num" inputMode="decimal" value={draft ?? shown}
          onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} />
        <span className="mp-muted">{UNIT_LABEL[unit] ?? unit}</span>
      </label>
      <button type="button" className="mw-act" aria-label={`Remove ${ing.name}`} title="Used up / remove" onClick={() => setStock(k, 0)}><Icon name="x" size={11} stroke={3} /></button>
      <span className="sr-only">{fmtAmount(entry.amount, dim)}</span>
    </div>
  )
}

export default function PantryTab() {
  const allIng = useStore(selectAllIng)
  const stock = useStore(s => s.stock) ?? {}
  const pantry = useStore(s => s.pantry)
  const setStock = useStore(s => s.setStock)
  const setAtHome = useStore(s => s.setAtHome)
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(null)
  const [amt, setAmt] = useState('')

  const rows = Object.entries(stock).filter(([k, v]) => allIng[k] && v?.amount > 0)
  const groups = GROUPS.map(g => ({
    ...g,
    rows: rows.filter(([k]) => keepsOf(k, allIng[k], allIng) === g.keeps)
      .sort((a, b) => new Date(a[1].addedAt ?? 0) - new Date(b[1].addedAt ?? 0)),
  })).filter(g => g.rows.length)
  const staples = (pantry?.have ?? []).filter(k => allIng[k]).sort((a, b) => allIng[a].name.localeCompare(allIng[b].name))

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s || pick) return []
    return Object.entries(allIng).filter(([, i]) => !i.hideInTable && i.name?.toLowerCase().includes(s)).slice(0, 8)
  }, [q, pick, allIng])

  const pickIng = pick ? allIng[pick] : null
  const pickPack = pickIng ? packOf(pickIng) : null
  const pickUnit = pickIng ? editUnit(pickIng) : 'g'
  function choose(k) {
    setPick(k); setQ(allIng[k].name)
    const p = packOf(allIng[k])
    setAmt(p ? String(p.qty) : '')
  }
  function add() {
    const v = parseFloat(String(amt).replace(',', '.'))
    if (!pick || !(v > 0)) return
    setStock(pick, (stock[pick]?.amount ?? 0) + toBase(v, pickUnit), new Date().toISOString())
    setPick(null); setQ(''); setAmt('')
  }

  return (
    <div className="pt">
      <div className="mp-page-head mp-rise">
        <div className="mp-page-title">
          <h1>Pantry</h1>
          <span>{rows.length ? `${rows.length} item${rows.length === 1 ? '' : 's'} at home` : 'Empty for now'}</span>
        </div>
      </div>

      <section className="mp-glass mp-card pt-add mp-rise" style={{ animationDelay: '60ms' }}>
        <span className="mp-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
          Ticking something as bought in Shopping adds the whole pack here; “Mark as cooked” in Batch takes Monday–Friday out.
          Smart weeks use what’s here first, so a 10 lb onion bag carries over instead of going to waste.
        </span>
        <div className="pt-add-row">
          <label className="mp-search" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <Icon name="search" size={14} stroke={2.4} />
            <span className="sr-only">Ingredient</span>
            <input placeholder="Add something you have…" value={q} onChange={e => { setQ(e.target.value); setPick(null) }} />
            {matches.length > 0 && (
              <span className="pt-menu" role="listbox">
                {matches.map(([k, i]) => <button key={k} type="button" role="option" aria-selected="false" onClick={() => choose(k)}>{i.name}{i.brand ? <small className="mp-muted"> · {i.brand}</small> : null}</button>)}
              </span>
            )}
          </label>
          {pick && (
            <>
              <label className="pt-amt">
                <span className="sr-only">Amount</span>
                <input className="mp-input mp-num" inputMode="decimal" autoFocus value={amt} onChange={e => setAmt(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
                <span className="mp-muted">{UNIT_LABEL[pickUnit] ?? pickUnit}</span>
              </label>
              <button type="button" className="mp-btn mp-btn-dark mp-btn-sm" onClick={add}><Icon name="plus" size={13} stroke={2.6} />Add</button>
            </>
          )}
        </div>
        {pick && pickPack && <span className="mp-muted" style={{ fontSize: 12 }}>One pack is {fmtAmount(pickPack.amount, pickPack.dim)}.</span>}
      </section>

      {groups.map((g, n) => (
        <section key={g.keeps} className="mp-glass mp-card pt-group mp-rise" style={{ animationDelay: `${120 + n * 50}ms` }}>
          <span className="pt-head"><strong>{g.title}</strong><span className="mp-muted">{g.hint}</span></span>
          {g.rows.map(([k, v]) => <Row key={k} k={k} ing={allIng[k]} entry={v} allIng={allIng} />)}
        </section>
      ))}

      {rows.length === 0 && (
        <div className="mp-glass mp-card mp-empty" style={{ padding: '40px 16px' }}>
          Nothing counted yet. Tick things off in Shopping, or add what you already have above.
        </div>
      )}

      {staples.length > 0 && (
        <section className="mp-glass mp-card pt-group mp-rise" style={{ animationDelay: '280ms' }}>
          <span className="pt-head"><strong>Always at home</strong><span className="mp-muted">Staples never counted — spices, oil… Remove one to put it back on the list.</span></span>
          <div className="pt-staples">
            {staples.map(k => (
              <span key={k} className="mp-tag pt-staple">{allIng[k].name}
                <button type="button" aria-label={`Put ${allIng[k].name} back on the list`} onClick={() => setAtHome(k, false)}><Icon name="x" size={9} stroke={3} /></button>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
