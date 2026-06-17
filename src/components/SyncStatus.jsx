import { useEffect, useState } from 'react'

export default function SyncStatus() {
  const [status, setStatus] = useState('synced') // synced, error
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    const handleSyncError = (e) => {
      setStatus('error')
      setErrorMsg(e.detail?.message || 'Sync failed - check connection')
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
      color: '#22c55e',     // green
      label: 'Cambios guardados',
      tooltip: 'Tus cambios están sincronizados'
    },
    error: {
      color: '#ef4444',     // red
      label: 'Error de sincronización',
      tooltip: errorMsg || 'Verifica tu conexión a internet'
    }
  }

  const config = statusConfig[status]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: 'var(--t-tinted-bg)',
        border: `1px solid ${status === 'error' ? '#fecaca' : 'var(--t-border)'}`,
        borderRadius: 'var(--t-radius)',
        fontSize: '0.75rem',
        color: 'var(--t-text-soft)',
      }}
      title={config.tooltip}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: config.color,
          flexShrink: 0,
        }}
      />
      <span>{config.label}</span>
    </div>
  )
}
