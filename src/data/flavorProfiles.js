// Flavor profiles: combinations that DO make sense, written by hand.
// It is an allow-list: if a combination is not here, it does not exist.
//
//  pick   per role, the concrete ingredients allowed in that profile. A role
//         that is missing uses DEFAULT_POOL (neutral staples).
//  suits  archetypes (archetypes.js) where the profile works.
//
// Profiles with ingredients that appear in no dish (see engine/tolerance.js)
// count as a NOVELTY in the generator; no need to mark it here.

export const DEFAULT_POOL = {
  liquid:    ['whole-milk', 'skim-milk', 'kefir'],
  cereal:    ['oats', 'barley-flakes'],
  yogurt:    ['cow-yogurt', 'goat-yogurt'],
  fat:       ['butter', 'coconut-oil'],   // coconut-oil: not at breakfast (NO_MEALS in snackRoles.js)
  sweetener: ['honey'],
  flour:     ['flour'],
  binder:    ['eggs'],
  bread:     ['sourdough-bread'],
  protein:   ['whey-protein'],
  crunch:    ['pumpkin-seeds', 'almonds'],
  fiber:     ['ground-flaxseed'],
}

const SWEET = ['smoothie', 'yogurt-bowl', 'overnight-oats', 'baked-oats', 'toast', 'energy-bites', 'yogurt-bark', 'cake']

