import React, { useState } from 'react'
import { HeartPulse, Activity, Sparkles, ShieldAlert } from 'lucide-react'
import { api } from '../api'

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.4)',
  background: 'rgba(13,5,36,0.8)',
  color: '#fff',
  fontSize: 14,
  fontFamily: 'inherit',
}
const labelStyle = { display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: 600 }
const Field = ({ label, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

const INITIAL = {
  Age: 45,
  Gender: 'M',
  Weight: 70,
  Height: 170,
  Diagnosis: 'General',
  Severity: 'Medium',
  ActivityLevel: 'moderate',
  Allergies: '',
  Medications: '',
  Blood_Glucose: 100,
  Blood_Pressure_Systolic: 120,
  Cholesterol_Level: 200,
}

export default function PatientLab() {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {
        ...form,
        Allergies: form.Allergies.split(',').map((s) => s.trim()).filter(Boolean),
        Medications: form.Medications.split(',').map((s) => s.trim()).filter(Boolean),
        Age: Number(form.Age),
        Weight: Number(form.Weight),
        Height: Number(form.Height),
        Blood_Glucose: Number(form.Blood_Glucose),
        Blood_Pressure_Systolic: Number(form.Blood_Pressure_Systolic),
        Cholesterol_Level: Number(form.Cholesterol_Level),
      }
      const res = await api.recommendations(payload)
      setResult(res)
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="section-kicker">Precision Nutrition Engine</div>
      <h2 className="section-title">Personalized <span className="gradient-text">Recommendation Lab</span></h2>
      <p className="section-sub" style={{ marginBottom: 40 }}>
        Enter a patient profile and the live multi-agent system (Patient Analysis, Nutrition, Allergy,
        Medication-Diet, Cultural and Recommendation agents) generates an evidence-based dietary plan with
        clinical rationale.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Age"><input style={inputStyle} type="number" value={form.Age} onChange={set('Age')} /></Field>
            <Field label="Gender">
              <select style={inputStyle} value={form.Gender} onChange={set('Gender')}>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </Field>
            <Field label="Weight (kg)"><input style={inputStyle} type="number" value={form.Weight} onChange={set('Weight')} /></Field>
            <Field label="Height (cm)"><input style={inputStyle} type="number" value={form.Height} onChange={set('Height')} /></Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Diagnosis">
              <select style={inputStyle} value={form.Diagnosis} onChange={set('Diagnosis')}>
                <option value="General">General</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Hypertension">Hypertension</option>
                <option value="Obesity">Obesity</option>
                <option value="Heart Disease">Heart Disease</option>
                <option value="Celiac Disease">Celiac Disease</option>
                <option value="Chronic Kidney Disease">Chronic Kidney Disease</option>
              </select>
            </Field>
            <Field label="Severity">
              <select style={inputStyle} value={form.Severity} onChange={set('Severity')}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
            <Field label="Activity Level">
              <select style={inputStyle} value={form.ActivityLevel} onChange={set('ActivityLevel')}>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
              </select>
            </Field>
            <Field label="Glucose (mg/dL)"><input style={inputStyle} type="number" value={form.Blood_Glucose} onChange={set('Blood_Glucose')} /></Field>
            <Field label="Systolic BP"><input style={inputStyle} type="number" value={form.Blood_Pressure_Systolic} onChange={set('Blood_Pressure_Systolic')} /></Field>
            <Field label="Cholesterol (mg/dL)"><input style={inputStyle} type="number" value={form.Cholesterol_Level} onChange={set('Cholesterol_Level')} /></Field>
          </div>

          <Field label="Allergies (comma separated, e.g. Gluten, Nuts)">
            <input style={inputStyle} placeholder="Gluten, Nuts" value={form.Allergies} onChange={set('Allergies')} />
          </Field>
          <Field label="Medications (comma separated, e.g. Metformin, Lisinopril)">
            <input style={inputStyle} placeholder="Metformin, Lisinopril" value={form.Medications} onChange={set('Medications')} />
          </Field>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
            <Sparkles size={18} /> {loading ? 'Running 6 agents...' : 'Generate Recommendations'}
          </button>

          {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}
        </form>

        <div>
          {!result ? (
            <div className="card" style={{ textAlign: 'center', color: '#94A3B8', padding: 60 }}>
              <HeartPulse size={48} strokeWidth={1} style={{ opacity: 0.4, marginBottom: 12 }} />
              <p>Results will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#94A3B8', fontSize: 13 }}>Estimated Daily Calorie Target</p>
                  <p style={{ fontSize: 40, fontWeight: 700, color: '#A78BFA' }}>{result.calories_target}</p>
                  <span style={{ fontSize: 13, color: '#94A3B8' }}>kcal/day (Mifflin-St Jeor)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#94A3B8', fontSize: 13 }}>Risk Level</p>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 600,
                    background: result.risk_level === 'High' ? 'rgba(239,68,68,0.2)' : result.risk_level === 'Medium' ? 'rgba(245,176,65,0.2)' : 'rgba(34,197,94,0.2)',
                    color: result.risk_level === 'High' ? '#ef4444' : result.risk_level === 'Medium' ? '#f5b041' : '#22c55e',
                  }}>
                    {result.risk_level}
                  </span>
                </div>
              </div>

              <div className="card">
                <h4 style={{ color: '#22c55e', fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} /> Recommended Foods
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {result.recommendations?.map((r) => (
                    <span key={typeof r === 'string' ? r : r.name} style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      fontSize: 13,
                      color: '#86efac',
                    }}>
                      {typeof r === 'string' ? r : r.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card">
                <h4 style={{ color: '#ef4444', fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={18} /> Foods to Avoid
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {result.foods_to_avoid?.map((f, i) => (
                    <span key={i} style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      fontSize: 13,
                      color: '#fca5a5',
                    }}>
                      {typeof f === 'string' ? f : f.name}
                    </span>
                  ))}
                </div>
              </div>

              {result.reasoning_chain?.length > 0 && (
                <div className="card">
                  <h4 style={{ color: '#A78BFA', fontSize: 15, marginBottom: 14 }}>Agent Reasoning Chain</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.reasoning_chain.map((r, i) => (
                      <div key={i} style={{ fontSize: 13, color: '#F3F4F6', background: 'rgba(96,165,250,0.07)', borderRadius: 8, padding: '10px 14px', borderLeft: '3px solid #60A5FA' }}>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
                Engine: {result.engine === 'live' ? 'live multi-agent system (real trained models)' : 'rule-based fallback'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
