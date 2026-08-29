import React from "react"
export default function LegalTemplate({ title, updated }) {
  return (
    <div className="page" style={{ background: "#000", minHeight: "80vh" }}>
      <section className="page-hero" style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="container">
          <h1 style={{ color: "#fff" }}>{title}</h1>
          <p style={{ color: "#94A3B8" }}>Last updated: {updated || "28 Aug 2026"} — Clinical Nutrition DSS</p>
        </div>
      </section>
      <section className="page-body">
        <div className="container">
          <div className="card" style={{ background: "#0F172A", lineHeight: 1.8, color: "#D1D5DB" }}>
            <p>This is the {title} for Clinical Nutrition DSS (ML-Verified). The system processes nutrition-related patient data via 21 ML models with explainability. Content here is a placeholder for your legal team to finalize. Contact: support@clinical-nutrition.local</p>
            <p style={{ marginTop: 12 }}>All processing is explainable and auditable. For questions, see Help Center or contact the Data Protection Officer.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
