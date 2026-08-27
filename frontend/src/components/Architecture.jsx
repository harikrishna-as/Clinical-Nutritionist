import React from 'react'
import { Reveal } from './Reveal'

const ARCH_PHASES = [
  { n: '01', t: 'Data Integration', d: 'clean • integrate • reduce • transform' },
  { n: '02', t: 'Knowledge Graph', d: 'foods • nutrients • diseases' },
  { n: '03', t: 'Regression Models', d: 'calorie & macro prediction' },
  { n: '04', t: 'Classification', d: 'risk assessment (readmission)' },
  { n: '05', t: 'Clustering', d: 'patient segmentation + Apriori' },
  { n: '06', t: 'Ensemble Learning', d: 'RF • AdaBoost • XGBoost' },
  { n: '07', t: 'Dimensionality', d: 'PCA • LDA' },
  { n: '08', t: 'Multi-Agent System', d: '6 specialist agents' },
  { n: '09', t: 'Explainability', d: 'SHAP / LIME rationale' },
  { n: '10', t: 'Report Generation', d: 'clinical nutrition report' },
]

export default function Architecture() {
  return (
    <div>
      <div className="section-kicker">End-to-End Pipeline</div>
      <h2 className="section-title">System Architecture: <span className="gradient-text">10 Phases</span></h2>
      <p className="section-sub" style={{ marginBottom: 48 }}>
        Raw data goes in, a reasoned recommendation comes out. These are the ten steps in
        between — every unit of the ML syllabus.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {ARCH_PHASES.map((p, i) => (
          <Reveal key={p.n} delay={i * 40}>
            <div className="card" style={{ padding: 20, position: 'relative', overflow: 'hidden', height: 150, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: 'rgba(96,165,250,0.35)', fontFamily: 'var(--display)' }}>
                {p.n}
              </div>
              <h4 style={{ fontSize: 15, margin: '8px 0 4px' }}>{p.t}</h4>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 'auto' }}>{p.d}</p>
              {i < ARCH_PHASES.length - 1 && (
                <div style={{ position: 'absolute', top: '40%', right: -8, color: '#A78BFA', fontSize: 16, opacity: 0.4 }}>›</div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
