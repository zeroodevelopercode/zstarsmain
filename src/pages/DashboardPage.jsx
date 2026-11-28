import { useState } from 'react'
import './DashboardPage.css'

function Glyph({ name }) {
  const paths = {
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1) scale(1.08)" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export default function DashboardPage({ email, onExit }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const initial = (email || 'Z').trim().charAt(0).toUpperCase()

  return (
    <main className="dashboard-page">
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">ZSTARS / YOUR SPACE</p>
            <h1>Welcome</h1>
          </div>
          <button className="dashboard-notification" aria-label="Notifications"><Glyph name="bell" /></button>
        </header>

        <div className="dashboard-welcome">
          <div className="welcome-copy">
            <span className="welcome-label">YOUR SPACE</span>
            <h2>Welcome to <span>zstars.</span></h2>
            <p>Tempat untuk mulai menjelajahi Zstars.</p>
          </div>
          <div className="welcome-mark" aria-hidden="true">Z</div>
        </div>
      </section>

      <footer className="profile-dock">
        <div className="profile-account">
          <div className="profile-avatar">{initial}<span className="profile-presence" /></div>
          <div className="profile-copy">
            <strong>{email ? email.split('@')[0] : 'Zstars member'}</strong>
            <span>{email || 'Email verified'}</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className={'profile-settings ' + (settingsOpen ? 'is-open' : '')} onClick={() => setSettingsOpen(value => !value)} aria-label="Profile settings" title="Settings"><Glyph name="settings" /></button>
          <button className="profile-exit" onClick={onExit}>Exit</button>
        </div>
      </footer>
    </main>
  )
}
