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

// ─── Calendar strip ────────────────────────────────────────────────────────

function CalendarStrip({ week, weekIdx }) {
  const batchOverrides = useStore(s => s.batchOverrides)
  const deletedBatches = useStore(s => s.deletedBatches)

  const b0  = { ...week.batches[0], ...batchOverrides[`w${weekIdx}-b0`] }
  const b1  = { ...week.batches[1], ...batchOverrides[`w${weekIdx}-b1`] }
  const ss  = week.sundaySpecial
    ? { ...week.sundaySpecial, ...batchOverrides[`w${weekIdx}-special`] }
    : null
  const ssDeleted = deletedBatches.includes(`w${weekIdx}-special`)

  const days = [
    { d: ss && !ssDeleted ? 'Dom ★' : 'Dom ↺', type: ss && !ssDeleted ? 'special-day' : 'batch-sun', prot: ss && !ssDeleted ? ss.protein : b0.protein, sub: ss && !ssDeleted ? ss.combo?.split(' ')[0] : b0.combo?.split(' ')[0] },
    { d: 'Lun', type: 'eat-sun', prot: b0.protein, sub: b0.combo?.split(' ')[0] },
    { d: 'Mar', type: 'eat-sun', prot: b0.protein, sub: b0.combo?.split(' ')[0] },
    { d: 'Mié', type: 'eat-sun', prot: b0.protein, sub: b0.combo?.split(' ')[0] },
    { d: 'Jue ↺', type: 'batch-thu', prot: b1.protein, sub: b1.combo?.split(' ')[0] },
    { d: 'Vie', type: 'eat-thu', prot: b1.protein, sub: b1.combo?.split(' ')[0] },
    { d: 'Sáb', type: 'eat-thu', prot: b1.protein, sub: b1.combo?.split(' ')[0] },
  ]

  return (
    <div className="cal-strip">
      {days.map((d, i) => (
        <div key={i} className={`cal-day ${d.type}`}>
          <div className="cdn">{d.d}</div>
          <div className="cdp">{d.prot}</div>
          <div className="cds">{d.sub}</div>
        </div>
      ))}
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

      <div className="section-label" style={{ marginBottom: '0.5rem' }}>Vista día a día — mes completo</div>
      {MENU.map((week, i) => (
        <div key={i}>
          <div className="section-label" style={{ margin: '1rem 0 0.4rem', color: 'var(--brown)' }}>{week.label}</div>
          <CalendarStrip week={week} weekIdx={i} />
        </div>
      ))}

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
