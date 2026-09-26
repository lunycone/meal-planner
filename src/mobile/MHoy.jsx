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
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef(null)
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

  const totals = Object.fromEntries(people.map(p => [p.id, dayTotals(dayForPerson(week, dk, p.id), p, day, allIng, allCombos)]))
  const rings = Object.fromEntries(people.map(p => [p.id, totals[p.id].target ? totals[p.id].kcal / totals[p.id].target * 100 : 0]))
  const kLine = focus.map(p => `${p.name} ${totals[p.id].kcal} / ${totals[p.id].target}`).join(' · ') + ' kcal'

  const eff = Math.max(-0.4, Math.min(MEALS.length - 0.6, sel - dx / STEP))
  const isToday = day === todayIdx

  function down(e) { drag.current = { x: e.clientX, moved: false }; setDragging(true) }
  function move(e) {
    if (!drag.current) return
    const d = e.clientX - drag.current.x
    if (Math.abs(d) > 6) drag.current.moved = true
    if (drag.current.moved) setDx(d)
  }
  function up() {
    if (!drag.current) return
    const moved = drag.current.moved
    drag.current = moved ? { moved: true, done: true } : null
    setDragging(false)
    if (moved) setSel(Math.max(0, Math.min(MEALS.length - 1, Math.round(sel - dx / STEP))))
    setDx(0)
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
          <span className="mh-day">{DAY_LONG[day]}{isToday ? ' · hoy' : ''}</span>
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
      <span className="mh-kline mp-num">{kLine}</span>

      <section className="mh-deck" aria-label="Comidas del día · desliza" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {meals.map((m, i) => {
          const p = i - eff, a = Math.abs(p), on = Math.round(eff) === i
          const st = MEAL_STYLE[m.type]
          const main = m.rows.find(r => r.info)?.info
          const others = m.rows.filter(r => r.info && main && r.info.key !== main.key)
          const [pp, cp, fp] = macroPct(main)
          return (
            <article key={m.type} className="mh-card" onClick={() => tapCard(m, i)} aria-current={on ? 'true' : undefined}
              style={{ transform: `translateX(${(p * STEP).toFixed(1)}px) scale(${(1 - Math.min(a, 1) * 0.1).toFixed(3)}) rotateY(${(-p * 12).toFixed(1)}deg)`,
                opacity: Math.max(0, 1 - a * 0.45), zIndex: 10 - Math.round(a), transition: dragging ? 'none' : undefined }}>
              {on && <span aria-hidden="true" className="hoy-glow" />}
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mp-bubble" style={{ width: 42, height: 42, background: st.tint, color: st.color, boxShadow: `inset 0 1px 0 #fff, 0 6px 16px ${st.glow}` }}><Icon name={MEAL_ICON[m.type]} size={20} /></span>
                  <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{MEAL_LABEL[m.type]}</span><span className="mp-muted" style={{ fontSize: 12 }}>{MEAL_TIME[m.type]}</span></span>
                </span>
                {isToday && i === nextIdx && <span className="mp-tag" style={{ background: 'var(--c-ink)', color: '#fff', height: 24, fontSize: 11 }}>Siguiente</span>}
                {isToday && i < nextIdx && main && <span className="mp-tag" style={{ background: 'rgba(47,158,91,0.14)', color: '#1F7A45', height: 24, fontSize: 11 }}>Hecha</span>}
              </span>
              {main ? (
                <>
                  <span className="mh-name">{main.name}</span>
                  {others.map(r => <span key={r.person.id} className="mp-muted" style={{ fontSize: 13, marginTop: -6 }}>{r.person.name}: {r.info.name}</span>)}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 'auto' }}>
                    <span style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, borderRadius: '50%', background: `conic-gradient(#2E9BD6 0 ${pp}%, #E0A21B ${pp}% ${pp + cp}%, #8B6FE8 ${pp + cp}% 100%)` }}>
                      <span style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: '#FBF8F3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="mp-num" style={{ fontSize: 14, fontWeight: 700 }}>{main.prot} g</span><span className="mp-muted" style={{ fontSize: 9.5 }}>prot</span>
                      </span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: 'var(--c-ink-2)' }}>
                      {[['Proteína', pp, '#2E9BD6'], ['Carbo', cp, '#E0A21B'], ['Grasa', fp, '#8B6FE8']].map(([l, v, c]) => <span key={l}><span style={{ color: c }}>●</span> {l} {v}%</span>)}
                    </span>
                  </span>
                  <span style={{ display: 'grid', gridTemplateColumns: `repeat(${m.rows.length}, minmax(0, 1fr))`, gap: 8 }}>
                    {m.rows.map(r => (
                      <span key={r.person.id} className="hoy-stat">
                        <span className="mp-muted" style={{ fontSize: 11 }}>{r.person.name}</span>
                        <span className="mp-num" style={{ fontSize: 16, fontWeight: 700 }}>{r.info ? `${r.info.kcal} kcal` : '—'}</span>
                        <span style={{ fontSize: 10.5, color: r.info?.pcos && r.person.pcos ? PCOS_STYLE[r.info.pcos].color : 'var(--c-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {!r.info ? 'Sin plato' : r.person.pcos && r.info.pcos ? PCOS_STYLE[r.info.pcos].label : r.info.portion}
                        </span>
                      </span>
                    ))}
                  </span>
                </>
              ) : (
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                  <span className="mp-muted" style={{ fontSize: 15 }}>Sin plato</span>
                  <span className="mp-btn mp-btn-dark"><Icon name="plus" size={14} stroke={2.6} />Elegir plato</span>
                </span>
              )}
            </article>
          )
        })}
      </section>
      <div className="mh-dots">
        {meals.map((m, i) => (
          <button key={m.type} type="button" aria-label={MEAL_LABEL[m.type]} onClick={() => setSel(i)}
            style={{ width: Math.round(eff) === i ? 26 : 8, background: Math.round(eff) === i ? MEAL_STYLE[m.type].color : 'rgba(31,27,22,0.2)' }} />
        ))}
      </div>
      <nav className="mh-strip" aria-label="Días">
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
        <MealSheet mealType={sheetMeal.type} dayLabel={`${isToday ? 'hoy, ' : ''}${DAY_LONG[day].toLowerCase()} ${date.getDate()}`} rows={sheetMeal.rows}
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
