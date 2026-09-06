import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const from = loc.state?.from || '/'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!identifier.trim() || !password) {
      setErr('Enter your email or username and password.')
      return
    }
    setBusy(true)
    try {
      await login(identifier.trim(), password, remember)
      nav(from, { replace: true })
    } catch (ex) {
      setErr(ex.message || 'Invalid login credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="auth-card">
        <h2>Welcome back</h2>
        <p className="auth-sub">Log in to put values and use the nutrition tools.</p>
        <form onSubmit={submit} className="auth-form">
          <div>
            <label className="auth-label" htmlFor="login-id">Email or username</label>
            <input
              id="login-id"
              className="auth-input"
              placeholder="you@example.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="auth-label" htmlFor="login-pw">Password</label>
            <input
              id="login-pw"
              className="auth-input"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {err && <div className="auth-error">{err}</div>}
          <div className="auth-row">
            <label className="auth-check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
          </div>
          <button type="submit" className="auth-btn" disabled={busy}>
            {busy ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-foot">
          No account? <Link to="/register" className="auth-link">Create one</Link>
        </div>
      </motion.div>
    </div>
  )
}
