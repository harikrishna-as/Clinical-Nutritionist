import React, { useEffect } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from 'framer-motion'

// God-like smooth scrolling powered by Lenis (lenis.dev).
// Exposes the instance on window.lenis so other parts of the app
// (nav scroll-to-top, open modals) can control it.
// Honours prefers-reduced-motion: native scrolling is kept.
export default function SmoothScroll({ children }) {
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (prefersReduced) return
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })
    window.lenis = lenis

    let raf
    const loop = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      delete window.lenis
    }
  }, [prefersReduced])

  return children
}