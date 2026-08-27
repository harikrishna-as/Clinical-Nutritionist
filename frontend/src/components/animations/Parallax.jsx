import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

// Scroll-linked parallax wrapper: children move at a fraction of the page
// scroll speed. `from`/`to` are pixel offsets applied across the section's
// travel through the viewport (start entering bottom -> leaving top).
// Under prefers-reduced-motion children render in place.
export default function Parallax({
  children,
  from = 0,
  to = -70,
  className = '',
  style = {},
}) {
  const prefersReduced = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [from, to])

  if (prefersReduced) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    )
  }

  return (
    <motion.div ref={ref} className={className} style={{ y, willChange: 'transform', ...style }}>
      {children}
    </motion.div>
  )
}