import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

const SESSION_KEY = 'cn_dss_user'

function readStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeStoredSession(user, remember) {
  try {
    if (remember) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      sessionStorage.removeItem(SESSION_KEY)
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
      localStorage.removeItem(SESSION_KEY)
    }
  } catch {}
}

function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = readStoredSession()
    const all = localStorage.getItem('cn_dss_users')
    if (saved) setUser(saved)
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
            writeStoredSession(merged, true)
          })
        }
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = session.user
          const merged = { id: u.id, email: u.email, name: u.user_metadata?.full_name || u.email.split('@')[0], username: (u.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '_')), profilePic: null, supabase: true }
          setUser(prev => ({ ...merged, ...prev }))
          writeStoredSession(merged, true)
        }
      })
      setLoading(false)
      return () => sub.subscription.unsubscribe()
    }
    setLoading(false)
  }, [])

  const persistUsersLocal = (next) => {
    setUsers(next)
    try { localStorage.setItem('cn_dss_users', JSON.stringify(next)) } catch {}
    fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ users: next }) }).catch(() => {})
  }

  const normalizeUsername = (u) => (u || '').trim().toLowerCase()
  const isValidUsername = (u) => /^[a-z0-9_.]{3,20}$/.test(u)

  const checkUsernameAvailable = async (username, currentUserId = null) => {
    const norm = normalizeUsername(username)
    if (!isValidUsername(norm)) return { available: false, reason: 'Username must be 3-20 chars, letters, numbers, _ or .' }
    const localExists = users.some((x) => normalizeUsername(x.username) === norm && x.id !== currentUserId)
    if (localExists) return { available: false, reason: 'This username is already taken. Please choose another one.' }
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('profiles').select('id').ilike('username', norm).limit(1)
        if (!error && data && data.length > 0 && data[0].id !== currentUserId) {
          return { available: false, reason: 'This username is already taken. Please choose another one.' }
        }
      } catch {}
    }
    return { available: true }
  }

  const checkEmailAvailable = async (email, currentUserId = null) => {
    const norm = String(email || '').trim().toLowerCase()
    if (users.some((x) => String(x.email || '').toLowerCase() === norm && x.id !== currentUserId)) {
      return { available: false, reason: 'An account with this email already exists.' }
    }
    return { available: true }
  }

  const resolveEmailForIdentifier = async (identifier) => {
    const id = String(identifier || '').trim()
    if (id.includes('@')) return id
    const norm = id.toLowerCase()
    const local = users.find((u) => normalizeUsername(u.username) === norm)
    if (local) return local.email
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('profiles').select('email').ilike('username', norm).limit(1).single()
        if (data?.email) return data.email
      } catch {}
    }
    return id
  }

  const login = async (identifier, password, remember = true) => {
    const id = String(identifier || '').trim()
    if (isSupabaseConfigured()) {
      try {
        const email = await resolveEmailForIdentifier(id)
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
        const u = data.user
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).single()
        const merged = {
          id: u.id,
          email: u.email,
          name: prof?.full_name || u.user_metadata?.full_name || email.split('@')[0],
          username: prof?.username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '_'),
          profilePic: prof?.avatar_url || null,
          supabase: true,
        }
        setUser(merged)
        writeStoredSession(merged, remember)
        return merged
      } catch (e) {
        // fall through to local check so a clear message is shown
        if (e.message && !e.message.includes('Invalid login')) throw e
      }
    }
    const norm = id.toLowerCase()
    const found = users.find((u) => String(u.email || '').toLowerCase() === norm || normalizeUsername(u.username) === norm)
    if (!found || found.password !== password) throw new Error('Invalid email/username or password.')
    const withLogin = { ...found, lastLogin: new Date().toISOString() }
    delete withLogin.password
    setUser(withLogin)
    writeStoredSession(withLogin, remember)
    return withLogin
  }

  const register = async ({ name, email, password, username, phone, dob, age }) => {
    const normEmail = String(email || '').trim().toLowerCase()
    const normUsername = normalizeUsername(username || String(name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '_').slice(0, 20))
    if (!isValidUsername(normUsername)) throw new Error('Username must be 3-20 chars, letters, numbers, _ or .')
    const avail = await checkUsernameAvailable(normUsername)
    if (!avail.available) throw new Error(avail.reason)
    const emailAvail = await checkEmailAvailable(normEmail)
    if (!emailAvail.available) throw new Error(emailAvail.reason)
    if (phone && !/^\+?[0-9]{7,15}$/.test(String(phone).replace(/\s/g, ''))) throw new Error('Phone must be 7-15 digits')
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({ email: normEmail, password, options: { data: { full_name: name, username: normUsername, phone, dob, age } } })
      if (error) throw new Error(error.message)
      if (data.user) {
        const pic = null
        try {
          const { error: profErr } = await supabase.from('profiles').upsert({ id: data.user.id, full_name: name, username: normUsername, email: normEmail, avatar_url: pic, phone: phone || null, dob: dob || null, age: age ? parseInt(age) : null }, { onConflict: 'id' })
          if (profErr && String(profErr.message || '').includes('duplicate')) throw new Error('This username is already taken. Please choose another one.')
        } catch (e) {
          if (e.message && e.message.includes('already taken')) throw e
        }
        const merged = { id: data.user.id, email: normEmail, name, username: normUsername, phone, dob, age, profilePic: pic, supabase: true }
        if (data.session) {
          setUser(merged)
          writeStoredSession(merged, true)
        }
        return merged
      }
      throw new Error('Registration failed')
    }
    const newUser = { id: Date.now().toString(), name, email: normEmail, username: normUsername, phone, dob, age, password, createdAt: new Date().toISOString(), profilePic: null }
    const next = [...users, newUser]
    persistUsersLocal(next)
    const sessionUser = { ...newUser }
    delete sessionUser.password
    setUser(sessionUser)
    writeStoredSession(sessionUser, true)
    fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', user: { ...newUser, password: undefined } }) }).catch(() => {})
    return sessionUser
  }

  const logout = async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut().catch(() => {})
    setUser(null)
    clearStoredSession()
  }

  const updateProfile = async (patch) => {
    const username = patch.username !== undefined ? normalizeUsername(patch.username) : undefined
    const full_name = patch.full_name ?? patch.name
    const avatar_url = patch.avatar_url ?? patch.profilePic

    if (username !== undefined) {
      if (!isValidUsername(username)) throw new Error('Username must be 3-20 chars, letters, numbers, _ or .')
      const avail = await checkUsernameAvailable(username, user?.id)
      if (!avail.available) throw new Error(avail.reason)
    }

    const next = { ...user, ...(full_name !== undefined ? { name: full_name } : {}), ...(username !== undefined ? { username } : {}), ...(avatar_url !== undefined ? { profilePic: avatar_url } : {}) }
    setUser(next)
    try {
      const remember = !!localStorage.getItem(SESSION_KEY)
      writeStoredSession(next, remember)
    } catch {}
    if (localStorage.getItem('cn_dss_profile_pic') && avatar_url === undefined) {
      // keep existing stored pic in sync
    }

    if (isSupabaseConfigured() && user?.supabase) {
      const upd = {}
      if (full_name !== undefined) upd.full_name = full_name
      if (username !== undefined) upd.username = username
      if (avatar_url !== undefined) upd.avatar_url = avatar_url
      if (Object.keys(upd).length) {
        const { error } = await supabase.from('profiles').update(upd).eq('id', user.id)
        if (error) {
          if (String(error.message || '').includes('duplicate') || error.code === '23505') throw new Error('This username is already taken. Please choose another one.')
          throw new Error(error.message)
        }
      }
    } else {
      const allNext = users.map((u) => (u.id === next.id ? { ...u, name: next.name, username: next.username, profilePic: next.profilePic } : u))
      persistUsersLocal(allNext)
    }
    if (avatar_url) try { localStorage.setItem('cn_dss_profile_pic', avatar_url) } catch {}
    return next
  }

  const setProfilePic = async (dataUrl) => {
    try { localStorage.setItem('cn_dss_profile_pic', dataUrl) } catch {}
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

  const removeProfilePic = async () => {
    try { localStorage.removeItem('cn_dss_profile_pic') } catch {}
    if (isSupabaseConfigured() && user?.supabase) {
      try {
        await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`])
      } catch {}
      await updateProfile({ avatar_url: null })
      return
    }
    if (user) await updateProfile({ profilePic: null })
  }

  return (
    <AuthContext.Provider value={{ user, users, login, register, logout, updateProfile, setProfilePic, removeProfilePic, checkUsernameAvailable, checkEmailAvailable, isAuthenticated: !!user, loading, supabaseConfigured: isSupabaseConfigured() }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
