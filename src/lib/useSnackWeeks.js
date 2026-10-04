import { useEffect, useRef, useState } from 'react'

// Launches the snack generator in a Web Worker every time the data or the options
// change (same idea as useSmartWeeks). Without workers it runs here, a moment later,
// so the sheet can paint its loading state first.
let worker = null
function getWorker() {
  if (worker !== null) return worker
  try { worker = new Worker(new URL('../engine/snackGen.worker.js', import.meta.url), { type: 'module' }) } catch { worker = false }
  return worker
}
// Starts the worker while the app is idle, so the first click does not have to fetch and parse it.
export function warmSnackWorker() { getWorker() }

export default function useSnackWeeks(args, enabled = true) {
  const [state, setState] = useState({ busy: enabled, out: null, error: null })
  const seq = useRef(0)
  const key = enabled ? JSON.stringify([args.mealSlot, args.noveltyMax, args.batches, args.priority, args.seed, args.candidateSeed, args.avoidKeys, args.banned, args.pinned, args.avoidWeight, args.count, args.persons?.map(p => p.id)]) : ''

  useEffect(() => {
    if (!enabled) return
    const id = ++seq.current
    setState(s => ({ ...s, busy: true, error: null }))
    const done = out => { if (id === seq.current) setState({ busy: false, out, error: null }) }
    const fail = error => { if (id === seq.current) setState(s => ({ ...s, busy: false, error })) }
    const w = getWorker()
    if (!w) {
      const t = setTimeout(() => { import('../engine/snackGen').then(m => done(m.generateOptions(args))).catch(e => fail(String(e))) }, 30)
      return () => clearTimeout(t)
    }
    const onMsg = e => {
      if (e.data.id !== id) return
      if (e.data.ok) done(e.data.out); else fail(e.data.error)
    }
    w.addEventListener('message', onMsg)
    w.postMessage({ id, args })
    return () => w.removeEventListener('message', onMsg)
  }, [key, args.allIng, args.dishes, args.baseWeek, args.dataKey, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
