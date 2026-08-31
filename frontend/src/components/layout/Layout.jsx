import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Megamenu from './Megamenu'
import Breadcrumbs from './Breadcrumbs'
import Footer from './Footer'
import ScrollProgress from '../animations/ScrollProgress'
import GlobalCursor from '../GlobalCursor'

export default function Layout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    window.lenis?.scrollTo(0, { immediate: true })
  }, [location.pathname])

  return (
    <div className="app-shell" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <ScrollProgress />
      <GlobalCursor />
      <Megamenu />
      <main>
        <Breadcrumbs />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
