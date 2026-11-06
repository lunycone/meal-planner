import { useEffect, useRef, useState } from 'react'

export default function useSmartWeeks(args, enabled = true) {
  const [state, setState] = useState({ busy: true, results: [], tried: 0, ms: 0, error: null })
  const seq = useRef(0)
  const key = enabled ? JSON.stringify([args.priority, args.vegMin, args.seed, args.shown, args.exclude, args.locks, args.prefs, args.recent, args.stock, args.source, args.country, args.pairPrefs, args.sessions, args.people, args.splitDinners, args.strictRules, args.snackMode]) : null

  const current = useRef(null)
  useEffect(() => {
    if (!enabled) return
    current.current = { key, ingredients: args.allIng, combos: args.allCombos }
    const id = ++seq.current
    setState(s => ({ ...s, busy: true, error: null }))
    const done = out => { if (id === seq.current) setState({ busy: false, ...out, error: null }) }
    let w, timer, fallbackStarted = false, cancelled = false
    const fallback = () => {
      if (fallbackStarted || cancelled) return
      fallbackStarted = true
      clearTimeout(timer)
      w?.terminate()
      import('../engine/smartWeek')
        .then(m => { if (!cancelled) done(m.generateSmartPlan(args)) })
        .catch(error => { if (!cancelled) setState(s => ({ ...s, busy: false, results: [], error: String(error) })) })
    }
    try {
      w = new Worker(new URL('../engine/smartWeek.worker.js', import.meta.url), { type: 'module' })
      w.onmessage = ({ data }) => {
        clearTimeout(timer)
        if (cancelled || data.id !== id) return
        if (data.ok) done(data.out)
        else setState(s => ({ ...s, busy: false, results: [], error: data.error }))
      }
      w.onerror = fallback
      w.onmessageerror = fallback
      timer = setTimeout(fallback, 45000)
      w.postMessage({ id, args })
    } catch { fallback() }
    return () => {
      cancelled = true
      clearTimeout(timer)
      w?.terminate()
    }
  }, [key, args.allIng, args.allCombos]) // eslint-disable-line react-hooks/exhaustive-deps

  const request = current.current
  return enabled && (request?.key !== key || request.ingredients !== args.allIng || request.combos !== args.allCombos) ? { ...state, busy: true } : state
}
