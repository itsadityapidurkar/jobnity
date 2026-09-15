const defaultSteps = ['Resume', 'Review', 'Skill gap', 'Roadmap', 'Interview']

export default function StepIndicator({ active = 0, steps = defaultSteps }) {
  return (
    <nav className="step-indicator" aria-label="Setup progress">
      {steps.map((step, index) => (
        <div className={`step-indicator__item ${index === active ? 'is-active' : ''} ${index < active ? 'is-complete' : ''}`} key={step}>
          <span className="step-indicator__dot">{index < active ? '✓' : index + 1}</span>
          <span>{step}</span>
        </div>
      ))}
    </nav>
  )
}
