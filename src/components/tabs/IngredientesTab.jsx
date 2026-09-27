import { useState, useMemo, useEffect } from 'react'
import useStore, { selectAllIng, selectAllCats, selectCatOrder } from '../../store/useStore'
import StoresSheet from '../meal/StoresSheet'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'
import IngredienteSheet from '../meal/IngredienteSheet'
import { ING } from '../../data/ingredients'
import { ingredientUnitType } from '../../engine/calc'
import { storeOf, storeColor, storesIn, NO_STORE } from '../../lib/stores'

// ─── helpers ──────────────────────────────────────────────────────────────

function priceLabel(i) {
  if (i.pend)       return '—'
  if (i.flat === 0) return '$0.00'
  switch (ingredientUnitType(i)) {
    case 'per100':     return `$${i.per100.toFixed(3)}/100g`
    case 'perUnit':    return `$${i.perUnit.toFixed(2)}/unit`
    case 'perML':      return `$${(i.perML * 100).toFixed(3)}/100ml`
    case 'perServing': return `~$${i.perServing.toFixed(2)}/serving`
    default:           return '—'
  }
}

function kcalLabel(i) {
  // kcal y, si los hay, proteína · hidratos · grasa en la misma base.
  const pick = (...ks) => ks.map(k => i[k]).find(v => v != null)
  let base = null, per = ''
  if (i.kc   != null) { base = i.kc; per = '/100g' }
  else if (i.kcu  != null) { base = i.kcu; per = '/unit' }
  else if (i.kcml != null) { base = Math.round(i.kcml * 100); per = '/100ml' }
  else if (i.kcs  != null) { base = i.kcs; per = '/serving' }
  else if (i.kcf  != null) return `${i.kcf} kcal`
  if (base == null) return ''
  const m = i.kcml != null ? 100 : 1
  const r = v => (v == null ? null : Math.round(v * m * 10) / 10)
  const P = r(pick('prot', 'protu', 'protml', 'prots')), C = r(pick('carb', 'carbu', 'carbml', 'carbs')), F = r(pick('fat', 'fatu', 'fatml', 'fats'))
  const macros = [P != null && `P ${P}`, C != null && `C ${C}`, F != null && `F ${F}`].filter(Boolean).join(' · ')
  return `${i.nutEst ? '≈ ' : ''}${base} kcal${per}${macros ? ` · ${macros}` : ''}`
}

// 'flat' no tiene input de precio propio en el formulario de edicion (se
// trata como precio fijo no editable ahi), asi que se excluye del resultado.
function priceField(i) {
  const t = ingredientUnitType(i)
  return t === 'flat' ? null : t
}

function isBaseIng(key) { return !!ING[key] }

