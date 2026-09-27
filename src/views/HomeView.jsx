import { useEffect, useMemo, useRef, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import Icon, { MEAL_ICON } from '../components/ui/Icon'
import DishPicker from '../components/meal/DishPicker'
import MealSheet from '../components/meal/MealSheet'
import ModelWeekSheet from '../components/meal/ModelWeekSheet'
import { clearFor, weekWith, cleanWeek } from '../lib/planActions'
import {
  DAY_KEYS, DAY_SHORT, DAY_LONG, MONTHS, MEALS, MEAL_LABEL, MEAL_TIME, MEAL_STYLE, PCOS_STYLE, PERSON_COLOR,
  addDays, mondayOf, weekKeyOf, dayIndexOf, startOfDay, fmtMoney,
  activeProfilesOn, dayForPerson, mealInfo, dayTotals, shortName, macroPct,
} from '../lib/mealplan'
import { nextBatch, sessionDates, rangeLabel, batchesCookedOn, batchDayKeys, DAY_SHORT_EN } from '../lib/batchConfig'

// ─── Hoy ─────────────────────────────────────────────────────────────────────
// Izquierda: la fecha y cómo va el día de cada uno (kcal planificadas frente
// a su objetivo de hoy). Centro: las 4 comidas de hoy en un carrusel que se
// arrastra; arranca en la siguiente según la hora. Derecha: accesos con su
// cifra real. Abajo: la semana (comida y cena) — tocar un día lo abre en el
// Planificador.

function useCountUp(value, dur = 900) {
  const [v, setV] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    const start = performance.now(), a = from.current, b = value
    let raf
    const tick = t => {
      const k = Math.min(1, (t - start) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      setV(Math.round(a + (b - a) * e))
      if (k < 1) raf = requestAnimationFrame(tick)
      else from.current = b
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, dur])
  return v
}

function nextMealIndex(now) {
  const mins = now.getHours() * 60 + now.getMinutes()
  const idx = MEALS.findIndex(m => {
    const [h, mm] = MEAL_TIME[m].split(':').map(Number)
    return h * 60 + mm + 60 > mins // hasta 1 h después de su hora sigue siendo "la de ahora"
  })
  return idx === -1 ? MEALS.length - 1 : idx
}

function Ring({ person, color, tot }) {
  const kcal = useCountUp(tot.kcal)
  const R = 26, C = 2 * Math.PI * R
  const frac = tot.target ? Math.min(1, tot.kcal / tot.target) : 0
  const diff = tot.kcal - tot.target
  const sub = tot.planned === 0 ? 'No meals planned today'
    : Math.abs(diff) <= tot.target * 0.05 ? `On target · ${tot.prot} g prot`
    : diff > 0 ? `+${diff} kcal · ${tot.prot} g prot` : `${-diff} kcal to go · ${tot.prot} g prot`
  return (
    <div className="hoy-ring mp-glass">
      <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
        <svg width="62" height="62" viewBox="0 0 62 62" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="31" cy="31" r={R} fill="none" stroke="rgba(110,80,50,0.10)" strokeWidth="7" />
          <circle cx="31" cy="31" r={R} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            style={{ strokeDasharray: C, strokeDashoffset: C * (1 - frac), transition: 'stroke-dashoffset 1.2s var(--c-ease)' }} />
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color }}>{person.initial}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span className="mp-num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>
          {kcal} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-ink-3)' }}>/ {tot.target} kcal</span>
        </span>
        <span className="mp-muted" style={{ fontSize: 12.5 }}>{person.name} · {sub}</span>
      </div>
    </div>
  )
}

function Donut({ info }) {
  const [p, c] = macroPct(info)
  const bg = info
    ? `conic-gradient(#2E9BD6 0 ${p}%, #E0A21B ${p}% ${p + c}%, #8B6FE8 ${p + c}% 100%)`
    : 'rgba(110,80,50,0.10)'
  return (
    <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0, borderRadius: '50%', background: bg, boxShadow: '0 8px 22px rgba(110,80,50,0.14)' }}>
      <span style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: '#FBF8F3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mp-num" style={{ fontSize: 15, fontWeight: 700 }}>{info ? `${info.prot} g` : '—'}</span>
        <span style={{ fontSize: 10, color: 'var(--c-ink-3)' }}>prot</span>
      </span>
    </div>
  )
}

