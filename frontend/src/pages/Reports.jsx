import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Printer, Download, FileText, ArrowLeft, Share2 } from 'lucide-react'
import { HEALTH_CONDITIONS } from '../lib/data'
import SaveToggle from '../components/ui/SaveToggle'
import GlassCard from '../components/ui/GlassCard'

export default function Reports() {
  const [params] = useSearchParams()
  const [patient, setPatient] = useState(params.get('patient') || '')
  const [condId, setCondId] = useState(params.get('cond') || '')
  const [saved, setSaved] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const condition = HEALTH_CONDITIONS.find((c) => c.id === condId) || null

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem('cnd_reports') || '[]')) } catch { setSaved([]) }
  }, [])

  const generate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: condId, Name: patient, Age: 30, Weight: 60, Height: 160 }),
      })
      const data = await res.json()
      const rep = { ...data, patient, conditionId: condId, date: new Date().toLocaleString() }
      setReport(rep)
      const next = [rep, ...saved.filter((s) => s.patient !== patient)].slice(0, 20)
      setSaved(next)
      localStorage.setItem('cnd_reports', JSON.stringify(next))
    } catch (err) { alert('Could not generate report: ' + err.message) } finally { setLoading(false) }
  }

  const load = (r) => {
    setReport(r); setPatient(r.patient); setCondId(r.conditionId || '')
    setCondId(r.conditionId || condId)
  }

  const print = () => window.print()

  const download = () => {
    const text = buildText(report)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Clinical_Nutrition_Report_${(report.patient || 'patient').replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <h1>Reports <span className="gradient-text">& Print</span></h1>
          <p>Generate, preview, print to PDF or download the assessment report directly on your system.</p>
        </div>
      </section>

      <section className="page-body">
        <div className="container">
          <div className="report-layout">
            <div className="report-tools">
              <form onSubmit={generate} className="card">
                <h3>New Report</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={label}>Patient Name</label>
                    <input style={input} value={patient} onChange={(e) => setPatient(e.target.value)} />
                  </div>
                  <div>
                    <label style={label}>Condition</label>
                    <select style={input} value={condId} onChange={(e) => setCondId(e.target.value)}>
                      <option value="">Select...</option>
                      {HEALTH_CONDITIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-primary" disabled={loading || !condId} style={{ justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
                    <FileText size={17} /> {loading ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </form>

              {saved.length > 0 && (
                <div className="card">
                  <h3>Saved Reports</h3>
                  {saved.map((r, i) => (
                    <button key={i} className="saved-report" onClick={() => load(r)}>
                      <strong>{r.patient || 'Patient'}</strong>
                      <em>{r.condition_label} • {r.date}</em>
                    </button>
                  ))}
                </div>
              )}

              <div className="report-actions-stack">
                <button className="btn btn-primary" onClick={print} disabled={!report}>
                  <Printer size={16} /> Print / Save as PDF
                </button>
                <SaveToggle idleText="Download Report" savedText="Downloaded!" loadingDuration={1200} successDuration={800} onSave={download} />
              </div>
            </div>

            <div className="report-preview-area">
              {!report ? (
                <div className="card empty-result" style={{ minHeight: 300 }}>
                  <FileText size={48} strokeWidth={1} style={{ opacity: 0.35, marginBottom: 12 }} />
                  <p>Generate a report to preview it here.</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF' }}>Reports are also generated from the Health Assessment page.</p>
                </div>
              ) : (
                <div className="report-paper">
                  <div className="report-paper-head">
                    <div>
                      <div className="report-logo">N</div>
                      <h2>Clinical Nutrition Assessment Report</h2>
                      <p>Explainable Multi-Agent AI Clinical Nutrition DSS</p>
                    </div>
                    <div className="report-meta">
                      <div><span>Patient</span><strong>{report.patient}</strong></div>
                      <div><span>Date</span><strong>{report.date}</strong></div>
                      <div><span>Condition</span><strong>{report.condition_label}</strong></div>
                    </div>
                  </div>

                  <div className="report-badge" style={{ background: `${report.risk_color}1f`, color: report.risk_color }}>
                    RISK LEVEL: {report.risk_level}
                  </div>

                  <h4>Summary</h4>
                  <p>{report.summary}</p>

                  <h4>Dietary Plan</h4>
                  <ol>{report.plan.map((p, i) => <li key={i}>{p}</li>)}</ol>

                  {report.recommended_foods?.length > 0 && (
                    <>
                      <h4>Recommended Foods</h4>
                      <div className="report-tags">
                        {report.recommended_foods.map((f) => <span key={f}>{f}</span>)}
                      </div>
                    </>
                  )}

                  {report.foods_to_avoid?.length > 0 && (
                    <>
                      <h4>Foods to Avoid</h4>
                      <div className="report-tags red">
                        {report.foods_to_avoid.map((f) => <span key={f}>{f}</span>)}
                      </div>
                    </>
                  )}

                  <h4>Lab Follow-up</h4>
                  <div className="report-tags">
                    {report.labs.map((l) => <span key={l}>{l}</span>)}
                  </div>

                  <div className="report-footer">
                    <p>Generated by Clinical Nutrition DSS; for use under clinician supervision. This report is informational and not a substitute for professional medical advice.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const label = { display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 600 }
const input = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.4)',
  background: 'rgba(13,5,36,0.8)', color: '#fff', fontSize: 14, fontFamily: 'inherit',
}

function buildText(r) {
  const L = (s) => s.split('\n').map((l) => '  ' + l).join('\n')
  return [
    '='.repeat(64),
    '  CLINICAL NUTRITION ASSESSMENT REPORT',
    '  Explainable Multi-Agent AI Clinical Nutrition DSS',
    '='.repeat(64),
    '',
    `Patient    : ${r.patient}`,
    `Date       : ${r.date}`,
    `Condition  : ${r.condition_label}`,
    `Risk Level : ${r.risk_level}`,
    '',
    'SUMMARY',
    '-'.repeat(64),
    L(r.summary),
    '',
    'DIETARY PLAN',
    '-'.repeat(64),
    r.plan.map((p, i) => `  ${i + 1}. ${p}`).join('\n'),
    '',
    'RECOMMENDED FOODS',
    '-'.repeat(64),
    r.recommended_foods?.map((f) => `  • ${f}`).join('\n') || 'None recorded',
    '',
    'FOODS TO AVOID',
    '-'.repeat(64),
    r.foods_to_avoid?.map((f) => `  • ${f}`).join('\n') || 'None recorded',
    '',
    'LAB FOLLOW-UP',
    '-'.repeat(64),
    r.labs?.map((l) => `  • ${l}`).join('\n') || 'None recorded',
    '',
    '='.repeat(64),
    'For use under clinician supervision. Informational only.',
    '='.repeat(64),
  ].join('\n')
}
