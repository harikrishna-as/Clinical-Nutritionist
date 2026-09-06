import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Check, AlertCircle, Upload, Trash2, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import './auth/Auth.css'

const ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const MAX_BYTES = 5 * 1024 * 1024

export default function ProfileSettings() {
  const { user, updateProfile, checkUsernameAvailable } = useAuth()
  const fileRef = useRef(null)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [preview, setPreview] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const original = {
    fullName: user?.name || '',
    username: user?.username || '',
    photo: user?.profilePic || null,
  }

  useEffect(() => {
    setFullName(user?.name || '')
    setUsername(user?.username || '')
    setPreview(user?.profilePic || null)
    setRemovePhoto(false)
    setError('')
    setSuccess('')
    setUsernameStatus(null)
  }, [user?.id])

  const currentPhoto = removePhoto ? null : preview
  const hasChanges =
    fullName.trim() !== original.fullName ||
    username.trim().toLowerCase() !== (original.username || '').toLowerCase() ||
    currentPhoto !== original.photo

  useEffect(() => {
    const norm = username.trim().toLowerCase()
    if (!norm || norm === (original.username || '').toLowerCase()) {
      setUsernameStatus(null)
      return
    }
    if (!/^[a-z0-9_.]{3,20}$/.test(norm)) {
      setUsernameStatus({ available: false, reason: '3-20 chars: letters, numbers, _ or .' })
      return
    }
    setChecking(true)
    const t = setTimeout(async () => {
      const res = await checkUsernameAvailable(norm, user?.id)
      setUsernameStatus(res)
      setChecking(false)
    }, 450)
    return () => clearTimeout(t)
  }, [username])

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const okType = ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type) || /\.(jpe?g|png)$/i.test(f.name)
    if (!okType) {
      setError('Only JPG or PNG images are allowed.')
      return
    }
    if (f.size > MAX_BYTES) {
      setError('Image must be smaller than 5MB.')
      return
    }
    setError('')
    const r = new FileReader()
    r.onload = () => {
      setPreview(r.result)
      setRemovePhoto(false)
    }
    r.readAsDataURL(f)
  }

  const handleRemove = () => {
    if (!currentPhoto) return
    if (!window.confirm('Remove your profile photo?')) return
    setPreview(null)
    setRemovePhoto(true)
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    const norm = username.trim().toLowerCase()
    if (!/^[a-z0-9_.]{3,20}$/.test(norm)) {
      setError('Username must be 3-20 characters: letters, numbers, _ or .')
      return
    }
    if (usernameStatus && !usernameStatus.available) {
      setError(usernameStatus.reason)
      return
    }
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName.trim(), username: norm, avatar_url: currentPhoto, profilePic: currentPhoto })
      setSuccess('Profile updated successfully.')
      setRemovePhoto(false)
    } catch (e) {
      setError(e.message || 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFullName(original.fullName)
    setUsername(original.username)
    setPreview(original.photo)
    setRemovePhoto(false)
    setError('')
    setSuccess('')
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Profile settings</h2>
          <p className="auth-sub">Please <Link to="/login" className="auth-link">log in</Link> to edit your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ background: '#000', minHeight: '100vh' }}>
      <section className="page-hero" style={{ background: '#000', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          <h1 style={{ color: '#fff' }}>Profile <span style={{ color: '#fff' }}>Settings</span></h1>
          <p style={{ color: '#94A3B8' }}>Update your photo, name and username.</p>
        </div>
      </section>
      <section className="page-body">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, maxWidth: 1020, alignItems: 'start' }}>
          <div className="auth-card" style={{ width: '100%', display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center' }}>
            <Avatar user={{ ...user, name: fullName || user.name, username: username || user.username }} photo={currentPhoto} size={132} style={{ border: '2px solid rgba(148,163,184,0.25)' }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button type="button" className="auth-btn ghost" style={{ padding: '9px 14px', fontSize: 13 }} onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Upload
              </button>
              <button type="button" className="auth-btn ghost" style={{ padding: '9px 14px', fontSize: 13 }} onClick={() => fileRef.current?.click()}>
                <Camera size={14} /> Select
              </button>
              {currentPhoto && (
                <button type="button" className="auth-btn danger" style={{ padding: '9px 14px', fontSize: 13 }} onClick={handleRemove}>
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={onFile} />
            <div className="auth-hint">JPG or PNG · Max 5MB · Preview updates before saving</div>
            <div style={{ width: '100%', padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' }}>
              <div style={{ fontSize: 11, letterSpacing: 1.2, color: '#64748b', fontWeight: 700, marginBottom: 10 }}>LIVE PREVIEW</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar user={{ ...user, name: fullName || user.name, username: username || user.username }} photo={currentPhoto} size={44} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName || 'Full Name'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>@{username || 'username'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-card" style={{ width: '100%' }}>
            <div className="auth-form">
              <div>
                <label className="auth-label" htmlFor="ps-name">Full name</label>
                <input id="ps-name" className="auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your display name" />
              </div>
              <div>
                <label className="auth-label" htmlFor="ps-user">Username</label>
                <input
                  id="ps-user"
                  className="auth-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20))}
                  placeholder="username"
                />
                <div style={{ minHeight: 18, marginTop: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {checking && <span style={{ color: '#94a3b8' }}>Checking availability...</span>}
                  {!checking && usernameStatus && (
                    usernameStatus.available
                      ? <span className="auth-hint ok" style={{ marginTop: 0 }}><Check size={13} style={{ verticalAlign: -2 }} /> Username available</span>
                      : <span className="auth-hint bad" style={{ marginTop: 0 }}><AlertCircle size={13} style={{ verticalAlign: -2 }} /> {usernameStatus.reason}</span>
                  )}
                  {!checking && !usernameStatus && <span className="auth-hint" style={{ marginTop: 0 }}>Unique, case-insensitive. 3-20 chars.</span>}
                </div>
              </div>
              <div>
                <label className="auth-label">Email <span style={{ fontWeight: 400, color: '#64748b' }}>(read-only — managed separately)</span></label>
                <input className="auth-input" value={user.email || ''} readOnly />
                <div className="auth-hint">Email is unique and cannot be changed here.</div>
              </div>
              {error && <div className="auth-error"><AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}</div>}
              {success && <div className="auth-success"><Check size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {success}</div>}
              <div className="auth-actions">
                <button type="button" className="auth-btn ghost" onClick={handleCancel} disabled={saving}>Cancel</button>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={handleSave}
                  disabled={!hasChanges || saving || (usernameStatus && !usernameStatus.available)}
                  style={{ minWidth: 132 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style>{`@media (max-width: 900px) { .page-body .container { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
