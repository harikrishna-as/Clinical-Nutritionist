import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function GlassCard({ children, hover = true, style = {}, glowColor = 'rgba(96,165,250,0.1)' }) {
  const ref = useRef(null)
  const [isHover, setIsHover] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 })

  const handleMouse = (e) => {
    if (!ref.current || !hover) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => { setIsHover(false); mouseX.set(0); mouseY.set(0) }}
      style={{ background: 'rgba(30,41,59,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden', transformStyle: 'preserve-3d', perspective: 800, ...(hover ? { rotateX, rotateY } : {}), ...style }}
    >
      {isHover && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: 'absolute', inset: -1, borderRadius: 20, background: `radial-gradient(400px circle at ${mouseX.get() * 100 + 50}% ${mouseY.get() * 100 + 50}%, ${glowColor}, transparent 60%)`, pointerEvents: 'none', zIndex: 0 }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  )
}
