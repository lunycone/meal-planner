import { createContext, useContext, useEffect, useRef } from 'react'
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
//
// Un Overlay dentro de otro Overlay NO crea un segundo fondo: pinta sus hijos
// tal cual. Lo usa SheetGate: el fondo y la animación de carga se quedan y la
// ficha entra dentro, sin parpadeo ni segundo desenfoque.
let open = 0
const stack = []
const InOverlay = createContext(false)

function OverlayRoot({ onClose, children }) {
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
    <InOverlay.Provider value={true}>
      <div className="mp-overlay" onClick={e => { e.stopPropagation(); closeRef.current?.() }}>{children}</div>
    </InOverlay.Provider>,
    document.body
  )
}

export default function Overlay({ onClose, children }) {
  const nested = useContext(InOverlay)
  return nested ? children : <OverlayRoot onClose={onClose}>{children}</OverlayRoot>
}
