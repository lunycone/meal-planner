import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { nextBatch, stepBatch } from './batchConfig'
import { addDays, mondayOf } from './mealplan'

// Navegar entre batches (Compra y Batch, Mac y móvil): por defecto el próximo
// por cocinar; ‹ › pasan al anterior/siguiente (con varios días de batch, de
// sesión en sesión; en modo «semana», de semana en semana).
export default function useBatchNav(mode = 'batch') {
  const settings = useStore(s => s.batchSettings)
  const [ref, setRef] = useState(() => nextBatch())
  useEffect(() => { setRef(nextBatch()) }, [settings])
  const step = n => setRef(r => (mode === 'semana' ? { ...r, monday: addDays(r.monday, 7 * n) } : stepBatch(r, n)))
  const upcoming = nextBatch()
  const isNext = +ref.monday === +upcoming.monday && ref.si === upcoming.si
  // Semanas desde la actual (para openPlanner).
  const weekOffset = Math.round((ref.monday - mondayOf(new Date())) / (7 * 86400000))
  return { ref, prev: () => step(-1), next: () => step(1), reset: () => setRef(nextBatch()), isNext, weekOffset, multi: settings?.sessions?.length > 1 }
}
