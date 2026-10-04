// Anillo giratorio. Solo anima `transform` (lo hace el compositor): sigue
// fluido aunque el hilo principal esté ocupado montando una ficha pesada.
export default function Spinner({ size = 18, stroke = 2.4, color = '#7154DA', label }) {
  const r = 10
  return (
    <svg className="mp-spinner" width={size} height={size} viewBox="0 0 24 24" fill="none" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="12" cy="12" r={r} stroke="rgba(110,80,50,0.14)" strokeWidth={stroke} />
      <circle cx="12" cy="12" r={r} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray="22 63" />
    </svg>
  )
}
