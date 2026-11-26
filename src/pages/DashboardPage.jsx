import { useState } from 'react'
import './DashboardPage.css'

function Glyph({ name }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1) scale(1.08)" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export default function DashboardPage({ email, onExit }) {
  const [active, setActive] = useState('Home')
  const initial = (email || 'Z').trim().charAt(0).toUpperCase()
  const items = [{ label: 'Home', icon: 'home' }, { label: 'Workspace', icon: 'grid' }, { label: 'Activity', icon: 'activity' }]
  return (
    <main className="dashboard-page">
      <aside className="dashboard-rail" aria-label="Main navigation">
        <button className="dashboard-brand" aria-label="Zstars home" onClick={() => setActive('Home')}>Z</button>
        <div className="dashboard-rail-line" />
        <nav className="dashboard-rail-nav">
          {items.map((item) => (
            <button key={item.label} className={'rail-button ' + (active === item.label ? 'is-active' : '')} onClick={() => setActive(item.label)} aria-label={item.label} title={item.label}>
              <Glyph name={item.icon} />
              <span className="rail-tooltip">{item.label}</span>
            </button>
          ))}
          <button className="rail-button rail-add" onClick={() => setActive('Add workspace')} aria-label="Add workspace" title="Add workspace"><Glyph name="plus" /></button>
        </nav>
        <button className="rail-settings" onClick={() => setActive('Settings')} aria-label="Settings" title="Settings"><Glyph name="settings" /></button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">ZSTARS / OVERVIEW</p>
            <h1>{active === 'Home' ? 'Dashboard' : active}</h1>
          </div>
          <button className="dashboard-notification" aria-label="Notifications"><Glyph name="bell" /></button>
        </header>

        <div className="dashboard-welcome">
          <div className="welcome-copy">
            <span className="welcome-label">YOUR SPACE</span>
            <h2>Welcome to <span>zstars.</span></h2>
            <p>Semua workspace dan aktivitasmu akan tampil di sini.</p>
          </div>
          <div className="welcome-mark" aria-hidden="true">Z</div>
        </div>

        <div className="dashboard-section-heading">
          <span>YOUR WORKSPACES</span>
          <span className="dashboard-count">00</span>
        </div>
        <button className="workspace-empty" onClick={() => setActive('Add workspace')}>
          <span className="workspace-plus"><Glyph name="plus" /></span>
          <span><strong>Belum ada workspace</strong><small>Workspace yang kamu tambahkan akan muncul di sini.</small></span>
          <Glyph name="chevron" />
        </button>
      </section>

      <div className="profile-dock">
        <div className="profile-avatar">{initial}<span className="profile-presence" /></div>
        <div className="profile-copy">
          <strong>{email ? email.split('@')[0] : 'Zstars member'}</strong>
          <span>{email || 'Email verified'}</span>
        </div>
        <button className="profile-settings" onClick={() => setActive('Settings')} aria-label="Profile settings"><Glyph name="settings" /></button>
        <button className="profile-exit" onClick={onExit}>Exit</button>
      </div>
    </main>
  )
}
