import { useState } from 'react'
import useStore, { selectAllIng } from '../../store/useStore'
import { fmtPortion, ingKcal } from '../../engine/calc'
import Overlay from '../ui/Overlay'
import Icon, { MEAL_ICON } from '../ui/Icon'
import Segmented from '../ui/Segmented'
import { MEAL_LABEL, MEAL_TIME, MEAL_STYLE, PCOS_STYLE, fmtMoney, macroPct } from '../../lib/mealplan'
import { CYCLE_PHASES, getPhaseScore } from '../../lib/cycle'

// Ficha de una comida ya planificada: cifras reales por persona, macros,
// ingredientes (con la base ya escalada) y encaje por fase del ciclo.
// rows = [{ person, info }] (info = mealInfo de lib/mealplan).
export default function MealSheet({ mealType, dayLabel, rows, onChange, onClear, onClose }) {
  const allIng = useStore(selectAllIng)
  const [tab, setTab] = useState('nutricion')
  const [focus, setFocus] = useState(0)
  const st = MEAL_STYLE[mealType]
  const withInfo = rows.filter(r => r.info)
  const cur = withInfo[Math.min(focus, withInfo.length - 1)]
  if (!cur) return null
  const info = cur.info
  const [pp, cp, fp] = macroPct(info)
  const maxG = Math.max(info.prot, info.carbs, info.fat, 1)
  const hasCycle = withInfo.some(r => r.person.pcos)
  const phase = getPhaseScore(info.key)
  const scaledKey = info.scaled?.ingName

  return (
    <Overlay onClose={onClose}>
      <div className="mp-sheet" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()} role="dialog" aria-label={info.name}>
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span className="mp-bubble" style={{ width: 44, height: 44, background: st.tint, color: st.color, boxShadow: `inset 0 1px 0 #fff, 0 6px 16px ${st.glow}` }}><Icon name={MEAL_ICON[mealType]} size={20} /></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="mp-muted" style={{ fontSize: 12.5 }}>{MEAL_LABEL[mealType]} · {MEAL_TIME[mealType]} · {dayLabel}</span>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 }}>{info.name}</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32, flexShrink: 0 }} aria-label="Close" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {withInfo.length > 1 ? (
              <Segmented label="Person" value={focus} onChange={setFocus}
                options={withInfo.map((r, i) => ({ value: i, label: r.info.key === withInfo[0].info.key ? r.person.name : `${r.person.name} · other dish` }))} />
            ) : <span />}
            {hasCycle && <Segmented label="View" value={tab} onChange={setTab} options={[{ value: 'nutricion', label: 'Nutrition' }, { value: 'ciclo', label: 'Cycle' }]} />}
          </div>

          {tab === 'nutricion' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                {[['kcal', info.kcal], ['protein', info.prot + ' g'], ['cost', fmtMoney(info.cost)], ['portion', info.portion]].map(([l, v]) => (
                  <div key={l} style={{ padding: '12px', borderRadius: 16, background: 'rgba(255,255,255,0.8)' }}>
                    <div className="mp-num" style={{ fontSize: l === 'portion' ? 14 : 20, fontWeight: 650, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{v}</div>
                    <div className="mp-muted" style={{ fontSize: 11.5, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              {info.scaled?.factor != null && (
                <div style={{ fontSize: 13, lineHeight: 1.5, padding: '10px 12px', borderRadius: 14, background: 'rgba(46,155,214,0.10)', color: '#1F5E86' }}>
                  {cur.person.name} gets {Math.round(info.scaled.factor * 100)}% of the recipe so the day stays on target. Base recipe: {info.baseKcal} kcal.
                </div>
              )}
              {info.scaled && info.scaled.grams == null && info.scaled.oilMl > 0 && (
                <div style={{ fontSize: 13, lineHeight: 1.5, padding: '10px 12px', borderRadius: 14, background: 'rgba(46,155,214,0.10)', color: '#1F5E86' }}>
                  This dish has no base to scale: {cur.person.name}'s day is topped up with {info.scaled.oilMl} ml of EVOO. Base recipe: {info.baseKcal} kcal.
                </div>
              )}
              {info.scaled?.grams != null && (
                <div style={{ fontSize: 13, lineHeight: 1.5, padding: '10px 12px', borderRadius: 14, background: 'rgba(46,155,214,0.10)', color: '#1F5E86' }}>
                  {cur.person.name}'s portion is adjusted: {info.scaled.ingName.toLowerCase()} {info.scaled.defaultGrams} → {info.scaled.grams} g
                  {info.scaled.oilMl > 0 ? ` plus ${info.scaled.oilMl} ml of EVOO to top up the day.` : '.'} Base recipe: {info.baseKcal} kcal.
                </div>
              )}
              {info.pcos && cur.person.pcos && (
                <span className="mp-chip" style={{ alignSelf: 'flex-start', color: PCOS_STYLE[info.pcos].color }}><span className="mp-dot" style={{ background: PCOS_STYLE[info.pcos].color }} />{PCOS_STYLE[info.pcos].long}</span>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <span className="mp-eyebrow">Macros · base recipe</span>
                {[['Protein', info.prot, pp, '#2585BC'], ['Carbs', info.carbs, cp, '#C1850C'], ['Fat', info.fat, fp, '#7154DA']].map(([l, g, pc, c]) => (
                  <div key={l} style={{ display: 'grid', gridTemplateColumns: '100px minmax(0, 1fr) 90px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                    <span className="mp-muted">{l}</span>
                    <span style={{ height: 7, borderRadius: 4, background: 'rgba(110,80,50,0.10)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${g / maxG * 100}%`, background: c, borderRadius: 4, animation: 'mp-grow 1s var(--c-ease) both' }} /></span>
                    <span className="mp-num" style={{ textAlign: 'right', fontWeight: 600 }}>{g} g · {pc}%</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="mp-eyebrow" style={{ paddingBottom: 6 }}>Ingredients</span>
                {(info.combo.items ?? []).map((it, i) => {
                  const isScaled = scaledKey && (allIng[it.k]?.name === scaledKey)
                  const p = isScaled ? { ...it.p, grams: info.scaled.grams } : it.p
                  const extraOil = it.k === 'aove' && info.scaled?.oilMl > 0 ? info.scaled.oilMl : 0
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--c-line)', fontSize: 13.5 }}>
                      <span style={{ fontWeight: isScaled || extraOil ? 650 : 400 }}>{allIng[it.k]?.name ?? it.k}{isScaled || extraOil ? ' · adjusted' : ''}</span>
                      <span className="mp-muted mp-num">{fmtPortion(p)}{extraOil ? ` + ${extraOil} ml` : ''}{ingKcal(it.k, p, allIng) > 0 ? ` · ${Math.round(ingKcal(it.k, p, allIng))} kcal` : ''}</span>
                    </div>
                  )
                })}
                {info.scaled?.oilMl > 0 && !(info.combo.items ?? []).some(it => it.k === 'aove') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--c-line)', fontSize: 13.5 }}>
                    <span style={{ fontWeight: 650 }}>EVOO · day top-up</span>
                    <span className="mp-muted mp-num">{info.scaled.oilMl} ml</span>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'ciclo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="mp-muted" style={{ fontSize: 13 }}>How this dish fits each phase of the cycle.</span>
              {CYCLE_PHASES.map(ph => {
                const x = phase[ph.id]
                return (
                  <div key={ph.id} style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 650 }}><span className="mp-dot" style={{ background: ph.color }} />{ph.name}<span className="mp-muted" style={{ fontWeight: 400, fontSize: 12 }}>{ph.days}</span></span>
                      <span style={{ display: 'flex', gap: 3 }}>{[1, 2, 3].map(i => <span key={i} className="mp-dot" style={{ background: i <= x.stars ? ph.color : 'rgba(110,80,50,0.14)' }} />)}</span>
                    </div>
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--c-ink-2)' }}>{x.note}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mp-sheet-foot">
          {onClear && <button className="mp-btn mp-btn-danger" onClick={() => { onClear(); onClose() }}><Icon name="trash" size={14} />Remove</button>}
          {onChange && <button className="mp-btn mp-btn-dark" onClick={onChange}><Icon name="repeat" size={14} />Change dish</button>}
        </div>
      </div>
    </Overlay>
  )
}

