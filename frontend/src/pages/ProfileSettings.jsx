import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, Trash2, Check, X, AlertCircle, User } from 'lucide-react'

export default function ProfileSettings() {
  const { user, updateProfile, checkUsernameAvailable } = useAuth()
  const nav = useNavigate()
  const fileRef = useRef(null)
  const [fullName, setFullName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [email] = useState(user?.email || '')
  const [avatar, setAvatar] = useState(user?.profilePic || localStorage.getItem('cn_dss_profile_pic') || null)
  const [previewAvatar, setPreviewAvatar] = useState(avatar)
  const [usernameStatus, setUsernameStatus] = useState(null) // { available, reason }
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  const original = { fullName: user?.name || '', username: user?.username || '', avatar: user?.profilePic || localStorage.getItem('cn_dss_profile_pic') || null }

  useEffect(() => {
    setFullName(user?.name || '')
    setUsername(user?.username || '')
    setPreviewAvatar(user?.profilePic || localStorage.getItem('cn_dss_profile_pic') || null)
  }, [user])

  useEffect(() => {
    const changed = fullName !== original.fullName || username.toLowerCase() !== (original.username || '').toLowerCase() || previewAvatar !== original.avatar
    setHasChanges(changed)
  }, [fullName, username, previewAvatar])

  // username availability debounce
  useEffect(() => {
    const norm = username.trim().toLowerCase()
    if (!norm || norm === (original.username || '').toLowerCase()) {
      setUsernameStatus(null)
      return
    }
    if (!/^[a-z0-9_.]{3,20}$/.test(norm)) {
      setUsernameStatus({ available: false, reason: '3-20 chars, letters, numbers, _ or .' })
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
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(f.type)) {
      setError('Only JPG, JPEG, PNG, WEBP allowed')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }
    setError('')
    const r = new FileReader()
    r.onload = () => setPreviewAvatar(r.result)
    r.readAsDataURL(f)
  }

  const handleRemove = () => {
    if (!previewAvatar) return
    if (!confirm('Remove profile photo?')) return
    setPreviewAvatar(null)
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    if (!fullName.trim()) { setError('Full name is required'); return }
    const norm = username.trim().toLowerCase()
    if (!/^[a-z0-9_.]{3,20}$/.test(norm)) { setError('Username must be 3-20 chars, letters, numbers, _ or .'); return }
    if (usernameStatus && !usernameStatus.available) { setError(usernameStatus.reason); return }
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName.trim(), username: norm, avatar_url: previewAvatar, profilePic: previewAvatar })
      setSuccess('Profile updated successfully.')
      setTimeout(() => setSuccess(''), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFullName(original.fullName)
    setUsername(original.username)
    setPreviewAvatar(original.avatar)
    setError('')
    setSuccess('')
  }

  if (!user) {
    return (
      <div className="page" style={{ background: '#000', minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
        <div className="card" style={{ background: '#0F172A' }}>Please <a href="/login" className="text-link">login</a> to edit profile.</div>
      </div>
    )
  }

  return (
    <div className="page" style={{ background: '#000', minHeight: '100vh' }}>
      <section className="page-hero" style={{ background: '#000', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          <h1 style={{ color: '#fff' }}>Profile <span className="gradient-text">Settings</span></h1>
          <p style={{ color: '#94A3B8' }}>Manage your personal information and profile photo.</p>
        </div>
      </section>

      <section className="page-body">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, maxWidth: 1020, alignItems: 'start' }}>
          {/* Left: Photo + Preview */}
          <div className="card" style={{ background: '#0F172A', display: 'grid', gap: 16, justifyItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(167,139,250,0.5)', background: '#1E293B', display: 'grid', placeItems: 'center' }}>
              {previewAvatar ? <img src={previewAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={48} color="#94A3B8" />}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload</button>
              <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}><Camera size={14} /> Select</button>
              {previewAvatar && <button className="btn btn-ghost btn-sm" onClick={handleRemove} style={{ color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}><Trash2 size={14} /> Remove</button>}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={onFile} />
            <div style={{ fontSize: 11, color: '#64748B' }}>JPG, JPEG, PNG, WEBP · Max 5MB</div>

            {/* Live Preview */}
            <div style={{ width: '100%', marginTop: 8, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
              <div style={{ fontSize: 11, letterSpacing: 1.2, color: '#64748B', fontWeight: 700, marginBottom: 10 }}>PREVIEW</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: '#1E293B', flexShrink: 0 }}>
                  {previewAvatar ? <img src={previewAvatar} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#94A3B8' }}><User size={18} /></div>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName || 'Full Name'}</div>
                  <div style={{ color: '#94A3B8', fontSize: 12 }}>@{username || 'username'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="card" style={{ background: '#0F172A', display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g., Hari Krishnan" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(13,5,36,0.8)', color: '#fff' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontSize: 14 }}>@</span>
                <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} placeholder="username" style={{ width: '100%', padding: '12px 14px 12px 32px', borderRadius: 10, border: `1px solid ${usernameStatus?.available === false ? 'rgba(239,68,68,0.6)' : usernameStatus?.available ? 'rgba(34,197,94,0.6)' : 'rgba(148,163,184,0.3)'}`, background: 'rgba(13,5,36,0.8)', color: '#fff' }} />
              </div>
              <div style={{ minHeight: 18, marginTop: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                {checking && <span style={{ color: '#94A3B8' }}>Checking...</span>}
                {!checking && usernameStatus && (
                  usernameStatus.available ? <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} /> Username available</span>
                    : <span style={{ color: '#F87171', display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} /> {usernameStatus.reason}</span>
                )}
                {!checking && !usernameStatus && <span style={{ color: '#64748B' }}>3-20 chars, letters, numbers, _ or .</span>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>Email <span style={{ fontWeight: 400, color: '#64748B' }}>(read-only — managed separately)</span></label>
              <input value={email} readOnly style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.5)', color: '#94A3B8', cursor: 'not-allowed' }} />
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>Email is unique and cannot be changed from this page. Contact support to change email.</div>
            </div>

            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 13, display: 'flex', gap: 8 }}><AlertCircle size={16} /> {error}</div>}
            {success && <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#6EE7B7', fontSize: 13, display: 'flex', gap: 8 }}><Check size={16} /> {success}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={handleCancel} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges || saving || (usernameStatus && !usernameStatus.available)} style={{ opacity: !hasChanges || saving || (usernameStatus && !usernameStatus.available) ? 0.5 : 1, minWidth: 130, justifyContent: 'center' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
