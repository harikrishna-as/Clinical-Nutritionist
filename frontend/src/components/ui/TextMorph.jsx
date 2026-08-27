import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TextMorph({ children, style = {} }) {
  const text = typeof children === 'string' ? children : ''
  return (
    <div style={{ display: 'inline-flex', overflow: 'hidden', ...style }}>
      <AnimatePresence mode="popLayout" initial={false}>
        {text.split('').map((char, i) => {
          const displayChar = char === ' ' ? '\u00A0' : char
          return (
            <motion.span
              key={`${char}-${i}`}
              initial={{ opacity: 0, y: 20, rotateX: 90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -20, rotateX: -90 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.02 }}
              style={{ display: 'inline-block' }}
            >
              {displayChar}
            </motion.span>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
