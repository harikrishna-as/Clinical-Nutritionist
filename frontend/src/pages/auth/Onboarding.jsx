import React from "react"
import { Link } from "react-router-dom"
export default function Onboarding() {
  return (
    <div className="page" style={{ minHeight: "80vh", display: "grid", placeItems: "center", background: "#000" }}>
      <div className="card" style={{ width: "min(560px,92vw)", background: "#0F172A", textAlign: "center" }}>
        <h2>Welcome to Clinical Nutrition DSS</h2>
        <p style={{ color: "#94A3B8" }}>You are all set. Start with your profile picture and explore Mr.Hari folder.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
          <Link to="/mr-hari" className="btn btn-primary">Go to Mr.Hari</Link>
          <Link to="/account" className="btn btn-ghost">Account Settings</Link>
        </div>
      </div>
    </div>
  )
}
