import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('cn_dss_user')
    const all = localStorage.getItem('cn_dss_users')
    if (saved) setUser(JSON.parse(saved))
    if (all) setUsers(JSON.parse(all))
    // also try to load profile pic
    const pic = localStorage.getItem('cn_dss_profile_pic')
    if (pic && saved) {
      const u = JSON.parse(saved)
      u.profilePic = pic
      setUser(u)
    }
  }, [])

  const persistUsers = (next) => {
    setUsers(next)
    localStorage.setItem('cn_dss_users', JSON.stringify(next))
    // also sync to Vercel mock API (fire and forget)
    fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ users: next }) }).catch(() => {})
  }

  const login = (email, password) => {
    const found = users.find((u) => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password')
    const withLogin = { ...found, lastLogin: new Date().toISOString() }
    setUser(withLogin)
    localStorage.setItem('cn_dss_user', JSON.stringify(withLogin))
    return withLogin
  }

  const register = ({ name, email, password }) => {
    if (users.find((u) => u.email === email)) throw new Error('User already exists')
    const newUser = { id: Date.now().toString(), name, email, password, createdAt: new Date().toISOString(), profilePic: localStorage.getItem('cn_dss_profile_pic') || null }
    const next = [...users, newUser]
    persistUsers(next)
    setUser(newUser)
    localStorage.setItem('cn_dss_user', JSON.stringify(newUser))
    // Vercel persist
    fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', user: newUser }) }).catch(() => {})
    return newUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('cn_dss_user')
  }

  const updateProfile = (patch) => {
    const next = { ...user, ...patch }
    setUser(next)
    localStorage.setItem('cn_dss_user', JSON.stringify(next))
    const allNext = users.map((u) => (u.id === next.id ? next : u))
    persistUsers(allNext)
    if (patch.profilePic) localStorage.setItem('cn_dss_profile_pic', patch.profilePic)
  }

  const setProfilePic = (dataUrl) => {
    localStorage.setItem('cn_dss_profile_pic', dataUrl)
    if (user) updateProfile({ profilePic: dataUrl })
  }

  return (
    <AuthContext.Provider value={{ user, users, login, register, logout, updateProfile, setProfilePic, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
