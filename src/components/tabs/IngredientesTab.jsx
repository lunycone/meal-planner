import { useState } from 'react'
import useStore, { selectAllIng, selectAllCats } from '../../store/useStore'
import Icon from '../ui/Icon'
import { CAT_ORDER } from '../../data/ingredients'
import { ING } from '../../data/ingredients'
import { ingredientUnitType } from '../../engine/calc'

// ─── helpers ──────────────────────────────────────────────────────────────

function priceLabel(i) {
  if (i.pend)       return '—'
  if (i.flat === 0) return '$0.00'
  switch (ingredientUnitType(i)) {
    case 'per100':     return `$${i.per100.toFixed(3)}/100g`
    case 'perUnit':    return `$${i.perUnit.toFixed(2)}/ud`
    case 'perML':      return `$${(i.perML * 100).toFixed(3)}/100ml`
    case 'perServing': return `~$${i.perServing.toFixed(2)}/plato`
    default:           return '—'
  }
}

function kcalLabel(i) {
  if (i.kc   != null) return `${i.kc} kcal/100g`
  if (i.kcu  != null) return `${i.kcu} kcal/ud`
  if (i.kcml != null) return `${Math.round(i.kcml * 100)} kcal/100ml`
  if (i.kcs  != null) return `~${i.kcs} kcal`
  if (i.kcf  != null) return `${i.kcf} kcal`
  return ''
}

// 'flat' no tiene input de precio propio en el formulario de edicion (se
// trata como precio fijo no editable ahi), asi que se excluye del resultado.
function priceField(i) {
  const t = ingredientUnitType(i)
  return t === 'flat' ? null : t
}

function isBaseIng(key) { return !!ING[key] }

// ─── Edit form (inline, replaces card content) ────────────────────────────

