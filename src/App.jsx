import { useState } from 'react'
import SelectionPage from './pages/SelectionPage.jsx'
import GmailPage from './pages/GmailPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

export default function App() {
  const [page, setPage] = useState('selection')
  const [verifiedEmail, setVerifiedEmail] = useState('')

  if (page === 'dashboard') {
    return <DashboardPage email={verifiedEmail} onExit={() => { setPage('selection'); setVerifiedEmail('') }} />
  }
  if (page === 'gmail') {
    return <GmailPage onBack={() => setPage('selection')} onVerified={(email) => { setVerifiedEmail(email); setPage('dashboard') }} />
  }
  return <SelectionPage onGmail={() => setPage('gmail')} />
}
