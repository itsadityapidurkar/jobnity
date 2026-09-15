import BackgroundLayout from './components/BackgroundLayout'
import StepIcon from './components/StepIcon'
import UploadResumePage from './pages/UploadResumePage'
import SkillGapReportPage from './pages/SkillGapReportPage'
import RoadmapPage from './pages/RoadmapPage'
import MockInterviewPage from './pages/MockInterviewPage'
import DashboardPage from './pages/DashboardPage'

const steps = [
  { icon: 'upload', label: 'Upload resume' },
  { icon: 'analyze', label: 'Analyze skills' },
  { icon: 'prepare', label: 'Prepare smarter' },
]

function LandingPage() {
  return (
    <BackgroundLayout>
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Jobnity home">Jobnity</a>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Career clarity, made personal</p>
        <h1 id="hero-title">See where your potential can take you.</h1>
        <p className="hero__copy">
          Turn your resume into a tailored path to stronger skills and more confident interviews.
        </p>
        <a className="primary-button" href="/upload-resume">
          Get Started
          <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="steps" aria-label="How Jobnity works">
        <p className="steps__intro">A clearer way forward</p>
        <div className="steps__list">
          {steps.map((step, index) => (
            <div className="step" key={step.icon}>
              <span className="step__number">0{index + 1}</span>
              <StepIcon name={step.icon} />
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </section>
    </BackgroundLayout>
  )
}

export default function App() {
  if (window.location.pathname === '/upload-resume') return <UploadResumePage />
  if (window.location.pathname === '/skill-gap-report') return <SkillGapReportPage />
  if (window.location.pathname === '/roadmap') return <RoadmapPage />
  if (window.location.pathname === '/interview-prep') return <MockInterviewPage />
  if (window.location.pathname === '/dashboard') return <DashboardPage />
  return <LandingPage />
}
