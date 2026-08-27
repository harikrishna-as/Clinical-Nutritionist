import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Copy } from 'lucide-react'

export default function MinimalCarousel({ cards = [] }) {
  const [activeId, setActiveId] = useState(null)
  const activeCard = cards.find((c) => c.id === activeId)
  const secondaryCards = cards.filter((c) => c.id !== activeId)

  return (
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }} onClick={(e) => { if (e.target === e.currentTarget) setActiveId(null) }}>
      <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {activeCard && (
            <motion.div key={activeCard.id} layoutId={activeCard.id} style={{ background: activeCard.color, borderRadius: 28, padding: 20, color: '#fff', minHeight: 170, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeCard.icon}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 999, background: 'rgba(255,255,255,0.15)', padding: '6px 14px', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                  Copy <Copy size={14} />
                </button>
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: '8px 0 2px', opacity: 0.9 }}>{activeCard.title}</h3>
                <p style={{ fontSize: 16, fontWeight: 600, opacity: 0.6, margin: 0 }}>{activeCard.value}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: activeId ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
          {(activeId ? secondaryCards : cards).map((card) => (
            <motion.div key={card.id} layoutId={card.id} onClick={(e) => { e.stopPropagation(); setActiveId(card.id) }} style={{ background: card.color, borderRadius: 22, padding: 14, color: '#fff', cursor: 'pointer', minHeight: activeId ? 96 : 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: activeId ? 16 : 22 }}>{card.icon}</div>
                <MoreHorizontal size={16} style={{ opacity: 0.6 }} />
              </div>
              <div>
                <h4 style={{ fontSize: activeId ? 11 : 14, fontWeight: 500, opacity: 0.9, margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title}</h4>
                <p style={{ fontSize: activeId ? 10 : 13, fontWeight: 600, opacity: 0.6, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
