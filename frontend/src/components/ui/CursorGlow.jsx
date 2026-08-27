import React, { useEffect, useRef, useState } from 'react'

// Cursor interactions: a soft violet glow and a dot that trail the pointer
// with a spring lag. The glow swells over interactive elements and dims
// immediately when the pointer leaves the window. Disabled entirely on
// touch devices and under prefers-reduced-motion.
export default function CursorGlow() {
  const glowRef = useRef(null)
  const dotRef = useRef(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return
    setEnabled(true)
    const glow = glowRef.current
    const dot = dotRef.current
    if (!glow || !dot) return

    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 3
    let gx = tx
    let gy = ty
    let scale = 1
    let targetScale = 1
    let seen = false
    let raf

    const move = (e) => {
      if (!seen) {
        seen = true
        gx = tx = e.clientX
        gy = ty = e.clientY
        glow.style.opacity = '1'
        dot.style.opacity = '1'
      }
      tx = e.clientX
      ty = e.clientY
      targetScale = e.target.closest('a, button, input, select, textarea, label, .quick-card') ? 1.8 : 1
    }
    const leave = () => {
      glow.style.opacity = '0'
      dot.style.opacity = '0'
    }
    const loop = () => {
      gx += (tx - gx) * 0.16
      gy += (ty - gy) * 0.16
      scale += (targetScale - scale) * 0.12
      glow.style.transform = `translate3d(${gx - 110}px, ${gy - 110}px, 0) scale(${scale})`
      dot.style.transform = `translate3d(${tx - 3}px, ${ty - 3}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', move, { passive: true })
    document.documentElement.addEventListener('mouseleave', leave)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [])

  if (!enabled) return null
  return (
    <>
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  )
}