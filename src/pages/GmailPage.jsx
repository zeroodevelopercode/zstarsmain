import { useState } from 'react'
import './GmailPage.css'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export default function GmailPage({ onBack, onVerified }) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [step, setStep] = useState('email')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function requestOtp(event) {
    event.preventDefault()
    setMessage('')
    if (!API_BASE_URL) {
      setMessage('Layanan verifikasi belum dikonfigurasi. Coba lagi setelah backend aktif.')
      return
    }
    setBusy(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Kode belum bisa dikirim. Coba lagi nanti.')
      setChallengeId(data.challengeId)
      setStep('otp')
      setMessage(data.message || 'Jika alamat memenuhi syarat, kode akan segera dikirim.')
    } catch (error) {
      setMessage(error.message || 'Koneksi ke server gagal.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(event) {
    event.preventDefault()
    setMessage('')
    if (!API_BASE_URL || !challengeId) {
      setMessage('Sesi verifikasi tidak tersedia. Minta kode baru.')
      return
    }
    setBusy(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, otp }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Kode salah atau sudah kedaluwarsa.')
      onVerified?.(data.email || email.trim(), data.sessionToken)
    } catch (error) {
      setMessage(error.message || 'Verifikasi gagal. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  async function resendOtp() {
    setOtp('')
    await requestOtp({ preventDefault() {} })
  }

  return (
    <main className="gmail-page">
      <div className="gmail-grain" aria-hidden="true" />
      <button className="gmail-back" type="button" onClick={onBack} aria-label="Kembali">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <section className="gmail-panel">
        <div className="gmail-mark" aria-hidden="true">Z</div>
        {step === 'email' && <>
          <p className="gmail-eyebrow">ZSTARS ACCOUNT</p>
          <h1>Continue with Gmail</h1>
          <p className="gmail-description">Masukkan alamat Gmail untuk menerima kode verifikasi.</p>
          <form className="gmail-form" onSubmit={requestOtp}>
            <label htmlFor="gmail-address">Gmail address</label>
            <input id="gmail-address" type="email" inputMode="email" autoComplete="email" placeholder="name@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
            <button className="gmail-submit" type="submit" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send verification code'}<span aria-hidden="true">↗</span></button>
          </form>
        </>}
        {step === 'otp' && <>
          <p className="gmail-eyebrow">EMAIL VERIFICATION</p>
          <h1>Check your inbox.</h1>
          <p className="gmail-description">Masukkan kode 6 digit yang dikirim ke <strong>{email.trim()}</strong>.</p>
          <form className="gmail-form" onSubmit={verifyOtp}>
            <label htmlFor="gmail-otp">6-digit code</label>
            <input id="gmail-otp" className="gmail-otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} pattern="[0-9]{6}" minLength={6} maxLength={6} required />
            <button className="gmail-submit" type="submit" disabled={busy || otp.length !== 6}>{busy ? 'Verifying…' : 'Verify code'}<span aria-hidden="true">↗</span></button>
          </form>
          <button className="gmail-text-button" type="button" onClick={resendOtp} disabled={busy}>Send a new code</button>
        </>}
        <p className={'gmail-message ' + (message ? 'is-visible' : '')} role="status" aria-live="polite">{message}</p>
      </section>
      <p className="gmail-footer">Secure email verification · Zstars</p>
    </main>
  )
}
