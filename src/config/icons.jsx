// ─── Meal icons — Feather-style line art, 1.75px stroke ──────────────────────
// SVG puro: sin emoji, sin dependencias, consistente en cualquier pantalla.

export function SunIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"     x2="12" y2="5.5" />
      <line x1="12" y1="18.5"  x2="12" y2="22" />
      <line x1="2"  y1="12"    x2="5.5" y2="12" />
      <line x1="18.5" y1="12"  x2="22" y2="12" />
      <line x1="4.93" y1="4.93"   x2="7.05" y2="7.05" />
      <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93"  x2="16.95" y2="7.05" />
      <line x1="7.05"  y1="16.95" x2="4.93"  y2="19.07" />
    </svg>
  )
}

export function UtensilsIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <line x1="7" y1="2"  x2="7" y2="22" />
      <line x1="21" y1="15" x2="21" y2="22" />
      <path d="M21 2c0 0-3 2-3 6s3 6 3 6" />
    </svg>
  )
}

export function CoffeeIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
      <line x1="6"  y1="1" x2="6"  y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  )
}

export function MoonIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export const MEAL_ICONS = {
  desayuno: SunIcon,
  comida:   UtensilsIcon,
  merienda: CoffeeIcon,
  cena:     MoonIcon,
}
