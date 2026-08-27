import React, { useState } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import useMeasure from 'react-use-measure'

const spring = { type: 'spring', stiffness: 500, damping: 40, mass: 1 }

function AccordionItem({ item, index, total, openIndex, setOpenId }) {
  const [ref, bounds] = useMeasure()
  const isOpen = index === openIndex
  const isFirst = index === 0
  const isLast = index === total - 1

  let radius = { tl: 16, tr: 16, bl: 16, br: 16 }
  if (isOpen) { radius = { tl: 20, tr: 20, bl: 20, br: 20 } }
  else if (isFirst) { radius = { tl: 16, tr: 16, bl: 0, br: 0 } }
  else if (isLast) { radius = { bl: 16, br: 16, tl: 0, tr: 0 } }

  const borderColor = isOpen ? 'rgba(96,165,250,0.45)' : 'rgba(96,165,250,0.18)'

  return (
    <MotionConfig transition={spring}>
      <motion.li layout style={{ listStyle: 'none', marginBottom: isLast ? 0 : 4 }}>
        <motion.div
          animate={{ borderRadius: `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` }}
          style={{ overflow: 'hidden', border: `1px solid ${borderColor}`, background: isOpen ? 'rgba(59,130,246,0.18)' : 'rgba(30,41,59,0.55)', transition: 'background 0.3s' }}
        >
          <button onClick={() => setOpenId(isOpen ? null : item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {item.icon && <span style={{ color: '#60A5FA' }}>{item.icon}</span>}
              <span style={{ fontSize: 14.5, fontWeight: 700 }}>{item.title}</span>
            </div>
            <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ color: '#60A5FA', fontSize: 16 }}>▼</motion.span>
          </button>
          <motion.div initial={false} animate={{ height: isOpen ? bounds.height : 0, opacity: isOpen ? 1 : 0 }} style={{ overflow: 'hidden' }}>
            <div ref={ref}>
              <div style={{ padding: '0 20px 16px', fontSize: 13.5, color: '#A78BFA', lineHeight: 1.7 }}>{item.content}</div>
            </div>
          </motion.div>
        </motion.div>
      </motion.li>
    </MotionConfig>
  )
}

export default function Accordion({ items = [], maxWidth = '100%' }) {
  const [openId, setOpenId] = useState(null)
  const openIndex = items.findIndex((i) => i.id === openId)

  return (
    <ul style={{ width: '100%', maxWidth, padding: 0, display: 'flex', flexDirection: 'column' }}>
      {items.map((item, index) => (
        <AccordionItem key={item.id} item={item} index={index} total={items.length} openIndex={openIndex} setOpenId={setOpenId} />
      ))}
    </ul>
  )
}