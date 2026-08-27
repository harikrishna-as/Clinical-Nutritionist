import React from 'react'
import { Reveal } from './Reveal'

const PILLARS = [
  { n: '01', t: 'Clinical Trust', s: 'Every decision explained', d: 'SHAP/LIME breakdowns and plain-language reports turn opaque AI into a tool clinicians can actually check.' },
  { n: '02', t: 'Precision at Scale', s: 'One patient to one million', d: 'It personalizes to a single patient from real clinical data, yet the same pipeline can serve a whole hospital at once.' },
  { n: '03', t: 'Safe & Culturally Aware', s: 'Constraints respected', d: 'Allergies, medications and cultural preferences are enforced in every plan, automatically.' },
]

const FUTURE = [
  ['LLM-powered agents', 'natural-language consultations'],
  ['Real EHR integration', 'FHIR-based clinical deployment'],
  ['Clinical validation', 'trials with dietitians & hospitals'],
  ['Multilingual reports', 'global, accessible explainability'],
  ['Mobile & wearable', 'continuous precision nutrition'],
]

export default function Impact() {
  return (
    <div>
      <div className="section-kicker" style={{ color: '#f5b041', borderColor: 'rgba(245,176,65,0.4)' }}>The Big Picture</div>
      <h2 className="section-title">Precision Nutrition <span className="gradient-text">at Scale</span></h2>
      <p className="section-sub" style={{ marginBottom: 48 }}>
        One transparent decision at a time — for clinicians, patients and hospitals.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
        {PILLARS.map((p, i) => (
          <Reveal key={p.n} delay={i * 80}>
            <div className="card">
              <div style={{
                width: 46, height: 46, borderRadius: 14, marginBottom: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(96,165,250,0.4)',
                color: '#A78BFA', fontWeight: 700, fontSize: 15,
              }}>{p.n}</div>
              <h3 style={{ fontSize: 18, marginBottom: 4 }}>{p.t}</h3>
              <p style={{ fontSize: 13, color: '#A78BFA', marginBottom: 12 }}>{p.s}</p>
              <p style={{ fontSize: 14, color: '#94A3B8' }}>{p.d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <Reveal>
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 20 }}>Conclusion</h3>
            {[
              'End-to-end explainable pipeline spanning ML Units 1-5.',
              'Six specialist agents orchestrated into one safe system.',
              'Every recommendation is transparent and patient-readable.',
              'Proven on real clinical, EHR and national food datasets.',
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                <span style={{
                  width: 24, height: 24, minWidth: 24, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 12,
                }}>✓</span>
                <span style={{ fontSize: 14 }}>{d}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 20, color: '#A78BFA' }}>Future Work</h3>
            {FUTURE.map(([t, d], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                <span style={{
                  width: 24, height: 24, minWidth: 24, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(96,165,250,0.2)', color: '#A78BFA', fontSize: 11,
                }}>�-�</span>
                <div>
                  <h4 style={{ fontSize: 14, color: '#A78BFA' }}>{t}</h4>
                  <p style={{ fontSize: 13, color: '#94A3B8' }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div style={{
          marginTop: 48,
          textAlign: 'center',
          padding: '32px 24px',
          borderRadius: 20,
          background: 'linear-gradient(90deg,#3B82F6,#60A5FA)',
          border: '1px solid rgba(167,139,250,0.5)',
        }}>
          <h3 style={{ fontSize: 26, marginBottom: 6 }}>6 agents • 10 phases • 1 goal</h3>
          <p style={{ opacity: 0.9, fontSize: 15 }}>From generic guidelines to a plan that fits one patient.</p>
        </div>
      </Reveal>
    </div>
  )
}
