import React from 'react'
import { motion } from 'framer-motion'

export default function InfiniteSlider({ children, speed = 30, gap = 24 }) {
  const items = React.Children.toArray(children)
  return (
    <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
      <motion.div
        style={{ display: 'flex', gap, width: 'fit-content' }}
        animate={{ x: [0, -(items.length * (200 + gap))] }}
        transition={{ x: { repeat: Infinity, repeatType: 'loop', duration: speed, ease: 'linear' } }}
      >
        {items}
        {items}
      </motion.div>
    </div>
  )
}

export function InfiniteSliderItem({ children, width = 200, style = {} }) {
  return (
    <div style={{ width, flexShrink: 0, ...style }}>
      {children}
    </div>
  )
}