function IngEditForm({ ingKey, ing, onClose }) {
  const setIngredientOverride  = useStore(s => s.setIngredientOverride)
  const resetIngredientOverride = useStore(s => s.resetIngredientOverride)
  const resetPrice             = useStore(s => s.resetPrice)
  const deleteIngredient       = useStore(s => s.deleteIngredient)
  const removeCustomIngredient = useStore(s => s.removeCustomIngredient)
  const allCats = useStore(selectAllCats)
  const catOrder = [...CAT_ORDER, ...useStore(s => s.customCategories).map(c => c.key)]

  const field = priceField(ing)

  const [name,  setName]  = useState(ing.name)
  const [pack,  setPack]  = useState(ing.pack ?? '')
  const [per,   setPer]   = useState(ing.per  ?? '')
  const [cat,   setCat]   = useState(ing.cat  ?? 'otro')
  const [price, setPrice] = useState(field ? String(ing[field] ?? '') : '')
  const [kcal,  setKcal]  = useState(
    ing.kc != null ? String(ing.kc) :
    ing.kcu != null ? String(ing.kcu) : ''
  )
  const [organic, setOrganic] = useState(!!ing.organic)
  const [confirmDel, setConfirmDel] = useState(false)

  function save() {
    const overrideData = { name: name.trim(), pack, per, cat, organic }
    if (field && price !== '') overrideData[field] = parseFloat(price)
    // kcal
    const kcNum = parseFloat(kcal)
    if (!isNaN(kcNum)) {
      if      (ing.kc  != null) overrideData.kc  = kcNum
      else if (ing.kcu != null) overrideData.kcu = kcNum
    }
    setIngredientOverride(ingKey, overrideData)
    onClose()
  }

  function resetAll() {
    resetIngredientOverride(ingKey)
    resetPrice(ingKey)
    onClose()
  }

  function doDelete() {
    if (isBaseIng(ingKey)) {
      deleteIngredient(ingKey)
    } else {
      removeCustomIngredient(ingKey)
    }
    onClose()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Name + category */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>Nombre</div>
          <input className="form-input" style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>Categoría</div>
          <select className="form-input" style={{ width: '100%' }} value={cat} onChange={e => setCat(e.target.value)}>
            {catOrder.map(k => <option key={k} value={k}>{allCats[k] ?? k}</option>)}
          </select>
        </div>
      </div>

      {/* Pack */}
      <div>
        <div style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>Descripción / pack</div>
        <input className="form-input" style={{ width: '100%' }} value={pack} onChange={e => setPack(e.target.value)} placeholder="Ej: 1 kg · $5.00" />
      </div>

      {/* Price + kcal */}
      <div style={{ display: 'flex', gap: 6 }}>
        {field && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
              Precio ({field === 'per100' ? '$/100g' : field === 'perUnit' ? '$/ud' : field === 'perML' ? '$/ml' : '$/plato'})
            </div>
            <input className="form-input" style={{ width: '100%' }} type="number" step="0.001" min="0" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>kcal</div>
          <input className="form-input" style={{ width: '100%' }} type="number" min="0" value={kcal} onChange={e => setKcal(e.target.value)} placeholder="por 100g / ud" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>Nota ración</div>
          <input className="form-input" style={{ width: '100%' }} value={per} onChange={e => setPer(e.target.value)} placeholder="80g → $0.12" />
        </div>
      </div>

      {/* Orgánico */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--t-text)', cursor: 'pointer' }}>
        <input type="checkbox" checked={organic} onChange={e => setOrganic(e.target.checked)} />
        Orgánico
      </label>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
        <button className="btn-primary" onClick={save}>Guardar</button>
        <button className="btn-ghost"   onClick={onClose}>Cancelar</button>
        {isBaseIng(ingKey) && (
          <button className="btn-ghost" onClick={resetAll} style={{ marginLeft: 'auto', fontSize: '0.72rem' }}>↺ Restaurar original</button>
        )}
        {!confirmDel
          ? <button className="btn-danger" onClick={() => setConfirmDel(true)} style={{ marginLeft: isBaseIng(ingKey) ? 0 : 'auto' }}>✕ Eliminar</button>
          : (
            <span style={{ fontSize: '0.78rem', display: 'flex', gap: 6, alignItems: 'center' }}>
              ¿Eliminar{isBaseIng(ingKey) ? ' (se ocultará)' : ''}?
              <button className="btn-danger" onClick={doDelete}>Sí</button>
              <button className="btn-ghost" onClick={() => setConfirmDel(false)}>No</button>
            </span>
          )
        }
      </div>
    </div>
  )
}

// ─── Single ingredient card ───────────────────────────────────────────────

function IngCard({ ingKey, ing, isModified, editingKey, setEditingKey }) {
  const isEditing = editingKey === ingKey
  const isBase    = isBaseIng(ingKey)

  return (
    <div className={`ing-card${isModified ? ' modified' : ''}`} style={isEditing ? { borderColor: 'var(--brown)', gridColumn: 'span 2' } : {}}>
      {isEditing ? (
        <IngEditForm ingKey={ingKey} ing={ing} onClose={() => setEditingKey(null)} />
      ) : (
        <>
          <div className="in-head">
            <span className="in-name">{ing.name}</span>
            <button
              className="card-edit-btn"
              onClick={() => setEditingKey(ingKey)}
              aria-label={`Editar ${ing.name}`}
              title="Editar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </button>
          </div>
          {(ing.tag || ing.organic || ing.pend || ing.est || ing.jessica || isModified || ing.isCustom) && (
            <span className="in-tags">
              {ing.tag === 'vaca'  && <span className="badge badge-vaca">vaca</span>}
              {ing.tag === 'oveja' && <span className="badge badge-oveja">oveja</span>}
              {ing.organic         && <span className="badge badge-organic">orgánico</span>}
              {ing.pend            && <span className="badge badge-pend">pendiente</span>}
              {ing.est && !ing.pend && <span className="badge badge-est">est.</span>}
              {ing.jessica         && <span className="badge badge-jessica">Jessica</span>}
              {isModified          && <span className="badge badge-modified">editado</span>}
              {ing.isCustom        && <span className="badge badge-custom">custom</span>}
            </span>
          )}
          <div className="ihero">{ing.per}</div>
          <div className="iref">{[priceLabel(ing), kcalLabel(ing)].filter(Boolean).join(' · ')}</div>
          {ing.note && <div className="inote">{ing.note}</div>}
          {ing.brand && (
            <div style={{ fontSize: '0.68rem' }}>
              <span style={{ color: 'var(--brown)', fontWeight: 600 }}>{ing.brand}</span>
              <span style={{ color: 'var(--muted)' }}> · {ing.store}</span>
            </div>
          )}
          <div className="ipack">{ing.pack}</div>
        </>
      )}
    </div>
  )
}

// ─── Add ingredient form ──────────────────────────────────────────────────

function AddIngForm() {
  const addCustomIngredient = useStore(s => s.addCustomIngredient)
  const addCustomCategory   = useStore(s => s.addCustomCategory)
  const allCats  = useStore(selectAllCats)
  const catOrder = [...CAT_ORDER, ...useStore(s => s.customCategories).map(c => c.key)]

  const [open, setOpen] = useState(false)
  const [name, setName]   = useState('')
  const [cat,  setCat]    = useState('otro')
  const [pack, setPack]   = useState('')
  const [price, setPrice] = useState('')
  const [kc,   setKc]     = useState('')
  const [newCatLabel, setNewCatLabel] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const key = 'custom-' + name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    addCustomIngredient(key, {
      name: name.trim(), cat, pack: pack || '—', per: '', isCustom: true,
      ...(price ? { per100: parseFloat(price) } : {}),
      ...(kc    ? { kc:    parseFloat(kc) }    : {}),
    })
    setName(''); setPack(''); setPrice(''); setKc(''); setOpen(false)
  }

  function addCat() {
    if (newCatLabel.trim()) { addCustomCategory(newCatLabel.trim()); setNewCatLabel('') }
  }

  if (!open) {
    return (
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn-ghost" onClick={() => setOpen(true)}>+ Añadir ingrediente</button>
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            className="form-input" style={{ width: 160 }}
            placeholder="Nueva categoría…"
            value={newCatLabel}
            onChange={e => setNewCatLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCat()}
          />
          <button className="btn-ghost" onClick={addCat}>+ Categoría</button>
        </div>
      </div>
    )
  }

  return (
    <form className="add-ing-form" onSubmit={submit}>
      <div className="section-label">Nuevo ingrediente</div>
      <div className="form-row">
        <div className="form-field" style={{ flex: 2 }}>
          <label>Nombre *</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Quinoa" required />
        </div>
        <div className="form-field">
          <label>Categoría</label>
          <select className="form-input" value={cat} onChange={e => setCat(e.target.value)}>
            {catOrder.map(k => <option key={k} value={k}>{allCats[k] ?? k}</option>)}
          </select>
        </div>
        <div className="form-field" style={{ flex: 2 }}>
          <label>Pack / descripción</label>
          <input className="form-input" value={pack} onChange={e => setPack(e.target.value)} placeholder="500g · $3.99" />
        </div>
        <div className="form-field" style={{ width: 80 }}>
          <label>$/100g</label>
          <input className="form-input" type="number" step="0.001" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div className="form-field" style={{ width: 80 }}>
          <label>kcal/100g</label>
          <input className="form-input" type="number" min="0" value={kc} onChange={e => setKc(e.target.value)} placeholder="0" />
        </div>
        <button type="submit" className="btn-primary">Añadir</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </form>
  )
}

