import React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Monitor, Stethoscope, Pill, Syringe, Baby, Heart, Shield,
  HeartPulse, Gauge, User, Droplets, Ribbon, ClipboardCheck, ChefHat,
  UserCog, AlertTriangle, ArrowLeft, ArrowRight, Cctv, Scissors, Apple, Milk,
} from 'lucide-react'
import { DEPARTMENTS } from '../lib/data'
import PatientIVPanel from '../components/PatientIVPanel'
import Accordion from '../components/ui/Accordion'
import DepartmentShowcase from '../components/ui/DepartmentShowcase'
import GlassCard from '../components/ui/GlassCard'
import Spotlight from '../components/ui/Spotlight'
import RadialProgress from '../components/ui/RadialProgress'
import EditBadge from '../components/ui/EditBadge'
import FilterDisclosure from '../components/ui/FilterDisclosure'

const ICONS = { Activity, Monitor, Stethoscope, Pill, Syringe, Baby, Heart, Shield, HeartPulse, Gauge, User, Droplets, Ribbon, Cctv, Scissors, Apple, Milk }

export default function DepartmentDetail() {
  const { slug } = useParams()
  const dept = DEPARTMENTS.find((d) => d.slug === slug)

  if (!dept) return <Navigate to="/departments" replace />

  const Icon = ICONS[dept.icon] || Activity
  const idx = DEPARTMENTS.findIndex((d) => d.slug === slug)
  const prev = DEPARTMENTS[(idx - 1 + DEPARTMENTS.length) % DEPARTMENTS.length]
  const next = DEPARTMENTS[(idx + 1) % DEPARTMENTS.length]

  const protocolAccordion = dept.nutritionProtocol.map((p, i) => ({
    id: i + 1,
    title: `Step ${i + 1}`,
    icon: <ChefHat size={16} color={dept.color} />,
    content: p,
  }))

  const relatedDepts = DEPARTMENTS.filter((d) => d.slug !== slug).slice(0, 5).map((d) => ({
    ...d,
    id: d.slug, title: d.name, description: d.tagline,
    icon: React.createElement(ICONS[d.icon] || Activity, { size: 26, color: '#fff' }),
    tags: (d.assessmentTools || []).slice(0, 3),
  }))

  return (
    <div className="page">
      <section className="dept-hero" style={{ background: `linear-gradient(135deg, ${dept.color}22, rgba(15,23,42,0.9))` }}>
        <div className="container">
          <div className="dept-hero-inner">
            <motion.div className="dept-hero-ico" style={{ background: `${dept.color}22`, color: dept.color, borderColor: `${dept.color}55` }} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <Icon size={44} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <span className="dept-hero-code" style={{ color: dept.color }}>{dept.name} DEPARTMENT</span>
              <h1>{dept.full}</h1>
              <p>{dept.tagline}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="page-body">
        <div className="container">
          <div className="dept-overview">
            <Spotlight color={`${dept.color}08`} size={200}>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} className="card">
                <h3><ClipboardCheck size={20} color={dept.color} /> Role of the Clinical Nutritionist</h3>
                <p>{dept.role}</p>
              </motion.div>
            </Spotlight>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: 0.1 }} className="card">
              <h3><UserCog size={20} color={dept.color} /> Assessment & Screening Tools</h3>
              <div className="tag-cloud">
                {dept.assessmentTools.map((t) => <span key={t} className="tag" style={{ borderColor: `${dept.color}55`, color: dept.color }}>{t}</span>)}
              </div>
              <h3 style={{ marginTop: 24 }}><AlertTriangle size={20} color="#f5b041" /> Key Warnings</h3>
              <ul className="check-list warn">
                {dept.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </motion.div>
          </div>

          <div className="dept-detail-grid">
            {/* Protocol as Accordion */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} className="card">
              <h3><ChefHat size={20} color={dept.color} /> Nutrition Care Protocol</h3>
              <Accordion items={protocolAccordion} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ delay: 0.1 }} className="card">
              <h3>Conditions Managed</h3>
              <div className="condition-grid">
                {dept.conditions.map((c) => (
                  <div key={c} className="condition-pill"><span style={{ background: dept.color }} />{c}</div>
                ))}
              </div>
              <h3 style={{ marginTop: 24 }}>Quick Overview</h3>
              <div className="dept-quick-meta">
                <div><span>Unit</span><strong>{dept.name}</strong></div>
                <div><span>Category</span><strong>{dept.full}</strong></div>
                <div><span>Acuity</span><strong>{dept.tagline}</strong></div>
              </div>
            </motion.div>
          </div>

          {/* Related Departments */}
          <div style={{ marginTop: 40 }}>
            <h3 style={{ textAlign: 'center', marginBottom: 20 }}>Related Departments</h3>
            <DepartmentShowcase items={relatedDepts} />
          </div>

          <div className="dept-nav">
            <Link to={`/departments/${prev.slug}`} className="btn btn-ghost btn-sm"><ArrowLeft size={15} /> {prev.name}</Link>
            <Link to="/departments" className="text-link">All departments</Link>
            <Link to={`/departments/${next.slug}`} className="btn btn-ghost btn-sm">{next.name} <ArrowRight size={15} /></Link>
          </div>

          <div style={{ marginTop: 70 }}>
            <PatientIVPanel dept={dept} />
          </div>
        </div>
      </section>
    </div>
  )
}
