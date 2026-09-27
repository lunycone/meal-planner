import { useEffect, useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../store/useStore'
import Icon, { MEAL_ICON } from '../components/ui/Icon'
import DishPicker from '../components/meal/DishPicker'
import MealSheet from '../components/meal/MealSheet'
import ModelWeekSheet from '../components/meal/ModelWeekSheet'
import SaveWeekSheet from '../components/meal/SaveWeekSheet'
import { clearFor, weekWith, cleanWeek } from '../lib/planActions'
import {
  DAY_KEYS, DAY_SHORT, DAY_LONG, MEALS, MEAL_LABEL, MEAL_STYLE, PERSON_COLOR,
  addDays, mondayOf, weekKeyOf, dayIndexOf, startOfDay, fmtMoney, fmtRange, activeProfilesOn, dayForPerson, mealInfo, dayTotals, shortName,
} from '../lib/mealplan'
import { MHeader } from './MobileApp'
import { batchesCookedOn } from '../lib/batchConfig'

// Semana en el móvil: los 7 días en lista (comida y cena a la vista); tocar
// un día lo despliega con sus 4 comidas. Un plato puesto en lun-vie va por
// defecto a los días de su batch (DishPicker, Ajustes).

export default function MSemana({ unseen, onIdeas }) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  useStore(s => s.batchSettings) // repintar si cambian los días de batch
  const profiles = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const weekOffset = useStore(s => s.weekOffset)
  const setWeekOffset = useStore(s => s.setWeekOffset)
  const plannerDay = useStore(s => s.plannerDay)
  const replaceWeek = useStore(s => s.replaceWeek)

  const today = startOfDay(new Date())
  const monday = addDays(mondayOf(today), weekOffset * 7)
  const wk = weekKeyOf(monday)
  const week = weekPlan[wk] ?? {}
  const todayIdx = weekOffset === 0 ? dayIndexOf(today) : -1
  const [open, setOpen] = useState(plannerDay ?? (todayIdx >= 0 ? todayIdx : 0))
  const [picker, setPicker] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [models, setModels] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const cleaned = cleanWeek(weekPlan[wk], allCombos)
    if (cleaned) replaceWeek(wk, cleaned)
  }, [wk]) // eslint-disable-line react-hooks/exhaustive-deps

  const people = activeProfilesOn(profiles, addDays(monday, 2))
  const shown = activeProfileId === 'all' ? people : people.filter(p => p.id === activeProfileId)
  const focus = shown.length ? shown : people
  const who = activeProfileId === 'all' ? 'all' : activeProfileId
  const colorOf = p => PERSON_COLOR[Math.max(0, profiles.findIndex(x => x.id === p.id)) % PERSON_COLOR.length]

  const days = useMemo(() => DAY_KEYS.map((dk, i) => {
    const date = addDays(monday, i)
    const ps = activeProfilesOn(focus, date)
    const meals = Object.fromEntries(MEALS.map(m => [m, ps.map(person => ({ person, info: mealInfo(dayForPerson(week, dk, person.id), m, person, i, allIng, allCombos) }))]))
    const totals = ps.map(p => ({ p, t: dayTotals(dayForPerson(week, dk, p.id), p, i, allIng, allCombos) }))
    return { dk, i, date, meals, totals, planned: MEALS.filter(m => week[`${dk}-${m}`]).length, cost: totals.reduce((s, x) => s + x.t.cost, 0) }
  }), [week, wk, focus.map(p => p.id).join(), allIng, allCombos]) // eslint-disable-line react-hooks/exhaustive-deps

  const planned = days.reduce((s, d) => s + d.planned, 0)
  const weekCost = days.reduce((s, d) => s + d.cost, 0)
  const title = weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : 'Week'

  function openSlot(i, m) {
    if (days[i].meals[m].some(r => r.info)) setSheet({ i, m })
    else setPicker({ i, m, currentKey: null })
  }
  function clearSlot(i, m) {
    const key = `${DAY_KEYS[i]}-${m}`
    replaceWeek(wk, weekWith(week, key, clearFor(week[key], (m === 'comida' || m === 'cena') ? 'all' : who, people)))
  }
  const shortOf = (d, m) => { const r = d.meals[m].find(x => x.info); return r ? shortName(r.info.name) : null }
  const sd = sheet ? days[sheet.i] : null, pd = picker ? days[picker.i] : null

  return (
    <div className="m-page">
      <MHeader title={title} sub={`${fmtRange(monday, addDays(monday, 6))} · ${planned}/28 · ${fmtMoney(weekCost)}`} unseen={unseen} onIdeas={onIdeas} />
      <div className="ms-nav">
        <button type="button" aria-label="Previous week" onClick={() => { setWeekOffset(weekOffset - 1); setOpen(0) }}><Icon name="left" size={14} stroke={2.6} /></button>
        <button type="button" onClick={() => { setWeekOffset(0); setOpen(dayIndexOf(today)) }} disabled={weekOffset === 0}>Today</button>
        <button type="button" aria-label="Next week" onClick={() => { setWeekOffset(weekOffset + 1); setOpen(0) }}><Icon name="right" size={14} stroke={2.6} /></button>
      </div>
      <div className="ms-actions">
        <button type="button" onClick={() => setModels(true)}><Icon name="layers" size={16} color="#7154DA" />Model weeks</button>
        <button type="button" onClick={() => setSaving(true)} disabled={!planned}><Icon name="sparkle" size={16} />Save week</button>
      </div>

      {days.map(d => {
        const isOpen = open === d.i, isToday = d.i === todayIdx
        const tag = isToday ? 'Today' : batchesCookedOn(d.date).length ? 'Batch' : null
        return (
          <div key={d.dk} className={`ms-day mp-in${isOpen ? ' is-open' : ''}`} style={{ opacity: todayIdx >= 0 && d.i < todayIdx && !isOpen ? 0.62 : 1, animationDelay: `${d.i * 35}ms` }}>
            <button type="button" className="ms-day-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : d.i)}>
              <span className="ms-date"><span style={{ color: isToday ? '#D9486A' : undefined }}>{DAY_SHORT[d.i]}</span><strong className="mp-num">{d.date.getDate()}</strong></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                {['comida', 'cena'].map(m => (
                  <span key={m} className="ms-line"><span className="mp-dot" style={{ background: MEAL_STYLE[m].color }} />{shortOf(d, m) ?? <span className="mp-muted" style={{ fontWeight: 400 }}>No dish</span>}</span>
                ))}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {tag && <span className="mp-tag" style={tag === 'Today' ? { background: 'var(--c-ink)', color: '#fff' } : { background: 'rgba(232,98,124,0.16)', color: '#B0344F' }}>{tag}</span>}
                <span className="mp-num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-ink-2)' }}>{d.planned ? fmtMoney(d.cost) : 'Empty'}</span>
              </span>
            </button>
            {isOpen && (
              <div className="ms-body">
                {MEALS.map((m, k) => {
                  const rows = d.meals[m], main = rows.find(r => r.info)?.info
                  const others = rows.filter(r => r.info && main && r.info.key !== main.key)
                  return (
                    <button key={m} type="button" className={`ms-meal mp-in${main ? '' : ' is-empty'}`} style={{ animationDelay: `${k * 40}ms` }} onClick={() => openSlot(d.i, m)}>
                      <span className="mp-bubble" style={{ width: 34, height: 34, background: MEAL_STYLE[m].tint, color: MEAL_STYLE[m].color }}><Icon name={MEAL_ICON[m]} size={16} /></span>
                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span className="mp-muted" style={{ fontSize: 11 }}>{MEAL_LABEL[m]}</span>
                        {main ? <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{main.name}</span>
                          : <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13.5, fontWeight: 600, color: 'var(--c-ink-3)' }}><Icon name="plus" size={12} stroke={2.6} />Add</span>}
                        {others.map(r => <span key={r.person.id} style={{ fontSize: 12, color: 'var(--c-ink-2)' }}>{r.person.name}: {r.info.name}</span>)}
                      </span>
                      {main && <span className="mp-num" style={{ fontSize: 11.5, color: 'var(--c-ink-2)', whiteSpace: 'nowrap' }}>{rows.map(r => r.info ? `${r.person.initial} ${r.info.kcal}` : '').filter(Boolean).join(' · ')}</span>}
                    </button>
                  )
                })}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${d.totals.length}, minmax(0, 1fr))`, gap: 6 }}>
                  {d.totals.map(({ p, t }) => (
                    <span key={p.id} className="ms-total">
                      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}><strong>{p.name}</strong><span className="mp-muted mp-num">{t.kcal} / {t.target}</span></span>
                      <span style={{ height: 5, borderRadius: 3, background: 'rgba(110,80,50,0.12)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${Math.min(100, t.target ? t.kcal / t.target * 100 : 0)}%`, borderRadius: 3, background: colorOf(p) }} /></span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {sd && (
        <MealSheet mealType={sheet.m} dayLabel={`${DAY_LONG[sd.i]} ${sd.date.getDate()}`} rows={sd.meals[sheet.m]}
          onClose={() => setSheet(null)} onClear={() => clearSlot(sd.i, sheet.m)}
          onChange={() => { const k = sd.meals[sheet.m].find(r => r.info)?.info.key; setPicker({ i: sd.i, m: sheet.m, currentKey: k }); setSheet(null) }} />
      )}
      {pd && (
        <DishPicker weekKey={wk} weekData={week} dayKey={pd.dk} date={pd.date} mealType={picker.m}
          initialWho={who} currentKey={picker.currentKey} onClose={() => setPicker(null)} />
      )}
      {models && <ModelWeekSheet initialTarget={weekOffset} onClose={() => setModels(false)} onLoaded={t => { setWeekOffset(t); setOpen(0) }} />}
      {saving && <SaveWeekSheet weekKey={wk} monday={monday} onClose={() => setSaving(false)} />}
    </div>
  )
}
