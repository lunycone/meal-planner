import { tagsOf } from './tags'

// Encaje de un plato en cada fase del ciclo menstrual — heurística por el
// tipo de proteína (movida tal cual desde la HomeView antigua).

export const CYCLE_PHASES = [
  { id: 'menstrual',  name: 'Menstrual',  days: 'Days 1–5',   color: '#b85a5a', bg: 'rgba(184,90,90,0.07)',  border: 'rgba(184,90,90,0.18)' },
  { id: 'folicular',  name: 'Follicular', days: 'Days 6–13',  color: '#9a7b43', bg: 'rgba(154,123,67,0.07)', border: 'rgba(154,123,67,0.18)' },
  { id: 'ovulatoria', name: 'Ovulatory', days: 'Days 14–16', color: '#5a8a3a', bg: 'rgba(90,138,58,0.07)',  border: 'rgba(90,138,58,0.18)' },
  { id: 'lutea',      name: 'Luteal',     days: 'Days 17–28', color: '#7a5aaa', bg: 'rgba(122,90,170,0.07)', border: 'rgba(122,90,170,0.18)' },
]

// 27 sep 2026: por las etiquetas de los ingredientes del plato (lib/tags.js).
export function getPhaseScore(combo, allIng) {
  const tags = new Set((combo?.items ?? []).flatMap(it => tagsOf(it.k, allIng)))
  const keys = (combo?.items ?? []).map(it => it.k).join(' ')
  if (tags.has('fish') || tags.has('seafood'))
    return {
      menstrual:  { stars: 2, note: 'Omega-3 reduces menstrual inflammation. Provides non-heme iron.' },
      folicular:  { stars: 3, note: 'Light protein and omega-3. Supports rising energy perfectly.' },
      ovulatoria: { stars: 3, note: 'Maximum anti-inflammatory. A perfect match for ovulation.' },
      lutea:      { stars: 3, note: 'B6 and omega-3 reduce water retention and lift mood.' },
    }
  if (tags.has('red-meat') && !/liver/.test(keys))
    return {
      menstrual:  { stars: 3, note: 'Bioavailable heme iron. Ideal for replenishing during menstruation.' },
      folicular:  { stars: 1, note: 'Heavier protein for this phase. Lighter options are better.' },
      ovulatoria: { stars: 1, note: 'Can be pro-inflammatory. Prefer fish or chicken in this phase.' },
      lutea:      { stars: 3, note: 'Zinc and B12 support the nervous system in the luteal phase.' },
    }
  if (/liver/.test(keys))
    return {
      menstrual:  { stars: 3, note: 'The menstrual superfood: plenty of iron, folate and B12.' },
      folicular:  { stars: 2, note: 'Nutrient-dense. Once a week is great.' },
      ovulatoria: { stars: 1, note: 'Too intense for this phase. Go for something lighter.' },
      lutea:      { stars: 2, note: 'B12 and zinc support the nervous system in the luteal phase.' },
    }
  if (tags.has('egg'))
    return {
      menstrual:  { stars: 2, note: 'Easy to digest. Provide choline for mental well-being.' },
      folicular:  { stars: 3, note: 'Choline and B vitamins. Clean energy for the active phase.' },
      ovulatoria: { stars: 2, note: 'Complete protein. Pair with vegetables to boost the effect.' },
      lutea:      { stars: 3, note: 'B6 and tryptophan improve sleep and mood in the luteal phase.' },
    }
  if (tags.has('white-meat'))
    return {
      menstrual:  { stars: 2, note: 'Gentle, easy protein for low-energy days.' },
      folicular:  { stars: 3, note: 'Lean and rich in B3. Perfect for the most active phase.' },
      ovulatoria: { stars: 2, note: 'A good option paired with cruciferous vegetables.' },
      lutea:      { stars: 2, note: 'Tryptophan to improve sleep in the last phase of the cycle.' },
    }
  return {
    menstrual:  { stars: 2, note: 'Add an iron source if you can (spinach, seeds).' },
    folicular:  { stars: 2, note: 'Good base. Add vitamin C for better absorption.' },
    ovulatoria: { stars: 2, note: 'Add raw or fermented vegetables to boost the effect.' },
    lutea:      { stars: 2, note: 'Add magnesium (pumpkin seeds, cocoa) for this phase.' },
  }
}

