import { useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCats, selectAllCombos, selectCatOrder } from '../../store/useStore'
import StoresSheet from './StoresSheet'
import { ING } from '../../data/ingredients'
import { ingredientUnitType } from '../../engine/calc'
import Overlay from '../ui/Overlay'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { storeOf, storeColor, storesIn } from '../../lib/stores'
import { TAGS, TAG_LABEL, TAG_HINT, tagsOf, guessTags } from '../../lib/tags'
import { ROLES, TASTES, snackRoleOf, suggestRole } from '../../data/snackRoles'
import { packOf, dimOf, toBase, formatPack, keepsOf, KEEPS, KEEPS_LABEL } from '../../lib/packs'

// ─── Ficha de ingrediente: ver y editar son lo mismo ───────────────────────
// Tienda, categoría, precio, pack y nutrientes se tocan en su sitio. A la
// derecha, en qué platos se usa (cambiar el precio cambia su coste).

// Campos por tipo de precio: [clave precio, etiqueta, factor para mostrar]
// y los de nutrientes [kcal, prot, grasa, hidratos, fibra] con el mismo factor.
const UNIT = {
  per100:     { price: 'per100', label: '$ / 100 g', f: 1, nut: ['kc', 'prot', 'fat', 'carb', 'fib'], per: 'per 100 g' },
  perUnit:    { price: 'perUnit', label: '$ / unit', f: 1, nut: ['kcu', 'protu', 'fatu', 'carbu', 'fibu'], per: 'per unit' },
  perML:      { price: 'perML', label: '$ / 100 ml', f: 100, nut: ['kcml', 'protml', 'fatml', 'carbml', null], per: 'per 100 ml' },
  perServing: { price: 'perServing', label: '$ / serving', f: 1, nut: ['kcs', 'prots', 'fats', 'carbs', 'fibs'], per: 'per serving' },
  flat:       { price: 'flat', label: '$ per use', f: 1, nut: ['kcf', 'protf', 'fatf', 'carbf', 'fibf'], per: 'per use' },
}
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n }
const show = (v, f = 1) => v == null ? '' : String(Math.round(v * f * 10000) / 10000)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Tipo de precio del motor según la dimensión del paquete.
const TYPE_OF_DIM = { g: 'per100', ml: 'perML', unit: 'perUnit' }
const DIM_OF_TYPE = { per100: 'g', perML: 'ml', perUnit: 'unit' }
const BASIS_UNIT = { g: 'g', ml: 'ml', unit: 'unit' }

