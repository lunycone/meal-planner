// ─── Plan engine — pure derivation functions ──────────────────────────────────
// Source of truth: batches + dayOverrides (in the store).
// Everything else (day view, weekly totals, home card summaries) is DERIVED here.
// No state lives here — only transformations.

import { DAY_KEYS } from '../config/meals'
import { fmt, kfmt } from './calc'

// ─── Day map ─────────────────────────────────────────────────────────────────
// For a single week returns what's planned for each of the 7 days.
// Priority: dayOverride > cook day > eat day
//
// Returns:
//   { dom: { type: 'special'|'cook'|'eat', batch?, override? }, lun: {...}, ... }

export function getWeekDayMap(week) {
  const map = {}

  // 1. Eat days first (lowest priority)
  for (const batch of (week.batches ?? [])) {
    for (const day of (batch.covers ?? [])) {
      if (!map[day]) map[day] = { type: 'eat', batch }
    }
  }

  // 2. Cook days win over eat days (you're cooking that day)
  for (const batch of (week.batches ?? [])) {
    map[batch.cookDay] = { type: 'cook', batch }
  }

  // 3. Day overrides win over everything (special meals, one-offs)
  for (const [day, override] of Object.entries(week.dayOverrides ?? {})) {
    map[day] = { type: 'special', override }
  }

  return map
}

// ─── Week summary ─────────────────────────────────────────────────────────────

export function weekSummary(week) {
  const batches = week.batches ?? []
  if (!batches.length) return { avgCostEst: 0, avgKcalEst: 0, batches: 0, hasSpecial: false }

  const totalCost = batches.reduce((a, b) => a + (b.costEst ?? 0), 0)
  const totalKcal = batches.reduce((a, b) => a + (b.kcalEst ?? 0), 0)
  const hasSpecial = Object.keys(week.dayOverrides ?? {}).length > 0

  return {
    avgCostEst:  totalCost / batches.length,
    avgKcalEst:  totalKcal / batches.length,
    batches:     batches.length,
    hasSpecial,
  }
}

// ─── Stream summary (for the Home card) ──────────────────────────────────────

export function streamSummary(mergedWeeks) {
  const allBatches = mergedWeeks.flatMap(w => w.batches ?? [])
  if (!allBatches.length) {
    return {
      isEmpty: true, weekCount: 0, batchCount: 0,
      avgCostEst: null, avgKcalEst: null,
      costLabel: '—', kcalLabel: '—',
      previewLines: [],
    }
  }

  const totalCost = allBatches.reduce((a, b) => a + (b.costEst ?? 0), 0)
  const totalKcal = allBatches.reduce((a, b) => a + (b.kcalEst ?? 0), 0)
  const avg = n => n / allBatches.length

  const previewWeek  = mergedWeeks[0]
  const previewLines = (previewWeek?.batches ?? []).slice(0, 2).map(b => ({
    cookDay: b.cookDay,
    protein: b.protein,
    combo:   b.combo,
  }))

  return {
    isEmpty:      false,
    weekCount:    mergedWeeks.length,
    batchCount:   allBatches.length,
    avgCostEst:   avg(totalCost),
    avgKcalEst:   avg(totalKcal),
    costLabel:    fmt(avg(totalCost)),
    kcalLabel:    kfmt(avg(totalKcal)),
    previewLines,
  }
}
