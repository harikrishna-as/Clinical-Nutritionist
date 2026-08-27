import React from 'react'
import { Reveal } from './Reveal'

const PROFILE = [
  ['Age / Gender', '55 / Male'],
  ['BMI', '28.5 (overweight)'],
  ['Glucose / BP', '135 mg/dL • 145/92 mmHg'],
  ['Cholesterol', '245 mg/dL'],
  ['Diagnosis', 'Type 2 Diabetes (medium)'],
  ['Allergies', 'Gluten'],
  ['Medications', 'Metformin • Lisinopril'],
  ['Culture', 'Indian cuisine preference'],
  ['Activity', 'Moderate • Target 2000 kcal'],
]

const RECS = ['Oats, lentils & legumes', 'Leafy greens, flax seeds', 'Grilled fish, quinoa', 'Low-GI fruits (berries)']
const AVOIDS = ['Gluten-containing foods', 'Sugary drinks & white bread', 'High-sodium processed foods']

export default function CaseStudy() {
  return (
    <div>
      <div className="section-kicker">Live Walkthrough</div>
      <h2 className="section-title">Case Study: <span className="gradient-text">Patient DEMO_001</span></h2>
      <p className="section-sub" style={{ marginBottom: 48 }}>
        Meet the patient: type 2 diabetes, a gluten allergy, on metformin and lisinopril,
        and a preference for Indian food. Watch the six agents turn this profile into a safe meal plan.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <Reveal>
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 20 }}>Patient Profile</h3>
            {PROFILE.map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: i < PROFILE.length - 1 ? '1px solid rgba(148,163,184,0.15)' : 'none' }}>
                <span style={{ width: 170, minWidth: 170, color: '#94A3B8', fontSize: 13 }}>{k}</span>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="card" style={{ background: '#0e1424' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 999,
                background: 'rgba(59,130,246,0.3)',
                color: '#A78BFA',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
              }}>AI RECOMMENDATIONS</span>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 999,
                background: 'rgba(245,176,65,0.15)',
                color: '#f5b041',
                fontSize: 11,
                fontWeight: 700,
              }}>92% confidence</span>
            </div>

            <h4 style={{ fontSize: 14, color: '#22c55e', marginBottom: 12 }}>Top Recommended Foods</h4>
            {RECS.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13.5 }}>
                <span style={{
                  width: 22, height: 22, minWidth: 22, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 12,
                }}>✓</span>
                {f}
              </div>
            ))}

            <h4 style={{ fontSize: 14, color: '#ef4444', margin: '20px 0 12px' }}>Foods to Avoid</h4>
            {AVOIDS.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13.5, color: '#fca5a5' }}>
                <span style={{
                  width: 22, height: 22, minWidth: 22, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 12,
                }}>✕</span>
                {f}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  )
}
