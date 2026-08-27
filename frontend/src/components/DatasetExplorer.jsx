import React, { useState } from 'react'
import { Database, Table2, ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '../api'
import { Reveal } from './Reveal'

export default function DatasetExplorer() {
  const [datasets, setDatasets] = useState(null)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const load = async () => {
    if (datasets) return
    try {
      const res = await api.datasets()
      setDatasets(res.datasets || [])
    } catch (e) {
      setError(e.message)
    }
  }

  React.useEffect(() => { load() }, [])

  const toggle = async (name) => {
    if (open === name) {
      setOpen(null)
      setPreview(null)
      return
    }
    setOpen(name)
    setLoadingPreview(true)
    setPreview(null)
    try {
      const res = await api.dataset(name, 10)
      setPreview(res)
    } catch (e) {
      setPreview({ error: e.message })
    } finally {
      setLoadingPreview(false)
    }
  }

  return (
    <div>
      <div className="section-kicker">Multi-Source Data Fusion</div>
      <h2 className="section-title">Live <span className="gradient-text">Database Explorer</span></h2>
      <p className="section-sub" style={{ marginBottom: 40 }}>
        Explore the real datasets powering the system; from eICU critical care to USDA FoodData Central
        and the Canadian Nutrient File. Click any dataset to preview its rows live from the backend.
      </p>

      {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {datasets?.map((ds, i) => (
          <Reveal key={ds.id} delay={i * 40}>
            <div className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => toggle(ds.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(59,130,246,0.2)',
                  border: '1px solid rgba(96,165,250,0.4)',
                }}>
                  <Database size={20} color="#A78BFA" />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 15, marginBottom: 2 }}>{ds.name}</h4>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>{ds.description}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    {ds.type === 'image_collection'
                      ? <span style={{ color: '#A78BFA' }}>{ds.file_count} files</span>
                      : <span style={{ color: '#A78BFA' }}>{typeof ds.rows === 'number' ? ds.rows.toLocaleString() : ds.rows || 0} rows</span>}
                    {ds.columns != null && <span style={{ color: '#94A3B8' }}>{ds.columns} cols</span>}
                  </div>
                </div>
                {open === ds.id ? <ChevronDown size={18} color="#A78BFA" /> : <ChevronRight size={18} color="#94A3B8" />}
              </div>

              {open === ds.id && (
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: 14 }}>
                  {loadingPreview && <p style={{ color: '#94A3B8', fontSize: 13 }}>Loading preview...</p>}
                  {preview?.error && <p style={{ color: '#ef4444', fontSize: 13 }}>{preview.error}</p>}
                  {preview?.type === 'image_collection' && (
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>
                      <p style={{ marginBottom: 8 }}>Image / spectral collection — {preview.file_count} files.</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(preview.sample_files || []).slice(0, 12).map((f) => (
                          <code key={f} style={{ padding: '3px 8px', background: 'rgba(96,165,250,0.12)', borderRadius: 6, color: '#93C5FD' }}>{f}</code>
                        ))}
                      </div>
                    </div>
                  )}
                  {preview?.data && preview?.type !== 'image_collection' && (
                    <div style={{ overflowX: 'auto', fontSize: 12 }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead>
                          <tr style={{ color: '#A78BFA', textAlign: 'left' }}>
                            {preview.column_names.slice(0, 6).map((c) => (
                              <th key={c} style={{ padding: '6px 8px', borderBottom: '1px solid rgba(96,165,250,0.3)' }}>{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.data.slice(0, 5).map((row, ri) => (
                            <tr key={ri} style={{ color: '#F3F4F6' }}>
                              {preview.column_names.slice(0, 6).map((c) => {
                                const v = row[c]
                                const str = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')
                                return <td key={c} style={{ padding: '6px 8px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{str.slice(0, 20)}</td>
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!preview && !loadingPreview && <p style={{ color: '#94A3B8', fontSize: 13 }}>No preview available</p>}
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      {!datasets && !error && (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>Loading datasets...</p>
      )}
    </div>
  )
}
