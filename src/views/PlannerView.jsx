import { useEffect, useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import Icon, { MEAL_ICON } from '../components/ui/Icon'
import Segmented from '../components/ui/Segmented'
import DishPicker from '../components/meal/DishPicker'
import MealSheet from '../components/meal/MealSheet'
import ModelWeekSheet from '../components/meal/ModelWeekSheet'
import SnackPlannerSheet from '../components/meal/SnackPlannerSheet'
import SaveWeekSheet from '../components/meal/SaveWeekSheet'
import { clearFor, weekWith, cleanWeek } from '../lib/planActions'
import {
  DAY_KEYS, DAY_SHORT, DAY_LONG, MONTHS, MEALS, MEAL_LABEL, MEAL_TIME, MEAL_STYLE, PCOS_STYLE, PERSON_COLOR,
  addDays, mondayOf, weekKeyOf, dayIndexOf, sameDay, startOfDay, fmtMoney, fmtRange, fmtShortDate,
  activeProfilesOn, dayForPerson, mealInfo, dayTotals, shortName,
} from '../lib/mealplan'
import { batchesCookedOn, sessionDates } from '../lib/batchConfig'

// ─── Planificador ───────────────────────────────────────────────────────────
// Semana: 7 columnas, el día elegido se despliega con sus 4 comidas. Encima,
// la banda del batch deja claro qué días salen del domingo (lun-vie) y cuáles
// se cocinan en el día (sáb-dom). Al poner un plato en lun-vie, por defecto
// va a los 5 días del batch (DishPicker → «Aplicar a»).
// Mes: el calendario del mes con comida y cena de cada día.


function MealRow({ type, rows, pcosPerson, onOpen, delay }) {
  const st = MEAL_STYLE[type]
  const main = rows.find(r => r.info)?.info
  const others = rows.filter(r => r.info && main && r.info.key !== main.key)
  const pcos = pcosPerson && (type === 'desayuno' || type === 'cena') ? rows.find(r => r.person.id === pcosPerson.id)?.info?.pcos : null
  return (
    <button type="button" className={`plan-meal mp-in${main ? '' : ' is-empty'}`} onClick={onOpen} style={{ animationDelay: `${delay}ms` }}>
      <span className="mp-bubble" style={{ width: 38, height: 38, background: st.tint, color: st.color, boxShadow: `inset 0 1px 0 #fff, 0 5px 14px ${st.glow}` }}><Icon name={MEAL_ICON[type]} size={18} /></span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5, color: 'var(--c-ink-3)' }}>
          <span>{MEAL_LABEL[type]} · {MEAL_TIME[type]}</span>
          {pcos && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: PCOS_STYLE[pcos].color }}><span className="mp-dot" style={{ background: PCOS_STYLE[pcos].color }} />{PCOS_STYLE[pcos].label}{rows.length > 1 ? ` · ${pcosPerson.initial}` : ''}</span>}
        </span>
        {main ? (
          <>
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>{main.name}</span>
            {others.map(r => <span key={r.person.id} style={{ fontSize: 12, color: 'var(--c-ink-2)' }}>{r.person.name}: {r.info.name}</span>)}
            <span className="mp-num" style={{ fontSize: 12, color: 'var(--c-ink-2)' }}>
              {rows.map(r => r.info ? `${r.person.initial} ${r.info.kcal}` : `${r.person.initial} —`).join(' · ')} kcal
              {rows.length === 1 && rows[0].info ? ` · ${rows[0].info.prot} g prot · ${fmtMoney(rows[0].info.cost)}` : ''}
            </span>
          </>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--c-ink-3)' }}><Icon name="plus" size={13} stroke={2.6} />Add {MEAL_LABEL[type].toLowerCase()}</span>
        )}
      </span>
    </button>
  )
}

