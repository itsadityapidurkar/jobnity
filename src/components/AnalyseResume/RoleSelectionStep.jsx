import { useEffect, useMemo, useState } from 'react'
import { getJobRoles } from '../../services/dataService'
import { apiClient } from '../../services/apiClient'

export default function RoleSelectionStep({ selectedRole, onSelectRole, onProceed }) {
  const [allRoles, setAllRoles] = useState(() => getJobRoles())
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

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
        <p className="eyebrow">Step 4 - Target Role</p>
        <h1>Which role are you preparing for?</h1>
        <p>Select your target job role from our standardized dataset to perform an accurate skill-gap analysis.</p>
      </div>

      <div className="role-selector-custom">
        <label htmlFor="role-dropdown-trigger" className="field-label">Target Job Role</label>
        
        <div className="role-dropdown-container">
          <button 
            id="role-dropdown-trigger"
            type="button" 
            className="role-dropdown-trigger"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            <span>{selectedRole || 'Select a target role...'}</span>
            <span className="dropdown-caret">▼</span>
          </button>

          {isOpen && (
            <div className="role-dropdown-menu">
              <div className="role-search-box">
                <input 
                  type="text"
                  placeholder="Search 50+ tech roles (e.g. Software Developer, Data Scientist)..."
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
        <div className="selected-role-preview">
          <h3>Selected Role: <span>{currentRoleObj.job_role}</span></h3>
          <p>{currentRoleObj.role_description}</p>
          <div className="role-meta-pills">
            <span className="meta-pill">Category: {currentRoleObj.category}</span>
            <span className="meta-pill">Level: {currentRoleObj.experience_level}</span>
          </div>
        </div>
      )}

      {selectedRole && (
        <button 
          type="button" 
          className="primary-button panel-button confirm-role-btn"
          onClick={onProceed}
        >
          Perform Skill Gap Analysis
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  )
}
