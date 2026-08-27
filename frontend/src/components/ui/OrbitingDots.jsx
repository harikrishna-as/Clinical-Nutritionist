import React from 'react'
import { motion } from 'framer-motion'

export default function OrbitingDots({ count = 8, size = 120, dotSize = 8, color = '#60A5FA', duration = 3, style = {} }) {
  const radius = (size - dotSize) / 2
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration, repeat: Infinity, ease: 'linear' }} style={{ width: size, height: size, position: 'relative', ...style }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2
        const x = Math.cos(angle) * radius + radius
        const y = Math.sin(angle) * radius + radius
        const opacity = 1 - (i / count) * 0.6
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: dotSize, height: dotSize, borderRadius: '50%', background: color, opacity, transform: 'translate(-50%, -50%)' }} />
        )
      })}
    </motion.div>
  )
}
