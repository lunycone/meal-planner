import { useEffect, useState } from 'react'

export default function SyncStatus() {
  const [status, setStatus] = useState('synced') // synced, error
  // 5 sep 2026 -- antes el punto solo tenia un titulo generico ("Error de
  // sincronizacion"), asi que un fallo real de guardado (permisos, tabla mal
  // configurada, etc.) pasaba desapercibido salvo que alguien abriera la
  // consola del navegador. Ahora guarda el mensaje real que devuelve
  // Supabase y lo pone en el title -- pasa el raton por encima del punto
  // rojo para verlo, sin abrir devtools.
  const [errorDetail, setErrorDetail] = useState(null)

  useEffect(() => {
    const handleSyncError = (e) => {
      setStatus('error')
      setErrorDetail(e.detail?.message || e.detail?.hint || e.detail?.code || null)
    }

    const handleSyncSuccess = () => {
      setStatus('synced')
      setErrorDetail(null)
    }

    window.addEventListener('syncError', handleSyncError)
    window.addEventListener('syncSuccess', handleSyncSuccess)

    return () => {
      window.removeEventListener('syncError', handleSyncError)
      window.removeEventListener('syncSuccess', handleSyncSuccess)
    }
  }, [])

  const color = status === 'synced' ? '#22c55e' : '#ef4444'
  const title = status === 'synced'
    ? 'Sincronizado'
    : `Error de sincronización — los cambios NO se han guardado${errorDetail ? `: ${errorDetail}` : ''}`

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
