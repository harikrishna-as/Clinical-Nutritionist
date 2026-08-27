import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'

const COLORS = [
  { id: 'green', bg: '#22c55e', light: 'rgba(34,197,94,0.15)' },
  { id: 'blue', bg: '#3b82f6', light: 'rgba(59,130,246,0.15)' },
  { id: 'purple', bg: '#60A5FA', light: 'rgba(96,165,250,0.15)' },
  { id: 'orange', bg: '#f97316', light: 'rgba(249,115,22,0.15)' },
  { id: 'red', bg: '#ef4444', light: 'rgba(239,68,68,0.15)' },
]
const spring = { type: 'spring', stiffness: 400, damping: 40, mass: 1 }

export default function EditBadge({ initialBadge = { text: 'Active', color: 'green' }, onChange }) {
  const [badge, setBadge] = useState(initialBadge)
  const [temp, setTemp] = useState(initialBadge)
  const [editing, setEditing] = useState(false)
  const ref = useRef(null)
  const col = COLORS.find((c) => c.id === badge.color) || COLORS[0]

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setEditing(false) }
    if (editing) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editing])

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
      <MotionConfig transition={spring}>
        <AnimatePresence>
          {!editing ? (
            <motion.div layoutId="badge-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.span layoutId="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: col.light, color: col.bg, fontSize: 13, fontWeight: 700 }}>
                {badge.text}
              </motion.span>
              <button onClick={() => { setTemp(badge); setEditing(true) }} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(30,41,59,0.6)', color: '#60A5FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✎</button>
            </motion.div>
          ) : (
            <motion.div layoutId="badge-wrap" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', zIndex: 20, width: 280, background: '#151d30', borderRadius: 20, border: '1.5px solid rgba(96,165,250,0.3)', padding: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#A78BFA' }}>Edit Badge</span>
                <button onClick={() => setEditing(false)} style={{ background: 'rgba(96,165,250,0.2)', border: 'none', color: '#A78BFA', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
              <input value={temp.text} onChange={(e) => setTemp({ ...temp, text: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid rgba(96,165,250,0.3)', background: '#0d0722', color: '#F3F4F6', fontSize: 14, fontWeight: 600, outline: 'none', marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {COLORS.map((c) => (
                  <button key={c.id} onClick={() => setTemp({ ...temp, color: c.id })} style={{ width: 28, height: 28, borderRadius: '50%', background: c.bg, border: temp.color === c.id ? '3px solid #F3F4F6' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
              <button onClick={() => { setBadge(temp); onChange?.(temp); setEditing(false) }} style={{ width: '100%', padding: 10, borderRadius: 12, border: 'none', background: '#3B82F6', color: '#F3F4F6', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Update</button>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  )
}
