import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useScroll, useMotionValueEvent } from 'framer-motion'
import {
  Home, Building2, Activity, Monitor, Stethoscope, Pill, Syringe,
  Baby, Heart, Shield, HeartPulse, Gauge, User, Droplets, Ribbon,
  Search, Database, Boxes, FlaskConical, ScanLine, Sparkles, ArrowRight,
  X, ChevronDown, FileText, LayoutDashboard, Cctv, Scissors, Apple, Milk,
} from 'lucide-react'
import { DEPARTMENTS, SITE_SEARCH } from '../../lib/data'
import { useAuth } from '../../context/AuthContext'

const ICONS = { Activity, Monitor, Stethoscope, Pill, Syringe, Baby, Heart, Shield, HeartPulse, Gauge, User, Droplets, Ribbon, Cctv, Scissors, Apple, Milk }

// Desktop megamenu with hover panels + mobile accordion
export default function Megamenu() {
  const { user, logout, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
const closeTimer = useRef(null)
  const hoverCount = useRef(0)
  const navRef = useRef(null)
  const location = useLocation()
  const { scrollY } = useScroll()

  useEffect(() => {
    setOpen(null)
    setMobileOpen(false)
    setSearchOpen(false)
    hoverCount.current = 0
    if (window.lenis) window.lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [location.pathname])

useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 30))

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(null); hoverCount.current = 0 } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (!navRef.current?.contains(e.target)) { hoverCount.current = 0; setOpen(null) }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const openMenu = (key) => {
    clearTimeout(closeTimer.current)
    setOpen(key)
  }
  const addHover = (key) => {
    clearTimeout(closeTimer.current)
    hoverCount.current += 1
    setOpen(key)
  }
  const dropHover = () => {
    hoverCount.current = Math.max(0, hoverCount.current - 1)
    if (hoverCount.current === 0) {
      clearTimeout(closeTimer.current)
      closeTimer.current = setTimeout(() => setOpen(null), 280)
    }
  }

  const menuData = [
    {
      key: 'departments',
      label: 'Departments',
      icon: Building2,
      columns: [
        {
          title: 'Critical Care',
          items: DEPARTMENTS.filter((d) => ['icu', 'eicu', 'sicu', 'micu', 'ticu', 'cicu'].includes(d.slug)),
        },
        {
          title: 'Surgery & Theatre',
          items: DEPARTMENTS.filter((d) => ['ot', 'nicu'].includes(d.slug)),
        },
        {
          title: 'Women & Child',
          items: DEPARTMENTS.filter((d) => ['pregnancy', 'pediatric', 'geriatric'].includes(d.slug)),
        },
        {
          title: 'Specialty Wards',
          items: DEPARTMENTS.filter((d) => ['nephrology', 'oncology', 'diabetes'].includes(d.slug)),
        },
      ],
    },
    {
      key: 'clinical',
      label: 'Clinical Tools',
      icon: FlaskConical,
      links: [
        { to: '/assessment', label: 'Health Assessment', desc: 'Weight, hair fall, protein & malnutrition screening', icon: Sparkles },
        { to: '/camera', label: 'Camera Lab', desc: 'Vitamin deficiency image analysis', icon: ScanLine },
        { to: '/medications', label: 'Medications & IV', desc: 'Drug-nutrient interactions, IV fluids & drips', icon: Pill },
        { to: '/medicines-search', label: 'Medicine Identifier', desc: 'Identify medicines from 250k+ Indian drug database', icon: Stethoscope },
        { to: '/recommend', label: 'Recommendation Lab', desc: 'Personalized multi-agent meal planning', icon: HeartPulse },
        { to: '/reports', label: 'Reports', desc: 'Print & download assessment reports', icon: FileText },
      ],
    },
    {
      key: 'intelligence',
      label: 'Intelligence',
      icon: Database,
      links: [
        { to: '/knowledge-graph', label: 'Knowledge Graph', desc: '3D food-nutrient-disease network', icon: Boxes },
        { to: '/ml-results', label: 'ML Results', desc: '21 models evaluation dashboard', icon: LayoutDashboard },
        { to: '/trained-models', label: 'Trained Models', desc: 'Your table — Numerical/Text/Image + live playground', icon: Sparkles },
        { to: '/database', label: 'Database Explorer', desc: 'Browse 60+ real clinical & nutrition datasets', icon: Database },
      ],
    },
  ]

  return (
    <>
      <nav ref={navRef} className={`site-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link to="/" className="nav-brand">
            <div className="nav-logo">N</div>
            <div>
              <div className="nav-title">Clinical Nutrition DSS</div>
              <div className="nav-sub">ML-VERIFIED • EVIDENCE-BASED</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="nav-desktop">
            <Link to="/" className="nav-link"><Home size={15} /> Home</Link>

            {menuData.map((m, mi) => (
              <div key={m.key} className="nav-item" onMouseEnter={() => addHover(m.key)} onMouseLeave={dropHover}>
                <button className="nav-link nav-trigger" onClick={() => openMenu(m.key)}>
                  {m.icon && <m.icon size={15} />} {m.label}
                  <ChevronDown size={14} className={`caret ${open === m.key ? 'open' : ''}`} />
                </button>
                {open === m.key && (
                  <MegaPanel
                    data={m}
                    align={mi === 0 ? 'left' : mi === menuData.length - 1 ? 'right' : 'center'}
                    onMouseEnter={() => addHover(m.key)}
                    onMouseLeave={dropHover}
                  />
                )}
              </div>
            ))}

            <button className="nav-search-btn" onClick={() => setSearchOpen(true)} aria-label="search">
              <Search size={16} />
            </button>
            <Link to="/recommend" className="btn btn-primary btn-sm">Try It</Link>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="nav-link" style={{ marginLeft: 6 }}>Login</Link>
                <Link to="/register" className="btn btn-ghost btn-sm" style={{ padding: '8px 14px' }}>Sign In</Link>
              </>
            ) : (
              <>
                <Link to="/mr-hari" className="nav-link" title="Mr.Hari Folder" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.12)' }}>Mr.Hari</Link>
                <Link to="/account" className="nav-link" style={{ padding: 0, overflow: 'hidden', borderRadius: '50%', width: 36, height: 36, display: 'grid', placeItems: 'center', background: '#0F172A', border: '1px solid rgba(167,139,250,0.4)' }}>
                  {user?.profilePic || localStorage.getItem('cn_dss_profile_pic') ? <img src={user?.profilePic || localStorage.getItem('cn_dss_profile_pic')} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={18} />}
                </Link>
                <button onClick={logout} className="nav-link" style={{ color: '#94A3B8' }}><X size={14} /></button>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="nav-mobile">
            <button className="nav-search-btn" onClick={() => setSearchOpen(true)} aria-label="search"><Search size={16} /></button>
            <button
              className="nav-burger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="menu"
            >
              {mobileOpen ? <X size={22} /> : <span className="burger-lines"><i /><i /><i /></span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link">Home</Link>
          {menuData.map((m) => (
            <div key={m.key}>
              <div className="mobile-group-title">{m.label}</div>
              {m.links
                ? m.links.map((l) => (
                    <Link key={l.to} to={l.to} className="mobile-link small">{l.label}</Link>
                  ))
                : m.columns.flatMap((c) => c.items).map((d) => (
                    <Link key={d.slug} to={`/departments/${d.slug}`} className="mobile-link small">{d.name}, {d.full}</Link>
                  ))}
            </div>
          ))}
          <div className="mobile-group-title">Account</div>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="mobile-link small">Login</Link>
              <Link to="/register" className="mobile-link small">Sign In / Register</Link>
            </>
          ) : (
            <>
              <Link to="/mr-hari" className="mobile-link small">Mr.Hari Folder</Link>
              <Link to="/account" className="mobile-link small">Account Settings</Link>
              <button onClick={logout} className="mobile-link small" style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', color: '#94A3B8' }}>Logout</button>
            </>
          )}
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}

function MegaPanel({ data, align = 'center', onMouseEnter, onMouseLeave }) {
  const [activeCol, setActiveCol] = useState(0)
  const cls = align === 'left' ? 'mega-panel align-left' : align === 'right' ? 'mega-panel align-right' : 'mega-panel'
  return (
    <div className={cls} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {data.links ? (
        <div className="mega-links">
          {data.links.map((l) => {
            const Icon = l.icon
            return (
              <Link key={l.to} to={l.to} className="mega-link">
                {Icon && <span className="mega-ico"><Icon size={18} /></span>}
                <span>
                  <strong>{l.label}</strong>
                  <em>{l.desc}</em>
                </span>
                <ArrowRight size={15} className="mega-arrow" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mega-cols">
          <div className="mega-side">
            {data.columns.map((c, i) => (
              <button
                key={c.title}
                className={`mega-side-btn ${activeCol === i ? 'active' : ''}`}
                onMouseEnter={() => setActiveCol(i)}
              >
                {c.title} <ArrowRight size={13} />
              </button>
            ))}
          </div>
          <div className="mega-grid">
            {data.columns[activeCol].items.map((d) => {
              const Icon = ICONS[d.icon] || Building2
              return (
                <Link key={d.slug} to={`/departments/${d.slug}`} className="mega-card">
                  <span className="mega-card-ico" style={{ background: `${d.color}22`, color: d.color, overflow: 'hidden', padding: d.logo ? 0 : undefined }}>
                    {d.logo ? <img src={d.logo} alt={`${d.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <Icon size={18} />}
                  </span>
                  <strong>{d.name}</strong>
                  <em>{d.full}</em>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchOverlay({ onClose }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = q.trim().length < 2
    ? []
    : SITE_SEARCH
        .filter((r) => (r.title + ' ' + r.desc).toLowerCase().includes(q.toLowerCase()))
        .slice(0, 10)

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-box" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-row">
          <Search size={20} color="#A78BFA" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search departments, drugs, IV fluids, conditions..."
          />
          <button onClick={onClose} aria-label="close"><X size={20} /></button>
        </div>
        {results.length > 0 && (
          <div className="search-results">
            {results.map((r, i) => (
              <Link key={i} to={r.path} className="search-result">
                <strong>{r.title}</strong>
                <em>{r.desc}</em>
              </Link>
            ))}
          </div>
        )}
        {q.trim().length >= 2 && results.length === 0 && (
          <div className="search-empty">No results for "{q}"</div>
        )}
      </div>
    </div>
  )
}
