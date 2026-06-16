import { useState, useMemo, useEffect } from 'react'
import useStore, { selectAllIng, selectAllCombos, selectAllCats } from '../../store/useStore'
import { ingCost, ingKcal, ingProt, ingFat, comboAgg, fmt, kfmt } from '../../engine/calc'
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

function comboItemsToBuilderItems(comboItems, allIng) {
  return comboItems.map(it => {
    const ing  = allIng[it.k]
    const type = pType(ing)
    const qty  = it.p.grams ?? it.p.units ?? it.p.ml ?? it.p.serv ?? 100
    return { k: it.k, qty, pType: type }
  })
}

const UNIT_LABEL = { grams: 'g', units: 'ud', ml: 'ml', serv: 'porción' }

function portionLabel(p, ing) {
  if (p.grams != null) return `${p.grams}g`
  if (p.units != null) return `${p.units} ud`
  if (p.ml    != null) return `${p.ml}ml`
  return '1 porción'
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function ComboDetailPanel({ comboKey, combo, allIng, onEdit, onClose, isBase }) {
  const deleteCombo        = useStore(s => s.deleteCombo)
  const removeCustomCombo  = useStore(s => s.removeCustomCombo)
  const resetComboOverride = useStore(s => s.resetComboOverride)
  const comboOverrides     = useStore(s => s.comboOverrides)
  const isModified         = isBase && !!comboOverrides[comboKey]
  const [confirmDel, setConfirmDel] = useState(false)

  const agg = comboAgg(combo, allIng)
  const totalCost = agg.cost
  const totalKcal = agg.kcal

  const rows = combo.items.map(it => {
    const ing  = allIng[it.k]
    const cost = ingCost(it.k, it.p, allIng)
    const kcal = ingKcal(it.k, it.p, allIng)
    return { k: it.k, ing, p: it.p, cost, kcal }
  })

  return (
    <div className="combo-detail-panel">
      {/* Header */}
      <div className="cdp-header">
        <div className="cdp-title-row">
          <div>
            <div className="cdp-name">{combo.name}</div>
            <div className="cdp-badges">
              {isModified      && <span className="badge badge-modified">editado</span>}
              {combo.jessica   && <span className="badge badge-jessica">María</span>}
              {combo.isCustom  && <span className="badge badge-custom">custom</span>}
              {agg.incomplete  && <span className="badge badge-incomplete">incompleto</span>}
            </div>
          </div>
          <button className="cdp-close" onClick={onClose}>✕</button>
        </div>

        {/* Summary totals */}
        <div className="cdp-totals">
          <div className="cdp-total-block">
            <span className="cdp-total-val cost">{agg.incomplete ? '~' : ''}{fmt(totalCost)}</span>
            <span className="cdp-total-lbl">precio total</span>
          </div>
          <div className="cdp-divider" />
          <div className="cdp-total-block">
            <span className="cdp-total-val kcal">{kfmt(totalKcal)}</span>
            <span className="cdp-total-lbl">kcal total</span>
          </div>
          <div className="cdp-divider" />
          <div className="cdp-total-block">
            <span className="cdp-total-val" style={{ color: '#4a7a3a' }}>{Math.round(agg.prot)}g</span>
            <span className="cdp-total-lbl">proteína</span>
          </div>
          <div className="cdp-divider" />
          <div className="cdp-total-block">
            <span className="cdp-total-val" style={{ color: '#7a4a6a' }}>{Math.round(agg.fat)}g</span>
            <span className="cdp-total-lbl">grasa</span>
          </div>
          <div className="cdp-divider" />
          <div className="cdp-total-block">
            <span className="cdp-total-val" style={{ color: 'var(--ink)' }}>{combo.items.length}</span>
            <span className="cdp-total-lbl">ingredientes</span>
          </div>
        </div>
      </div>

      {/* Ingredients table */}
      <div className="cdp-ing-list">
        <div className="cdp-ing-header" style={{ gridTemplateColumns: '1fr 70px 60px 100px 70px 100px 55px 55px' }}>
          <span className="cdp-col-name">Ingrediente</span>
          <span className="cdp-col-qty">Cantidad</span>
          <span className="cdp-col-cost">Precio</span>
          <span className="cdp-col-pct">% coste</span>
          <span className="cdp-col-kcal">Kcal</span>
          <span className="cdp-col-pct">% kcal</span>
          <span className="cdp-col-prot">Prot</span>
          <span className="cdp-col-fat">Grasa</span>
        </div>

        {rows.map(({ k, ing, p, cost, kcal }) => {
          const costPct = totalCost > 0 ? (cost / totalCost) * 100 : 0
          const kcalPct = totalKcal > 0 ? (kcal / totalKcal) * 100 : 0
          return (
            <div key={k} className="cdp-ing-row" style={{ gridTemplateColumns: '1fr 70px 60px 100px 70px 100px 55px 55px' }}>
              <span className="cdp-col-name cdp-ing-name">{ing?.name ?? k}</span>
              <span className="cdp-col-qty cdp-qty">{portionLabel(p, ing)}</span>
              <span className="cdp-col-cost cdp-cost">{fmt(cost)}</span>
              <span className="cdp-col-pct">
                <div className="cdp-bar-wrap">
                  <div className="cdp-bar cdp-bar-cost" style={{ width: `${costPct}%` }} />
                  <span className="cdp-bar-pct">{Math.round(costPct)}%</span>
                </div>
              </span>
              <span className="cdp-col-kcal cdp-kcal">{Math.round(kcal)} kcal</span>
              <span className="cdp-col-pct">
                <div className="cdp-bar-wrap">
                  <div className="cdp-bar cdp-bar-kcal" style={{ width: `${kcalPct}%` }} />
                  <span className="cdp-bar-pct">{Math.round(kcalPct)}%</span>
                </div>
              </span>
              <span className="cdp-col-prot cdp-macro">{Math.round(ingProt(k, p, allIng))}g P</span>
              <span className="cdp-col-fat cdp-macro">{Math.round(ingFat(k, p, allIng))}g G</span>
            </div>
          )
        })}
      </div>

      {/* Note */}
      {combo.note && (
        <div className="cdp-note">📌 {combo.note}</div>
      )}

      {/* Actions */}
      <div className="cdp-actions">
        <button className="btn-primary" onClick={() => { onEdit(isBase ? comboKey : combo); onClose() }}>
          ✎ Editar combo
        </button>
        {isBase && isModified && (
          <button className="btn-ghost" onClick={() => resetComboOverride(comboKey)}>
            ↺ Restaurar original
          </button>
        )}
        {!confirmDel ? (
          <button className="btn-danger" style={{ marginLeft: 'auto' }} onClick={() => setConfirmDel(true)}>
            {isBase ? '✕ Ocultar' : '✕ Eliminar'}
          </button>
        ) : (
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.82rem' }}>
            ¿{isBase ? 'Ocultar' : 'Eliminar'}?
            <button className="btn-danger" onClick={() => {
              if (isBase) deleteCombo(comboKey); else removeCustomCombo(combo.id)
              onClose()
            }}>Sí</button>
            <button className="btn-ghost" onClick={() => setConfirmDel(false)}>No</button>
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Builder Modal ────────────────────────────────────────────────────────

function BuilderModal({ isOpen, onClose, editingBaseKey, setEditingBaseKey, editingCustom, setEditingCustom }) {
  if (!isOpen) return null
  const allIng           = useStore(selectAllIng)
  const allCats          = useStore(selectAllCats)
  const addCustomCombo   = useStore(s => s.addCustomCombo)
  const setComboOverride = useStore(s => s.setComboOverride)
  const updateCustomCombo = useStore(s => s.updateCustomCombo)
  const catOrder = [...CAT_ORDER, ...useStore(s => s.customCategories).map(c => c.key)]

  const [search,    setSearch]    = useState('')
  const [comboName, setComboName] = useState('')
  const [items,     setItems]     = useState([])

  // Load combo into builder via useEffect (not during render)
  useEffect(() => {
    if (!editingBaseKey) return
    if (editingBaseKey.startsWith('__custom__') && editingCustom) {
      setComboName(editingCustom.name)
      setItems(comboItemsToBuilderItems(editingCustom.items, allIng))
    } else {
      const src = COMBO[editingBaseKey]
      if (src) {
        setComboName(src.name)
        setItems(comboItemsToBuilderItems(src.items, allIng))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBaseKey])

  function clearBuilder() {
    setItems([]); setComboName(''); setEditingBaseKey(null); setEditingCustom(null); onClose()
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
    const name = comboName.trim() || 'Combo sin nombre'
    const builtItems = items.map(it => ({ k: it.k, p: buildP(it) }))
    if (editingBaseKey && !editingBaseKey.startsWith('__custom__')) {
      setComboOverride(editingBaseKey, { name, items: builtItems })
    } else if (editingBaseKey && editingBaseKey.startsWith('__custom__') && editingCustom) {
      updateCustomCombo(editingCustom.id, { name, items: builtItems })
    } else {
      addCustomCombo({ name, items: builtItems })
    }
    clearBuilder()
  }

  const editingName = editingBaseKey
    ? (editingBaseKey.startsWith('__custom__') ? editingCustom?.name : COMBO[editingBaseKey]?.name)
    : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', height: 'auto' }}>
        <div className="modal-header">
          <h3>{editingBaseKey ? `✎ Editando: ${editingName}` : '➕ Nueva combinación'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
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
          </div>

          {items.length === 0 ? (
            <div className="combo-empty">Haz clic en un ingrediente de la izquierda para añadirlo.</div>
          ) : (
            <>
              <div className="combo-items-list">
                {items.map(it => {
                  const ing = allIng[it.k]
                  const p   = buildP(it)
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

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={save} disabled={!items.length}>
            {editingBaseKey ? 'Guardar cambios' : 'Guardar combo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Combo Card ───────────────────────────────────────────────────────────

function ComboCard({ comboKey, combo, allIng, isBase, onClick, isSelected }) {
  const comboOverrides = useStore(s => s.comboOverrides)
  const isModified     = isBase && !!comboOverrides[comboKey]
  const agg = comboAgg(combo, allIng)

  return (
    <div
      className={`saved-combo-card clickable${isSelected ? ' is-active' : ''}${isModified ? ' modified' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <span className="sc-name">
        {combo.name}
        {isModified     && <span className="badge badge-modified"    style={{ marginLeft: 6 }}>editado</span>}
        {combo.jessica  && <span className="badge badge-jessica"     style={{ marginLeft: 6 }}>María</span>}
        {combo.isCustom && <span className="badge badge-custom"      style={{ marginLeft: 6 }}>custom</span>}
        {agg.incomplete && <span className="badge badge-incomplete"  style={{ marginLeft: 6 }}>incompleto</span>}
      </span>
      <div className="sc-stats">
        <span className="sc-stat cost">{agg.incomplete ? '~' : ''}{fmt(agg.cost)}</span>
        <span className="sc-stat kcal">{kfmt(agg.kcal)}</span>
        <span className="sc-stat">{combo.items.length} ing.</span>
      </div>
      <span className="sc-chevron">{isSelected ? '▲' : '▼'}</span>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────

export default function CombinacionesTab() {
  const allIng    = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const deletedCombos  = useStore(s => s.deletedCombos)
  const restoreCombo   = useStore(s => s.restoreCombo)
  const customCombos   = useStore(s => s.customCombos).filter(c => !c.desayuno)

  const [showBuilder,     setShowBuilder]     = useState(false)
  const [editingBaseKey,  setEditingBaseKey]  = useState(null)
  const [editingCustom,   setEditingCustom]   = useState(null)
  const [selectedKey,     setSelectedKey]     = useState(null)  // for detail panel
  const [searchTerm,      setSearchTerm]      = useState('')
  const [sortBy,          setSortBy]          = useState('name') // 'name', 'price', 'kcal'

  const handleEditBase = (key) => {
    setEditingCustom(null)
    setEditingBaseKey(key)
    setSelectedKey(null)
    setShowBuilder(true)
  }

  const handleEditCustom = (saved) => {
    setEditingCustom(saved)
    setEditingBaseKey('__custom__' + saved.id)
    setSelectedKey(null)
    setShowBuilder(true)
  }

  const handleCloseBuilder = () => {
    setShowBuilder(false)
    setEditingBaseKey(null)
    setEditingCustom(null)
  }

  const toggleSelect = (key) => setSelectedKey(prev => prev === key ? null : key)

  const baseCombos = useMemo(() => {
    let combos = Object.entries(allCombos).filter(([key, c]) => !c.isCustom && !key.startsWith('desayuno-'))

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      combos = combos.filter(([, c]) => c.name.toLowerCase().includes(q))
    }

    combos.sort((a, b) => {
      const agg_a = comboAgg(a[1], allIng)
      const agg_b = comboAgg(b[1], allIng)
      if (sortBy === 'price') return agg_a.cost - agg_b.cost
      if (sortBy === 'kcal') return agg_a.kcal - agg_b.kcal
      return a[1].name.localeCompare(b[1].name)
    })

    return combos
  }, [allCombos, allIng, searchTerm, sortBy])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Combinaciones
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Haz clic en un combo para ver el desglose completo. ✎ Editar para modificar.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowBuilder(true)}>
          ➕ Nueva combinación
        </button>
      </div>

      <BuilderModal
        isOpen={showBuilder}
        onClose={handleCloseBuilder}
        editingBaseKey={editingBaseKey}
        setEditingBaseKey={setEditingBaseKey}
        editingCustom={editingCustom}
        setEditingCustom={setEditingCustom}
      />

      {/* Custom combos */}
      {customCombos.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div className="section-label" style={{ marginBottom: '0.75rem' }}>Mis combos ({customCombos.length})</div>
          {customCombos.map(saved => {
            const key = '__custom__' + saved.id
            const isSelected = selectedKey === key
            return (
              <div key={saved.id}>
                <ComboCard
                  comboKey={key} combo={saved} allIng={allIng}
                  isBase={false} isSelected={isSelected}
                  onClick={() => toggleSelect(key)}
                />
                {isSelected && (
                  <ComboDetailPanel
                    comboKey={key} combo={saved} allIng={allIng}
                    isBase={false}
                    onEdit={() => handleEditCustom(saved)}
                    onClose={() => setSelectedKey(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Base combos */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="picker-search"
            placeholder="Buscar combo…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              background: 'var(--bg-2)',
              color: 'var(--text)',
              fontSize: '0.875rem',
            }}
          >
            <option value="name">Nombre A-Z</option>
            <option value="price">Precio (menor a mayor)</option>
            <option value="kcal">Kcal (menor a mayor)</option>
          </select>
        </div>

        <div className="section-label" style={{ marginBottom: '0.5rem' }}>
          Combos base ({baseCombos.length})
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          Haz clic para ver desglose · ✎ Editar para modificar · los cambios se reflejan en Platos.
        </p>
        {baseCombos.map(([key, combo]) => {
          const isSelected = selectedKey === key
          return (
            <div key={key}>
              <ComboCard
                comboKey={key} combo={combo} allIng={allIng}
                isBase isSelected={isSelected}
                onClick={() => toggleSelect(key)}
              />
              {isSelected && (
                <ComboDetailPanel
                  comboKey={key} combo={combo} allIng={allIng}
                  isBase
                  onEdit={handleEditBase}
                  onClose={() => setSelectedKey(null)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Deleted combos */}
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