function DayTotals({ totals, colorOf }) {
  return (
    <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: `repeat(${totals.length}, minmax(0, 1fr))`, gap: 8 }}>
      {totals.map(({ p, t }) => {
        const pct = t.target ? Math.min(100, t.kcal / t.target * 100) : 0
        const diff = t.kcal - t.target
        const ok = Math.abs(diff) <= t.target * 0.05
        return (
          <div key={p.id} className="plan-total">
            <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <strong>{p.name}</strong><span className="mp-muted mp-num">{t.kcal} / {t.target}</span>
            </span>
            <span style={{ height: 6, borderRadius: 3, background: 'rgba(110,80,50,0.12)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 3, background: colorOf(p), animation: 'mp-grow 1.2s var(--c-ease) both' }} />
            </span>
            <span className="mp-num" style={{ fontSize: 11.5, color: t.planned === 0 ? 'var(--c-ink-3)' : ok ? 'var(--c-green)' : 'var(--c-ink-3)' }}>
              {t.planned === 0 ? 'No meals' : ok ? 'On target' : diff > 0 ? `+${diff} kcal` : `${-diff} to go`} · {t.prot} g{p.protCap && t.prot > p.protCap ? ` (cap ${p.protCap})` : ''} · {fmtMoney(t.cost)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MonthView({ monthDate, weekPlan, shown, allCombos, today, onPick }) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const start = mondayOf(first)
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const weeks = Math.ceil((dayIndexOf(first) + last.getDate()) / 7)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i))
  return (
    <section className="plan-month mp-glass mp-rise" aria-label="Month" style={{ gridTemplateRows: `26px repeat(${weeks}, minmax(112px, 1fr))` }}>
      {DAY_SHORT.map(d => <span key={d} style={{ paddingLeft: 8, fontSize: 12, fontWeight: 600, color: 'var(--c-ink-3)' }}>{d}</span>)}
      {cells.map((date, i) => {
        const inMonth = date.getMonth() === monthDate.getMonth()
        const isToday = sameDay(date, today)
        const dk = DAY_KEYS[i % 7]
        const week = weekPlan[weekKeyOf(mondayOf(date))] ?? {}
        const person = activeProfilesOn(shown, date)[0]
        const day = person ? dayForPerson(week, dk, person.id) : {}
        const name = m => { const k = day[m]?.recipeKey; return k && allCombos[k] ? shortName(allCombos[k].name) : null }
        const com = name('comida'), cen = name('cena')
        // Días de cocinar según Ajustes; «listo» si ese batch ya tiene platos.
        const cooked = batchesCookedOn(date)
        const isCookDay = cooked.length > 0
        const batchReady = cooked.some(b => sessionDates(b.monday, b.si).some(x => (weekPlan[x.wk] ?? {})[`${x.dayKey}-comida`] || (weekPlan[x.wk] ?? {})[`${x.dayKey}-cena`]))
        return (
          <button key={i} type="button" className="plan-mcell mp-in" onClick={() => onPick(date)}
            style={{ opacity: inMonth ? (date < today && !isToday ? 0.6 : 1) : 0.32, background: isToday ? '#FFFFFF' : undefined, boxShadow: isToday ? '0 10px 24px rgba(110,80,50,0.14)' : undefined, animationDelay: `${Math.min(i, 34) * 12}ms` }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span className="mp-num" style={{ minWidth: 26, height: 26, padding: '0 6px', boxSizing: 'border-box', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 700, background: isToday ? 'var(--c-ink)' : 'transparent', color: isToday ? '#fff' : 'var(--c-ink)' }}>{date.getDate()}</span>
              {isCookDay && inMonth && <span className="mp-tag" style={{ background: batchReady ? 'rgba(232,98,124,0.14)' : 'rgba(110,80,50,0.08)', color: batchReady ? '#C2375A' : 'var(--c-ink-3)' }}>Batch</span>}
            </span>
            {(com || cen) && (
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minWidth: 0 }}>
                {[['comida', com], ['cena', cen]].filter(x => x[1]).map(([m, n]) => (
                  <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span className="mp-dot" style={{ width: 6, height: 6, flexShrink: 0, background: MEAL_STYLE[m].color }} />{n}
                  </span>
                ))}
              </span>
            )}
            <span style={{ marginTop: 'auto', display: 'flex', gap: 3 }}>
              {MEALS.map(m => <span key={m} style={{ width: 14, height: 4, borderRadius: 2, background: week[`${dk}-${m}`] ? MEAL_STYLE[m].color : 'rgba(110,80,50,0.12)' }} />)}
            </span>
          </button>
        )
      })}
    </section>
  )
}

export default function PlannerView() {
  const allIng      = useStore(selectAllIng)
  const allCombos   = useStore(selectAllCombos)
  const weekPlan    = useStore(s => s.weekPlan)
  useStore(s => s.batchSettings) // repintar si cambian los días de batch
  const profiles    = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const setActiveProfile = useStore(s => s.setActiveProfile)
  const weekOffset  = useStore(s => s.weekOffset)
  const setWeekOffset = useStore(s => s.setWeekOffset)
  const plannerDay  = useStore(s => s.plannerDay)
  const setPlannerDay = useStore(s => s.setPlannerDay)
  const replaceWeek = useStore(s => s.replaceWeek)

  const today = startOfDay(new Date())
  const monday = addDays(mondayOf(today), weekOffset * 7)
  const wk = weekKeyOf(monday)
  const week = weekPlan[wk] ?? {}
  const todayIdx = weekOffset === 0 ? dayIndexOf(today) : -1
  const sel = plannerDay ?? (todayIdx >= 0 ? todayIdx : 0)

  const [mode, setMode] = useState('week')
  const [monthDate, setMonthDate] = useState(() => addDays(monday, 3))
  const [picker, setPicker] = useState(null)  // { dayIdx, mealType, currentKey, who }
  const [sheet, setSheet] = useState(null)    // { dayIdx, mealType }
  const [models, setModels] = useState(false)
  const [snacks, setSnacks] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedName, setSavedName] = useState(null)
  const editingWeek = useStore(s => s.editingWeek)
  const setEditingWeek = useStore(s => s.setEditingWeek)
  const linked = editingWeek?.weekKey === wk ? editingWeek : null
  useEffect(() => { if (!savedName) return; const t = setTimeout(() => setSavedName(null), 2600); return () => clearTimeout(t) }, [savedName])

  useEffect(() => {
    const cleaned = cleanWeek(weekPlan[wk], allCombos)
    if (cleaned) replaceWeek(wk, cleaned)
  }, [wk]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setConfirmClear(false) }, [wk])

  const people = activeProfilesOn(profiles, addDays(monday, 2))
  const focus = activeProfileId === 'all' ? people : people.filter(p => p.id === activeProfileId)
  const shown = focus.length ? focus : people
  const colorOf = p => PERSON_COLOR[Math.max(0, profiles.findIndex(x => x.id === p.id)) % PERSON_COLOR.length]
  const who = activeProfileId === 'all' ? 'all' : activeProfileId

  const days = useMemo(() => DAY_KEYS.map((dk, i) => {
    const date = addDays(monday, i)
    const ps = activeProfilesOn(shown, date)
    const meals = Object.fromEntries(MEALS.map(m => [m, ps.map(person => ({ person, info: mealInfo(dayForPerson(week, dk, person.id), m, person, i, allIng, allCombos) }))]))
    const totals = ps.map(p => ({ p, t: dayTotals(dayForPerson(week, dk, p.id), p, i, allIng, allCombos) }))
    const planned = MEALS.filter(m => week[`${dk}-${m}`]).length
    return { dk, i, date, meals, totals, planned, cost: totals.reduce((s, x) => s + x.t.cost, 0) }
  }), [week, wk, shown.map(p => p.id).join(), allIng, allCombos]) // eslint-disable-line react-hooks/exhaustive-deps

  const planned = days.reduce((s, d) => s + d.planned, 0)
  const weekCost = days.reduce((s, d) => s + d.cost, 0)
  const prevKey = weekKeyOf(addDays(monday, -7))
  const hasPrev = Object.values(weekPlan[prevKey] ?? {}).some(Boolean)
  const pcosPerson = shown.find(p => p.pcos)

  const cols = DAY_KEYS.map((_, i) => i === sel ? 'minmax(0, 2.7fr)' : 'minmax(0, 1fr)').join(' ')

  function openSlot(dayIdx, mealType) {
    const rows = days[dayIdx].meals[mealType]
    if (rows.some(r => r.info)) setSheet({ dayIdx, mealType })
    else setPicker({ dayIdx, mealType, currentKey: null, who })
  }
  function clearSlot(dayIdx, mealType) {
    const key = `${DAY_KEYS[dayIdx]}-${mealType}`
    const w = (mealType === 'comida' || mealType === 'cena') ? 'all' : who
    replaceWeek(wk, weekWith(week, key, clearFor(week[key], w, people)))
  }
  function goToDate(date) {
    const off = Math.round((mondayOf(date) - mondayOf(today)) / (7 * 86400000))
    setWeekOffset(off); setPlannerDay(dayIndexOf(date)); setMode('week')
  }
  function nav(step) {
    if (mode === 'month') setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + step, 1))
    else { setWeekOffset(weekOffset + step); setPlannerDay(null) }
  }
  function goToday() {
    setWeekOffset(0); setPlannerDay(null); setMonthDate(today)
  }

  const title = mode === 'month'
    ? `${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`
    : weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : `Week of ${fmtShortDate(monday)}`
  const sub = mode === 'month' ? 'Tap a day to open it in the week view'
    : `${fmtRange(monday, addDays(monday, 6))} · ${planned}/28 meals · ${fmtMoney(weekCost)}`

  const sheetDay = sheet ? days[sheet.dayIdx] : null
  const pickDay = picker ? days[picker.dayIdx] : null

  return (
    <div className="plan">
      <div className="mp-page-head mp-rise">
        <div className="mp-page-title"><h1>{title}</h1><span>{sub}</span></div>
        <div className="mp-page-tools">
          <Segmented label="Vista" value={mode} onChange={m => { setMode(m); if (m === 'month') setMonthDate(addDays(monday, 3)) }}
            options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
          {people.length > 1 && (
            <Segmented label="Person" value={activeProfileId === 'all' ? 'all' : activeProfileId} onChange={setActiveProfile}
              options={[{ value: 'all', label: 'Everyone' }, ...people.map(p => ({ value: p.id, label: p.name }))]} />
          )}
          <div className="mp-seg" style={{ gap: 0 }}>
            <button type="button" aria-label="Previous" onClick={() => nav(-1)} style={{ padding: '0 10px' }}><Icon name="left" size={12} stroke={2.6} /></button>
            <button type="button" onClick={goToday} style={{ fontWeight: 600, color: 'var(--c-ink)' }}>Today</button>
            <button type="button" aria-label="Next" onClick={() => nav(1)} style={{ padding: '0 10px' }}><Icon name="right" size={12} stroke={2.6} /></button>
          </div>
        </div>
      </div>

      {mode === 'week' && (
        <>
          <div className="plan-actions mp-rise" style={{ animationDelay: '60ms' }}>
            <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setModels(true)}><Icon name="layers" size={14} />Load model week</button>
            <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setSnacks(true)} title="Build snacks or breakfasts from ingredients: batches, new-ingredient cap, lock days"><Icon name="sparkle" size={14} />Plan snacks</button>
            <button className="mp-btn mp-btn-glass mp-btn-sm" disabled={!planned} onClick={() => setSaving(true)} title={planned ? 'Save it with a name to load it again later' : 'The week is empty'}>
              <Icon name="sparkle" size={14} />{linked ? `Save changes to “${linked.name.length > 20 ? linked.name.slice(0, 18) + '…' : linked.name}”` : 'Save week'}
            </button>
            <button className="mp-btn mp-btn-glass mp-btn-sm" disabled={!hasPrev} onClick={() => replaceWeek(wk, { ...(weekPlan[prevKey] ?? {}) })} title={hasPrev ? 'Copies all 28 meals from last week' : 'Last week is empty'}><Icon name="repeat" size={14} />Repeat last week</button>
            {planned > 0 && (confirmClear
              ? <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="mp-muted" style={{ fontSize: 12.5 }}>Clear all {planned} meals?</span>
                  <button className="mp-btn mp-btn-danger mp-btn-sm" onClick={() => { replaceWeek(wk, {}); setConfirmClear(false) }}>Clear</button>
                  <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setConfirmClear(false)}>No</button>
                </span>
              : <button className="mp-btn mp-btn-glass mp-btn-sm" onClick={() => setConfirmClear(true)}><Icon name="trash" size={14} />Clear week</button>)}
            {savedName && <span className="mp-chip mp-in" style={{ color: 'var(--c-green)' }}><Icon name="check" size={13} stroke={2.6} />Saved as “{savedName}”</span>}
            {!savedName && linked && (
              <span className="mp-chip" style={{ color: '#5B3FC4' }} title="Changes you make here can be saved to that model week">
                Editing “{linked.name}”
                <button type="button" aria-label="Stop editing" onClick={() => setEditingWeek(null)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, marginLeft: 2 }}><Icon name="x" size={10} stroke={3} /></button>
              </span>
            )}
          </div>

          <div className="plan-grid" style={{ gridTemplateColumns: cols }}>
            {days.map(d => {
              const big = d.i === sel
              const isToday = d.i === todayIdx
              const past = todayIdx >= 0 && d.i < todayIdx
              const tag = isToday ? 'Today' : batchesCookedOn(d.date).length ? 'Batch' : null
              return (
                <article key={d.dk} className={`plan-day mp-glass mp-rise${big ? ' is-big' : ''}`}
                  style={{ animationDelay: `${80 + d.i * 40}ms`, opacity: past && !big ? 0.62 : 1 }}
                  onClick={big ? undefined : () => setPlannerDay(d.i)}
                  aria-label={`${DAY_LONG[d.i]} ${d.date.getDate()}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isToday ? '#D9486A' : 'var(--c-ink-3)' }}>{big ? DAY_LONG[d.i] : DAY_SHORT[d.i]}</span>
                      <span className="mp-num" style={{ fontSize: big ? 34 : 22, fontWeight: 700, letterSpacing: '-0.03em', transition: 'font-size .5s var(--c-ease)' }}>{d.date.getDate()}</span>
                    </span>
                    {tag && (
                      <span className="mp-tag" style={tag === 'Today' ? { background: 'var(--c-ink)', color: '#fff' } : { background: 'rgba(232,98,124,0.14)', color: '#C2375A' }}>
                        {tag}
                      </span>
                    )}
                  </div>

                  {big ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
                      {MEALS.map((m, k) => (
                        <MealRow key={m} type={m} rows={d.meals[m]} pcosPerson={pcosPerson} delay={k * 50} onOpen={() => openSlot(d.i, m)} />
                      ))}
                      <DayTotals totals={d.totals} colorOf={colorOf} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1 }}>
                      {MEALS.map(m => {
                        const r = d.meals[m].find(x => x.info)
                        const pc = pcosPerson && (m === 'desayuno' || m === 'cena') ? d.meals[m].find(x => x.person.id === pcosPerson.id)?.info?.pcos : null
                        return (
                          <div key={m} className="plan-chip">
                            <span className="mp-bubble" style={{ width: 24, height: 24, background: MEAL_STYLE[m].tint, color: MEAL_STYLE[m].color }}><Icon name={MEAL_ICON[m]} size={12} stroke={2.4} /></span>
                            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 10.5, color: 'var(--c-ink-3)' }}>{MEAL_LABEL[m]}</span>
                              <span style={{ fontSize: 12, fontWeight: r ? 600 : 400, lineHeight: 1.25, color: r ? 'var(--c-ink)' : 'var(--c-ink-3)' }}>{r ? shortName(r.info.name) : '—'}</span>
                            </span>
                            {pc && <span className="mp-dot" style={{ marginLeft: 'auto', width: 6, height: 6, flexShrink: 0, marginTop: 4, background: PCOS_STYLE[pc].color }} />}
                          </div>
                        )
                      })}
                      <span className="mp-num" style={{ marginTop: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--c-ink-2)' }}>{d.planned ? fmtMoney(d.cost) : 'Empty'}</span>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </>
      )}

      {mode === 'month' && (
        <MonthView monthDate={monthDate} weekPlan={weekPlan} shown={shown} allCombos={allCombos} today={today} onPick={goToDate} />
      )}

      {sheetDay && (
        <MealSheet mealType={sheet.mealType} dayLabel={`${DAY_LONG[sheetDay.i]} ${sheetDay.date.getDate()}`} rows={sheetDay.meals[sheet.mealType]}
          onClose={() => setSheet(null)}
          onClear={() => clearSlot(sheetDay.i, sheet.mealType)}
          onChange={() => {
            const k = sheetDay.meals[sheet.mealType].find(r => r.info)?.info.key
            setPicker({ dayIdx: sheetDay.i, mealType: sheet.mealType, currentKey: k, who }); setSheet(null)
          }} />
      )}
      {pickDay && (
        <DishPicker weekKey={wk} weekData={week} dayKey={pickDay.dk} date={pickDay.date} mealType={picker.mealType}
          initialWho={picker.who} currentKey={picker.currentKey} onClose={() => setPicker(null)} />
      )}
      {saving && <SaveWeekSheet weekKey={wk} monday={monday} onClose={() => setSaving(false)} onSaved={setSavedName} />}
      {snacks && <SnackPlannerSheet wk={wk} week={week} monday={monday} onClose={() => setSnacks(false)} />}
      {models && <ModelWeekSheet initialTarget={weekOffset} onClose={() => setModels(false)} onLoaded={t => { setWeekOffset(t); setPlannerDay(null) }} />}
    </div>
  )
}
