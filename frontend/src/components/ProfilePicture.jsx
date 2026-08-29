import React, { useRef, useState, useEffect } from 'react'
import { Camera, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ProfilePicture({ size = 120 }) {
  const { user, setProfilePic } = useAuth()
  const fileRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [preview, setPreview] = useState(user?.profilePic || localStorage.getItem('cn_dss_profile_pic') || null)

  useEffect(() => {
    const saved = localStorage.getItem('cn_dss_profile_pic')
    if (saved) setPreview(saved)
  }, [])

  useEffect(() => {
    if (user?.profilePic) setPreview(user.profilePic)
  }, [user])

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      const data = r.result
      setPreview(data)
      setProfilePic(data)
    }
    r.readAsDataURL(f)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
    } catch {
      alert('Camera not available')
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    stream?.getTracks().forEach((t) => t.stop())
    setCameraOn(false)
  }

  const capture = () => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    const data = c.toDataURL('image/jpeg', 0.85)
    setPreview(data)
    setProfilePic(data)
    stopCamera()
  }

  const clear = () => {
    setPreview(null)
    localStorage.removeItem('cn_dss_profile_pic')
    setProfilePic(null)
  }

  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(167,139,250,0.5)', background: '#0F172A', display: 'grid', placeItems: 'center' }}>
        {preview ? <img src={preview} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32, color: '#94A3B8' }}>{user?.name?.[0] || '?'}</span>}
      </div>
      {!cameraOn ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload Photo</button>
          <button className="btn btn-ghost btn-sm" onClick={startCamera}><Camera size={14} /> Take Photo</button>
          {preview && <button className="btn btn-ghost btn-sm" onClick={clear}><Trash2 size={14} /> Remove</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: 260, height: 200, borderRadius: 12, background: '#000', objectFit: 'cover' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={capture}>Capture</button>
            <button className="btn btn-ghost btn-sm" onClick={stopCamera}>Cancel</button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>Upload or take a photo — stored locally & shown in Mr.Hari folder</div>
    </div>
  )
}
