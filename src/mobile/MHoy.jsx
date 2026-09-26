import { useEffect, useMemo, useRef, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import Icon, { MEAL_ICON } from '../components/ui/Icon'
import DishPicker from '../components/meal/DishPicker'
import MealSheet from '../components/meal/MealSheet'
import { clearFor, weekWith, cleanWeek } from '../lib/planActions'
import {
  DAY_KEYS, DAY_SHORT, DAY_LONG, MONTHS_SHORT, MEALS, MEAL_LABEL, MEAL_TIME, MEAL_STYLE, PCOS_STYLE,
  addDays, mondayOf, weekKeyOf, dayIndexOf, startOfDay, activeProfilesOn, dayForPerson, mealInfo, dayTotals, macroPct,
} from '../lib/mealplan'
import { People, Bulb } from './MobileApp'

// Hoy en el móvil: la fecha grande, los avatares con su anillo de kcal, las
// 4 comidas en tarjetas que se pasan con el dedo y la semana abajo.

const STEP = 250

function cardStyle(p) {
  const a = Math.abs(p)
  return {
    transform: `translate3d(${(p * STEP).toFixed(1)}px, 0, 0) scale(${(1 - Math.min(a, 1) * 0.1).toFixed(3)}) rotateY(${(-p * 12).toFixed(1)}deg)`,
    opacity: String(Math.max(0, 1 - a * 0.45)), zIndex: String(10 - Math.round(a)),
  }
}

function nextMealIndex(now) {
  const mins = now.getHours() * 60 + now.getMinutes()
  const i = MEALS.findIndex(m => { const [h, mm] = MEAL_TIME[m].split(':').map(Number); return h * 60 + mm + 60 > mins })
  return i === -1 ? MEALS.length - 1 : i
}

export default function MHoy({ unseen, onIdeas }) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  const profiles = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const replaceWeek = useStore(s => s.replaceWeek)

  const now = new Date()
  const today = startOfDay(now)
  const monday = mondayOf(today)
  const wk = weekKeyOf(monday)
  const week = weekPlan[wk] ?? {}
  const todayIdx = dayIndexOf(today)
  const nextIdx = nextMealIndex(now)

  const [day, setDay] = useState(todayIdx)
  const [sel, setSel] = useState(nextIdx)
  const drag = useRef(null)
  const cardEls = useRef([])
  const [picker, setPicker] = useState(null)
  const [sheet, setSheet] = useState(null)

  useEffect(() => {
    const cleaned = cleanWeek(weekPlan[wk], allCombos)
    if (cleaned) replaceWeek(wk, cleaned)
  }, [wk]) // eslint-disable-line react-hooks/exhaustive-deps

  const date = addDays(monday, day)
  const dk = DAY_KEYS[day]
  const people = activeProfilesOn(profiles, date)
  const shown = activeProfileId === 'all' ? people : people.filter(p => p.id === activeProfileId)
  const focus = shown.length ? shown : people
  const who = activeProfileId === 'all' ? 'all' : activeProfileId

  const meals = useMemo(() => MEALS.map(type => ({
    type, rows: focus.map(person => ({ person, info: mealInfo(dayForPerson(week, dk, person.id), type, person, day, allIng, allCombos) })),
  })), [week, dk, day, focus.map(p => p.id).join(), allIng, allCombos]) // eslint-disable-line react-hooks/exhaustive-deps

  const rings = useMemo(() => Object.fromEntries(people.map(p => {
    const t = dayTotals(dayForPerson(week, dk, p.id), p, day, allIng, allCombos)
    return [p.id, t.target ? t.kcal / t.target * 100 : 0]
  })), [week, dk, day, people.map(p => p.id).join(), allIng, allCombos]) // eslint-disable-line react-hooks/exhaustive-deps

  const isToday = day === todayIdx

  // Arrastre: se mueve el DOM directamente en cada frame (sin re-render de
  // React, que recalculaba toda la pantalla y daba tirones en el iPhone) y
  // solo al soltar se fija la tarjeta. Un gesto rápido pasa de tarjeta
  // aunque se haya movido poco.
  function place(pos, animate) {
    cardEls.current.forEach((el, i) => {
      if (!el) return
      const st = cardStyle(i - pos)
      el.style.transition = animate ? '' : 'none'
      el.style.transform = st.transform
      el.style.opacity = st.opacity
      el.style.zIndex = st.zIndex
    })
  }
  function down(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, x0: e.clientX, t0: e.timeStamp, lastX: e.clientX, lastT: e.timeStamp, v: 0, moved: false, id: e.pointerId, raf: 0 }
  }
  function move(e) {
    const d = drag.current
    if (!d || d.done || e.pointerId !== d.id) return
    const dx = e.clientX - d.x0
    if (!d.moved) {
      if (Math.abs(dx) < 8) return
      if (Math.abs(e.clientY - d.y) > Math.abs(dx)) { drag.current = null; return } // es scroll vertical
      d.moved = true
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sin captura */ }
    }
    const dt = e.timeStamp - d.lastT
    if (dt > 0) d.v = 0.8 * ((e.clientX - d.lastX) / dt) + 0.2 * d.v
    d.lastX = e.clientX; d.lastT = e.timeStamp
    d.dx = dx
    if (!d.raf) d.raf = requestAnimationFrame(() => {
      d.raf = 0
      place(Math.max(-0.4, Math.min(MEALS.length - 0.6, sel - d.dx / STEP)), false)
    })
  }
  function up(e) {
    const d = drag.current
    if (!d || d.done || (e && e.pointerId !== d.id)) return
    if (d.raf) cancelAnimationFrame(d.raf)
    if (!d.moved) { drag.current = null; return }
    let next = Math.round(sel - d.dx / STEP)
    if (next === sel && Math.abs(d.v) > 0.35 && Math.abs(d.dx) > 18) next = sel + (d.v < 0 ? 1 : -1)
    next = Math.max(0, Math.min(MEALS.length - 1, next))
    place(next, true)
    setSel(next)
    drag.current = { moved: true, done: true }
    setTimeout(() => { if (drag.current?.done) drag.current = null }, 0)
  }
  function tapCard(m, i) {
    if (drag.current?.moved) return
    if (i !== sel) { setSel(i); return }
    if (m.rows.some(r => r.info)) setSheet(m.type)
    else setPicker({ mealType: m.type, currentKey: null })
  }
  function clearMeal(type) {
    const key = `${dk}-${type}`
    const w = (type === 'comida' || type === 'cena') ? 'all' : who
    replaceWeek(wk, weekWith(week, key, clearFor(week[key], w, people)))
  }

  const sheetMeal = sheet ? meals.find(m => m.type === sheet) : null

  return (
    <div className="mh">
      <section className="mh-top">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="mh-day">{DAY_LONG[day]}{isToday ? ' · today' : ''}</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="mh-num mp-num">{date.getDate()}</span>
            <span className="mp-muted" style={{ fontSize: 14 }}>{MONTHS_SHORT[date.getMonth()]}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <People rings={rings} />
          <Bulb unseen={unseen} onOpen={onIdeas} />
        </div>
      </section>

      <section className="mh-deck" aria-label="Meals of the day · swipe" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {meals.map((m, i) => {
          const on = sel === i
          const st = MEAL_STYLE[m.type]
          const main = m.rows.find(r => r.info)?.info
          const others = m.rows.filter(r => r.info && main && r.info.key !== main.key)
          const [pp, cp, fp] = macroPct(main)
          return (
            <article key={m.type} ref={el => { cardEls.current[i] = el }} className="mh-card" onClick={() => tapCard(m, i)} aria-current={on ? 'true' : undefined}
              style={cardStyle(i - sel)}>
              {on && <span aria-hidden="true" className="hoy-glow" />}
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mp-bubble" style={{ width: 42, height: 42, background: st.tint, color: st.color, boxShadow: `inset 0 1px 0 #fff, 0 6px 16px ${st.glow}` }}><Icon name={MEAL_ICON[m.type]} size={20} /></span>
                  <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{MEAL_LABEL[m.type]}</span><span className="mp-muted" style={{ fontSize: 12 }}>{MEAL_TIME[m.type]}</span></span>
                </span>
                {isToday && i === nextIdx && <span className="mp-tag" style={{ background: 'var(--c-ink)', color: '#fff', height: 24, fontSize: 11 }}>Next</span>}
                {isToday && i < nextIdx && main && <span className="mp-tag" style={{ background: 'rgba(47,158,91,0.14)', color: '#1F7A45', height: 24, fontSize: 11 }}>Done</span>}
              </span>
              {main ? (
                <>
                  <span className="mh-name">{main.name}</span>
                  {others.map(r => <span key={r.person.id} className="mp-muted" style={{ fontSize: 13, marginTop: -6 }}>{r.person.name}: {r.info.name}</span>)}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                    <span style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, borderRadius: '50%', background: `conic-gradient(#2E9BD6 0 ${pp}%, #E0A21B ${pp}% ${pp + cp}%, #8B6FE8 ${pp + cp}% 100%)` }}>
                      <span style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: '#FBF8F3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="mp-num" style={{ fontSize: 14, fontWeight: 700 }}>{main.prot} g</span><span className="mp-muted" style={{ fontSize: 9.5 }}>prot</span>
                      </span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: 'var(--c-ink-2)' }}>
                      {[['Protein', pp, '#2E9BD6'], ['Carbs', cp, '#E0A21B'], ['Fat', fp, '#8B6FE8']].map(([l, v, c]) => <span key={l}><span style={{ color: c }}>●</span> {l} {v}%</span>)}
                    </span>
                  </span>
                  <span style={{ display: 'grid', gridTemplateColumns: `repeat(${m.rows.length}, minmax(0, 1fr))`, gap: 8 }}>
                    {m.rows.map(r => (
                      <span key={r.person.id} className="hoy-stat">
                        <span className="mp-muted" style={{ fontSize: 11 }}>{r.person.name}</span>
                        <span className="mp-num" style={{ fontSize: 16, fontWeight: 700 }}>{r.info ? `${r.info.kcal} kcal` : '—'}</span>
                        <span style={{ fontSize: 10.5, color: r.info?.pcos && r.person.pcos ? PCOS_STYLE[r.info.pcos].color : 'var(--c-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {!r.info ? 'No dish' : r.person.pcos && r.info.pcos ? PCOS_STYLE[r.info.pcos].label : r.info.portion}
                        </span>
                      </span>
                    ))}
                  </span>
                </>
              ) : (
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                  <span className="mp-muted" style={{ fontSize: 15 }}>No dish</span>
                  <span className="mp-btn mp-btn-dark"><Icon name="plus" size={14} stroke={2.6} />Choose dish</span>
                </span>
              )}
            </article>
          )
        })}
      </section>
      <div className="mh-dots">
        {meals.map((m, i) => (
          <button key={m.type} type="button" aria-label={MEAL_LABEL[m.type]} onClick={() => setSel(i)}
            style={{ width: sel === i ? 26 : 8, background: sel === i ? MEAL_STYLE[m.type].color : 'rgba(31,27,22,0.2)' }} />
        ))}
      </div>
      <nav className="mh-strip" aria-label="Days">
        {DAY_KEYS.map((d, i) => {
          const on = i === day
          return (
            <button key={d} type="button" aria-pressed={on} onClick={() => { setDay(i); setSel(i === todayIdx ? nextIdx : 0) }}
              className={`${on ? 'is-on' : ''}${i === todayIdx ? ' is-today' : ''}`}>
              <span>{DAY_SHORT[i]}</span><strong className="mp-num">{addDays(monday, i).getDate()}</strong>
            </button>
          )
        })}
      </nav>

      {sheetMeal && (
        <MealSheet mealType={sheetMeal.type} dayLabel={`${isToday ? 'today, ' : ''}${DAY_LONG[day]} ${date.getDate()}`} rows={sheetMeal.rows}
          onClose={() => setSheet(null)} onClear={() => clearMeal(sheetMeal.type)}
          onChange={() => { const k = sheetMeal.rows.find(r => r.info)?.info.key; setSheet(null); setPicker({ mealType: sheetMeal.type, currentKey: k }) }} />
      )}
      {picker && (
        <DishPicker weekKey={wk} weekData={week} dayKey={dk} date={date} mealType={picker.mealType}
          initialWho={who} currentKey={picker.currentKey} onClose={() => setPicker(null)} />
      )}
    </div>
  )
}
