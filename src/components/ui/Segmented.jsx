import { useLayoutEffect, useRef, useState } from 'react'

// Segmentado con pulgar de vidrio que se desliza con rebote. Mide los botones
// reales, así que admite etiquetas de cualquier ancho.
export default function Segmented({ options, value, onChange, className = 'mp-seg', thumbClass = 'mp-seg-thumb', label }) {
  const ref = useRef(null)
  const [thumb, setThumb] = useState({ left: 3, width: 0 })

  useLayoutEffect(() => {
    const el = ref.current?.querySelector(`[data-v="${CSS.escape(String(value))}"]`)
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value, options.length, options.map(o => o.label).join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} className={className} role="group" aria-label={label}>
      <span aria-hidden="true" className={thumbClass} style={{ left: thumb.left, width: thumb.width }} />
      {options.map(o => (
        <button key={o.value} type="button" data-v={o.value} aria-pressed={o.value === value}
          aria-current={className.includes('mp-nav') && o.value === value ? 'page' : undefined}
          onClick={() => onChange(o.value)} title={o.title}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
