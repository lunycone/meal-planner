// Small pink orchid-style badge for dishes flagged low-carb-enough for PCOS
// (desayuno/cena only, ≤30% of kcal from carb — see calc.js isPcosFriendly).
// Deliberately not a heart, so it doesn't read as a generic "favorite" icon.
export default function PcosBadge({ title = 'PCOS-friendly (bajo en carbo)' }) {
  return (
    <span
      title={title}
      style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', marginLeft: 6 }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g fill="#e8558f">
          <ellipse cx="12" cy="6.2" rx="3.1" ry="4.4" />
          <ellipse cx="12" cy="17.8" rx="3.1" ry="4.4" />
          <ellipse cx="5.4" cy="9.6" rx="4.4" ry="3.1" transform="rotate(-35 5.4 9.6)" />
          <ellipse cx="18.6" cy="9.6" rx="4.4" ry="3.1" transform="rotate(35 18.6 9.6)" />
          <ellipse cx="5.4" cy="14.4" rx="4.4" ry="3.1" transform="rotate(35 5.4 14.4)" />
        </g>
        <circle cx="12" cy="12" r="2.3" fill="#fff0f5" stroke="#e8558f" strokeWidth="0.8" />
      </svg>
    </span>
  )
}
