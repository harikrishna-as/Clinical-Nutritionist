import React from 'react'
import { Reveal } from './Reveal'

const PROBLEMS = [
  { icon: '✕', t: 'One-size-fits-all advice', d: "Generic dietary guidelines cannot account for one patient's biology, genes or lifestyle.", color: '#ef4444' },
  { icon: '✕', t: 'Black-box AI distrust', d: 'Most models give an answer with no reasons, so clinicians have to take it on faith.', color: '#ef4444' },
  { icon: '✕', t: 'Unsafe oversights', d: 'Allergies, medications and food culture rarely make it into the meal plan.', color: '#ef4444' },
  { icon: '✓', t: 'Truly personalized plans', d: "Calories and macros calculated from that patient's actual numbers.", color: '#22c55e' },
  { icon: '✓', t: 'Transparent reasoning', d: 'Every recommendation explains itself in plain clinical terms.', color: '#22c55e' },
  { icon: '✓', t: 'Safety-first intelligence', d: 'Allergies, medications and cultural preferences are checked automatically.', color: '#22c55e' },
]

export default function ProblemSection() {
  return (
    <div>
      <div className="section-kicker">Why This Matters</div>
      <h2 className="section-title">The Problem We Are <span className="gradient-text">Solving</span></h2>
      <p className="section-sub" style={{ marginBottom: 48 }}>
        Diet is a big part of preventing and managing chronic disease, but a truly personalized
        meal plan is slow and hard to produce by hand. This system does it in minutes, and shows its work.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Reveal>
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 20, color: '#ef4444' }}>The Clinical Gap</h3>
            {PROBLEMS.slice(0, 3).map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, minWidth: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 14,
                }}>{p.icon}</div>
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 3 }}>{p.t}</h4>
                  <p style={{ fontSize: 13, color: '#94A3B8' }}>{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 20, color: '#22c55e' }}>What Patients & Clinicians Need</h3>
            {PROBLEMS.slice(3).map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, minWidth: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 14,
                }}>{p.icon}</div>
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 3 }}>{p.t}</h4>
                  <p style={{ fontSize: 13, color: '#94A3B8' }}>{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 28 }}>
        {[
          { big: '650M+', small: 'adults live with obesity (WHO)', accent: '#f5b041' },
          { big: '1 in 3', small: 'diet-related chronic disease risk', accent: '#A78BFA' },
          { big: '0', small: 'explanations sacrificed for accuracy', accent: '#22c55e' },
        ].map((s, i) => (
          <Reveal key={i} delay={i * 80}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: s.accent, fontFamily: 'var(--display)' }}>{s.big}</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>{s.small}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
