import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion,
} from 'framer-motion'
import { ArrowRight, Activity, Monitor, Stethoscope, Pill, Syringe, Baby, Heart, Shield, HeartPulse, Gauge, User, Droplets, Ribbon, Cctv, Scissors, Apple, Milk } from 'lucide-react'

const ICONS = { Activity, Monitor, Stethoscope, Pill, Syringe, Baby, Heart, Shield, HeartPulse, Gauge, User, Droplets, Ribbon, Cctv, Scissors, Apple, Milk }

function DeckCard({ d, index, count, target }) {
  const N = count
  const { scrollYProgress: p } = useScroll({ target, offset: ['start start', 'end end'] })

  const start = index / N
  const end = (index + 1) / N
  const local = useTransform(p, [start, end], [0, 1])

  const y = index === 0
    ? useTransform(() => '0vh')
    : useTransform(local, [0, 0.24], ['112vh', '0vh'])
  const rotateX = index === 0
    ? useTransform(() => 0)
    : useTransform(local, [0, 0.24], [12, 0])
  const scale = useTransform(local, [0, 0.24, 0.78, 1], [index === 0 ? 1 : 0.96, 1, 1, 0.9])
  const opacity = useTransform(local, [0, 0.24, 0.78, 1], [index === 0 ? 1 : 0, 1, 1, 0.38])

  const Icon = ICONS[d.icon] || Activity
  const num = String(index + 1).padStart(2, '0')

  return (
    <motion.div
      className="cine-card-wrap"
      style={{ y, scale, opacity, rotateX, zIndex: index + 1, transformPerspective: 1400 }}
    >
      <Link to={`/departments/${d.slug}`} className="cine-card">
        <span className="cine-card__ghost">{num}</span>
        <div className="cine-card__glow" style={{ background: `radial-gradient(circle at 20% 10%, ${d.color}4d, transparent 55%)` }} />
        <div className="cine-card__left">
          <span className="cine-card__ico" style={{ background: `${d.color}1f`, color: d.color, boxShadow: `0 0 60px ${d.color}30` }}>
            <Icon size={40} strokeWidth={1.6} />
          </span>
          <span className="cine-card__code" style={{ color: d.color }}>{d.name}</span>
          <h2 className="cine-card__name">{d.full}</h2>
          <p className="cine-card__tagline">{d.tagline}</p>
          <span className="cine-card__cta" style={{ color: d.color }}>
            View protocols <ArrowRight size={15} />
          </span>
        </div>
        <div className="cine-card__right">
          <div className="cine-card__meta">
            <span className="cine-card__meta-label">Screening</span>
            <div className="cine-card__chips">
              {(d.assessmentTools || []).slice(0, 3).map((t) => (
                <span key={t} className="cine-chip" style={{ borderColor: `${d.color}59`, color: d.color }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="cine-card__meta">
            <span className="cine-card__meta-label">Conditions</span>
            <div className="cine-card__chips">
              {(d.conditions || []).slice(0, 3).map((c) => (
                <span key={c} className="cine-chip cine-chip--ghost">{c}</span>
              ))}
            </div>
          </div>
          <div className="cine-card__meta cine-card__meta--summary">
            <span className="cine-card__meta-label">Brief</span>
            <p className="cine-card__summary">{d.summary}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function DeptDeck({ departments = [] }) {
  const deckRef = useRef(null)
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const N = departments.length

  const { scrollYProgress: p } = useScroll({ target: deckRef, offset: ['start start', 'end end'] })
  const barScale = useTransform(p, [0, 1], [0, 1])
  useMotionValueEvent(p, 'change', (v) => {
    setActive(Math.min(N - 1, Math.max(0, Math.floor(v * N))))
  })

  if (reduce || N === 0) {
    return (
      <div className="dept-cards">
        {departments.map((d, i) => {
          const Icon = ICONS[d.icon] || Activity
          return (
            <Link key={d.slug} to={`/departments/${d.slug}`} className="dept-card">
              <span className="dept-card-ico" style={{ background: `${d.color}1f`, color: d.color }}><Icon size={26} /></span>
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

  const activeDept = departments[active]

  return (
    <div className="cine-deck" ref={deckRef} style={{ height: `${N * 92}vh` }}>
      <div className="cine-stage">
        <div className="cine-grain" />
        <div className="cine-letter cine-letter--top" />
        <div className="cine-letter cine-letter--bottom" />

        {departments.map((d, i) => (
          <DeckCard key={d.slug} d={d} index={i} count={N} target={deckRef} />
        ))}

        {/* chapter HUD */}
        <div className="cine-hud cine-hud--chapter">
          <span className="cine-hud__kicker">CHAPTER {String(active + 1).padStart(2, '0')}</span>
          <span className="cine-hud__title">{activeDept ? activeDept.full.toUpperCase() : ''}</span>
        </div>
        <div className="cine-hud cine-hud--count">{active + 1} / {N}</div>

        {/* progress hairline */}
        <motion.div className="cine-bar" style={{ scaleX: barScale }} />
      </div>
    </div>
  )
}