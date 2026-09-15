const defaultSteps = ['Resume', 'Review', 'Skill gap', 'Roadmap', 'Interview']

export default function StepIndicator({ active = 0, steps = defaultSteps }) {
  const currentStepName = steps[active] || `Step ${active + 1}`
  const progressPercent = Math.round(((active + 1) / steps.length) * 100)

  return (
    <div className="step-indicator-wrapper">
      {/* Desktop Step Bar */}
      <nav className="step-indicator desktop-only" aria-label="Setup progress">
        {steps.map((step, index) => (
          <div className={`step-indicator__item ${index === active ? 'is-active' : ''} ${index < active ? 'is-complete' : ''}`} key={step}>
            <span className="step-indicator__dot">{index < active ? '✓' : index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </nav>

      {/* Mobile Step Header Card */}
      <div className="mobile-step-header mobile-only" aria-label="Mobile setup progress">
        <div className="mobile-step-header__top">
          <div className="mobile-step-header__title">
            <span className="mobile-step-counter">Step {active + 1} of {steps.length}</span>
            <span className="mobile-step-name">{currentStepName}</span>
          </div>
          <span className="mobile-step-percent">{progressPercent}%</span>
        </div>
        <div className="mobile-step-track">
          <div 
            className="mobile-step-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mobile-step-dots">
          {steps.map((step, index) => (
            <span 
              key={step} 
              className={`mobile-step-dot ${index === active ? 'is-active' : ''} ${index < active ? 'is-complete' : ''}`} 
              title={step}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

