import { useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import Icon from '../ui/Icon'
import { DAY_KEYS, addDays, weekKeyOf } from '../../lib/mealplan'
import { aggregateIngredients, needAmount, needDim } from '../../lib/needs'
import { packOf } from '../../lib/packs'

// «Batch cooked»: descuenta de la despensa lo que se come de lunes a
// viernes. Se puede deshacer (vuelve lo que se quitó).
export function useBatchUsage(monday) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  const profiles = useStore(s => s.profiles)
  return useMemo(() => {
    const wk = weekKeyOf(monday)
    const windowDates = DAY_KEYS.slice(0, 5).map((dayKey, i) => ({ date: addDays(monday, i), wk, dayKey }))
    const agg = aggregateIngredients({ weekPlan, windowDates, profiles, allIng, allCombos })
    const usage = {}
    for (const [k, data] of Object.entries(agg)) {
      const pack = packOf(allIng[k]); const dim = needDim(data, pack)
      const need = dim ? needAmount(data, allIng[k], pack ?? { dim }) : 0
      if (need > 0) usage[k] = need
    }
    return usage
  }, [monday, weekPlan, profiles, allIng, allCombos])
}

export default function CookedButton({ monday, className, style }) {
  const wk = weekKeyOf(monday)
  const cooked = useStore(s => s.cookedBatches?.[wk])
  const stock = useStore(s => s.stock)
  const cookBatch = useStore(s => s.cookBatch)
  const uncookBatch = useStore(s => s.uncookBatch)
  const usage = useBatchUsage(monday)
  const fromPantry = Object.keys(usage).filter(k => stock?.[k]?.amount > 0).length
  if (!Object.keys(usage).length) return null
  const n = cooked ? Object.keys(cooked).length : fromPantry
  return (
    <button type="button" className={`${className ?? ''} cooked-btn${cooked ? ' is-on' : ''}`} style={style} aria-pressed={!!cooked}
      title={cooked ? 'Undo: put those amounts back in the pantry' : 'Takes what Monday–Friday uses out of the pantry'}
      onClick={() => (cooked ? uncookBatch(wk) : cookBatch(wk, usage))}>
      <Icon name={cooked ? 'check' : 'home'} size={14} stroke={2.4} />
      {cooked ? `Cooked · ${n} item${n === 1 ? '' : 's'} taken from the pantry` : `Mark as cooked · update pantry${n ? ` (${n})` : ''}`}
    </button>
  )
}
