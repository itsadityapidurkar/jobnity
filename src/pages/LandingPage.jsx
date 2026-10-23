import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import BackgroundLayout from '../components/BackgroundLayout'
import Navigation from '../components/Navigation'
import heroBackground from '../assets/jobnity-hero.png'
import StepIcon from '../components/StepIcon'

const steps = [
  { 
    icon: 'upload', 
    title: 'Upload Your Resume', 
    desc: 'Instant, private extraction of your verified skills, projects, and career achievements.' 
  },
  { 
    icon: 'analyze', 
    title: 'Match Roles & Find Gaps', 
    desc: 'Clear percentage match against 50+ roles. Know exactly what you have and what to learn next.' 
  },
  { 
    icon: 'prepare', 
    title: 'Learn & Practice with AI', 
    desc: 'Follow curated roadmaps with top resources and practice technical interview questions tailored to your experience.' 
  },
]

const pillars = [
  {
    icon: '🎯',
    title: 'Precision Skill Matching',
    desc: 'Stop applying in the dark. See how your actual background stacks up against current employer expectations.',
    points: [
      'Identifies core strengths and high-priority skills to learn',
      'Distinguishes required skills from transferable ones you already know',
      'Calculates clear fit scores based on your verifiable evidence'
    ]
  },
  {
    icon: '🗺️',
    title: 'Step-by-Step Roadmaps',
    desc: 'Get structured, milestone-driven learning paths without wading through generic, outdated tutorials.',
    points: [
      'Curated resources from Coursera, freeCodeCamp, and official docs',
      'Organized by beginner, intermediate, and advanced milestones',
      'Hands-on project recommendations to build real-world proof'
    ]
  },
  {
    icon: '🎙️',
    title: 'Resume-Grounded Mock Interviews',
    desc: 'Practice realistic technical interviews designed specifically around your real projects and tools.',
    points: [
      '3-question scenarios covering real-world architecture and trade-offs',
      'Actionable feedback on technical depth and communication clarity',
      'Unlimited practice sessions with zero stress or judgment'
    ]
  }
]

export default function LandingPage() {
  return (
    <BackgroundLayout backgroundImage={heroBackground}>
      <Navigation />

      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Career Intelligence &amp; Practice</p>
        <h1 id="hero-title">
          See exactly where your skills stand.
        </h1>
        <p className="hero__copy">
          Upload your resume to discover your skill match for top tech roles, get clear step-by-step learning roadmaps, and practice realistic technical interviews.
        </p>

        <div className="hero-actions">
          <Link className="primary-button" to="/analyse-resume">
            Analyse Your Resume
            <span aria-hidden="true">→</span>
          </Link>
          <Link className="secondary-button" to="/roadmaps" style={{ padding: '0.85rem 1.45rem' }}>
            Explore Roadmaps
          </Link>
        </div>

        <div className="hero-trust-bar">
          <span className="trust-badge">
            <span className="trust-badge-dot" /> 100% Free &amp; Private
          </span>
          <span className="trust-badge">
            <span className="trust-badge-dot" /> 50+ Tech Roles
          </span>
          <span className="trust-badge">
            <span className="trust-badge-dot" /> Results in 60 Seconds
          </span>
        </div>
      </section>

      {/* 3-Step Walkthrough */}
      <section className="steps" aria-label="How Jobnity works">
        <p className="steps__intro">A Clearer Way Forward</p>
        <div className="steps__list">
          {steps.map((step, index) => (
            <div className="step" key={step.icon}>
              <span className="step__number">0{index + 1}</span>
              <StepIcon name={step.icon} />
              <div>
                <span style={{ display: 'block', marginBottom: '0.2rem' }}>{step.title}</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 400, lineHeight: 1.4 }}>
                  {step.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Value Pillars Section */}
      <section className="landing-pillars" aria-labelledby="pillars-title">
        <div className="landing-pillars__header">
          <p className="eyebrow">Why Jobnity</p>
          <h2 id="pillars-title">Everything you need to advance with confidence.</h2>
          <p>
            No buzzwords, no complicated algorithms to decipher. Just clear direction, transparent scores, and the tools you need to reach your next career milestone.
          </p>
        </div>

        <div className="pillars-grid">
          {pillars.map((pillar) => (
            <div className="pillar-card" key={pillar.title}>
              <div className="pillar-card__icon">{pillar.icon}</div>
              <h3>{pillar.title}</h3>
              <p>{pillar.desc}</p>
              <ul className="pillar-card__points">
                {pillar.points.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="landing-cta-section" aria-label="Get started call to action">
        <div className="landing-cta-card">
          <p className="eyebrow" style={{ color: '#74e3bd' }}>Start In Under Two Minutes</p>
          <h2>Ready to see your personalized career path?</h2>
          <p>
            Upload your resume now to get an instant breakdown of your strengths, the skills employers look for, and a customized roadmap to bridge the gap.
          </p>
          <Link className="primary-button" to="/analyse-resume" style={{ padding: '0.95rem 1.8rem', fontSize: '0.98rem' }}>
            Analyse Your Resume Now
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="landing-footer" role="contentinfo">
        <div className="landing-footer__left">
          <Link className="wordmark" to="/" aria-label="Jobnity home">
            <img src="/favicon.png" alt="Jobnity Logo" width="22" height="22" style={{ borderRadius: '4px' }} />
            <span>Jobnity</span>
          </Link>
          <span>·</span>
          <span>Clear career direction &amp; technical preparation.</span>
        </div>

        <div className="landing-footer__links">
          <Link to="/analyse-resume">Analyse Resume</Link>
          <Link to="/roadmaps">Roadmaps</Link>
          <Link to="/interview">Practice Interview</Link>
          <Link to="/docs">Documentation</Link>
        </div>
      </footer>
    </BackgroundLayout>
  )
}
