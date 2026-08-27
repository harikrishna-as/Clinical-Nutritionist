import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const SIZES = {
  sm: { padding: '8px 20px', fontSize: 13 },
  md: { padding: '12px 28px', fontSize: 15 },
  lg: { padding: '16px 36px', fontSize: 17 },
}

const VARIANTS = {
  primary: { bg: '#3B82F6', color: '#F3F4F6', border: '2px solid #60A5FA', glow: 'rgba(59,130,246,0.5)' },
  secondary: { bg: 'transparent', color: '#A78BFA', border: '2px solid #60A5FA', glow: 'rgba(96,165,250,0.3)' },
  ghost: { bg: 'transparent', color: '#A78BFA', border: '1px solid rgba(96,165,250,0.2)', glow: 'rgba(96,165,250,0.15)' },
}

const MotionLink = motion(Link)

export default function GlowButton({ children, onClick, to, variant = 'primary', size = 'md', glowColor, style = {} }) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  const motionProps = {
    whileHover: { scale: 1.03, boxShadow: `0 0 30px ${glowColor || v.glow}` },
    whileTap: { scale: 0.97 },
    style: { ...s, background: v.bg, color: v.color, border: v.border, borderRadius: 999, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.3s', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...style },
  }
  if (to) {
    return (
      <MotionLink to={to} {...motionProps}>
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      </MotionLink>
    )
  }
  return (
    <motion.button onClick={onClick} {...motionProps}>
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </motion.button>
  )
}