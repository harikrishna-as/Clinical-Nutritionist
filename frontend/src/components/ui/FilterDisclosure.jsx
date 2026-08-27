import React, { useState } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'

const SPRING = { type: 'spring', stiffness: 240, damping: 20, mass: 1 }

export default function FilterDisclosure({ items = [], activeId, onChange }) {
  const [open, setOpen] = useState(false)
  const activeItem = items.find((i) => i.id === activeId)

  return (
    <MotionConfig transition={{ type: 'spring', bounce: 0.25, duration: 0.7 }}>
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div key="open" layoutId="filter-disc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }} style={{ position: 'absolute', zIndex: 20, width: 280, background: '#151d30', borderRadius: 20, border: '1.5px solid rgba(96,165,250,0.25)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
              {items.map((item, index) => {
                const selected = activeId === item.id
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING, delay: index * 0.04 }}
                    onClick={() => { onChange?.(item.id); setTimeout(() => setOpen(false), 200) }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 14, border: 'none', background: 'none', cursor: 'pointer', width: '100%', color: '#F3F4F6' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#A78BFA' }}>
                      {item.icon}
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#F3F4F6' }}>{item.label}</span>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: selected ? '2px solid #60A5FA' : '2px solid #1e3a8a', background: selected ? '#60A5FA' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selected && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>
          ) : (
            <motion.button key="closed" layoutId="filter-disc" onClick={() => setOpen(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ width: 52, height: 52, borderRadius: '50%', border: '1.5px solid rgba(96,165,250,0.3)', background: '#151d30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', fontSize: 20, zIndex: 30 }}>
              {activeItem?.icon || '☰'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