function draftOf(ing, unit, key) {
  const U = UNIT[unit]
  const dim = DIM_OF_TYPE[unit] ?? 'g'
  const pk = packOf(ing)
  const okPack = pk && pk.dim === dim
  const basis = dim === 'unit' ? 1 : 100
  const nutAt = field => field && ing?.[field] != null ? show(ing[field] * (dim === 'ml' ? 100 : 1)) : ''
  const portion = ing?.portionG != null ? String(ing.portionG) : (/^\s*(\d+(?:\.\d+)?)\s*(g|ml)\b/.exec(ing?.per ?? '')?.[1] ?? '')
  return {
    name: ing?.name ?? '', cat: ing?.cat ?? 'otro', store: ing ? (storeOf(ing) ?? '') : '', organic: !!ing?.organic, temporary: !!ing?.temporary, rotation: ing?.rotation ?? '',
    price: show(ing?.[U.price], U.f), pack: ing?.pack ?? '', per: ing?.per ?? '',
    packQty: okPack ? String(pk.qty) : '', packUnit: okPack ? pk.unit : (dim === 'g' ? 'kg' : dim === 'ml' ? 'L' : 'unit'),
    packPrice: okPack && pk.price != null ? String(pk.price) : '',
    keeps: ing ? keepsOf(key ?? '', ing) : 'week',
    basis: String(basis), kc: nutAt(U.nut[0]), prot: nutAt(U.nut[1]), fat: nutAt(U.nut[2]), carb: nutAt(U.nut[3]), fib: nutAt(U.nut[4]),
    portion,
    edible: ing?.edible != null && ing.edible < 1 ? String(Math.round(ing.edible * 100)) : '',
    tags: ing ? [...tagsOf(key, { [key]: ing })] : [],
    snackRole: snackRoleOf(key ?? '', { [key ?? '']: ing })?.role ?? '',
    snackTaste: snackRoleOf(key ?? '', { [key ?? '']: ing })?.taste ?? 'neutral',
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
  const [unit] = useState(() => (ing && ingredientUnitType(ing)) || 'per100')
  const initial = useMemo(() => draftOf(ing, unit, ingKey), [ingKey, unit]) // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState(initial)
  const [newStore, setNewStore] = useState(null)
  const [newCat, setNewCat] = useState(null)
  const [askDelete, setAskDelete] = useState(false)
  const [askClose, setAskClose] = useState(false)
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  // Etiquetas: en uno nuevo se proponen solas según el nombre y la categoría
  // hasta que las toques a mano.
  const [tagsTouched, setTagsTouched] = useState(!!ing)
  const shownTags = tagsTouched ? draft.tags : guessTags('', { name: draft.name, cat: draft.cat })
  const [keepsTouched, setKeepsTouched] = useState(!!ing)
  const shownKeeps = keepsTouched ? draft.keeps : keepsOf('', { name: draft.name, cat: draft.cat, tags: shownTags })
  const toggleTag = t => { setTagsTouched(true); setDraft(d => { const cur = tagsTouched ? d.tags : shownTags; return { ...d, tags: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] } }) }
  // Cambiar «por cuántos g» reescala lo ya escrito para que siga siendo lo
  // mismo (97 kcal por 100 g → 111.6 por 115 g); luego se copia la etiqueta.
  const setBasis = v => setDraft(d => {
    const ref = d.nref ?? { b: d.basis, kc: d.kc, prot: d.prot, fat: d.fat, carb: d.carb, fib: d.fib }
    const ob = num(ref.b), nb = num(v)
    if (!(ob > 0) || !(nb > 0)) return { ...d, basis: v, nref: ref }
    const r = x => { const n = num(x); return n == null ? x : String(Math.round(n * nb / ob * 10) / 10) }
    return { ...d, basis: v, kc: r(ref.kc), prot: r(ref.prot), fat: r(ref.fat), carb: r(ref.carb), fib: r(ref.fib), nref: ref }
  })
  // Escribir un nutriente fija la referencia para el siguiente reescalado.
  const setNut = (k, v) => setDraft(d => ({ ...d, [k]: v, nref: null }))
  const dirty = !same(draft, initial)
  const U = UNIT[unit]

  const stores = storesIn(allIng, extraStores)
  const storeNames = [...new Set([...stores.map(s => s.name), ...(draft.store && !stores.some(s => s.name === draft.store) ? [draft.store] : [])])]
  const cats = catOrder.includes(draft.cat) ? catOrder : [...catOrder, draft.cat]
  const usedIn = useMemo(() => ingKey ? Object.entries(allCombos).filter(([, c]) => (c.items ?? []).some(it => it.k === ingKey) || (c.optionalItems ?? []).some(it => it.k === ingKey)).map(([k, c]) => ({ k, name: c.name })) : [], [ingKey, allCombos])
  const modified = !!(ingKey && (ingredientOverrides[ingKey] || priceOverrides[ingKey]))

  // Lo que se guarda sale de lo que pone el paquete y la etiqueta: precio
  // por 100 g / ml / unidad, nutrientes normalizados, texto del pack y nota
  // de ración calculados aquí, no a mano.
  const legacy = unit === 'flat' || unit === 'perServing'
  const dim = legacy ? null : dimOf(draft.packUnit)
  const type = legacy ? unit : TYPE_OF_DIM[dim]
  const T = UNIT[type]
  const pQty = num(draft.packQty), pPrice = num(draft.packPrice)
  const packOk = !legacy && pQty > 0 && pPrice != null
  const amount = packOk ? toBase(pQty, draft.packUnit) : null
  const derivedPrice = packOk ? (dim === 'unit' ? pPrice / pQty : dim === 'ml' ? pPrice / amount : pPrice / amount * 100) : null
  const priceVal = derivedPrice ?? (num(draft.price) != null ? num(draft.price) / T.f : null)
  const b = num(draft.basis) > 0 ? num(draft.basis) : (dim === 'unit' ? 1 : 100)
  const perBase = v => v == null ? null : dim === 'unit' ? v / b : dim === 'ml' ? v / b : v * 100 / b
  const nut = [num(draft.kc), num(draft.prot), num(draft.fat), num(draft.carb), num(draft.fib)].map(v => legacy ? v : perBase(v))
  const portionN = num(draft.portion)
  const portionNote = !legacy && portionN > 0 && priceVal != null
    ? (() => {
        const f = dim === 'unit' ? portionN : dim === 'ml' ? portionN : portionN / 100
        const kc = nut[0] != null ? Math.round(nut[0] * f) : null
        const u = dim === 'unit' ? (portionN === 1 ? ' unit' : ' units') : dim === 'ml' ? ' ml' : ' g'
        return `${portionN}${u} → $${(priceVal * f).toFixed(2)}${kc != null ? ` · ${kc} kcal` : ''}`
      })()
    : null

  function save() {
    if (!draft.name.trim()) return
    const store = draft.store.trim()
    const data = { name: draft.name.trim(), cat: draft.cat, store, organic: draft.organic, temporary: draft.temporary, rotation: draft.rotation || '', tags: shownTags }
    // Snack role: only written when you change it (the generator ignores ingredients without a role)
    if (draft.snackRole !== initial.snackRole || draft.snackTaste !== initial.snackTaste) { data.snackRole = draft.snackRole; data.snackTaste = draft.snackTaste }
    // Parte comestible (solo para lo que se pesa en gramos): kcal y macros son de lo que se come, el precio del peso comprado.
    if (!legacy && dim === 'g') { const e = num(draft.edible); data.edible = e > 0 && e < 100 ? e / 100 : 1 }
    if (legacy) {
      data.pack = draft.pack
      data.per = draft.per
      if (num(draft.price) != null) data[U.price] = num(draft.price) / U.f
      const n = [num(draft.kc), num(draft.prot), num(draft.fat), num(draft.carb), num(draft.fib)]
      U.nut.forEach((field, i) => { if (field && n[i] != null) data[field] = n[i] / U.f })
    } else {
      // Cambiar de peso a volumen (o a unidades) en uno que ya existe: se vacían los campos
      // de la medida antigua, si no el precio por 100 g mandaría sobre el de litros.
      for (const t of ['per100', 'perUnit', 'perML']) if (t !== type) for (const f of [UNIT[t].price, ...UNIT[t].nut]) if (f) data[f] = null
      if (priceVal != null) data[T.price] = priceVal
      T.nut.forEach((field, i) => { if (field && nut[i] != null) data[field] = nut[i] })
      if (packOk) Object.assign(data, { packQty: pQty, packUnit: draft.packUnit, packPrice: pPrice, pack: formatPack({ qty: pQty, unit: draft.packUnit, price: pPrice }) })
      data.keeps = shownKeeps
      if (portionN > 0) { data.portionG = portionN; data.per = portionNote } else data.per = ing?.per ?? ''
    }
    if (isNew) {
      const key = 'custom-' + data.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
      addCustomIngredient(key, { ...data, isCustom: true })
    } else {
      setIngredientOverride(ingKey, data)
      // un precio antiguo en priceOverrides taparía el nuevo (se aplica después)
      if (priceVal != null && priceOverrides[ingKey]?.[T.price] != null) setPriceOverride(ingKey, T.price, priceVal)
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
              <span className="ig-field-head"><span className="mp-eyebrow">What it is</span><span className="mp-muted" style={{ fontSize: 11.5 }}>Used by the rules and the smart week</span></span>
              <div className="ig-chips">
                {TAGS.map(t => {
                  const on = shownTags.includes(t)
                  return <button key={t} type="button" className={`ig-chip ig-tag${on ? ' is-on' : ''}`} aria-pressed={on} title={TAG_HINT[t]} onClick={() => toggleTag(t)}>{on && <Icon name="check" size={11} stroke={3} />}{TAG_LABEL[t]}</button>
                })}
              </div>
            </div>

            <div className="ig-field">
              <span className="ig-field-head"><span className="mp-eyebrow">Snack role</span><span className="mp-muted" style={{ fontSize: 11.5 }}>Used by «Plan snacks». No role = it is never picked</span></span>
              <div className="ig-chips" style={{ alignItems: 'center' }}>
                <select className="ig-input" style={{ minWidth: 190 }} value={draft.snackRole} onChange={e => set('snackRole', e.target.value)} aria-label="Snack role">
                  <option value="">— none</option>
                  {Object.entries(ROLES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
                {draft.snackRole && (
                  <select className="ig-input" value={draft.snackTaste} onChange={e => set('snackTaste', e.target.value)} aria-label="Taste">
                    {Object.entries(TASTES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                )}
                {!draft.snackRole && suggestRole({ name: draft.name }) && (
                  <button type="button" className="ig-chip" onClick={() => { const sg = suggestRole({ name: draft.name }); set('snackRole', sg.role); set('snackTaste', sg.taste) }}>
                    Suggested: {ROLES[suggestRole({ name: draft.name }).role]}
                  </button>
                )}
              </div>
            </div>

            {legacy ? (
              <>
                <div className="ig-field">
                  <span className="mp-eyebrow">Price</span>
                  <div className="ig-grid2">
                    <label className="ig-input"><span>{U.label}</span><input inputMode="decimal" value={draft.price} onChange={e => set('price', e.target.value)} placeholder="0.00" /></label>
                    <label className="ig-input"><span>kcal {U.per}</span><input inputMode="decimal" value={draft.kc} onChange={e => set('kc', e.target.value)} placeholder="0" /></label>
                  </div>
                </div>
                <label className="ig-input"><span>Note</span><input value={draft.per} onChange={e => set('per', e.target.value)} placeholder="use → $0.05" /></label>
              </>
            ) : (
              <>
                <div className="ig-field">
                  <span className="mp-eyebrow">The pack you buy</span>
                  <div className="ig-pack">
                    <label className="ig-input ig-pack-qty"><span>Amount</span><input inputMode="decimal" value={draft.packQty} onChange={e => set('packQty', e.target.value)} placeholder={dim === 'unit' ? '30' : '1'} /></label>
                    <div className="ig-input ig-pack-unit"><span>Unit</span>
                      <Segmented label="Pack unit" value={draft.packUnit} onChange={v => set('packUnit', v)}
                        options={['g', 'kg', 'lb', 'oz', 'ml', 'L', 'unit'].map(u => ({ value: u, label: u === 'unit' ? 'units' : u }))} />
                    </div>
                    <label className="ig-input ig-pack-price"><span>Price paid ($)</span><input inputMode="decimal" value={draft.packPrice} onChange={e => set('packPrice', e.target.value)} placeholder="14.00" /></label>
                  </div>
                  {packOk ? (
                    <span className="ig-derived mp-num">= ${dim === 'unit' ? derivedPrice.toFixed(2) + ' each' : dim === 'ml' ? (derivedPrice * 100).toFixed(3) + ' / 100 ml' : derivedPrice.toFixed(3) + ' / 100 g'}</span>
                  ) : (
                    <label className="ig-derived ig-derived-input"><span>No fixed pack? Price {T.label.replace('$ ', '')}:</span>
                      <input inputMode="decimal" value={draft.price} onChange={e => set('price', e.target.value)} placeholder="0.00" /></label>
                  )}
                </div>

                <div className="ig-field">
                  <span className="mp-eyebrow">How long it keeps</span>
                  <Segmented label="How long it keeps" value={shownKeeps} onChange={v => { setKeepsTouched(true); set('keeps', v) }} options={KEEPS.map(k => ({ value: k, label: KEEPS_LABEL[k] }))} />
                </div>

                <div className="ig-field">
                  <span className="mp-eyebrow">Nutrition · as on the label</span>
                  {ing?.nutEst && <span className="ig-derived" style={{ color: '#8A5E08' }}>Estimated from the name — check the label and Done to keep it.</span>}
                  <div className="ig-grid4">
                    <label className="ig-input"><span>Label per ({dim === 'unit' ? 'units' : BASIS_UNIT[dim]})</span><input inputMode="decimal" value={draft.basis} onChange={e => setBasis(e.target.value)} placeholder={dim === 'unit' ? '1' : '100'} /></label>
                    <label className="ig-input"><span>kcal</span><input inputMode="decimal" value={draft.kc} onChange={e => setNut('kc', e.target.value)} placeholder="0" /></label>
                    {T.nut[1] && <label className="ig-input"><span>Protein (g)</span><input inputMode="decimal" value={draft.prot} onChange={e => setNut('prot', e.target.value)} placeholder="0" /></label>}
                    {T.nut[2] && <label className="ig-input"><span>Fat (g)</span><input inputMode="decimal" value={draft.fat} onChange={e => setNut('fat', e.target.value)} placeholder="0" /></label>}
                    {T.nut[3] && <label className="ig-input"><span>Carbs (g)</span><input inputMode="decimal" value={draft.carb} onChange={e => setNut('carb', e.target.value)} placeholder="0" /></label>}
                    {T.nut[4] && <label className="ig-input"><span>Fiber (g)</span><input inputMode="decimal" value={draft.fib} onChange={e => setNut('fib', e.target.value)} placeholder="0" /></label>}
                    {!legacy && dim === 'g' && <label className="ig-input" title="Share of the weight you buy that you actually eat. Bone-in cuts: the label values are for the meat, the price is for the whole piece."><span>Edible part (%)</span><input inputMode="decimal" value={draft.edible} onChange={e => set('edible', e.target.value)} placeholder="100" /></label>}
                  </div>
                </div>

                <div className="ig-grid3" style={{ alignItems: 'end' }}>
                  <label className="ig-input"><span>Usual portion ({dim === 'unit' ? 'units' : BASIS_UNIT[dim]})</span>
                    <input inputMode="decimal" value={draft.portion} onChange={e => set('portion', e.target.value)} placeholder={dim === 'unit' ? '1' : '100'} /></label>
                  <button type="button" className={`ig-chip${draft.organic ? ' is-on' : ''}`} aria-pressed={draft.organic} onClick={() => set('organic', !draft.organic)}
                    style={{ height: 44, justifyContent: 'center', ...(draft.organic ? { background: '#2F9E5B', color: '#fff' } : {}) }}>
                    <Icon name="leaf" size={14} />Organic
                  </button>
                  <button type="button" className={`ig-chip${draft.temporary ? ' is-on' : ''}`} aria-pressed={draft.temporary} onClick={() => set('temporary', !draft.temporary)}
                    title="A one-off buy (e.g. from a far store). Smart weeks only plan with it while it's in the pantry."
                    style={{ height: 44, justifyContent: 'center', ...(draft.temporary ? { background: '#C1850C', color: '#fff' } : {}) }}>
                    <Icon name="warn" size={14} />Temporary
                  </button>
                </div>
                <div className="ig-grid3" style={{ alignItems: 'end' }}>
                  <button type="button" className={`ig-chip${draft.rotation ? ' is-on' : ''}`} aria-pressed={!!draft.rotation} onClick={() => set('rotation', draft.rotation ? '' : 'bulk-veg')}
                    title="Bulk veg that takes turns in the freezer. While one of the group is in the pantry, the others are skipped by smart weeks; if none is, all count."
                    style={{ height: 44, justifyContent: 'center', ...(draft.rotation ? { background: '#2A58A8', color: '#fff' } : {}) }}>
                    <Icon name="shuffle" size={14} />Rotation
                  </button>
                </div>
                {portionNote && <span className="ig-derived mp-num" style={{ marginTop: -8 }}>{portionNote}</span>}
              </>
            )}
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
