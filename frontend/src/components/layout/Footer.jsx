import React from 'react'
import { Link } from 'react-router-dom'
import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react'
import { DEPARTMENTS } from '../../lib/data'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="nav-brand" style={{ marginBottom: 14 }}>
              <img src="/logo.png" alt="Clinical Nutritionist logo" className="nav-logo" />
              <div>
                <div className="nav-title">Clinical Nutrition DSS</div>
                <div className="nav-sub">ML-VERIFIED • EVIDENCE-BASED</div>
              </div>
            </div>
            <p className="footer-desc">
              An ML-verified clinical nutrition system. 21 trained ML models compute the plan and cross-check every decision — built on real eICU, Synthea, FoodData Central and CNF data, plus 23,000+ clinical images.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="github"><Github size={17} /></a>
              <a href="#" aria-label="linkedin"><Linkedin size={17} /></a>
              <a href="#" aria-label="mail"><Mail size={17} /></a>
            </div>
          </div>

          <div>
            <h4>Departments</h4>
            {DEPARTMENTS.slice(0, 7).map((d) => (
              <Link key={d.slug} to={`/departments/${d.slug}`} className="footer-link">{d.name}, {d.full}</Link>
            ))}
          </div>

          <div>
            <h4>Clinical Tools</h4>
            <Link to="/assessment" className="footer-link">Health Assessment</Link>
            <Link to="/camera" className="footer-link">Camera Lab</Link>
            <Link to="/starfield.html" className="footer-link">Starfield Voyage</Link>
            <Link to="/medications" className="footer-link">Medications & IV</Link>
            <Link to="/recommend" className="footer-link">Recommendation Lab</Link>
            <Link to="/reports" className="footer-link">Reports</Link>
          </div>

          <div>
            <h4>Intelligence</h4>
            <Link to="/knowledge-graph" className="footer-link">Knowledge Graph</Link>
            <Link to="/ml-results" className="footer-link">ML Results</Link>
            <Link to="/database" className="footer-link">Database Explorer</Link>
            <Link to="/" className="footer-link">Project Overview</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>Clinical Nutrition DSS • 2026</p>
          <button className="btn btn-primary btn-sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  )
}
