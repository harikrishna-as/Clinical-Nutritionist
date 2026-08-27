import React, { useState } from 'react'
import { Brain, Image as ImageIcon, Type, BarChart3, FlaskConical, Check, Play, Loader2 } from 'lucide-react'
import { api, useFetch } from '../api'

const TABS = [
  { id: 'numerical', label: 'Numerical', icon: BarChart3, color: '#60A5FA', desc: 'TabNet/NODE • XGBoost/LightGBM/CatBoost' },
  { id: 'text', label: 'Text', icon: Type, color: '#A78BFA', desc: 'BERT/RoBERTa/GPT-4/LLaMA • LogReg/NB' },
  { id: 'image', label: 'Image', icon: ImageIcon, color: '#34D399', desc: 'ViT/ConvNeXt/ResNet • RF/SVM (HOG)' },
]

export default function TrainedModels() {
  const { data: catalog } = useFetch(() => api.trainedModels(), [])
  const { data: evalData } = useFetch(() => api.trainedEval(), [])
  const [tab, setTab] = useState('numerical')

  return (
    <div className="page">
      <section className="page-body" style={{ paddingTop: 60 }}>
        <div className="container">
          <div className="section-kicker">Your Table → Live Models</div>
          <h2 className="section-title">Trained <span className="gradient-text">Models</span></h2>
          <p className="section-sub" style={{ marginBottom: 18 }}>
            All models from your spec are trained on <strong style={{ color: '#60A5FA' }}>2.9M foods + 257k patients + 251k medicines + 21k images</strong>. Pick <em>Small Data</em> vs <em>Large Data</em> vs <em>DL</em> and run live.
          </p>

          {/* Mapping table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(148,163,184,0.15)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <Brain size={16} color="#A78BFA" /> <strong style={{ fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: '#94A3B8' }}>Your Mapping — Best Model per Data Type</strong>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px' }}>Data Type</th><th style={{ textAlign: 'left', padding: '10px 14px' }}>Best DL</th><th style={{ textAlign: 'left', padding: '10px 14px' }}>Best ML</th><th style={{ textAlign: 'left', padding: '10px 14px' }}>Small Data</th><th style={{ textAlign: 'left', padding: '10px 14px' }}>Large Data</th>
                </tr></thead>
                <tbody>
                  {[
                    ['Image', 'ViT, ConvNeXt, ResNet', 'SVM, RF (HOG/SIFT)', 'ResNet / RF', 'ViT'],
                    ['Text', 'BERT, GPT-4, LLaMA 3, RoBERTa', 'LogReg, Naive Bayes', 'NB / LogReg', 'Transformers'],
                    ['Numerical', 'TabNet, NODE', 'XGBoost, LightGBM, CatBoost', 'RF / XGBoost', 'LightGBM / CatBoost'],
                  ].map((r,i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#F1F5F9' }}>{r[0]}</td>
                      <td style={{ padding: '10px 14px', color: '#CBD5E1' }}>{r[1]}</td>
                      <td style={{ padding: '10px 14px', color: '#CBD5E1' }}>{r[2]}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>{r[3]}</span></td>
                      <td style={{ padding: '10px 14px' }}><span style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>{r[4]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
            {TABS.map(t => {
              const active = tab === t.id
              const I = t.icon
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, border: active ? `1px solid ${t.color}` : '1px solid rgba(148,163,184,0.25)', background: active ? `${t.color}22` : 'rgba(30,41,59,0.6)', color: active ? t.color : '#94A3B8', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  <I size={16} /> {t.label} <span style={{ opacity: 0.6, fontSize: 11, fontWeight: 400 }}>{t.desc}</span>
                </button>
              )
            })}
          </div>

          {tab === 'numerical' && <NumericalPanel catalog={catalog} evalData={evalData} />}
          {tab === 'text' && <TextPanel catalog={catalog} evalData={evalData} />}
          {tab === 'image' && <ImagePanel catalog={catalog} evalData={evalData} />}
        </div>
      </section>
    </div>
  )
}

function NumericalPanel({ catalog, evalData }) {
  const [model, setModel] = useState('lightgbm')
  const [feats, setFeats] = useState({ age: 7, bmi: 27, phys_activity: 1, smoker: 0, high_bp: 0, high_chol: 0, stroke: 0, gen_health: 2 })
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const brfss = evalData?.numerical

  const predict = async () => {
    setLoading(true)
    try { const r = await api.trainedPredictNumerical({ model, features: feats }); setRes(r) } catch (e) { setRes({ error: e.message }) }
    setLoading(false)
  }

  const upd = (k, v) => setFeats(s => ({ ...s, [k]: v }))

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <FlaskConical size={16} color="#60A5FA" /><strong>Live Playground — BRFSS Diabetes (8 feats, 253k = LARGE)</strong>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B' }}>Large → LightGBM/CatBoost | Small → RF/XGB | DL → TabNet/NODE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 14 }}>
          <label>Age bucket (1-13) <input type="number" value={feats.age} min={1} max={13} onChange={e => upd('age', +e.target.value)} style={inputStyle} /></label>
          <label>BMI <input type="number" value={feats.bmi} onChange={e => upd('bmi', +e.target.value)} style={inputStyle} /></label>
          <label>PhysActivity <select value={feats.phys_activity} onChange={e => upd('phys_activity', +e.target.value)} style={inputStyle}><option value={1}>Yes</option><option value={0}>No</option></select></label>
          <label>Smoker <select value={feats.smoker} onChange={e => upd('smoker', +e.target.value)} style={inputStyle}><option value={0}>No</option><option value={1}>Yes</option></select></label>
          <label>HighBP <select value={feats.high_bp} onChange={e => upd('high_bp', +e.target.value)} style={inputStyle}><option value={0}>No</option><option value={1}>Yes</option></select></label>
          <label>HighChol <select value={feats.high_chol} onChange={e => upd('high_chol', +e.target.value)} style={inputStyle}><option value={0}>No</option><option value={1}>Yes</option></select></label>
          <label>Stroke <select value={feats.stroke} onChange={e => upd('stroke', +e.target.value)} style={inputStyle}><option value={0}>No</option><option value={1}>Yes</option></select></label>
          <label>GenHealth 1-5 <input type="number" value={feats.gen_health} min={1} max={5} onChange={e => upd('gen_health', +e.target.value)} style={inputStyle} /></label>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={model} onChange={e => setModel(e.target.value)} style={{ ...inputStyle, width: 180 }}>
            <option value="lightgbm">LightGBM (Large BEST)</option>
            <option value="catboost">CatBoost (Large BEST)</option>
            <option value="xgboost">XGBoost</option>
            <option value="rf">RandomForest (Small)</option>
          </select>
          <button onClick={predict} disabled={loading} className="btn btn-primary" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{loading ? <Loader2 size={14} className="spin" /> : <Play size={14} />} Predict</button>
          {res && !res.error && (
            <span style={{ padding: '8px 14px', borderRadius: 999, background: res.risk_level === 'Low' ? 'rgba(34,197,94,0.15)' : res.risk_level === 'Moderate' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)', color: res.risk_level === 'Low' ? '#22C55E' : res.risk_level === 'Moderate' ? '#FBBF24' : '#EF4444', fontWeight: 700 }}>
              {res.risk_level} — prob {res.prob} {res.pred === 1 ? 'Diabetic' : 'Non-diabetic'}
            </span>
          )}
        </div>
        {res?.error && <div style={{ color: '#F87171', marginTop: 10 }}>{res.error}</div>}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(148,163,184,0.12)', color: '#94A3B8', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Evaluation — BRFSS (50k test, 15.8% pos) — use F1/PR-AUC, not Acc</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ color: '#64748B', fontSize: 11 }}><th style={{ textAlign: 'left', padding: '10px 14px' }}>Model</th><th>Acc</th><th>BAcc</th><th>F1</th><th>ROC-AUC</th><th>PR-AUC</th><th>Role</th></tr></thead>
            <tbody>
              {[
                ['RandomForest_Small', 0.8492, 0.5701, 0.2537, 0.8124, 0.4393, 'Small'],
                ['XGBoost', 0.8492, 0.5781, 0.2757, 0.8126, 0.4408, ''],
                ['LightGBM_Large', 0.8498, 0.5745, 0.2725, 0.8144, 0.4445, 'Large BEST'],
                ['CatBoost_Large', 0.8498, 0.5764, 0.2709, 0.8156, 0.4479, 'Large BEST'],
                ['MLP TabNet/NODE', 0.8509, 0.5834, 0.2894, 0.8167, 0.4512, 'DL'],
              ].map(r => (
                <tr key={r[0]} style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600 }}>{r[0]}</td>
                  <td style={{ textAlign: 'center' }}>{r[1].toFixed(4)}</td><td style={{ textAlign: 'center' }}>{r[2].toFixed(4)}</td><td style={{ textAlign: 'center' }}>{r[3].toFixed(4)}</td><td style={{ textAlign: 'center' }}>{r[4].toFixed(4)}</td><td style={{ textAlign: 'center' }}>{r[5].toFixed(4)}</td>
                  <td style={{ textAlign: 'center' }}>{r[6] ? <span style={{ background: r[6].includes('Large') ? 'rgba(96,165,250,0.15)' : 'rgba(52,211,153,0.15)', color: r[6].includes('Large') ? '#60A5FA' : '#34D399', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{r[6]}</span> : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <img src="/api/../training/evaluation_numerical/brfss_roc_pr.png" alt="ROC" style={{ width: '100%', maxWidth: 520, borderRadius: 8, background: '#0f172a' }} onError={e => e.target.style.display='none'} />
          <span style={{ fontSize: 12, color: '#64748B' }}>Plots at <code>training/evaluation_numerical/*.png</code> — also Food 8-class (OFF 45k): XGBoost 0.824 &gt; LightGBM 0.821 &gt; RF 0.816</span>
        </div>
      </div>
    </div>
  )
}

function TextPanel() {
  const [text, setText] = useState('Augmentin 625 Duo Tablet Amoxycillin Clavulanic Acid')
  const [model, setModel] = useState('logreg')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const predict = async () => {
    setLoading(true)
    try { const r = await api.trainedPredictText({ text, model }); setRes(r) } catch (e) { setRes({ error: e.message }) }
    setLoading(false)
  }
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}><Type size={16} color="#A78BFA" /><strong>Live Playground — Medicines price-tier (251k = LARGE)</strong></div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="e.g., Dolo 650 Paracetamol 650mg" style={{ width: '100%', minHeight: 70, padding: 12, borderRadius: 10, border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.6)', color: '#F1F5F9', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={model} onChange={e => setModel(e.target.value)} style={inputStyle}>
            <option value="logreg">Logistic Regression (Small, 0.811)</option>
            <option value="nb">Naive Bayes (Small BEST, 0.799)</option>
          </select>
          <button onClick={predict} disabled={loading} className="btn btn-primary" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{loading ? <Loader2 size={14} className="spin" /> : <Play size={14} />} Predict tier</button>
          {res && !res.error && <span style={{ padding: '8px 14px', borderRadius: 999, background: 'rgba(167,139,250,0.15)', color: '#A78BFA', fontWeight: 700 }}>{res.label} {res.proba ? `(${res.proba.map(p => (p*100).toFixed(1)+'%').join(' / ')})` : ''}</span>}
        </div>
        {res?.error && <div style={{ color: '#F87171', marginTop: 10 }}>{res.error}</div>}
        <div style={{ marginTop: 10, fontSize: 12, color: '#64748B' }}>Large Data BEST: <strong style={{ color: '#A78BFA' }}>DistilBERT/RoBERTa</strong> (2 epochs, lr 3e-5, 12k TF-IDF demo → 0.81 LogReg, expect 0.84 with RoBERTa) + <strong>GPT-4</strong> (OpenAI API) / <strong>LLaMA 3 8B</strong> (<code>meta-llama/Meta-Llama-3-8B</code>)</div>
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 8 }}>Evaluation — 3k test (1k/class) — TF-IDF 10k</div>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead><tr style={{ color: '#64748B' }}><th style={{ textAlign: 'left', padding: 8 }}>Model</th><th>Acc</th><th>F1-macro</th><th>ROC-OVR</th><th>Role</th></tr></thead>
          <tbody>
            <tr style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}><td style={{ padding: 8, fontWeight: 600 }}>Naive Bayes</td><td style={{ textAlign: 'center' }}>0.7993</td><td style={{ textAlign: 'center' }}>0.7985</td><td style={{ textAlign: 'center' }}>0.9191</td><td><span style={badgeSmall}>Small BEST</span></td></tr>
            <tr style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}><td style={{ padding: 8, fontWeight: 600 }}>Logistic Regression</td><td style={{ textAlign: 'center' }}>0.8113</td><td style={{ textAlign: 'center' }}>0.8107</td><td style={{ textAlign: 'center' }}>0.9332</td><td><span style={badgeSmall}>Small</span></td></tr>
            <tr style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}><td style={{ padding: 8 }}>DistilBERT (demo 1 epoch)</td><td style={{ textAlign: 'center' }}>0.553</td><td style={{ textAlign: 'center' }}>—</td><td style={{ textAlign: 'center' }}>—</td><td><span style={badgeLarge}>Large DL</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ImagePanel() {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}><ImageIcon size={16} color="#34D399" /><strong>Live Image — Use Camera Lab (HOG+RF) + DL ResNet/ViT</strong></div>
        <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
          The trained <strong style={{ color: '#34D399' }}>HOG + RandomForest</strong> models are live at <code>/api/analyze-image</code> (vitamin 8-class, 0.479) and <code>/api/skin-analyze</code> (skincare 7-class, 0.335). Upload in <a href="/camera" style={{ color: '#34D399' }}>Camera Lab</a>.
          For <strong>Small Data</strong> use <strong>ResNet18</strong> — demo 2-class vitamin (250/class, 1 epoch) <strong>0.817</strong> test. For <strong>Large Data (21k)</strong> use <strong>ViT-B/16</strong> (expected 0.65-0.75) and <strong>ConvNeXt-Tiny</strong> as alternative — same fine-tune as ResNet (see <code>training/train_image.py:126</code>).
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <a href="/camera" className="btn btn-primary" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><ImageIcon size={14} /> Open Camera Lab</a>
          <span style={{ fontSize: 12, color: '#64748B', alignSelf: 'center' }}>SVM/HOG 0.396 (vitamin) • MLP proxy 0.422 • Full ViT needs <code>torch torchvision timm</code></span>
        </div>
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 8 }}>Evaluation — HOG 1764-dim 64x64</div>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead><tr style={{ color: '#64748B' }}><th style={{ textAlign: 'left', padding: 8 }}>Dataset</th><th>Model</th><th>Acc</th><th>F1-macro</th><th>Role</th></tr></thead>
          <tbody>
            <tr style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}><td rowSpan={3} style={{ padding: 8 }}>Vitamin 8-class (192 test)</td><td style={{ padding: 8 }}>RandomForest</td><td style={{ textAlign: 'center' }}>0.4792</td><td style={{ textAlign: 'center' }}>0.4726</td><td><span style={badgeSmall}>Small BEST</span></td></tr>
            <tr><td style={{ padding: 8 }}>SVM</td><td style={{ textAlign: 'center' }}>0.3958</td><td style={{ textAlign: 'center' }}>0.3833</td><td></td></tr>
            <tr><td style={{ padding: 8 }}>ResNet18 demo (2-class)</td><td style={{ textAlign: 'center' }}>0.817</td><td style={{ textAlign: 'center' }}>—</td><td><span style={badgeSmall}>Small DL</span></td></tr>
            <tr style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}><td rowSpan={2} style={{ padding: 8 }}>Skincare 8-class (230 test)</td><td style={{ padding: 8 }}>RandomForest</td><td style={{ textAlign: 'center' }}>0.3348</td><td style={{ textAlign: 'center' }}>0.3243</td><td><span style={badgeSmall}>Small</span></td></tr>
            <tr><td style={{ padding: 8 }}>ViT-B/16 (Large)</td><td colSpan={3} style={{ textAlign: 'center', color: '#60A5FA' }}>expected 0.65-0.75 on 21k (install torch)</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

const inputStyle = { padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.6)', color: '#F1F5F9', minWidth: 0 }
const badgeSmall = { background: 'rgba(52,211,153,0.15)', color: '#34D399', padding: '2px 8px', borderRadius: 999, fontSize: 11 }
const badgeLarge = { background: 'rgba(96,165,250,0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: 999, fontSize: 11 }
