// Pure calculation engine — all functions accept the merged ingredient map
// so price overrides propagate automatically everywhere.

export function ingCost(key, p, allIng) {
  const i = allIng[key]
  if (!i) return 0
  if (i.per100   != null && p.grams != null) return i.per100 * p.grams / 100
  if (i.perUnit  != null && p.units != null) return i.perUnit * p.units
  if (i.perML    != null && p.ml    != null) return i.perML * p.ml
  if (i.perServing != null) return i.perServing * (p.serv ?? 1)
  if (i.flat     != null) return i.flat
  return 0
}

export function ingKcal(key, p, allIng) {
  const i = allIng[key]
  if (!i) return 0
  if (i.kc   != null && p.grams != null) return i.kc * p.grams / 100
  if (i.kcu  != null && p.units != null) return i.kcu * p.units
  if (i.kcml != null && p.ml    != null) return i.kcml * p.ml
  if (i.kcs  != null) return i.kcs * (p.serv ?? 1)
  if (i.kcf  != null) return i.kcf
  return 0
}

export function ingIsEst(key, allIng) {
  return !!(allIng[key]?.est)
}

export function proteinCost(pr, useAlt = false) {
  const r = (useAlt && pr.altRation) ? pr.altRation : pr.ration
  if (r.grams != null) return pr.per100 * r.grams / 100
  if (r.units != null) return pr.perUnit * r.units
  if (r.flat  != null) return r.flat
  return 0
}

export function proteinKcal(pr, useAlt = false) {
  const r = (useAlt && pr.altRation) ? pr.altRation : pr.ration
  if (r.grams != null) return pr.kc * r.grams / 100
  if (r.units != null) return pr.kcu * r.units
  if (r.kc    != null) return r.kc
  return 0
}

export function comboAgg(combo, allIng) {
  let cost = 0, kcal = 0, hasEst = false
  for (const it of combo.items) {
    cost  += ingCost(it.k, it.p, allIng)
    kcal  += ingKcal(it.k, it.p, allIng)
    if (ingIsEst(it.k, allIng)) hasEst = true
  }
  return { cost, kcal, hasEst, incomplete: !!combo.incomplete }
}

export function prepAgg(prep, allIng) {
  let cost = 0, kcal = 0
  for (const it of prep.items) {
    cost += ingCost(it.k, it.p, allIng)
    kcal += ingKcal(it.k, it.p, allIng)
  }
  return { cost, kcal }
}

export function fmt(n)  { return '$' + n.toFixed(2) }
export function kfmt(n) { return Math.round(n) + ' kcal' }

export function fmtPortion(p) {
  if (p.grams != null) return p.grams + 'g'
  if (p.ml    != null) return p.ml + 'ml'
  if (p.units != null) {
    const m = { 0.25: '¼', 0.5: '½', 0.75: '¾' }
    return (m[p.units] ?? p.units) + ' ud'
  }
  if (p.serv  != null) return 'porción'
  return '—'
}
