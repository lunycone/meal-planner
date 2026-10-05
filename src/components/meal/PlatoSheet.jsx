import { useEffect, useMemo, useRef, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import {
  comboAgg, ingCost, ingKcal, ingProt, ingredientUnitType, pcosCarbLevel, proteinLevel, kcalLevel,
  dishHasGOS, dishHasInsolubleFiber, dishHasAllium,
} from '../../engine/calc'
import Overlay from '../ui/Overlay'
// Puntito del color de la tienda (Costco rojo…), con su nombre al pasar el ratón.
function StoreDot({ ing }) {
  const st = ing ? storeOf(ing) : null
  if (!st) return <span className="mp-dot pl-store-dot is-none" title="No store" aria-label="No store" />
  return <span className="mp-dot pl-store-dot" title={st} aria-label={st} style={{ background: storeColor(st) }} />
}
import { storeOf, storeColor } from '../../lib/stores'
import Icon, { MEAL_ICON } from '../ui/Icon'
import MicrosCard from './MicrosCard'
import {
  MEALS, MEAL_LABEL, MEAL_STYLE, PCOS_STYLE, fmtMoney, fmtRange, addDays, mondayOf, dishUsage, DAY_KEYS, DAY_SHORT,
} from '../../lib/mealplan'

// ─── Ficha de plato: ver y editar son lo mismo ─────────────────────────────
// No hay «modo edición»: el nombre, las franjas y cada cantidad se tocan en
// su sitio y el resumen de la derecha se recalcula al momento. Solo cuando
// algo cambia aparece «Guardar cambios / Descartar». Cada ingrediente enseña
// cuánto pesa en las kcal del plato, para saber qué tocar.

const CAT_COLOR = {
  carne: '#F2A0AE', proteina: '#F2A0AE', lacteo: '#F5C868', fresco: '#8FD4A8',
  legumbre: '#B7B0F0', base: '#E6C39A', otro: '#CFC3B5',
}
const LEVEL_TXT = {
  prot: { green: 'Protein good', yellow: 'Protein borderline', red: 'Protein low' },
  kcal: { green: 'Kcal good', yellow: 'Kcal borderline', red: 'Too few kcal' },
}
const LEVEL_C = { green: '#2F9E5B', yellow: '#B7791F', red: '#D64545' }

function defaultPortionFor(ing) {
  switch (ingredientUnitType(ing)) {
    case 'per100':  return { grams: 100 }
    case 'perUnit': return { units: 1 }
    case 'perML':   return { ml: 20 }
    default:        return {}
  }
}
function qtyOf(p) { return p.grams ?? p.units ?? p.ml ?? null }
function unitOf(p) { return p.grams != null ? 'g' : p.units != null ? 'pc' : p.ml != null ? 'ml' : '' }
function withQty(p, n) {
  if (p.grams != null) return { ...p, grams: n }
  if (p.units != null) return { ...p, units: n }
  if (p.ml != null) return { ...p, ml: n }
  return p
}
function stepOf(p) {
  if (p.units != null) return 0.5
  const q = qtyOf(p) ?? 0
  return q < 30 ? 5 : q < 200 ? 10 : 25
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function Stepper({ p, onChange }) {
  const q = qtyOf(p)
  const [text, setText] = useState(String(q ?? ''))
  useEffect(() => { setText(String(q ?? '')) }, [q])
  if (q == null) return <span className="pl-flat">fixed price</span>
  const step = stepOf(p)
  const set = n => onChange(withQty(p, Math.max(0, Math.round(n * 100) / 100)))
  return (
    <span className="pl-stepper">
      <button type="button" aria-label="Less" onClick={() => set(q - step)} disabled={q <= 0}>−</button>
      <input value={text} inputMode="decimal" aria-label="Quantity"
        onChange={e => setText(e.target.value)}
        onBlur={() => { const n = parseFloat(text.replace(',', '.')); if (!isNaN(n)) set(n); else setText(String(q)) }}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} />
      <span className="pl-unit">{unitOf(p)}</span>
      <button type="button" aria-label="More" onClick={() => set(q + step)}>+</button>
    </span>
  )
}

export default function PlatoSheet({ comboKey = null, onClose }) {
  const allIng    = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  useStore(s => s.storeColors) // repintar si cambian los colores de tienda
  const weekPlan  = useStore(s => s.weekPlan)
  const profiles  = useStore(s => s.profiles)
  const comboOverrides     = useStore(s => s.comboOverrides)
  const setComboOverride   = useStore(s => s.setComboOverride)
  const resetComboOverride = useStore(s => s.resetComboOverride)
  const deleteCombo        = useStore(s => s.deleteCombo)
  const addCustomCombo     = useStore(s => s.addCustomCombo)
  const updateCustomCombo  = useStore(s => s.updateCustomCombo)
  const removeCustomCombo  = useStore(s => s.removeCustomCombo)

  const combo = comboKey ? allCombos[comboKey] : null
  const isNew = !combo
  const initial = useMemo(() => ({
    name: combo?.name ?? '', meals: combo?.meals ?? [], items: combo?.items ?? [],
  }), [comboKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState(initial)
  const dirty = !same(draft, initial)
  const [q, setQ] = useState('')
  const [hl, setHl] = useState(0)
  const [askClose, setAskClose] = useState(false)
  const [askDelete, setAskDelete] = useState(false)
  const addRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => { if (isNew) titleRef.current?.focus() }, [isNew])

  const agg = useMemo(() => comboAgg({ items: draft.items }, allIng), [draft.items, allIng])
  const before = useMemo(() => comboAgg({ items: initial.items }, allIng), [initial.items, allIng])
  const carbs = agg.carb ?? Math.max(0, (agg.kcal - agg.prot * 4 - agg.fat * 9) / 4)
  const P = agg.prot * 4, C = carbs * 4, F = agg.fat * 9, T = P + C + F || 1
  const rows = draft.items.map(it => {
    const ing = allIng[it.k]
    const kcal = ingKcal(it.k, it.p, allIng)
    return { it, ing, kcal, cost: ingCost(it.k, it.p, allIng), prot: ingProt(it.k, it.p, allIng), share: agg.kcal ? kcal / agg.kcal : 0 }
  })
  const maxShare = Math.max(0.01, ...rows.map(r => r.share))

  const usage = comboKey ? dishUsage(weekPlan, comboKey) : []
  const usedCount = usage.reduce((s, u) => s + u.count, 0)
  const thisMon = mondayOf(new Date())
  const weekLabel = mon => {
    const d = Math.round((mon - thisMon) / (7 * 86400000))
    return d === 0 ? 'This week' : d === 1 ? 'Next week' : d === -1 ? 'Last week' : fmtRange(mon, addDays(mon, 6))
  }

  const pcosPerson = profiles.find(p => p.pcos)
  const digestive = profiles.find(p => p.digestive)
  const probe = { items: draft.items }
  const digFlags = digestive && draft.items.length ? [
    dishHasGOS(probe, allIng) && 'Legumes (ferment)',
    dishHasInsolubleFiber(probe, allIng) && 'Insoluble fiber',
    dishHasAllium(probe, allIng) && 'Onion / garlic',
  ].filter(Boolean) : []

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    const have = new Set(draft.items.map(it => it.k))
    return Object.entries(allIng)
      .filter(([, ing]) => ing.name.toLowerCase().includes(s))
      .map(([k, ing]) => ({ k, ing, starts: ing.name.toLowerCase().startsWith(s), have: have.has(k) }))
      .sort((a, b) => (b.starts - a.starts) || a.ing.name.localeCompare(b.ing.name))
      .slice(0, 7)
  }, [q, allIng, draft.items])

  const setItems = fn => setDraft(d => ({ ...d, items: fn(d.items) }))
  function addIng(k) {
    setItems(items => [...items, { k, p: defaultPortionFor(allIng[k]) }])
    setQ(''); setHl(0)
    requestAnimationFrame(() => addRef.current?.focus())
  }
  const toggleMeal = m => setDraft(d => ({ ...d, meals: d.meals.includes(m) ? d.meals.filter(x => x !== m) : MEALS.filter(x => x === m || d.meals.includes(x)) }))

  const missing = [!draft.name.trim() && 'name', !draft.meals.length && 'meal slot', !draft.items.length && 'ingredients'].filter(Boolean)
  const canSave = missing.length === 0 && (isNew || dirty)

  function save() {
    if (!canSave) return
    const data = { name: draft.name.trim(), meals: draft.meals, items: draft.items }
    if (isNew) addCustomCombo(data)
    else if (combo.isCustom) updateCustomCombo(combo.customId, data)
    else setComboOverride(comboKey, data)
    onClose()
  }
  function duplicate() {
    addCustomCombo({ name: `${draft.name.trim() || 'Dish'} (copy)`, meals: draft.meals, items: draft.items })
    onClose()
  }
  function remove() {
    if (combo.isCustom) removeCustomCombo(combo.customId)
    else deleteCombo(comboKey)
    onClose()
  }
  function tryClose() { if (dirty && !isNew) setAskClose(true); else if (isNew && dirty) setAskClose(true); else onClose() }

  useEffect(() => {
    const onKey = e => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const lead = draft.meals[0]
  const st = lead ? MEAL_STYLE[lead] : { tint: 'rgba(31,27,22,0.07)', color: 'var(--c-ink)', glow: 'rgba(0,0,0,0.08)' }
  const delta = (a, b, f = v => Math.round(v)) => { const d = f(a) - f(b); return d === 0 ? null : (d > 0 ? '+' : '') + d }

  return (
    <Overlay onClose={tryClose}>
      <div className="mp-sheet pl-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={draft.name || 'New dish'}>
        <div className="mp-sheet-head" style={{ paddingBottom: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
            <span className="mp-bubble" style={{ width: 46, height: 46, background: st.tint, color: st.color, boxShadow: `inset 0 1px 0 #fff, 0 6px 16px ${st.glow}`, transition: 'background .3s, color .3s' }}>
              <Icon name={lead ? MEAL_ICON[lead] : 'plate'} size={21} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, flex: 1 }}>
              <input ref={titleRef} className="pl-title" value={draft.name} placeholder="Dish name"
                aria-label="Dish name" onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {MEALS.map(m => {
                  const on = draft.meals.includes(m)
                  return (
                    <button key={m} type="button" className={`pl-meal${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleMeal(m)}
                      style={on ? { background: MEAL_STYLE[m].tint, color: MEAL_STYLE[m].color, boxShadow: `inset 0 0 0 1.5px ${MEAL_STYLE[m].color}40` } : undefined}>
                      <Icon name={MEAL_ICON[m]} size={13} stroke={2.2} />{MEAL_LABEL[m]}
                    </button>
                  )
                })}
                {combo?.isCustom && <span className="mp-tag" style={{ background: 'rgba(139,111,232,0.14)', color: '#5B3FC4' }}>Yours</span>}
                {!isNew && !combo?.isCustom && comboOverrides[comboKey] && <span className="mp-tag" style={{ background: 'rgba(224,162,27,0.16)', color: '#8A5E08' }}>Modified</span>}
              </div>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32, flexShrink: 0 }} aria-label="Close" onClick={tryClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div className="pl-body">
          {/* ── Ingredients ── */}
          <section className="pl-ings">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 2px 6px' }}>
              <span className="mp-eyebrow">Ingredients · {rows.length}</span>
              <span className="mp-muted" style={{ fontSize: 11.5 }}>bar = share of the dish's kcal</span>
            </div>
            <div className="pl-ing-list">
            {rows.length === 0 && <div className="mp-empty" style={{ padding: '28px 10px' }}>Start by searching for an ingredient below.</div>}
            {rows.map(({ it, ing, kcal, cost, prot, share }, i) => (
              <div key={`${it.k}-${i}`} className="pl-ing mp-in" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                <div className="pl-ing-top">
                  <span className="pl-ing-name"><StoreDot ing={ing} />{ing?.name ?? it.k}</span>
                  <Stepper p={it.p} onChange={p => setItems(items => items.map((x, j) => j === i ? { ...x, p } : x))} />
                  <button type="button" className="pl-ing-x" aria-label={`Remove ${ing?.name ?? it.k}`} onClick={() => setItems(items => items.filter((_, j) => j !== i))}><Icon name="x" size={10} stroke={3} /></button>
                </div>
                <div className="pl-ing-bottom">
                  <span className="pl-share"><span style={{ width: `${share / maxShare * 100}%`, background: CAT_COLOR[ing?.cat] ?? CAT_COLOR.otro }} /></span>
                  <span className="mp-muted mp-num" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
                    {Math.round(kcal)} kcal · {Math.round(share * 100)} %{prot >= 1 ? ` · ${Math.round(prot)} g prot` : ''} · {fmtMoney(cost)}
                  </span>
                </div>
              </div>
            ))}
            </div>

            <div className="pl-add">
              <label className="mp-search" style={{ width: '100%', boxSizing: 'border-box' }}>
                <Icon name="plus" size={14} stroke={2.6} />
                <span className="sr-only">Add ingredient</span>
                <input ref={addRef} placeholder="Add ingredient…" value={q}
                  onChange={e => { setQ(e.target.value); setHl(0) }}
                  onKeyDown={e => {
                    const avail = matches.filter(m => !m.have)
                    if (e.key === 'ArrowDown') { e.preventDefault(); setHl(h => Math.min(avail.length - 1, h + 1)) }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setHl(h => Math.max(0, h - 1)) }
                    if (e.key === 'Enter' && avail[hl]) { e.preventDefault(); addIng(avail[hl].k) }
                    if (e.key === 'Escape' && q) { e.stopPropagation(); setQ('') }
                  }} />
              </label>
              {matches.length > 0 && (
                <div className="pl-results">
                  {matches.map(m => {
                    const p = defaultPortionFor(m.ing)
                    const idx = matches.filter(x => !x.have).indexOf(m)
                    return (
                      <button key={m.k} type="button" className={`pl-result${idx === hl ? ' is-hl' : ''}`} disabled={m.have} onClick={() => addIng(m.k)}>
                        <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', minWidth: 0 }}><StoreDot ing={m.ing} />{m.ing.name}{storeOf(m.ing) && <span className="mp-muted" style={{ fontWeight: 500, fontSize: 12, marginLeft: 6 }}>{storeOf(m.ing)}</span>}</span>
                        <span className="mp-muted mp-num" style={{ fontSize: 11.5 }}>
                          {m.have ? 'already in the dish' : `${qtyOf(p) != null ? `${qtyOf(p)} ${unitOf(p)}` : 'fixed price'} · ${Math.round(ingKcal(m.k, p, allIng))} kcal · ${fmtMoney(ingCost(m.k, p, allIng))}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ── Resumen vivo ── */}
          <aside className="pl-summary">
            <div className="pl-card">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="mp-num" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em' }}>{Math.round(agg.kcal)}</span>
                <span className="mp-muted" style={{ fontSize: 13 }}>kcal</span>
                {!isNew && dirty && delta(agg.kcal, before.kcal) && <span className="pl-delta">{delta(agg.kcal, before.kcal)}</span>}
              </div>
              <div className="pl-stats">
                {[['Protein', `${Math.round(agg.prot)} g`, delta(agg.prot, before.prot)], ['Carbs', `${Math.round(carbs)} g`, null], ['Fat', `${Math.round(agg.fat)} g`, delta(agg.fat, before.fat)], ['Cost', fmtMoney(agg.cost), null]].map(([l, v, d]) => (
                  <div key={l}>
                    <span className="mp-num" style={{ fontSize: 15, fontWeight: 650 }}>{v}{!isNew && dirty && d ? <small className="pl-delta-sm">{d}</small> : null}</span>
                    <span className="mp-muted" style={{ fontSize: 11 }}>{l}</span>
                  </div>
                ))}
              </div>
              <div className="pl-macro" aria-label="Macro split">
                <span style={{ width: `${P / T * 100}%`, background: '#2E9BD6' }} />
                <span style={{ width: `${C / T * 100}%`, background: '#E0A21B' }} />
                <span style={{ width: `${F / T * 100}%`, background: '#8B6FE8' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--c-ink-2)' }} className="mp-num">
                <span>P {Math.round(P / T * 100)} %</span><span>C {Math.round(C / T * 100)} %</span><span>F {Math.round(F / T * 100)} %</span>
              </div>
            </div>

            {draft.meals.length > 0 && draft.items.length > 0 && (
              <div className="pl-card" style={{ gap: 8 }}>
                <span className="mp-eyebrow">Fit by meal slot</span>
                {draft.meals.map(m => {
                  const pl = proteinLevel(agg.prot, m), kl = kcalLevel(agg.kcal, m)
                  const pc = pcosPerson ? pcosCarbLevel(probe, allIng, m) : null
                  return (
                    <div key={m} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 650, color: MEAL_STYLE[m].color }}><Icon name={MEAL_ICON[m]} size={12} stroke={2.4} />{MEAL_LABEL[m]}</span>
                      <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11.5 }}>
                        <span style={{ color: LEVEL_C[pl] }}>● {LEVEL_TXT.prot[pl]}</span>
                        <span style={{ color: LEVEL_C[kl] }}>● {LEVEL_TXT.kcal[kl]}</span>
                        {pc && <span style={{ color: PCOS_STYLE[pc].color }}>● {PCOS_STYLE[pc].label} ({pcosPerson.initial})</span>}
                      </span>
                    </div>
                  )
                })}
                {digFlags.length > 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--c-ink-2)', lineHeight: 1.45 }}>
                    <strong style={{ fontWeight: 650 }}>Digestion ({digestive.initial}):</strong> {digFlags.join(' · ')}
                  </span>
                )}
              </div>
            )}

            {draft.items.length > 0 && <MicrosCard items={draft.items} meals={draft.meals} kcal={agg.kcal} profiles={profiles} allIng={allIng} />}

            {!isNew && (
              <div className="pl-card" style={{ gap: 6 }}>
                <span className="mp-eyebrow">In the plan</span>
                {usage.length === 0 && <span className="mp-muted" style={{ fontSize: 12.5 }}>Not in any week.</span>}
                {usage.slice(0, 4).map(u => (
                  <span key={u.weekKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}>
                    <span>{u.monday ? weekLabel(u.monday) : u.weekKey}</span>
                    <span className="mp-muted mp-num">{DAY_KEYS.filter(d => u.days.has(d)).map(d => DAY_SHORT[DAY_KEYS.indexOf(d)].slice(0, 2)).join(' ')} · {u.count}×</span>
                  </span>
                ))}
                {dirty && usedCount > 0 && <span style={{ fontSize: 11.5, color: '#8A5E08', lineHeight: 1.4 }}>Saving also updates those {usedCount} meals (and the shopping and batch).</span>}
              </div>
            )}

            {!isNew && !combo?.isCustom && comboOverrides[comboKey] && !dirty && (
              <button type="button" className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => { resetComboOverride(comboKey); onClose() }}>
                <Icon name="repeat" size={13} />Back to the original recipe
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
                <button className="mp-btn mp-btn-dark" disabled={!canSave} onClick={save}>Save</button>
              </span>
            </>
          ) : askDelete ? (
            <>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Delete “{combo.name}”?{usedCount > 0 ? ` It's in ${usedCount} planned meals: they will be left empty.` : ''}
              </span>
              <span style={{ display: 'flex', gap: 8 }}>
                <button className="mp-btn mp-btn-glass" onClick={() => setAskDelete(false)}>No</button>
                <button className="mp-btn mp-btn-danger" onClick={remove}>Delete</button>
              </span>
            </>
          ) : (
            <>
              <span style={{ display: 'flex', gap: 6 }}>
                {!isNew && <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={duplicate} disabled={!draft.items.length}><Icon name="copy" size={13} />Duplicate</button>}
                {!isNew && <button className="mp-btn mp-btn-sm pl-del" onClick={() => setAskDelete(true)}><Icon name="trash" size={13} />Delete</button>}
              </span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isNew && missing.length > 0 && <span className="mp-muted" style={{ fontSize: 12.5 }}>Missing: {missing.join(', ')}</span>}
                {!isNew && !dirty && <span className="mp-muted" style={{ fontSize: 12.5 }}>Tap anything to change it</span>}
                {(dirty && !isNew) && <button className="mp-btn mp-btn-glass" onClick={() => setDraft(initial)}>Discard</button>}
                {(dirty || isNew)
                  ? <button className="mp-btn mp-btn-dark" disabled={!canSave} onClick={save} title="⌘S">{isNew ? 'Create dish' : 'Save changes'}</button>
                  : <button className="mp-btn mp-btn-dark" onClick={onClose}>Done</button>}
              </span>
            </>
          )}
        </div>
      </div>
    </Overlay>
  )
}
