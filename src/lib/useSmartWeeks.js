import { useEffect, useRef, useState } from 'react'
import { generateSmartWeeks } from '../engine/smartWeek'

// Lanza el generador en un Web Worker cada vez que cambian los datos o las
// opciones. Si el navegador no tiene workers, lo calcula aquí mismo.
let worker = null
function getWorker() {
  if (worker !== null) return worker
  try { worker = new Worker(new URL('../engine/smartWeek.worker.js', import.meta.url), { type: 'module' }) } catch { worker = false }
  return worker
}

export default function useSmartWeeks(args, enabled = true) {
  const [state, setState] = useState({ busy: true, results: [], tried: 0, ms: 0, error: null })
  const seq = useRef(0)
  const key = enabled ? JSON.stringify([args.priority, args.vegMin, args.seed, args.shown, args.exclude, args.locks, args.prefs, args.recent, args.people?.map(p => p.id)]) : null

  useEffect(() => {
    if (!enabled) return
    const id = ++seq.current
    setState(s => ({ ...s, busy: true, error: null }))
    const done = out => { if (id === seq.current) setState({ busy: false, ...out, error: null }) }
    const w = getWorker()
    if (!w) {
      const t = setTimeout(() => { try { done(generateSmartWeeks(args)) } catch (e) { setState(s => ({ ...s, busy: false, error: String(e) })) } }, 30)
      return () => clearTimeout(t)
    }
    const onMsg = e => {
      if (e.data.id !== id) return
      if (e.data.ok) done(e.data.out)
      else if (id === seq.current) setState(s => ({ ...s, busy: false, error: e.data.error }))
    }
    w.addEventListener('message', onMsg)
    w.postMessage({ id, args })
    return () => w.removeEventListener('message', onMsg)
  }, [key, args.allIng, args.allCombos]) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
