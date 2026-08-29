import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets, Camera, Upload, ScanLine, RefreshCw, FileText, Printer,
  Download, Activity, AlertTriangle, FlaskConical, User,
} from 'lucide-react'
import { api } from '../api'
import PhoneDrop from './PhoneDrop'

const inputStyle = {
  width: '100%', padding: '9px 13px', borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.4)', background: 'rgba(13,5,36,0.8)',
  color: '#fff', fontSize: 13.5, fontFamily: 'inherit',
}
const labelStyle = { display: 'block', fontSize: 11.5, color: '#94A3B8', marginBottom: 5, fontWeight: 600 }
const Field = ({ label, children }) => (
  <div><label style={labelStyle}>{label}</label>{children}</div>
)

// OCR text -> patient field extraction
function parseScan(text) {
  const out = {}
  const n = (re) => {
    const m = text.match(re)
    return m ? m[1] : null
  }
  const a = n(/age\s*[:\s]*(?:of\s*)?(\d{1,3})/i)
  if (a) out.Age = a
  const w = n(/(\d{2,3}(?:\.\d)?)\s*(?:kg|kgs|kilograms)/i)
  if (w) out.Weight = w
  const h = n(/(\d{2,3}(?:\.\d)?)\s*cm/i)
  if (h) out.Height = h
  const name = text.match(/(?:name|patient)[:\s]*([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){0,2})/i)
  if (name) out.Name = name[1].trim()
  const na = n(/(?:na\+?|sodium)\s*[=:\s]*(\d{2,3}(?:\.\d)?)/i)
  if (na) out.sodium = na
  const k = n(/(?:k\+?|potassium)\s*[=:\s]*(\d{1,2}(?:\.\d)?)/i)
  if (k) out.potassium = k
  const glu = n(/(?:glucose|sugar|fbs|rbs|bs)\s*[=:\s]*(\d{2,3}(?:\.\d)?)/i)
  if (glu) out.glucose = glu
  const hb = n(/(?:hb|hemoglobin|haemoglobin)\s*[=:\s]*(\d{1,2}(?:\.\d)?)/i)
  if (hb) out.hemoglobin = hb
  const alb = n(/(?:albumin|alb)\s*[=:\s]*(\d{1,2}(?:\.\d)?)/i)
  if (alb) out.albumin = alb
  const cr = n(/(?:creatinine|cr|scr)\s*[=:\s]*(\d(?:\.\d)?)/i)
  if (cr) out.creatinine = cr
  const po4 = n(/(?:phosphate|phosphorus|po4)\s*[=:\s]*(\d(?:\.\d)?)/i)
  if (po4) out.phosphate = po4
  const mg = n(/(?:magnesium|mg\+\+|mgso4)\s*[=:\s]*(\d(?:\.\d)?)/i)
  if (mg) out.magnesium = mg
  const diag = text.match(/\b(diabetes|hypertension|anemia|dehydration|sepsis|pneumonia|malnutrition|obesity|fracture|burn|cancer|failure)\b/i)
  if (diag) out.Diagnosis = diag[1]
  return out
}