// ─── Tarjeta ────────────────────────────────────────────────────────────────
// Toda la tarjeta abre la ficha; la pastilla de tienda abre un menú para
// cambiarla sin entrar.
function IngCard({ ingKey, ing, modified, stores, menuOpen, onMenu, onPickStore, onOpen }) {
  const store = storeOf(ing)
  const c = storeColor(store)
  return (
    <div className="ig-card mp-in">
      <button type="button" className="ig-hit" aria-label={`Open ${ing.name}`} onClick={onOpen} />
      <span className="ig-card-top">
        <button type="button" className="ig-store" aria-haspopup="menu" aria-expanded={menuOpen} onClick={onMenu}
          style={store ? { background: c + '1F', color: c } : undefined}>
          <span className="mp-dot" style={{ background: store ? c : 'rgba(110,80,50,0.35)' }} />{store ?? 'No store'}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {ing.organic && <span className="mp-tag" style={{ background: 'rgba(47,158,91,0.13)', color: '#1F7A45' }}>organic</span>}
        {ing.est && !ing.pend && <span className="mp-tag" style={{ background: 'rgba(110,80,50,0.08)', color: 'var(--c-ink-3)' }}>estimated</span>}
        {modified && <span className="mp-tag" style={{ background: 'rgba(224,162,27,0.16)', color: '#8A5E08' }}>edited</span>}
      </span>
      <span className="ig-name">{ing.name}</span>
      <span className="ig-price mp-num">{priceLabel(ing)}</span>
      <span className="ig-meta mp-num">{[kcalLabel(ing), ing.pack].filter(Boolean).join(' · ')}</span>
      {menuOpen && (
        <>
          <div className="ig-menu" role="menu" aria-label="Store">
            {stores.map(s => (
              <button key={s.name} type="button" role="menuitemradio" aria-checked={s.name === store} onClick={() => onPickStore(s.name)}>
                <span className="mp-dot" style={{ background: storeColor(s.name) }} />{s.name}
                {s.name === store && <Icon name="check" size={13} stroke={2.6} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
            <button type="button" role="menuitemradio" aria-checked={!store} onClick={() => onPickStore('')}>
              <span className="mp-dot" style={{ background: 'rgba(110,80,50,0.35)' }} />No store
              {!store && <Icon name="check" size={13} stroke={2.6} style={{ marginLeft: 'auto' }} />}
            </button>
            <button type="button" role="menuitem" onClick={onOpen} style={{ color: 'var(--c-ink-3)' }}><Icon name="plus" size={12} stroke={2.6} />Other store…</button>
          </div>
        </>
      )}
    </div>
  )
}

function readPref(k, fb) { try { return localStorage.getItem(k) || fb } catch { return fb } }

// ─── Main tab ─────────────────────────────────────────────────────────────
export default function IngredientesTab() {
  const allIng  = useStore(selectAllIng)
  const allCats = useStore(selectAllCats)
  const priceOverrides      = useStore(s => s.priceOverrides)
  const ingredientOverrides = useStore(s => s.ingredientOverrides)
  const customCategories    = useStore(s => s.customCategories)
  const catOrder = useStore(selectCatOrder)
  const extraStores = useStore(s => s.extraStores)
  useStore(s => s.storeColors); useStore(s => s.catColors) // repintar al cambiar colores
  const deletedIngredients  = useStore(s => s.deletedIngredients)
  const restoreIngredient   = useStore(s => s.restoreIngredient)
  const setIngredientOverride = useStore(s => s.setIngredientOverride)

  const [open, setOpen] = useState(undefined)   // undefined = cerrada, null = nuevo, key
  const [menu, setMenu] = useState(null)
  const [q, setQ] = useState('')
  const [group, setGroupState] = useState(() => readPref('mp-ing-group', 'store'))
  const [storeF, setStoreF] = useState('all')
  const [manage, setManage] = useState(null) // null | 'stores' | 'cats'
  const setGroup = g => { setGroupState(g); try { localStorage.setItem('mp-ing-group', g) } catch {} }

  // Cerrar el menú de tienda al tocar fuera o con Esc
  useEffect(() => {
    if (!menu) return
    const onDown = e => { if (!e.target.closest('.ig-menu, .ig-store')) setMenu(null) }
    const onKey = e => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey) }
  }, [menu])

  const stores = useMemo(() => storesIn(allIng, extraStores), [allIng, extraStores])
  const keys = Object.keys(allIng).filter(k => !allIng[k].hideInTable)
  const noStore = keys.filter(k => !storeOf(allIng[k])).length
  const needle = q.trim().toLowerCase()
  const visible = keys.filter(k => {
    const ing = allIng[k], st = storeOf(ing)
    if (needle && !(`${ing.name} ${ing.brand ?? ''}`.toLowerCase().includes(needle))) return false
    if (storeF === 'all') return true
    if (storeF === NO_STORE) return !st
    return st === storeF
  }).sort((a, b) => allIng[a].name.localeCompare(allIng[b].name))

  const sections = group === 'store'
    ? [...stores.map(s => ({ id: s.name, label: s.name, color: storeColor(s.name), keys: visible.filter(k => storeOf(allIng[k]) === s.name) })),
       { id: NO_STORE, label: NO_STORE, color: 'rgba(110,80,50,0.35)', keys: visible.filter(k => !storeOf(allIng[k])) }]
    : catOrder.map(c => ({ id: c, label: allCats[c] ?? c, custom: customCategories.some(x => x.key === c), keys: visible.filter(k => allIng[k].cat === c) }))

  const chips = [{ id: 'all', label: `All · ${keys.length}` }, ...stores.map(s => ({ id: s.name, label: `${s.name} · ${s.count}`, color: storeColor(s.name) })), { id: NO_STORE, label: `No store · ${noStore}` }]

  return (
    <div>
      <div className="mp-page-head mp-rise">
        <div className="mp-page-title">
          <h1>Ingredients</h1>
          <span>{keys.length} ingredients · {stores.length} stores{noStore ? ` · ${noStore} without a store` : ''}</span>
        </div>
        <div className="mp-page-tools">
          <label className="mp-search" style={{ width: 260 }}>
            <Icon name="search" size={14} stroke={2.4} />
            <span className="sr-only">Search ingredient</span>
            <input placeholder="Search ingredient or brand…" value={q} onChange={e => setQ(e.target.value)} />
          </label>
          <Segmented label="Group by" value={group} onChange={setGroup} options={[{ value: 'store', label: 'By store' }, { value: 'cat', label: 'By category' }]} />
          <button className="mp-btn mp-btn-glass" onClick={() => setManage(group === 'store' ? 'stores' : 'cats')}><Icon name="edit" size={14} />Stores & categories</button>
          <button className="mp-btn mp-btn-dark" onClick={() => setOpen(null)}><Icon name="plus" size={14} stroke={2.6} />New ingredient</button>
        </div>
      </div>

      <nav aria-label="Filter by store" className="ig-filter mp-rise" style={{ animationDelay: '60ms' }}>
        {chips.map(c => {
          const on = storeF === c.id
          return (
            <button key={c.id} type="button" className={`ig-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => setStoreF(c.id)}
              style={on ? { background: c.color ?? 'var(--c-ink)', color: '#fff', boxShadow: c.color ? `0 6px 14px ${c.color}55` : undefined } : undefined}>
              {c.color && <span className="mp-dot" style={{ background: on ? '#fff' : c.color }} />}{c.label}
            </button>
          )
        })}
      </nav>

      {visible.length === 0 && <div className="mp-empty" style={{ padding: 40 }}>Nothing matches your search.</div>}

      {sections.filter(sec => sec.keys.length).map(sec => (
        <section key={sec.id} style={{ marginBottom: 26 }}>
          <h3 className="ig-sec">
            {sec.color && <span className="mp-dot" style={{ width: 10, height: 10, background: sec.color }} />}
            {sec.label} <span className="mp-muted" style={{ fontWeight: 500, fontSize: 13 }}>{sec.keys.length}</span>
            {sec.id !== NO_STORE && <button type="button" className="mw-act ig-sec-edit" title={group === 'store' ? 'Edit stores' : 'Edit categories'} aria-label={`Edit ${sec.label}`} onClick={() => setManage(group === 'store' ? 'stores' : 'cats')}><Icon name="edit" size={13} /></button>}
          </h3>
          <div className="ig-grid">
            {sec.keys.map(k => (
              <IngCard key={k} ingKey={k} ing={allIng[k]} stores={stores}
                modified={!!(ingredientOverrides[k] || priceOverrides[k])}
                menuOpen={menu === k} onMenu={() => setMenu(menu === k ? null : k)}
                onPickStore={name => { setIngredientOverride(k, { store: name }); setMenu(null) }}
                onOpen={() => { setMenu(null); setOpen(k) }} />
            ))}
          </div>
        </section>
      ))}

      {deletedIngredients.length > 0 && (
        <section className="mp-card mp-glass" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="mp-eyebrow">Hidden · {deletedIngredients.length}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {deletedIngredients.map(k => (
              <button key={k} className="ig-chip" onClick={() => restoreIngredient(k)}><Icon name="repeat" size={12} />{ING[k]?.name ?? k}</button>
            ))}
          </div>
        </section>
      )}

      {open !== undefined && <IngredienteSheet key={open ?? 'new'} ingKey={open} onClose={() => setOpen(undefined)} />}
      {manage && <StoresSheet initialTab={manage} onClose={() => setManage(null)} />}
    </div>
  )
}
