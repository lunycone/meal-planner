import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Fondo de las fichas (sheets). Se monta en <body> con un portal: dentro de
// <main> quedaba en su contexto de apilado (z-index 1) y la barra de arriba,
// que es sticky, se pintaba ENCIMA de la cabecera de la ficha. Esc cierra y
// el scroll de la página se bloquea mientras está abierta.
//
// El bloqueo va con un contador: con una ficha dentro de otra (tiendas y
// categorías dentro de un ingrediente), guardar/restaurar el overflow de
// cada una dejaba la página sin scroll al cerrarlas. Esc solo cierra la de
// más arriba.
let open = 0
const stack = []

export default function Overlay({ onClose, children }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const me = {}
    stack.push(me)
    if (open++ === 0) document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape' && stack[stack.length - 1] === me) closeRef.current?.() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      stack.splice(stack.indexOf(me), 1)
      if (--open === 0) document.body.style.overflow = ''
    }
  }, [])

  return createPortal(
    <div className="mp-overlay" onClick={e => { e.stopPropagation(); closeRef.current?.() }}>{children}</div>,
    document.body
  )
}
