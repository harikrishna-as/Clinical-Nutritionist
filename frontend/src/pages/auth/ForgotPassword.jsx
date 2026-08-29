import React, { useState } from "react"
import { Link } from "react-router-dom"
export default function ForgotPassword() {
  const [email,setEmail]=useState("")
  const [sent,setSent]=useState(false)
  return (
    <div className="page" style={{ minHeight: "80vh", display: "grid", placeItems: "center", background: "#000" }}>
      <div className="card" style={{ width: "min(420px,92vw)", background: "#0F172A" }}>
        <h2>Forgot Password</h2>
        <p style={{ color: "#94A3B8", fontSize: 13 }}>We will send a reset link.</p>
        {!sent ? (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(13,5,36,0.8)", color: "#fff" }} />
            <button className="btn btn-primary" onClick={()=>setSent(true)}>Send Link</button>
          </div>
        ) : <div style={{ color: "#22c55e", marginTop: 12 }}>Link sent to {email}. <Link to="/reset-password" className="text-link">Reset now</Link></div>}
      </div>
    </div>
  )
}
