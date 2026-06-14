import { useState } from 'react'
import useStore, { selectAllIng, selectAllCats } from '../../store/useStore'
import { CAT_ORDER } from '../../data/ingredients'
import { ING } from '../../data/ingredients'

// ─── helpers ──────────────────────────────────────────────────────────────

function priceLabel(i) {
  if (i.pend)             return '—'
  if (i.flat === 0)       return '$0.00'
  if (i.per100    != null) return `$${i.per100.toFixed(3)}/100g`
  if (i.perUnit   != null) return `$${i.perUnit.toFixed(2)}/ud`
  if (i.perML     != null) return `$${(i.perML * 100).toFixed(3)}/100ml`
  if (i.perServing != null) return `~$${i.perServing.toFixed(2)}/plato`
  return '—'
}

function kcalLabel(i) {
  if (i.kc   != null) return `${i.kc} kcal/100g`
  if (i.kcu  != null) return `${i.kcu} kcal/ud`
  if (i.kcml != null) return `${Math.round(i.kcml * 100)} kcal/100ml`
  if (i.kcs  != null) return `~${i.kcs} kcal`
  if (i.kcf  != null) return `${i.kcf} kcal`
  return ''
}

function priceField(i) {
  if (i.per100    != null) return 'per100'
  if (i.perUnit   != null) return 'perUnit'
  if (i.perML     != null) return 'perML'
  if (i.perServing != null) return 'perServing'
  return null
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
  const [confirmDel, setConfirmDel] = useState(false)

  function save() {
    const overrideData = { name: name.trim(), pack, per, cat }
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
          <div className="in" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              {ing.name}
              {ing.tag === 'vaca'  && <span className="badge badge-vaca">vaca</span>}
              {ing.tag === 'oveja' && <span className="badge badge-oveja">oveja</span>}
              {ing.pend            && <span className="badge badge-pend">pendiente</span>}
              {ing.est && !ing.pend && <span className="badge badge-est">est.</span>}
              {ing.jessica         && <span className="badge badge-jessica">Jessica</span>}
              {isModified          && <span className="badge badge-modified">editado</span>}
              {ing.isCustom        && <span className="badge badge-custom">custom</span>}
            </span>
            <button
              className="card-edit-btn"
              onClick={() => setEditingKey(ingKey)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.78rem', padding: '0 2px', flexShrink: 0 }}
              title="Editar"
            >
              ✎
            </button>
          </div>
          <div className="ipack">{ing.pack}</div>
          <div className="irow">
            <span className="iprice">{priceLabel(ing)}</span>
            <span className="ikcal">{kcalLabel(ing)}</span>
          </div>
          <div className="iper">{ing.per}</div>
          {ing.note && <div className="inote">{ing.note}</div>}
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

  const catOrder = [...CAT_ORDER, ...customCategories.map(c => c.key)]

  return (
    <div>
      <AddIngForm />

      {catOrder.map(cat => {
        const keys = Object.keys(allIng).filter(k => allIng[k].cat === cat && !allIng[k].hideInTable)
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
