import { useEffect, useState } from 'react'

export default function SyncStatus() {
  const [status, setStatus] = useState('synced') // synced, error

  useEffect(() => {
    const handleSyncError = () => {
      setStatus('error')
    }

    const handleSyncSuccess = () => {
      setStatus('synced')
    }

    window.addEventListener('syncError', handleSyncError)
    window.addEventListener('syncSuccess', handleSyncSuccess)

    return () => {
      window.removeEventListener('syncError', handleSyncError)
      window.removeEventListener('syncSuccess', handleSyncSuccess)
    }
  }, [])

  const color = status === 'synced' ? '#22c55e' : '#ef4444'
  const title = status === 'synced' ? 'Sincronizado' : 'Error de sincronización'

  return (
    <div
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
      title={title}
    />
  )
}
