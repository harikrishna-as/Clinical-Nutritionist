import React from 'react'
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion'

// Podium-style scroll progress rail: a thin strip pinned to the top of the
// viewport that fills 0..100% as the page scrolls. Hidden entirely under
// prefers-reduced-motion; the strip itself never animates on hover.
export default function ScrollProgress() {
  const prefersReduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.4 })

  if (prefersReduced) return null

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX }}
      aria-hidden="true"
    />
  )
}