import { Link } from 'react-router-dom'
import BackgroundLayout from '../components/BackgroundLayout'
import Navigation from '../components/Navigation'
import heroBackground from '../assets/jobnity-hero.png'
import StepIcon from '../components/StepIcon'

const steps = [
  { icon: 'upload', label: 'Upload resume' },
  { icon: 'analyze', label: 'Analyze skills' },
  { icon: 'prepare', label: 'Prepare smarter' },
]

export default function LandingPage() {
  return (
    <BackgroundLayout backgroundImage={heroBackground}>
      <Navigation />

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Career clarity, made personal</p>
        <h1 id="hero-title">
          See where your potential can take you.
        </h1>
        <p className="hero__copy">
          Turn your resume into a tailored path to stronger skills and clearer career roadmaps.
        </p>

        <div className="hero-actions">
          <Link className="primary-button" to="/analyse-resume">
            Analyse Your Resume
            <span aria-hidden="true">→</span>
          </Link>
        </div>
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
