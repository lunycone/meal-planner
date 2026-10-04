// Runs the snack generator off the main thread: opening «Plan snacks» no longer
// freezes the screen while it compares hundreds of recipes (it took 0.4–2 s).
//
// The recipes solved for both people do not depend on the priority, the batches option,
// the new-ingredient cap, what you said no to or the week's plan, so they are kept
// between requests: «Not this one» and changing the priority answer in a fraction of a
// second. A new «New ideas», a different meal or a change in your data rebuilds them.
import { buildPool, generateOptions } from './snackGen'

let cache = null
const poolKey = a => JSON.stringify([a.dataKey, a.candidateSeed, a.mealSlot, a.maxBatchDays, a.persons?.map(p => [p.id, p.kcalTarget, p.kcalByDay, p.proteinTarget])])

self.onmessage = e => {
  const { id, args } = e.data
  try {
    let pool
    if (args.dataKey != null) {
      const key = poolKey(args)
      if (!cache || cache.key !== key) cache = { key, pool: buildPool(args) }
      pool = cache.pool
    }
    self.postMessage({ id, ok: true, out: generateOptions(pool ? { ...args, pool } : args) })
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message ?? err) })
  }
}
