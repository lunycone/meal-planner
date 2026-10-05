import { useMemo, useState } from 'react'
import { comboMicros, evaluateDish, SLOT_FOCUS, REF_KCAL, VERDICT_TEXT, VERDICT_COLOR, sexOf } from '../../engine/micros'
import { activeProfilesOn, MEAL_LABEL, MEAL_STYLE } from '../../lib/mealplan'
import Segmented from '../ui/Segmented'
import Icon, { MEAL_ICON } from '../ui/Icon'

// Vitaminas y minerales del plato, por franja y por persona. Cerrado enseña solo
// el veredicto de cada franja; abierto, las barras (% de lo que necesita la
// persona en el día, con una marca en la parte que le toca a esa franja), de
// dónde viene cada nutriente y qué cambiar. Todo con reglas (engine/micros.js).

const LEVEL_C = { green: '#2F9E5B', yellow: '#B7791F', red: '#D64545' }
const OPEN_KEY = 'pl-micros-open'
const readOpen = () => { try { return localStorage.getItem(OPEN_KEY) === '1' } catch { return false } }
const writeOpen = v => { try { localStorage.setItem(OPEN_KEY, v ? '1' : '0') } catch { /* sin almacenamiento: solo no se recuerda */ } }

const list = xs => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`
const fmt = (v, dec) => v >= 100 || dec === 0 ? String(Math.round(v)) : v.toFixed(dec)
const lc = s => s.toLowerCase()

export default function MicrosCard({ items, meals, kcal, profiles, allIng }) {
  const [open, setOpen] = useState(readOpen)
  const people = useMemo(() => activeProfilesOn(profiles, new Date()).filter(p => p.id !== 'all'), [profiles])
  const [personId, setPersonId] = useState(null)
  const [slotSel, setSlotSel] = useState(null)
  const [src, setSrc] = useState(null) // nutriente con las fuentes desplegadas

  const person = people.find(p => p.id === personId) ?? people[0]
  const slots = meals?.length ? meals : ['comida']
  const slot = slots.includes(slotSel) ? slotSel : slots[0]

  const micros = useMemo(() => comboMicros(items, allIng), [items, allIng])
  const evals = useMemo(() => Object.fromEntries(slots.map(m => [m, evaluateDish(micros, person, m, kcal)])), [micros, person, kcal, slots.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!items?.length || !person) return null

  const ev = evals[slot]
  const toggle = () => setOpen(o => { writeOpen(!o); return !o })
  const missingShare = Math.round((1 - micros.covered) * 100)

  const headline = ev.verdict === 'nodata'
    ? `Not enough data to judge this dish${missingShare ? ` (${missingShare}% of it has no vitamin data)` : ''}.`
    : (() => {
        const good = ev.strengths.map(r => r.phrase)
        const low = ev.gaps
        const parts = []
        if (good.length) parts.push(`Strong in ${list(good)}.`)
        if (low.length) parts.push(`Light on ${list(low.map(r => r.phrase))} — try ${list([...new Set(low.map(r => ev.fix[r.key]))])}.`)
        if (!good.length && !low.length) parts.push('Nothing stands out — a balanced, modest contribution.')
        return parts.join(' ')
      })()

  return (
    <div className="pl-card pm-card" style={{ gap: 10 }}>
      <div className="pm-head">
        <span className="mp-eyebrow">Vitamins &amp; minerals</span>
        <button type="button" className="pm-toggle" aria-expanded={open} aria-label={open ? 'Hide vitamin details' : 'Show vitamin details'} onClick={toggle}>
          {open ? 'Hide' : 'Details'}<Icon name="right" size={12} stroke={2.6} style={{ transform: `rotate(${open ? 90 : 0}deg)`, transition: 'transform .25s var(--c-ease)' }} />
        </button>
      </div>

      <div className="pm-slots" role="group" aria-label="Meal slot">
        {slots.map(m => {
          const e = evals[m]
          return (
            <button key={m} type="button" className={`pm-slot${m === slot ? ' is-on' : ''}`} aria-pressed={m === slot} onClick={() => setSlotSel(m)}
              title={`${MEAL_LABEL[m]}: ${VERDICT_TEXT[e.verdict]} — weighs ${SLOT_FOCUS[m]} most`}>
              <Icon name={MEAL_ICON[m]} size={12} stroke={2.4} color={MEAL_STYLE[m].color} />
              <span>{MEAL_LABEL[m]}</span>
              <span className="pm-verdict" style={{ color: VERDICT_COLOR[e.verdict] }}><span className="pm-dot" style={{ background: VERDICT_COLOR[e.verdict] }} />{VERDICT_TEXT[e.verdict]}</span>
            </button>
          )
        })}
      </div>

      {open && (
        <div className="pm-body">
          {people.length > 1 && <Segmented label="Person" value={person.id} onChange={setPersonId} options={people.map(p => ({ value: p.id, label: p.name }))} />}

          <p className="pm-headline">{headline}</p>
          {ev.notes.map(n => <p key={n} className="pm-note"><Icon name="bulb" size={12} stroke={2.4} />{n}</p>)}
          {ev.warnings.map(w => <p key={w} className="pm-warn"><Icon name="warn" size={12} stroke={2.4} />{w}</p>)}

          <p className="pm-focus mp-muted">{MEAL_LABEL[slot]} weighs {SLOT_FOCUS[slot]} most.</p>
          <div className="pm-legend mp-muted">
            <span>Bar = % of {person.name}’s daily need{sexOf(person) === 'F' ? ' (iron 18 mg)' : ''}</span>
            <span title={`Past this mark the dish is richer in the nutrient than the daily guideline asks for its calories (a ${REF_KCAL.toLocaleString('en-US')} kcal day).`}><span className="pm-tick-key" />Its share of the day’s calories ({Math.round(ev.share * 100)}%)</span>
          </div>

          <div className="pm-rows">
            {ev.rows.map(r => {
              const sources = micros.used.filter(u => u[r.key] > 0).sort((a, b) => b[r.key] - a[r.key]).slice(0, 3)
              const on = src === r.key
              return (
                <div key={r.key} className="pm-row">
                  <button type="button" className="pm-rowbtn" aria-expanded={on} onClick={() => setSrc(on ? null : r.key)}
                    title={`${r.ratio >= 1 ? 'Richer' : 'Poorer'} than the daily guideline asks for this dish’s calories (${Math.round(r.ratio * 100)}%)`}>
                    <span className="pm-name">{r.label}</span>
                    <span className="pm-bar" aria-hidden="true">
                      <span className="pm-fill" style={{ width: `${Math.min(100, r.daily * 100)}%`, background: LEVEL_C[r.level] }} />
                      <span className="pm-tick" style={{ left: `${Math.min(100, ev.share * 100)}%` }} />
                    </span>
                    <span className="pm-val mp-num"><strong>{fmt(r.amount, r.dec)}</strong> {r.unit}</span>
                    <span className="pm-pct mp-num" style={{ color: LEVEL_C[r.level] }}>{Math.round(r.daily * 100)}%</span>
                  </button>
                  {on && (
                    <div className="pm-src mp-in">
                      {sources.length === 0 && <span className="mp-muted">Nothing in this dish provides {r.phrase}.</span>}
                      {sources.map(s => (
                        <span key={s.k}><span>{s.name.split(' (')[0]}{s.est ? ' ≈' : ''}</span><span className="mp-num mp-muted">{fmt(s[r.key], r.dec)} {r.unit}</span></span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {micros.missing.length > 0 && (
            <p className="pm-foot mp-muted">No vitamin data for: {micros.missing.slice(0, 4).join(', ')}{micros.missing.length > 4 ? '…' : ''}.</p>
          )}
        </div>
      )}
    </div>
  )
}
