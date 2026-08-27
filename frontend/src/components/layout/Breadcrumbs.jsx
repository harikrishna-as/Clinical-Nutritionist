import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { DEPARTMENTS } from '../../lib/data'

const CRUMB_OVERRIDES = {
  'knowledge-graph': 'Knowledge Graph',
  'ml-results': 'ML Results',
  camera: 'Camera Lab',
  recommend: 'Recommendation Lab',
  database: 'Database Explorer',
  departments: 'Departments',
  medications: 'Medications & IV',
  assessment: 'Health Assessment',
  reports: 'Reports',
}

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length === 0) return null

  let crumbs = []
  if (parts[0] === 'departments' && parts[1]) {
    const dept = DEPARTMENTS.find((d) => d.slug === parts[1])
    crumbs = [
      { label: 'Departments', to: '/departments' },
      { label: dept ? `${dept.name}, ${dept.full}` : parts[1], to: pathname },
    ]
  } else {
    crumbs = [
      { label: CRUMB_OVERRIDES[parts[0]] || parts[0], to: `/${parts[0]}` },
    ]
  }

  return (
    <nav className="breadcrumbs" aria-label="breadcrumb">
      <div className="container breadcrumbs-inner">
        <Link to="/" className="crumb"><Home size={13} /> Home</Link>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={13} className="crumb-sep" />
            {c.to && i < crumbs.length - 1
              ? <Link to={c.to} className="crumb">{c.label}</Link>
              : <span className="crumb current">{c.label}</span>}
          </React.Fragment>
        ))}
      </div>
    </nav>
  )
}
