import { useEffect, useMemo, useState } from 'react'
import { diverseBreakfasts } from '../../lib/breakfastChoices'
import { comboAgg } from '../../engine/calc'
import { fmtMoney } from '../../lib/mealplan'
import Spinner from '../ui/Spinner'
import Icon from '../ui/Icon'

export default function BreakfastIdeas({ args, selected, onPick }) {
  const [result, setResult] = useState({ key: null, ideas: [], error: null })
  const [seen, setSeen] = useState([])
  const [retry, setRetry] = useState(0)
  const key = useMemo(() => JSON.stringify(args), [args])
  const busy = result.key !== key
  useEffect(() => {
    let active = true, worker, timer
    setSeen([])
    setResult({ key: null, ideas: [], error: null })
    const done = data => { if (active) setResult({ key, ideas: data.ideas ?? [], error: data.error ?? null }) }
    try {
      worker = new Worker(new URL('../../engine/breakfastIdeas.worker.js', import.meta.url), { type: 'module' })
      worker.onmessage = e => done(e.data)
      worker.onerror = () => done({ error: 'Could not generate ideas. Please try again.' })
      worker.postMessage(JSON.parse(key))
    } catch {
      timer = setTimeout(() => import('../../engine/breakfastIdeas').then(m => done({ ideas: m.breakfastIdeas(JSON.parse(key)) })).catch(() => done({ error: 'Could not generate ideas. Please try again.' })), 30)
    }
    return () => { active = false; worker?.terminate(); clearTimeout(timer) }
  }, [key, retry])
  const cards = diverseBreakfasts(result.ideas, seen)
  const more = result.ideas.some(r => !seen.includes(r.id) && !cards.some(c => c.id === r.id))
  return <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }} aria-live="polite">
    <p className="mp-muted" style={{ margin: 0, fontSize: 12, flexShrink: 0 }}>Different preparations, portions for your selection, and a check against the meals already planned. Review any notes before applying.</p>
    {busy ? <div className="mp-empty"><Spinner label="Generating breakfast ideas" /> Finding breakfasts for your selection…</div> : result.error ? <div className="mp-empty">{result.error}<button type="button" className="mp-btn mp-btn-glass" onClick={() => setRetry(n => n + 1)}>Retry</button></div> : <>
      {!cards.length && <div className="mp-empty">No ideas fit these ingredients and filters.{args.onlyGreen ? ' Try switching off PCOS low only to see alternatives with their notes.' : ' Add more breakfast ingredients to your catalog.'}</div>}
      {cards.map(idea => <button type="button" key={idea.id} className="mp-row" aria-pressed={selected === idea.id} onClick={() => onPick(idea)}
        style={{ flexShrink: 0, padding: 14, border: selected === idea.id ? '1px solid var(--c-green)' : '1px solid var(--c-line)', textAlign: 'left', background: '#fff', cursor: 'pointer' }}>
        <strong style={{ display: 'block', marginBottom: 6 }}>{idea.name}</strong>
        <span className="mp-muted" style={{ display: 'block', fontSize: 12 }}>{idea.reason}</span>
        {args.persons.map(p => {
          const a = comboAgg(idea.recipes[p.id], args.allIng)
          return <span key={p.id} className="mp-muted mp-num" style={{ display: 'block', marginTop: 5, fontSize: 12 }}>{p.name} · {Math.round(a.kcal)} kcal · {Math.round(a.prot)} g protein · {fmtMoney(a.cost)}</span>
        })}
        {idea.notes.length > 0 && <span style={{ display: 'block', marginTop: 7, fontSize: 12 }}>{idea.notes.length} note{idea.notes.length === 1 ? '' : 's'} to review</span>}
      </button>)}
      {cards.length > 0 && <button type="button" className="mp-btn mp-btn-glass" style={{ flexShrink: 0 }} disabled={!more} onClick={() => setSeen(s => [...s, ...cards.map(c => c.id)])}><Icon name="sparkle" size={14} />{more ? 'More ideas' : 'All matching ideas shown'}</button>}
    </>}
  </div>
}
