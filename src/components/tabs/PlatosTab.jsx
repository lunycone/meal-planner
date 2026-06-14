import { useState } from 'react'
import useStore, { selectAllIng, selectAllCombos } from '../../store/useStore'
import { PROTEIN, COOK_FAT } from '../../data/proteins'
import { PREP, COMBO_SETS } from '../../data/combos'
import {
  proteinCost, proteinKcal, comboAgg, prepAgg,
  fmt, kfmt, fmtPortion, ingCost, ingKcal,
} from '../../engine/calc'

function getCombos(pr) {
  return COMBO_SETS[pr.combos] ?? COMBO_SETS.shared
}

export default function PlatosTab() {
  const allIng = useStore(selectAllIng)
  const [selProt, setSelProt] = useState(null)
  const [selPrep, setSelPrep] = useState(null)
  const [useAlt, setUseAlt]   = useState(false)
  const [sortByPrice, setSortByPrice] = useState(false)

  function selectProtein(key) {
    setSelProt(key)
    setUseAlt(false)
    const pr = PROTEIN[key]
    setSelPrep(pr.preps?.length ? pr.preps[0] : null)
  }

  return (
    <div className="platos-layout">
      {/* ── Sidebar ── */}
      <div>
        <div className="section-label">Proteínas</div>
        {Object.entries(PROTEIN).map(([key, pr]) => {
          const cost = proteinCost(pr)
          const kcal = proteinKcal(pr)
          return (
            <div
              key={key}
              className={`protein-item${selProt === key ? ' active' : ''}`}
              onClick={() => selectProtein(key)}
            >
              <div className="bullet" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="pname">{pr.name}</span>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                  {(pr.meals ?? ['comida']).map(m => (
                    <span key={m} className={`meal-tag meal-tag-${m}`}>{m}</span>
                  ))}
                </div>
              </div>
              <span className="pprice">{fmt(cost)}<br />{kfmt(kcal)}</span>
            </div>
          )
        })}
      </div>

      {/* ── Calc Panel ── */}
      <div>
        {!selProt ? (
          <div className="empty-state">Selecciona una proteína para calcular precio y kcal de cada plato.</div>
        ) : (
          <CalcPanel
            protKey={selProt}
            selPrep={selPrep}
            setSelPrep={setSelPrep}
            useAlt={useAlt}
            setUseAlt={setUseAlt}
            sortByPrice={sortByPrice}
            setSortByPrice={setSortByPrice}
            allIng={allIng}
          />
        )}
      </div>
    </div>
  )
}

