// Tolerancia empirica por ingrediente, derivada de lo que YA se come.
//
// Un ingrediente es "probado" si aparece en algun plato de dishes.js; su
// cantidad maxima en esos platos es el tope por defecto para el generador de
// meriendas. No es un dato clinico (FODMAP depende de la cantidad y de la
// persona): es "no pasar de lo que ya se ha comido". Un ingrediente que no
// aparece en ningun plato es una NOVEDAD y el generador limita cuantas entran
// por semana. No hay tabla escrita a mano: se recalcula de DISHES, asi que
// sigue cuadrando cuando se anaden platos.

// dishes: objeto { key: { items: [{ k, p: { grams|ml|units } }] } }
// Devuelve { [ingKey]: { max, unit, dishes } } con max = null si el ingrediente
// no tiene cantidad (especias 'flat'), es decir probado pero sin tope.
export function testedIngredients(dishes) {
  const out = {}
  for (const d of Object.values(dishes)) {
    for (const it of d.items) {
      const p = it.p || {}
      const unit = p.grams != null ? 'g' : p.ml != null ? 'ml' : p.units != null ? 'ud' : null
      const q    = unit === 'g' ? p.grams : unit === 'ml' ? p.ml : unit === 'ud' ? p.units : null
      const cur  = out[it.k] ?? (out[it.k] = { max: null, unit, dishes: 0 })
      cur.dishes++
      if (q != null && (cur.max == null || q > cur.max)) { cur.max = q; cur.unit = unit }
    }
  }
  return out
}

// true si `qty` (en la unidad del tope) no supera lo ya comido.
export function withinTested(tested, key, qty) {
  const t = tested[key]
  if (!t) return false          // novedad: no hay base para decir que si
  if (t.max == null) return true
  return qty <= t.max
}

export function isNovelty(tested, key) {
  return !tested[key]
}
