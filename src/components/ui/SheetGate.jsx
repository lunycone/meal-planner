import { useEffect, useState } from 'react'
import Overlay from './Overlay'
import Icon from './Icon'
import Spinner from './Spinner'

// Puerta de carga para las fichas pesadas (Load model week, Plan snacks).
// Al pulsar el botón el fondo y una tarjeta con animación aparecen YA, en el
// primer fotograma; la ficha de verdad se monta uno o dos fotogramas después.
// Antes se montaba en el mismo clic: el navegador se quedaba colgado un
// momento y luego saltaba todo de golpe.
export default function SheetGate({ title, hint, icon = 'sparkle', onClose, children }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let b
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setReady(true)) })
    // Backup: if frames are throttled (hidden tab, power saver) the sheet still opens.
    const t = setTimeout(() => setReady(true), 250)
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); clearTimeout(t) }
  }, [])
  return (
    <Overlay onClose={onClose}>
      {ready ? children : (
        <div className="sl-card" role="status" aria-live="polite" aria-label={title} onClick={e => e.stopPropagation()}>
          <span className="sl-ring">
            <Spinner size={64} stroke={1.6} />
            <span className="sl-bubble"><Icon name={icon} size={20} stroke={2.2} /></span>
          </span>
          <span className="sl-title">{title}</span>
          {hint && <span className="mp-muted sl-hint">{hint}</span>}
        </div>
      )}
    </Overlay>
  )
}
