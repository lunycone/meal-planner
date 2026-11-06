import { useEffect, useState } from 'react'
import { syncError } from '../store/storage'
import useStore from '../store/useStore'

export default function SyncStatus({ errorsOnly = false }) {
  const [error, setError] = useState(syncError)
  useEffect(() => {
    const refresh = () => setError(syncError)
    refresh()
    window.addEventListener('syncError', refresh)
    window.addEventListener('syncSuccess', refresh)
    return () => {
      window.removeEventListener('syncError', refresh)
      window.removeEventListener('syncSuccess', refresh)
    }
  }, [])
  function download() {
    const { partialize, version } = useStore.persist.getOptions()
    const backup = JSON.stringify({ version, state: partialize(useStore.getState()) })
    const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'meal-planner-local-copy.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  if (error) return <div role="alert" className="mp-chip"><span>{error.message || 'Could not sync changes.'}</span><button type="button" onClick={download}>Download local copy</button></div>
  if (errorsOnly) return null
  return <span title="Synced" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
}
