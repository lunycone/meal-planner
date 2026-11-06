import { useState } from 'react'
import { DAY_KEYS, DAY_LONG, dayForPerson, dayTotals } from '../../lib/mealplan'
import { servingItems } from '../../lib/portions'
import { DRY_TO_COOKED, GI_DEFAULT, dishGlycemicLoad, fmtPortion, personMealScalesTwoPass } from '../../engine/calc'

export default function SmartDayDetail({ result, people, days, allIng, allCombos }) {
  const [personId, setPersonId] = useState(people.find(p => p.pcos)?.id ?? people[0]?.id)
  const [dayIndex, setDayIndex] = useState(days.includes(1) ? 1 : days[0])
  const person = people.find(p => p.id === personId) ?? people[0]
  const index = days.includes(dayIndex) ? dayIndex : days[0]
  if (!person || index == null) return null
  const day = dayForPerson(result.slots, DAY_KEYS[index], person.id)
  const dinner = allCombos[day.cena?.recipeKey]
  if (!dinner) return null
  const totals = dayTotals(day, person, index, allIng, allCombos)
  const scale = personMealScalesTwoPass(day, person, allIng, allCombos, totals.target).cena
  const items = servingItems(dinner, day.cena, scale)
  const load = dishGlycemicLoad({ items }, allIng)
  const fallback = items.some(it => allIng[it.k]?.gi == null && dishGlycemicLoad({ items: [it] }, allIng) > 0)
  const daily = result.daily?.[person.id]?.[index]
  return <details className="sw-detail">
    <summary>Dinner portion &amp; daily protein</summary>
    <div className="sw-detail-select">
      <label>Person <select value={person.id} onChange={e => setPersonId(e.target.value)}>{people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Day <select value={index} onChange={e => setDayIndex(Number(e.target.value))}>{days.map(i => <option key={i} value={i}>{DAY_LONG[i]}</option>)}</select></label>
    </div>
    <strong>{dinner.name}</strong>
    <ul>{items.map((it, i) => {
      const ing = allIng[it.k]
      const ratio = ing?.cookYield ?? DRY_TO_COOKED[it.k]
      const gi = dishGlycemicLoad({ items: [it] }, allIng) > 0
        ? ing?.gi != null ? ' · GI ' + ing.gi + (ing.giSource ? ' (' + ing.giSource + ')' : ' (catalog)') : ing?.giComparable ? ' · estimated using GI ' + ing.giComparable + ' for ' + ing.giComparableFood : ' · GI missing (assumed ' + GI_DEFAULT + ')' : ''
      return <li key={i}>{ing?.name ?? it.k} · {ratio && it.p.grams != null
        ? `${it.p.grams} g dry → ≈${Math.round(it.p.grams * ratio)} g cooked`
        : fmtPortion(it.p) === '—' ? '1 serving' : fmtPortion(it.p)}{gi}{ing?.gi == null && ing?.giReference && <a href={ing.giReference} target="_blank" rel="noreferrer"> · Source</a>}</li>
    })}</ul>
    <div>Estimated dinner glycemic load <strong>{load.toFixed(1)}</strong>{fallback ? ' · incomplete GI data' : ''}</div>
    <div>Daily protein <strong>{(daily?.protein ?? totals.prot).toFixed(2)} g</strong>{person.proteinTarget ? ` · target ${person.proteinTarget} g` : ''}{person.protCap ? ` · ceiling ${person.protCap} g` : ''}</div>
    {daily && <div>Vegetables <strong>{daily.veg.toFixed(1)} g</strong> · soluble fiber <strong>{daily.fiber.toFixed(2)} g</strong> · {daily.kcal} / {daily.target} kcal</div>}
  </details>
}
