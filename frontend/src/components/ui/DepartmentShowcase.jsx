import React from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// Department grid: every card is a direct link to its department page.
// No modal, no body scroll-lock, no Lenis stop/start dance.
export default function DepartmentShowcase({ items = [] }) {
  const mediaBg = (d) => `radial-gradient(circle at 30% 20%, ${d.color}66, transparent 60%), linear-gradient(140deg, ${d.color}59, #160a38)`

  return (
    <div className="expand-grid">
      {items.map((d) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="expand-card"
        >
          <Link to={`/departments/${d.slug || d.id}`} className="expand-card__link">
            <div className="expand-card__media" style={{ background: mediaBg(d) }}>
              <span className="expand-card__icon">{d.icon}</span>
            </div>
            <div className="expand-card__body">
              <h3 className="expand-card__title">{d.title}</h3>
              <p className="expand-card__desc">{d.description}</p>
              <span className="expand-card__more">Open protocol <ArrowRight size={13} /></span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}