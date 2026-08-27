import React from 'react'
import PatientLab from '../components/PatientLab'

export default function RecommendPage() {
  return (
    <div className="page">
      <section className="page-body" style={{ paddingTop: 60 }}>
        <div className="container">
          <PatientLab />
        </div>
      </section>
    </div>
  )
}
