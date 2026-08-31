import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfilePicture from '../components/ProfilePicture'

export default function MrHari() {
  const { user, isAuthenticated, login, register } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState('login') // login | register
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      await login(email, password)
    } catch (ex) {
      setErr(ex.message)
    }
  }
  const handleRegister = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      await register({ name, email, password, username })
      setErr('')
    } catch (ex) {
      setErr(ex.message)
    }
  }

  // Not authenticated → show combined login/register inside black folder
  if (!isAuthenticated) {
    return (
      <div className="page" style={{ background: '#000000', minHeight: '100vh' }}>
        <section className="page-hero" style={{ background: '#000000', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="container">
            <h1 style={{ color: '#fff' }}>Mr.Hari <span className="gradient-text">Folder</span></h1>
            <p style={{ color: '#94A3B8', maxWidth: 640 }}>Black folder — please login first to use values, texts and all features. Your profile and data stay private here.</p>
          </div>
        </section>
        <section className="page-body">
          <div className="container" style={{ display: 'grid', gap: 20, maxWidth: 900 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setMode('login')} className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-ghost'} btn-sm`}>Login</button>
              <button onClick={() => setMode('register')} className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-ghost'} btn-sm`}>Sign In / Register</button>
            </div>

            <div className="card" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 520, margin: '0 auto', width: '100%' }}>
              <h3 style={{ textAlign: 'center' }}>{mode === 'login' ? 'Login to Mr.Hari' : 'Create Account'}</h3>
              <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>Home appears first, but putting any value requires login.</p>
              <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'grid', gap: 12 }}>
                {mode === 'register' && (
                  <>
                    <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(13,5,36,0.8)', color: '#fff' }} />
                    <input placeholder="Username (unique, 3-20, letters/numbers/_/.)" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(13,5,36,0.8)', color: '#fff' }} />
                  </>
                )}
                <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(13,5,36,0.8)', color: '#fff' }} />
                <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(13,5,36,0.8)', color: '#fff' }} />
                {err && <div style={{ color: '#F87171', fontSize: 13 }}>{err}</div>}
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>{mode === 'login' ? 'Login' : 'Register'}</button>
              </form>
              <div style={{ marginTop: 12, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                Email is unique and read-only after. Username must be unique (case-insensitive).
              </div>
            </div>

            <div className="card" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <p style={{ color: '#64748B', fontSize: 13 }}>Profile picture can be added after login — upload or take photo, preview, then save.</p>
              <div style={{ opacity: 0.5, pointerEvents: 'none' }}><ProfilePicture size={100} /></div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Authenticated → show black folder with profile
  return (
    <div className="page" style={{ background: '#000000', minHeight: '100vh' }}>
      <section className="page-hero" style={{ background: '#000000', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          <h1 style={{ color: '#fff' }}>Mr.Hari <span className="gradient-text">Folder</span></h1>
          <p style={{ color: '#94A3B8', maxWidth: 640 }}>Private black folder — profile, saved assessments and personal notes. Background is pure black as requested.</p>
        </div>
      </section>
      <section className="page-body">
        <div className="container" style={{ display: 'grid', gap: 20, maxWidth: 900 }}>
          <div className="card" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.12)', display: 'grid', gap: 16, justifyItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
              <ProfilePicture size={120} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: 18 }}>{user.name}</div>
                <div style={{ color: '#A78BFA', fontSize: 13 }}>@{user.username}</div>
                <div style={{ color: '#64748B', fontSize: 12 }}>{user.email} <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 6px', borderRadius: 999, marginLeft: 6 }}>read-only</span></div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Link to="/profile-settings" className="btn btn-primary btn-sm">Profile Settings</Link>
                  <Link to="/account" className="btn btn-ghost btn-sm">Account</Link>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="card" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3>Quick Links</h3>
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                <Link to="/assessment" className="text-link">→ Health Assessment</Link>
                <Link to="/reports" className="text-link">→ My Reports</Link>
                <Link to="/recommend" className="text-link">→ Recommendation Lab</Link>
                <Link to="/profile-settings" className="text-link">→ Edit Profile</Link>
              </div>
            </div>
            <div className="card" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3>Black Folder Notes</h3>
              <p style={{ color: '#94A3B8', fontSize: 13 }}>This folder is black by design. All your data stays private and is synced to Vercel + Supabase 24/7.</p>
              <ul className="check-list" style={{ marginTop: 10 }}>
                <li>Private and black</li>
                <li>Username & email unique</li>
                <li>Profile 100% editable</li>
              </ul>
            </div>
          </div>

          <div className="card" style={{ background: '#0a0a0a' }}>
            <h3>Recent Activity</h3>
            <p style={{ color: '#64748B', fontSize: 13 }}>Hello {user.name}! Start an assessment and it will appear here.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
