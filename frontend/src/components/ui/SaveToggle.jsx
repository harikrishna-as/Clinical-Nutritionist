import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export default function SaveToggle({ idleText = 'Save', savedText = 'Saved', loadingDuration = 1000, successDuration = 800, onStatusChange, onSave }) {
  const [status, setStatus] = useState('idle')

  useEffect(() => { onStatusChange?.(status) }, [status, onStatusChange])

  const handleClick = useCallback(() => {
    if (status === 'idle') {
      setStatus('loading')
      onSave?.()
      setTimeout(() => {
        setStatus('success')
        setTimeout(() => setStatus('saved'), successDuration)
      }, loadingDuration)
    } else if (status === 'saved') {
      setStatus('idle')
    }
  }, [status, loadingDuration, successDuration, onSave])

  const isCircle = status === 'loading' || status === 'success'
  const width = isCircle ? 56 : (status === 'saved' ? 140 : 120)

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.97 }}
      animate={{ width, height: 56, backgroundColor: isCircle ? '#3B82F6' : (status === 'saved' ? 'rgba(96,165,250,0.15)' : '#151d30') }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, mass: 1.2 }}
      style={{ borderRadius: 999, border: status === 'saved' ? '2px solid rgba(96,165,250,0.3)' : '2px solid rgba(96,165,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', outline: 'none' }}
    >
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.span key="idle" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ fontSize: 16, fontWeight: 700, color: '#A78BFA' }}>
            {idleText}
          </motion.span>
        )}
        {status === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <motion.svg viewBox="0 0 26 26" style={{ width: 28, height: 28 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}>
              <circle cx="13" cy="13" r="10" stroke="rgba(96,165,250,0.3)" strokeWidth="3" fill="none" />
              <path d="M13 3 A10 10 0 0 1 23 13" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" fill="none" />
            </motion.svg>
          </motion.div>
        )}
        {(status === 'success' || status === 'saved') && (
          <motion.div key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 15 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={22} color={status === 'success' ? '#22c55e' : '#60A5FA'} />
            <AnimatePresence>
              {status === 'saved' && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ fontSize: 16, fontWeight: 700, color: '#A78BFA', whiteSpace: 'nowrap' }}>
                  {savedText}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
