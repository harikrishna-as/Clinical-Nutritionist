import React from 'react'
import MLResults from '../components/MLResults'

export default function MLResultsPage() {
  return (
    <div className="page">
      <section className="page-body" style={{ paddingTop: 60 }}>
        <div className="container">
          <MLResults />
        </div>
      </section>
    </div>
  )
}
