import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { isValidEmail, passwordStrength, isStrongPassword } from '../../lib/avatar'
import './Auth.css'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const strength = passwordStrength(password)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const u = username.trim().toLowerCase()
    const em = email.trim()
    if (!/^[a-z0-9_.]{3,20}$/.test(u)) {
      setErr('Username must be 3-20 characters: letters, numbers, _ or .')
      return
    }
    if (!isValidEmail(em)) {
      setErr('Enter a valid email address.')
      return
    }
    if (!isStrongPassword(password)) {
      setErr('Password must be at least 8 characters with letters and numbers.')
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await register({ name: u, email: em, password, username: u })
      nav('/login')
    } catch (ex) {
      setErr(ex.message || 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="auth-card">
        <h2>Create account</h2>
        <p className="auth-sub">Usernames and emails must be unique across all users.</p>
        <form onSubmit={submit} className="auth-form">
          <div>
            <label className="auth-label" htmlFor="reg-user">Username</label>
            <input
              id="reg-user"
              className="auth-input"
              placeholder="e.g. hari_nutrition"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20))}
              autoComplete="username"
              required
            />
            <div className="auth-hint">3-20 characters: letters, numbers, _ or . Case-insensitive unique.</div>
          </div>
          <div>
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="auth-label" htmlFor="reg-pw">Password</label>
            <input
              id="reg-pw"
              className="auth-input"
              type="password"
              placeholder="At least 8 characters with letters and numbers"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {password && (
              <>
                <div className="auth-strength" aria-hidden="true">
                  <i className={strength.score >= 1 ? `on-${strength.level}` : ''} />
                  <i className={strength.score >= 3 ? `on-${strength.level}` : ''} />
                  <i className={strength.score >= 4 ? `on-${strength.level}` : ''} />
                </div>
                <div className="auth-hint">Strength: {strength.label}</div>
              </>
            )}
          </div>
          <div>
            <label className="auth-label" htmlFor="reg-confirm">Confirm password</label>
            <input
              id="reg-confirm"
              className="auth-input"
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {err && <div className="auth-error">{err}</div>}
          <button type="submit" className="auth-btn" disabled={busy}>
            {busy ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <div className="auth-foot">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </div>
      </motion.div>
    </div>
  )
}
