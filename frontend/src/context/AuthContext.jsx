import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load local fallback first for instant UI
    const saved = localStorage.getItem('cn_dss_user')
    const all = localStorage.getItem('cn_dss_users')
    if (saved) try { setUser(JSON.parse(saved)) } catch {}
    if (all) try { setUsers(JSON.parse(all)) } catch {}

    // If Supabase configured, sync session
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const u = data.session.user
          // fetch profile from profiles table
          supabase.from('profiles').select('*').eq('id', u.id).single().then(({ data: prof }) => {
            const merged = { id: u.id, email: u.email, name: prof?.full_name || u.user_metadata?.full_name || u.email.split('@')[0], profilePic: prof?.avatar_url || null, supabase: true }
            setUser(merged)
            localStorage.setItem('cn_dss_user', JSON.stringify(merged))
          })
        }
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = session.user
          const merged = { id: u.id, email: u.email, name: u.user_metadata?.full_name || u.email.split('@')[0], profilePic: null, supabase: true }
          setUser(merged)
          localStorage.setItem('cn_dss_user', JSON.stringify(merged))
        } else {
          // sign out
        }
      })
      setLoading(false)
      return () => sub.subscription.unsubscribe()
    }
    setLoading(false)
  }, [])

  const persistUsersLocal = (next) => {
    setUsers(next)
    localStorage.setItem('cn_dss_users', JSON.stringify(next))
    fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ users: next }) }).catch(() => {})
    // Also try Supabase if configured (best effort)
    if (isSupabaseConfigured()) {
      fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ users: next, supabase: true }) }).catch(() => {})
    }
  }

  const login = async (email, password) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      const u = data.user
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      const merged = { id: u.id, email: u.email, name: prof?.full_name || u.user_metadata?.full_name || email.split('@')[0], profilePic: prof?.avatar_url || null, supabase: true }
      setUser(merged)
      localStorage.setItem('cn_dss_user', JSON.stringify(merged))
      return merged
    }
    // fallback local
    const found = users.find((u) => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password')
    const withLogin = { ...found, lastLogin: new Date().toISOString() }
    setUser(withLogin)
    localStorage.setItem('cn_dss_user', JSON.stringify(withLogin))
    return withLogin
  }

  const register = async ({ name, email, password }) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) throw new Error(error.message)
      // create profile row (best effort)
      if (data.user) {
        const pic = localStorage.getItem('cn_dss_profile_pic') || null
        await supabase.from('profiles').insert({ id: data.user.id, full_name: name, avatar_url: pic }).then(() => {}, () => {})
        const merged = { id: data.user.id, email, name, profilePic: pic, supabase: true }
        // auto-login if session exists (email confirmation disabled) else still set local
        if (data.session) {
          setUser(merged)
          localStorage.setItem('cn_dss_user', JSON.stringify(merged))
        } else {
          // email confirmation required — still store pending
          localStorage.setItem('cn_dss_pending_user', JSON.stringify(merged))
        }
        return merged
      }
      throw new Error('Registration failed')
    }
    if (users.find((u) => u.email === email)) throw new Error('User already exists')
    const newUser = { id: Date.now().toString(), name, email, password, createdAt: new Date().toISOString(), profilePic: localStorage.getItem('cn_dss_profile_pic') || null }
    const next = [...users, newUser]
    persistUsersLocal(next)
    setUser(newUser)
    localStorage.setItem('cn_dss_user', JSON.stringify(newUser))
    fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', user: newUser }) }).catch(() => {})
    return newUser
  }

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {})
    }
    setUser(null)
    localStorage.removeItem('cn_dss_user')
  }

  const updateProfile = async (patch) => {
    const next = { ...user, ...patch }
    setUser(next)
    localStorage.setItem('cn_dss_user', JSON.stringify(next))
    if (isSupabaseConfigured() && user?.supabase) {
      await supabase.from('profiles').update({ full_name: patch.name, avatar_url: patch.profilePic }).eq('id', user.id).then(() => {}, () => {})
    } else {
      const allNext = users.map((u) => (u.id === next.id ? next : u))
      persistUsersLocal(allNext)
    }
    if (patch.profilePic) localStorage.setItem('cn_dss_profile_pic', patch.profilePic)
  }

  const setProfilePic = async (dataUrl) => {
    localStorage.setItem('cn_dss_profile_pic', dataUrl)
    if (isSupabaseConfigured() && user?.supabase) {
      // upload to Supabase Storage bucket 'avatars' if exists
      try {
        const blob = await (await fetch(dataUrl)).blob()
        const path = `${user.id}/avatar.jpg`
        await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        const publicUrl = data?.publicUrl
        if (publicUrl) {
          await updateProfile({ profilePic: publicUrl })
          return
        }
      } catch {}
    }
    if (user) await updateProfile({ profilePic: dataUrl })
    else {
      // not logged in yet — just store for next register
      localStorage.setItem('cn_dss_profile_pic', dataUrl)
    }
  }

  return (
    <AuthContext.Provider value={{ user, users, login, register, logout, updateProfile, setProfilePic, isAuthenticated: !!user, loading, supabaseConfigured: isSupabaseConfigured() }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
