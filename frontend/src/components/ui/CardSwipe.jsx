import React, { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

const GAP = 16
const DRAG_BUFFER = 50
const VELOCITY_THRESHOLD = 500
const SPRING = { type: 'spring', stiffness: 330, damping: 30 }

function Card({ item, index, x, travel, total }) {
  const activeIndex = index
  const nextIndex = Math.min(index + 1, total - 1)
  const prevIndex = Math.max(index - 1, 0)
  const range = [-travel * (index + 1), -travel * index, -travel * (index - 1)]
  const outputRange = [nextIndex !== index ? 14 : 14, 0, prevIndex !== index ? -14 : -14]
  const rotateY = useTransform(x, range, outputRange, { clamp: false })

  return (
    <motion.div
      style={{ width: 'var(--swipe-w)', height: 'var(--swipe-h)', rotateY, flexShrink: 0, background: item.color || '#151d30', borderRadius: 28, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'grab', border: '1.5px solid rgba(96,165,250,0.2)', perspective: 1000, overflow: 'hidden' }}
      transition={SPRING}
      dragConstraints={{ left: 0, right: 0 }}
    >
      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {item.icon}
      </div>
      <div style={{ minHeight: 0 }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#F3F4F6', marginBottom: 8, margin: 0 }}>{item.title}</h3>
        <p style={{ fontSize: 14, color: '#A78BFA', margin: '10px 0 0', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{item.description}</p>
      </div>
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ borderRadius: 999, padding: '9px 22px', background: '#3B82F6', color: '#F3F4F6', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', flexShrink: 0 }}>
        View Details
      </motion.button>
    </motion.div>
  )
}

export default function CardSwipe({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardW, setCardW] = useState(360)
  const [cardH, setCardH] = useState(340)
  const x = useMotionValue(0)
  const travel = cardW + GAP

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth
      const w = Math.min(420, Math.max(280, vw - 48))
      setCardW(w)
      setCardH(w > 400 ? 360 : 340)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  useEffect(() => { setCurrentIndex(Math.min(currentIndex, items.length - 1)) }, [items.length]) // eslint-disable-line

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -DRAG_BUFFER || info.velocity.x < -VELOCITY_THRESHOLD)
      setCurrentIndex((p) => Math.min(p + 1, items.length - 1))
    else if (info.offset.x > DRAG_BUFFER || info.velocity.x > VELOCITY_THRESHOLD)
      setCurrentIndex((p) => Math.max(p - 1, 0))
  }

  const leftConstraint = -travel * (items.length - 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ position: 'relative', overflow: 'hidden', width: cardW + GAP * 2, height: cardH + GAP * 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          drag="x"
          dragConstraints={{ left: leftConstraint, right: 0 }}
          style={{ display: 'flex', gap: GAP, perspective: 1000, x, alignItems: 'center', ['--swipe-w']: cardW, ['--swipe-h']: cardH }}
          onDragEnd={handleDragEnd}
          animate={{ x: -(currentIndex * travel) }}
          transition={SPRING}
        >
          {items.map((item, i) => <Card key={item.id} item={item} index={i} x={x} travel={travel} total={items.length} />)}
        </motion.div>
      </div>
      <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
        {items.map((_, i) => (
          <motion.div key={i} onClick={() => setCurrentIndex(i)} animate={{ width: currentIndex === i ? 32 : 8 }} style={{ width: 8, height: 8, borderRadius: 999, background: currentIndex === i ? '#60A5FA' : 'rgba(96,165,250,0.3)', cursor: 'pointer' }} />
        ))}
      </div>
    </div>
  )
}