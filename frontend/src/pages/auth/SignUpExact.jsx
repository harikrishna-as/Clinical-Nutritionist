import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function SignUpExact() {
  const { register } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    let loader
    function loadNow(opacity) {
      if (opacity <= 0) {
        displayContent()
      } else {
        if (loader) loader.style.opacity = opacity
        window.setTimeout(() => loadNow(opacity - 0.5), 100)
      }
    }
    function displayContent() {
      if (loader) loader.style.display = 'none'
      const c = document.getElementById('content')
      if (c) c.style.display = 'block'
    }
    loader = document.getElementById('loader')
    if (loader) loadNow(25)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const name = fd.get('name')
    const username = fd.get('username')
    const email = fd.get('email')
    const phone = fd.get('phone')
    const password = fd.get('password')
    const confirm = fd.get('confirm')
    const gender = fd.get('gender')
    if (password !== confirm) {
      alert('Passwords do not match')
      return
    }
    try {
      await register({ name, username, email, phone, password, gender })
      alert('Registered! Please login.')
      nav('/login')
    } catch (ex) {
      alert(ex.message)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&display=swap');
        .signup-exact * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        .signup-exact { min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 10px; background-color: rgb(11, 11, 45); }
        .signup-exact .container { max-width: 700px; width: 100%; background-color: #fff; padding: 25px 30px; box-shadow: 0px 15px 20px rgba(255, 255, 255, 0.5); border-radius: 15px 15px 15px 15px; }
        .signup-exact .container .title { font-size: 25px; color: rgb(255, 255, 255); font-weight: 500; position: relative; bottom: 25px; scale: 1.095; text-align: center; border-radius: 15px 15px 0 0; background: linear-gradient(-135deg, #c850c0, #4158d0); margin: -25px -30px 0 -30px; padding: 12px 0; }
        .signup-exact .content form .user-details { display: flex; flex-wrap: wrap; justify-content: space-between; margin: 20px 0 12px 0; }
        .signup-exact form .user-details .input-box { margin-bottom: 15px; width: calc(100% / 2 - 20px); }
        .signup-exact form .input-box span.details { display: block; font-weight: 500; margin-bottom: 5px; }
        .signup-exact .user-details .input-box input { height: 45px; width: 100%; outline: none; font-size: 16px; border-radius: 5px; padding-left: 15px; border: 1px solid #ccc; border-bottom-width: 2px; transition: all 0.3s ease; }
        .signup-exact .user-details .input-box input:focus, .signup-exact .user-details .input-box input:valid { border-color: #9b59b6; }
        .signup-exact form .gender-details .gender-title { font-size: 20px; font-weight: 500; }
        .signup-exact form .category { display: flex; width: 80%; margin: 14px 0; justify-content: space-between; }
        .signup-exact form .category label { display: flex; align-items: center; cursor: pointer; }
        .signup-exact form .category label .dot { height: 18px; width: 18px; border-radius: 50%; margin-right: 10px; background: #d9d9d9; border: 5px solid transparent; transition: all 0.3s ease; }
        .signup-exact #dot-1:checked~.category label .one, .signup-exact #dot-2:checked~.category label .two, .signup-exact #dot-3:checked~.category label .three { background: #9b59b6; border-color: #d9d9d9; }
        .signup-exact form input[type="radio"] { display: none; }
        .signup-exact form .button { height: 45px; margin: 35px 0 }
        .signup-exact form .button input { height: 100%; width: 100%; border-radius: 5px; border: none; color: #fff; font-size: 18px; font-weight: 500; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; background: linear-gradient(-135deg, #0892d0, #4B0082); }
        .signup-exact form .button input:hover { background: linear-gradient(-135deg, #0892d0, #4B0082); scale: 1.02; }
        @media(max-width: 584px) { .signup-exact .container { max-width: 100%; } .signup-exact form .user-details .input-box { margin-bottom: 15px; width: 100%; } .signup-exact form .category { width: 100%; } .signup-exact .content form .user-details { max-height: 300px; overflow-y: scroll; } .signup-exact .user-details::-webkit-scrollbar { width: 5px; } }
        @media(max-width: 459px) { .signup-exact .container .content .category { flex-direction: column; } }
        .signup-exact .no-select { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
        .signup-exact #loader{ position: fixed; width: 100%; height: 100%; left:0; top:0; z-index: 50; overflow: visible; background: #0b0b2d url('/i6.gif') no-repeat center center; }
        .signup-exact #content { display: none; }
      `}</style>
      <div className="signup-exact">
        <div id="loader"></div>
          <div id="content" style={{ display: 'none', width: '100%', justifyContent: 'center' }}>
          <div className="no-select">
            <div className="container">
              <div className="title">Sign in</div>
              <div className="content">
                <form onSubmit={handleSubmit}>
                  <div className="user-details">
                    <div className="input-box">
                      <span className="details">Full Name</span>
                      <input type="text" name="name" placeholder="Enter your name" required />
                    </div>
                    <div className="input-box">
                      <span className="details">Username</span>
                      <input type="text" name="username" placeholder="Enter your username" required />
                    </div>
                    <div className="input-box">
                      <span className="details">Email</span>
                      <input type="email" name="email" placeholder="Enter your email" required />
                    </div>
                    <div className="input-box">
                      <span className="details">Phone Number</span>
                      <input type="text" name="phone" placeholder="Enter your number" required />
                    </div>
                    <div className="input-box">
                      <span className="details">Password</span>
                      <input type="password" name="password" placeholder="Enter your password" required />
                    </div>
                    <div className="input-box">
                      <span className="details">Confirm Password</span>
                      <input type="password" name="confirm" placeholder="Confirm your password" required />
                    </div>
                  </div>
                  <div className="gender-details">
                    <input type="radio" name="gender" id="dot-1" defaultChecked />
                    <input type="radio" name="gender" id="dot-2" />
                    <input type="radio" name="gender" id="dot-3" />
                    <span className="gender-title">Gender</span>
                    <div className="category">
                      <label htmlFor="dot-1">
                        <span className="dot one"></span>
                        <span className="gender">Male</span>
                      </label>
                      <label htmlFor="dot-2">
                        <span className="dot two"></span>
                        <span className="gender">Female</span>
                      </label>
                      <label htmlFor="dot-3">
                        <span className="dot three"></span>
                        <span className="gender">Prefer not to say</span>
                      </label>
                    </div>
                  </div>
                  <div className="button">
                    <input type="submit" value="Register" />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
