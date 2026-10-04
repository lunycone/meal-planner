// Snack / breakfast archetypes for the generator (engine/snackGen.js).
// An archetype is NOT a dish: it is a structure (slots by role) with ranges in
// kitchen steps. The generator fills each slot with ingredients of that role
// (data/snackRoles.js), as allowed by a flavor profile (data/flavorProfiles.js).
//
//  kind     'portion' -> prepared and eaten (grams are tuned per person)
//           'batch'   -> one preparation that yields `yield` servings and lasts
//                        `shelfDays`; the recipe is NOT scaled (fixed ratios),
//                        what changes per person is how many servings they eat
//  taste    'sweet' accepts sweet/neutral ingredients; 'savory' savory/neutral
//  gear     equipment ('blender', 'oven', 'freezer')
//  portable true if it holds in a lunchbox with no cooking or blender (Maria's
//           work days: Mon/Wed)
//  maxBatches  cap on batches per week (fridge / freezer / oven space)
//  slots    qty: [min, max, step] in `unit` ('g' | 'ml' | 'ea'). min === max
//           -> fixed amount (recipe ratio). optional: may stay empty.
//
// {tokens} in `steps` are slot ids; the generator writes the ingredient there.

export const ARCHETYPES = {
  smoothie: {
    label: 'smoothie', kind: 'portion', taste: 'sweet', gear: ['blender'], portable: false, shelfDays: 0, minutes: 5,
    slots: [
      { id: 'liquid',  role: 'liquid',  unit: 'ml', qty: [200, 400, 50] },
      { id: 'cereal',  role: 'cereal',  unit: 'g',  qty: [0, 100, 10], optional: true },
      { id: 'fruit',   role: 'fruit',   unit: 'g',  qty: [80, 200, 20] },
      { id: 'fat',     role: 'fat',     unit: 'g',  qty: [0, 25, 5],   optional: true },
      { id: 'crunch',  role: 'crunch',  unit: 'g',  qty: [0, 30, 10],  optional: true },
      { id: 'protein', role: 'protein', unit: 'g',  qty: [0, 40, 5],   optional: true },
      { id: 'flavor',  role: 'flavor',  unit: 'g',  qty: [0, 10, 5],   optional: true },
      { id: 'fiber',   role: 'fiber',   unit: 'g',  qty: [0, 15, 5],   optional: true },
    ],
    steps: ['Put {liquid} and {fruit} in the blender.', 'Add {cereal}, {fat}, {crunch}, {protein}, {fiber} and {flavor}.', 'Blend for 60 seconds until smooth.'],
  },

  'yogurt-bowl': {
    label: 'yogurt bowl', kind: 'portion', taste: 'sweet', gear: [], portable: true, shelfDays: 1, minutes: 3,
    slots: [
      { id: 'yogurt',    role: 'yogurt',    unit: 'g', qty: [150, 400, 50] },
      { id: 'fruit',     role: 'fruit',     unit: 'g', qty: [60, 200, 20] },
      { id: 'crunch',    role: 'crunch',    unit: 'g', qty: [10, 40, 10] },
      { id: 'cereal',    role: 'cereal',    unit: 'g', qty: [0, 50, 10], optional: true },
      { id: 'sweetener', role: 'sweetener', unit: 'g', qty: [0, 10, 5],  optional: true },
      { id: 'flavor',    role: 'flavor',    unit: 'g', qty: [0, 5, 5],   optional: true },
      { id: 'fiber',     role: 'fiber',     unit: 'g', qty: [0, 15, 5],  optional: true },
    ],
    steps: ['Put {yogurt} in a bowl or lunchbox.', 'Top with {fruit} and {crunch}.', 'Add {cereal}, {sweetener}, {fiber} and {flavor}. For the road, keep the crunch separate until you eat.'],
  },

  'overnight-oats': {
    label: 'overnight oats', kind: 'portion', taste: 'sweet', gear: [], portable: true, shelfDays: 2, minutes: 5,
    slots: [
      { id: 'cereal', role: 'cereal', unit: 'g',  qty: [40, 100, 10] },
      { id: 'liquid', role: 'liquid', unit: 'ml', qty: [100, 250, 50] },
      { id: 'yogurt', role: 'yogurt', unit: 'g',  qty: [0, 150, 50],  optional: true },
      { id: 'fruit',  role: 'fruit',  unit: 'g',  qty: [60, 150, 20] },
      { id: 'crunch', role: 'crunch', unit: 'g',  qty: [0, 30, 10],   optional: true },
      { id: 'flavor', role: 'flavor', unit: 'g',  qty: [0, 10, 5],    optional: true },
      { id: 'fiber',  role: 'fiber',  unit: 'g',  qty: [0, 15, 5],    optional: true },
    ],
    steps: ['Mix {cereal}, {liquid} and {yogurt} in a jar.', 'Stir in {flavor} and {fiber}.', 'Close and leave in the fridge overnight.', 'When you eat, add {fruit} and {crunch}.'],
  },

  'baked-oats': {
    label: 'baked oats', kind: 'portion', taste: 'sweet', gear: ['oven'], portable: true, shelfDays: 2, minutes: 25,
    slots: [
      { id: 'cereal', role: 'cereal', unit: 'g',  qty: [40, 80, 10] },
      { id: 'binder', role: 'binder', unit: 'ea', qty: [1, 2, 1] },
      { id: 'liquid', role: 'liquid', unit: 'ml', qty: [80, 150, 50] },
      { id: 'fruit',  role: 'fruit',  unit: 'g',  qty: [60, 150, 20] },
      { id: 'flavor', role: 'flavor', unit: 'g',  qty: [0, 10, 5], optional: true },
      { id: 'crunch', role: 'crunch', unit: 'g',  qty: [0, 20, 10], optional: true },
      { id: 'fiber',  role: 'fiber',  unit: 'g',  qty: [0, 15, 5],  optional: true },
    ],
    steps: ['Mash or blend {cereal}, {binder}, {liquid}, {fiber} and {fruit}.', 'Stir in {flavor} and {crunch}.', 'Bake 20 minutes at 180 °C (350 °F) in an individual dish.'],
  },

  toast: {
    label: 'toast', kind: 'portion', taste: 'sweet', gear: [], portable: false, shelfDays: 0, minutes: 5,
    slots: [
      { id: 'bread',     role: 'bread',     unit: 'g', qty: [60, 120, 20] },
      { id: 'yogurt',    role: 'yogurt',    unit: 'g', qty: [30, 100, 10] },
      { id: 'fruit',     role: 'fruit',     unit: 'g', qty: [40, 120, 20] },
      { id: 'crunch',    role: 'crunch',    unit: 'g', qty: [0, 20, 10], optional: true },
      { id: 'sweetener', role: 'sweetener', unit: 'g', qty: [0, 10, 5],  optional: true },
      { id: 'flavor',    role: 'flavor',    unit: 'g', qty: [0, 5, 5],   optional: true },
    ],
    steps: ['Toast {bread}.', 'Spread {yogurt}.', 'Top with {fruit}, {crunch}, {sweetener} and {flavor}.'],
  },

  'savory-toast': {
    label: 'savory toast', kind: 'portion', taste: 'savory', gear: [], portable: true, shelfDays: 0, minutes: 5,
    slots: [
      { id: 'bread',  role: 'bread',  unit: 'g', qty: [60, 120, 20] },
      { id: 'cured',  role: 'cured',  unit: 'g', qty: [20, 60, 10] },
      { id: 'yogurt', role: 'yogurt', unit: 'g', qty: [0, 60, 20], optional: true },
      { id: 'fat',    role: 'fat',    unit: 'g', qty: [0, 10, 5],  optional: true },
    ],
    steps: ['Toast {bread}.', 'Spread {fat} or {yogurt}.', 'Lay {cured} on top.'],
  },

  // ── BATCHES ──────────────────────────────────────────────────────────────
  cake: {
    // Fixed ratios: changing one breaks the recipe. Made once, eaten over
    // several days. Only the filling and the topping are flexible.
    label: 'cake', kind: 'batch', taste: 'sweet', gear: ['oven'], portable: true, yield: 8, shelfDays: 5, maxBatches: 2, storage: 'fridge', minutes: 45,
    slots: [
      { id: 'flour',     role: 'flour',     unit: 'g',  qty: [200, 200, 1] },
      { id: 'binder',    role: 'binder',    unit: 'ea', qty: [3, 3, 1] },
      { id: 'sweetener', role: 'sweetener', unit: 'g',  qty: [80, 80, 1] },
      { id: 'fat',       role: 'fat',       unit: 'g',  qty: [60, 60, 1] },
      { id: 'yogurt',    role: 'yogurt',    unit: 'g',  qty: [125, 125, 1] },
      { id: 'filling',   role: ['fruit', 'veg'], unit: 'g', qty: [150, 250, 50] },
      { id: 'crunch',    role: 'crunch',    unit: 'g',  qty: [0, 40, 20], optional: true },
      { id: 'flavor',    role: 'flavor',    unit: 'g',  qty: [0, 10, 5],  optional: true },
    ],
    steps: ['Preheat the oven to 180 °C (350 °F).', 'Beat {binder} with {sweetener} and {fat}, then add {yogurt}.', 'Fold in {flour} and {flavor}, then {filling} and {crunch}.', 'Bake 35 minutes in a loaf pan. Let it cool and cut into 8 slices.'],
  },

  'energy-bites': {
    label: 'energy bites', kind: 'batch', taste: 'sweet', gear: [], portable: true, yield: 12, shelfDays: 7, maxBatches: 3, storage: 'fridge', minutes: 15,
    slots: [
      { id: 'cereal',    role: 'cereal',    unit: 'g', qty: [120, 120, 1] },
      { id: 'fat',       role: 'fat',       unit: 'g', qty: [60, 60, 1] },
      { id: 'sweetener', role: 'sweetener', unit: 'g', qty: [40, 40, 1] },
      { id: 'crunch',    role: 'crunch',    unit: 'g', qty: [40, 80, 20] },
      { id: 'flavor',    role: 'flavor',    unit: 'g', qty: [5, 15, 5] },
    ],
    steps: ['Mix {cereal}, {fat}, {sweetener}, {crunch} and {flavor}.', 'Roll into 12 balls.', 'Keep in a closed container in the fridge.'],
  },

  'yogurt-bark': {
    label: 'yogurt bark', kind: 'batch', taste: 'sweet', gear: ['freezer'], portable: true, yield: 6, shelfDays: 21, maxBatches: 2, storage: 'freezer', minutes: 10,
    slots: [
      { id: 'yogurt',    role: 'yogurt',    unit: 'g', qty: [500, 500, 1] },
      { id: 'sweetener', role: 'sweetener', unit: 'g', qty: [0, 20, 10], optional: true },
      { id: 'fruit',     role: 'fruit',     unit: 'g', qty: [100, 200, 50] },
      { id: 'crunch',    role: 'crunch',    unit: 'g', qty: [30, 60, 10] },
      { id: 'flavor',    role: 'flavor',    unit: 'g', qty: [0, 10, 5], optional: true },
    ],
    steps: ['Mix {yogurt} with {sweetener} and {flavor}.', 'Spread on a lined tray about 1 cm thick.', 'Scatter {fruit} and {crunch} on top.', 'Freeze 3 hours and break into 6 pieces. Keep in the freezer.'],
  },
}

