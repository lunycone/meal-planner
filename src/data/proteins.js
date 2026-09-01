// Legacy module. Proteins are no longer a separate catalog joined to combos —
// every dish in `dishes.js` is self-contained. Kept exported (empty) so any
// remaining import doesn't crash; safe to delete once nothing references it.
export const COOK_FAT = {
  cooked:  [{ name: 'Grasa cocción (vaca/coco)', kc: 115 }, { name: 'Aceite oliva por encima', kc: 120 }],
  drizzle: [{ name: 'Aceite oliva por encima', kc: 120 }],
}

export const PROTEIN = {}
