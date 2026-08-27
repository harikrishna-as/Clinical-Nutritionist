import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Plus, FlaskConical, Pill, Search, AlertTriangle } from 'lucide-react'
import { IV_FLUIDS, IV_ADDITIVES, ENTERAL_FORMULAS, MEDICATIONS_NUTRITION } from '../lib/data'

const TABS = [
  { key: 'fluids', label: 'IV Fluids', icon: Droplets },
  { key: 'additives', label: 'IV Additives', icon: Plus },
  { key: 'enteral', label: 'Enteral Formulas', icon: FlaskConical },
  { key: 'drugs', label: 'Drug-Nutrient', icon: Pill },
]

export default function Medications() {
  const [tab, setTab] = useState('fluids')
  const [q, setQ] = useState('')

  const data = {
    fluids: IV_FLUIDS,
    additives: IV_ADDITIVES,
    enteral: ENTERAL_FORMULAS,
    drugs: MEDICATIONS_NUTRITION,
  }[tab]

  const filtered = useMemo(() => {
    if (!q.trim()) return data
    const s = q.toLowerCase()
    return data.filter((r) => JSON.stringify(Object.values(r)).toLowerCase().includes(s))
  }, [data, q])

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <h1>Medications & <span className="gradient-text">IV Drips</span></h1>
          <p>
            The complete reference the clinical nutritionist uses; IV fluids, electrolyte additives,
            enteral formulas and critical drug-nutrient interactions, with combination & caution notes.
          </p>
          <div className="page-search">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search NS, thiamine, metformin, potassium..." />
          </div>
        </div>
      </section>

      <section className="page-body">
        <div className="container">
          <div className="tab-bar">
            {TABS.map((t) => (
              <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      {tab === 'fluids' && <>
                        <th>Fluid</th><th>Type</th><th>Indication</th><th>Calories</th><th>Na⁺</th><th>K⁺</th><th>Cautions</th>
                      </>}
                      {tab === 'additives' && <>
                        <th>Additive</th><th>Type</th><th>Indication / Use</th><th>Combination</th><th>Caution</th>
                      </>}
                      {tab === 'enteral' && <>
                        <th>Formula</th><th>Type</th><th>Indication</th><th>Composition</th><th>Combination</th><th>Caution</th>
                      </>}
                      {tab === 'drugs' && <>
                        <th>Drug</th><th>Class</th><th>Interaction</th><th>Nutrition Guidance</th><th>Caution</th>
                      </>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.name || r.drug}>
                        {tab === 'fluids' && <>
                          <td><strong>{r.name}</strong></td>
                          <td><span className="badge">{r.type}</span></td>
                          <td>{r.indication}</td>
                          <td>{r.cal}</td>
                          <td>{r.na}</td>
                          <td>{r.k}</td>
                          <td className="caution-cell"><AlertTriangle size={13} /> {r.cautions}</td>
                        </>}
                        {tab === 'additives' && <>
                          <td><strong>{r.name}</strong></td>
                          <td><span className="badge">{r.type}</span></td>
                          <td>{r.use}</td>
                          <td className="comb-cell">{r.combination}</td>
                          <td className="caution-cell"><AlertTriangle size={13} /> {r.caution}</td>
                        </>}
                        {tab === 'enteral' && <>
                          <td><strong>{r.name}</strong></td>
                          <td><span className="badge">{r.type}</span></td>
                          <td>{r.use}</td>
                          <td>{r.composition}</td>
                          <td className="comb-cell">{r.combination}</td>
                          <td className="caution-cell"><AlertTriangle size={13} /> {r.caution}</td>
                        </>}
                        {tab === 'drugs' && <>
                          <td><strong>{r.drug}</strong></td>
                          <td><span className="badge">{r.class}</span></td>
                          <td>{r.interaction}</td>
                          <td className="comb-cell">{r.nutrition}</td>
                          <td className="caution-cell"><AlertTriangle size={13} /> {r.caution}</td>
                        </>}
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="empty-state">No entries match "{q}".</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
