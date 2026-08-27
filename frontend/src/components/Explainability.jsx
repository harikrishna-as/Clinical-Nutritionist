import React from 'react'
import { Reveal } from './Reveal'

const EXPLAIN_POINTS = [
  { t: 'SHAP / LIME attribution', d: 'Each prediction shows which inputs drove it.', n: '01' },
  { t: 'Clinical rationale', d: 'Every recommendation cites the patient data behind it.', n: '02' },
  { t: 'Patient-readable reports', d: 'Plain-language output that a patient and clinician can both follow.', n: '03' },
  { t: 'Safety & audit', d: 'A clean audit trail, ready for regulated settings.', n: '04' },
]

const CHAIN = [
  { t: 'Calorie need', d: '↑ activity & weight → target 2594 kcal' },
  { t: 'Diabetes rule', d: 'sugar ≤ 25 g • fiber ≥ 30 g • carbs ≤ 45%' },
  { t: 'Allergy guard', d: 'gluten excluded automatically' },
  { t: 'Medication check', d: 'Metformin / Lisinopril diet compatibility' },
  { t: 'Recommendation', d: 'high-fiber, low-GI, gluten-free meal plan' },
]

export default function Explainability() {
  return (
    <div>
      <div className="section-kicker">Trust Through Transparency</div>
      <h2 className="section-title">Explainability <span className="gradient-text">Module</span></h2>
      <p className="section-sub" style={{ marginBottom: 48 }}>
        Every recommendation comes with the reasoning attached, so clinicians and patients
        can check it themselves instead of trusting it blindly.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <Reveal>
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 24 }}>Why Explainability Matters in Clinical Care</h3>
            {EXPLAIN_POINTS.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 40, height: 40, minWidth: 40, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(96,165,250,0.4)',
                  color: '#A78BFA', fontWeight: 700, fontSize: 13,
                }}>{p.n}</div>
                <div>
                  <h4 style={{ fontSize: 15, marginBottom: 4 }}>{p.t}</h4>
                  <p style={{ fontSize: 13, color: '#94A3B8' }}>{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="card" style={{ background: '#0e1424' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(59,130,246,0.3)',
              color: '#A78BFA',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              marginBottom: 24,
            }}>REASONING CHAIN: DEMO_001</span>
            {CHAIN.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{
                    width: 30, height: 30, minWidth: 30, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(96,165,250,0.2)', border: '1px solid #60A5FA',
                    color: '#A78BFA', fontSize: 12, fontWeight: 700,
                  }}>{i + 1}</div>
                  <div style={{ marginBottom: 22 }}>
                    <h4 style={{ fontSize: 14, color: '#A78BFA', marginBottom: 2 }}>{c.t}</h4>
                    <p style={{ fontSize: 13, color: '#94A3B8' }}>{c.d}</p>
                  </div>
                </div>
                {i < CHAIN.length - 1 && (
                  <div style={{ marginLeft: 14, color: '#60A5FA', opacity: 0.6, fontSize: 12, lineHeight: 0.5 }}>�-�</div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  )
}
