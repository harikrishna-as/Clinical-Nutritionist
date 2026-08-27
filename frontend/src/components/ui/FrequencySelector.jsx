import React, { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'

const SPRING = { type: 'spring', bounce: 0.3, duration: 0.7 }
const TYPES = ['Daily', 'Weekly', 'Monthly', 'Yearly']
const SUBS = {
  Daily: [],
  Weekly: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  Monthly: Array.from({ length: 31 }, (_, i) => String(i + 1)),
  Yearly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

export default function FrequencySelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempType, setTempType] = useState(value?.type || 'Daily')
  const [tempSub, setTempSub] = useState(value?.subValue || '')

  const handleConfirm = () => {
    onChange({ type: tempType, subValue: tempType === 'Daily' ? undefined : tempSub })
    setIsOpen(false)
  }

  const pillStyle = { borderRadius: 999, padding: '12px 20px', background: '#151d30', border: '1.5px solid rgba(96,165,250,0.3)', color: '#F3F4F6', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', width: '100%', maxWidth: 400 }

  return (
    <LayoutGroup id="freq-root">
      <div style={{ display: 'flex', width: '100%', maxWidth: 400 }}>
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div layoutId="freq-container" transition={SPRING} onClick={() => { setTempType(value?.type || 'Daily'); setTempSub(value?.subValue || ''); setIsOpen(true) }} style={pillStyle}>
              <span style={{ color: '#A78BFA' }}>Frequency</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(96,165,250,0.1)', padding: '8px 16px', borderRadius: 12 }}>
                {value?.type || 'Daily'}{value?.subValue ? `, ${value.subValue}` : ''} ▾
              </span>
            </motion.div>
          ) : (
            <motion.div layoutId="freq-container" transition={SPRING} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, borderRadius: 16, border: '1.5px solid rgba(96,165,250,0.3)', background: 'rgba(30,41,59,0.9)', width: '100%', maxWidth: 400 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', flex: 1, background: '#151d30', borderRadius: 12, padding: 4, gap: 2 }}>
                  {TYPES.map((t) => (
                    <button key={t} onClick={() => { setTempType(t); setTempSub(SUBS[t][0]) }} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tempType === t ? 'rgba(96,165,250,0.2)' : 'transparent', color: tempType === t ? '#A78BFA' : '#9CA3AF', transition: 'all 0.2s' }}>
                      {t}
                    </button>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleConfirm} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: '#3B82F6', color: '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✓</motion.button>
              </div>
              <AnimatePresence mode="wait">
                {SUBS[tempType].length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: tempType === 'Monthly' ? 'repeat(7, 1fr)' : 'repeat(7, 1fr)', gap: 6, padding: 8, background: '#0d0722', borderRadius: 12 }}>
                      {SUBS[tempType].map((opt) => (
                        <button key={opt} onClick={() => setTempSub(opt)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: tempSub === opt ? 'rgba(96,165,250,0.3)' : 'transparent', color: tempSub === opt ? '#A78BFA' : '#9CA3AF', transition: 'all 0.2s' }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}
