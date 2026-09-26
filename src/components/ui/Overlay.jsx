import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Fondo de las fichas (sheets). Se monta en <body> con un portal: dentro de
// <main> quedaba en su contexto de apilado (z-index 1) y la barra de arriba,
// que es sticky, se pintaba ENCIMA de la cabecera de la ficha. Esc cierra y
// el scroll de la página se bloquea mientras está abierta.
export default function Overlay({ onClose, children }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div className="mp-overlay" onClick={onClose}>{children}</div>,
    document.body
  )
}
