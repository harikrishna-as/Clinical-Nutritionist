import React, { useState } from 'react'
import { TrendingUp, ShieldCheck, Network, Layers, BarChart3, Database } from 'lucide-react'
import { api, useFetch } from '../api'
import { Reveal } from './Reveal'

export default function MLResults() {
  const { data: report, loading } = useFetch(() => api.report(), [])
  const [tab, setTab] = useState('Regression')

  const sections = report?.sections || {}
  const sectionKeys = ['Regression', 'Classification', 'Clustering', 'Ensemble', 'Dimensionality Reduction']
  const icons = { Regression: TrendingUp, Classification: ShieldCheck, Clustering: Network, Ensemble: Layers, 'Dimensionality Reduction': BarChart3 }

  if (loading) return <div style={{ color: '#94A3B8', textAlign: 'center', padding: 60 }}>Loading results...</div>
  if (!report) return <div style={{ color: '#94A3B8', textAlign: 'center', padding: 60 }}>No report available</div>

  const currentSection = sections[tab]
  const Icon = icons[tab] || BarChart3

  const metricKeys = {
    Regression: ['R-Squared', 'RMSE', 'MSE', 'MAE'],
    Classification: ['Precision', 'Recall', 'F1 Score'],
    Clustering: ['Silhouette', 'Davies-Bouldin'],
    Ensemble: ['F1 Score', 'Train Accuracy', 'Test Accuracy'],
    'Dimensionality Reduction': ['total_variance_explained', 'n_components'],
  }

  const keys = metricKeys[tab] || []

  const formatVal = (model, k) => {
    let v = model[k]
    if (typeof v === 'number') {
      if (k === 'n_components') return v
      return v.toFixed(4)
    }
    return v ?? '—'
  }

  const maxValue = (key) => {
    const models = currentSection?.models || []
    const vals = models.map((m) => (typeof m[key] === 'number' ? m[key] : 0))
    return Math.max(...vals, 0.001)
  }

  return (
    <div>
      <div className="section-kicker">Learning Core: Units 1-5</div>
      <h2 className="section-title">Model Evaluation <span className="gradient-text">Dashboard</span></h2>
      <p className="section-sub" style={{ marginBottom: 40 }}>
        Live metrics from <strong style={{ color: '#A78BFA' }}>clinical_nutrition_report.json</strong>; 21 models
        evaluated on the integrated patient-food dataset.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        {sectionKeys.map((k) => {
          const active = tab === k
          const I = icons[k] || BarChart3
          const count = sections[k]?.models?.length || 0
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 999,
                border: active ? '1px solid #60A5FA' : '1px solid rgba(148,163,184,0.35)',
                background: active ? 'rgba(59,130,246,0.25)' : 'rgba(30,41,59,0.6)',
                color: active ? '#A78BFA' : '#94A3B8',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <I size={16} /> {k} <span style={{ opacity: 0.6, fontSize: 12 }}>({count})</span>
            </button>
          )
        })}
      </div>

      <Reveal>
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon size={18} color="#A78BFA" />
            <h3 style={{ fontSize: 18 }}>{tab} Models</h3>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94A3B8' }}>
              {currentSection?.description}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  <th style={{ textAlign: 'left', padding: '14px 24px' }}>Model</th>
                  {keys.map((k) => (
                    <th key={k} style={{ textAlign: 'left', padding: '14px 16px' }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(currentSection?.models || []).map((m, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                    <td style={{ padding: '14px 24px', fontWeight: 600, color: '#F3F4F6' }}>{m.model}</td>
                    {keys.map((k) => {
                      const v = formatVal(m, k)
                      const isNum = typeof v === 'number' || !isNaN(parseFloat(v))
                      const max = maxValue(k)
                      const numVal = typeof m[k] === 'number' ? m[k] : (typeof v === 'number' ? v : 0)
                      const pct = typeof m[k] === 'number' ? (m[k] / max) * 100 : 0
                      return (
                        <td key={k} style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {typeof m[k] === 'number' && k !== 'n_components' && (
                              <div style={{ width: 80, height: 6, borderRadius: 3, background: 'rgba(96,165,250,0.15)', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#3B82F6,#A78BFA)', borderRadius: 3 }} />
                              </div>
                            )}
                            <span>{isNum ? (typeof v === 'number' ? v.toFixed(4) : v) : v}</span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
