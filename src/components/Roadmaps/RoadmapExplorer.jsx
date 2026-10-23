import { useMemo, useState } from 'react'
import { getJobRoles, getRoleSkills } from '../../services/dataService'
import { SKILLS_TAXONOMY } from '../../data/jobnityData'

export default function RoadmapExplorer({ onSelectRole, onSelectSkill, recommendedRole, recommendedSkills }) {
  // mode: 'role' | 'skill'
  const [mode, setMode] = useState(recommendedRole ? 'role' : 'role')
  const [searchTerm, setSearchTerm] = useState('')

  const allRoles = useMemo(() => getJobRoles(), [])
  const allSkills = useMemo(() => SKILLS_TAXONOMY, [])

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return allRoles
    const q = searchTerm.toLowerCase()
    return allRoles.filter(r => r.job_role.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
  }, [allRoles, searchTerm])

  const filteredSkills = useMemo(() => {
    if (!searchTerm) return allSkills
    const q = searchTerm.toLowerCase()
    return allSkills.filter(s => s.skill.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q)))
  }, [allSkills, searchTerm])

  return (
    <div className="roadmap-explorer-container">
      <div className="explorer-header">
        <p className="eyebrow">Structured Learning Paths</p>
        <h1>Career &amp; Skill Roadmaps</h1>
        <p>Follow clear, milestone-driven learning paths with vetted courses, documentation, and hands-on projects for 50+ roles and in-demand skills.</p>
      </div>

      {/* Recommended skills banner if coming from Skill Gap Analysis */}
      {recommendedSkills && recommendedSkills.length > 0 && (
        <div className="recommended-skills-banner">
          <div className="banner-title">
            <span className="banner-icon">🎯</span>
            <strong>Recommended for {recommendedRole || 'Your Target Role'}</strong>
          </div>
          <p>Select any skill below to view curated tutorials, courses, and project milestones:</p>
          <div className="recommended-chips">
            {recommendedSkills.map(sk => (
              <button 
                key={sk} 
                type="button" 
                className="recommended-chip"
                onClick={() => onSelectSkill(sk)}
              >
                {sk} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode Selector & Search Bar */}
      <div className="explorer-controls">
        <div className="mode-toggle-group">
          <span className="mode-label">Browse by:</span>
          <div className="mode-buttons">
            <button 
              type="button" 
              className={`mode-btn ${mode === 'role' ? 'is-active' : ''}`}
              onClick={() => { setMode('role'); setSearchTerm('') }}
            >
              Career Role
            </button>
            <button 
              type="button" 
              className={`mode-btn ${mode === 'skill' ? 'is-active' : ''}`}
              onClick={() => { setMode('skill'); setSearchTerm('') }}
            >
              Individual Skill
            </button>
          </div>
        </div>

        <div className="search-bar-wrapper">
          <input 
            type="text" 
            className="search-input"
            placeholder={mode === 'role' ? 'Search 50+ job roles (e.g. Software Developer, Data Scientist)...' : 'Search skills (e.g. Python, Docker, SQL, Git)...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
      </div>

      {/* Grid listing */}
      {mode === 'role' ? (
        <div className="explorer-grid">
          {filteredRoles.map(role => (
            <div 
              key={role.role_id || role.job_role}
              className="explorer-card role-card"
              onClick={() => onSelectRole(role.job_role)}
            >
              <div className="card-badge">{role.category}</div>
              <h3 className="card-title">{role.job_role}</h3>
              <p className="card-description">{role.role_description}</p>
              <div className="card-footer">
                <span>{role.experience_level}</span>
                <span className="card-link">View Role Roadmap →</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="explorer-grid">
          {filteredSkills.map(sk => (
            <div 
              key={sk.skill_id || sk.skill}
              className="explorer-card skill-card"
              onClick={() => onSelectSkill(sk.skill)}
            >
              <div className="card-badge">{sk.category || 'Technical Skill'}</div>
              <h3 className="card-title">{sk.skill}</h3>
              <p className="card-description">{sk.description || `Learn ${sk.skill} with tutorials, documentation, and roadmap guides.`}</p>
              <div className="card-footer">
                <span>{sk.skill_type || 'Skill'}</span>
                <span className="card-link">View Resources →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
