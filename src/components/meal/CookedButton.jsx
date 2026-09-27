import { useMemo } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import Icon from '../ui/Icon'
import { sessionDates, sessionKey } from '../../lib/batchConfig'
import { aggregateIngredients, needAmount, needDim } from '../../lib/needs'
import { packOf } from '../../lib/packs'

// «Batch cooked»: descuenta de la despensa lo que se come en los días de ese
// batch (sesión `si` de Ajustes). Se puede deshacer (vuelve lo que se quitó).
export function useBatchUsage(monday, si = 0) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const weekPlan = useStore(s => s.weekPlan)
  const profiles = useStore(s => s.profiles)
  const batchSettings = useStore(s => s.batchSettings)
  return useMemo(() => {
    const windowDates = sessionDates(monday, si)
    const agg = aggregateIngredients({ weekPlan, windowDates, profiles, allIng, allCombos })
    const usage = {}
    for (const [k, data] of Object.entries(agg)) {
      const pack = packOf(allIng[k]); const dim = needDim(data, pack)
      const need = dim ? needAmount(data, allIng[k], pack ?? { dim }) : 0
      if (need > 0) usage[k] = need
    }
    return usage
  }, [+monday, si, weekPlan, profiles, allIng, allCombos, batchSettings]) // eslint-disable-line react-hooks/exhaustive-deps
}

export default function CookedButton({ monday, si = 0, className, style }) {
  const wk = sessionKey(monday, si)
  const cooked = useStore(s => s.cookedBatches?.[wk])
  const stock = useStore(s => s.stock)
  const cookBatch = useStore(s => s.cookBatch)
  const uncookBatch = useStore(s => s.uncookBatch)
  const usage = useBatchUsage(monday, si)
  const fromPantry = Object.keys(usage).filter(k => stock?.[k]?.amount > 0).length
  if (!Object.keys(usage).length) return null
  const n = cooked ? Object.keys(cooked).length : fromPantry
  return (
    <button type="button" className={`${className ?? ''} cooked-btn${cooked ? ' is-on' : ''}`} style={style} aria-pressed={!!cooked}
      title={cooked ? 'Undo: put those amounts back in the pantry' : 'Takes what this batch uses out of the pantry'}
      onClick={() => (cooked ? uncookBatch(wk) : cookBatch(wk, usage))}>
      <Icon name={cooked ? 'check' : 'home'} size={14} stroke={2.4} />
      {cooked ? `Cooked · ${n} item${n === 1 ? '' : 's'} taken from the pantry` : `Mark as cooked · update pantry${n ? ` (${n})` : ''}`}
    </button>
  )
}
