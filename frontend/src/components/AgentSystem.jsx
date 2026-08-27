import React from 'react'
import { User, Utensils, ShieldAlert, Pill, Globe2, Sparkles } from 'lucide-react'
import { Reveal } from './Reveal'

const AGENTS = [
  {
    name: 'Patient Analysis Agent',
    icon: User,
    role: 'Clinical profile',
    color: '#3B82F6',
    desc: 'Reads the chart, labs and vitals, flags risks, and sets nutritional targets.',
  },
  {
    name: 'Nutrition Agent',
    icon: Utensils,
    role: 'Needs & targets',
    color: '#22c55e',
    desc: 'Calculates calories and macros using standard clinical formulas.',
  },
  {
    name: 'Allergy Agent',
    icon: ShieldAlert,
    role: 'Safety guard',
    color: '#ef4444',
    desc: 'Checks every food against known allergies and suggests safe swaps.',
  },
  {
    name: 'Medication-Diet Agent',
    icon: Pill,
    role: 'Drug interactions',
    color: '#f5b041',
    desc: 'Catches food–drug clashes, like metformin with alcohol or ACE inhibitors with potassium.',
  },
  {
    name: 'Cultural Agent',
    icon: Globe2,
    role: 'Food preferences',
    color: '#06b6d4',
    desc: "Keeps plans realistic for local food, what's available, and how patients actually eat.",
  },
  {
    name: 'Recommendation Agent',
    icon: Sparkles,
    role: 'Final synthesis',
    color: '#A78BFA',
    desc: 'Merges all six outputs into one agreed meal plan and scores how confident it is.',
  },
]

export default function AgentSystem() {
  return (
    <div>
      <div className="section-kicker">The Collaborative Brain</div>
      <h2 className="section-title">Six Specialized <span className="gradient-text">AI Agents</span></h2>
      <p className="section-sub" style={{ marginBottom: 48 }}>
        Each agent handles one job, and they check each other's work. A last step merges
        everything into a single plan instead of six separate opinions.
      </p>

      <div style={{ position: 'relative', padding: '40px 0' }}>
        {/* Central orchestrator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <div
            className="glow-anim"
            style={{
              background: 'linear-gradient(90deg,#3B82F6,#60A5FA)',
              borderRadius: 20,
              padding: '20px 44px',
              textAlign: 'center',
              border: '1px solid rgba(167,139,250,0.5)',
            }}
          >
            <h3 style={{ fontSize: 22, marginBottom: 2 }}>Agent Orchestrator</h3>
            <p style={{ fontSize: 13, opacity: 0.85 }}>collects the six agents' answers, resolves conflicts, returns one plan with a confidence score</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {AGENTS.map((a, i) => {
            const Icon = a.icon
            return (
              <Reveal key={a.name} delay={i * 60}>
                <div className="card" style={{ padding: 24, display: 'flex', gap: 16, height: '100%', minHeight: 168 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    minWidth: 52,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${a.color}22`,
                    border: `1px solid ${a.color}66`,
                  }}>
                    <Icon size={24} color={a.color} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ fontSize: 16 }}>{a.name}</h4>
                    </div>
                    <span style={{ fontSize: 11, color: a.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {a.role}
                    </span>
                    <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, lineHeight: 1.5 }}>{a.desc}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </div>
  )
}
