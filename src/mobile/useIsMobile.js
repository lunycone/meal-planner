import { useEffect, useState } from 'react'

// Móvil = pantalla estrecha. La versión de Mac se queda para ≥ 761 px.
const Q = '(max-width: 760px)'

export default function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(Q).matches)
  useEffect(() => {
    const mq = window.matchMedia(Q)
    const on = e => setM(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}
