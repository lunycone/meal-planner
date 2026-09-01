// Legacy module. The real catalog now lives in `dishes.js` (single-step,
// one entry per dish, no protein→combo joining). Kept exported so tabs that
// still import from here (Compra, Batch, Combinaciones) don't crash — COMBO
// re-exports the new catalog under the old name; COMBO_SETS/PREP are retired.
import { DISHES } from './dishes'

export const PREP = {}
export const COMBO = DISHES
export const COMBO_SETS = {}
