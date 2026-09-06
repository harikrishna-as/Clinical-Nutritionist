import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ArrowRight, Activity, Monitor, Stethoscope, Pill, Syringe, Baby, Heart, Shield, HeartPulse, Gauge, User, Droplets, Ribbon, Cctv, Scissors, Apple, Milk } from 'lucide-react'

const ICONS = { Activity, Monitor, Stethoscope, Pill, Syringe, Baby, Heart, Shield, HeartPulse, Gauge, User, Droplets, Ribbon, Cctv, Scissors, Apple, Milk }

function SpiralCard({ d, index, N, p, radius, vertical }) {
  const step = 360 / N
  const Icon = ICONS[d.icon] || Activity
  const num = String(index + 1).padStart(2, '0')
  const span = Math.max(1, N - 1)
  const c = index / span
  const opacity = useTransform(p, (v) => {
    const d = Math.abs(v - c) * span
    if (d <= 0.5) return 1
    return Math.max(0.3, 1 - (d - 0.5) * 1.6)
  })
  const scale = useTransform(p, (v) => {
    const d = Math.abs(v - c) * span
    if (d <= 0.5) return 1
    return Math.max(0.82, 1 - (d - 0.5) * 0.6)
  })
  const vy = index * vertical

  return (
    <div
      className="sp-item"
      style={{
        transform: `translateY(${vy}px) rotateY(${index * step}deg) translateZ(${radius}px)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div className="sp-item__card" style={{ opacity, scale }}>
        <Link to={`/departments/${d.slug}`} className="sp-card" style={{ transform: 'translate(-50%, -50%)' }}>
          <span className="sp-card__num">{num}</span>
          <span className="sp-card__glow" style={{ background: `radial-gradient(circle at 20% 15%, ${d.color}59, transparent 60%)` }} />
          <span className="sp-card__code" style={{ color: d.color }}>{d.name}</span>
          <h3 className="sp-card__name">{d.full}</h3>
          <div className="sp-card__chips">
            {(d.assessmentTools || []).slice(0, 2).map((t) => (
              <span key={t} className="sp-chip" style={{ borderColor: `${d.color}59`, color: d.color }}>{t}</span>
            ))}
          </div>
          <span className="sp-card__cta" style={{ color: d.color }}>Open protocols <ArrowRight size={13} /></span>
        </Link>
      </motion.div>
    </div>
  )
}

export default function DepartmentSpiral({ departments = [] }) {
  const sectionRef = useRef(null)
  const hudKickerRef = useRef(null)
  const hudTitleRef = useRef(null)
  const hudCountRef = useRef(null)
  const reduce = useReducedMotion()
  const N = departments.length

  const [radius, setRadius] = useState(() => Math.min(Math.max(window.innerWidth * 0.22, 170), 330))
  useEffect(() => {
    const onR = () => setRadius(Math.min(Math.max(window.innerWidth * 0.22, 170), 330))
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [])

  const span = Math.max(1, N - 1)
  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const rotation = useTransform(p, (v) => -v * 360 * (span / N))
  const ringY = useTransform(p, (v) => -v * span * 44)
  const barScale = useTransform(p, (v) => v)

  useEffect(() => {
    if (N === 0) return
    const unsub = p.on('change', (v) => {
      const idx = Math.min(N - 1, Math.max(0, Math.round(v * span)))
      const dept = departments[idx]
      if (hudKickerRef.current) hudKickerRef.current.textContent = 'CARD ' + String(idx + 1).padStart(2, '0')
      if (hudTitleRef.current) hudTitleRef.current.textContent = dept.full.toUpperCase()
      if (hudCountRef.current) hudCountRef.current.textContent = (idx + 1) + ' / ' + N
    })
    return unsub
  }, [p, departments, N])

  if (reduce || N === 0) {
    return (
      <div className="dept-cards">
        {departments.map((d, i) => {
          const Icon = ICONS[d.icon] || Activity
          return (
            <Link key={d.slug} to={`/departments/${d.slug}`} className="dept-card">

              <div className="dept-card-code" style={{ color: d.color }}>{d.name}</div>
              <h3>{d.full}</h3>
              <p>{d.tagline}</p>
              <span className="dept-card-link">View protocols <ArrowRight size={14} /></span>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="sp-section" ref={sectionRef} style={{ height: `${N * 78}vh` }}>
      <div className="sp-stage">
        <div className="cine-grain" />
        <div className="sp-stage__hint">Scroll to turn the spiral</div>
        <motion.div className="sp-ring" style={{ rotateY: rotation, y: ringY, transformStyle: 'preserve-3d' }}>
          {departments.map((d, i) => (
            <SpiralCard key={d.slug} d={d} index={i} N={N} p={p} radius={radius} vertical={44} />
          ))}
        </motion.div>

        <div className="cine-hud cine-hud--chapter">
          <span className="cine-hud__kicker" ref={hudKickerRef}>CARD 01</span>
          <span className="cine-hud__title" ref={hudTitleRef}>{departments[0]?.full.toUpperCase()}</span>
        </div>
        <div className="cine-hud cine-hud--count" ref={hudCountRef}>1 / {N}</div>
        <motion.div className="cine-bar" style={{ scaleX: barScale }} />
      </div>
    </div>
  )
}