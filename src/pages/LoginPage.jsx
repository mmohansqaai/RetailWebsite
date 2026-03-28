import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const from = useMemo(() => location.state?.from || '/app/dashboard', [location.state])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rw-auth">
      <div className="rw-auth-card">
        <div className="rw-auth-brand">
          <div className="rw-logo">N</div>
          <div>
            <div className="rw-title">Nova Retail</div>
            <div className="rw-subtitle">Sign in to your workspace</div>
          </div>
        </div>

        <form className="rw-form" onSubmit={onSubmit}>
          <label>
            Email
            <input name="email" type="email" defaultValue="test@demo.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" defaultValue="password123" required />
          </label>
          {error ? <div className="rw-alert">{error}</div> : null}

          <button className="rw-btn rw-btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="rw-auth-footer">
          Demo: customer <strong>test@demo.com</strong> / <strong>password123</strong>
          {' · '}
          admin <strong>admin@demo.com</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  )
}

