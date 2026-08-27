import React, { useRef, useEffect } from 'react'
import { motion, useScroll, useVelocity, useSpring, useTransform, useReducedMotion } from 'framer-motion'

// Infinite auto-scrolling marquee row. Duplicates children for a seamless loop.
// `skew` adds a scroll-velocity tilt. Under prefers-reduced-motion the row
// renders statically (the loop collapses, the tilt is removed).
export default function Marquee({ children, speed = 30, reverse = false, pauseOnHover = true, skew = false }) {
  const prefersReduced = useReducedMotion()
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const total = el.scrollWidth / 2
    const dur = total / speed
    el.style.setProperty('--marquee-duration', `${dur}s`)
  }, [speed, children])

  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const spring = useSpring(velocity, { damping: 60, stiffness: 500, mass: 0.6 })
  const skewX = useTransform(spring, [-1800, 1800], [2.6, -2.6])

  if (prefersReduced) {
    return (
      <div ref={ref} className="marquee">
        <div className="marquee-track marquee-reduced">
          <div className="marquee-content">{children}</div>
        </div>
      </div>
    )
  }

  const inner = (
    <div
      ref={ref}
      className="marquee"
      style={{
        '--direction': reverse ? 'reverse' : 'normal',
        ...(pauseOnHover ? { cursor: 'pointer' } : {}),
      }}
      onMouseEnter={(e) => pauseOnHover && (e.currentTarget.style.animationPlayState = 'paused')}
      onMouseLeave={(e) => pauseOnHover && (e.currentTarget.style.animationPlayState = 'running')}
    >
      <div className="marquee-track">
        <div className="marquee-content">{children}</div>
        <div className="marquee-content" aria-hidden="true">{children}</div>
      </div>
    </div>
  )

  if (!skew) return inner

  return <motion.div style={{ skewX, willChange: 'transform' }}>{inner}</motion.div>
}

export function MarqueeItem({ icon, label, color = '#A78BFA' }) {
  const Icon = icon
  return (
    <div className="marquee-item">
      {Icon && <Icon size={16} color={color} />}
      <span>{label}</span>
    </div>
  )
}