import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navigation({ className = '' }) {
  const location = useLocation()
  const [showTooltip, setShowTooltip] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAnalyseActive = location.pathname.startsWith('/analyse') || location.pathname === '/upload-resume' || location.pathname === '/skill-gap-report'
  const isRoadmapsActive = location.pathname.startsWith('/roadmap')
  const isDocsActive = location.pathname.startsWith('/docs') || location.pathname === '/documentation'
  const isInterviewActive = location.pathname.startsWith('/interview')
  const isHomeActive = location.pathname === '/'

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <>
      <header className={`global-navbar ${className}`}>
        <Link className="wordmark" to="/" aria-label="Jobnity home">
          <img src="/favicon.png" alt="Jobnity Favicon Logo" />
          <span>Jobnity</span>
        </Link>

        {/* Desktop Navigation Tabs with Shared Element Layout Morphing */}
        <nav className="global-nav-tabs desktop-only" aria-label="Main Navigation">
          {[
            {
              to: '/analyse-resume',
              label: 'Analyse Resume',
              isActive: isAnalyseActive,
              icon: (
                <svg className="nav-tab__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              )
            },
            {
              to: '/roadmaps',
              label: 'Roadmaps',
              isActive: isRoadmapsActive,
              icon: (
                <svg className="nav-tab__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="2 17 12 22 22 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="2 12 12 17 22 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            },
            {
              to: '/docs',
              label: 'Docs',
              isActive: isDocsActive,
              icon: (
                <svg className="nav-tab__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            },
            {
              to: '/interview',
              label: 'Interview',
              badge: 'AI',
              isActive: isInterviewActive,
              icon: (
                <svg className="nav-tab__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              )
            }
          ].map((tab) => (
            <Link 
              key={tab.to}
              to={tab.to} 
              className={`nav-tab ${tab.isActive ? 'is-active' : ''}`}
              style={{ position: 'relative' }}
            >
              {tab.isActive && (
                <motion.div
                  layoutId="global-nav-active-pill"
                  className="nav-tab-active-indicator"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="nav-tab-inner" style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="badge-coming-soon" style={{ background: 'rgba(156, 235, 217, 0.18)', color: '#9cebd9', borderColor: 'rgba(156, 235, 217, 0.3)' }}>
                    {tab.badge}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </nav>

        {/* Mobile Header Menu Trigger */}
        <button 
          type="button" 
          className="mobile-hamburger-btn mobile-only" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Slide-Out Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              className="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              className="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="mobile-drawer__header">
                <span className="wordmark">
                  <img src="/favicon.png" alt="Jobnity Favicon Logo" />
                  <span>Jobnity</span>
                </span>
                <span className="mobile-drawer__badge">Mobile Experience</span>
              </div>

              <div className="mobile-drawer__links">
                <Link to="/" className={`mobile-drawer__link ${isHomeActive ? 'is-active' : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span>Home</span>
                </Link>

                <Link to="/analyse-resume" className={`mobile-drawer__link ${isAnalyseActive ? 'is-active' : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>Analyse Resume</span>
                </Link>

                <Link to="/roadmaps" className={`mobile-drawer__link ${isRoadmapsActive ? 'is-active' : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  <span>Career Roadmaps</span>
                </Link>

                <Link to="/interview" className={`mobile-drawer__link ${isInterviewActive ? 'is-active' : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                  <span>AI Interview Prep</span>
                  <span className="badge-coming-soon" style={{ background: 'rgba(156, 235, 217, 0.18)', color: '#9cebd9' }}>AI</span>
                </Link>
              </div>

              <div className="mobile-drawer__footer">
                <p className="mobile-drawer__status">
                  <span className="status-dot"></span> AI Career Engine Ready
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Mobile Bottom Navigation Bar (Always Accessible in Thumb Zone) */}
      <nav className="mobile-bottom-nav mobile-only" aria-label="Mobile Navigation Bar">
        <Link 
          to="/" 
          className={`mobile-bottom-nav__item ${isHomeActive ? 'is-active' : ''}`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Home</span>
        </Link>

        <Link 
          to="/analyse-resume" 
          className={`mobile-bottom-nav__item ${isAnalyseActive ? 'is-active' : ''}`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>Analyse</span>
        </Link>

        <Link 
          to="/roadmaps" 
          className={`mobile-bottom-nav__item ${isRoadmapsActive ? 'is-active' : ''}`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          <span>Roadmaps</span>
        </Link>

        <Link 
          to="/interview"
          className={`mobile-bottom-nav__item ${isInterviewActive ? 'is-active' : ''}`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          </svg>
          <span>Interview</span>
        </Link>
      </nav>
    </>
  )
}

