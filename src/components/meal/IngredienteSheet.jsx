import { useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCats, selectAllCombos, selectCatOrder } from '../../store/useStore'
import StoresSheet from './StoresSheet'
import { ING } from '../../data/ingredients'
import { ingredientUnitType } from '../../engine/calc'
import Overlay from '../ui/Overlay'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { storeOf, storeColor, storesIn } from '../../lib/stores'

// ─── Ficha de ingrediente: ver y editar son lo mismo ───────────────────────
// Tienda, categoría, precio, pack y nutrientes se tocan en su sitio. A la
// derecha, en qué platos se usa (cambiar el precio cambia su coste).

// Campos por tipo de precio: [clave precio, etiqueta, factor para mostrar]
// y los de nutrientes [kcal, prot, grasa] con el mismo factor.
const UNIT = {
  per100:     { price: 'per100', label: '$ / 100 g', f: 1, nut: ['kc', 'prot', 'fat'], per: 'per 100 g' },
  perUnit:    { price: 'perUnit', label: '$ / unit', f: 1, nut: ['kcu', 'protu', 'fatu'], per: 'per unit' },
  perML:      { price: 'perML', label: '$ / 100 ml', f: 100, nut: ['kcml', null, 'fatml'], per: 'per 100 ml' },
  perServing: { price: 'perServing', label: '$ / serving', f: 1, nut: ['kcs', null, null], per: 'per serving' },
  flat:       { price: 'flat', label: '$ per use', f: 1, nut: ['kcf', 'protf', 'fatf'], per: 'per use' },
}
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n }
const show = (v, f = 1) => v == null ? '' : String(Math.round(v * f * 10000) / 10000)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function draftOf(ing, unit) {
  const U = UNIT[unit]
  return {
    name: ing?.name ?? '', cat: ing?.cat ?? 'otro', store: ing ? (storeOf(ing) ?? '') : '',
    price: show(ing?.[U.price], U.f), pack: ing?.pack ?? '', per: ing?.per ?? '', organic: !!ing?.organic,
    kc: show(ing?.[U.nut[0]], U.f), prot: U.nut[1] ? show(ing?.[U.nut[1]], U.f) : '', fat: U.nut[2] ? show(ing?.[U.nut[2]], U.f) : '',
  }
}

