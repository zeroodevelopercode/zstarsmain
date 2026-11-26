import { useState } from 'react'
import './SelectionPage.css'

function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 6.5 12 13l8.5-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 5.5h15A1.5 1.5 0 0 1 21 7v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17V7a1.5 1.5 0 0 1 1.5-1.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.25-.19-1.8H12v3.46h5.52a4.72 4.72 0 0 1-2.05 3.1l-.02.12 2.98 2.31.21.02c1.94-1.79 2.96-4.42 2.96-7.21Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.89 6.63-2.42l-3.16-2.45c-.85.57-1.99.97-3.47.97-2.65 0-4.9-1.79-5.7-4.27l-.12.01-3.1 2.4-.04.11A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.3 13.83A6.02 6.02 0 0 1 5.98 12c0-.64.11-1.26.3-1.83l-.01-.12-3.14-2.44-.1.05A9.97 9.97 0 0 0 2 12c0 1.61.39 3.13 1.08 4.47l3.22-2.64Z" />
      <path fill="#EA4335" d="M12 5.9c1.88 0 3.15.81 3.87 1.49l2.83-2.76C16.96 3.02 14.7 2 12 2a10 10 0 0 0-8.97 5.66l3.25 2.51C7.1 7.69 9.35 5.9 12 5.9Z" />
    </svg>
  )
}

export default function SelectionPage({ onGmail }) {
  const [notice, setNotice] = useState('')

  const chooseProvider = (provider) => {
    setNotice(provider + ' sign-in belum dihubungkan.')
    window.setTimeout(() => setNotice(''), 2800)
  }

  return (
    <main className="selection-page">
      <div className="selection-grain" aria-hidden="true" />
      <section className="selection-center" aria-label="Zstars">
        <div className="selection-logo" aria-label="Zstars logo">Z</div>
        <span className="selection-wordmark">zstars</span>
      </section>

      <section className="selection-bottom" aria-label="Choose sign in method">
        <div className="selection-actions">
          <button className="provider-button provider-gmail" onClick={onGmail}>
            <GmailIcon />
            <span>Continue with Gmail</span>
            <span className="provider-arrow" aria-hidden="true">↗</span>
          </button>
          <button className="provider-button provider-google" onClick={() => chooseProvider('Google')}>
            <GoogleIcon />
            <span>Continue with Google</span>
            <span className="provider-arrow" aria-hidden="true">↗</span>
          </button>
        </div>
        <p className="selection-note">Choose how you want to continue.</p>
      </section>

      <div className={'selection-notice ' + (notice ? 'is-visible' : '')} role="status">{notice}</div>
    </main>
  )
}
