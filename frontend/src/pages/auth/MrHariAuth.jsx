import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './MrHariAuth.css'

export default function MrHariAuth({ initialMode = 'login' }) {
  const { login, register } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState(initialMode) // login | signup | forgot | otp | newpass
  const [showLoader, setShowLoader] = useState(true)
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', confirm: '' })
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [generatedOtp, setGeneratedOtp] = useState('')
  const minionRef = useRef(null)

  // loader
  useEffect(() => {
    const t = setTimeout(() => setShowLoader(false), 900)
    return () => clearTimeout(t)
  }, [])

  // minion eyes at center of minion, follow mouse, look away when password focused
  useEffect(() => {
    const eyes = document.querySelectorAll('.mrhari-auth .eye')
    const onMove = (e) => {
      const pw = document.querySelector('.mrhari-auth input[type="password"]')
      const isPwFocused = document.activeElement === pw
      eyes.forEach((eye) => {
        if (isPwFocused) {
          eye.style.transform = 'translate(-50%, -50%) translate(-4px, -2px)'
        } else {
          const rect = eye.getBoundingClientRect()
          const ex = rect.left + rect.width / 2
          const ey = rect.top + rect.height / 2
          const dx = e.clientX - ex
          const dy = e.clientY - ey
          const dist = Math.sqrt(dx * dx + dy * dy)
          const max = 3
          const d = Math.min(max, dist)
          const angle = Math.atan2(dy, dx)
          eye.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle) * d}px, ${Math.sin(angle) * d}px)`
        }
      })
    }
    // initialize centered
    eyes.forEach((eye) => { eye.style.transform = 'translate(-50%, -50%)' })
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [mode])

  const handleLogin = async (e) => {
    e.preventDefault()
    setErr(''); setSuccess('')
    try {
      await login(form.email, form.password)
      nav('/mr-hari')
    } catch (ex) { setErr(ex.message) }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setErr('')
    if (form.password !== form.confirm) { setErr('Passwords do not match'); return }
    try {
      await register({ name: form.name, email: form.email, password: form.password, username: form.username })
      setSuccess('Registered! Please login.')
      setTimeout(() => setMode('login'), 1200)
    } catch (ex) { setErr(ex.message) }
  }

  const handleForgotSend = (e) => {
    e.preventDefault()
    if (!form.email) { setErr('Enter email'); return }
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(code)
    setErr(''); setSuccess(`OTP sent to ${form.email} (mock OTP: ${code}) — In real app, EmailJS service_4s8c8ab template_td4hyko would send`)
    setTimeout(() => setMode('otp'), 800)
    // Mock EmailJS
    // emailjs.send('service_4s8c8ab','template_td4hyko',{email_id: form.email, otp_code: code})
  }

  const handleOtpVerify = () => {
    const entered = otp.join('')
    if (entered === generatedOtp) {
      setSuccess('OTP verified! Set new password.')
      setTimeout(() => setMode('newpass'), 800)
    } else {
      setErr('Invalid OTP')
    }
  }

  const handleNewPass = (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setErr('Passwords do not match'); return }
    setSuccess('Password updated! Please login.')
    setTimeout(() => setMode('login'), 1200)
  }

  return (
    <div className="mrhari-auth">
      {showLoader && <div id="loader">LOADING</div>}
      <div className="minion-container">
        <img src="/minion-body.png" alt="minion" className="minion" onError={(e) => e.target.style.display='none'} />
        <div className="eye eye-left"></div>
        <div className="eye eye-right"></div>
      </div>

      <div className="wrapper">
        <div className="title">{mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign in' : mode === 'forgot' ? 'Forgot Password' : mode === 'otp' ? 'Enter OTP' : 'New Password'}</div>

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="field"><input type="text" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><label>Email Address</label></div>
            <div className="field"><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><label>Password</label></div>
            <div className="content">
              <div className="checkbox"><input type="checkbox" id="remember-me" /><label htmlFor="remember-me">Remember me</label></div>
              <div className="pass-link"><a href="#" onClick={(e) => { e.preventDefault(); setMode('forgot') }}>Forgot password?</a></div>
            </div>
            {err && <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{err}</div>}
            {success && <div style={{ color: '#22c55e', fontSize: 13, textAlign: 'center' }}>{success}</div>}
            <div className="field"><input type="submit" value="Login" /></div>
            <div className="signup-link">Not a member? <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup') }}>Signup now</a></div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} style={{ padding: '10px 30px 30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field" style={{ height: 50 }}><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><label>Full Name</label></div>
              <div className="field"><input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /><label>Username</label></div>
              <div className="field"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><label>Email</label></div>
              <div className="field"><input type="text" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><label>Phone Number</label></div>
              <div className="field"><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><label>Password</label></div>
              <div className="field"><input type="password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /><label>Confirm Password</label></div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="radio" name="gender" id="dot-1" defaultChecked /><label htmlFor="dot-1">Male</label>
              <input type="radio" name="gender" id="dot-2" /><label htmlFor="dot-2">Female</label>
              <input type="radio" name="gender" id="dot-3" /><label htmlFor="dot-3">Prefer not to say</label>
            </div>
            {err && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{err}</div>}
            {success && <div style={{ color: '#22c55e', fontSize: 13, textAlign: 'center' }}>{success}</div>}
            <div className="field"><input type="submit" value="Register" /></div>
            <div className="signup-link">Already a member? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login') }}>Login</a></div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotSend} style={{ padding: '20px 30px 30px' }}>
            <div style={{ textAlign: 'left', marginBottom: 12 }}>
              <label style={{ fontWeight: 600, color: '#000' }}>Enter your e-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Your registered email" required style={{ width: '100%', padding: 10, marginTop: 8, border: '1px solid #9b59b6', borderRadius: 5 }} />
            </div>
            {err && <div style={{ color: '#ef4444', fontSize: 13 }}>{err}</div>}
            {success && <div style={{ color: '#22c55e', fontSize: 13 }}>{success}</div>}
            <div className="field"><input type="submit" value="Send OTP" /></div>
            <div className="signup-link"><a href="#" onClick={(e) => { e.preventDefault(); setMode('login') }}>Back to Login</a></div>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={(e) => { e.preventDefault(); handleOtpVerify() }} style={{ padding: '20px 30px 30px' }}>
            <p style={{ textAlign: 'center', color: '#000', marginBottom: 12 }}>Enter OTP sent to your email</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '15px 0' }}>
              {otp.map((v, i) => (
                <input key={i} type="text" maxLength={1} value={v} onChange={(e) => {
                  const nv = [...otp]; nv[i] = e.target.value; setOtp(nv)
                  if (e.target.value && i < 5) document.querySelectorAll('.otp-input')[i + 1]?.focus()
                }} className="otp-input" style={{ width: 40, height: 40, textAlign: 'center', fontSize: 20, border: '2px solid #55525c', background: '#0b0b45', color: '#fff', borderRadius: 5, fontWeight: 700 }} />
              ))}
            </div>
            {err && <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{err}</div>}
            {success && <div style={{ color: '#22c55e', fontSize: 13, textAlign: 'center' }}>{success}</div>}
            <div className="field"><input type="submit" value="Verify OTP" /></div>
          </form>
        )}

        {mode === 'newpass' && (
          <form onSubmit={handleNewPass} style={{ padding: '20px 30px 30px' }}>
            <div className="field"><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><label>New Password</label></div>
            <div className="field"><input type="password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /><label>Confirm Password</label></div>
            {err && <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{err}</div>}
            {success && <div style={{ color: '#22c55e', fontSize: 13, textAlign: 'center' }}>{success}</div>}
            <div className="field"><input type="submit" value="Update Password" /></div>
          </form>
        )}
      </div>
    </div>
  )
}
