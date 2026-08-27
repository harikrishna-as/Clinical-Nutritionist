import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1]

// God-like word-mask reveal: each word slides up out of an overflow mask
// with a staggered delay as the text scrolls into view. Nested elements
// (e.g. <span className="gradient-text">) are preserved as-is.
// Under prefers-reduced-motion the text renders statically.
export default function SplitReveal({
  children,
  as: Tag = 'span',
  className = '',
  delay = 0,
  stagger = 0.045,
  ...rest
}) {
  const prefersReduced = useReducedMotion()
  const parts = Array.isArray(children) ? children : [children]
  let wordIndex = 0

  if (prefersReduced) {
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    )
  }

  return (
    <Tag className={className} {...rest}>
      {parts.map((part, pi) => {
        if (typeof part !== 'string') return <React.Fragment key={pi}>{part}</React.Fragment>

        const words = part.split(' ')
        return (
          <React.Fragment key={pi}>
            {words.map((w, wi) => {
              const d = delay + wordIndex * stagger
              wordIndex += 1
              return (
                <React.Fragment key={wi}>
                  <span className="split-mask">
                    <motion.span
                      className="split-inner"
                      initial={{ y: '115%', opacity: 0 }}
                      whileInView={{ y: '0%', opacity: 1 }}
                      viewport={{ margin: '-12% 0px' }}
                      transition={{ duration: 0.85, ease: EASE, delay: d }}
                    >
                      {w}
                    </motion.span>
                  </span>
                  {wi < words.length - 1 ? ' ' : ''}
                </React.Fragment>
              )
            })}
          </React.Fragment>
        )
      })}
    </Tag>
  )
}