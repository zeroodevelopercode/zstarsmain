import { useEffect, useState } from 'react'
import SelectionPage from './pages/SelectionPage.jsx'
import GmailPage from './pages/GmailPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const SESSION_KEY = 'zstars_session_token'

export default function App() {
  const [page, setPage] = useState('loading')
  const [verifiedEmail, setVerifiedEmail] = useState('')

  useEffect(() => {
    let active = true
    const token = localStorage.getItem(SESSION_KEY)
    if (!token || !API_BASE_URL) {
      setPage('selection')
      return () => { active = false }
    }

    fetch(`${API_BASE_URL}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Session expired')
        return data
      })
      .then(data => {
        if (!active) return
        setVerifiedEmail(data.email || '')
        setPage('dashboard')
      })
      .catch(() => {
        localStorage.removeItem(SESSION_KEY)
        if (active) setPage('selection')
      })

    return () => { active = false }
  }, [])

  function handleVerified(email, token) {
    if (token) localStorage.setItem(SESSION_KEY, token)
    setVerifiedEmail(email)
    setPage('dashboard')
  }

  async function handleExit() {
    const token = localStorage.getItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
    if (token && API_BASE_URL) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        })
      } catch { /* Local logout still succeeds if offline. */ }
    }
    setVerifiedEmail('')
    setPage('selection')
  }

  if (page === 'loading') {
    return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#888', fontFamily: 'DM Sans, sans-serif', fontSize: 12 }}>Memeriksa sesi akun…</main>
  }
  if (page === 'dashboard') return <DashboardPage email={verifiedEmail} onExit={handleExit} />
  if (page === 'gmail') return <GmailPage onBack={() => setPage('selection')} onVerified={handleVerified} />
  return <SelectionPage onGmail={() => setPage('gmail')} />
}