export default function IngredienteSheet({ ingKey = null, onClose }) {
  const allIng    = useStore(selectAllIng)
  const allCats   = useStore(selectAllCats)
  const allCombos = useStore(selectAllCombos)
  const catOrder = useStore(selectCatOrder)
  const extraStores = useStore(s => s.extraStores)
  useStore(s => s.storeColors) // repintar al cambiar colores
  const [manage, setManage] = useState(null)
  const ingredientOverrides = useStore(s => s.ingredientOverrides)
  const priceOverrides = useStore(s => s.priceOverrides)
  const setIngredientOverride = useStore(s => s.setIngredientOverride)
  const resetIngredientOverride = useStore(s => s.resetIngredientOverride)
  const setPriceOverride = useStore(s => s.setPriceOverride)
  const resetPrice = useStore(s => s.resetPrice)
  const deleteIngredient = useStore(s => s.deleteIngredient)
  const removeCustomIngredient = useStore(s => s.removeCustomIngredient)
  const addCustomIngredient = useStore(s => s.addCustomIngredient)
  const addCustomCategory = useStore(s => s.addCustomCategory)

  const ing = ingKey ? allIng[ingKey] : null
  const isNew = !ing
  const isBase = !!(ingKey && ING[ingKey])
  const [unit, setUnit] = useState(() => (ing && ingredientUnitType(ing)) || 'per100')
  const initial = useMemo(() => draftOf(ing, unit), [ingKey, unit]) // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState(initial)
  const [newStore, setNewStore] = useState(null)
  const [newCat, setNewCat] = useState(null)
  const [askDelete, setAskDelete] = useState(false)
  const [askClose, setAskClose] = useState(false)
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  const dirty = !same(draft, initial)
  const U = UNIT[unit]

  const stores = storesIn(allIng, extraStores)
  const storeNames = [...new Set([...stores.map(s => s.name), ...(draft.store && !stores.some(s => s.name === draft.store) ? [draft.store] : [])])]
  const cats = catOrder.includes(draft.cat) ? catOrder : [...catOrder, draft.cat]
  const usedIn = useMemo(() => ingKey ? Object.entries(allCombos).filter(([, c]) => (c.items ?? []).some(it => it.k === ingKey) || (c.optionalItems ?? []).some(it => it.k === ingKey)).map(([k, c]) => ({ k, name: c.name })) : [], [ingKey, allCombos])
  const modified = !!(ingKey && (ingredientOverrides[ingKey] || priceOverrides[ingKey]))

  function save() {
    if (!draft.name.trim()) return
    const data = { name: draft.name.trim(), cat: draft.cat, store: draft.store.trim(), pack: draft.pack, per: draft.per, organic: draft.organic }
    const p = num(draft.price)
    if (p != null) data[U.price] = p / U.f
    const n = [num(draft.kc), num(draft.prot), num(draft.fat)]
    U.nut.forEach((field, i) => { if (field && n[i] != null) data[field] = n[i] / U.f })
    if (isNew) {
      const key = 'custom-' + data.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
      addCustomIngredient(key, { ...data, isCustom: true })
    } else {
      setIngredientOverride(ingKey, data)
      // un precio antiguo en priceOverrides taparía el nuevo (se aplica después)
      if (p != null && priceOverrides[ingKey]?.[U.price] != null) setPriceOverride(ingKey, U.price, p / U.f)
    }
    onClose()
  }
  function remove() {
    if (isBase) deleteIngredient(ingKey)
    else removeCustomIngredient(ingKey)
    onClose()
  }
  function tryClose() { if (dirty) setAskClose(true); else onClose() }
  function commitStore() {
    const v = (newStore ?? '').trim()
    if (v) set('store', v)
    setNewStore(null)
  }
  function commitCat() {
    const v = (newCat ?? '').trim()
    if (v) {
      addCustomCategory(v)
      const k = useStore.getState().customCategories.at(-1)?.key
      if (k) set('cat', k)
    }
    setNewCat(null)
  }

  const sc = draft.store ? storeColor(draft.store) : '#8A8076'

  return (
    <Overlay onClose={tryClose}>
      <div className="mp-sheet ig-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={draft.name || 'New ingredient'}>
        <div className="mp-sheet-head" style={{ paddingBottom: 12 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
            <span className="mp-bubble" style={{ width: 46, height: 46, background: sc + '22', color: sc, transition: 'background .3s, color .3s' }}><Icon name="bag" size={20} /></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
              <input className="pl-title" value={draft.name} placeholder="Ingredient name" aria-label="Name" autoFocus={isNew} onChange={e => set('name', e.target.value)} />
              <span className="mp-muted" style={{ fontSize: 12.5 }}>
                {draft.store || 'No store'} · {allCats[draft.cat] ?? draft.cat}{draft.organic ? ' · organic' : ''}
                {modified && <span className="mp-tag" style={{ marginLeft: 8, background: 'rgba(224,162,27,0.16)', color: '#8A5E08' }}>Modified</span>}
                {ing?.isCustom && <span className="mp-tag" style={{ marginLeft: 8, background: 'rgba(139,111,232,0.14)', color: '#5B3FC4' }}>Yours</span>}
              </span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32, flexShrink: 0 }} aria-label="Close" onClick={tryClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div className="ig-body">
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="ig-field">
              <span className="ig-field-head"><span className="mp-eyebrow">Where to buy</span><button type="button" className="ig-manage" onClick={() => setManage('stores')}>Edit stores</button></span>
              <div className="ig-chips">
                {storeNames.map(s => {
                  const on = draft.store === s, c = storeColor(s)
                  return (
                    <button key={s} type="button" className={`ig-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => set('store', on ? '' : s)}
                      style={on ? { background: c, color: '#fff', boxShadow: `0 6px 14px ${c}55` } : undefined}>
                      <span className="mp-dot" style={{ background: on ? '#fff' : c }} />{s}
                    </button>
                  )
                })}
                <button type="button" className={`ig-chip${!draft.store ? ' is-on' : ''}`} aria-pressed={!draft.store} onClick={() => set('store', '')}
                  style={!draft.store ? { background: 'var(--c-ink)', color: '#fff' } : undefined}>No store</button>
                {newStore == null
                  ? <button type="button" className="ig-chip ig-chip-add" onClick={() => setNewStore('')}><Icon name="plus" size={12} stroke={2.6} />Other</button>
                  : <input className="ig-chip-input" autoFocus placeholder="Store name" value={newStore} onChange={e => setNewStore(e.target.value)}
                      onBlur={commitStore} onKeyDown={e => { if (e.key === 'Enter') commitStore(); if (e.key === 'Escape') { e.stopPropagation(); setNewStore(null) } }} />}
              </div>
            </div>

            <div className="ig-field">
              <span className="ig-field-head"><span className="mp-eyebrow">Category</span><button type="button" className="ig-manage" onClick={() => setManage('cats')}>Edit categories</button></span>
              <div className="ig-chips">
                {cats.map(k => {
                  const on = draft.cat === k
                  return <button key={k} type="button" className={`ig-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => set('cat', k)} style={on ? { background: 'var(--c-ink)', color: '#fff' } : undefined}>{allCats[k] ?? k}</button>
                })}
                {newCat == null
                  ? <button type="button" className="ig-chip ig-chip-add" onClick={() => setNewCat('')}><Icon name="plus" size={12} stroke={2.6} />New</button>
                  : <input className="ig-chip-input" autoFocus placeholder="New category" value={newCat} onChange={e => setNewCat(e.target.value)}
                      onBlur={commitCat} onKeyDown={e => { if (e.key === 'Enter') commitCat(); if (e.key === 'Escape') { e.stopPropagation(); setNewCat(null) } }} />}
              </div>
            </div>

            <div className="ig-field">
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span className="mp-eyebrow">Price and pack</span>
                {isNew && <Segmented label="Priced by" value={unit} onChange={u => { setUnit(u); setDraft(d => ({ ...d, price: '', kc: '', prot: '', fat: '' })) }}
                  options={[{ value: 'per100', label: 'By weight' }, { value: 'perUnit', label: 'By unit' }, { value: 'perML', label: 'By volume' }]} />}
              </span>
              <div className="ig-grid2">
                <label className="ig-input"><span>{U.label}</span><input inputMode="decimal" value={draft.price} onChange={e => set('price', e.target.value)} placeholder="0.00" /></label>
                <label className="ig-input"><span>Pack you buy</span><input value={draft.pack} onChange={e => set('pack', e.target.value)} placeholder="2.5 kg · $11.49" /></label>
              </div>
            </div>

            <div className="ig-field">
              <span className="mp-eyebrow">Nutrition · {U.per}</span>
              <div className="ig-grid3">
                <label className="ig-input"><span>kcal</span><input inputMode="decimal" value={draft.kc} onChange={e => set('kc', e.target.value)} placeholder="0" /></label>
                {U.nut[1] && <label className="ig-input"><span>Protein (g)</span><input inputMode="decimal" value={draft.prot} onChange={e => set('prot', e.target.value)} placeholder="0" /></label>}
                {U.nut[2] && <label className="ig-input"><span>Fat (g)</span><input inputMode="decimal" value={draft.fat} onChange={e => set('fat', e.target.value)} placeholder="0" /></label>}
              </div>
            </div>

            <div className="ig-grid2" style={{ alignItems: 'end' }}>
              <label className="ig-input"><span>Portion note</span><input value={draft.per} onChange={e => set('per', e.target.value)} placeholder="80 g → $0.37 · 65 kcal" /></label>
              <button type="button" className={`ig-chip${draft.organic ? ' is-on' : ''}`} aria-pressed={draft.organic} onClick={() => set('organic', !draft.organic)}
                style={{ height: 44, justifyContent: 'center', ...(draft.organic ? { background: '#2F9E5B', color: '#fff' } : {}) }}>
                <Icon name="leaf" size={14} />Organic
              </button>
            </div>
          </section>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflowY: 'auto' }}>
            {!isNew && (
              <div className="pl-card" style={{ gap: 6 }}>
                <span className="mp-eyebrow">Used in {usedIn.length} {usedIn.length === 1 ? 'dish' : 'dishes'}</span>
                {usedIn.length === 0 && <span className="mp-muted" style={{ fontSize: 12.5 }}>No dish uses it yet.</span>}
                {usedIn.slice(0, 8).map(u => <span key={u.k} style={{ fontSize: 12.5, lineHeight: 1.35 }}>{u.name}</span>)}
                {usedIn.length > 8 && <span className="mp-muted" style={{ fontSize: 12 }}>and {usedIn.length - 8} more</span>}
                {dirty && usedIn.length > 0 && num(draft.price) != null && <span style={{ fontSize: 11.5, color: '#8A5E08', lineHeight: 1.4 }}>Saving recalculates the cost of these dishes, the shopping and the batch.</span>}
              </div>
            )}
            {!isNew && ing?.brand && (
              <div className="pl-card" style={{ gap: 4 }}>
                <span className="mp-eyebrow">Brand</span>
                <span style={{ fontSize: 13 }}>{ing.brand}</span>
              </div>
            )}
            {isBase && modified && !dirty && (
              <button type="button" className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => { resetIngredientOverride(ingKey); resetPrice(ingKey); onClose() }}>
                <Icon name="repeat" size={13} />Back to the original data
              </button>
            )}
          </aside>
        </div>

        <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
          {askClose ? (
            <>
              <span style={{ fontSize: 13, fontWeight: 600 }}>You have unsaved changes.</span>
              <span style={{ display: 'flex', gap: 8 }}>
                <button className="mp-btn mp-btn-glass" onClick={onClose}>Discard</button>
                <button className="mp-btn mp-btn-glass" onClick={() => setAskClose(false)}>Keep editing</button>
                <button className="mp-btn mp-btn-dark" disabled={!draft.name.trim()} onClick={save}>Save</button>
              </span>
            </>
          ) : askDelete ? (
            <>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{isBase ? 'Hide' : 'Delete'} “{ing.name}”?{usedIn.length ? ` Used in ${usedIn.length} dishes.` : ''}</span>
              <span style={{ display: 'flex', gap: 8 }}>
                <button className="mp-btn mp-btn-glass" onClick={() => setAskDelete(false)}>No</button>
                <button className="mp-btn mp-btn-danger" onClick={remove}>{isBase ? 'Hide' : 'Delete'}</button>
              </span>
            </>
          ) : (
            <>
              <span>{!isNew && <button className="mp-btn mp-btn-sm pl-del" onClick={() => setAskDelete(true)}><Icon name="trash" size={13} />{isBase ? 'Hide' : 'Delete'}</button>}</span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isNew && !draft.name.trim() && <span className="mp-muted" style={{ fontSize: 12.5 }}>Name missing</span>}
                {dirty && !isNew && <button className="mp-btn mp-btn-glass" onClick={() => setDraft(initial)}>Discard</button>}
                {(dirty || isNew)
                  ? <button className="mp-btn mp-btn-dark" disabled={!draft.name.trim()} onClick={save}>{isNew ? 'Add ingredient' : 'Save changes'}</button>
                  : <button className="mp-btn mp-btn-dark" onClick={onClose}>Done</button>}
              </span>
            </>
          )}
        </div>
      </div>
      {manage && <StoresSheet initialTab={manage} onClose={() => setManage(null)} />}
    </Overlay>
  )
}
