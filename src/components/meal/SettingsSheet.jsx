import useStore from '../../store/useStore'
import Overlay from '../ui/Overlay'
import Icon from '../ui/Icon'
import { batchSessions, coveredDays, maxDaysFor, normalizeBatch, rangeLabel, DAY_SHORT_EN, DAY_LONG_EN, DEFAULT_BATCH } from '../../lib/batchConfig'

// Ajustes (engranaje junto a J/M). De momento: los días de batch — qué día
// se cocina, cuántos días cubre y si hay más de un batch a la semana. Al
// cambiarlo se reconfigura todo: Compra, Batch, Planificador, Hoy,
// sugerencias y la semana inteligente (lib/batchConfig.js).

const SESSION_COLOR = ['#D9486A', '#2585BC', '#2F9E5B', '#C1850C']
const PRESETS = [
  { label: 'Sun → Mon–Fri', sessions: [{ cook: 6, days: 5 }] },
  { label: 'Sun → whole week', sessions: [{ cook: 6, days: 7 }] },
  { label: 'Sun → Mon–Wed · Wed → Thu–Fri', sessions: [{ cook: 6, days: 3 }, { cook: 2, days: 2 }] },
  { label: 'Sun → Mon–Wed · Wed → Thu–Sun', sessions: [{ cook: 6, days: 3 }, { cook: 2, days: 4 }] },
]

const firstDay = s => (s.cook === 6 ? 0 : s.cook + 1)
const same = (a, b) => JSON.stringify(normalizeBatch(a).sessions) === JSON.stringify(normalizeBatch(b).sessions)

