import React, { useState } from "react"
import { Link } from "react-router-dom"
export default function ResetPassword() {
  const [pw,setPw]=useState("")
  const [done,setDone]=useState(false)
  return (
    <div className="page" style={{ minHeight: "80vh", display: "grid", placeItems: "center", background: "#000" }}>
      <div className="card" style={{ width: "min(420px,92vw)", background: "#0F172A" }}>
        <h2>Reset Password</h2>
        {!done ? (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="New password" style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(13,5,36,0.8)", color: "#fff" }} />
            <button className="btn btn-primary" onClick={()=>setDone(true)}>Reset</button>
          </div>
        ) : <div style={{ color: "#22c55e", marginTop: 12 }}>Password reset! <Link to="/login" className="text-link">Login</Link></div>}
      </div>
    </div>
  )
}
