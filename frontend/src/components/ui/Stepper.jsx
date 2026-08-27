import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const digitVariants = {
  initial: (dir) => ({ y: dir > 0 ? 20 : -20, opacity: 0, scale: 0.5, filter: 'blur(2px)' }),
  animate: { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: (dir) => ({ y: dir > 0 ? -20 : 20, opacity: 0, scale: 0.5, filter: 'blur(2px)' }),
}

export default function Stepper({ value, defaultValue = 0, min = 0, max = 999, onChange, label }) {
  const isControlled = value !== undefined
  const [internal, setInternal] = useState(defaultValue)
  const [direction, setDirection] = useState(0)
  const [ticks, setTicks] = useState([])
  const current = isControlled ? value : internal
  const digits = current.toString().split('')

  // Track per-digit ticks for animation keys
  if (ticks.length !== digits.length || ticks.some((t, i) => t !== digits[i])) {
    setTicks([...digits])
  }

  const step = (dir) => {
    const next = Math.min(max, Math.max(min, current + dir))
    if (next === current) return
    setDirection(dir)
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  const btnStyle = {
    width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(96,165,250,0.15)', color: '#A78BFA', fontSize: 20, fontWeight: 700,
    transition: 'background 0.2s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {label && <span style={{ fontSize: 14, color: '#A78BFA', fontWeight: 600 }}>{label}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', borderRadius: 999, border: '2px solid rgba(96,165,250,0.25)', background: 'rgba(30,41,59,0.5)' }}>
        <motion.button whileTap={{ scale: 0.9 }} style={btnStyle} onClick={() => step(-1)} disabled={current <= min}>−</motion.button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 24, fontWeight: 700, color: '#F3F4F6', minWidth: 48, justifyContent: 'center' }}>
          {digits.map((d, i) => (
            <div key={`${i}-${digits.length}`} style={{ position: 'relative', width: 18, height: 32, overflow: 'hidden' }}>
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.span
                  key={`${d}-${i}`}
                  custom={direction}
                  variants={digitVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 200, damping: 16, mass: 1.2 }}
                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontVariantNumeric: 'tabular-nums' }}
                >
                  {d}
                </motion.span>
              </AnimatePresence>
            </div>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} style={btnStyle} onClick={() => step(1)} disabled={current >= max}>+</motion.button>
      </div>
    </div>
  )
}
