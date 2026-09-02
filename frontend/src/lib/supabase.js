import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isPlaceholder = (v) => !v || v.includes('placeholder') || v.includes('your-') || v.length < 20 || !v.startsWith('eyJ')
let supabase = null
if (url && anon && !isPlaceholder(anon) && !isPlaceholder(url) && url.startsWith('http')) {
  try {
    supabase = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  } catch (e) {
    console.warn('[supabase] createClient failed, falling back to localStorage', e)
    supabase = null
  }
} else {
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set or placeholder — falling back to localStorage mock. Set real keys in Vercel Env (Supabase Dashboard → Settings → API → anon public) to enable 24/7 cloud.')
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
