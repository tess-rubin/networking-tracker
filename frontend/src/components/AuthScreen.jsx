import { useState } from 'react'
import { ArrowRight, LockKeyhole, Network } from 'lucide-react'
import { Button } from './ui.jsx'

export function AuthScreen({ auth, configured }) {
  const [mode, setMode] = useState('sign-in')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (!configured) return setError('Add your Neon endpoints to .env.local to enable authentication.')
    setBusy(true); setError('')
    try {
      const result = mode === 'sign-up'
        ? await auth.signUp.email({ name: form.name.trim(), email: form.email.trim(), password: form.password })
        : await auth.signIn.email({ email: form.email.trim(), password: form.password })
      if (result?.error) throw new Error(result.error.message || 'Authentication failed.')
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your details and try again.')
    } finally { setBusy(false) }
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
        <form className="auth-card" onSubmit={submit}>
          <p className="eyebrow">{mode === 'sign-in' ? 'WELCOME BACK' : 'JOIN BEAR CONNECT'}</p>
          <h2>{mode === 'sign-in' ? 'Sign in to your network' : 'Create your account'}</h2>
          <p className="auth-subtitle">{mode === 'sign-in' ? 'Pick up where you left off.' : 'Start building relationships that last.'}</p>
          {mode === 'sign-up' && <div className="field"><label htmlFor="name">Name</label><input id="name" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Oski Bear" /></div>}
          <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@berkeley.edu" /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <Button type="submit" className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></Button>
          <p className="auth-switch">{mode === 'sign-in' ? 'New here?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError('') }}>{mode === 'sign-in' ? 'Create an account' : 'Sign in'}</button></p>
        </form>
      </section>
    </main>
  )
}

