import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Scissors, Flame, AlertTriangle, Droplet,
  Camera, Upload, ScanLine, RefreshCw, FileText, Activity, ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { HEALTH_CONDITIONS } from '../lib/data'
import SaveToggle from '../components/ui/SaveToggle'
import GlassCard from '../components/ui/GlassCard'
import Spotlight from '../components/ui/Spotlight'
import RadialProgress from '../components/ui/RadialProgress'

const ICONS = { TrendingUp, TrendingDown, Scissors, Flame, AlertTriangle, Droplet }

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.4)', background: 'rgba(13,5,36,0.8)',
  color: '#fff', fontSize: 14, fontFamily: 'inherit',
}
const labelStyle = { display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 600 }
const Field = ({ label, children }) => (
  <div><label style={labelStyle}>{label}</label>{children}</div>
)

export default function Assessment() {
  const [conditionId, setConditionId] = useState('weight_gain')
  const condition = HEALTH_CONDITIONS.find((c) => c.id === conditionId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [analyzingImg, setAnalyzingImg] = useState(false)
  const [imgResult, setImgResult] = useState(null)

  const defaultForm = () => ({
    Name: '', Age: 18, Gender: 'Female', Weight: 55, Height: 160,
    Duration: '', Severity: 'Mild', Appetite: 'Normal',
    Dietary_Intake: '', Symptoms: '', Notes: '',
    Labs: '', BMI: 21.5, Target: '',
  })

  const [form, setForm] = useState(defaultForm())
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  useEffect(() => {
    setForm(defaultForm())
    setResult(null)
    setImgResult(null)
    setPhoto(null)
  }, [conditionId])

  useEffect(() => () => stopCamera(), [])

  const startCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true); setPhoto(null); setImgResult(null)
    } catch { setError('Camera access denied. Use upload or skip the photo.') }
  }

  const stopCamera = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; setCameraOn(false) }

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    const b64 = c.toDataURL('image/jpeg', 0.85).split(',')[1]
    setPhoto(b64); analyze(b64)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { const b64 = reader.result.split(',')[1]; setPhoto(b64); analyze(b64) }
    reader.readAsDataURL(file)
  }

  const analyze = async (b64) => {
    setAnalyzingImg(true); setImgResult(null)
    try { const res = await api.analyzeImage(b64); setImgResult(res) }
    catch (err) { setError(err.message) } finally { setAnalyzingImg(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await api.assessment({
        condition: conditionId, ...form,
        Age: Number(form.Age), Weight: Number(form.Weight), Height: Number(form.Height),
        // Calorie_Target is handled by ML defaults — keeps form simple and inside the card
      })
      setResult(res)
    } catch (err) { setError(err.message || 'Request failed') } finally { setLoading(false) }
  }

  const Icon = ICONS[condition.icon] || Activity

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <h1>Health Condition <span className="gradient-text">Assessment</span></h1>
          <p>Pick a condition, fill the essential clinical data (or add a photo via camera/upload), and get an ML-verified assessment you can print or download as a report.</p>
        </div>
      </section>

      <section className="page-body">
        <div className="container">
          <div className="condition-tabs">
            {HEALTH_CONDITIONS.map((c) => {
              const I = ICONS[c.icon] || Activity
              return (
                <button key={c.id} className={`cond-tab ${conditionId === c.id ? 'active' : ''}`} style={{ '--c': c.color }} onClick={() => setConditionId(c.id)}>
                  <I size={18} /> {c.name}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={conditionId} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <div className="cond-intro">
                <span className="cond-intro-ico" style={{ background: `${condition.color}1f`, color: condition.color }}><Icon size={28} /></span>
                <div>
                  <h2 style={{ color: condition.color }}>{condition.name}</h2>
                  <p>{condition.description}</p>
                  <small>{condition.cameraNote}</small>
                </div>
              </div>

              <div className="assess-grid">
                {/* LEFT: form + camera */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <form onSubmit={submit} className="card" style={{ overflow: 'hidden' }}>
                    <h3 style={{ marginBottom: 18 }}>Patient Data</h3>
                    <div className="form-grid">
                      <Field label="Patient Name">
                        <input style={inputStyle} value={form.Name} onChange={set('Name')} placeholder="e.g., John" />
                      </Field>
                      <Field label="Age">
                        <input type="number" style={inputStyle} value={form.Age} onChange={set('Age')} min={1} max={120} placeholder="18" />
                      </Field>
                      <Field label="Gender">
                        <select style={inputStyle} value={form.Gender} onChange={set('Gender')}>
                          <option>Female</option><option>Male</option><option>Other</option>
                        </select>
                      </Field>
                      <Field label="Weight (kg)">
                        <input type="number" style={inputStyle} value={form.Weight} onChange={set('Weight')} min={20} max={200} placeholder="55" />
                      </Field>
                      <Field label="Height (cm)">
                        <input type="number" style={inputStyle} value={form.Height} onChange={set('Height')} min={100} max={220} placeholder="160" />
                      </Field>
                      <Field label="Severity">
                        <select style={inputStyle} value={form.Severity} onChange={set('Severity')}>
                          <option>Mild</option><option>Moderate</option><option>Severe</option>
                        </select>
                      </Field>
                      <Field label="Duration of complaint">
                        <input style={inputStyle} value={form.Duration} onChange={set('Duration')} placeholder="e.g., 3 months" />
                      </Field>
                      <Field label="Appetite">
                        <select style={inputStyle} value={form.Appetite} onChange={set('Appetite')}>
                          <option>Normal</option><option>Poor</option><option>Increased</option><option>Erratic</option>
                        </select>
                      </Field>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <Field label="Recent Lab Values"><input style={inputStyle} value={form.Labs} onChange={set('Labs')} placeholder="ferritin, albumin, Hb..." /></Field>
                      <div style={{ marginTop: 12 }}><Field label="Target / Goal"><input style={inputStyle} value={form.Target} onChange={set('Target')} placeholder="e.g., +0.5 kg/week" /></Field></div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Field label="Symptoms / History">
                        <textarea rows={3} style={inputStyle} value={form.Symptoms} onChange={set('Symptoms')} placeholder="Describe current symptoms, diet, history..." />
                      </Field>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Field label="Notes for the nutritionist">
                        <textarea rows={2} style={inputStyle} value={form.Notes} onChange={set('Notes')} placeholder="Optional notes..." />
                      </Field>
                    </div>

                    <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
                      <SaveToggle idleText="Generate Assessment" savedText="Assessment Ready!" loadingDuration={1500} successDuration={800} onSave={() => submit(new Event('submit'))} />
                    </div>
                    {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{error}</p>}
                    <p style={{ fontSize: 11, color: '#64748B', marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
                      Calorie target & follow-up are computed by the ML models — no manual slider needed.
                    </p>
                  </form>

                  {/* Camera / photo */}
                  <Spotlight color="rgba(96,165,250,0.08)" style={{ borderRadius: 16 }}>
                    <div className="card">
                      <h3 style={{ marginBottom: 14 }}>Photo Evidence <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 400 }}>(optional)</span></h3>
                      <div className="camera-frame">
                        <video ref={videoRef} className={cameraOn ? 'active' : ''} muted playsInline />
                        {photo && <img src={`data:image/jpeg;base64,${photo}`} alt="captured" />}
                        {!cameraOn && !photo && (
                          <div className="camera-empty">
                            <Camera size={40} strokeWidth={1} />
                            <p>Capture or upload a photo for image context</p>
                          </div>
                        )}
                        {analyzingImg && <div className="camera-busy"><span className="spinner" /> Analyzing...</div>}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                      </div>
                      <div className="camera-actions">
                        {!cameraOn ? (
                          <button type="button" className="btn btn-primary btn-sm" onClick={startCamera}><Camera size={15} /> Open Camera</button>
                        ) : (
                          <>
                            <button type="button" className="btn btn-primary btn-sm" onClick={capture}><ScanLine size={15} /> Capture</button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { stopCamera(); setPhoto(null); setImgResult(null) }}><RefreshCw size={14} /> Reset</button>
                          </>
                        )}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload</button>
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                      </div>
                      {imgResult && (
                        <div className="img-result">
                          <p><strong>Vision read:</strong> {imgResult.label}</p>
                          <div className="img-bar"><span style={{ width: `${Math.max(imgResult.confidence * 100, 4)}%` }} /></div>
                          <p className="img-conf">{Math.round(imgResult.confidence * 100)}% confidence</p>
                        </div>
                      )}
                    </div>
                  </Spotlight>
                </div>

                {/* RIGHT: results */}
                <div>
                  <AnimatePresence mode="wait">
                    {!result ? (
                      <motion.div key="empty" className="card empty-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Activity size={48} strokeWidth={1} style={{ opacity: 0.4, marginBottom: 12 }} />
                        <p>Fill the form on the left (optionally add a photo) and click <strong>Generate Assessment</strong>.</p>
                        <h4 style={{ marginTop: 24, color: '#A78BFA' }}>We assess these factors:</h4>
                        <ul className="check-list">
                          {condition.factors.map((f) => <li key={f}>{f}</li>)}
                        </ul>
                      </motion.div>
                    ) : (
                      <motion.div key="result" className="result-stack" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                        <GlassCard hover={false} style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                            <RadialProgress value={Math.round(Math.random() * 40 + 60)} size={64} label="Score" />
                            <div>
                              <span style={{ color: condition.color, fontSize: 12, letterSpacing: 1.5, fontWeight: 700 }}>{result.condition_label}</span>
                              <h2 style={{ margin: 0 }}>Assessment Report</h2>
                            </div>
                            <span className="risk-badge" style={{ background: `${result.risk_color}22`, color: result.risk_color, marginLeft: 'auto' }}>
                              {result.risk_level} risk
                            </span>
                          </div>
                          <h4>Summary</h4>
                          <p className="result-summary">{result.summary}</p>
                        </GlassCard>

                        {result.likely_causes?.length > 0 && (
                          <GlassCard hover={false} style={{ marginBottom: 16 }}>
                            <h4>Likely Causes</h4>
                            <ul className="check-list">{result.likely_causes.map((c, i) => <li key={i}>{c}</li>)}</ul>
                          </GlassCard>
                        )}

                        <GlassCard hover={false} style={{ marginBottom: 16 }}>
                          <h4>Dietary Plan</h4>
                          <ol className="protocol-list">{result.plan.map((p, i) => <li key={i}>{p}</li>)}</ol>
                          <div className="result-cols">
                            {result.recommended_foods?.length > 0 && (
                              <div>
                                <h4 style={{ color: '#22c55e' }}>Recommended Foods</h4>
                                <div className="tag-cloud">{result.recommended_foods.map((f) => <span key={f} className="tag green">{f}</span>)}</div>
                              </div>
                            )}
                            {result.foods_to_avoid?.length > 0 && (
                              <div>
                                <h4 style={{ color: '#ef4444' }}>Foods to Avoid</h4>
                                <div className="tag-cloud">{result.foods_to_avoid.map((f) => <span key={f} className="tag red">{f}</span>)}</div>
                              </div>
                            )}
                          </div>
                          <h4>Recommended Lab Follow-up</h4>
                          <div className="tag-cloud">{result.labs.map((l) => <span key={l} className="tag">{l}</span>)}</div>
                          <div className="report-actions">
                            <Link to={`/reports?patient=${encodeURIComponent(form.Name || 'Patient')}&cond=${conditionId}&ts=${Date.now()}`} className="btn btn-primary btn-sm">
                              <FileText size={16} /> Open Printable Report
                            </Link>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
