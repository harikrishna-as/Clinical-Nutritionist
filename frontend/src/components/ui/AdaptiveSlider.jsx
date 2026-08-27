import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// AnimatedText component for digit-by-digit animation
function AnimatedText({ value, style }) {
  return (
    <div style={{ display: 'flex', overflow: 'hidden', ...style }}>
      <AnimatePresence mode="popLayout" initial={false}>
        {value.split('').map((char, index) => (
          <motion.span
            key={char + index}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 0, scale: 1, transition: { duration: 0 } }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {char}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

function getColorSettings(value, min, max) {
  const pct = (value - min) / (max - min)
  if (pct < 0.5) return { text: '#10B981', gradient: 'linear-gradient(to right, #10B981, #10B981)', thumbBorder: '#10B981' }
  if (pct < 0.7) return { text: '#FE55B7', gradient: 'linear-gradient(to right, #FE55B74D, #FE55B7)', thumbBorder: '#F97316' }
  return { text: '#3b82f6', gradient: 'linear-gradient(to right, #93c5fd, #3B82F6)', thumbBorder: '#3b82f6' }
}

export default function AdaptiveSlider({
  value,
  min = 50,
  max = 350,
  step = 25,
  defaultValue = 200,
  onChange,
  label = 'Calories',
  unit = 'kCal',
}) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const current = value ?? internalValue
  const colorSettings = useMemo(() => getColorSettings(current, min, max), [current, min, max])
  const percentage = ((current - min) / (max - min)) * 100

  const dots = useMemo(() => Array.from({ length: 6 }).map((_, i) => (
    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#C4B5FD', opacity: 0.8 }} />
  )), [])

  const handleChange = useCallback((e) => {
    const val = Number(e.target.value)
    setInternalValue(val)
    onChange?.(val)
  }, [onChange])

  return (
    <div style={styles.card}>
      <span style={styles.label}>{label}</span>
      <div style={styles.valueRow}>
        <AnimatedText value={current.toString()} style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1 }} />
        <span style={{ fontSize: 24, fontWeight: 800, color: '#F3F4F6' }}>{unit}</span>
      </div>
      <div style={styles.track}>
        <div style={styles.dotsRow}>{dots}</div>
        <motion.div
          style={{ ...styles.fill, background: colorSettings.gradient }}
          animate={{ width: `calc((${percentage} / 100) * (100% - 52px) + 52px)` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={handleChange}
          style={styles.input}
        />
        <motion.div
          style={styles.thumbOuter}
          animate={{ left: `calc((${percentage} / 100) * (100% - 52px))` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div style={styles.thumb} />
        </motion.div>
      </div>
    </div>
  )
}

const styles = {
  card: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#151d30', borderRadius: 36, padding: '28px 40px', width: 'min(320px, 100%)', border: '1px solid rgba(96,165,250,0.2)', userSelect: 'none' },
  label: { fontSize: 20, fontWeight: 700, color: '#A78BFA', marginBottom: 8 },
  valueRow: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 28, color: '#F3F4F6' },
  track: { position: 'relative', width: '100%', height: 52, borderRadius: 999, background: 'rgba(96,165,250,0.1)', overflow: 'hidden' },
  dotsRow: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', pointerEvents: 'none', zIndex: 1 },
  fill: { position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 999 },
  input: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 50 },
  thumbOuter: { position: 'absolute', top: 0, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 40 },
  thumb: { width: 40, height: 40, borderRadius: '50%', background: 'white', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' },
}