import { useMemo, useState } from 'react'
import { cafeMenu } from '../../engine/cafeSnacks'
import { fmtPortion, slotForPerson } from '../../engine/calc'
import { DAY_SHORT, DAY_KEYS, activeProfilesOn, addDays, fmtMoney } from '../../lib/mealplan'
import useStore from '../../store/useStore'

const shortName = name => name.split(' (')[0]
function CafeDish({ recipe, allIng, rate, use, current }) {
  const { name, description, macros, items, totals, issues } = recipe
  const labels = keys => keys.map(k => shortName(allIng[k].name)).join(', ')
  return <article className="cafe-dish">
    <details>
      <summary>
        <img src={`/cafe/${recipe.id}.webp`} alt="" width="112" height="96" loading="lazy" />
        <span><strong>{name}</strong><span className="cafe-description">{description}</span>
          <small>{recipe.prep ?? recipe.minutes + ' min'} · {macros.hasEst && '≈'}{fmtMoney(macros.cost)} · Recipe ▾</small></span>
      </summary>
      <div className="cafe-recipe">
        <p>{items.map(({k,p}) => (allIng[k].flat != null ? 'Pinch' : fmtPortion(p)) + ' ' + shortName(allIng[k].name).toLowerCase()).join(' · ')}</p>
        <ol>{recipe.steps.map(step => <li key={step}>{step}</li>)}</ol>
        {recipe.travel && <p><b>To go</b> · {recipe.travel}</p>}
        {recipe.open.length > 0 ? <p>Uses an open pack · {labels(recipe.open)}</p> : recipe.onHand.length > 0 && <p>Recorded in pantry · {labels(recipe.onHand)}</p>}
        {recipe.novel.length > 0 && <p>New to your dishes · {labels(recipe.novel)}</p>}
        <p><b>This serving</b> · {Math.round(macros.kcal)} kcal · {Math.round(macros.prot)} g protein</p>
        <p><b>María’s day</b> · {totals.planned}/4 meals planned · {totals.kcal}/{totals.target} kcal · {totals.prot} g protein</p>
        {issues.filter(x => x.rule !== 'incomplete').map(x => <p key={x.text}>{x.text}</p>)}
        <div className="cafe-feedback" aria-label="How filling was this recipe last time?">
          <span>Last time</span>
          {[['enough','Kept me full'],['hungry','Hungry again']].map(([value,label]) =>
            <button key={value} className="sw-act" type="button" aria-pressed={recipe.previous === value}
              onClick={() => rate(recipe.key, recipe.previous === value ? null : value)}>{label}{recipe.previous === value ? ' ✓' : ''}</button>)}
        </div>
        <button type="button" className="mp-btn mp-btn-dark mp-btn-sm" onClick={use}>{current ? 'Replace' : 'Add'} María’s snack</button>
      </div>
    </details>
  </article>
}

export default function MariaCafe({ wk, week, monday, profiles, allIng, allCombos, tried, stock, openPacks, feedback,
  dayIndex, setDayIndex, initialNovelty, onApplied, onClose }) {
  const [larger, setLarger] = useState(false)
  const [toGo, setToGo] = useState(false)
  const [noveltyMax, setNovelty] = useState(initialNovelty)
  const applyCafeSnack = useStore(s => s.applyCafeSnack)
  const rateSnack = useStore(s => s.rateSnack)
  const people = activeProfilesOn(profiles, addDays(monday,dayIndex))
  const person = people.find(p => p.id === 'maria')
  const menu = useMemo(() => person ? cafeMenu({ person, dayIndex, week, allIng, allCombos, tried, stock, openPacks,
    feedback, noveltyMax, larger, toGo }) : [], [person, dayIndex, week, allIng, allCombos, tried, stock, openPacks, feedback, noveltyMax, larger, toGo])
  const slotKey = DAY_KEYS[dayIndex] + '-merienda'
  const current = person && slotForPerson(week[slotKey],person.id)
  function apply(r) {
    applyCafeSnack(wk, slotKey, person.id, { id:r.id, name:r.name + ' · ' + person.name, items:r.items, size:larger ? 'large' : 'regular' }, people.map(p=>p.id))
    onApplied?.(r.name + ' added for ' + person.name + ' · ' + DAY_SHORT[dayIndex])
    onClose()
  }
  return <div className="mp-sheet-body cafe-menu">
    <div className="cafe-filters">
      <label>Day <select value={dayIndex} onChange={e=>setDayIndex(Number(e.target.value))}>{DAY_SHORT.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label>
      <label>Serving <select value={larger ? 'large' : 'regular'} onChange={e=>setLarger(e.target.value === 'large')}><option value="regular">Regular</option><option value="large">More filling</option></select></label>
      <label>Ingredients <select value={noveltyMax} onChange={e=>setNovelty(Number(e.target.value))}>
        <option value={0}>Already tried</option><option value={1}>Up to 1 new</option><option value={6}>Full café menu</option>
      </select></label>
      <label><input type="checkbox" checked={toGo} onChange={e=>setToGo(e.target.checked)} /> To go</label>
    </div>
    {current && <p className="cafe-current">{DAY_SHORT[dayIndex]} · María already has {allCombos[current.recipeKey]?.name ?? 'a snack'} planned.</p>}
    {!person ? <p>María’s profile is inactive on this date.</p> : !menu.length ? <div><p>No recipe matches the current catalog and filters.</p>
      {(toGo || noveltyMax < 6) && <button className="sw-act" onClick={() => { setToGo(false); setNovelty(6) }}>Explore full café menu</button>}</div> : <div className="cafe-columns">
      {['Sweet','Savory'].map(taste => <section key={taste}>
        <h3>{taste}</h3>
        {menu.filter(r=>r.taste === taste).map(r => <CafeDish key={r.id} recipe={r} allIng={allIng} current={current} rate={(key,value)=>rateSnack(person.id,key,value)} use={()=>apply(r)} />)}
        {!menu.some(r=>r.taste === taste) && <p>No {taste.toLowerCase()} recipe matches your ingredients and filters.</p>}
      </section>)}
    </div>}
  </div>
}
