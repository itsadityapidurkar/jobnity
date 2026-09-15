import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navigation({ className = '' }) {
  const location = useLocation()
  const [showTooltip, setShowTooltip] = useState(false)

  const isAnalyseActive = location.pathname.startsWith('/analyse') || location.pathname === '/upload-resume' || location.pathname === '/skill-gap-report'
  const isRoadmapsActive = location.pathname.startsWith('/roadmap')

  return (
    <header className={`global-navbar ${className}`}>
      <Link className="wordmark" to="/" aria-label="Jobnity home">
        Jobnity
      </Link>

      <nav className="global-nav-tabs" aria-label="Main Navigation">
        <Link 
          to="/analyse-resume" 
          className={`nav-tab ${isAnalyseActive ? 'is-active' : ''}`}
        >
          <svg className="nav-tab__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span>Analyse Resume</span>
        </Link>

        <Link 
          to="/roadmaps" 
          className={`nav-tab ${isRoadmapsActive ? 'is-active' : ''}`}
        >
          <svg className="nav-tab__icon" viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="12 2 2 7 12 12 22 7 12 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="2 17 12 22 22 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="2 12 12 17 22 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Roadmaps</span>
        </Link>

        <div 
          className="nav-tab-wrapper"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button 
            type="button" 
            className="nav-tab is-disabled" 
            disabled 
            aria-disabled="true"
            aria-describedby="interview-tooltip"
          >
            <svg className="nav-tab__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span>Interview</span>
            <span className="badge-coming-soon">Soon</span>
          </button>

          {showTooltip && (
            <div id="interview-tooltip" className="nav-tab-tooltip" role="tooltip">
              <div className="nav-tab-tooltip__title">
                <span className="tooltip-dot"></span>
                Development in Progress
              </div>
              <div className="nav-tab-tooltip__desc">
                AI-powered interview preparation is currently under development.
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
