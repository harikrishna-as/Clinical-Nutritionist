import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MrHariExact() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      await login(email.trim(), password)
      nav('/mr-hari')
    } catch (ex) {
      setErr(ex.message || 'Login failed')
    }
  }
  useEffect(() => {
    // Eye tracking + password focus + loader — exactly as pasted
    const onMove = (e) => {
      const mouseX = e.clientX
      const mouseY = e.clientY
      const eyes = document.querySelectorAll('.mrhari-exact .eye')
      const passwordField = document.querySelector('.mrhari-exact input[type="password"]')
      const isPasswordFocused = document.activeElement === passwordField
      if (isPasswordFocused) {
        eyes.forEach((eye) => { eye.style.transform = `translate(-4px, -2px)` })
      } else {
        eyes.forEach((eye) => {
          const rect = eye.getBoundingClientRect()
          const ex = rect.left + rect.width / 2
          const ey = rect.top + rect.height / 2
          const dx = mouseX - ex
          const dy = mouseY - ey
          const dist = Math.sqrt(dx * dx + dy * dy)
          const max = 3
          const d = Math.min(max, dist)
          const angle = Math.atan2(dy, dx)
          eye.style.transform = `translate(${Math.cos(angle) * d}px, ${Math.sin(angle) * d}px)`
        })
      }
    }
    document.addEventListener('mousemove', onMove)
    let loader
    function loadNow(opacity) {
      if (opacity <= 0) {
        if (loader) loader.style.display = 'none'
        const c = document.getElementById('content')
        if (c) c.style.display = 'block'
      } else {
        if (loader) loader.style.opacity = opacity
        window.setTimeout(() => loadNow(opacity - 0.5), 100)
      }
    }
    const onDom = () => {
      loader = document.getElementById('loader')
      if (loader) loadNow(0.1)
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onDom)
    else onDom()
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('DOMContentLoaded', onDom)
    }
  }, [])

  return (
    <div className="mrhari-exact">
      <style>{`
@import url('https://fonts.googleapis.com/css?family=Poppins:400,500,600,700&display=swap');
.mrhari-exact * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
.mrhari-exact { display: flex; flex-direction: column; min-height: 100vh; width: 100%; justify-content: center; align-items: center; background-color: #0b0b2d; overflow-x: hidden; padding: 20px; }
.mrhari-exact .minion-container { position: relative; width: 100px; height: 100px; margin-bottom: 30px; z-index: 10; top: 100px; }
.mrhari-exact .minion { position: relative; height: 80px; width: 80px; top: 30px; left: -140px; transform: translateX(-50%); }
.mrhari-exact .eye { position: relative; width: 10px; height: 10px; border-radius: 50%; background-color: black; z-index: 200; transition: transform 0.1s ease; }
.mrhari-exact .eye-left { top: -22%; left: -158%; }
.mrhari-exact .eye-right { top: -32%; left: -132%; }
.mrhari-exact .wrapper { width: 500px; max-width: 1000%; max-height: 100%; background: #ffffff; border-radius: 15px; box-shadow: 0px 15px 20px rgba(255, 255, 255, 0.5); margin-top: 30px; position: relative; top: -50px; }
.mrhari-exact .wrapper .title { font-size: 35px; font-weight: 600; text-align: center; line-height: 100px; color: #fff; user-select: none; border-radius: 15px 15px 0 0; background: linear-gradient(-135deg, #0892d0, #4B0082); }
.mrhari-exact .wrapper form { padding: 10px 30px 50px 30px; }
.mrhari-exact .wrapper form .field { height: 50px; width: 100%; margin-top: 20px; position: relative; }
.mrhari-exact .wrapper form .field input { height: 100%; width: 100%; outline: none; font-size: 17px; padding-left: 20px; border: 1px solid lightgrey; border-radius: 25px; transition: all 0.3s ease; }
.mrhari-exact .wrapper form .field input:focus, .mrhari-exact form .field input:valid { border-color: #4158d0; }
.mrhari-exact .wrapper form .field label { position: absolute; top: 50%; left: 20px; color: #999999; font-weight: 400; font-size: 17px; pointer-events: none; transform: translateY(-50%); transition: all 0.3s ease; }
.mrhari-exact form .field input:focus ~ label, .mrhari-exact form .field input:valid ~ label { top: 0%; font-size: 16px; color: #4158d0; background: #fff; transform: translateY(-50%); }
.mrhari-exact form .content { display: flex; width: 100%; height: 50px; font-size: 16px; align-items: center; justify-content: space-around; }
.mrhari-exact form .content .checkbox { display: flex; align-items: center; justify-content: center; }
.mrhari-exact form .content input { width: 15px; height: 15px; background: red; }
.mrhari-exact form .content label { color: #262626; user-select: none; padding-left: 5px; }
.mrhari-exact form .field input[type="submit"] { color: #fff; border: none; padding-left: 0; margin-top: -10px; font-size: 20px; font-weight: 500; cursor: pointer; background: linear-gradient(-135deg, #0892d0, #4B0082); transition: all 0.3s ease; }
.mrhari-exact form .field input[type="submit"]:active { transform: scale(0.95); }
.mrhari-exact form .signup-link { color: #262626; margin-top: 20px; text-align: center; }
.mrhari-exact form .pass-link a, .mrhari-exact form .signup-link a { color: #4158d0; text-decoration: none; }
.mrhari-exact form .pass-link a:hover, .mrhari-exact form .signup-link a:hover { text-decoration: underline; }
@media (max-width: 480px) { .mrhari-exact .wrapper .title { font-size: 25px; line-height: 80px; } .mrhari-exact .wrapper form { padding: 10px 20px 40px 20px; } }
.mrhari-exact .no-select { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
.mrhari-exact #loader{ position: fixed; width: 100%; height: 100%; left:0; top:0; z-index: 50; overflow: visible; background: #0b0b2d url('/i6.gif') no-repeat center center; }
@media (max-width: 480px) { .mrhari-exact .wrapper .title { font-size: 25px; line-height: 80px; } }
      `}</style>
      <div className="no-select"></div>
      <div id="loader"></div>
      <div id="content" style={{ display: 'none', width: '100%', flexDirection: 'column', alignItems: 'center' }}></div>
      <div className="minion-container">
        <img src="/minion-body.png" className="minion" alt="minion" onError={(e) => (e.target.style.display = 'none')} />
        <div className="eye eye-left"></div>
        <div className="eye eye-right"></div>
      </div>
      <div className="wrapper">
        <div className="title">Login</div>
        <form action="#" onSubmit={handleLogin}>
          <div className="field">
            <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <label>Email Address</label>
          </div>
          <div className="field">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <label>Password</label>
          </div>
          <div className="content">
            <div className="checkbox">
              <input type="checkbox" id="remember-me" />
              <label htmlFor="remember-me">Remember me</label>
            </div>
            <div className="pass-link">
              <a href="/forgot-password">Forgot password?</a>
            </div>
          </div>
          {err && <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 10 }}>{err}</div>}
          <div className="field">
            <input type="submit" value="Login" />
          </div>
          <div className="signup-link">
            Not a member? <a href="/register">Signup now</a>
          </div>
        </form>
      </div>
    </div>
  )
}
