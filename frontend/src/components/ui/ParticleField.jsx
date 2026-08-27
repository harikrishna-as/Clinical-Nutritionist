import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

export default function ParticleField({ count = 50, color = '#60A5FA', style = {} }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
    })), [count])

  const lines = useMemo(() => {
    const result = []
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          result.push({ x1: particles[i].x, y1: particles[i].y, x2: particles[j].x, y2: particles[j].y })
        }
      }
    }
    return result
  }, [particles])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, ...style }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {lines.map((l, i) => (
          <line key={`l-${i}`} x1={`${l.x1}%`} y1={`${l.y1}%`} x2={`${l.x2}%`} y2={`${l.y2}%`} stroke={color} strokeOpacity="0.08" strokeWidth="1" />
        ))}
      </svg>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{ y: [0, -30, 10, -20, 0], x: [0, 15, -10, 5, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: '50%', background: color, opacity: 0.4 }}
        />
      ))}
    </div>
  )
}
