import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const loc = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  }
  return children
}

// Hook for gating inputs: call in onFocus/onChange
export function useAuthGate() {
  const { isAuthenticated } = useAuth()
  const loc = useLocation()
  const check = () => {
    if (!isAuthenticated) {
      window.location.hash = `#/login?from=${encodeURIComponent(loc.pathname)}`
      window.location.pathname = '/login'
      return false
    }
    return true
  }
  return check
}
