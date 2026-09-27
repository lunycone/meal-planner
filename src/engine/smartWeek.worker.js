// Corre el generador fuera del hilo principal: la pantalla no se congela
// mientras prueba combinaciones (sobre todo en el móvil).
import { generateSmartPlan } from './smartWeek'

self.onmessage = e => {
  const { id, args } = e.data
  try {
    self.postMessage({ id, ok: true, out: generateSmartPlan(args) })
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message ?? err) })
  }
}
