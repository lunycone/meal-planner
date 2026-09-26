import { useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { comboAgg, fmtPortion, ingKcal, ingCost, pcosCarbLevel } from '../../engine/calc'
import Icon, { MEAL_ICON } from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { MEAL_LABEL, MEAL_STYLE, PCOS_STYLE, BATCH_DAYS, DAY_LONG, DAY_KEYS, fmtMoney, activeProfilesOn } from '../../lib/mealplan'
import { defaultScope, buildSelection } from '../../lib/planActions'

// Selector de plato: lista a la izquierda, ficha a la derecha, y abajo a qué
// días (solo este / lun-vie del batch / fin de semana) y a quién se aplica.
export default function DishPicker({ weekKey, weekData, dayKey, date, mealType, initialWho = 'all', currentKey = null, onClose, onDone }) {
  const allIng    = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const profiles  = useStore(s => s.profiles)
  const setMealSlots = useStore(s => s.setMealSlots)
  const people = activeProfilesOn(profiles, date ?? new Date())
  const pcosPerson = people.find(p => p.pcos)
  const tracksPcos = !!pcosPerson && (mealType === 'desayuno' || mealType === 'cena')

  const [q, setQ] = useState('')
  const [sort, setSort] = useState('name')
  const [onlyGreen, setOnlyGreen] = useState(false)
  const [selKey, setSelKey] = useState(currentKey)
  const [optionals, setOptionals] = useState([])
  const [scope, setScope] = useState(() => defaultScope(dayKey, mealType, weekData))
  const [who, setWho] = useState((mealType === 'desayuno' || mealType === 'merienda') ? initialWho : 'all')

  const dishes = useMemo(() => {
    const s = q.trim().toLowerCase()
    let list = Object.entries(allCombos)
      .filter(([, c]) => (c.meals ?? []).includes(mealType))
      .map(([key, c]) => ({ key, c, agg: comboAgg(c, allIng), pcos: pcosCarbLevel(c, allIng, mealType) }))
    if (s) list = list.filter(d => d.c.name.toLowerCase().includes(s))
    if (onlyGreen) list = list.filter(d => d.pcos === 'green')
    const by = { name: (a, b) => a.c.name.localeCompare(b.c.name), price: (a, b) => a.agg.cost - b.agg.cost, kcal: (a, b) => b.agg.kcal - a.agg.kcal, prot: (a, b) => b.agg.prot - a.agg.prot }[sort]
    return list.sort(by)
  }, [allCombos, allIng, mealType, q, sort, onlyGreen])

  const sel = selKey ? allCombos[selKey] : null
  const selAgg = sel ? comboAgg(sel, allIng, {}, {}, optionals) : null
  const st = MEAL_STYLE[mealType]
  const isWeekday = BATCH_DAYS.includes(dayKey)
  const dayName = DAY_LONG[DAY_KEYS.indexOf(dayKey)]
  const scopeOptions = [
    { value: 'day', label: `Solo ${dayName.toLowerCase()}` },
    isWeekday ? { value: 'batch', label: 'Lunes a viernes · batch' } : { value: 'weekend', label: 'Sábado y domingo' },
  ]
  const whoOptions = [{ value: 'all', label: 'Los dos' }, ...people.map(p => ({ value: p.id, label: p.name }))]
  if (people.length > 2) whoOptions[0].label = 'Todos'

  function confirm() {
    if (!selKey) return
    const slots = buildSelection({ weekData, dayKey, mealType, recipeKey: selKey, optionals, scope, who, profiles: people })
    setMealSlots(weekKey, slots)
    onDone?.()
    onClose()
  }

  return (
    <div className="mp-overlay" onClick={onClose}>
      <div className="mp-sheet" style={{ maxWidth: 920, height: 'min(760px, calc(100vh - 48px))' }} onClick={e => e.stopPropagation()} role="dialog" aria-label={`Elegir ${MEAL_LABEL[mealType].toLowerCase()}`}>
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mp-bubble" style={{ width: 42, height: 42, background: st.tint, color: st.color, boxShadow: `inset 0 1px 0 #fff, 0 6px 16px ${st.glow}` }}><Icon name={MEAL_ICON[mealType]} size={20} /></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Elegir {MEAL_LABEL[mealType].toLowerCase()}</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>{dayName}{date ? ` ${date.getDate()}` : ''} · {dishes.length} platos</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32 }} aria-label="Cerrar" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, padding: '0 24px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label className="mp-search" style={{ flex: 1, minWidth: 180 }}>
                <Icon name="search" size={14} stroke={2.4} />
                <span className="sr-only">Buscar plato</span>
                <input autoFocus placeholder="Buscar plato…" value={q} onChange={e => setQ(e.target.value)} />
              </label>
              <Segmented label="Ordenar" value={sort} onChange={setSort}
                options={[{ value: 'name', label: 'A–Z' }, { value: 'price', label: 'Precio' }, { value: 'kcal', label: 'Kcal' }, { value: 'prot', label: 'Proteína' }]} />
            </div>
            {tracksPcos && (
              <button type="button" className="mp-chip" onClick={() => setOnlyGreen(v => !v)} aria-pressed={onlyGreen}
                style={{ alignSelf: 'flex-start', border: 0, cursor: 'pointer', background: onlyGreen ? 'rgba(47,158,91,0.16)' : 'rgba(255,255,255,0.78)', color: onlyGreen ? '#1F7A45' : 'var(--c-ink-2)' }}>
                <span className="mp-dot" style={{ background: PCOS_STYLE.green.color }} />Solo PCOS bajo ({pcosPerson.name})
              </button>
            )}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 4 }}>
              {dishes.length === 0 && <div className="mp-empty">No hay platos con ese filtro.</div>}
              {dishes.map(d => {
                const on = d.key === selKey
                return (
                  <button key={d.key} type="button" className="mp-row" onClick={() => { setSelKey(d.key); setOptionals([]) }} aria-pressed={on}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: 0, cursor: 'pointer', textAlign: 'left', background: on ? '#FFFFFF' : 'transparent', boxShadow: on ? '0 8px 20px rgba(110,80,50,0.12)' : 'none' }}>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{d.c.name}</span>
                      <span className="mp-muted mp-num" style={{ fontSize: 12 }}>{Math.round(d.agg.kcal)} kcal · {Math.round(d.agg.prot)} g prot · {fmtMoney(d.agg.cost)}{d.key === currentKey ? ' · actual' : ''}</span>
                    </span>
                    {tracksPcos && d.pcos && <span className="mp-dot" title={PCOS_STYLE[d.pcos].long} style={{ background: PCOS_STYLE[d.pcos].color, width: 9, height: 9 }} />}
                    {on && <Icon name="check" size={16} stroke={2.6} color="var(--c-green)" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mp-glass" style={{ borderRadius: 24, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflowY: 'auto' }}>
            {!sel && <div className="mp-empty" style={{ padding: '60px 10px' }}>Elige un plato de la lista para ver su ficha.</div>}
            {sel && (
              <>
                <span style={{ fontSize: 17, fontWeight: 650, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{sel.name}</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  {[['kcal', Math.round(selAgg.kcal)], ['proteína', Math.round(selAgg.prot) + ' g'], ['coste', fmtMoney(selAgg.cost)]].map(([l, v]) => (
                    <div key={l} style={{ padding: '10px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.8)' }}>
                      <div className="mp-num" style={{ fontSize: 17, fontWeight: 650 }}>{v}</div>
                      <div className="mp-muted" style={{ fontSize: 11.5 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <span className="mp-muted" style={{ fontSize: 11.5 }}>Receta base. Comida y cena se ajustan después a cada persona.</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(sel.items ?? []).map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderTop: i ? '1px solid var(--c-line)' : 0, fontSize: 13 }}>
                      <span>{allIng[it.k]?.name ?? it.k}</span>
                      <span className="mp-muted mp-num" style={{ flexShrink: 0 }}>{fmtPortion(it.p)}{ingKcal(it.k, it.p, allIng) > 0 ? ` · ${Math.round(ingKcal(it.k, it.p, allIng))} kcal` : ''}</span>
                    </div>
                  ))}
                </div>
                {(sel.optionalItems ?? []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="mp-eyebrow">Extras opcionales</span>
                    {sel.optionalItems.map(oi => {
                      const on = optionals.includes(oi.k)
                      return (
                        <button key={oi.k} type="button" className="mp-row" aria-pressed={on}
                          onClick={() => setOptionals(o => on ? o.filter(x => x !== oi.k) : [...o, oi.k])}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: 0, cursor: 'pointer', background: on ? '#FFFFFF' : 'rgba(255,255,255,0.5)', textAlign: 'left', fontSize: 13 }}>
                          <span className={`mp-check${on ? ' is-on' : ''}`}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                          <span style={{ flex: 1 }}>{allIng[oi.k]?.name ?? oi.k}</span>
                          <span className="mp-muted mp-num">{fmtPortion(oi.p)} · +{fmtMoney(ingCost(oi.k, oi.p, allIng))}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="mp-eyebrow">Aplicar a</span>
              <Segmented label="Aplicar a" value={scope} onChange={setScope} options={scopeOptions} />
            </div>
            {(mealType === 'desayuno' || mealType === 'merienda') && people.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="mp-eyebrow">Para</span>
                <Segmented label="Para" value={who} onChange={setWho} options={whoOptions} />
              </div>
            )}
            {(mealType === 'comida' || mealType === 'cena') && (
              <span className="mp-muted" style={{ fontSize: 12, maxWidth: 230, lineHeight: 1.4 }}>Comida y cena: mismo plato para todos; la ración se ajusta sola a cada persona.</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mp-btn mp-btn-glass" onClick={onClose}>Cancelar</button>
            <button className="mp-btn mp-btn-dark" disabled={!selKey} onClick={confirm}>
              {scope === 'batch' ? 'Poner de lunes a viernes' : scope === 'weekend' ? 'Poner sábado y domingo' : 'Poner este día'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
