import React from "react"
import { Link } from "react-router-dom"
export default function UXTemplate({ code, title, desc }) {
  return (
    <div className="page" style={{ background: "#000", minHeight: "80vh", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ background: "#0F172A", textAlign: "center", maxWidth: 520 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: "#A78BFA" }}>{code}</div>
        <h2>{title}</h2>
        <p style={{ color: "#94A3B8" }}>{desc}</p>
        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
          <Link to="/" className="btn btn-primary btn-sm">Go Home</Link>
          <Link to="/help-center" className="btn btn-ghost btn-sm">Help Center</Link>
        </div>
      </div>
    </div>
  )
}
