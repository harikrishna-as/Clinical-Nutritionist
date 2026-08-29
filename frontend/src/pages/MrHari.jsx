import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfilePicture from '../components/ProfilePicture'

export default function MrHari() {
  const { user } = useAuth()
  return (
    <div className="page" style={{ background: '#000000', minHeight: '100vh' }}>
      <section className="page-hero" style={{ background: '#000000', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          <h1 style={{ color: '#fff' }}>Mr.Hari <span className="gradient-text">Folder</span></h1>
          <p style={{ color: '#94A3B8', maxWidth: 640 }}>Private black folder for Mr.Hari — profile, saved assessments and personal notes. Background is pure black as requested.</p>
        </div>
      </section>
      <section className="page-body">
        <div className="container" style={{ display: 'grid', gap: 20, maxWidth: 900 }}>
          <div className="card" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h3>Profile Picture</h3>
            <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 12 }}>Choose as you wish — upload your photo or take a photo with camera.</p>
            <ProfilePicture size={140} />
            {user && <div style={{ marginTop: 12, color: '#22c55e', fontSize: 13 }}>Hello, {user.name} ({user.email})</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="card" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3>Quick Links</h3>
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                <Link to="/assessment" className="text-link">→ Health Assessment</Link>
                <Link to="/reports" className="text-link">→ My Reports</Link>
                <Link to="/recommend" className="text-link">→ Recommendation Lab</Link>
                <Link to="/account" className="text-link">→ Account Settings</Link>
              </div>
            </div>
            <div className="card" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3>Black Folder Notes</h3>
              <p style={{ color: '#94A3B8', fontSize: 13 }}>This folder is black by design. All your personal data, photos and notes stay here. Add files, images or text — they are stored locally and can be synced to Vercel via /api/users.</p>
              <ul className="check-list" style={{ marginTop: 10 }}>
                <li>Private and black</li>
                <li>Profile picture optional</li>
                <li>Synced to Vercel when online</li>
              </ul>
            </div>
          </div>

          <div className="card" style={{ background: '#0a0a0a' }}>
            <h3>Recent Activity</h3>
            <p style={{ color: '#64748B', fontSize: 13 }}>No activity yet. Start an assessment and it will appear here.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
