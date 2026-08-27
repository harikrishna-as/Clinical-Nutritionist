import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Pill, Building2, IndianRupee, Package, Activity, AlertCircle, Loader2, Stethoscope } from 'lucide-react'
import { api } from '../api'

export default function MedicineSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    api.medicineStats().then(setStats).catch(() => {})
  }, [])

  const doSearch = (query) => {
    const queryTrimmed = query.trim()
    if (!queryTrimmed) {
      setResults([])
      setSearched(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    api.medicineSearch(queryTrimmed, 50)
      .then((data) => {
        setResults(data.results || [])
        setSearched(true)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const onChange = (e) => {
    const v = e.target.value
    setQ(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 300)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    clearTimeout(debounceRef.current)
    doSearch(q)
  }

  const examples = ['Paracetamol', 'Amoxycillin', 'Metformin', 'Azithromycin', 'Glaxo', 'Insulin', 'Cough Syrup']

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <h1>Medicine <span className="gradient-text">Identifier</span></h1>
          <p>
            Search the complete A-Z medicines dataset of India; identify any medicine prescribed by doctors
            by name, active composition, or manufacturer. Covers {stats ? stats.total.toLocaleString() : '250,000+'} medicines.
          </p>
          <form className="page-search" onSubmit={onSubmit} style={{ maxWidth: 640 }}>
            <Search size={18} />
            <input
              ref={inputRef}
              value={q}
              onChange={onChange}
              placeholder="Search by medicine name, composition or manufacturer…"
            />
            {loading && <Loader2 size={18} className="spin-ico" />}
          </form>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setQ(ex); doSearch(ex) }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="page-body">
        <div className="container">
          {stats && (
            <div className="cards-grid" style={{ marginBottom: 28 }}>
              <div className="card stat-card">
                <Stethoscope size={22} color="#60A5FA" />
                <div>
                  <div className="stat-num">{stats.total.toLocaleString()}</div>
                  <div className="stat-label">Total Medicines</div>
                </div>
              </div>
              <div className="card stat-card">
                <Activity size={22} color="#22c55e" />
                <div>
                  <div className="stat-num">{stats.active.toLocaleString()}</div>
                  <div className="stat-label">Active</div>
                </div>
              </div>
              <div className="card stat-card">
                <AlertCircle size={22} color="#ef4444" />
                <div>
                  <div className="stat-num">{stats.discontinued.toLocaleString()}</div>
                  <div className="stat-label">Discontinued</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="card" style={{ borderColor: '#ef4444', marginBottom: 20 }}>
              <strong style={{ color: '#ef4444' }}>Search error:</strong> {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {searched && !loading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 18, margin: 0 }}>
                    Results for "<strong>{q.trim()}</strong>"
                  </h2>
                  <span className="badge">{results.length} found</span>
                </div>

                {results.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <Pill size={32} color="#60A5FA" style={{ marginBottom: 10 }} />
                    <p>No medicines found. Try a different name, composition, or manufacturer.</p>
                  </div>
                ) : (
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="med-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Composition</th>
                            <th>Manufacturer</th>
                            <th>Pack</th>
                            <th>Price</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r) => {
                            const discontinued = (r['Is_discontinued'] || '').toUpperCase() === 'TRUE'
                            return (
                              <tr key={r.id} className={discontinued ? 'discontinued' : ''}>
                                <td>
                                  <div className="med-name">
                                    <Pill size={14} color="#60A5FA" />
                                    {r.name}
                                  </div>
                                </td>
                                <td>
                                  <div className="med-comp">
                                    {r.short_composition1}
                                    {r.short_composition2 ? ` + ${r.short_composition2}` : ''}
                                    {!r.short_composition1 && !r.short_composition2 && <span className="muted">N/A</span>}
                                  </div>
                                </td>
                                <td>
                                  <div className="med-mfr">
                                    <Building2 size={13} color="#A78BFA" />
                                    {r.manufacturer_name}
                                  </div>
                                </td>
                                <td>
                                  <div className="med-pack">
                                    <Package size={13} color="#A78BFA" />
                                    {r.pack_size_label}
                                  </div>
                                </td>
                                <td>
                                  <div className="med-price">
                                    <IndianRupee size={13} color="#A78BFA" />
                                    {r['price(₹)'] || '—'}
                                  </div>
                                </td>
                                <td>
                                  {discontinued ? (
                                    <span className="badge badge-red">Discontinued</span>
                                  ) : (
                                    <span className="badge badge-green">Active</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!searched && !loading && (
            <div className="card hint-card">
              <Search size={20} color="#60A5FA" />
              <div>
                <strong>Identify any medicine</strong>
                <p style={{ margin: 0, color: '#A78BFA' }}>
                  Type a medicine name (e.g. Paracetamol), a composition (e.g. Amoxycillin), or a manufacturer
                  (e.g. Glaxo) to look it up from the full Indian medicines database.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