export default function SettingsSheet({ onClose }) {
  const settings = useStore(s => s.batchSettings) ?? DEFAULT_BATCH
  const setBatch = useStore(s => s.setBatchSettings)
  const cur = normalizeBatch(settings)
  const sessions = batchSessions(cur)
  const covered = coveredDays(cur)
  const free = [0, 1, 2, 3, 4, 5, 6].filter(i => !covered.includes(i))

  const update = (si, patch) => setBatch({ sessions: cur.sessions.map((s, i) => (i === si ? { ...s, ...patch } : s)) })
  const remove = si => setBatch({ sessions: cur.sessions.filter((_, i) => i !== si) })
  // Máximo que puede cubrir sin pisar la siguiente sesión.
  const maxFor = si => {
    const s = cur.sessions[si], next = cur.sessions[si + 1]
    return Math.min(maxDaysFor(s.cook), next ? firstDay(next) - firstDay(s) : 99)
  }
  // Otra sesión: cocina el último día cubierto y cubre lo que queda de semana.
  const last = cur.sessions[cur.sessions.length - 1]
  const lastEnd = firstDay(last) + last.days - 1
  const canAdd = cur.sessions.length < 4 && lastEnd < 6
  function add() {
    if (!canAdd) return
    const cook = lastEnd // cocinar el último día del batch anterior
    setBatch({ sessions: [...cur.sessions, { cook, days: Math.min(maxDaysFor(cook), 6 - lastEnd) }] })
  }
  const owner = i => sessions.findIndex(s => s.days.includes(i))

  return (
    <Overlay onClose={onClose}>
      <div className="mp-sheet st-sheet" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Settings">
        <div className="mp-sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mp-bubble" style={{ width: 42, height: 42, background: 'rgba(31,27,22,0.08)', color: 'var(--c-ink)' }}><Icon name="gear" size={20} /></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Settings</span>
              <span className="mp-muted" style={{ fontSize: 13 }}>Shared by both of you. Everything updates as you change it.</span>
            </div>
          </div>
          <button className="mp-icon-btn" style={{ width: 32, height: 32 }} aria-label="Close" onClick={onClose}><Icon name="x" size={12} stroke={3} /></button>
        </div>

        <div className="mp-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 0 }}>
          <section className="st-section">
            <span className="st-title"><Icon name="pot" size={16} color="#D9486A" />Batch cooking</span>
            <span className="mp-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Which day you cook and how many days it covers. With more than one batch day, each one is its own pot and its own shopping.
              Days no batch covers are free: not planned or shopped for.
            </span>

            {/* La semana de un vistazo */}
            <div className="st-week" aria-label="Your week">
              {DAY_SHORT_EN.map((d, i) => {
                const o = owner(i)
                const cooks = sessions.filter(s => s.cook === i)
                return (
                  <div key={d} className={`st-day${o < 0 ? ' is-free' : ''}`} style={o >= 0 ? { background: SESSION_COLOR[o] + '1F', color: SESSION_COLOR[o] } : undefined}>
                    <span className="st-day-name">{d}</span>
                    <span className="st-day-cook">{cooks.map(c => <Icon key={c.si} name="pot" size={13} color={SESSION_COLOR[c.si]} />)}</span>
                    <span className="st-day-tag">{o >= 0 ? `Batch ${o + 1}` : 'free'}</span>
                  </div>
                )
              })}
            </div>

            <div className="st-presets">
              {PRESETS.map(p => (
                <button key={p.label} type="button" className={`st-preset${same(p, cur) ? ' is-on' : ''}`} onClick={() => setBatch({ sessions: p.sessions })}>{p.label}</button>
              ))}
            </div>

            {sessions.map((s, si) => {
              const max = maxFor(si)
              return (
                <div key={si} className="st-session mp-in" style={{ borderColor: SESSION_COLOR[si] + '55' }}>
                  <div className="st-session-head">
                    <span className="mp-dot" style={{ width: 10, height: 10, background: SESSION_COLOR[si] }} />
                    <strong>Batch {si + 1}</strong>
                    <span className="mp-muted">· cook on {DAY_LONG_EN[s.cook]}, eat {s.label}</span>
                    {sessions.length > 1 && <button type="button" className="mw-act is-danger" style={{ marginLeft: 'auto' }} aria-label={`Remove batch ${si + 1}`} onClick={() => remove(si)}><Icon name="trash" size={13} /></button>}
                  </div>
                  <div className="st-row">
                    <span className="st-label">Cook on</span>
                    <div className="st-chips" role="group" aria-label={`Batch ${si + 1} cook day`}>
                      {DAY_SHORT_EN.map((d, i) => (
                        <button key={d} type="button" className={`st-chip${s.cook === i ? ' is-on' : ''}`} aria-pressed={s.cook === i}
                          style={s.cook === i ? { background: SESSION_COLOR[si], color: '#fff' } : undefined}
                          onClick={() => update(si, { cook: i, days: Math.min(cur.sessions[si].days, maxDaysFor(i)) })}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div className="st-row">
                    <span className="st-label">Covers</span>
                    <div className="st-stepper">
                      <button type="button" aria-label="One day less" disabled={s.days.length <= 1} onClick={() => update(si, { days: s.days.length - 1 })}>−</button>
                      <span className="mp-num"><strong>{s.days.length}</strong> {s.days.length === 1 ? 'day' : 'days'}</span>
                      <button type="button" aria-label="One day more" disabled={s.days.length >= max} onClick={() => update(si, { days: s.days.length + 1 })}>+</button>
                    </div>
                    <span className="mp-muted" style={{ fontSize: 13 }}>{s.label}{s.cook === 6 ? ' (the week after)' : ''}</span>
                  </div>
                </div>
              )
            })}

            <button type="button" className="mp-btn mp-btn-glass st-add" disabled={!canAdd} onClick={add}>
              <Icon name="plus" size={13} stroke={2.6} />Add another batch day
            </button>

            <span className="st-summary">
              {sessions.length === 1 ? 'One batch' : `${sessions.length} batches`} · planned {rangeLabel(covered)}{free.length ? ` · free ${rangeLabel(free)}` : ' · the whole week'}
            </span>
          </section>
        </div>

        <div className="mp-sheet-foot" style={{ justifyContent: 'flex-end' }}>
          <button className="mp-btn mp-btn-dark" onClick={onClose}>Done</button>
        </div>
      </div>
    </Overlay>
  )
}
