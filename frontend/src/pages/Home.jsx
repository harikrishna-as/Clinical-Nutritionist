import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, Activity, Building2, Pill, ScanLine, Sparkles,
  HeartPulse, Boxes, Database, LayoutDashboard, TrendingUp,
} from 'lucide-react'
import SplineEmbed, { SplineSection } from '../components/SplineEmbed'
import Marquee, { MarqueeItem } from '../components/animations/Marquee'
import Parallax from '../components/animations/Parallax'
import SplitReveal from '../components/animations/SplitReveal'
import ScrollStatement from '../components/animations/ScrollStatement'
import ProblemSection from '../components/ProblemSection'
import Architecture from '../components/Architecture'
import AgentSystem from '../components/AgentSystem'
import Explainability from '../components/Explainability'
import CaseStudy from '../components/CaseStudy'
import Impact from '../components/Impact'
import { api } from '../api'
import { DEPARTMENTS, IV_FLUIDS, HEALTH_CONDITIONS } from '../lib/data'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import Spotlight from '../components/ui/Spotlight'
import DepartmentShowcase from '../components/ui/DepartmentShowcase'
import OrbitingDots from '../components/ui/OrbitingDots'
import RadialProgress from '../components/ui/RadialProgress'
import BentoGrid from '../components/ui/BentoGrid'
import GlowButton from '../components/ui/GlowButton'
import MagneticButton from '../components/ui/MagneticButton'

const STATEMENT_LINES = [
  { words: 'Precision nutrition is not a guess.'.split(' '), em: [] },
  { words: 'It is a decision, computed.'.split(' '), em: [3] },
]

const MARQUEE_ITEMS = [
  'ICU • SICU • MICU • TICU • CICU • EICU', 'NRS-2002 & mNUTRIC Screening',
  'Enteral & Parenteral Nutrition', 'TPN & IV Fluid Management',
  'Refeeding Syndrome Prevention', 'Breastfeeding & Lactation Diet',
  'Pediatric Growth Monitoring', 'GDM Meal Planning', 'Renal & Dialysis Diet',
  'Oncology Cachexia Support', 'Immunonutrition', 'ERAS Protocols',
]

const ICON_MAP = {
  icu: Activity, eicu: Activity, sicu: Activity, micu: Activity, ticu: Activity, cicu: Activity,
  picu: HeartPulse, ot: Activity, pediatric: HeartPulse, pregnancy: HeartPulse, nicu: HeartPulse,
  nephrology: Database, oncology: Sparkles, diabetes: TrendingUp, geriatric: HeartPulse,
}

const DEPT_CAROUSEL = DEPARTMENTS.map((d) => ({
  ...d,
  id: d.slug, title: d.name, description: d.tagline,
  icon: React.createElement(ICON_MAP[d.slug] || Activity, { size: 26, color: '#fff' }),
  tags: (d.assessmentTools || []).slice(0, 3),
}))

