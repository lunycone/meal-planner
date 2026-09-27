import { useState } from 'react'
import useStore, { selectAllIng, selectAllCats, selectCatOrder } from '../../store/useStore'
import Overlay from '../ui/Overlay'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { storeColor, storesIn, catColor, SWATCHES } from '../../lib/stores'

// Gestor de tiendas y categorías: añadir, renombrar, cambiar el color y
// borrar. Borrar una tienda deja sus ingredientes «sin tienda»; borrar una
// categoría los pasa a «Other». Todo en el guardado compartido.
export default function StoresSheet({ initialTab = 'stores', onClose }) {
  const allIng = useStore(selectAllIng)
  const allCats = useStore(selectAllCats)
  const catOrder = useStore(selectCatOrder)
  const extraStores = useStore(s => s.extraStores)
  useStore(s => s.storeColors); useStore(s => s.catColors) // repintar al cambiar colores
  const st = useStore.getState()

  const [tab, setTab] = useState(initialTab)
  const [editing, setEditing] = useState(null)   // { id, value }
  const [colorFor, setColorFor] = useState(null) // id
  const [asking, setAsking] = useState(null)     // id
  const [newName, setNewName] = useState('')

  const stores = storesIn(allIng, extraStores)
  const catCount = k => Object.values(allIng).filter(i => i.cat === k && !i.hideInTable).length

  const rows = tab === 'stores'
    ? stores.map(s => ({ id: s.name, label: s.name, color: storeColor(s.name), count: s.count, canDelete: true }))
    : catOrder.map(k => ({ id: k, label: allCats[k] ?? k, color: catColor(k), count: catCount(k), canDelete: k !== 'otro' }))

  const setColor = (id, c) => tab === 'stores' ? st.setStoreColor(id, c) : st.setCatColor(id, c)
  function commitRename() {
    if (!editing) return
    const v = editing.value.trim()
    if (v && v !== rows.find(r => r.id === editing.id)?.label) {
      if (tab === 'stores') st.renameStore(editing.id, v)
      else st.renameCategory(editing.id, v)
    }
    setEditing(null)
  }
  function remove(id) {
    if (tab === 'stores') st.deleteStore(id)
    else st.deleteCategory(id)
    setAsking(null)
  }
  function add() {
    const v = newName.trim()
    if (!v) return
    const used = new Set(rows.map(r => r.color))
    const color = SWATCHES.find(c => !used.has(c)) ?? SWATCHES[rows.length % SWATCHES.length]
    if (tab === 'stores') {
      if (!rows.some(r => r.label.toLowerCase() === v.toLowerCase())) st.addStore(v, color)
    } else st.addCategory(v, color)
    setNewName('')
  }
  const noun = tab === 'stores' ? 'store' : 'category'

  return (
    <Overlay onClose={onClose}>
      <div className="mp-sheet ss-sheet" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Stores and categories">
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mp-bubble" style={{ width: 42, height: 42, background: 'rgba(214,69,69,0.12)', color: '#D64545' }}><Icon name={tab === 'stores' ? 'bag' : 'layers'} size={19} /></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Stores & categories</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>Tap a name to rename it, the dot to change its color.</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32 }} aria-label="Close" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>
        <div style={{ padding: '0 24px 12px' }}>
          <Segmented label="Section" value={tab} onChange={v => { setTab(v); setEditing(null); setColorFor(null); setAsking(null) }}
            options={[{ value: 'stores', label: `Stores · ${stores.length}` }, { value: 'cats', label: `Categories · ${catOrder.length}` }]} />
        </div>

        <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 0 }}>
          {rows.map(r => (
            <div key={r.id} className="ss-row mp-in">
              <div className="ss-main">
                <button type="button" className="ss-color" style={{ background: r.color }} aria-label={`Color of ${r.label}`} aria-expanded={colorFor === r.id}
                  onClick={() => setColorFor(colorFor === r.id ? null : r.id)} />
                {editing?.id === r.id ? (
                  <input className="mw-rename" autoFocus value={editing.value} aria-label="New name"
                    onChange={e => setEditing({ ...editing, value: e.target.value })} onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { e.stopPropagation(); setEditing(null) } }} />
                ) : (
                  <button type="button" className="ss-name" onClick={() => setEditing({ id: r.id, value: r.label })}>{r.label}</button>
                )}
                <span className="mp-muted mp-num" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{r.count} {r.count === 1 ? 'ingredient' : 'ingredients'}</span>
                {asking === r.id ? (
                  <span className="mw-confirm">
                    <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setAsking(null)}>No</button>
                    <button className="mp-btn mp-btn-danger mp-btn-sm" onClick={() => remove(r.id)}>Delete</button>
                  </span>
                ) : r.canDelete && (
                  <button type="button" className="mw-act is-danger" title={`Delete ${noun}`} aria-label={`Delete ${r.label}`} onClick={() => setAsking(r.id)}><Icon name="trash" size={13} /></button>
                )}
              </div>
              {asking === r.id && r.count > 0 && (
                <span className="ss-note">{r.count} {r.count === 1 ? 'ingredient goes' : 'ingredients go'} to {tab === 'stores' ? '“No store”' : '“Other”'}.</span>
              )}
              {colorFor === r.id && (
                <div className="ss-swatches mp-in">
                  {SWATCHES.map(c => (
                    <button key={c} type="button" className={`ss-swatch${c.toLowerCase() === r.color.toLowerCase() ? ' is-on' : ''}`} style={{ background: c }}
                      aria-label={`Use ${c}`} onClick={() => { setColor(r.id, c); setColorFor(null) }} />
                  ))}
                  <label className="ss-swatch ss-custom" title="Any color">
                    <Icon name="plus" size={12} stroke={2.6} />
                    <input type="color" value={/^#[0-9a-f]{6}$/i.test(r.color) ? r.color : '#888888'} onChange={e => setColor(r.id, e.target.value)} aria-label="Any color" />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mp-sheet-foot" style={{ justifyContent: 'stretch' }}>
          <input className="mp-input" style={{ flex: 1, minWidth: 0 }} placeholder={tab === 'stores' ? 'New store, e.g. Walmart' : 'New category, e.g. Nuts'}
            value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
          <button className="mp-btn mp-btn-dark" disabled={!newName.trim()} onClick={add}><Icon name="plus" size={14} stroke={2.6} />Add {noun}</button>
        </div>
      </div>
    </Overlay>
  )
}

