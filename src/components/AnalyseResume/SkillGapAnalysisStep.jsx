export default function SkillGapAnalysisStep({ analysis, onNavigateToRoadmaps }) {
  if (!analysis) return null

  const targetRole = analysis.targetRole || (analysis.role && analysis.role.job_role) || analysis.target_role || 'Target Role'
  const readinessScore = analysis.readinessScore ?? analysis.readiness_score ?? 0
  const gapScore = analysis.gapScore ?? analysis.skill_gap_score ?? Math.max(0, 100 - readinessScore)
  
  const matched = analysis.matched || analysis.matched_skills || []
  const reqMissing = analysis.missing || analysis.missing_skills || []
  const prefMissing = analysis.preferred_missing_skills || []

  // Combine missing items if separate arrays
  const missing = [...reqMissing, ...prefMissing]

  const matchedCount = analysis.matchedCount ?? matched.length
  const missingCount = analysis.missingCount ?? missing.length
  
  const requiredMissingCount = analysis.requiredMissingCount ?? (analysis.statistics ? (analysis.statistics.required_missing ?? reqMissing.length) : reqMissing.length)
  const preferredMissingCount = analysis.preferredMissingCount ?? (analysis.statistics ? (analysis.statistics.preferred_missing ?? prefMissing.length) : prefMissing.length)

  const gaugeTone = readinessScore >= 75 ? 'var(--green)' : readinessScore >= 50 ? 'var(--amber)' : 'var(--red)'
  const readinessLabel = readinessScore >= 75 ? 'Strong match for role' : readinessScore >= 50 ? 'Good foundation with key growth areas' : 'Actionable skill gaps identified'

  return (
    <div className="analysis-results-container">
      <div className="analysis-intro">
        <p className="eyebrow">Skill Gap Analysis</p>
        <h1>Skill Gap Results for {targetRole}</h1>
        <p>Here is how your confirmed candidate profile compares with the required taxonomy for <strong>{targetRole}</strong>.</p>
      </div>

      {/* Visual score & stats summary card */}
      <div className="analysis-overview-card">
        <div className="readiness-gauge-wrapper">
          <div 
            className="gauge" 
            style={{ 
              '--score': `${readinessScore}%`, 
              '--gauge-color': gaugeTone 
            }}
          >
            <div className="gauge__center">
              <strong>{readinessScore}<sup>%</sup></strong>
              <span>Readiness</span>
            </div>
          </div>
          <p className="gauge-status-text">{readinessLabel}</p>
        </div>

        <div className="stat-summary-grid">
          <div className="stat-card">
            <span className="stat-number stat-gap-score">{gapScore}%</span>
            <span className="stat-label">Skill Gap Score</span>
          </div>
          <div className="stat-card">
            <span className="stat-number stat-matched">{matchedCount}</span>
            <span className="stat-label">Matched Skills</span>
          </div>
          <div className="stat-card">
            <span className="stat-number stat-missing">{missingCount}</span>
            <span className="stat-label">Missing Skills</span>
          </div>
          <div className="stat-card">
            <span className="stat-sublabel">
              <strong>{requiredMissingCount}</strong> Required Missing<br/>
              <strong>{preferredMissingCount}</strong> Preferred Missing
            </span>
          </div>
        </div>
      </div>

      {/* Skill columns */}
      <div className="skill-columns">
        {/* Matched Skills Column */}
        <section className="skill-column">
          <div className="skill-column__title">
            <span className="status-dot status-dot--matched" /> 
            <h2>Matched Skills ({matchedCount})</h2>
          </div>
          {matched.length > 0 ? (
            matched.map((item, idx) => (
              <div className="skill-row" key={item.skill_id || item.id || `${item.skill}-${idx}`}>
                <div className="skill-row-left">
                  <strong>✓ {item.skill}</strong>
                  <span>Candidate: {item.candidate_level || item.candidateLevel || 'Intermediate'} · Required: {item.required_level || item.minimumLevel || 'Intermediate'}</span>
                </div>
                <div className="skill-badge matched-badge">
                  Matched
                </div>
              </div>
            ))
          ) : (
            <p className="skill-column__empty">No skills matched yet.</p>
          )}
        </section>

        {/* Missing Skills Column */}
        <section className="skill-column">
          <div className="skill-column__title">
            <span className="status-dot status-dot--missing" /> 
            <h2>Missing Skills to Learn ({missingCount})</h2>
          </div>
          {missing.length > 0 ? (
            missing.map((item, idx) => {
              const imp = item.importance || 'Required'
              return (
                <div className="skill-row skill-row--missing" key={item.skill_id || item.id || `${item.skill}-${idx}`}>
                  <div className="skill-row-left">
                    <strong>○ {item.skill}</strong>
                    <span>Candidate: Not Found · Required: {item.minimum_level || item.minimumLevel || 'Intermediate'}</span>
                    <p className="skill-reason">{item.reason || `Required skill for ${targetRole}`}</p>
                  </div>
                  <div className="skill-badge-wrapper">
                    <span className={`importance-tag importance-tag--${imp.toLowerCase()}`}>
                      {imp}
                    </span>
                    <span className="missing-badge">Missing</span>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="skill-column__empty">No missing skills detected! You meet all requirements for this role.</p>
          )}
        </section>
      </div>

      {/* Roadmap CTA section */}
      <div className="roadmap-cta-banner">
        <div className="roadmap-cta-content">
          <h3>Ready to bridge your skill gap?</h3>
          <p>We generated personalized learning paths and curated resources for your {missingCount} missing skills.</p>
        </div>
        <button 
          type="button" 
          className="primary-button roadmap-button"
          onClick={() => onNavigateToRoadmaps(missing, targetRole)}
        >
          View Recommended Roadmaps
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}