function CalcPanel({ protKey, selPrep, setSelPrep, useAlt, setUseAlt, sortByPrice, setSortByPrice, allIng }) {
  const allCombos = useStore(selectAllCombos)
  const pr = PROTEIN[protKey]
  const pCost = proteinCost(pr, useAlt)
  const pKcal = proteinKcal(pr, useAlt)

  const prepData = selPrep ? PREP[selPrep] : null
  const { cost: prepCost, kcal: prepKcal } = prepData ? prepAgg(prepData, allIng) : { cost: 0, kcal: 0 }

  const fatLines = pr.cookFat === 235 ? COOK_FAT.cooked : COOK_FAT.drizzle
  const fatKcal  = fatLines.reduce((a, f) => a + f.kc, 0)

  const combos = getCombos(pr)
  let rows = combos.map(ck => {
    const combo = allCombos[ck]
    if (!combo) return null
    const agg = comboAgg(combo, allIng)
    return {
      key: ck, combo, agg,
      total:     pCost + prepCost + agg.cost,
      totalKcal: pKcal + prepKcal + agg.kcal + fatKcal,
    }
  }).filter(Boolean)

  if (sortByPrice) rows = [...rows].sort((a, b) => a.total - b.total)

  const complete = rows.filter(r => !r.agg.incomplete)
  const minTotal = Math.min(...complete.map(r => r.total))
  const maxTotal = Math.max(...complete.map(r => r.total))
  const minKcal  = Math.min(...complete.map(r => r.totalKcal))
  const maxKcal  = Math.max(...complete.map(r => r.totalKcal))

  const rlabel = pr.ration.label ?? (pr.ration.grams ? `ración ${pr.ration.grams}g` : `${pr.ration.units} uds`)

  return (
    <>
      <div className="calc-head">
        <h2>{pr.name}</h2>
        <span className="ration-note">{rlabel} · {fmt(pCost)} · {kfmt(pKcal)}</span>
      </div>

      {pr.altRation && (
        <div className="prep-row">
          <div className="section-label">Lata</div>
          <div className="prep-buttons">
            {[{ key: false, r: pr.ration }, { key: true, r: pr.altRation }].map(({ key: alt, r }) => (
              <button
                key={String(alt)}
                className={`prep-btn${useAlt === alt ? ' active' : ''}`}
                onClick={() => setUseAlt(alt)}
              >
                <span className="pb-name">{r.label}</span>
                <span className="pb-cost">{fmt(proteinCost(pr, alt))} · {kfmt(proteinKcal(pr, alt))}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pr.preps?.length > 0 && (
        <div className="prep-row">
          <div className="section-label">Preparación de la proteína</div>
          <div className="prep-buttons">
            {pr.preps.map(pk => {
              const { cost: c, kcal: k } = prepAgg(PREP[pk], allIng)
              return (
                <button
                  key={pk}
                  className={`prep-btn${selPrep === pk ? ' active' : ''}`}
                  onClick={() => setSelPrep(pk)}
                >
                  <span className="pb-name">{PREP[pk].name}</span>
                  <span className="pb-cost">+{fmt(c)} · +{kfmt(k)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="summary-bar">
        <div className="sum-stat"><span className="sl">Proteína</span><span className="sv">{fmt(pCost)} · {kfmt(pKcal)}</span></div>
        <div className="sum-divider" />
        <div className="sum-stat"><span className="sl">Prep</span><span className="sv">{selPrep ? `+${fmt(prepCost)} · +${kfmt(prepKcal)}` : '—'}</span></div>
        <div className="sum-divider" />
        <div className="sum-stat"><span className="sl">Grasa</span><span className="sv">+{kfmt(fatKcal)}</span></div>
        <div className="sum-divider" />
        <div className="sum-stat"><span className="sl">Precio</span><span className="sv">{fmt(minTotal)}–{fmt(maxTotal)}</span></div>
        <div className="sum-divider" />
        <div className="sum-stat"><span className="sl">kcal</span><span className="sv">{kfmt(minKcal)}–{kfmt(maxKcal)}</span></div>
      </div>

      <div className="oil-note">
        Grasa incluida: {pr.cookFat === 235
          ? 'grasa vaca/coco para cocinar (~115 kcal) + aceite de oliva por encima (~120 kcal)'
          : 'solo aceite de oliva por encima (~120 kcal) — no se cocina con grasa'}
      </div>

      {pr.sauce && (
        <div className="sauce-note">
          Salsa por encima (independiente): limón (+$0.50 · ~10 kcal) o alioli/sour cream (+~$0.28 · ~76 kcal)
        </div>
      )}

      <div className="controls">
        <span className="section-label" style={{ marginBottom: 0 }}>Platos ({rows.length})</span>
        <button className="btn-pill" onClick={() => setSortByPrice(s => !s)}>
          {sortByPrice ? 'orden original' : 'ordenar por precio ↑'}
        </button>
      </div>

      <div className="combo-list">
        {rows.map(r => (
          <ComboCard
            key={r.key}
            row={r}
            pr={pr}
            pCost={pCost}
            pKcal={pKcal}
            rlabel={rlabel}
            selPrep={selPrep}
            prepCost={prepCost}
            prepKcal={prepKcal}
            fatLines={fatLines}
            minTotal={minTotal}
            minKcal={minKcal}
            allIng={allIng}
          />
        ))}
      </div>

      <details className="assumptions">
        <summary>Supuestos de cálculo</summary>
        <div className="ass-body">
          <strong>Raciones (1 persona):</strong> carne picada <code>100g</code> · resto proteína <code>150g</code> · <code>3 huevos</code> · <code>1 lata</code> (sardinas/caballa/hígado bacalao).
          Legumbre <code>80g seco</code> · arroz <code>75g seco</code> · pasta <code>100g seco</code> · patata <code>200g</code> · aguacate <code>½ ud</code> · queso/feta <code>30g</code> · yogur/sour cream <code>40–50g</code>.
          <br /><br />
          <strong>kcal:</strong> legumbres/arroz/pasta van en <strong>peso seco</strong> — cocer solo añade agua. Proteínas en peso crudo. Aceite de cocinar incluido fijo (~235 kcal o ~120 kcal según proteína).
        </div>
      </details>
    </>
  )
}

function ComboCard({ row, pr, pCost, pKcal, rlabel, selPrep, prepCost, prepKcal, fatLines, minTotal, minKcal, allIng }) {
  const [open, setOpen] = useState(false)
  const { combo, agg, total, totalKcal } = row
  const isCheapest = !agg.incomplete && Math.abs(total - minTotal) < 0.001
  const isLight    = !agg.incomplete && Math.abs(totalKcal - minKcal) < 0.5

  return (
    <div className={`ccard${isCheapest ? ' cheapest' : ''}${open ? ' open' : ''}`}>
      <div className="ccard-head" onClick={() => setOpen(o => !o)}>
        <div className="cc-left">
          <span className="cc-name">
            {combo.name}
            {isCheapest && <span className="badge badge-cheap">más barato</span>}
            {isLight    && <span className="badge badge-light">menos kcal</span>}
            {agg.hasEst && <span className="badge badge-est">incl. estimados</span>}
            {agg.incomplete && <span className="badge badge-incomplete">receta incompleta</span>}
            {combo.jessica && <span className="badge badge-jessica">María</span>}
          </span>
          <span className="cc-sub">acompañante {agg.incomplete ? '~' : ''}{fmt(agg.cost)} · {kfmt(agg.kcal)}</span>
        </div>
        <div className="cc-right">
          <span className="cc-total">{agg.hasEst ? '~' : ''}{fmt(total)}</span>
          <span className="cc-kcal">{agg.hasEst ? '~' : ''}{kfmt(totalKcal)}</span>
        </div>
        <span className="cc-arrow">▾</span>
      </div>

      {open && (
        <div className="ccard-body">
          <table className="bd-table">
            <thead>
              <tr>
                <th className="thl">Ingrediente</th>
                <th>Ración</th>
                <th>Precio</th>
                <th>kcal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bd-section"><td colSpan={4}>Proteína</td></tr>
              <tr>
                <td className="bd-ing">{pr.name}</td>
                <td className="bd-port">{rlabel.replace('ración ', '')}</td>
                <td className="bd-cost">{fmt(pCost)}</td>
                <td className="bd-kc">{kfmt(pKcal)}</td>
              </tr>

              {selPrep && PREP[selPrep] && (
                <>
                  <tr className="bd-section"><td colSpan={4}>Prep · {PREP[selPrep].name}</td></tr>
                  {PREP[selPrep].items.map((it, i) => (
                    <tr key={i}>
                      <td className="bd-ing">{allIng[it.k]?.name ?? it.k}</td>
                      <td className="bd-port">{fmtPortion(it.p)}</td>
                      <td className="bd-cost">{fmt(ingCost(it.k, it.p, allIng))}</td>
                      <td className="bd-kc">{kfmt(ingKcal(it.k, it.p, allIng))}</td>
                    </tr>
                  ))}
                </>
              )}

              <tr className="bd-section"><td colSpan={4}>Acompañante</td></tr>
              {combo.items.map((it, i) => {
                const isEst = allIng[it.k]?.est
                return (
                  <tr key={i}>
                    <td className="bd-ing">
                      {allIng[it.k]?.name ?? it.k}
                      {isEst && <span style={{ color: 'var(--warn-ink)' }}> *</span>}
                    </td>
                    <td className="bd-port">{fmtPortion(it.p)}</td>
                    <td className="bd-cost">{fmt(ingCost(it.k, it.p, allIng))}</td>
                    <td className="bd-kc">{kfmt(ingKcal(it.k, it.p, allIng))}</td>
                  </tr>
                )
              })}

              <tr className="bd-section"><td colSpan={4}>Grasa de cocción</td></tr>
              {fatLines.map((f, i) => (
                <tr key={i}>
                  <td className="bd-ing">{f.name}</td>
                  <td className="bd-port">—</td>
                  <td className="bd-cost">$0.00</td>
                  <td className="bd-kc">{kfmt(f.kc)}</td>
                </tr>
              ))}

              <tr className="bd-total">
                <td>Total plato</td>
                <td />
                <td className="bd-cost">{agg.hasEst ? '~' : ''}{fmt(total)}</td>
                <td className="bd-kc">{agg.hasEst ? '~' : ''}{kfmt(totalKcal)}</td>
              </tr>
            </tbody>
          </table>

          {combo.note && <div className="bd-note">{combo.note}</div>}
          {agg.incomplete && (
            <div className="bd-incomplete">Solo cuenta la base (legumbre). Faltan ingredientes — precio y kcal reales serán mayores.</div>
          )}
        </div>
      )}
    </div>
  )
}
