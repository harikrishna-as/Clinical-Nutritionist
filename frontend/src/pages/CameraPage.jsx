import React from 'react'
import CameraLab from '../components/CameraLab'

export default function CameraPage() {
  return (
    <div className="page">
      <section className="page-body" style={{ paddingTop: 60 }}>
        <div className="container">
          <CameraLab />
        </div>
      </section>
    </div>
  )
}