export const FLAVOR_PROFILES = {
  // ── Banana ───────────────────────────────────────────────────────────────
  'banana-cocoa':    { name: 'Banana and cocoa', taste: 'sweet', suits: SWEET,
    pick: { fruit: ['banana'], flavor: ['cocoa'], crunch: ['almonds', 'hazelnuts'] } },
  'banana-cinnamon': { name: 'Banana and cinnamon', taste: 'sweet', suits: SWEET,
    pick: { fruit: ['banana'], flavor: ['cinnamon', 'vanilla'], crunch: ['pumpkin-seeds', 'almonds', 'walnuts'] } },
  'banana-hazelnut': { name: 'Banana and hazelnut', taste: 'sweet', suits: SWEET,
    pick: { fruit: ['banana'], flavor: ['cocoa', 'cinnamon'], crunch: ['hazelnuts'] } },
  'banana-honey':    { name: 'Banana, honey and butter', taste: 'sweet', suits: ['toast', 'overnight-oats', 'baked-oats', 'yogurt-bowl'],
    pick: { fruit: ['banana'], flavor: ['cinnamon', 'vanilla'], crunch: ['pumpkin-seeds'], sweetener: ['honey'], fat: ['butter'] } },

  // ── Berries and citrus ───────────────────────────────────────────────────
  'blueberry-lemon':  { name: 'Blueberries and lemon', taste: 'sweet', suits: ['yogurt-bowl', 'overnight-oats', 'yogurt-bark', 'cake', 'smoothie'],
    pick: { fruit: ['blueberries'], flavor: ['lemon'], crunch: ['pumpkin-seeds', 'almonds'] } },
  'blueberry-almond': { name: 'Blueberries and almond', taste: 'sweet', suits: SWEET,
    pick: { fruit: ['blueberries'], flavor: ['cinnamon'], crunch: ['almonds'] } },
  'blueberry-honey':  { name: 'Blueberries and honey', taste: 'sweet', suits: ['yogurt-bowl', 'yogurt-bark', 'toast', 'overnight-oats'],
    pick: { fruit: ['blueberries'], flavor: ['lemon', 'vanilla'], crunch: ['pumpkin-seeds'], sweetener: ['honey'] } },
  'mandarin-chocolate': { name: 'Mandarin and dark chocolate', taste: 'sweet', suits: ['yogurt-bowl', 'yogurt-bark', 'energy-bites', 'overnight-oats', 'smoothie'],
    pick: { fruit: ['mandarin'], flavor: ['dark-chocolate'], crunch: ['almonds', 'hazelnuts'] } },
  citrus:             { name: 'Citrus (mandarin and blueberry)', taste: 'sweet', suits: ['smoothie', 'yogurt-bowl', 'overnight-oats'],
    pick: { fruit: ['mandarin', 'blueberries'], flavor: ['lemon'], crunch: ['pumpkin-seeds'] } },
  'melon-lemon':      { name: 'Cantaloupe and lemon', taste: 'sweet', suits: ['smoothie', 'yogurt-bowl', 'yogurt-bark'],
    pick: { fruit: ['cantaloupe'], flavor: ['lemon'], crunch: ['pumpkin-seeds'] } },

  // ── Apple, applesauce and quince (cooked: better tolerated) ──────────────
  'applesauce-cinnamon': { name: 'Applesauce and cinnamon', taste: 'sweet', suits: ['toast', 'overnight-oats', 'baked-oats', 'yogurt-bowl', 'smoothie', 'cake'],
    pick: { fruit: ['applesauce'], flavor: ['cinnamon', 'nutmeg'], crunch: ['almonds', 'hazelnuts'] } },
  'quince-cinnamon':     { name: 'Cooked quince and cinnamon', taste: 'sweet', suits: ['smoothie', 'toast', 'overnight-oats', 'baked-oats'],
    pick: { fruit: ['quince'], flavor: ['cinnamon'], crunch: ['hazelnuts', 'almonds'] } },
  'apple-cinnamon':      { name: 'Apple and cinnamon', taste: 'sweet', suits: ['baked-oats', 'overnight-oats', 'cake', 'toast'],
    pick: { fruit: ['apple'], flavor: ['cinnamon', 'nutmeg'], crunch: ['hazelnuts', 'walnuts'] } },

  // ── Chocolate and avocado ────────────────────────────────────────────────
  'avocado-cocoa':      { name: 'Avocado and cocoa', taste: 'sweet', suits: ['smoothie', 'yogurt-bowl', 'overnight-oats'],
    pick: { fruit: ['avocado', 'banana'], flavor: ['cocoa'], crunch: ['pumpkin-seeds'] } },
  'chocolate-hazelnut': { name: 'Dark chocolate and hazelnut', taste: 'sweet', suits: ['energy-bites', 'baked-oats', 'yogurt-bark', 'smoothie', 'overnight-oats'],
    pick: { fruit: ['banana'], flavor: ['dark-chocolate', 'cocoa'], crunch: ['hazelnuts'] } },

  // ── Vegetables in baking ─────────────────────────────────────────────────
  'carrot-spice':     { name: 'Carrot and spice (carrot cake)', taste: 'sweet', suits: ['cake', 'baked-oats', 'energy-bites'],
    pick: { fruit: ['carrot'], flavor: ['cinnamon', 'nutmeg'], crunch: ['pumpkin-seeds', 'almonds', 'walnuts'] } },
  'butternut-spice':  { name: 'Butternut and spice', taste: 'sweet', suits: ['cake', 'baked-oats', 'overnight-oats'],
    pick: { fruit: ['butternut-squash'], flavor: ['cinnamon', 'nutmeg'], crunch: ['pumpkin-seeds'] } },
  'zucchini-chocolate': { name: 'Zucchini and chocolate (brownie)', taste: 'sweet', suits: ['cake', 'baked-oats'],
    pick: { fruit: ['zucchini'], flavor: ['cocoa'], crunch: ['hazelnuts', 'almonds'] } },

  // ── Peanut butter ────────────────────────────────────────────────────────
  'peanut-banana':    { name: 'Peanut butter and banana', taste: 'sweet', suits: ['toast', 'overnight-oats', 'baked-oats', 'smoothie', 'energy-bites'],
    pick: { fruit: ['banana'], flavor: ['cinnamon', 'vanilla'], fat: ['peanut-butter'], crunch: ['pumpkin-seeds'] } },
  'peanut-chocolate': { name: 'Peanut butter and chocolate', taste: 'sweet', suits: ['smoothie', 'overnight-oats', 'baked-oats', 'toast'],
    pick: { fruit: ['banana'], flavor: ['cocoa'], fat: ['peanut-butter'] } },

  // ── Energy bites (no fruit) ──────────────────────────────────────────────
  'bites-cocoa-hazelnut': { name: 'Cocoa and hazelnut', taste: 'sweet', suits: ['energy-bites'],
    pick: { flavor: ['cocoa'], crunch: ['hazelnuts'] } },
  'bites-cinnamon-walnut': { name: 'Cinnamon and walnut', taste: 'sweet', suits: ['energy-bites'],
    pick: { flavor: ['cinnamon', 'vanilla'], crunch: ['walnuts', 'pumpkin-seeds'] } },
  'bites-chocolate-almond': { name: 'Dark chocolate and almond', taste: 'sweet', suits: ['energy-bites'],
    pick: { flavor: ['dark-chocolate'], crunch: ['almonds'] } },
  'bites-vanilla-pumpkin': { name: 'Vanilla and pumpkin seeds', taste: 'sweet', suits: ['energy-bites'],
    pick: { flavor: ['vanilla', 'cinnamon'], crunch: ['pumpkin-seeds', 'sunflower-seeds'] } },
  'bites-peanut-cocoa': { name: 'Peanut butter and cocoa', taste: 'sweet', suits: ['energy-bites'],
    pick: { flavor: ['cocoa', 'vanilla'], fat: ['peanut-butter'], crunch: ['pumpkin-seeds', 'sunflower-seeds'] } },

  // ── Novelties (ingredients in no dish yet: they use the novelty quota) ───
  'strawberry-chocolate': { name: 'Strawberry and dark chocolate', taste: 'sweet', suits: ['yogurt-bark', 'yogurt-bowl', 'overnight-oats', 'smoothie'],
    pick: { fruit: ['strawberries'], flavor: ['dark-chocolate'], crunch: ['almonds'] } },
  'strawberry-chia':      { name: 'Strawberry and chia', taste: 'sweet', suits: ['yogurt-bowl', 'yogurt-bark', 'overnight-oats', 'toast'],
    pick: { fruit: ['strawberries'], flavor: ['lemon', 'vanilla'], crunch: ['chia'], sweetener: ['honey'] } },
  'orange-coconut':       { name: 'Orange and coconut', taste: 'sweet', suits: ['yogurt-bark', 'yogurt-bowl', 'energy-bites', 'cake'],
    pick: { fruit: ['orange'], flavor: ['cinnamon'], crunch: ['shredded-coconut'] } },
  'tahini-banana':        { name: 'Tahini and banana', taste: 'sweet', suits: ['toast', 'energy-bites', 'overnight-oats'],
    pick: { fruit: ['banana'], flavor: ['cinnamon'], crunch: ['pumpkin-seeds'], fat: ['tahini'], sweetener: ['honey'] } },

  // ── Savory ───────────────────────────────────────────────────────────────
  'cooked-ham':   { name: 'Cooked ham on toast', taste: 'savory', suits: ['savory-toast'],
    pick: { cured: ['cooked-ham'], fat: ['evoo'], yogurt: ['ricotta'] } },
  'cold-cuts':    { name: 'Italian cold cuts on toast', taste: 'savory', suits: ['savory-toast'],
    pick: { cured: ['cold-cuts'], fat: ['evoo'], yogurt: ['ricotta'] } },
  'salami-ricotta': { name: 'Salami and ricotta', taste: 'savory', suits: ['savory-toast'],
    pick: { cured: ['salami'], yogurt: ['ricotta'] } },
}

