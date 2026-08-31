import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('cn_dss_user')
    const all = localStorage.getItem('cn_dss_users')
    if (saved) try { setUser(JSON.parse(saved)) } catch {}
    if (all) try { setUsers(JSON.parse(all)) } catch {}

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const u = data.session.user
          supabase.from('profiles').select('*').eq('id', u.id).single().then(({ data: prof }) => {
            const merged = {
              id: u.id,
              email: u.email,
              name: prof?.full_name || u.user_metadata?.full_name || u.email.split('@')[0],
              username: prof?.username || (u.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '_')),
              profilePic: prof?.avatar_url || null,
              supabase: true,
              created_at: prof?.created_at,
              updated_at: prof?.updated_at,
            }
            setUser(merged)
            localStorage.setItem('cn_dss_user', JSON.stringify(merged))
          })
        }
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = session.user
          // will be enriched on next getSession
          const merged = { id: u.id, email: u.email, name: u.user_metadata?.full_name || u.email.split('@')[0], username: (u.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '_')), profilePic: null, supabase: true }
          setUser(prev => ({ ...merged, ...prev }))
          localStorage.setItem('cn_dss_user', JSON.stringify(merged))
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
  }

  const normalizeUsername = (u) => (u || '').trim().toLowerCase()
  const isValidUsername = (u) => /^[a-z0-9_.]{3,20}$/.test(u)

  const checkUsernameAvailable = async (username, currentUserId = null) => {
    const norm = normalizeUsername(username)
    if (!isValidUsername(norm)) return { available: false, reason: 'Username must be 3-20 chars, letters, numbers, _ or .' }
    // check local
    const localExists = users.some((x) => normalizeUsername(x.username) === norm && x.id !== currentUserId)
    if (localExists) return { available: false, reason: 'This username is already taken. Please choose another one.' }
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('profiles').select('id').ilike('username', norm).limit(1)
      if (!error && data && data.length > 0) {
        const found = data[0]
        if (found.id !== currentUserId) return { available: false, reason: 'This username is already taken. Please choose another one.' }
      }
    }
    return { available: true }
  }

  const login = async (email, password) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      const u = data.user
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      const merged = { id: u.id, email: u.email, name: prof?.full_name || u.user_metadata?.full_name || email.split('@')[0], username: prof?.username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '_'), profilePic: prof?.avatar_url || null, supabase: true }
      setUser(merged)
      localStorage.setItem('cn_dss_user', JSON.stringify(merged))
      return merged
    }
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (!found) throw new Error('Invalid email or password')
    const withLogin = { ...found, lastLogin: new Date().toISOString() }
    setUser(withLogin)
    localStorage.setItem('cn_dss_user', JSON.stringify(withLogin))
    return withLogin
  }

  const register = async ({ name, email, password, username }) => {
    const normEmail = email.trim().toLowerCase()
    const normUsername = normalizeUsername(username || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '_').slice(0,20))
    if (!isValidUsername(normUsername)) throw new Error('Username must be 3-20 chars, letters, numbers, _ or .')
    const avail = await checkUsernameAvailable(normUsername)
    if (!avail.available) throw new Error(avail.reason)
    if (users.some((u) => u.email.toLowerCase() === normEmail)) throw new Error('Email already exists')
    if (isSupabaseConfigured()) {
      // check email exists via supabase? signUp will fail if exists
      const { data, error } = await supabase.auth.signUp({ email: normEmail, password, options: { data: { full_name: name, username: normUsername } } })
      if (error) throw new Error(error.message)
      if (data.user) {
        const pic = localStorage.getItem('cn_dss_profile_pic') || null
        // try to insert profile with username/email - will fail if duplicate due to DB unique
        const { error: profErr } = await supabase.from('profiles').upsert({ id: data.user.id, full_name: name, username: normUsername, email: normEmail, avatar_url: pic }, { onConflict: 'id' })
        if (profErr && profErr.message.includes('duplicate')) throw new Error('This username is already taken. Please choose another one.')
        const merged = { id: data.user.id, email: normEmail, name, username: normUsername, profilePic: pic, supabase: true }
        if (data.session) {
          setUser(merged)
          localStorage.setItem('cn_dss_user', JSON.stringify(merged))
        } else {
          localStorage.setItem('cn_dss_pending_user', JSON.stringify(merged))
        }
        return merged
      }
      throw new Error('Registration failed')
    }
    const newUser = { id: Date.now().toString(), name, email: normEmail, username: normUsername, password, createdAt: new Date().toISOString(), profilePic: localStorage.getItem('cn_dss_profile_pic') || null }
    const next = [...users, newUser]
    persistUsersLocal(next)
    setUser(newUser)
    localStorage.setItem('cn_dss_user', JSON.stringify(newUser))
    fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', user: newUser }) }).catch(() => {})
    return newUser
  }

  const logout = async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut().catch(() => {})
    setUser(null)
    localStorage.removeItem('cn_dss_user')
  }

  const updateProfile = async (patch) => {
    // patch may contain: { full_name, username, avatar_url } or { name, username, profilePic }
    const username = patch.username !== undefined ? normalizeUsername(patch.username) : undefined
    const full_name = patch.full_name ?? patch.name
    const avatar_url = patch.avatar_url ?? patch.profilePic

    if (username !== undefined) {
      if (!isValidUsername(username)) throw new Error('Username must be 3-20 chars, letters, numbers, _ or .')
      const avail = await checkUsernameAvailable(username, user?.id)
      if (!avail.available) throw new Error(avail.reason)
    }

    const next = { ...user, ...(full_name !== undefined ? { name: full_name } : {}), ...(username !== undefined ? { username } : {}), ...(avatar_url !== undefined ? { profilePic: avatar_url } : {}), ...(patch.profilePic !== undefined ? { profilePic: patch.profilePic } : {}) }
    setUser(next)
    localStorage.setItem('cn_dss_user', JSON.stringify(next))

    if (isSupabaseConfigured() && user?.supabase) {
      const upd = {}
      if (full_name !== undefined) upd.full_name = full_name
      if (username !== undefined) upd.username = username
      if (avatar_url !== undefined) upd.avatar_url = avatar_url
      if (Object.keys(upd).length) {
        const { error } = await supabase.from('profiles').update(upd).eq('id', user.id)
        if (error) {
          if (error.message.includes('duplicate') || error.code === '23505') throw new Error('This username is already taken. Please choose another one.')
          throw new Error(error.message)
        }
      }
    } else {
      const allNext = users.map((u) => (u.id === next.id ? { ...u, name: next.name, username: next.username, profilePic: next.profilePic } : u))
      persistUsersLocal(allNext)
    }
    if (avatar_url) localStorage.setItem('cn_dss_profile_pic', avatar_url)
    if (patch.profilePic) localStorage.setItem('cn_dss_profile_pic', patch.profilePic)
    return next
  }

  const setProfilePic = async (dataUrl) => {
    localStorage.setItem('cn_dss_profile_pic', dataUrl)
    if (isSupabaseConfigured() && user?.supabase) {
      try {
        const blob = await (await fetch(dataUrl)).blob()
        const path = `${user.id}/avatar.jpg`
        await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        const publicUrl = data?.publicUrl
        if (publicUrl) {
          await updateProfile({ avatar_url: publicUrl })
          return
        }
      } catch {}
    }
    if (user) await updateProfile({ profilePic: dataUrl })
  }

  return (
    <AuthContext.Provider value={{ user, users, login, register, logout, updateProfile, setProfilePic, checkUsernameAvailable, isAuthenticated: !!user, loading, supabaseConfigured: isSupabaseConfigured() }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
