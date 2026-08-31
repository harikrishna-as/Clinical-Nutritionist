import React, { useEffect, useRef, useState } from 'react'

export default function GlobalCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return
    setEnabled(true)

    document.documentElement.style.userSelect = 'none'
    document.documentElement.style.webkitUserSelect = 'none'
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    const style = document.createElement('style')
    style.id = 'no-select-style'
    style.textContent = `* { user-select: none !important; -webkit-user-select: none !important; -ms-user-select: none !important; } input, textarea, [contenteditable] { user-select: text !important; -webkit-user-select: text !important; } ::selection { background: transparent; }`
    document.head.appendChild(style)
    const preventSelect = (e) => {
      const t = e.target
      if (t.closest && t.closest('input, textarea, [contenteditable]')) return
      e.preventDefault()
    }
    document.addEventListener('selectstart', preventSelect)
    document.addEventListener('dragstart', preventSelect)

    let mx = window.innerWidth / 2, my = window.innerHeight / 2
    let rx = mx, ry = my
    let raf, visible = false
    const dot = dotRef.current, ring = ringRef.current
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY
      if (!visible) { visible = true; if (dot) dot.style.opacity = '1'; if (ring) ring.style.opacity = '1' }
      const isInteractive = e.target.closest('a, button, input, select, textarea, label, .card')
      if (ring) ring.style.transform = `translate3d(${mx}px, ${my}px, 0) ${isInteractive ? 'scale(1.5)' : 'scale(1)'}`
      if (dot) dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`
    }
    const onLeave = () => { visible = false; if (dot) dot.style.opacity = '0'; if (ring) ring.style.opacity = '0' }
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18
      if (ring) {
        const cur = ring.style.transform
        const scale = cur.match(/scale\([^)]+\)/)?.[0] || 'scale(1)'
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) ${scale}`
      }
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseleave', onLeave)
    loop()

    const add = (target, type, opts) => {
      const h = () => {}
      target.addEventListener(type, h, opts)
      return [target, type, h, opts]
    }
    const handlers = []
    ;['click','dblclick','mousedown','mouseup','mousemove','mouseover','mouseout','mouseenter','mouseleave','contextmenu'].forEach(t => handlers.push(add(document, t, { passive: true })))
    ;['keydown','keypress','keyup'].forEach(t => handlers.push(add(window, t, { passive: true })))
    ;['submit','input','change','focus','blur','invalid','reset','select'].forEach(t => handlers.push(add(document, t, t==='focus'||t==='blur')))
    ;['touchstart','touchend','touchmove','pointerdown','pointerup','pointermove'].forEach(t => handlers.push(add(window, t, { passive: true })))
    ;['resize','scroll','beforeunload','unload','online','offline'].forEach(t => handlers.push(add(window, t, { passive: true })))
    ;['DOMContentLoaded'].forEach(t => handlers.push(add(document, t, { passive: true })))
    ;['load'].forEach(t => handlers.push(add(window, t, { passive: true })))
    ;['copy','cut','paste'].forEach(t => {
      const h = (e) => { const tag=e.target?.tagName; if(tag==='INPUT'||tag==='TEXTAREA'||e.target?.isContentEditable) return }
      document.addEventListener(t, h); handlers.push([document,t,h])
    })
    ;['play','pause','ended','volumechange','animationstart','animationend','transitionend'].forEach(t => handlers.push(add(document, t, { passive: true })))

    const prevCursor = document.documentElement.style.cursor
    document.documentElement.style.cursor = 'none'
    document.body.style.cursor = 'none'
    const hideStyle = document.createElement('style')
    hideStyle.textContent = `* { cursor: none !important; } input, textarea { cursor: text !important; }`
    document.head.appendChild(hideStyle)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseleave', onLeave)
      handlers.forEach(([tg, tp, h, o]) => { try{tg.removeEventListener(tp,h,o)}catch{} })
      document.removeEventListener('selectstart', preventSelect)
      document.removeEventListener('dragstart', preventSelect)
      document.documentElement.style.cursor = prevCursor
      document.body.style.cursor = ''
      try{ document.head.removeChild(style)}catch{}
      try{ document.head.removeChild(hideStyle)}catch{}
    }
  }, [])

  if (!enabled) return null
  return (
    <>
      <div ref={ringRef} aria-hidden="true" style={{ position: 'fixed', left: 0, top: 0, width: 36, height: 36, marginLeft: -18, marginTop: -18, borderRadius: '50%', border: '1.5px solid rgba(167,139,250,0.9)', background: 'rgba(167,139,250,0.08)', boxShadow: '0 0 20px rgba(167,139,250,0.25)', pointerEvents: 'none', zIndex: 9999, opacity: 0, transition: 'opacity 0.2s, transform 0.15s', willChange: 'transform' }} />
      <div ref={dotRef} aria-hidden="true" style={{ position: 'fixed', left: 0, top: 0, width: 6, height: 6, marginLeft: -3, marginTop: -3, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(167,139,250,0.6)', pointerEvents: 'none', zIndex: 10000, opacity: 0, transition: 'opacity 0.2s', willChange: 'transform' }} />
    </>
  )
}