const roleOfKey = (k, ING, snackRoleOf) => snackRoleOf(k, ING)?.role

// Checks against real data. Returns the list of problems.
export function validateProfiles(profiles, ING, ARCH, ROLES, snackRoleOf) {
  const out = []
  for (const [id, p] of Object.entries(profiles)) {
    for (const a of p.suits) if (!ARCH[a]) out.push(`${id}: unknown archetype ${a}`)
    for (const [role, keys] of Object.entries(p.pick)) {
      if (!ROLES[role]) out.push(`${id}: unknown role ${role}`)
      for (const k of keys) {
        if (!ING[k]) { out.push(`${id}: missing ingredient ${k}`); continue }
        const r = roleOfKey(k, ING, snackRoleOf)
        // carrot/squash/zucchini are declared under 'fruit' for the cake 'filling' slot
        if (r !== role && !(role === 'fruit' && r === 'veg')) out.push(`${id}: ${k} has role ${r}, not ${role}`)
        const t = snackRoleOf(k, ING)?.taste
        if (t && p.taste === 'sweet' && t === 'savory') out.push(`${id}: ${k} is savory in a sweet profile`)
        if (t && p.taste === 'savory' && t === 'sweet') out.push(`${id}: ${k} is sweet in a savory profile`)
      }
    }
    for (const a of p.suits) {
      for (const s of (ARCH[a]?.slots ?? [])) {
        if (s.optional) continue
        const roles = [].concat(s.role)
        const have = roles.some(r => (p.pick[r] ?? DEFAULT_POOL[r] ?? []).length > 0)
        if (!have) out.push(`${id} + ${a}: required slot '${s.id}' has no ingredients`)
      }
    }
  }
  return out
}
