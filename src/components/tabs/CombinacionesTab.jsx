import { useState, useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos, selectAllCats } from '../../store/useStore'
import { ingCost, ingKcal, comboAgg, fmt, kfmt } from '../../engine/calc'
import { CAT_ORDER } from '../../data/ingredients'
import { COMBO } from '../../data/combos'

// ─── helpers ──────────────────────────────────────────────────────────────

function pType(ing) {
  if (!ing) return 'grams'
  if (ing.per100     != null) return 'grams'
  if (ing.perUnit    != null) return 'units'
  if (ing.perML      != null) return 'ml'
  if (ing.perServing != null) return 'serv'
  return 'grams'
}

function buildP(it) {
  if (it.pType === 'grams') return { grams: it.qty }
  if (it.pType === 'units') return { units: it.qty }
  if (it.pType === 'ml')    return { ml:    it.qty }
  return { serv: it.qty }
}

// Convert a COMBO items array into builder-friendly items
function comboItemsToBuilderItems(comboItems, allIng) {
  return comboItems.map(it => {
    const ing  = allIng[it.k]
    const type = pType(ing)
    const qty  = it.p.grams ?? it.p.units ?? it.p.ml ?? it.p.serv ?? 100
    return { k: it.k, qty, pType: type }
  })
}

const UNIT_LABEL = { grams: 'g', units: 'ud', ml: 'ml', serv: 'porción' }

// ─── Builder ──────────────────────────────────────────────────────────────

