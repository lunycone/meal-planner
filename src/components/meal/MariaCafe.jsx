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
        <img src={`/cafe/${recipe.id}.webp`} alt="" width="640" height="400" loading="lazy" />
        <span className="cafe-dish-copy"><span className="cafe-kind">{recipe.taste}</span><strong>{name}</strong><span className="cafe-description">{description}</span>
          <small>{recipe.prep ?? recipe.minutes + ' min'} · {macros.hasEst && '≈'}{fmtMoney(macros.cost)}</small><span className="cafe-view-recipe">View recipe <span aria-hidden="true">↗</span></span></span>
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
  dayIndex, setDayIndex, onApplied, onClose }) {
  const [larger, setLarger] = useState(false)
  const [taste, setTaste] = useState('All')
  const [toGo, setToGo] = useState(false)
  const [noveltyMax, setNovelty] = useState(99)
  const applyCafeSnack = useStore(s => s.applyCafeSnack)
  const rateSnack = useStore(s => s.rateSnack)
  const people = activeProfilesOn(profiles, addDays(monday,dayIndex))
  const person = people.find(p => p.id === 'maria')
  const menu = useMemo(() => person ? cafeMenu({ person, dayIndex, week, allIng, allCombos, tried, stock, openPacks,
    feedback, noveltyMax, larger, toGo }) : [], [person, dayIndex, week, allIng, allCombos, tried, stock, openPacks, feedback, noveltyMax, larger, toGo])
  const sweet = menu.filter(r => r.taste === 'Sweet')
  const savory = menu.filter(r => r.taste === 'Savory')
  const visible = taste === 'Sweet' ? sweet : taste === 'Savory' ? savory :
    Array.from({ length: Math.max(sweet.length, savory.length) }, (_, i) => [sweet[i], savory[i]]).flat().filter(Boolean)
  const slotKey = DAY_KEYS[dayIndex] + '-merienda'
  const current = person && slotForPerson(week[slotKey],person.id)
  function apply(r) {
    applyCafeSnack(wk, slotKey, person.id, { id:r.id, name:r.name + ' · ' + person.name, items:r.items, size:larger ? 'large' : 'regular' }, people.map(p=>p.id))
    onApplied?.(r.name + ' added for ' + person.name + ' · ' + DAY_SHORT[dayIndex])
    onClose()
  }
  return <div className="mp-sheet-body cafe-menu">
    <div className="cafe-controls">
      <div className="cafe-day-row">
        <span className="cafe-control-label">Plan for</span>
        <div className="cafe-days" role="group" aria-label="Snack day">
          {DAY_SHORT.map((d,i)=><button key={d} type="button" aria-pressed={dayIndex === i} onClick={()=>setDayIndex(i)}>
            <span>{d}</span><strong>{addDays(monday,i).getDate()}</strong>
          </button>)}
        </div>
      </div>
      <div className="cafe-options">
        <div className="cafe-serving" role="group" aria-label="Serving">
          {[false,true].map(value=><button key={String(value)} type="button" aria-pressed={larger === value} onClick={()=>setLarger(value)}>{value ? 'More filling' : 'Regular'}</button>)}
        </div>
        <button type="button" className="cafe-takeaway" aria-pressed={toGo} onClick={()=>setToGo(v=>!v)}><span aria-hidden="true">↗</span> To go {toGo && '✓'}</button>
        <details className="cafe-ingredient-filter">
          <summary>{noveltyMax === 0 ? 'Already tried' : noveltyMax === 1 ? 'Up to 1 new' : 'Ingredient filters'} <span aria-hidden="true">⌄</span></summary>
          <div className="cafe-filter-options" role="group" aria-label="Ingredient familiarity">
            {[[99,'All recipes'],[1,'Up to 1 new'],[0,'Already tried']].map(([value,label])=>
              <button key={value} type="button" aria-pressed={noveltyMax===value} onClick={()=>setNovelty(value)}>{label}</button>)}
          </div>
        </details>
      </div>
    </div>
    <div className="cafe-browse" role="group" aria-label="Snack taste">
      {[['All',menu.length],['Sweet',sweet.length],['Savory',savory.length]].map(([label,count])=>
        <button key={label} type="button" aria-pressed={taste===label} onClick={()=>setTaste(label)}>{label}<span>{count}</span></button>)}
    </div>
    {current && <p className="cafe-current">{DAY_SHORT[dayIndex]} · María already has {allCombos[current.recipeKey]?.name ?? 'a snack'} planned.</p>}
    {!person ? <p>María’s profile is inactive on this date.</p> : !visible.length ? <div className="cafe-empty">
      <p>No recipe matches these filters and your ingredient catalog.</p>
      {(toGo || noveltyMax < 99 || taste !== 'All') && <button className="mp-btn mp-btn-glass" onClick={() => { setToGo(false); setNovelty(99); setTaste('All') }}>Show all recipes</button>}
    </div> : <div className="cafe-grid">
      {visible.map(r => <CafeDish key={r.id} recipe={r} allIng={allIng} current={current} rate={(key,value)=>rateSnack(person.id,key,value)} use={()=>apply(r)} />)}
    </div>}
  </div>
}
