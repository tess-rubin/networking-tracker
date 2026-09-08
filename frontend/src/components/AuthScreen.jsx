import React, { useState } from 'react'
import { ArrowRight, LockKeyhole, Network } from 'lucide-react'
import { Button } from './ui.jsx'

export function AuthScreen({ auth, configured }) {
  const [mode, setMode] = useState('sign-in')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function showVerification() {
    setVerificationCode('')
    setError('')
    setMessage(`We sent a 6-digit verification code to ${form.email.trim()}.`)
    setMode('verify')
  }

  async function submit(event) {
    event.preventDefault()
    if (!configured) return setError('Add your Neon endpoints to .env.local to enable authentication.')
    setBusy(true); setError(''); setMessage('')
    try {
      const result = mode === 'sign-up'
        ? await auth.signUp.email({ name: form.name.trim(), email: form.email.trim(), password: form.password })
        : await auth.signIn.email({ email: form.email.trim(), password: form.password })
      if (result?.error) {
        if (result.error.code === 'EMAIL_NOT_VERIFIED') return showVerification()
        throw new Error(result.error.message || 'Authentication failed.')
      }
      if (mode === 'sign-up' && !result?.data?.token) showVerification()
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your details and try again.')
    } finally { setBusy(false) }
  }

  async function verify(event) {
    event.preventDefault()
    if (!/^\d{6}$/.test(verificationCode)) return setError('Enter the 6-digit code from your email.')
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await auth.emailOtp.verifyEmail({
        email: form.email.trim(),
        otp: verificationCode,
      })
      if (result?.error) throw new Error(result.error.message || 'That verification code is invalid or expired.')
      setMode('sign-in')
      setVerificationCode('')
      setForm((current) => ({ ...current, password: '' }))
      setMessage('Email verified. Sign in to continue.')
    } catch (err) {
      setError(err.message || 'That verification code is invalid or expired.')
    } finally { setBusy(false) }
  }

  async function resendCode() {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await auth.emailOtp.sendVerificationOtp({
        email: form.email.trim(),
        type: 'email-verification',
      })
      if (result?.error) throw new Error(result.error.message || 'Could not resend the code.')
      setMessage(`A new code was sent to ${form.email.trim()}.`)
    } catch (err) {
      setError(err.message || 'Could not resend the code. Please try again.')
    } finally { setBusy(false) }
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
    setVerificationCode('')
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand"><span className="brand-mark"><Network size={21} /></span> Bear Connect</div>
        <div className="story-copy">
          <p className="eyebrow">YOUR BERKELEY NETWORK</p>
          <h1>Keep good people<br />within reach.</h1>
          <p>A private place for the names, context, and conversations you don’t want to lose after the semester ends.</p>
        </div>
        <div className="privacy-note"><LockKeyhole size={18} /><span><strong>Private by design.</strong><br />Your contacts are visible only to you.</span></div>
      </section>
      <section className="auth-panel">
        {mode === 'verify' ? (
          <form className="auth-card" onSubmit={verify}>
            <p className="eyebrow">CHECK YOUR INBOX</p>
            <h2>Verify your email</h2>
            <p className="auth-subtitle">Enter the code sent to <strong>{form.email.trim()}</strong>.</p>
            <div className="field">
              <label htmlFor="verification-code">Verification code</label>
              <input
                id="verification-code"
                className="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                aria-describedby="verification-help"
              />
              <p id="verification-help" className="field-help">The code expires shortly, so use the newest email from Neon.</p>
            </div>
            {message && <div className="form-message" role="status">{message}</div>}
            {error && <div className="form-error" role="alert">{error}</div>}
            <Button type="submit" className="auth-submit" disabled={busy || verificationCode.length !== 6}>{busy ? 'Verifying…' : 'Verify email'} <ArrowRight size={17} /></Button>
            <p className="auth-switch">Didn’t get it? <button type="button" disabled={busy} onClick={resendCode}>Resend code</button></p>
            <p className="auth-switch"><button type="button" onClick={() => switchMode('sign-in')}>Back to sign in</button></p>
          </form>
        ) : (
          <form className="auth-card" onSubmit={submit}>
            <p className="eyebrow">{mode === 'sign-in' ? 'WELCOME BACK' : 'JOIN BEAR CONNECT'}</p>
            <h2>{mode === 'sign-in' ? 'Sign in to your network' : 'Create your account'}</h2>
            <p className="auth-subtitle">{mode === 'sign-in' ? 'Pick up where you left off.' : 'Start building relationships that last.'}</p>
            {mode === 'sign-up' && <div className="field"><label htmlFor="name">Name</label><input id="name" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Oski Bear" /></div>}
            <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@berkeley.edu" /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></div>
            {message && <div className="form-message" role="status">{message}</div>}
            {error && <div className="form-error" role="alert">{error}</div>}
            <Button type="submit" className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></Button>
            <p className="auth-switch">{mode === 'sign-in' ? 'New here?' : 'Already have an account?'} <button type="button" onClick={() => switchMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>{mode === 'sign-in' ? 'Create an account' : 'Sign in'}</button></p>
          </form>
        )}
      </section>
    </main>
  )
}
