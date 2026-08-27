import React from 'react'
import { motion } from 'framer-motion'

export default function BentoGrid({ items = [], columns = 3, gap = 12 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gridAutoRows: 'minmax(120px, auto)', gap }}>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
          style={{ gridColumn: `span ${item.colSpan || 1}`, gridRow: `span ${item.rowSpan || 1}`, background: item.color || 'rgba(30,41,59,0.6)', borderRadius: 16, border: '1px solid rgba(96,165,250,0.12)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', position: 'relative' }}
        >
          {item.content}
        </motion.div>
      ))}
    </div>
  )
}