const asArray = r => (Array.isArray(r) ? r : [r])

// Returns the list of definition problems; empty if everything adds up.
export function validateArchetypes(arch, roles) {
  const out = []
  for (const [id, a] of Object.entries(arch)) {
    if (!['portion', 'batch'].includes(a.kind)) out.push(`${id}: invalid kind`)
    if (!['sweet', 'savory'].includes(a.taste)) out.push(`${id}: invalid taste`)
    if (a.kind === 'batch' && !(a.yield > 0 && a.shelfDays > 0)) out.push(`${id}: a batch needs yield and shelfDays`)
    const ids = new Set()
    for (const s of a.slots) {
      if (ids.has(s.id)) out.push(`${id}: duplicate slot ${s.id}`)
      ids.add(s.id)
      for (const r of asArray(s.role)) if (!roles[r]) out.push(`${id}.${s.id}: unknown role ${r}`)
      const [min, max, step] = s.qty
      if (!(min <= max && step > 0)) out.push(`${id}.${s.id}: invalid range`)
      if (min === 0 && !s.optional) out.push(`${id}.${s.id}: min 0 but not optional`)
    }
    const used = (a.steps.join(' ').match(/\{(\w+)\}/g) || []).map(t => t.slice(1, -1))
    for (const t of used) if (!ids.has(t)) out.push(`${id}: a step uses {${t}} which is not a slot`)
  }
  return out
}
