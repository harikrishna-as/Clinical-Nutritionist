// Deterministic default avatar helpers.
// Color is picked from a fixed palette by hashing the username/user id,
// so it stays consistent for a user across reloads and devices.

export const AVATAR_COLORS = [
  { bg: '#2563EB', name: 'blue' },
  { bg: '#059669', name: 'green' },
  { bg: '#7C3AED', name: 'purple' },
  { bg: '#EA580C', name: 'orange' },
  { bg: '#0D9488', name: 'teal' },
]

export function avatarColorFor(key) {
  const s = String(key || '?')
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length].bg
}

export function avatarInitial(name, username) {
  const src = (username || name || '?').trim()
  return (src[0] || '?').toUpperCase()
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim())
}

export function passwordStrength(pw) {
  const s = String(pw || '')
  let score = 0
  if (s.length >= 8) score += 1
  if (s.length >= 12) score += 1
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) score += 1
  if (/\d/.test(s)) score += 1
  if (/[^a-zA-Z0-9]/.test(s)) score += 1
  if (score <= 2) return { level: 'weak', label: 'Weak', score }
  if (score <= 3) return { level: 'medium', label: 'Medium', score }
  return { level: 'strong', label: 'Strong', score }
}

export function isStrongPassword(pw) {
  const s = String(pw || '')
  return s.length >= 8 && /[a-zA-Z]/.test(s) && /\d/.test(s)
}
