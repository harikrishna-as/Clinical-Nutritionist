import React from 'react'
import DatasetExplorer from '../components/DatasetExplorer'

export default function DatabasePage() {
  return (
    <div className="page">
      <section className="page-body" style={{ paddingTop: 60 }}>
        <div className="container">
          <DatasetExplorer />
        </div>
      </section>
    </div>
  )
}