// ─── Deleted ingredients section ─────────────────────────────────────────

function DeletedSection() {
  const deletedIngredients = useStore(s => s.deletedIngredients)
  const restoreIngredient  = useStore(s => s.restoreIngredient)
  if (!deletedIngredients.length) return null
  return (
    <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f6f0', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
      <div className="section-label" style={{ marginBottom: '0.5rem' }}>Ingredientes ocultos ({deletedIngredients.length})</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {deletedIngredients.map(k => (
          <button key={k} className="btn-ghost" style={{ fontSize: '0.76rem' }} onClick={() => restoreIngredient(k)}>
            ↺ {ING[k]?.name ?? k}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────

export default function IngredientesTab() {
  const allIng  = useStore(selectAllIng)
  const allCats = useStore(selectAllCats)
  const overrides           = useStore(s => s.priceOverrides)
  const ingredientOverrides = useStore(s => s.ingredientOverrides)
  const customIngredients   = useStore(s => s.customIngredients)
  const customCategories    = useStore(s => s.customCategories)
  const removeCustomCategory = useStore(s => s.removeCustomCategory)

  const [editingKey, setEditingKey] = useState(null)
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()

  const catOrder = [...CAT_ORDER, ...customCategories.map(c => c.key)]

  return (
    <div>
      <div className="mp-page-head mp-rise">
        <div className="mp-page-title">
          <h1>Ingredientes</h1>
          <span>{Object.keys(allIng).length} ingredientes · precio, pack y nutrientes — cambia uno y se recalcula toda la app</span>
        </div>
        <div className="mp-page-tools">
          <label className="mp-search" style={{ width: 280 }}>
            <Icon name="search" size={14} stroke={2.4} />
            <span className="sr-only">Buscar ingrediente</span>
            <input placeholder="Buscar ingrediente…" value={q} onChange={e => setQ(e.target.value)} />
          </label>
        </div>
      </div>
      <AddIngForm />

      {catOrder.map(cat => {
        const keys = Object.keys(allIng).filter(k => allIng[k].cat === cat && !allIng[k].hideInTable && (!needle || allIng[k].name.toLowerCase().includes(needle)))
        if (!keys.length) return null
        const isCustomCat = customCategories.some(c => c.key === cat)
        return (
          <div key={cat}>
            <div className="section-label" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              {allCats[cat] ?? cat}
              {isCustomCat && (
                <button className="btn-danger" style={{ fontSize: '0.6rem', padding: '1px 7px' }} onClick={() => removeCustomCategory(cat)}>
                  ✕ eliminar categoría
                </button>
              )}
            </div>
            <div className="ing-grid">
              {keys.map(k => (
                <IngCard
                  key={k}
                  ingKey={k}
                  ing={allIng[k]}
                  isModified={!!(overrides[k] || ingredientOverrides[k])}
                  editingKey={editingKey}
                  setEditingKey={setEditingKey}
                />
              ))}
            </div>
          </div>
        )
      })}

      <DeletedSection />
    </div>
  )
}