function Builder({ editingBaseKey, setEditingBaseKey }) {
  const allIng         = useStore(selectAllIng)
  const allCats        = useStore(selectAllCats)
  const addCustomCombo = useStore(s => s.addCustomCombo)
  const setComboOverride = useStore(s => s.setComboOverride)
  const catOrder = [...CAT_ORDER, ...useStore(s => s.customCategories).map(c => c.key)]

  const [search,    setSearch]    = useState('')
  const [comboName, setComboName] = useState('')
  const [items,     setItems]     = useState([])

  // When editingBaseKey changes from outside, load that combo
  const [loadedKey, setLoadedKey] = useState(null)
  if (editingBaseKey && editingBaseKey !== loadedKey) {
    const src = COMBO[editingBaseKey]
    if (src) {
      setComboName(src.name)
      setItems(comboItemsToBuilderItems(src.items, allIng))
    }
    setLoadedKey(editingBaseKey)
  }

  function clearBuilder() {
    setItems([]); setComboName(''); setLoadedKey(null); setEditingBaseKey(null)
  }

  const inComboKeys = new Set(items.map(it => it.k))

  const filteredIng = useMemo(() => {
    const q = search.toLowerCase()
    return Object.entries(allIng).filter(([, ing]) =>
      !ing.pend && !ing.hideInTable && (!q || ing.name.toLowerCase().includes(q))
    )
  }, [allIng, search])

  function addItem(key) {
    if (inComboKeys.has(key)) return
    const ing = allIng[key]
    const type = pType(ing)
    const defaultQty = type === 'grams' ? 100 : type === 'ml' ? 100 : 1
    setItems(prev => [...prev, { k: key, qty: defaultQty, pType: type }])
  }

  function removeItem(key) { setItems(prev => prev.filter(it => it.k !== key)) }
  function setQty(key, qty) { setItems(prev => prev.map(it => it.k === key ? { ...it, qty } : it)) }

  const totalCost = items.reduce((a, it) => a + ingCost(it.k, buildP(it), allIng), 0)
  const totalKcal = items.reduce((a, it) => a + ingKcal(it.k, buildP(it), allIng), 0)

  function save() {
    if (!items.length) return
    const name   = comboName.trim() || 'Combo sin nombre'
    const builtItems = items.map(it => ({ k: it.k, p: buildP(it) }))
    if (editingBaseKey) {
      // Overriding a base combo
      setComboOverride(editingBaseKey, { name, items: builtItems })
    } else {
      addCustomCombo({ name, items: builtItems })
    }
    clearBuilder()
  }

  return (
    <div>
      {editingBaseKey && (
        <div style={{
          padding: '8px 12px', marginBottom: 12, borderRadius: 8,
          background: 'var(--warn-bg)', border: '1px solid #ecdcc4',
          fontSize: '0.78rem', color: 'var(--warn-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span>✎ Editando combo base: <strong>{COMBO[editingBaseKey]?.name}</strong></span>
          <button className="btn-ghost" style={{ fontSize: '0.72rem' }} onClick={clearBuilder}>Cancelar edición</button>
        </div>
      )}

      <div className="combo-builder">
        {/* Picker */}
        <div className="ing-picker">
          <div className="picker-head">
            <input className="picker-search" placeholder="Buscar ingrediente…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="picker-body">
            {catOrder.map(cat => {
              const entries = filteredIng.filter(([, ing]) => ing.cat === cat)
              if (!entries.length) return null
              return (
                <div key={cat}>
                  <div className="picker-cat-label">{allCats[cat] ?? cat}</div>
                  {entries.map(([key, ing]) => (
                    <div key={key} className={`picker-item${inComboKeys.has(key) ? ' in-combo' : ''}`} onClick={() => addItem(key)}>
                      <span className="pi-name">{ing.name}</span>
                      <span className="pi-price">
                        {ing.per100 != null ? `$${ing.per100.toFixed(2)}/100g`
                          : ing.perUnit != null ? `$${ing.perUnit.toFixed(2)}/ud`
                          : ing.flat != null ? '$0.00' : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Workspace */}
        <div className="combo-workspace">
          <div className="combo-workspace-head">
            <input
              className="combo-name-input"
              placeholder="Nombre del combo…"
              value={comboName}
              onChange={e => setComboName(e.target.value)}
            />
            <button className="btn-primary" onClick={save} disabled={!items.length}>
              {editingBaseKey ? 'Guardar cambios' : 'Guardar combo'}
            </button>
            {items.length > 0 && <button className="btn-ghost" onClick={clearBuilder}>Limpiar</button>}
          </div>

          {items.length === 0 ? (
            <div className="combo-empty">Haz clic en un ingrediente de la izquierda para añadirlo.</div>
          ) : (
            <>
              <div className="combo-items-list">
                {items.map(it => {
                  const ing  = allIng[it.k]
                  const p    = buildP(it)
                  return (
                    <div key={it.k} className="combo-item-row">
                      <span className="ci-name">{ing?.name ?? it.k}</span>
                      <div className="ci-qty">
                        {it.pType !== 'serv' ? (
                          <>
                            <input
                              className="ci-qty-input" type="number" min="0"
                              step={it.pType === 'grams' || it.pType === 'ml' ? 10 : 0.25}
                              value={it.qty}
                              onChange={e => setQty(it.k, parseFloat(e.target.value) || 0)}
                            />
                            <span className="ci-unit">{UNIT_LABEL[it.pType]}</span>
                          </>
                        ) : <span className="ci-unit">1 porción</span>}
                      </div>
                      <span className="ci-cost">{fmt(ingCost(it.k, p, allIng))}</span>
                      <span className="ci-kcal">{kfmt(ingKcal(it.k, p, allIng))}</span>
                      <button className="ci-remove" onClick={() => removeItem(it.k)}>✕</button>
                    </div>
                  )
                })}
              </div>
              <div className="combo-total-bar">
                <div className="ct-stat"><span className="ct-label">Total precio</span><span className="ct-value">{fmt(totalCost)}</span></div>
                <div className="ct-stat"><span className="ct-label">Total kcal</span><span className="ct-value kcal">{kfmt(totalKcal)}</span></div>
                <div className="ct-stat"><span className="ct-label">Ingredientes</span><span className="ct-value" style={{ color: 'var(--ink)', fontSize: '0.95rem' }}>{items.length}</span></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Custom combo row ─────────────────────────────────────────────────────

function CustomComboRow({ saved, allIng, onEdit }) {
  const removeCustomCombo = useStore(s => s.removeCustomCombo)
  const [confirmDel, setConfirmDel] = useState(false)
  const agg = comboAgg({ items: saved.items, incomplete: false }, allIng)
  return (
    <div className={`saved-combo-card${confirmDel ? ' is-active' : ''}`}>
      <span className="sc-name">{saved.name} <span className="badge badge-custom">custom</span></span>
      <div className="sc-stats">
        <span className="sc-stat cost">{fmt(agg.cost)}</span>
        <span className="sc-stat kcal">{kfmt(agg.kcal)}</span>
        <span className="sc-stat">{saved.items.length} ing.</span>
      </div>
      <div className="row-actions">
        <button className="btn-ghost" style={{ fontSize: '0.76rem' }} onClick={() => onEdit(saved)}>✎ Editar</button>
        {!confirmDel
          ? <button className="btn-danger" onClick={() => setConfirmDel(true)}>✕</button>
          : <>
              <span style={{ fontSize: '0.78rem' }}>¿Eliminar?</span>
              <button className="btn-danger" onClick={() => removeCustomCombo(saved.id)}>Sí</button>
              <button className="btn-ghost"  onClick={() => setConfirmDel(false)}>No</button>
            </>
        }
      </div>
    </div>
  )
}

// ─── Base combo row ───────────────────────────────────────────────────────

function BaseComboRow({ comboKey, combo, allIng, onEdit }) {
  const deleteCombo        = useStore(s => s.deleteCombo)
  const resetComboOverride = useStore(s => s.resetComboOverride)
  const comboOverrides     = useStore(s => s.comboOverrides)
  const isModified         = !!comboOverrides[comboKey]
  const [confirmDel, setConfirmDel] = useState(false)
  const agg = comboAgg(combo, allIng)

  return (
    <div className={`saved-combo-card${isModified ? ' modified' : ''}${confirmDel ? ' is-active' : ''}`}>
      <span className="sc-name">
        {combo.name}
        {isModified && <span className="badge badge-modified" style={{ marginLeft: 6 }}>editado</span>}
        {combo.jessica   && <span className="badge badge-jessica"    style={{ marginLeft: 6 }}>María</span>}
        {agg.incomplete  && <span className="badge badge-incomplete" style={{ marginLeft: 6 }}>incompleto</span>}
      </span>
      <div className="sc-stats">
        <span className="sc-stat cost">{agg.incomplete ? '~' : ''}{fmt(agg.cost)}</span>
        <span className="sc-stat kcal">{kfmt(agg.kcal)}</span>
        <span className="sc-stat">{combo.items.length} ing.</span>
      </div>
      <div className="row-actions">
        <button className="btn-ghost" style={{ fontSize: '0.76rem' }} onClick={() => onEdit(comboKey)}>✎ Editar</button>
        {isModified && (
          <button className="btn-ghost" style={{ fontSize: '0.72rem' }} onClick={() => resetComboOverride(comboKey)}>↺ Original</button>
        )}
        {!confirmDel
          ? <button className="btn-danger" onClick={() => setConfirmDel(true)}>✕</button>
          : <>
              <span style={{ fontSize: '0.78rem' }}>¿Ocultar?</span>
              <button className="btn-danger" onClick={() => deleteCombo(comboKey)}>Sí</button>
              <button className="btn-ghost"  onClick={() => setConfirmDel(false)}>No</button>
            </>
        }
      </div>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────

export default function CombinacionesTab() {
  const allIng    = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const deletedCombos    = useStore(s => s.deletedCombos)
  const restoreCombo     = useStore(s => s.restoreCombo)
  const updateCustomCombo = useStore(s => s.updateCustomCombo)

  // Key of a BASE combo being edited in the builder
  const [editingBaseKey, setEditingBaseKey] = useState(null)
  // Custom combo being edited (for re-loading into builder)
  const [editingCustom, setEditingCustom]   = useState(null)

  // If a custom combo is being edited, we convert it into builder items
  // The builder component handles this via editingBaseKey for base combos.
  // For custom combos, we pass them through a separate flow:
  const handleEditCustom = (saved) => {
    setEditingCustom(saved)
    setEditingBaseKey('__custom__' + saved.id)
  }

  const handleEditBase = (key) => {
    setEditingCustom(null)
    setEditingBaseKey(key)
  }

  // Separate base and custom combos
  const baseCombos   = Object.entries(allCombos).filter(([, c]) => !c.isCustom)
  const customCombos = useStore(s => s.customCombos)

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          Constructor de combinaciones
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          Selecciona ingredientes · ajusta cantidades · guarda o edita cualquier combo.
          Precios en tiempo real según tus ediciones en Ingredientes.
        </p>
      </div>

      <Builder editingBaseKey={editingBaseKey} setEditingBaseKey={setEditingBaseKey} />

      {/* Custom combos */}
      {customCombos.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Mis combos ({customCombos.length})</div>
          {customCombos.map(saved => (
            <CustomComboRow key={saved.id} saved={saved} allIng={allIng} onEdit={handleEditCustom} />
          ))}
        </div>
      )}

      {/* Base combos */}
      <div style={{ marginTop: '2rem' }}>
        <div className="section-label" style={{ marginBottom: '0.5rem' }}>
          Combos base ({baseCombos.length})
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          Edita o elimina cualquier combo base. Los cambios se reflejan en el tab Platos.
        </p>
        {baseCombos.map(([key, combo]) => (
          <BaseComboRow key={key} comboKey={key} combo={combo} allIng={allIng} onEdit={handleEditBase} />
        ))}
      </div>

      {/* Deleted (hidden) base combos */}
      {deletedCombos.length > 0 && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9f6f0', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
          <div className="section-label" style={{ marginBottom: '0.5rem' }}>Combos ocultos ({deletedCombos.length})</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {deletedCombos.map(k => (
              <button key={k} className="btn-ghost" style={{ fontSize: '0.76rem' }} onClick={() => restoreCombo(k)}>
                ↺ {COMBO[k]?.name ?? k}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
