// ─── Rotación de verduras a granel ──────────────────────────────────────────
// Algunas compras grandes (zucchini, judía verde, guisantes de 12 kg, butternut)
// no caben a la vez en el congelador, así que se turnan: un ingrediente con
// `rotation: '<grupo>'` solo cuenta en las semanas inteligentes si tiene
// existencias, o si NINGUNO del grupo las tiene (entonces valen todos y gana el
// más barato: lo que toca comprar). Mientras haya uno del grupo en la despensa,
// los demás quedan en pausa.

/** Grupos de rotación que tienen algo en la despensa. */
export function rotationHeld(allIng, stock = {}) {
  const held = new Set()
  for (const [k, i] of Object.entries(allIng)) if (i?.rotation && stock[k] > 0) held.add(i.rotation)
  return held
}

/** ¿Está este ingrediente en pausa porque otro de su grupo está en la despensa? */
export function rotationPaused(key, ing, stock = {}, held) {
  if (!ing?.rotation || stock[key] > 0) return false
  return held.has(ing.rotation)
}
