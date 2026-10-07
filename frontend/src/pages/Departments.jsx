import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Search } from 'lucide-react'
import { DEPARTMENTS } from '../lib/data'

export default function Departments() {
  const [q, setQ] = useState('')
  const all = DEPARTMENTS.filter(
    (d) => (d.name + d.full + d.tagline).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <h1 style={{ fontFamily: 'var(--display)', letterSpacing: '-0.03em' }}>Clinical Nutrition Departments</h1>
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
          <div className="dept-cards">
            {all.map((d, i) => (
              <motion.div
                key={d.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
              >
                <Link to={`/departments/${d.slug}`} className="dept-card">
                  <div className="dept-card-code" style={{ color: d.color }}>{d.name}</div>
                  <h3>{d.full}</h3>
                  <p>{d.tagline}</p>
                  <span className="dept-card-link">View protocols <ArrowRight size={14} /></span>
                </Link>
              </motion.div>
            ))}
            {all.length === 0 && <p className="empty-state">No department matches "{q}".</p>}
          </div>
        </div>
      </section>
    </div>
  )
}
