import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import LandingPage from './pages/LandingPage'
import AnalyseResumePage from './pages/AnalyseResumePage'
import RoadmapPage from './pages/RoadmapPage'
import DocsPage from './pages/DocsPage'
import MockInterviewPage from './pages/MockInterviewPage'

const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.998 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.998,
    transition: { duration: 0.18, ease: [0.7, 0, 0.84, 0] }
  }
}

const PageWrapper = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    style={{ minHeight: '100svh', willChange: 'transform, opacity' }}
  >
    {children}
  </motion.div>
)

function LenisScrollManager() {
  const location = useLocation()
  const lenisRef = useRef(null)

  useEffect(() => {
    // Respect accessibility reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Initialize Lenis smooth kinetic scroll
    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0 : 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !prefersReducedMotion,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      infinite: false,
    })

    lenisRef.current = lenis
    window.lenis = lenis

    let rafId
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Smooth anchor navigation handler
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (href && href.length > 1) {
        try {
          const targetEl = document.querySelector(href)
          if (targetEl && lenisRef.current) {
            e.preventDefault()
            lenisRef.current.scrollTo(targetEl, { offset: -80, duration: prefersReducedMotion ? 0 : 1.0 })
          }
        } catch {
          // ignore invalid selector
        }
      }
    }
    document.addEventListener('click', handleAnchorClick)

    return () => {
      document.removeEventListener('click', handleAnchorClick)
      cancelAnimationFrame(rafId)
      lenis.destroy()
      window.lenis = null
      lenisRef.current = null
    }
  }, [])

  // Smooth scroll back to top when navigating routes
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <>
      <LenisScrollManager />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Landing Page */}
          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />

          {/* Main Tab 1: Analyse Resume */}
          <Route path="/analyse-resume" element={<PageWrapper><AnalyseResumePage /></PageWrapper>} />
          <Route path="/upload-resume" element={<Navigate to="/analyse-resume" replace />} />
          <Route path="/skill-gap-report" element={<Navigate to="/analyse-resume" replace />} />

          {/* Main Tab 2: Roadmaps */}
          <Route path="/roadmaps" element={<PageWrapper><RoadmapPage /></PageWrapper>} />
          <Route path="/roadmap" element={<Navigate to="/roadmaps" replace />} />

          {/* Documentation Page */}
          <Route path="/docs" element={<PageWrapper><DocsPage /></PageWrapper>} />
          <Route path="/documentation" element={<Navigate to="/docs" replace />} />

          {/* Main Tab 3: AI Interview Prep (Qwen 2.5) */}
          <Route path="/interview" element={<PageWrapper><MockInterviewPage /></PageWrapper>} />
          <Route path="/interview-prep" element={<Navigate to="/interview" replace />} />
          <Route path="/mock-interview" element={<Navigate to="/interview" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
