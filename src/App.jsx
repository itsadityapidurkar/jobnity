import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import AnalyseResumePage from './pages/AnalyseResumePage'
import RoadmapPage from './pages/RoadmapPage'
import DocsPage from './pages/DocsPage'

const pageVariants = {
  initial: { opacity: 0, y: 15, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -15, scale: 0.99, transition: { duration: 0.2, ease: 'easeInOut' } }
}

const PageWrapper = ({ children }) => (
  <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} style={{ minHeight: '100svh' }}>
    {children}
  </motion.div>
)

function AnimatedRoutes() {
  const location = useLocation()
  return (
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
