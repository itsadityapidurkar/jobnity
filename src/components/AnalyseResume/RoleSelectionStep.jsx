import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { getJobRoles } from '../../services/dataService'
import { apiClient } from '../../services/apiClient'

export default function RoleSelectionStep({ 
  selectedRole, 
  onSelectRole, 
  jobDescription, 
  onJobDescriptionChange, 
  onProceed,
  profile 
}) {
  const [allRoles, setAllRoles] = useState(() => getJobRoles())
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  
  // AI Eligible Roles recommendation state
  const [recommendedRoles, setRecommendedRoles] = useState([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true)
  const [recommendationError, setRecommendationError] = useState(null)
  const [engineUsed, setEngineUsed] = useState('qwen2.5')

  // Load catalog roles
  useEffect(() => {
    let isMounted = true
    apiClient.getRoles(searchTerm).then(res => {
      if (isMounted && res) {
        const rolesList = res.roles || res
        if (Array.isArray(rolesList) && rolesList.length > 0) {
          setAllRoles(rolesList)
        }
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [searchTerm])

  // Fetch AI recommended roles grounded in the verified profile
  useEffect(() => {
    let isMounted = true
    setIsLoadingRecommendations(true)
    setRecommendationError(null)

    // Build payload from profile
    const skills = profile?.skills || []
    const resumeId = profile?.resume_id || sessionStorage.getItem('jobnity_resume_id')
    const candidateId = profile?.id || sessionStorage.getItem('jobnity_profile_id')

    apiClient.getRecommendedRoles({
      resume_id: resumeId,
      candidate_id: candidateId,
      candidate_profile: profile,
      skills: skills,
      limit: 6
    }).then(res => {
      if (!isMounted) return
      if (res && Array.isArray(res.recommendations) && res.recommendations.length > 0) {
        setRecommendedRoles(res.recommendations)
        setEngineUsed(res.engine || 'qwen2.5')
        // If no role is selected yet, pre-select the #1 top match
        if (!selectedRole && res.recommendations[0]?.job_role) {
          onSelectRole(res.recommendations[0].job_role)
        }
      } else {
        setRecommendedRoles([])
      }
      setIsLoadingRecommendations(false)
    }).catch(err => {
      if (!isMounted) return
      console.warn('AI role recommendation fallback triggered:', err)
      setRecommendationError(err.message || 'Could not load AI recommendations')
      setIsLoadingRecommendations(false)
    })

    return () => { isMounted = false }
  }, [profile])

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return allRoles
    return allRoles.filter(r => 
      r.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.category && r.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [allRoles, searchTerm])

  const currentRoleObj = useMemo(() => {
    return allRoles.find(r => r.job_role === selectedRole)
  }, [allRoles, selectedRole])

  function handleSelect(roleTitle) {
    onSelectRole(roleTitle)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="resume-panel role-selection-panel">
      <div className="panel-heading">
        <p className="eyebrow">Step 3 · Target Role Selection</p>
        <h1>Select Your Target Career Role</h1>
        <p>Based on your verified skills and experience, here are the roles where you have the strongest match. Choose a recommended position or search all available roles.</p>
      </div>

      {/* AI Eligible Roles Section */}
      <div className="ai-eligible-roles-section">
        <div className="section-title-row">
          <div className="section-title-left">
            <span className="ai-sparkle-icon" aria-hidden="true">✨</span>
            <h2 className="section-subheading">Recommended Roles for You</h2>
            <span className="ai-engine-badge">
              AI Recommended
            </span>
          </div>
          <p className="section-hint">
            Matched directly using your skills, projects, and work history.
          </p>
        </div>

        {isLoadingRecommendations ? (
          <div className="eligible-roles-loading-card">
            <div className="loading-spinner-ring" />
            <div className="loading-text-block">
              <span className="loading-title">Finding your best-fit career matches...</span>
              <span className="loading-subtitle">Comparing your skills, projects, and work history against industry roles</span>
            </div>
          </div>
        ) : recommendedRoles.length > 0 ? (
          <div className="eligible-roles-grid" role="radiogroup" aria-label="Eligible job role recommendations">
            {recommendedRoles.map((role) => {
              const isSelected = selectedRole === role.job_role
              const scoreTierClass = role.match_score >= 85 ? 'tier-high' : role.match_score >= 70 ? 'tier-solid' : 'tier-stretch'

              return (
                <motion.div
                  layout
                  key={role.job_role}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={`eligible-role-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(role.job_role)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelect(role.job_role)
                    }
                  }}
                  style={{ position: 'relative' }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="selected-role-active-glow"
                      className="role-card-active-glow-border"
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    />
                  )}

                  <div className="role-card-top">
                    <div className="role-card-header-left">
                      <h3 className="role-card-title">{role.job_role}</h3>
                      <div className="role-category-label">{role.category || 'Tech'} · {role.fit_tier}</div>
                    </div>
                    <div className={`fit-score-badge ${scoreTierClass}`}>
                      <span className="score-number">{role.match_score}%</span>
                      <span className="score-label">Fit</span>
                    </div>
                  </div>

                  <p className="role-card-rationale">{role.rationale}</p>

                  {role.matching_skills && role.matching_skills.length > 0 && (
                    <div className="role-skills-preview">
                      <span className="skills-row-label">Your Strengths:</span>
                      <div className="matching-pills-wrap">
                        {role.matching_skills.slice(0, 4).map((sk, idx) => (
                          <span key={idx} className="skill-pill-match">{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {role.growth_skills && role.growth_skills.length > 0 && (
                    <div className="role-skills-preview growth-row">
                      <span className="skills-row-label">Skills to Learn:</span>
                      <div className="growth-pills-wrap">
                        {role.growth_skills.slice(0, 2).map((sk, idx) => (
                          <span key={idx} className="skill-pill-growth">+{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="card-select-footer">
                    {isSelected ? (
                      <motion.span 
                        layoutId="selected-role-active-badge"
                        className="select-radio-indicator is-selected"
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      >
                        ✓ Selected Role
                      </motion.span>
                    ) : (
                      <span className="select-radio-indicator">
                        Select this role
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="eligible-roles-empty">
            <p>Could not load recommendations at this moment. You can choose any role from the catalog below.</p>
          </div>
        )}
      </div>

      {/* Catalog Search & Dropdown (For custom or non-recommended roles) */}
      <div className="catalog-search-section">
        <div className="catalog-header">
          <label htmlFor="role-dropdown-trigger" className="field-label">
            Or Choose from the Full Role Catalog (50+ Positions)
          </label>
          <span className="catalog-hint">Explore alternative titles, stretch roles, or specialized domains</span>
        </div>
        
        <div className="role-dropdown-container">
          <button 
            id="role-dropdown-trigger"
            type="button" 
            className="role-dropdown-trigger"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            <span>{selectedRole ? `Selected: ${selectedRole}` : 'Search all available roles...'}</span>
            <span className="dropdown-caret">▼</span>
          </button>

          {isOpen && (
            <div className="role-dropdown-menu">
              <div className="role-search-box">
                <input 
                  type="text"
                  placeholder="Search 50+ roles (e.g. Cloud Architect, Cybersecurity Analyst, Data Scientist)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="role-options-list">
                {filteredRoles.length > 0 ? (
                  filteredRoles.map(role => (
                    <button
                      key={role.role_id || role.job_role}
                      type="button"
                      className={`role-option-item ${role.job_role === selectedRole ? 'is-selected' : ''}`}
                      onClick={() => handleSelect(role.job_role)}
                    >
                      <div className="role-option-title">{role.job_role}</div>
                      <div className="role-option-category">{role.category} · {role.experience_level}</div>
                    </button>
                  ))
                ) : (
                  <div className="no-roles-found">No matching roles found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {currentRoleObj && (
        <motion.div 
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="selected-role-preview"
        >
          <div className="preview-top">
            <span className="preview-tag">Confirmed Target</span>
            <h3>{currentRoleObj.job_role}</h3>
          </div>
          <p>{currentRoleObj.role_description}</p>
          <div className="role-meta-pills">
            <span className="meta-pill">Category: {currentRoleObj.category}</span>
            <span className="meta-pill">Level: {currentRoleObj.experience_level}</span>
          </div>
        </motion.div>
      )}

      {/* Optional Job Description text */}
      <div className="jd-input-container">
        <div className="jd-header">
          <label htmlFor="jd-textarea" className="field-label">
            Target Job Description <span className="optional-badge">Optional</span>
          </label>
          <span className="jd-hint">Paste an employer posting to tailor skill requirements to a specific opening</span>
        </div>
        <textarea
          id="jd-textarea"
          className="jd-textarea"
          placeholder="Paste job description or requirements here... (e.g. 'Looking for a Senior Python Developer with Docker, AWS, FastAPI, PostgreSQL, and Unit Testing experience')"
          value={jobDescription || ''}
          onChange={(e) => onJobDescriptionChange && onJobDescriptionChange(e.target.value)}
          rows={3}
        />
        {jobDescription && jobDescription.trim().length > 0 && (
          <div className="jd-active-indicator">
            <span>✨ Custom Job Description active ({jobDescription.trim().length} characters) — Skills will be extracted directly from this posting.</span>
          </div>
        )}
      </div>

      {selectedRole && (
        <button 
          type="button" 
          className="primary-button panel-button confirm-role-btn"
          onClick={onProceed}
        >
          Analyse Skill Match for {selectedRole}
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  )
}
