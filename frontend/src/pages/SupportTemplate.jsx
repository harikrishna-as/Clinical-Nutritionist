import React from "react"
export default function SupportTemplate({ title, children }) {
  return (
    <div className="page" style={{ background: "#000", minHeight: "80vh" }}>
      <section className="page-hero" style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="container"><h1 style={{ color: "#fff" }}>{title}</h1><p style={{ color: "#94A3B8" }}>Support • Clinical Nutrition DSS</p></div>
      </section>
      <section className="page-body"><div className="container"><div className="card" style={{ background: "#0F172A", color: "#D1D5DB" }}>{children || <p>This is the {title} page. Placeholder for your support team.</p>}</div></div></section>
    </div>
  )
}
