import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfilePicture from '../components/ProfilePicture'
import MrHariAuth from './auth/MrHariAuth'

export default function MrHari() {
  const { user, isAuthenticated } = useAuth()

  // Not authenticated → show the exact Mr.Hari login from your HTML (now combined)
  if (!isAuthenticated) {
    return <MrHariAuth initialMode="login" />
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
