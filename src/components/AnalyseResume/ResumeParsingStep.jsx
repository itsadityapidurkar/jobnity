import { useEffect, useState } from 'react'

const extractionSteps = [
  'Personal information',
  'Education details',
  'Work experience',
  'Skills taxonomy',
  'Projects & portfolio',
  'Certifications'
]

export default function ResumeParsingStep() {
  const [completedIndices, setCompletedIndices] = useState([])

  useEffect(() => {
    const timers = extractionSteps.map((_, index) => {
      return setTimeout(() => {
        setCompletedIndices(prev => [...prev, index])
      }, (index + 1) * 300)
    })

    return () => {
      timers.forEach(t => clearTimeout(t))
    }
  }, [])

  return (
    <div className="resume-panel parsing-panel">
      <div className="parsing-indicator">
        <div className="parsing-spinner">
          <div className="spinner-ring"></div>
        </div>
        
        <h2>Analysing your resume...</h2>
        <p className="parsing-subtitle">Extracting key candidate profile parameters via NLP</p>

        <div className="parsing-checklist">
          {extractionSteps.map((step, idx) => {
            const isDone = completedIndices.includes(idx)
            return (
              <div key={step} className={`checklist-item ${isDone ? 'is-done' : ''}`}>
                <span className="checklist-icon">{isDone ? '✓' : '○'}</span>
                <span>Extracting {step}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
