import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Monitor, Stethoscope, Pill, Syringe, Baby, Heart, Shield,
  HeartPulse, Gauge, User, Droplets, Ribbon, ArrowRight, Search,
  Cctv, Scissors, Apple, Milk,
} from 'lucide-react'
import { DEPARTMENTS } from '../lib/data'
import DeptDeck from '../components/cinematic/DeptDeck'
import DepartmentSpiral from '../components/cinematic/DepartmentSpiral'
import SplineEmbed from '../components/SplineEmbed'

const ICONS = { Activity, Monitor, Stethoscope, Pill, Syringe, Baby, Heart, Shield, HeartPulse, Gauge, User, Droplets, Ribbon, Cctv, Scissors, Apple, Milk }

export default function Departments() {
  const [q, setQ] = useState('')
  const all = DEPARTMENTS.filter(
    (d) => (d.name + d.full + d.tagline).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="page">
      <section className="page-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.32 }}>
          <SplineEmbed scene="departments" style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,26,0.12) 0%, rgba(10,14,26,0.72) 65%, rgba(10,14,26,0.92) 100%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--display)', letterSpacing: '-0.03em' }}>Clinical Nutrition <span className="gradient-text">Departments</span></h1>
          <p style={{ maxWidth: 640, color: '#D1D5DB' }}>Every ward where a clinical nutritionist is posted — screening tools, feeding protocols and care roles, explained plainly.</p>
          <div className="page-search">
            <Search size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search departments (ICU, pregnancy, pediatric...)"
            />
          </div>
        </div>
      </section>

      <section className="page-body">
        <div className="container">
          {!q ? (
            <>
              <DeptDeck departments={DEPARTMENTS} />
              <div className="sp-head">
                <span className="sp-head__kicker">3D Spiral</span>
                <h2>Departments, <span className="gradient-text">arranged in space</span></h2>
                <p>Keep scrolling to turn the helix. Each card swings to the front with its own screening tools, conditions and protocol brief.</p>
              </div>
              <DepartmentSpiral departments={DEPARTMENTS} />
            </>
          ) : (
            <div className="dept-cards">
              {all.map((d, i) => {
                const Icon = ICONS[d.icon] || Activity
                return (
                  <motion.div
                    key={d.slug}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <Link to={`/departments/${d.slug}`} className="dept-card">
                      <span className="dept-card-ico" style={{ background: `${d.color}1f`, color: d.color }}><Icon size={26} /></span>
                      <div className="dept-card-code" style={{ color: d.color }}>{d.name}</div>
                      <h3>{d.full}</h3>
                      <p>{d.tagline}</p>
                      <span className="dept-card-link">View protocols <ArrowRight size={14} /></span>
                    </Link>
                  </motion.div>
                )
              })}
              {all.length === 0 && <p className="empty-state">No department matches "{q}".</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
