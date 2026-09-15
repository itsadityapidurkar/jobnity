import { useEffect, useMemo, useState } from 'react'
import { getRoleSkills } from '../../services/dataService'
import { apiClient } from '../../services/apiClient'

export default function RoleRoadmapView({ roleTitle, onSelectSkill, onBack }) {
  const [roleSkills, setRoleSkills] = useState(() => getRoleSkills(roleTitle))

  useEffect(() => {
    let isMounted = true
    apiClient.getRoleSkills(roleTitle).then(data => {
      if (isMounted && data) {
        const skillsList = data.skills || data
        if (Array.isArray(skillsList) && skillsList.length > 0) {
          setRoleSkills(skillsList)
        }
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [roleTitle])

  const requiredSkills = useMemo(() => roleSkills.filter(s => (s.importance || '').toLowerCase() === 'required'), [roleSkills])
  const preferredSkills = useMemo(() => roleSkills.filter(s => (s.importance || '').toLowerCase() === 'preferred'), [roleSkills])

  return (
    <div className="role-roadmap-view">
      <div className="view-header">
        <button type="button" className="back-link-btn" onClick={onBack}>
          ← Back to Explorer
        </button>

        <div className="role-header-meta">
          <p className="eyebrow">Career Roadmap</p>
          <h1>{roleTitle} Roadmap</h1>
          <p>Complete skill roadmap derived from industry standard datasets for <strong>{roleTitle}</strong>. Click any skill to inspect learning paths &amp; resources.</p>
        </div>
      </div>

      {/* Required / Core Skills Section */}
      <section className="role-skills-group">
        <div className="group-title">
          <span className="group-dot group-dot--required" />
          <h2>Core &amp; Required Skills ({requiredSkills.length})</h2>
        </div>

        <div className="skills-interactive-grid">
          {requiredSkills.map(item => (
            <div 
              key={item.skill_id || item.skill} 
              className="skill-interactive-card"
              onClick={() => onSelectSkill(item.skill)}
            >
              <div className="card-top">
                <span className="skill-name">{item.skill}</span>
                <span className="badge-required">Required</span>
              </div>
              <div className="card-bottom">
                <span className="skill-cat">{item.skill_category || 'Technical'}</span>
                <span className="skill-level">Min Level: {item.minimum_level || 'Intermediate'}</span>
              </div>
              <div className="card-action">
                <span>View Learning Resources →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preferred Skills Section */}
      {preferredSkills.length > 0 && (
        <section className="role-skills-group">
          <div className="group-title">
            <span className="group-dot group-dot--preferred" />
            <h2>Preferred &amp; Bonus Skills ({preferredSkills.length})</h2>
          </div>

          <div className="skills-interactive-grid">
            {preferredSkills.map(item => (
              <div 
                key={item.skill_id || item.skill} 
                className="skill-interactive-card skill-card--preferred"
                onClick={() => onSelectSkill(item.skill)}
              >
                <div className="card-top">
                  <span className="skill-name">{item.skill}</span>
                  <span className="badge-preferred">Preferred</span>
                </div>
                <div className="card-bottom">
                  <span className="skill-cat">{item.skill_category || 'Technical'}</span>
                  <span className="skill-level">Min Level: {item.minimum_level || 'Intermediate'}</span>
                </div>
                <div className="card-action">
                  <span>View Learning Resources →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
