import { useState } from 'react'

export default function ResumeReviewStep({ profile, onConfirm }) {
  const [candidate, setCandidate] = useState(profile)
  const [newSkill, setNewSkill] = useState('')
  const [duplicateSkillAlert, setDuplicateSkillAlert] = useState(false)

  // Personal Info handlers
  function handlePersonalChange(field, val) {
    setCandidate(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: val }
    }))
  }

  // Skill handlers
  function handleAddSkill(e) {
    e.preventDefault()
    const trimmed = newSkill.trim()
    if (!trimmed) return
    const exists = candidate.skills.some(s => s.toLowerCase() === trimmed.toLowerCase())
    if (exists) {
      setDuplicateSkillAlert(true)
      setTimeout(() => setDuplicateSkillAlert(false), 1200)
      return
    }
    setCandidate(prev => ({
      ...prev,
      skills: [...prev.skills, trimmed]
    }))
    setNewSkill('')
  }

  function handleRemoveSkill(indexToRemove) {
    setCandidate(prev => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== indexToRemove)
    }))
  }

  function handleSkillChange(index, val) {
    setCandidate(prev => ({
      ...prev,
      skills: prev.skills.map((s, idx) => idx === index ? val : s)
    }))
  }

  // Education handlers
  function handleEducationChange(index, field, val) {
    setCandidate(prev => ({
      ...prev,
      education: prev.education.map((edu, idx) => idx === index ? { ...edu, [field]: val } : edu)
    }))
  }

  function handleAddEducation() {
    setCandidate(prev => ({
      ...prev,
      education: [...prev.education, { degree: 'Degree Name', institution: 'University / College', details: '' }]
    }))
  }

  function handleRemoveEducation(index) {
    setCandidate(prev => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== index)
    }))
  }

  // Experience handlers
  function handleExperienceChange(index, field, val) {
    setCandidate(prev => ({
      ...prev,
      experience: prev.experience.map((exp, idx) => idx === index ? { ...exp, [field]: val } : exp)
    }))
  }

  function handleAddExperience() {
    setCandidate(prev => ({
      ...prev,
      experience: [...prev.experience, { company: 'Company Name', role: 'Role Title', duration: 'Dates', description: '' }]
    }))
  }

  function handleRemoveExperience(index) {
    setCandidate(prev => ({
      ...prev,
      experience: prev.experience.filter((_, idx) => idx !== index)
    }))
  }

  // Project handlers
  function handleProjectChange(index, field, val) {
    setCandidate(prev => ({
      ...prev,
      projects: prev.projects.map((proj, idx) => idx === index ? { ...proj, [field]: val } : proj)
    }))
  }

  function handleAddProject() {
    setCandidate(prev => ({
      ...prev,
      projects: [...prev.projects, { name: 'New Project', description: '', technologies: '' }]
    }))
  }

  function handleRemoveProject(index) {
    setCandidate(prev => ({
      ...prev,
      projects: prev.projects.filter((_, idx) => idx !== index)
    }))
  }

  // Certification handlers
  const [mobileActiveTab, setMobileActiveTab] = useState('all')

  function handleCertChange(index, field, val) {
    setCandidate(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, idx) => idx === index ? { ...cert, [field]: val } : cert)
    }))
  }

  function handleAddCert() {
    setCandidate(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: 'Certification Title', issuer: 'Issuer Organization' }]
    }))
  }

  function handleRemoveCert(index) {
    setCandidate(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, idx) => idx !== index)
    }))
  }

  return (
    <div className="resume-panel resume-panel--review">
      <div className="panel-heading">
        <p className="eyebrow">Candidate Profile Review</p>
        <h1>Review &amp; Edit Extracted Details</h1>
        <p>Verify and correct the parsed information. This edited profile is the final source of truth for skill-gap analysis.</p>

        {/* Mobile Tab Segmented Filter Switch */}
        <div className="mobile-review-tabs mobile-only" role="tablist" aria-label="Review sections">
          <button 
            type="button" 
            className={`mobile-review-tab ${mobileActiveTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setMobileActiveTab('all')}
          >
            All Sections
          </button>
          <button 
            type="button" 
            className={`mobile-review-tab ${mobileActiveTab === 'contact' ? 'is-active' : ''}`}
            onClick={() => setMobileActiveTab('contact')}
          >
            Contact
          </button>
          <button 
            type="button" 
            className={`mobile-review-tab ${mobileActiveTab === 'skills' ? 'is-active' : ''}`}
            onClick={() => setMobileActiveTab('skills')}
          >
            Skills ({candidate.skills.length})
          </button>
          <button 
            type="button" 
            className={`mobile-review-tab ${mobileActiveTab === 'experience' ? 'is-active' : ''}`}
            onClick={() => setMobileActiveTab('experience')}
          >
            Experience &amp; Edu
          </button>
        </div>
      </div>

      {/* 1. Personal Information */}
      {(mobileActiveTab === 'all' || mobileActiveTab === 'contact') && (
        <section className="review-section">
          <div className="review-section-header">
            <h2>1. Personal Information</h2>
            <span>Candidate contact details</span>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label htmlFor="pi-name">Name</label>
              <input id="pi-name" value={candidate.personalInfo?.name || ''} onChange={(e) => handlePersonalChange('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="pi-email">Email</label>
              <input id="pi-email" type="email" value={candidate.personalInfo?.email || ''} onChange={(e) => handlePersonalChange('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="pi-phone">Phone</label>
              <input id="pi-phone" value={candidate.personalInfo?.phone || ''} onChange={(e) => handlePersonalChange('phone', e.target.value)} />
            </div>
          </div>
        </section>
      )}

      {/* 2. Skills */}
      {(mobileActiveTab === 'all' || mobileActiveTab === 'skills') && (
        <section className="review-section">
          <div className="review-section-header">
            <h2>2. Skills</h2>
            <span>Extracted skills (Add, remove, or edit)</span>
          </div>

          <div className="skill-chips-container">
            {candidate.skills.map((skill, index) => (
              <div className="skill-chip-editable" key={`${skill}-${index}`}>
                <input 
                  value={skill} 
                  onChange={(e) => handleSkillChange(index, e.target.value)} 
                  aria-label={`Edit skill ${skill}`}
                />
                <button 
                  type="button" 
                  className="skill-remove-btn" 
                  onClick={() => handleRemoveSkill(index)} 
                  aria-label={`Remove skill ${skill}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <form className="add-skill-bar" onSubmit={handleAddSkill}>
            <input 
              type="text"
              className={duplicateSkillAlert ? 'is-shaking' : ''}
              placeholder="Enter skill to add (e.g. Docker, REST APIs)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <button type="submit" className="add-btn-small">
              + Add Skill
            </button>
          </form>
          {duplicateSkillAlert && <p className="field-hint-error">That skill is already in your profile list.</p>}
        </section>
      )}

      {/* 3. Education */}
      {(mobileActiveTab === 'all' || mobileActiveTab === 'experience') && (
        <section className="review-section">
          <div className="review-section-header">
            <h2>3. Education</h2>
            <button type="button" className="add-link-btn" onClick={handleAddEducation}>+ Add Education</button>
          </div>
          {(candidate.education || []).map((edu, idx) => (
            <div className="card-item-editable" key={idx}>
              <div className="card-item-row">
                <input className="input-title" placeholder="Degree" value={edu.degree || ''} onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)} />
                <input className="input-subtitle" placeholder="College / University" value={edu.institution || ''} onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)} />
                <button type="button" className="delete-card-btn" onClick={() => handleRemoveEducation(idx)}>Delete</button>
              </div>
              <textarea className="input-desc" placeholder="Additional details..." value={edu.details || ''} onChange={(e) => handleEducationChange(idx, 'details', e.target.value)} rows="2" />
            </div>
          ))}
        </section>
      )}

      {/* 4. Experience */}
      {(mobileActiveTab === 'all' || mobileActiveTab === 'experience') && (
        <section className="review-section">
          <div className="review-section-header">
            <h2>4. Experience</h2>
            <button type="button" className="add-link-btn" onClick={handleAddExperience}>+ Add Experience</button>
          </div>
          {(candidate.experience || []).map((exp, idx) => (
            <div className="card-item-editable" key={idx}>
              <div className="card-item-row">
                <input className="input-title" placeholder="Role" value={exp.role || ''} onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)} />
                <input className="input-subtitle" placeholder="Company" value={exp.company || ''} onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)} />
                <input className="input-dates" placeholder="Duration" value={exp.duration || ''} onChange={(e) => handleExperienceChange(idx, 'duration', e.target.value)} />
                <button type="button" className="delete-card-btn" onClick={() => handleRemoveExperience(idx)}>Delete</button>
              </div>
              <textarea className="input-desc" placeholder="Role description & key achievements..." value={exp.description || ''} onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)} rows="2" />
            </div>
          ))}
        </section>
      )}

      {/* 5. Projects */}
      {(mobileActiveTab === 'all' || mobileActiveTab === 'experience') && (
        <section className="review-section">
          <div className="review-section-header">
            <h2>5. Projects</h2>
            <button type="button" className="add-link-btn" onClick={handleAddProject}>+ Add Project</button>
          </div>
          {(candidate.projects || []).map((proj, idx) => (
            <div className="card-item-editable" key={idx}>
              <div className="card-item-row">
                <input className="input-title" placeholder="Project Name" value={proj.name || ''} onChange={(e) => handleProjectChange(idx, 'name', e.target.value)} />
                <input className="input-subtitle" placeholder="Technologies used" value={proj.technologies || ''} onChange={(e) => handleProjectChange(idx, 'technologies', e.target.value)} />
                <button type="button" className="delete-card-btn" onClick={() => handleRemoveProject(idx)}>Delete</button>
              </div>
              <textarea className="input-desc" placeholder="Project description..." value={proj.description || ''} onChange={(e) => handleProjectChange(idx, 'description', e.target.value)} rows="2" />
            </div>
          ))}
        </section>
      )}

      {/* 6. Certifications */}
      {(mobileActiveTab === 'all' || mobileActiveTab === 'experience') && (
        <section className="review-section">
          <div className="review-section-header">
            <h2>6. Certifications</h2>
            <button type="button" className="add-link-btn" onClick={handleAddCert}>+ Add Certification</button>
          </div>
          {(candidate.certifications || []).map((cert, idx) => (
            <div className="card-item-editable" key={idx}>
              <div className="card-item-row">
                <input className="input-title" placeholder="Certification Name" value={cert.name || ''} onChange={(e) => handleCertChange(idx, 'name', e.target.value)} />
                <input className="input-subtitle" placeholder="Issuer" value={cert.issuer || ''} onChange={(e) => handleCertChange(idx, 'issuer', e.target.value)} />
                <button type="button" className="delete-card-btn" onClick={() => handleRemoveCert(idx)}>Delete</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Primary Action Button */}
      <button 
        type="button" 
        className="primary-button panel-button confirm-profile-btn"
        onClick={() => onConfirm(candidate)}
      >
        Confirm Profile &amp; Select Target Role
        <span aria-hidden="true">→</span>
      </button>

      {/* Floating Sticky Mobile Action Bar */}
      <div className="mobile-sticky-action-bar mobile-only">
        <button 
          type="button" 
          className="primary-button full-width-mobile-btn"
          onClick={() => onConfirm(candidate)}
        >
          Confirm Profile &amp; Continue
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}

