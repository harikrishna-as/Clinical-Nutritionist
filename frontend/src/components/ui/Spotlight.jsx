import React, { useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function Spotlight({ children, color = 'rgba(96,165,250,0.15)', size = 200, style = {} }) {
  const ref = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 })

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }, [mouseX, mouseY])

  return (
    <div ref={ref} onMouseMove={handleMouseMove} style={{ position: 'relative', height: '100%', width: '100%', ...style }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none', zIndex: 0 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ duration: 0.6 }} style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: '50%', background: color, filter: 'blur(60px)', x: springX, y: springY }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </div>
  )
}