export default function Home() {
  const [overview, setOverview] = useState(null)
  const [datasetCount, setDatasetCount] = useState(null)
  const gridRef = useRef(null)
  const pipeRef = useRef(null)
  const navigate = useNavigate()
  useEffect(() => { api.overview().then(setOverview).catch(() => setOverview(null)) }, [])
  useEffect(() => { api.datasets().then((r) => setDatasetCount(r.datasets?.length ?? null)).catch(() => {}) }, [])

  // God-like hero scroll: layers drift, zoom & fade at different rates
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 800], [0, -180])
  const heroFade = useTransform(scrollY, [0, 560], [1, 0])
  const hero3DScale = useTransform(scrollY, [0, 800], [1, 1.2])
  const hero3DFade = useTransform(scrollY, [0, 640], [0.95, 0.1])

  // Quick-grid: 3D scroll-in tilt
  const gridProg = useScroll({ target: gridRef, offset: ['start end', 'center center'] }).scrollYProgress
  const gridRotateX = useTransform(gridProg, [0, 1], [16, 0])
  const gridY = useTransform(gridProg, [0, 1], [110, 0])
  const gridOpacity = useTransform(gridProg, [0, 0.7], [0.25, 1])

  // Pipeline strip: deterministic scroll-linked reveal (reverses on scroll-up)
  const pipeProg = useScroll({ target: pipeRef, offset: ['start end', 'end start'] }).scrollYProgress
  const pipeOpacity = useTransform(pipeProg, [0, 0.12], [0, 1])
  const pipeY = useTransform(pipeProg, [0, 0.12], [46, 0])

  return (
    <div style={{ position: 'relative' }}>
      {/* ==== Full-page Spline — even bigger, ball centered on right, covers display, no left blur ==== */}
      <motion.div
        className="hero-3d-bg"
        style={{
          scale: hero3DScale,
          opacity: hero3DFade,
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Spline even bigger, leaves screen, ball in center-right */}
        <div
          style={{
            position: 'absolute',
            right: '-18%',
            top: '50%',
            width: '82%',
            height: '148%',
            minWidth: 640,
            minHeight: 800,
            transform: 'translateY(-46%) scale(1.18)',
            transformOrigin: 'center right',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <SplineEmbed scene="hero" style={{ width: '100%', height: '100%' }} />
        </div>
      </motion.div>

      {/* ==== Hero — content over fixed Spline ==== */}
      <section className="home-hero" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
        <motion.div className="hero-shade" style={{ opacity: heroFade, position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />

        <div className="container hero-content">
          <motion.div style={{ y: heroY, opacity: heroFade }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <span className="hero-badge">ML-Validated • Evidence-Based Nutrition</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
              style={{ fontSize: 'clamp(38px, 6vw, 60px)', lineHeight: 1.08, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.025em', fontFamily: 'Sora, sans-serif' }}
            >
              Clinical Nutrition Decisions,<br />
              <span className="gradient-text">Verified by ML Models</span>
            </motion.h1>
            <motion.p className="hero-sub" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
              We run patient data — labs, vitals, ward and history — through 21 trained ML models. The models compute the nutrition plan and every factor is shown for clinical verification.
            </motion.p>
            <motion.div className="hero-cta" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}>
              <MagneticButton intensity={0.14} onClick={() => navigate('/assessment')}>Start Assessment <ArrowRight size={14} /></MagneticButton>
              <GlowButton variant="ghost" to="/departments">Departments <ArrowRight size={14} /></GlowButton>
            </motion.div>
            <motion.div className="hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}>
              {[
                { v: overview?.total_models ?? 21, l: 'ML models trained' },
                { v: overview?.agents?.length ?? 6, l: 'ML verification layers' },
                { v: 14, l: 'departments & wards' },
                { v: datasetCount ?? 12, l: 'real datasets' },              ].map((s, i) => (
                <div key={i}>
                  <AnimatedCounter target={s.v} duration={1.4 + i * 0.25} style={{ fontSize: 26, fontWeight: 700, color: '#A5B4FF', letterSpacing: -0.02 * 1 + 'em' }} />
                  <div className="stat-l">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ==== Marquee (skews with scroll velocity) ==== */}
      <div className="marquee-band">
        <Marquee speed={36} skew>
          {MARQUEE_ITEMS.map((m, i) => (
            <MarqueeItem key={i} label={m} color={i % 2 ? '#f5b041' : '#A78BFA'} />
          ))}
        </Marquee>
      </div>

      {/* ==== Quick nav cards with Spotlight ==== */}
      <section className="home-section">
        <div className="container">
          <motion.div ref={gridRef} style={{ rotateX: gridRotateX, y: gridY, opacity: gridOpacity, transformPerspective: 1200, transformOrigin: '50% 0%' }}>
          <div className="section-head">
            <span className="section-kicker">Navigate</span>
            <SplitReveal as="h2" className="section-title">Explore the <span className="gradient-text">System</span></SplitReveal>
          </div>
          <div className="quick-grid">
            {[
              { to: '/departments', icon: Building2, color: '#ef4444', t: 'Departments & Wards', d: 'ICU, EICU, SICU, MICU, TICU, CICU, OT, pediatric, pregnancy and more' },
              { to: '/medications', icon: Pill, color: '#A78BFA', t: 'Medications & IV Drips', d: 'Medication–food interactions, IV fluids, electrolytes and combinations' },
              { to: '/assessment', icon: Sparkles, color: '#22c55e', t: 'Health Assessment', d: 'Screening for weight changes, hair fall, protein intake and malnutrition' },
              { to: '/camera', icon: ScanLine, color: '#06b6d4', t: 'Camera Lab', d: 'Spot vitamin deficiencies from real clinical photos' },
              { to: '/recommend', icon: HeartPulse, color: '#ec4899', t: 'Recommendation Lab', d: 'A meal plan built for one specific patient' },
              { to: '/knowledge-graph', icon: Boxes, color: '#60A5FA', t: 'Knowledge Graph', d: 'An interactive map of foods, nutrients and diseases' },
              { to: '/ml-results', icon: LayoutDashboard, color: '#f59e0b', t: 'ML Results', d: 'How all 21 models scored, side by side' },
              { to: '/database', icon: Database, color: '#60a5fa', t: 'Database Explorer', d: 'Browse the raw eICU, Synthea, USDA and CNF datasets' },
            ].map((c, i) => (
              <motion.div
                key={c.to}
                style={{
                  opacity: useTransform(gridProg, [0.04 + i * 0.06, 0.3 + i * 0.06], [0, 1]),
                  y: useTransform(gridProg, [0.04 + i * 0.06, 0.3 + i * 0.06], [34, 0]),
                }}
              >
                <Spotlight color={`${c.color}15`} size={180}>
                  <Link to={c.to} className="quick-card" style={{ display: 'block' }}>
                    <span className="quick-ico" style={{ background: `${c.color}1f`, color: c.color }}><c.icon size={24} /></span>
                    <h3>{c.t}</h3>
                    <p>{c.d}</p>
                    <span className="quick-more">Open <ArrowRight size={14} /></span>
                  </Link>
                </Spotlight>
              </motion.div>
            ))}
          </div>
          </motion.div>
        </div>
      </section>

      {/* ==== Department Showcase Grid ==== */}
      <section className="home-section alt">
        <div className="container">
          <span className="section-orb section-orb--a" />
          <span className="section-orb section-orb--b" />
          <div className="section-head">
            <span className="section-kicker">Interactive Showcase</span>
            <SplitReveal as="h2" className="section-title">Department-Wise <span className="gradient-text">Clinical Nutrition</span></SplitReveal>
            <p className="section-sub">Every ward has its own nutrition protocol. Click any card to see its screening tools, conditions and watch-outs.</p>
          </div>
          <Parallax from={70} to={0}><DepartmentShowcase items={DEPT_CAROUSEL} /></Parallax>
        </div>
      </section>

      {/* ==== Bento Feature Grid ==== */}
      <section className="home-section">
        <div className="container">
          <div className="section-head">
            <span className="section-kicker">Key Features</span>
            <SplitReveal as="h2" className="section-title">Built for <span className="gradient-text">Clinical Precision</span></SplitReveal>
          </div>
          <BentoGrid columns={3} gap={16} items={[
            { id: 'stats', colSpan: 2, rowSpan: 1, color: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(96,165,250,0.05))', content: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '8px 0' }}>
                <RadialProgress value={92} size={80} label="Accuracy" />
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#F3F4F6' }}>21 ML Models</h3>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#A78BFA' }}>Regression, classification and clustering models, each scored with SHAP explainability</p>
                </div>
              </div>
            )},
            { id: 'kg', colSpan: 1, rowSpan: 2, color: 'linear-gradient(180deg, rgba(96,165,250,0.12), rgba(59,130,246,0.05))', content: (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <OrbitingDots count={10} size={80} dotSize={6} duration={4} />
                <h3 style={{ marginTop: 16, fontSize: 16, color: '#F3F4F6' }}>Knowledge Graph</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: '#A78BFA', marginTop: 6 }}>8,000 foods connected to 477 nutrients and 55,000 links</p>
                <Link to="/knowledge-graph" style={{ fontSize: 12, color: '#A78BFA', marginTop: 10 }}>Explore →</Link>
              </div>
            )},
            { id: 'agents', colSpan: 1, rowSpan: 1, color: 'rgba(34,197,94,0.08)', content: (
              <div><h3 style={{ fontSize: 15, color: '#22c55e', margin: '0 0 6px' }}>6 ML Verification Checks</h3><p style={{ fontSize: 13, lineHeight: 1.55, color: '#A78BFA', margin: 0 }}>Each check validates a step: assessment, planning, monitoring, drug–nutrient review, imaging and reporting</p></div>
            )},
            { id: 'datasets', colSpan: 1, rowSpan: 1, color: 'rgba(59,130,246,0.08)', content: (
              <div><h3 style={{ fontSize: 15, color: '#60a5fa', margin: '0 0 6px' }}>12 Real Datasets</h3><p style={{ fontSize: 13, lineHeight: 1.55, color: '#A78BFA', margin: 0 }}>eICU, Synthea, USDA, CNF, A–Z medicines and more</p></div>
            )},
            { id: 'reports', colSpan: 2, rowSpan: 1, color: 'rgba(236,72,153,0.08)', content: (
              <div><h3 style={{ fontSize: 15, color: '#ec4899', margin: '0 0 6px' }}>Printable Reports</h3><p style={{ fontSize: 13, lineHeight: 1.55, color: '#A78BFA', margin: 0 }}>Generate, print and download the finished nutrition assessment report</p></div>
            )},
            { id: 'iv', colSpan: 1, rowSpan: 1, color: 'rgba(249,115,22,0.08)', content: (
              <div><h3 style={{ fontSize: 15, color: '#f97316', margin: '0 0 6px' }}>IV Fluid Planning</h3><p style={{ fontSize: 13, lineHeight: 1.55, color: '#A78BFA', margin: 0 }}>Suggested IV fluids with electrolytes, calculated per department</p></div>
            )},
          ]} />
        </div>
      </section>

      {/* ==== IV / Meds + Conditions with Spotlight ==== */}
      <section className="home-section alt">
        <div className="container">
          <span className="section-orb section-orb--c" />
          <Parallax from={60} to={-30}>
          <div className="split-features">
            <Spotlight color="rgba(167,139,250,0.06)" size={200}>
              <div className="card feature-card">
                <span className="feature-tag">IV & Medications</span>
                <h3><Pill size={22} style={{ color: '#A78BFA' }} /> IV Fluids & Drips</h3>
                <p>The full reference for IV fluids and drips — NS, DNS, RL, D5W — plus additives like thiamine, potassium, magnesium and phosphate.</p>
                <div className="mini-list">{IV_FLUIDS.slice(0, 4).map((f) => (<div key={f.name}><span />{f.name}</div>))}</div>
                <Link to="/medications" className="text-link">Full medications & IV library <ArrowRight size={14} /></Link>
              </div>
            </Spotlight>
            <Spotlight color="rgba(34,197,94,0.06)" size={200}>
              <div className="card feature-card">
                <span className="feature-tag">Health Screening</span>
                <h3><Sparkles size={22} style={{ color: '#22c55e' }} /> Condition Assessments</h3>
                <p>Detailed intake forms for each condition, with optional photo-based analysis.</p>
                <div className="mini-list">{HEALTH_CONDITIONS.slice(0, 5).map((c) => (<div key={c.id}><span style={{ background: c.color }} />{c.name}</div>))}</div>
                <Link to="/assessment" className="text-link">Start an assessment <ArrowRight size={14} /></Link>
              </div>
            </Spotlight>
          </div>
          </Parallax>
        </div>
      </section>

      {/* ==== Pipeline teaser ==== */}
      <section className="home-section">
        <div className="container">
          <span className="section-orb section-orb--d" />
          <div className="section-head">
            <span className="section-kicker">Project Summary</span>
            <SplitReveal as="h2" className="section-title">From Raw Data to <span className="gradient-text">Precision Nutrition</span></SplitReveal>
          </div>
          <motion.div className="pipeline-strip" ref={pipeRef} style={{ opacity: pipeOpacity, y: pipeY }}>
            {[
              ['01', 'Multi-source Data', 'eICU • Synthea • USDA • CNF • Images'],
              ['02', 'Preprocessing', 'Cleaning, matching, patient-seeded joins'],
              ['03', 'ML Units 1-5', '21 regression/classification/clustering models'],
              ['04', 'Knowledge Graph', '8,000 foods • 477 nutrients • 55k links'],
              ['05', 'ML Verification', '6 clinical verification layers cross-check results'],
              ['06', 'Deployment', 'Live web app with camera & reports'],
            ].map(([n, t, d]) => (
                <div key={n} className="pipeline-step">
                  <span className="step-num">{n}</span>
                  <strong>{t}</strong>
                  <em>{d}</em>
                </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==== Project content sections ==== */}
      <section className="home-section alt"><div className="container"><ProblemSection /></div></section>
      <section className="home-section"><div className="container"><Architecture /></div></section>
      <section className="home-section alt"><div className="container"><AgentSystem /></div></section>
      <section className="home-section"><div className="container"><Explainability /></div></section>
      <section className="home-section alt"><div className="container"><CaseStudy /></div></section>
      <section className="home-section"><div className="container"><Impact /></div></section>
      {/* ==== Pinned scroll statement finale (San Rita / Podium) ==== */}
      <ScrollStatement lines={STATEMENT_LINES} />

      {/* ==== Finale — Spline + Quote ==== */}
      <section className="home-section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SplineSection
            scene="finale"
            kicker="A closing thought"
            title="Nourishment, shaped with care"
            quote="The right nourishment doesn’t simply sustain life—it shapes it."
            height={620}
          >
            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <MagneticButton intensity={0.12} onClick={() => navigate('/recommend')}>Plan a meal <ArrowRight size={14} /></MagneticButton>
              <GlowButton variant="ghost" to="/knowledge-graph">Explore foods <ArrowRight size={14} /></GlowButton>
            </div>
          </SplineSection>
        </div>
      </section>
    </div>
  )
}
