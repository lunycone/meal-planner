// Resolve one serving before adding it to a shopping list or inspecting its nutrients.
export function servingItems(combo, meal, scale) {
  if (!combo) return []
  const factor = scale?.wholeDishFactor ?? 1
  const portion = ({ k, p }) => {
    const q = { ...p }
    if (q.units != null) q.units = meal?.comboVariants?.[k] ?? q.units
    if (factor < 1) {
      if (q.grams != null) q.grams = Math.round(q.grams * factor)
      if (q.ml != null) q.ml = Math.round(q.ml * factor)
      if (q.units != null) q.units = Math.round(2 * q.units * factor) / 2
    }
    return { k, p: q }
  }
  const items = combo.items.map(item => {
    const resolved = portion(item)
    if (item.k === scale?.ingKey && scale.grams != null && item.p.grams != null) resolved.p.grams = scale.grams
    return resolved
  })
  for (const item of combo.optionalItems ?? []) {
    if (meal?.comboOptionals?.includes(item.k)) items.push(portion(item))
  }
  if (scale?.oilMlApplied > 0) items.push({ k: 'evoo', p: { ml: scale.oilMlApplied } })
  return items
}
