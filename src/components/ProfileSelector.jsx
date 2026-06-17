import useStore from '../store/useStore'

export default function ProfileSelector() {
  const profiles       = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const setActiveProfile = useStore(s => s.setActiveProfile)

  const today = new Date()
  const validProfiles = profiles.filter(p => !p.validoHasta || new Date(p.validoHasta) > today)

  const allItems = [
    { id: 'all', initial: 'T', name: 'Todos' },
    ...validProfiles,
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingRight: '0.5rem' }}>
      {allItems.map(p => {
        const isActive = activeProfileId === p.id
        return (
          <button
            key={p.id}
            onClick={() => setActiveProfile(p.id)}
            title={p.name}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: isActive ? '2px solid var(--t-accent)' : '1.5px solid var(--t-border)',
              background: isActive ? 'var(--t-accent)' : '#ffffff',
              color: isActive ? '#ffffff' : 'var(--t-text-soft)',
              fontSize: '0.7rem',
              fontWeight: 700,
              fontFamily: 'var(--t-font-ui)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.02em',
              padding: 0,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {p.initial}
          </button>
        )
      })}
    </div>
  )
}