function Carousel({ meals, active, setActive, nextIdx, isToday, onOpen }) {
  const [drag, setDrag] = useState(0)
  const st = useRef({ down: false, x: 0, moved: false })
  const W = 250 // px por paso

  function down(e) {
    if (e.button !== 0) return
    st.current = { down: true, x: e.clientX, moved: false }
  }
  function move(e) {
    if (!st.current.down) return
    const dx = e.clientX - st.current.x
    if (Math.abs(dx) > 5) st.current.moved = true
    if (st.current.moved) {
      // resistencia en los extremos
      let d = dx / W
      if ((active === 0 && d > 0) || (active === meals.length - 1 && d < 0)) d *= 0.3
      setDrag(d)
    }
  }
  function up() {
    if (!st.current.down) return
    st.current.down = false
    if (st.current.moved) setActive(Math.max(0, Math.min(meals.length - 1, Math.round(active - drag))))
    setDrag(0)
  }
  function onKey(e) {
    if (e.key === 'ArrowLeft') setActive(Math.max(0, active - 1))
    if (e.key === 'ArrowRight') setActive(Math.min(meals.length - 1, active + 1))
  }

  return (
    <section className="hoy-carousel" aria-label="Today's meals · drag to switch" tabIndex={0} onKeyDown={onKey}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
      style={{ cursor: st.current.down && st.current.moved ? 'grabbing' : 'grab' }}>
      <div className="hoy-stage">
        {meals.map((m, i) => {
          const off = i - active + drag
          const a = Math.abs(off)
          const st2 = MEAL_STYLE[m.type]
          const tf = `translateX(${off * 205}px) translateZ(${-a * 170}px) rotateY(${-off * 24}deg) scale(${1 - Math.min(a, 2) * 0.04})`
          // la vecina se ve; la de dos pasos se desvanece (no invade las columnas laterales)
          const op = a <= 1 ? 1 - a * 0.3 : Math.max(0, 0.7 - (a - 1) * 1.1)
          const on = i === active
          const main = m.rows[0]?.info
          return (
            <article key={m.type} className="hoy-card mp-glass"
              style={{ transform: tf, opacity: op, pointerEvents: op < 0.05 ? 'none' : undefined, filter: a > 0.5 ? `blur(${Math.min(a, 2) * 1.6}px)` : 'none', zIndex: 10 - Math.round(a * 2), transition: drag ? 'none' : undefined }}
              onClick={() => { if (st.current.moved) return; on ? onOpen(m) : setActive(i) }}
              aria-current={on ? 'true' : undefined}>
              {on && <span aria-hidden="true" className="hoy-glow" />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mp-bubble" style={{ width: 44, height: 44, background: st2.tint, color: st2.color, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 16px ${st2.glow}` }}><Icon name={MEAL_ICON[m.type]} size={21} /></span>
                  <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{MEAL_LABEL[m.type]}</span>
                    <span className="mp-muted" style={{ fontSize: 12.5 }}>{MEAL_TIME[m.type]}</span>
                  </span>
                </span>
                {isToday && i === nextIdx && <span className="mp-tag" style={{ background: 'var(--c-ink)', color: '#fff' }}>Next</span>}
              </div>

              {main ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span className="hoy-card-name">{main.name}</span>
                    {m.rows.slice(1).filter(r => r.info && r.info.key !== main.key).map(r => (
                      <span key={r.person.id} style={{ fontSize: 13.5, lineHeight: 1.4, color: 'var(--c-ink-3)' }}>{r.person.name}: {r.info.name}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 'auto' }}>
                    <Donut info={main} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--c-ink-2)' }}>
                      {['Protein', 'Carbs', 'Fat'].map((l, k) => (
                        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="mp-dot" style={{ background: ['#2E9BD6', '#E0A21B', '#8B6FE8'][k] }} />{l} {macroPct(main)[k]}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(m.rows.length, 3)}, minmax(0, 1fr))`, gap: 8 }}>
                    {m.rows.map(r => (
                      <div key={r.person.id} className="hoy-stat">
                        <span className="mp-muted" style={{ fontSize: 11.5 }}>{r.person.name}</span>
                        <span className="mp-num" style={{ fontSize: 17, fontWeight: 600 }}>{r.info ? `${r.info.kcal} kcal` : '—'}</span>
                        <span style={{ fontSize: 11, color: r.info?.pcos && r.person.pcos ? PCOS_STYLE[r.info.pcos].color : 'var(--c-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {!r.info ? 'No dish' : r.person.pcos && r.info.pcos ? PCOS_STYLE[r.info.pcos].label : r.info.portion}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
                  <span className="mp-muted" style={{ fontSize: 15 }}>No dish for {MEAL_LABEL[m.type].toLowerCase()}</span>
                  <span className="mp-btn mp-btn-dark"><Icon name="plus" size={14} stroke={2.6} />Choose dish</span>
                </div>
              )}
            </article>
          )
        })}
      </div>
      <div className="hoy-dots">
        <button type="button" className="mp-icon-btn" style={{ width: 30, height: 30 }} aria-label="Previous meal" onClick={() => setActive(Math.max(0, active - 1))}><Icon name="left" size={12} stroke={2.6} /></button>
        {meals.map((m, i) => (
          <button key={m.type} type="button" aria-label={MEAL_LABEL[m.type]} onClick={() => setActive(i)}
            style={{ width: i === active ? 26 : 8, height: 8, borderRadius: 4, border: 0, padding: 0, cursor: 'pointer', background: i === active ? MEAL_STYLE[m.type].color : 'rgba(110,80,50,0.2)', transition: 'width .5s var(--c-spring), background .3s' }} />
        ))}
        <button type="button" className="mp-icon-btn" style={{ width: 30, height: 30 }} aria-label="Next meal" onClick={() => setActive(Math.min(meals.length - 1, active + 1))}><Icon name="right" size={12} stroke={2.6} /></button>
      </div>
    </section>
  )
}

export default function HomeView() {
  const allIng     = useStore(selectAllIng)
  const allCombos  = useStore(selectAllCombos)
  const weekPlan   = useStore(s => s.weekPlan)
  const profiles   = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const replaceWeek = useStore(s => s.replaceWeek)
  const setView    = useStore(s => s.setView)
  const openPlanner = useStore(s => s.openPlanner)
  useStore(s => s.batchSettings) // repintar si cambian los días de batch

  const now = new Date()
  const today = startOfDay(now)
  const monday = mondayOf(today)
  const wk = weekKeyOf(monday)
  const week = weekPlan[wk] ?? {}
  const di = dayIndexOf(today)
  const dk = DAY_KEYS[di]
  const people = activeProfilesOn(profiles, today)
  const focus = activeProfileId === 'all' ? people : people.filter(p => p.id === activeProfileId)
  const shown = focus.length ? focus : people
  const colorOf = p => PERSON_COLOR[Math.max(0, people.findIndex(x => x.id === p.id)) % PERSON_COLOR.length]

  const nextIdx = nextMealIndex(now)
  const [active, setActive] = useState(nextIdx)
  const [picker, setPicker] = useState(null)   // { mealType, currentKey, who }
  const [sheet, setSheet] = useState(null)     // mealType
  const [models, setModels] = useState(false)

  // Limpia huecos rotos de esta semana (una sola escritura)
  useEffect(() => {
    const cleaned = cleanWeek(weekPlan[wk], allCombos)
    if (cleaned) replaceWeek(wk, cleaned)
  }, [wk]) // eslint-disable-line react-hooks/exhaustive-deps

  const meals = useMemo(() => MEALS.map(type => ({
    type,
    rows: shown.map(person => ({ person, info: mealInfo(dayForPerson(week, dk, person.id), type, person, di, allIng, allCombos) })),
  })), [week, dk, di, shown.map(p => p.id).join(), allIng, allCombos]) // eslint-disable-line react-hooks/exhaustive-deps

  const totals = shown.map(p => ({ p, tot: dayTotals(dayForPerson(week, dk, p.id), p, di, allIng, allCombos) }))

  // Semana (tira de abajo)
  const strip = DAY_KEYS.map((d, i) => {
    const date = addDays(monday, i)
    const ps = activeProfilesOn(shown, date)
    const first = ps[0]
    const day = first ? dayForPerson(week, d, first.id) : {}
    const name = m => { const k = day[m]?.recipeKey; return k && allCombos[k] ? shortName(allCombos[k].name) : null }
    const cost = ps.reduce((s, p) => s + dayTotals(dayForPerson(week, d, p.id), p, i, allIng, allCombos).cost, 0)
    const planned = MEALS.filter(m => week[`${d}-${m}`]).length
    return { d, i, date, com: name('comida'), cen: name('cena'), cost, planned }
  })
  const weekCost = strip.reduce((s, x) => s + x.cost, 0)

  // Accesos (cifras reales)
  const plannedThis = DAY_KEYS.reduce((s, d) => s + MEALS.filter(m => week[`${d}-${m}`]).length, 0)
  // El próximo batch por cocinar (Ajustes → días de batch).
  const nb = nextBatch(today)
  const nbDates = sessionDates(nb.monday, nb.si)
  const nextWeek = weekPlan[weekKeyOf(nb.monday)] ?? {}
  const nextIngs = new Set()
  let tuppers = 0
  nbDates.forEach(({ dayKey: d, date }) => {
    activeProfilesOn(profiles, date).forEach(p => {
      MEALS.forEach(m => {
        const meal = dayForPerson(nextWeek, d, p.id)[m]
        const combo = meal && allCombos[meal.recipeKey]
        if (!combo) return
        combo.items.forEach(it => nextIngs.add(it.k))
        if (m === 'comida' || m === 'cena') tuppers++
      })
    })
  })
  const cookIsToday = +startOfDay(nb.cookDate) === +startOfDay(today)
  const inUse = new Set()
  Object.values(weekPlan).forEach(w => Object.values(w ?? {}).forEach(s => {
    if (!s) return
    if (s.byPerson) Object.values(s.byPerson).forEach(m => m?.recipeKey && inUse.add(m.recipeKey))
    else if (s.recipeKey) inUse.add(s.recipeKey)
  }))
  const apps = [
    { l: 'Planner', icon: 'cal', c: '#1F1B16', g: 'rgba(31,27,22,0.25)', v: `${plannedThis}/28`, title: 'Meals planned this week', go: () => openPlanner(0, di) },
    { l: 'Model weeks', icon: 'layers', c: '#7154DA', g: 'rgba(139,111,232,0.45)', v: 'Load', title: 'Load a whole model week', go: () => setModels(true) },
    { l: 'Shopping', icon: 'bag', c: '#C1850C', g: 'rgba(224,162,27,0.45)', v: nextIngs.size ? `${nextIngs.size} items` : 'Empty', title: `For the ${rangeLabel(nbDates.map(x => DAY_KEYS.indexOf(x.dayKey)))} batch (${nbDates[0].date.getDate()}–${nbDates[nbDates.length - 1].date.getDate()})`, go: () => setView('compra') },
    { l: 'Batch', icon: 'pot', c: '#D9486A', g: 'rgba(232,98,124,0.45)', v: cookIsToday ? 'Today' : `${DAY_SHORT_EN[(nb.cookDate.getDay() + 6) % 7]} ${nb.cookDate.getDate()}`, title: tuppers ? `${tuppers} lunch & dinner containers` : 'Next week not planned yet', go: () => setView('batch') },
    { l: 'Dishes', icon: 'plate', c: '#2585BC', g: 'rgba(46,155,214,0.45)', v: `${Object.keys(allCombos).length}`, title: `${inUse.size} in some plan`, go: () => setView('platos') },
    { l: 'Ingredients', icon: 'leaf', c: '#2F9E5B', g: 'rgba(47,158,91,0.45)', v: `${Object.keys(allIng).length}`, title: 'Prices and nutrition', go: () => setView('ingredientes') },
  ]

  const sheetMeal = sheet ? meals.find(m => m.type === sheet) : null
  const who = activeProfileId === 'all' ? 'all' : activeProfileId

  function openMeal(m) {
    if (m.rows.some(r => r.info)) setSheet(m.type)
    else setPicker({ mealType: m.type, currentKey: null, who })
  }
  function clearMeal(type) {
    const key = `${dk}-${type}`
    const w = (type === 'comida' || type === 'cena') ? 'all' : who
    replaceWeek(wk, weekWith(week, key, clearFor(week[key], w, people)))
  }

  const dayNum = useCountUp(today.getDate(), 700)

  return (
    <div className="hoy">
      <section className="hoy-left mp-rise">
        <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--c-ink-3)' }}>{DAY_LONG[di]}</span>
        <span className="hoy-date mp-num">{dayNum}</span>
        <span style={{ fontSize: 15, color: 'var(--c-ink-3)', marginTop: 8 }}>
          {MONTHS[today.getMonth()]} · {batchesCookedOn(today).length ? 'batch day' : batchDayKeys().includes(dk) ? 'batch week' : 'free day'}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'clamp(14px, 3vh, 28px)' }}>
          {totals.map(({ p, tot }) => <Ring key={p.id} person={p} color={colorOf(p)} tot={tot} />)}
        </div>
      </section>

      <Carousel meals={meals} active={active} setActive={setActive} nextIdx={nextIdx} isToday onOpen={openMeal} />

      <section className="hoy-apps" aria-label="Sections">
        {apps.map((a, i) => (
          <button key={a.l} type="button" className="hoy-app mp-rise" onClick={a.go} title={a.title} style={{ animationDelay: `${120 + i * 60}ms` }}>
            <span className="hoy-app-sq mp-rim">
              <Icon name={a.icon} size={32} stroke={1.8} color={a.c} style={{ filter: `drop-shadow(0 3px 8px ${a.g})` }} />
              <span className="mp-num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-ink-2)' }}>{a.v}</span>
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.l}</span>
          </button>
        ))}
      </section>

      <section className="hoy-week mp-glass mp-rise" aria-label="This week" style={{ animationDelay: '320ms' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>This week</span>
          <span style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
            <span className="mp-muted" style={{ fontSize: 12 }}>Cost {shown.length > 1 ? `for ${shown.length === 2 ? 'both' : 'everyone'}` : `· ${shown[0]?.name ?? ''}`}</span>
            <span className="mp-num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em' }}>{fmtMoney(weekCost)}</span>
          </span>
        </div>
        {strip.map(s => {
          const isToday = s.i === di
          const past = s.i < di
          const tag = isToday ? 'Today' : s.i === 6 ? 'Batch' : null
          return (
            <button key={s.d} type="button" className={`hoy-day${isToday ? ' is-today' : ''}`} onClick={() => openPlanner(0, s.i)} style={{ opacity: past ? 0.55 : 1 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isToday ? '#D9486A' : 'var(--c-ink)' }}>{DAY_SHORT[s.i]}</span>
                  <span className="mp-muted" style={{ fontSize: 12 }}>{s.date.getDate()}</span>
                </span>
                {tag && <span className="mp-tag" style={isToday ? { background: 'var(--c-ink)', color: '#fff' } : { background: 'rgba(232,98,124,0.14)', color: '#C2375A' }}>{tag}</span>}
              </span>
              {[['comida', s.com], ['cena', s.cen]].map(([m, n]) => (
                <span key={m} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <span className="mp-bubble" style={{ width: 20, height: 20, background: MEAL_STYLE[m].tint, color: MEAL_STYLE[m].color }}><Icon name={MEAL_ICON[m]} size={11} stroke={2.4} /></span>
                  <span className="hoy-day-dish" style={{ fontWeight: n ? 600 : 400, color: n ? 'var(--c-ink)' : 'var(--c-ink-3)' }}>{n ?? 'No dish'}</span>
                </span>
              ))}
              <span className="mp-muted mp-num" style={{ marginTop: 'auto', fontSize: 11.5 }}>{s.planned ? `${fmtMoney(s.cost)} · ${s.planned}/4` : 'Empty'}</span>
            </button>
          )
        })}
      </section>

      {sheetMeal && (
        <MealSheet mealType={sheetMeal.type} dayLabel={`today, ${DAY_LONG[di]} ${today.getDate()}`} rows={sheetMeal.rows}
          onClose={() => setSheet(null)}
          onClear={() => clearMeal(sheetMeal.type)}
          onChange={() => { const k = sheetMeal.rows.find(r => r.info)?.info.key; setSheet(null); setPicker({ mealType: sheetMeal.type, currentKey: k, who }) }} />
      )}
      {picker && (
        <DishPicker weekKey={wk} weekData={week} dayKey={dk} date={today} mealType={picker.mealType}
          initialWho={picker.who} currentKey={picker.currentKey} onClose={() => setPicker(null)} />
      )}
      {models && <ModelWeekSheet initialTarget={1} onClose={() => setModels(false)} onLoaded={t => openPlanner(t, 0)} />}
    </div>
  )
}
