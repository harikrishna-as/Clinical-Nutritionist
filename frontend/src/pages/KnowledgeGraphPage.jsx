import React from 'react'
import KnowledgeGraph3D from '../components/KnowledgeGraph3D'
import { api, useFetch } from '../api'

export default function KnowledgeGraphPage() {
  const { data } = useFetch(() => api.knowledgeGraph(), [])

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <h1>Global Food <span className="gradient-text">Knowledge Graph</span></h1>
          <p>Interactive 3D visualization of foods, nutrients and diseases; drag to rotate, hover nodes to inspect.</p>
        </div>
      </section>
      <section className="page-body">
        <div className="container">
          <div className="card" style={{ padding: 12 }}>
            <KnowledgeGraph3D />
          </div>
          <div className="kg-stats">
            {[
              { v: data?.stats?.foods_count ?? '8,000+', l: 'foods' },
              { v: data?.stats?.nutrients_count ?? '477', l: 'nutrients' },
              { v: data?.stats?.disease_food_edges ?? '55,376', l: 'disease-food links' },
              { v: data?.stats?.alternative_groups ?? '1,914', l: 'alternatives' },
            ].map((s, i) => (
              <div key={i} className="card kg-stat">
                <div className="stat-v">{s.v}</div>
                <div className="stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
