import { useEffect, useState } from 'react'

export default function SyncStatus() {
  const [status, setStatus] = useState('synced') // synced, error
  const [errorMsg, setErrorMsg] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handleSyncError = (e) => {
      setStatus('error')
      setErrorMsg(e.detail?.message || 'No se pudo sincronizar')
      console.error('[SyncStatus] Sync error:', e.detail)
    }

    const handleSyncSuccess = () => {
      setStatus('synced')
      setErrorMsg(null)
    }

    window.addEventListener('syncError', handleSyncError)
    window.addEventListener('syncSuccess', handleSyncSuccess)

    return () => {
      window.removeEventListener('syncError', handleSyncError)
      window.removeEventListener('syncSuccess', handleSyncSuccess)
    }
  }, [])

  const statusConfig = {
    synced: {
      color: '#22c55e',
      label: 'Sincronizado',
    },
    error: {
      color: '#ef4444',
      label: 'Error de sincronización',
    }
  }

  const config = statusConfig[status]

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: config.color,
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        title={config.label}
      />

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            paddingTop: '80px',
            paddingRight: '20px',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--t-tinted-bg)',
              border: `2px solid ${status === 'error' ? '#ef4444' : '#22c55e'}`,
              borderRadius: 'var(--t-radius-lg)',
              padding: '1rem',
              width: '280px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: config.color,
                }}
              />
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--t-text)',
                }}
              >
                {config.label}
              </div>
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--t-text-soft)',
                lineHeight: 1.5,
              }}
            >
              {status === 'synced' ? (
                <>
                  <p>✓ Tus cambios están sincronizados con el servidor.</p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                    Los datos se guardan automáticamente cuando haces cambios.
                  </p>
                </>
              ) : (
                <>
                  <p>✗ Error al sincronizar: {errorMsg}</p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                    Verifica tu conexión a internet. Los cambios se guardarán localmente y se sincronizarán cuando regrese la conexión.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
