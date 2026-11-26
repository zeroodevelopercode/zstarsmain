import { useState } from 'react'
import SelectionPage from './pages/SelectionPage.jsx'
import GmailPage from './pages/GmailPage.jsx'

export default function App() {
  const [page, setPage] = useState('selection')

  if (page === 'gmail') {
    return <GmailPage onBack={() => setPage('selection')} />
  }

  return <SelectionPage onGmail={() => setPage('gmail')} />
}
