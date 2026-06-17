import useStore from '../store/useStore'

export default function ProfileSelector() {
  const profiles = useStore(s => s.profiles)
  const activeProfileId = useStore(s => s.activeProfileId)
  const setActiveProfile = useStore(s => s.setActiveProfile)
  const activeProfile = useStore(s => s.getActiveProfile())

  // Filter out expired profiles
  const today = new Date()
  const validProfiles = profiles.filter(p => {
    if (!p.validoHasta) return true
    return new Date(p.validoHasta) > today
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--t-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        Perfil
      </span>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {validProfiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => setActiveProfile(profile.id)}
            title={`${profile.name} - ${profile.kcalTarget} kcal`}
            style={{
              background: activeProfileId === profile.id ? 'var(--t-accent)' : 'var(--t-border)',
              border: '1px solid var(--t-border)',
              color: activeProfileId === profile.id ? '#ffffff' : 'var(--t-text)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s',
              fontWeight: 600,
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (activeProfileId !== profile.id) {
                e.target.style.background = 'var(--t-border-soft)'
              }
            }}
            onMouseLeave={e => {
              if (activeProfileId !== profile.id) {
                e.target.style.background = 'var(--t-border)'
              }
            }}
          >
            {profile.emoji}
          </button>
        ))}
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--t-text-soft)', marginLeft: '0.5rem', minWidth: '60px' }}>
        {activeProfile.kcalTarget} kcal
      </span>
    </div>
  )
}