export default function PatientIVPanel({ dept }) {
  const [form, setForm] = useState(() => ({
    Name: '', Age: '', Gender: 'M', Weight: '', Height: '',
    Diagnosis: '', Severity: 'Medium', heart_rate: '', bp_systolic: '',
    bp_diastolic: '', urine_output: '', temperature: '', hydration: 'well',
    sodium: '', potassium: '', creatinine: '', glucose: '', hemoglobin: '',
    albumin: '', phosphate: '', magnesium: '', npo_days: '',
    Allergies: '', Medications: '',
  }))

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // camera / scan
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanText, setScanText] = useState('')
  const [scanNote, setScanNote] = useState('')

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const startCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOn(true); setPhoto(null); setScanText('')
    } catch {
      setError('Camera access denied. Use the upload option instead.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    const b64 = c.toDataURL('image/jpeg', 0.9).split(',')[1]
    setPhoto(b64)
    runOcr(b64)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result.split(',')[1]
      setPhoto(b64)
      runOcr(b64)
    }
    reader.readAsDataURL(file)
  }

  const handlePhoneImage = (b64) => {
    setPhoto(b64)
    runOcr(b64)
  }

  const runOcr = async (b64) => {
    setScanning(true); setScanNote(''); setScanText('')
    try {
      const Tesseract = (await import('tesseract.js')).default
      const { data } = await Tesseract.recognize(
        `data:image/jpeg;base64,${b64}`,
        'eng',
        { logger: (m) => m.status === 'recognizing text' && setScanNote(`Reading… ${Math.round(m.progress * 100)}%`) }
      )
      const text = data.text || ''
      setScanText(text)
      const parsed = parseScan(text)
      setForm((f) => ({ ...f, ...parsed }))
      setScanNote(parsed.Age || parsed.Weight || parsed.Name
        ? 'Patient details auto-filled from the scan; please verify.'
        : 'No structured fields found in the scan. Check the extracted text and fill manually.')
    } catch (err) {
      setScanNote('OCR failed: ' + err.message)
    } finally {
      setScanning(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const payload = {
        dept_slug: dept.slug,
        dept_name: dept.name + ', ' + dept.full,
        ...form,
        Age: form.Age ? Number(form.Age) : null,
        Weight: form.Weight ? Number(form.Weight) : null,
        Height: form.Height ? Number(form.Height) : null,
        heart_rate: form.heart_rate ? Number(form.heart_rate) : null,
        bp_systolic: form.bp_systolic ? Number(form.bp_systolic) : null,
        bp_diastolic: form.bp_diastolic ? Number(form.bp_diastolic) : null,
        urine_output: form.urine_output ? Number(form.urine_output) : null,
        temperature: form.temperature ? Number(form.temperature) : null,
        sodium: form.sodium ? Number(form.sodium) : null,
        potassium: form.potassium ? Number(form.potassium) : null,
        creatinine: form.creatinine ? Number(form.creatinine) : null,
        glucose: form.glucose ? Number(form.glucose) : null,
        hemoglobin: form.hemoglobin ? Number(form.hemoglobin) : null,
        albumin: form.albumin ? Number(form.albumin) : null,
        phosphate: form.phosphate ? Number(form.phosphate) : null,
        magnesium: form.magnesium ? Number(form.magnesium) : null,
        npo_days: form.npo_days ? Number(form.npo_days) : null,
      }
      const res = await api.departmentPlan(payload)
      setResult(res)
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const print = () => window.print()
  const download = () => {
    if (!result) return
    const r = result
    const L = (s) => String(s).split('\n').map((l) => '  ' + l).join('\n')
    const txt = [
      '='.repeat(64),
      '  CLINICAL NUTRITION IV PLAN',
      `  ${r.department_name}`,
      '  Explainable Multi-Agent AI Clinical Nutrition DSS',
      '='.repeat(64), '',
      `Patient      : ${r.patient.name}`,
      `Age / Gender : ${r.patient.age} / ${r.patient.gender}`,
      `Weight       : ${r.patient.weight_kg} kg  Height: ${r.patient.height_cm} cm`,
      `Diagnosis    : ${r.patient.diagnosis}  (${r.patient.severity})`,
      `Allergies    : ${r.patient.allergies}`,
      `Medications  : ${r.patient.medications}`, '',
      'TARGETS', '-'.repeat(64),
      `  Calories : ${r.targets.calories_kcal} kcal/day`,
      `  Protein  : ${r.targets.protein}`,
      `  Fluids   : ${r.targets.fluid_ml_per_day}`,
      `  Route    : ${r.targets.route}`, '',
      'IV FLUID PLAN', '-'.repeat(64),
      r.fluids.map((f, i) => `  ${i + 1}. ${f.name} [${f.role}]${f.rate ? '; ' + f.rate : ''}\n     ${f.reason}\n     Caution: ${f.cautions}`).join('\n'), '',
      'IV ADDITIVES', '-'.repeat(64),
      r.additives.map((a, i) => `  ${i + 1}. ${a.name}\n     Why: ${a.reason}\n     Give: ${a.combination}\n     Caution: ${a.caution}`).join('\n'), '',
      'WARNINGS', '-'.repeat(64),
      r.warnings.map((w) => `  ! ${w}`).join('\n'), '',
      'MONITORING', '-'.repeat(64),
      r.monitoring.map((m) => `  • ${m}`).join('\n'), '',
      '='.repeat(64),
      'For use under clinician supervision. Informational only.',
      '='.repeat(64),
    ].join('\n')
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `IV_Plan_${dept.name}_${(r.patient.name || 'Patient').replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div className="section-head">
        <span className="section-kicker" style={{ borderColor: `${dept.color}66`, color: dept.color }}>
          <Droplets size={12} /> Patient Details & IV Planner
        </span>
        <h2 className="section-title" style={{ fontSize: 30 }}>Plan the <span className="gradient-text">IV Drips</span> for This Patient</h2>
        <p className="section-sub" style={{ fontSize: 14.5 }}>
          Enter the patient details (or scan their ID card / prescription / lab report with the camera) and the
          system recommends IV fluids, electrolytes and nutrition targets specific to the {dept.full}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26, alignItems: 'start' }}>
        {/* Left: form + camera scan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <form onSubmit={submit} className="card" style={{ padding: 24 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, fontSize: 17 }}>
              <User size={18} color={dept.color} /> Patient Details
            </h3>
            <div className="form-grid">
              <Field label="Patient Name"><input style={inputStyle} value={form.Name} onChange={set('Name')} /></Field>
              <Field label="Age"><input style={inputStyle} type="number" value={form.Age} onChange={set('Age')} /></Field>
              <Field label="Gender">
                <select style={inputStyle} value={form.Gender} onChange={set('Gender')}>
                  <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
                </select>
              </Field>
              <Field label="Weight (kg)"><input style={inputStyle} type="number" value={form.Weight} onChange={set('Weight')} /></Field>
              <Field label="Height (cm)"><input style={inputStyle} type="number" value={form.Height} onChange={set('Height')} /></Field>
              <Field label="Diagnosis"><input style={inputStyle} value={form.Diagnosis} onChange={set('Diagnosis')} placeholder="e.g., Post-op sepsis" /></Field>
              <Field label="Severity">
                <select style={inputStyle} value={form.Severity} onChange={set('Severity')}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </Field>
              <Field label="Hydration status">
                <select style={inputStyle} value={form.hydration} onChange={set('hydration')}>
                  <option value="well">Well hydrated</option>
                  <option value="mild">Mild dehydration</option>
                  <option value="severe">Severe dehydration</option>
                </select>
              </Field>
            </div>

            <h3 style={{ margin: '20px 0 14px', fontSize: 14.5, color: '#A78BFA' }}>Vitals & Labs</h3>
            <div className="form-grid">
              <Field label="Heart rate"><input style={inputStyle} type="number" value={form.heart_rate} onChange={set('heart_rate')} /></Field>
              <Field label="BP systolic"><input style={inputStyle} type="number" value={form.bp_systolic} onChange={set('bp_systolic')} /></Field>
              <Field label="BP diastolic"><input style={inputStyle} type="number" value={form.bp_diastolic} onChange={set('bp_diastolic')} /></Field>
              <Field label="Urine output (ml/kg/h)"><input style={inputStyle} type="number" step="0.1" value={form.urine_output} onChange={set('urine_output')} /></Field>
              <Field label="Temperature (°C)"><input style={inputStyle} type="number" step="0.1" value={form.temperature} onChange={set('temperature')} /></Field>
              <Field label="NPO days"><input style={inputStyle} type="number" value={form.npo_days} onChange={set('npo_days')} /></Field>
              <Field label="Sodium (Na)"><input style={inputStyle} type="number" step="0.1" value={form.sodium} onChange={set('sodium')} /></Field>
              <Field label="Potassium (K)"><input style={inputStyle} type="number" step="0.1" value={form.potassium} onChange={set('potassium')} /></Field>
              <Field label="Creatinine"><input style={inputStyle} type="number" step="0.1" value={form.creatinine} onChange={set('creatinine')} /></Field>
              <Field label="Glucose"><input style={inputStyle} type="number" value={form.glucose} onChange={set('glucose')} /></Field>
              <Field label="Hemoglobin (Hb)"><input style={inputStyle} type="number" step="0.1" value={form.hemoglobin} onChange={set('hemoglobin')} /></Field>
              <Field label="Albumin"><input style={inputStyle} type="number" step="0.1" value={form.albumin} onChange={set('albumin')} /></Field>
              <Field label="Phosphate (PO4)"><input style={inputStyle} type="number" step="0.1" value={form.phosphate} onChange={set('phosphate')} /></Field>
              <Field label="Magnesium (Mg)"><input style={inputStyle} type="number" step="0.1" value={form.magnesium} onChange={set('magnesium')} /></Field>
              <Field label="Allergies"><input style={inputStyle} value={form.Allergies} onChange={set('Allergies')} placeholder="None" /></Field>
              <Field label="Medications"><input style={inputStyle} value={form.Medications} onChange={set('Medications')} placeholder="None" /></Field>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 18, width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
              {loading ? <><RefreshCw size={17} className="spin-ico" /> Planning IV drips…</> : <><Droplets size={17} /> Generate IV & Nutrition Plan</>}
            </button>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{error}</p>}
          </form>

          {/* Camera scan */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 6 }}><ScanLine size={17} style={{ color: '#06b6d4', verticalAlign: -2, marginRight: 6 }} /> Scan Patient Details</h3>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 14 }}>
              Point the camera at the patient ID card, prescription or lab report; details are auto-filled into the form.
            </p>
            <div className="camera-frame" style={{ minHeight: 200 }}>
              <video ref={videoRef} className={cameraOn ? 'active' : ''} muted playsInline style={{ height: 220 }} />
              {photo && <img src={`data:image/jpeg;base64,${photo}`} alt="scan" />}
              {!cameraOn && !photo && (
                <div className="camera-empty"><ScanLine size={38} strokeWidth={1} /><p>Capture or upload a patient document</p></div>
              )}
              {scanning && (
                <div className="camera-busy">
                  <span className="spinner" />
                  {scanNote || 'Analyzing document…'}
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="camera-actions">
              {!cameraOn ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={startCamera}><Camera size={15} /> Open Camera</button>
              ) : (
                <>
                  <button type="button" className="btn btn-primary btn-sm" onClick={capture}><ScanLine size={15} /> Scan & Fill</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { stopCamera(); setPhoto(null); setScanText('') }}><RefreshCw size={14} /> Reset</button>
                </>
              )}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload</button>
              <PhoneDrop onImage={handlePhoneImage} label="a patient card, prescription or lab report" accent="#06b6d4" />
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </div>

            {scanNote && <p style={{ marginTop: 12, fontSize: 12.5, color: '#f5b041' }}>{scanNote}</p>}
            {scanText && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ fontSize: 12.5, color: '#A78BFA', cursor: 'pointer' }}>View extracted text</summary>
                <pre style={{ fontSize: 11.5, color: '#D1D5DB', background: 'rgba(15,23,42,0.8)', padding: 12, borderRadius: 10, marginTop: 8, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>{scanText}</pre>
              </details>
            )}
          </div>
        </div>

        {/* Right: results */}
        <div>
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="empty" className="card empty-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Droplets size={46} strokeWidth={1} style={{ opacity: 0.4, marginBottom: 12 }} />
                <p>Enter patient details and click <strong>Generate IV & Nutrition Plan</strong>.</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>The plan adapts to the {dept.full} and the patient's vitals, labs, hydration and NPO status.</p>
              </motion.div>
            ) : (
              <motion.div key="res" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="result-stack">
                {/* Printable sheet */}
                <div className="report-paper iv-paper">
                  <div className="report-paper-head">
                    <div>
                      <div className="report-logo"><Droplets size={22} /></div>
                      <h2>Clinical Nutrition IV Plan</h2>
                      <p>{result.department_name} • Explainable Multi-Agent AI DSS</p>
                    </div>
                    <div className="report-meta">
                      <div><span>Patient</span><strong>{result.patient.name || '—'}</strong></div>
                      <div><span>Age/Gender</span><strong>{result.patient.age || '—'} / {result.patient.gender}</strong></div>
                      <div><span>Diagnosis</span><strong>{result.patient.diagnosis}</strong></div>
                      <div><span>Severity</span><strong>{result.patient.severity}</strong></div>
                    </div>
                  </div>

                  <h4>Nutrition Targets</h4>
                  <table className="iv-targets">
                    <tbody>
                      <tr><td>Calories</td><td><strong>{result.targets?.calories_kcal ?? '—'} kcal/day</strong></td></tr>
                      <tr><td>Protein</td><td><strong>{result.targets?.protein ?? '—'}</strong></td></tr>
                      <tr><td>Fluids</td><td><strong>{result.targets?.fluid_ml_per_day ?? '—'}</strong></td></tr>
                      <tr><td>Feeding route</td><td>{result.targets?.route ?? '—'}</td></tr>
                      <tr><td>Note</td><td>{result.targets?.note ?? '—'}</td></tr>
                    </tbody>
                  </table>

                  <h4>IV Fluid Plan</h4>
                  <table className="iv-table">
                    <thead>
                      <tr><th>Fluid</th><th>Role</th><th>Rate</th><th>Na/K</th><th>Caution</th></tr>
                    </thead>
                    <tbody>
                      {(result.fluids || []).map((f, i) => (
                        <tr key={i}>
                          <td><strong>{f.name}</strong><br /><span className="iv-reason">{f.reason}</span></td>
                          <td>{f.role}</td>
                          <td>{f.rate}</td>
                          <td>{f.na} / {f.k}</td>
                          <td>{f.cautions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h4>IV Additives / Electrolytes</h4>
                  {(result.additives || []).map((a, i) => (
                    <div key={i} className="iv-additive">
                      <strong>{a.name}</strong>
                      <p>{a.reason}</p>
                      <p><em>Give:</em> {a.combination}</p>
                      <p><em>Caution:</em> {a.caution}</p>
                    </div>
                  ))}

                  <h4>Warnings</h4>
                  <ul className="iv-warnings">
                    {(result.warnings || []).map((w, i) => <li key={i}><AlertTriangle size={13} /> {w}</li>)}
                  </ul>

                  <h4>Monitoring</h4>
                  <ul className="iv-monitor">
                    {(result.monitoring || []).map((m, i) => <li key={i}>{m}</li>)}
                  </ul>

                  <div className="report-footer">
                    <p>Generated by Clinical Nutrition DSS; for use under clinician supervision. Informational only.</p>
                  </div>
                </div>

                {/* actions */}
                <div className="report-actions" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-primary btn-sm" onClick={print}><Printer size={16} /> Print / Save PDF</button>
                  <button className="btn btn-ghost btn-sm" onClick={download}><Download size={16} /> Download Plan</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
