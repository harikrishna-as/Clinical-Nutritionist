import React, { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import ProfilePicture from "../../components/ProfilePicture"
export default function AccountSettings() {
  const { user, updateProfile, logout } = useAuth()
  const [name,setName]=useState(user?.name||"")
  const [email,setEmail]=useState(user?.email||"")
  if (!user) return <div className="page" style={{ background: "#000", minHeight: "80vh", display: "grid", placeItems: "center" }}><div className="card" style={{ background: "#0F172A" }}>Please login at <a href="/login" className="text-link">/login</a></div></div>
  return (
    <div className="page" style={{ background: "#000", minHeight: "80vh" }}>
      <section className="page-hero" style={{ background: "#000" }}><div className="container"><h1>Account Settings</h1><p style={{ color: "#94A3B8" }}>Manage your profile and preferences.</p></div></section>
      <section className="page-body"><div className="container" style={{ display: "grid", gap: 18, maxWidth: 640 }}>
        <div className="card" style={{ background: "#0F172A" }}><h3>Profile Picture</h3><ProfilePicture /></div>
        <div className="card" style={{ background: "#0F172A", display: "grid", gap: 12 }}>
          <label style={{ color: "#94A3B8", fontSize: 12 }}>Name</label><input value={name} onChange={e=>setName(e.target.value)} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(13,5,36,0.8)", color: "#fff" }} />
          <label style={{ color: "#94A3B8", fontSize: 12 }}>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(13,5,36,0.8)", color: "#fff" }} />
          <button className="btn btn-primary" onClick={()=>updateProfile({ name, email })}>Save</button>
          <button className="btn btn-ghost" onClick={logout}>Logout</button>
        </div>
      </div></section>
    </div>
  )
}
