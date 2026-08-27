import React, { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const PIXELS_PER_UNIT = 80

function DialItem({ value, pixelsPerUnit, scrollX }) {
  const isHalf = value % 1 !== 0
  const itemX = value * pixelsPerUnit
  const distance = useTransform(scrollX, (s) => Math.abs(s + itemX))
  const opacity = useTransform(distance, [0, pixelsPerUnit * 2, pixelsPerUnit * 3], [1, 0.4, 0])
  const color = useTransform(distance, [0, pixelsPerUnit], ['#F3F4F6', '#1e3a8a'])
  const scale = useTransform(distance, [0, pixelsPerUnit * 2], [1, 0.85])
  const yOffset = useTransform(distance, [0, pixelsPerUnit * 0.5, pixelsPerUnit, pixelsPerUnit * 1.5, pixelsPerUnit * 2, pixelsPerUnit * 3], [0, 2, 7, 17, 32, 54])
  const rotate = useTransform(scrollX, (s) => ((s + itemX) / pixelsPerUnit) * 12)

  return (
    <motion.div style={{ position: 'absolute', top: 0, left: itemX, x: '-50%', opacity, scale, y: yOffset, rotate, transformOrigin: 'center 140px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.span style={{ fontSize: 56, fontWeight: 700, color, visibility: isHalf ? 'hidden' : 'visible' }}>
        {Math.floor(value)}
      </motion.span>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: 'rgba(96,165,250,0.2)' }} />
      </div>
    </motion.div>
  )
}

export default function WeightWidget({ initialValue = 25, min = 0, max = 100, onChange, unit = 'kg' }) {
  const x = useMotionValue(-initialValue * PIXELS_PER_UNIT)
  const springX = useSpring(x, { bounce: 0.45 })
  const [displayValue, setDisplayValue] = useState(initialValue)
  const dragStartX = useRef(x.get())

  useEffect(() => {
    const unsub = springX.on('change', (latest) => {
      const val = Math.round(Math.abs(latest / PIXELS_PER_UNIT))
      if (val !== displayValue) {
        setDisplayValue(val)
        onChange?.(val)
      }
    })
    return unsub
  }, [springX, displayValue, onChange])

  const handlePanStart = () => { dragStartX.current = x.get() }
  const handlePan = (_, info) => {
    const offset = Math.max(-PIXELS_PER_UNIT, Math.min(PIXELS_PER_UNIT, info.offset.x * 0.6))
    const newX = dragStartX.current + offset
    const minX = -max * PIXELS_PER_UNIT
    const maxX = -min * PIXELS_PER_UNIT
    x.set(Math.max(minX, Math.min(maxX, newX)))
  }
  const handlePanEnd = (_, info) => {
    const base = Math.round(dragStartX.current / -PIXELS_PER_UNIT)
    let dir = 0
    if (info.offset.x < -20 || info.velocity.x < -100) dir = 1
    else if (info.offset.x > 20 || info.velocity.x > 100) dir = -1
    const target = Math.max(min, Math.min(max, base + dir))
    x.set(-target * PIXELS_PER_UNIT)
  }

  const items = []
  const buffer = 5
  for (let i = Math.max(min, displayValue - buffer); i <= Math.min(max, displayValue + buffer); i += 0.5) items.push(i)

  return (
    <div style={{ position: 'relative', width: 220, height: 220, borderRadius: 28, border: '2px solid rgba(96,165,250,0.2)', background: '#151d30', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', userSelect: 'none' }}>
      <div style={{ marginTop: 20, fontSize: 16, fontWeight: 600, color: '#A78BFA', textTransform: 'capitalize' }}>Weight ({unit})</div>
      <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <motion.div
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          style={{ position: 'absolute', x: springX, left: '50%', width: '100%', height: '100%', cursor: 'grab' }}
          drag="x"
          dragConstraints={{ left: -(max * PIXELS_PER_UNIT), right: -(min * PIXELS_PER_UNIT) }}
        >
          {items.map((i) => <DialItem key={i} value={i} pixelsPerUnit={PIXELS_PER_UNIT} scrollX={springX} />)}
        </motion.div>
        <div style={{ position: 'absolute', bottom: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#A78BFA', marginBottom: 6 }} />
          <svg style={{ width: 10, height: 36 }} viewBox="0 0 10 36" fill="none">
            <path d="M 5 2 L 9 36 L 1 36 Z" fill="#A78BFA" stroke="#A78BFA" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
