import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      await register({ name, email, password })
      nav('/onboarding')
    } catch (ex) {
      setErr(ex.message)
    }
  }

  return (
    <div className="page" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', background: '#000' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ width: 'min(420px, 92vw)', background: '#0F172A' }}>
        <h2>Register</h2>
        <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 16 }}>Create your account to use the DSS.</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(13,5,36,0.8)', color: '#fff' }} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(13,5,36,0.8)', color: '#fff' }} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(13,5,36,0.8)', color: '#fff' }} />
          {err && <div style={{ color: '#ef4444', fontSize: 13 }}>{err}</div>}
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Create Account</button>
        </form>
        <div style={{ marginTop: 14, fontSize: 13, color: '#94A3B8' }}>Already have account? <Link to="/login" className="text-link">Login</Link></div>
      </motion.div>
    </div>
  )
}
