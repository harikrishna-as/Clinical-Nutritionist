import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null
if (url && anon) {
  supabase = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
} else {
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — falling back to localStorage mock. Set them in Vercel Env to enable 24/7 cloud.')
}

export { supabase }
export const isSupabaseConfigured = () => !!supabase

// helper to get project ref from url for display
export const getProjectRef = () => {
  try {
    const u = new URL(url)
    return u.hostname.split('.')[0]
  } catch { return '' }
}
