import { useMemo, useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { BAKING_TYPES, BAKING_SUGARS, bakingIdeas, bakingPortion, bakingSettings } from '../../engine/baking'
import { stockAvailable } from '../../lib/needs'
import { fmtAmount } from '../../lib/packs'
import { fmtPortion } from '../../engine/calc'
import { fmtMoney } from '../../lib/mealplan'
import Overlay from '../ui/Overlay'
import Icon from '../ui/Icon'
import Segmented from '../ui/Segmented'

const SWEETNESS = [{ value: 'light', label: 'Lightly sweet' }, { value: 'classic', label: 'Sweeter' }]
const BATCHES = [{ value: 1, label: 'Small batch' }, { value: 2, label: 'Double batch' }]

export function BakingRecipe({ recipe, allIng }) {
  return <div className="sw-recipe">
    <strong>Batch recipe · {recipe.pieces} portions</strong>
    <ul style={{ margin: 0, paddingLeft: 18, columns: '2 150px' }}>
      {recipe.items.map(({ k, p }) => <li key={k}>{allIng[k]?.name ?? k} · {fmtPortion(p) === '—' ? (recipe.batches === 2 ? '2 pinches or dashes' : 'a pinch or dash') : fmtPortion(p)}</li>)}
    </ul>
    <ol>{recipe.steps.map(step => <li key={step}>{step}</li>)}</ol>
  </div>
}

export default function BakingSheet({ onClose }) {
  const allIng = useStore(selectAllIng)
  const allCombos = useStore(selectAllCombos)
  const stock = useStore(s => s.stock)
  const addCustomCombo = useStore(s => s.addCustomCombo)
  const preferences = useStore(s => s.bakingSettings)
  const setBakingSetting = useStore(s => s.setBakingSetting)
  const { type, sugar, sweetness, batches } = bakingSettings(preferences)
  const [seen, setSeen] = useState([])
  const available = useMemo(() => stockAvailable(stock, allIng), [stock, allIng])
  const ideas = useMemo(() => bakingIdeas({ allIng, stock: available, type, sugar, sweetness, batches }),
    [allIng, available, type, sugar, sweetness, batches])
  const remaining = ideas.filter(idea => !seen.includes(idea.id))
  const previousFormula = ideas.find(idea => idea.id === seen.at(-1))?.formula
  const recipe = remaining.find(idea => idea.formula !== previousFormula) ?? remaining[0] ?? ideas[0]
  const saved = recipe && Object.values(allCombos).some(dish => dish.bakingRecipe?.id === recipe.id)
  const change = key => value => { setBakingSetting(key, value); setSeen([]) }

  function save() {
    if (!recipe || saved) return
    const { id, pieces, items, steps } = recipe
    addCustomCombo({
      name: recipe.name, meals: ['merienda'], items: bakingPortion(recipe),
      bakingRecipe: { id, pieces, items, steps, batches },
    })
  }

  return <Overlay onClose={onClose}>
    <div className="mp-sheet mw-sheet" style={{ maxWidth: 720, maxHeight: 'calc(100dvh - 32px)' }}
      onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Baking">
      <div className="mp-sheet-head">
        <div>
          <strong style={{ fontSize: 21 }}>Baking</strong>
          <div className="mp-muted">Matched to your pantry and prep effort. No sweeteners.</div>
        </div>
        <button type="button" className="mp-icon-btn" aria-label="Close" onClick={onClose}><Icon name="x" size={13} /></button>
      </div>
      <div className="sw-controls">
        <Segmented label="What to bake" value={type} onChange={change('type')} options={BAKING_TYPES} />
        <Segmented label="Sugar" value={sugar} onChange={change('sugar')} options={BAKING_SUGARS} />
        {sugar !== 'none' && <Segmented label="Sweetness" value={sweetness} onChange={change('sweetness')} options={SWEETNESS} />}
        <Segmented label="Batch size" value={batches} onChange={change('batches')} options={BATCHES} />
      </div>
      <div className="mp-sheet-body" aria-live="polite">
        {recipe ? <>
          <h2 style={{ margin: '0 0 4px', fontSize: 21 }}>{recipe.name}</h2>
          <p className="mp-muted" style={{ margin: '0 0 12px' }}>
            {recipe.texture} · ~{recipe.minutes} min before cooling{batches === 2 ? ' (allowing for separate oven batches)' : ''} · {Math.round(recipe.kcal)} kcal per portion
            {' · '}{recipe.sugarGrams ? `${+(recipe.sugarGrams / recipe.pieces).toFixed(1)} g added sugar per portion` : 'No added sugar'}
          </p>
          <p className="mp-muted" style={{ margin: '0 0 12px' }}>{recipe.reason}</p>
          <BakingRecipe recipe={recipe} allIng={allIng} />
          <p className="mp-muted" style={{ marginBottom: 0 }}>
            {recipe.missing.length ? `Check or buy: ${recipe.missing.map(({ k, dim, shortfall }) => dim && shortfall > 0 ? `${fmtAmount(shortfall, dim)} ${allIng[k].name}` : allIng[k].name).join(', ')}.` : 'Everything is recorded in your pantry.'}
            {' '}{recipe.unpriced.length ? (recipe.cost > 0 ? `${fmtMoney(recipe.cost)} for priced ingredients.` : 'Ingredient prices unavailable.') : `${fmtMoney(recipe.cost)} per batch.`}
          </p>
        </> : <div className="mp-empty">No recipe fits these settings and your ingredient list. Try another bake or sugar option.</div>}
      </div>
      <div className="mp-sheet-foot" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="mp-btn mp-btn-glass" disabled={ideas.length < 2} onClick={() => {
          setSeen(seen.length + 1 >= ideas.length ? [] : [...seen, recipe.id])
        }}><Icon name="repeat" size={14} />New idea</button>
        <button type="button" className="mp-btn mp-btn-dark" disabled={!recipe || saved} onClick={save}>
          {saved ? 'Saved to Dishes' : 'Save to Dishes'}
        </button>
      </div>
    </div>
  </Overlay>
}
