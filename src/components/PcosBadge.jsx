// PCOS carb-level badge — small botanical mark on every desayuno/cena dish,
// colored by calc.js's pcosCarbLevel (green/yellow/red — the same 3-tier
// language as the app's protein/kcal semaphore, so "what does this color
// mean" only has to be learned once). Deliberately a flower, not a heart,
// so it doesn't read as a generic "favorite" icon.
//
// Geometry: 5 identical petals, each a single symmetric bezier path from
// center (12,12) to tip (12,4), rotated by exact 72° increments — precise
// trig placement, not hand-placed ellipses, so it stays crisp and balanced
// at the ~16px it actually renders at. No drop-shadow filter: shadows blur
// into mud at this size, professional icon sets skip them below ~24px.
const PETAL_D = 'M12,12 C10.3,9.7 9.6,6.4 12,3.6 C14.4,6.4 13.7,9.7 12,12 Z'
const PETAL_ANGLES = [0, 72, 144, 216, 288]

// Same dark stop as LEVEL_COLOR in calc.js (kcal/prot semaphore) so the
// flower and the numbers next to it agree on what "green" means. Light
// stop is each hue lightened ~35% for the gradient — "Orquídea audaz"'s
// magenta-to-wine treatment, carried over to yellow/red instead of reserved
// for green alone.
const LEVEL_GRADIENT = {
  green:  ['#8fbf82', '#4a7a3a'],
  yellow: ['#e6c877', '#b0871f'],
  red:    ['#e0897b', '#b8453a'],
}
const LEVEL_TITLE = {
  green:  'PCOS-friendly (bajo en carbo)',
  yellow: 'PCOS: carbo medio',
  red:    'PCOS: alto en carbo',
}

let uid = 0

export default function PcosBadge({ level = 'green', title, size = 20 }) {
  const id = uid++
  const petalGrad = `pcos-petal-${id}`
  const coreGrad  = `pcos-core-${id}`
  const [light, dark] = LEVEL_GRADIENT[level] ?? LEVEL_GRADIENT.green

  return (
    <span
      title={title ?? LEVEL_TITLE[level] ?? LEVEL_TITLE.green}
      style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', marginLeft: 6 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={petalGrad} x1="8" y1="4" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0"   stopColor={light} />
            <stop offset="1"   stopColor={dark} />
          </linearGradient>
          <radialGradient id={coreGrad} cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#ffe8b8" />
            <stop offset="1" stopColor="#c9861a" />
          </radialGradient>
        </defs>

        <g fill={`url(#${petalGrad})`} stroke="#ffffff" strokeWidth="0.4" strokeLinejoin="round">
          {PETAL_ANGLES.map(a => (
            <path key={a} d={PETAL_D} transform={`rotate(${a} 12 12)`} />
          ))}
        </g>

        <circle cx="12" cy="12" r="1.9" fill={`url(#${coreGrad})`} stroke="#ffffff" strokeWidth="0.4" />
      </svg>
    </span>
  )
}
