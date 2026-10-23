import { useState } from 'react'
import { motion } from 'framer-motion'

export default function SkillGapAnalysisStep({ analysis, onNavigateToRoadmaps, onNavigateToInterview }) {
  const [mobileSkillFilter, setMobileSkillFilter] = useState('all')
  const [showBreakdown, setShowBreakdown] = useState(false)

  if (!analysis) return null

  const targetRole = analysis.targetRole || (analysis.role && analysis.role.job_role) || analysis.target_role || 'Target Role'
  const readinessScore = analysis.readinessScore ?? analysis.readiness_score ?? analysis.role_alignment_score ?? 0
  const gapScore = analysis.gapScore ?? analysis.skill_gap_score ?? Math.max(0, 100 - readinessScore)

  const matched = analysis.matched || analysis.matched_skills || []
  const reqMissing = analysis.missing || analysis.missing_skills || []
  const prefMissing = analysis.preferred_missing_skills || []
  const belowLevel = analysis.below_level_skills || []
  const transferable = analysis.transferable_skills || []

  // All missing-type items grouped for the missing column
  const missing = [...reqMissing, ...prefMissing, ...belowLevel, ...transferable]

  const matchedCount = analysis.matchedCount ?? matched.length
  const missingCount = analysis.missingCount ?? (reqMissing.length + belowLevel.length)
  const transferableCount = transferable.length

  const requiredMissingCount = analysis.statistics?.required_missing ?? reqMissing.length
  const preferredMissingCount = analysis.statistics?.preferred_missing ?? prefMissing.length
  const belowLevelCount = analysis.statistics?.below_level_count ?? belowLevel.length

  const scoreBreakdown = analysis.score_breakdown || null
  const scoreExplanation = analysis.score_explanation || null

  const gaugeTone = readinessScore >= 75 ? 'var(--green)' : readinessScore >= 50 ? 'var(--amber)' : 'var(--red)'
  const readinessLabel = readinessScore >= 75 ? 'Strong match for role' : readinessScore >= 50 ? 'Good foundation with key growth areas' : 'Actionable skill gaps identified'

  // Determine badge variant for a missing item
  const getGapBadge = (item) => {
    const gt = item.gap_type || item.status || 'missing'
    if (gt === 'transferable') return { cls: 'transferable-badge', label: 'Transferable' }
    if (gt === 'below_level') return { cls: 'below-level-badge', label: 'Below Level' }
    const imp = (item.importance || 'required').toLowerCase()
    if (imp === 'required') return { cls: 'missing-badge', label: 'Missing' }
    return { cls: 'preferred-badge', label: 'Preferred Missing' }
  }

  return (
    <div className="analysis-results-container">
      <div className="analysis-intro">
        <p className="eyebrow">Step 4 · Career Fit Analysis</p>
        <h1>Your Career Fit for {targetRole}</h1>
        <p>Here is how your verified skills and background align with industry requirements for <strong>{targetRole}</strong>.</p>
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
              <span>Fit Score</span>
            </div>
          </div>
          <p className="gauge-status-text">{readinessLabel}</p>
          {scoreExplanation && (
            <p className="gauge-disclaimer">
              <small>📊 Score estimated from resume evidence — not a hiring probability</small>
            </p>
          )}
        </div>

        <div className="stat-summary-grid">
          <div className="stat-card">
            <span className="stat-number stat-gap-score">{gapScore}%</span>
            <span className="stat-label">Skill Gap</span>
          </div>
          <div className="stat-card">
            <span className="stat-number stat-matched">{matchedCount}</span>
            <span className="stat-label">Skills Matched</span>
          </div>
          <div className="stat-card">
            <span className="stat-number stat-missing">{missingCount}</span>
            <span className="stat-label">Skills to Learn</span>
          </div>
          <div className="stat-card">
            <span className="stat-sublabel">
              <strong>{requiredMissingCount}</strong> Essential to Learn<br/>
              <strong>{preferredMissingCount}</strong> Recommended Bonus
              {belowLevelCount > 0 && <><br/><strong>{belowLevelCount}</strong> Deepen Experience</>}
              {transferableCount > 0 && <><br/><strong className="transferable-count">✦ {transferableCount}</strong> Transferable Skills</>}
            </span>
          </div>
        </div>
      </div>

      {/* Score Breakdown Panel (expandable) */}
      {scoreBreakdown && (
        <div className="score-breakdown-panel">
          <button
            type="button"
            className="breakdown-toggle"
            onClick={() => setShowBreakdown(v => !v)}
            aria-expanded={showBreakdown}
          >
            {showBreakdown ? '▲' : '▼'} How is this score calculated?
          </button>
          {showBreakdown && (
            <div className="breakdown-grid">
              <div className="breakdown-item">
                <span className="breakdown-label">Required Skill Coverage</span>
                <span className="breakdown-bar-wrap">
                  <span className="breakdown-bar" style={{ width: `${scoreBreakdown.required_skill_coverage}%` }} />
                </span>
                <span className="breakdown-value">{scoreBreakdown.required_skill_coverage}%</span>
                <span className="breakdown-weight">55% weight</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Proficiency Alignment</span>
                <span className="breakdown-bar-wrap">
                  <span className="breakdown-bar breakdown-bar--amber" style={{ width: `${scoreBreakdown.proficiency_alignment}%` }} />
                </span>
                <span className="breakdown-value">{scoreBreakdown.proficiency_alignment}%</span>
                <span className="breakdown-weight">25% weight</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Evidence Quality</span>
                <span className="breakdown-bar-wrap">
                  <span className="breakdown-bar breakdown-bar--purple" style={{ width: `${scoreBreakdown.evidence_quality}%` }} />
                </span>
                <span className="breakdown-value">{scoreBreakdown.evidence_quality}%</span>
                <span className="breakdown-weight">10% weight</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Preferred Skills Coverage</span>
                <span className="breakdown-bar-wrap">
                  <span className="breakdown-bar breakdown-bar--blue" style={{ width: `${scoreBreakdown.preferred_skill_coverage}%` }} />
                </span>
                <span className="breakdown-value">{scoreBreakdown.preferred_skill_coverage}%</span>
                <span className="breakdown-weight">10% weight</span>
              </div>
              {scoreBreakdown.transferable_credit > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-label">Transferable Skill Bonus</span>
                  <span className="breakdown-value breakdown-bonus">+{scoreBreakdown.transferable_credit} pts bonus</span>
                </div>
              )}
              {scoreExplanation && (
                <p className="breakdown-explanation">{scoreExplanation}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Filter Pill Switch with Shared Element Layout Morphing */}
      <div className="mobile-skill-tabs mobile-only" role="tablist" aria-label="Skill filter tabs">
        {[
          { key: 'all', label: `All Skills (${matchedCount + missing.length})` },
          { key: 'matched', label: `Matched (${matchedCount})` },
          { key: 'missing', label: `To Learn (${missing.length})` }
        ].map((tab) => {
          const isActive = mobileSkillFilter === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              className={`mobile-skill-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => setMobileSkillFilter(tab.key)}
              style={{ position: 'relative' }}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-skill-tab-indicator"
                  className="mobile-tab-active-indicator"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Skill columns */}
      <div className="skill-columns">
        {/* Matched Skills Column */}
        {(mobileSkillFilter === 'all' || mobileSkillFilter === 'matched') && (
          <section className="skill-column">
            <div className="skill-column__title">
              <span className="status-dot status-dot--matched" />
              <h2>Your Strengths ({matchedCount})</h2>
            </div>
            {matched.length > 0 ? (
              matched.map((item, idx) => {
                const profLevel = item.candidate_proficiency ?? null
                const profLabel = item.candidate_level || 'Intermediate'
                const evText = item.evidence_text || null
                const evStrength = item.evidence_strength || null
                return (
                  <div className="skill-row" key={item.skill_id || item.id || `${item.skill}-${idx}`}>
                    <div className="skill-row-left">
                      <strong>✓ {item.skill}</strong>
                      <span>
                        Your experience: <em>{profLabel}{profLevel !== null ? ` (${profLevel}/5)` : ''}</em>
                        {' · '}Required: {item.required_level || 'Intermediate'}
                      </span>
                      {evText && (
                        <p className="skill-evidence-text">
                          <span className={`evidence-strength-dot ev-${evStrength}`} />
                          {evText.length > 100 ? evText.slice(0, 100) + '…' : evText}
                        </p>
                      )}
                    </div>
                    <div className="skill-badge matched-badge">
                      Matched
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="skill-column__empty">No matched skills detected for this role yet.</p>
            )}
          </section>
        )}

        {/* Missing / Gap Skills Column */}
        {(mobileSkillFilter === 'all' || mobileSkillFilter === 'missing') && (
          <section className="skill-column">
            <div className="skill-column__title">
              <span className="status-dot status-dot--missing" />
              <h2>Skills to Learn ({missing.length})</h2>
            </div>
            {missing.length > 0 ? (
              missing.map((item, idx) => {
                const badge = getGapBadge(item)
                const imp = item.importance || 'Required'
                const isTransferable = (item.gap_type === 'transferable') || (item.status === 'Transferable Evidence')
                return (
                  <div className={`skill-row skill-row--missing${isTransferable ? ' skill-row--transferable' : ''}`} key={item.skill_id || item.id || `${item.skill}-${idx}`}>
                    <div className="skill-row-left">
                      <strong>
                        {isTransferable ? '✦' : '○'} {item.skill}
                      </strong>
                      {isTransferable ? (
                        <span className="transferable-info">
                          Transferable from <em>{item.transferable_from}</em> · Your background gives you a head start
                        </span>
                      ) : (
                        <span>
                          Role requires: {item.minimum_level || 'Intermediate'} proficiency
                        </span>
                      )}
                      <p className="skill-reason">{item.reason || `Key skill for ${targetRole}`}</p>
                    </div>
                    <div className="skill-badge-wrapper">
                      <span className={`importance-tag importance-tag--${imp.toLowerCase()}`}>
                        {imp === 'Required' ? 'Essential' : 'Recommended'}
                      </span>
                      <span className={badge.cls}>{isTransferable ? 'Transferable' : badge.label}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="skill-column__empty">Great news! You meet all listed requirements for this role.</p>
            )}
          </section>
        )}
      </div>

      {/* Roadmap & Interview CTA section */}
      <div className="roadmap-cta-banner">
        <div className="roadmap-cta-content">
          <h3>Ready to bridge your skill gap for {targetRole}?</h3>
          <p>Practice a realistic technical mock interview tailored to your resume, or follow step-by-step roadmaps with vetted resources to master these skills.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {onNavigateToInterview && (
            <button
              type="button"
              className="primary-button interview-button"
              onClick={() => onNavigateToInterview(targetRole)}
            >
              Practice Technical Interview
              <span aria-hidden="true">→</span>
            </button>
          )}
          <button
            type="button"
            className="secondary-button roadmap-button"
            onClick={() => onNavigateToRoadmaps(missing, targetRole)}
          >
            View Recommended Roadmaps
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* Floating Sticky Mobile Action Bar */}
      <div className="mobile-sticky-action-bar mobile-only">
        {onNavigateToInterview && (
          <button
            type="button"
            className="primary-button full-width-mobile-btn"
            onClick={() => onNavigateToInterview(targetRole)}
          >
            Practice Technical Interview
            <span aria-hidden="true">→</span>
          </button>
        )}
        <button
          type="button"
          className="secondary-button full-width-mobile-btn"
          onClick={() => onNavigateToRoadmaps(missing, targetRole)}
        >
          View Recommended Roadmaps
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}
