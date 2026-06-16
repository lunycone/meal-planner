import { useState } from 'react'
import { MENU, SHOPPING } from '../../data/menu'
import { fmt } from '../../engine/calc'
import useStore from '../../store/useStore'

// ─── Batch edit form ───────────────────────────────────────────────────────

function BatchEditForm({ batchId, batch, onClose }) {
  const setBatchOverride   = useStore(s => s.setBatchOverride)
  const resetBatchOverride = useStore(s => s.resetBatchOverride)

  const [protein,   setProtein]   = useState(batch.protein  ?? '')
  const [combo,     setCombo]     = useState(batch.combo    ?? '')
  const [kcalEst,   setKcalEst]   = useState(String(batch.kcalEst ?? ''))
  const [costEst,   setCostEst]   = useState(String(batch.costEst ?? ''))
  const [batchNote, setBatchNote] = useState(batch.batchNote ?? batch.note ?? '')
  const [itemsText, setItemsText] = useState(
    (batch.batchItems ?? []).join('\n')
  )

  function save() {
    const data = {
      protein,
      combo,
      kcalEst:   parseFloat(kcalEst)  || batch.kcalEst,
      costEst:   parseFloat(costEst)  || batch.costEst,
      batchNote,
    }
    if (batch.batchItems !== undefined) {
      data.batchItems = itemsText.split('\n').map(s => s.trim()).filter(Boolean)
    }
    if (batch.note !== undefined) data.note = batchNote
    setBatchOverride(batchId, data)
    onClose()
  }

  return (
    <div style={{ marginTop: 12, padding: '12px', background: 'var(--warn-bg)', border: '1px solid #ecdcc4', borderRadius: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <div className="form-field" style={{ flex: 2 }}>
          <label>Proteína</label>
          <input className="form-input" value={protein} onChange={e => setProtein(e.target.value)} />
        </div>
        <div className="form-field" style={{ flex: 3 }}>
          <label>Combinación / acompañante</label>
          <input className="form-input" value={combo} onChange={e => setCombo(e.target.value)} />
        </div>
        <div className="form-field" style={{ width: 72 }}>
          <label>kcal est.</label>
          <input className="form-input" type="number" value={kcalEst} onChange={e => setKcalEst(e.target.value)} />
        </div>
        <div className="form-field" style={{ width: 72 }}>
          <label>$ est.</label>
          <input className="form-input" type="number" step="0.01" value={costEst} onChange={e => setCostEst(e.target.value)} />
        </div>
      </div>
      <div className="form-field" style={{ marginBottom: 8 }}>
        <label>Nota</label>
        <input className="form-input" style={{ width: '100%' }} value={batchNote} onChange={e => setBatchNote(e.target.value)} />
      </div>
      {batch.batchItems !== undefined && (
        <div className="form-field" style={{ marginBottom: 8 }}>
          <label>Lista batch (una línea por ítem)</label>
          <textarea
            className="form-input"
            style={{ width: '100%', height: 90, resize: 'vertical', lineHeight: 1.5 }}
            value={itemsText}
            onChange={e => setItemsText(e.target.value)}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn-primary" onClick={save}>Guardar</button>
        <button className="btn-ghost"   onClick={onClose}>Cancelar</button>
        <button className="btn-ghost"   style={{ marginLeft: 'auto', fontSize: '0.72rem' }} onClick={() => { resetBatchOverride(batchId); onClose() }}>↺ Original</button>
      </div>
    </div>
  )
}

// ─── Batch block ───────────────────────────────────────────────────────────

function BatchBlock({ batchId, batch, isSpecial }) {
  const setBatchOverride = useStore(s => s.setBatchOverride)
  const deleteBatch      = useStore(s => s.deleteBatch)
  const overrides        = useStore(s => s.batchOverrides)
  const isModified       = !!overrides[batchId]

  const [listOpen,    setListOpen]    = useState(false)
  const [editing,     setEditing]     = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)

  return (
    <div className={`batch-block${isSpecial ? ' special' : ''}${(editing || confirmDel) ? ' is-active' : ''}`}>
      {/* header row */}
      <div className="batch-top">
        <span className={`batch-day-label${isSpecial ? ' special-day' : ''}`}>
          {isSpecial ? 'Domingo · día especial' : `Batch ${batch.day}`}
          {isModified && <span className="badge badge-modified" style={{ marginLeft: 6 }}>editado</span>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isSpecial && <span className="batch-covers">{batch.covers}</span>}
          {isSpecial  && <span className="batch-covers">1 ración · recién hecho</span>}
          <span className="batch-actions">
            <button
              onClick={() => { setEditing(e => !e); setConfirmDel(false) }}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', padding: '0 2px' }}
              title="Editar"
            >✎</button>
            {!confirmDel
              ? <button onClick={() => setConfirmDel(true)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.76rem', padding: '0 2px' }}>✕</button>
              : <>
                  <span style={{ fontSize: '0.72rem', color: 'var(--warn-ink)' }}>¿Ocultar?</span>
                  <button className="btn-danger" style={{ padding: '1px 7px', fontSize: '0.7rem' }} onClick={() => deleteBatch(batchId)}>Sí</button>
                  <button className="btn-ghost"  style={{ padding: '1px 7px', fontSize: '0.7rem' }} onClick={() => setConfirmDel(false)}>No</button>
                </>
            }
          </span>
        </span>
      </div>

      <div className="batch-title">{batch.protein}</div>
      <div className="batch-combo">{batch.combo}</div>

      <div className="batch-stats">
        <span className="bstat">~{fmt(batch.costEst)}/plato</span>
        <span className="bstat kc">~{batch.kcalEst} kcal</span>
        {isSpecial
          ? <span className="bstat special">no batch</span>
          : <span className="bstat">{batch.days} días</span>
        }
      </div>

      <div className="batch-note">{batch.batchNote ?? batch.note}</div>

      {!isSpecial && batch.batchItems && (
        <>
          <button className="btn-pill" onClick={() => setListOpen(o => !o)} style={{ marginTop: 2 }}>
            {listOpen ? 'cerrar ▴' : 'ver lista batch ▾'}
          </button>
          <ul className={`batch-items-list${listOpen ? ' open' : ''}`}>
            {(batch.batchItems ?? []).map((item, i) => {
              const isFresh = item.includes('al momento') || item.includes('→')
              return <li key={i} className={isFresh ? 'fresh' : ''}>{item}</li>
            })}
          </ul>
        </>
      )}

      {editing && (
        <BatchEditForm batchId={batchId} batch={batch} onClose={() => setEditing(false)} />
      )}
    </div>
  )
}

// ─── Week card ─────────────────────────────────────────────────────────────

function WeekCard({ week, weekIdx }) {
  const batchOverrides = useStore(s => s.batchOverrides)
  const deletedBatches = useStore(s => s.deletedBatches)
  const restoreBatch   = useStore(s => s.restoreBatch)

  const specialId = `w${weekIdx}-special`
  const specialDeleted = deletedBatches.includes(specialId)
  const specialBatch   = week.sundaySpecial
    ? { ...week.sundaySpecial, ...batchOverrides[specialId] }
    : null

  return (
    <div className="week-card">
      <div className="week-header">
        <h3>{week.label}</h3>
        <span className="wdays">7 días · {week.sundaySpecial ? '1 día especial + ' : ''}2 batches</span>
      </div>

      {specialBatch && !specialDeleted && (
        <BatchBlock batchId={specialId} batch={specialBatch} isSpecial />
      )}
      {specialBatch && specialDeleted && (
        <div style={{ padding: '8px 12px', fontSize: '0.74rem', color: 'var(--muted)' }}>
          Día especial oculto —{' '}
          <button className="btn-ghost" style={{ fontSize: '0.72rem' }} onClick={() => restoreBatch(specialId)}>↺ Restaurar</button>
        </div>
      )}

      {week.batches.map((batch, bi) => {
        const batchId  = `w${weekIdx}-b${bi}`
        const merged   = { ...batch, ...batchOverrides[batchId] }
        const isDeleted = deletedBatches.includes(batchId)
        if (isDeleted) {
          return (
            <div key={bi} style={{ padding: '8px 12px', fontSize: '0.74rem', color: 'var(--muted)', borderTop: '1px solid var(--line-soft)' }}>
              Batch {batch.day} oculto —{' '}
              <button className="btn-ghost" style={{ fontSize: '0.72rem' }} onClick={() => restoreBatch(batchId)}>↺ Restaurar</button>
            </div>
          )
        }
        return <BatchBlock key={bi} batchId={batchId} batch={merged} isSpecial={false} />
      })}
    </div>
  )
}

// ─── Batch group (2 visual blocks per week) ───────────────────────────────

function BatchGroup({ protein, combo, cookDay, eatDays, accent, kcalEst, costEst }) {
  const allDays = [cookDay, ...eatDays]
  return (
    <div style={{ flex: eatDays.length === 3 ? '3' : '4', minWidth: 0 }}>
      {/* Group header band */}
      <div style={{
        background: accent,
        borderRadius: '0.6rem 0.6rem 0 0',
        padding: '0.5rem 0.75rem',
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.5rem',
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#5a4a3a' }}>
          {protein}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#7a6a5a' }}>·</span>
        <span style={{ fontSize: '0.7rem', color: '#7a6a5a' }}>{combo}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#7a6a5a' }}>
          ~{costEst ? `$${costEst}` : '—'} · {kcalEst ? `${kcalEst} kcal` : '—'}
        </span>
      </div>

      {/* Day cells */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${allDays.length}, 1fr)`,
        border: `1.5px solid ${accent}`,
        borderTop: 'none',
        borderRadius: '0 0 0.6rem 0.6rem',
        overflow: 'hidden',
      }}>
        {allDays.map((day, i) => {
          const isCookDay = i === 0
          return (
            <div key={day} style={{
              padding: '0.6rem 0.5rem',
              textAlign: 'center',
              borderLeft: i > 0 ? `1px solid ${accent}` : 'none',
              background: isCookDay ? accent : 'transparent',
            }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: isCookDay ? 700 : 500,
                color: isCookDay ? '#5a4a3a' : 'var(--muted)',
              }}>
                {day}
              </div>
              {isCookDay && (
                <div style={{ fontSize: '0.58rem', color: '#8b7355', marginTop: '0.2rem' }}>
                  🔥 batch
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Special day pill ──────────────────────────────────────────────────────

function SpecialDayPill({ protein, combo }) {
  return (
    <div style={{ width: '130px', flexShrink: 0 }}>
      <div style={{
        background: 'var(--jessica-bg)',
        borderRadius: '0.6rem 0.6rem 0 0',
        padding: '0.5rem 0.75rem',
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7a4a4a' }}>★ Especial</span>
      </div>
      <div style={{
        border: '1.5px solid #d4b8b8',
        borderTop: 'none',
        borderRadius: '0 0 0.6rem 0.6rem',
        padding: '0.6rem 0.5rem',
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7a4a4a', textAlign: 'center' }}>Dom</div>
        <div style={{ fontSize: '0.65rem', color: '#9a6a6a', textAlign: 'center', marginTop: '0.2rem' }}>1 ración</div>
        <div style={{ fontSize: '0.65rem', color: '#9a6a6a', textAlign: 'center', marginTop: '0.3rem', fontStyle: 'italic' }}>
          {protein}
        </div>
      </div>
    </div>
  )
}

// ─── Calendar view (grouped layout) ───────────────────────────────────────

function CalendarView({ week, weekIdx }) {
  const batchOverrides = useStore(s => s.batchOverrides)
  const deletedBatches = useStore(s => s.deletedBatches)

  const b0 = { ...week.batches[0], ...batchOverrides[`w${weekIdx}-b0`] }
  const b1 = { ...week.batches[1], ...batchOverrides[`w${weekIdx}-b1`] }
  const ss = week.sundaySpecial
    ? { ...week.sundaySpecial, ...batchOverrides[`w${weekIdx}-special`] }
    : null
  const ssDeleted = deletedBatches.includes(`w${weekIdx}-special`)
  const hasSpecial = ss && !ssDeleted

  // Batch 0 covers: dom (unless special) + lun + mar + mié
  const b0CookDay = hasSpecial ? 'Lun' : 'Dom'
  const b0EatDays = hasSpecial ? ['Mar', 'Mié', 'Jue'] : ['Lun', 'Mar', 'Mié']

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
      {/* Special Sunday pill */}
      {hasSpecial && <SpecialDayPill protein={ss.protein} combo={ss.combo} />}

      {/* Batch 0 block */}
      <BatchGroup
        protein={b0.protein}
        combo={b0.combo}
        cookDay={b0CookDay}
        eatDays={b0EatDays}
        accent="#ede3d5"
        kcalEst={b0.kcalEst}
        costEst={b0.costEst}
      />

      {/* Batch 1 block */}
      <BatchGroup
        protein={b1.protein}
        combo={b1.combo}
        cookDay="Jue"
        eatDays={['Vie', 'Sáb', hasSpecial ? null : 'Dom'].filter(Boolean)}
        accent="#dce8d8"
        kcalEst={b1.kcalEst}
        costEst={b1.costEst}
      />
    </div>
  )
}

// ─── Main tab ──────────────────────────────────────────────────────────────

export default function MenuTab() {
  return (
    <div>
      <div className="menu-legend">
        <span><span className="legend-dot" style={{ background: '#f0e8d8' }} /> Batch domingo</span>
        <span><span className="legend-dot" style={{ background: '#e4eedc' }} /> Batch jueves</span>
        <span><span className="legend-dot" style={{ background: 'var(--jessica-bg)' }} /> Día especial</span>
        <span style={{ color: 'var(--brown)' }}>↗ al momento</span>
        <span>Target: 1000–1100 kcal/comida</span>
        <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>✎ editar batch · ✕ ocultar</span>
      </div>

      <div className="menu-grid">
        {MENU.map((week, i) => <WeekCard key={i} week={week} weekIdx={i} />)}
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          Vista día a día
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Cobertura de cada batch · beige = batch domingo · verde = batch jueves
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {MENU.map((week, i) => (
            <div key={i}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--muted)',
                marginBottom: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.07em'
              }}>
                {week.label}
              </div>
              <CalendarView week={week} weekIdx={i} />
            </div>
          ))}
        </div>
      </div>

      <div className="section-label" style={{ margin: '1.5rem 0 0.25rem' }}>Lista de compra — mes completo (2 personas)</div>
      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>Cantidades orientativas.</p>
      <div className="shopping-grid">
        {SHOPPING.map((s, i) => (
          <div key={i} className="shopping-card">
            <div className="sc-cat">{s.cat}</div>
            <ul>{s.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
          </div>
        ))}
      </div>
    </div>
  )
}
