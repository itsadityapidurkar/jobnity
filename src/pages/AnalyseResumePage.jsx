import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackgroundLayout from '../components/BackgroundLayout'
import Navigation from '../components/Navigation'
import Toast from '../components/Toast'
import ResumeUploadStep from '../components/AnalyseResume/ResumeUploadStep'
import ResumeParsingStep from '../components/AnalyseResume/ResumeParsingStep'
import ResumeReviewStep from '../components/AnalyseResume/ResumeReviewStep'
import RoleSelectionStep from '../components/AnalyseResume/RoleSelectionStep'
import SkillGapAnalysisStep from '../components/AnalyseResume/SkillGapAnalysisStep'
import { apiClient } from '../services/apiClient'
import uploadBackground from '../assets/resume-upload-hero.png'

export default function AnalyseResumePage() {
  const navigate = useNavigate()
  
  // Logical states: 'upload' | 'parsing' | 'review' | 'role_select' | 'analysis'
  const [step, setStep] = useState('upload')
  const [rawProfile, setRawProfile] = useState(null)
  const [confirmedProfile, setConfirmedProfile] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // Helper to convert backend profile to frontend UI component schema
  function formatProfileForUI(apiRes) {
    const p = apiRes.profile || apiRes
    return {
      resume_id: apiRes.resume_id || p.resume_id,
      id: p.id || p.profile_id,
      personalInfo: {
        name: p.name || (p.personalInfo && p.personalInfo.name) || '',
        email: p.email || (p.personalInfo && p.personalInfo.email) || '',
        phone: p.phone || (p.personalInfo && p.personalInfo.phone) || ''
      },
      skills: p.skills || [],
      education: p.education || [],
      experience: p.experience || [],
      projects: p.projects || [],
      certifications: p.certifications || []
    }
  }

  // Step 1: User picks or drops file -> upload to backend API
  async function handleStartAnalysis(file) {
    setStep('parsing')
    try {
      const response = await apiClient.uploadResume(file)
      const parsed = formatProfileForUI(response)
      setRawProfile(parsed)
    } catch (err) {
      setStep('upload')
      setToastMessage(err.message || 'Failed to extract profile from resume.')
    }
  }

  // Handle sample selection shortcut
  async function handleSampleSelect(roleName) {
    setToastMessage(`Sample selection relies on uploading a real PDF/DOCX file. Please upload your resume above.`)
  }

  // Step 2 finish -> move to Review
  function handleParsingComplete() {
    setStep('review')
  }

  // Step 3 finish -> Profile confirmed by user! Save to backend
  async function handleConfirmProfile(editedProfile) {
    setConfirmedProfile(editedProfile)
    if (!editedProfile.resume_id) {
      setToastMessage('Missing resume session ID. Please re-upload your resume.')
      return
    }

    try {
      await apiClient.updateResume(editedProfile.resume_id, {
        name: editedProfile.personalInfo?.name,
        email: editedProfile.personalInfo?.email,
        phone: editedProfile.personalInfo?.phone,
        skills: editedProfile.skills,
        education: editedProfile.education,
        experience: editedProfile.experience,
        projects: editedProfile.projects,
        certifications: editedProfile.certifications
      })
      setStep('role_select')
    } catch (err) {
      setToastMessage(err.message || 'Failed to save updated candidate profile.')
    }
  }

  // Step 4 finish -> Target role selected, calculate skill gap via API
  async function handlePerformAnalysis() {
    if (!selectedRole || !confirmedProfile || !confirmedProfile.resume_id) {
      setToastMessage('Please select a target role.')
      return
    }

    try {
      const result = await apiClient.analyzeSkillGap(confirmedProfile.resume_id, selectedRole)
      setAnalysisResult(result)
      setStep('analysis')
    } catch (err) {
      setToastMessage(err.message || 'Failed to calculate skill gap analysis.')
    }
  }

  // CTA to Roadmaps
  function handleNavigateToRoadmaps(missingSkills, targetRole) {
    const skillList = missingSkills.map(s => s.skill).join(',')
    navigate(`/roadmaps?role=${encodeURIComponent(targetRole)}&skills=${encodeURIComponent(skillList)}`)
  }

  return (
    <BackgroundLayout backgroundImage={uploadBackground} className="upload-layout">
      <Navigation />

      <main className="analysis-main">
        {/* Step Indicator Tabs / Progress Header */}
        <div className="progressive-workflow-nav" aria-label="Progressive workflow steps">
          <button 
            type="button" 
            className={`workflow-step-btn ${step === 'upload' ? 'is-active' : ''} ${step !== 'upload' ? 'is-complete' : ''}`}
            onClick={() => setStep('upload')}
          >
            <span className="step-num">1</span>
            <span>Upload Resume</span>
          </button>
          
          <button 
            type="button" 
            className={`workflow-step-btn ${step === 'review' ? 'is-active' : ''} ${step === 'role_select' || step === 'analysis' ? 'is-complete' : ''}`}
            disabled={!rawProfile && step === 'upload'}
            onClick={() => rawProfile && setStep('review')}
          >
            <span className="step-num">2</span>
            <span>Review Profile</span>
          </button>

          <button 
            type="button" 
            className={`workflow-step-btn ${step === 'role_select' ? 'is-active' : ''} ${step === 'analysis' ? 'is-complete' : ''}`}
            disabled={!confirmedProfile}
            onClick={() => confirmedProfile && setStep('role_select')}
          >
            <span className="step-num">3</span>
            <span>Target Role</span>
          </button>

          <button 
            type="button" 
            className={`workflow-step-btn ${step === 'analysis' ? 'is-active' : ''}`}
            disabled={!analysisResult}
            onClick={() => analysisResult && setStep('analysis')}
          >
            <span className="step-num">4</span>
            <span>Skill Gap Analysis</span>
          </button>
        </div>

        {/* Step views */}
        {step === 'upload' && (
          <ResumeUploadStep 
            onAnalyze={handleStartAnalysis} 
            onSampleSelect={handleSampleSelect}
          />
        )}

        {step === 'parsing' && (
          <ResumeParsingStep 
            onComplete={handleParsingComplete} 
          />
        )}

        {step === 'review' && rawProfile && (
          <ResumeReviewStep 
            profile={rawProfile} 
            onConfirm={handleConfirmProfile} 
          />
        )}

        {step === 'role_select' && (
          <RoleSelectionStep 
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            onProceed={handlePerformAnalysis}
          />
        )}

        {step === 'analysis' && analysisResult && (
          <SkillGapAnalysisStep 
            analysis={analysisResult} 
            onNavigateToRoadmaps={handleNavigateToRoadmaps}
          />
        )}
      </main>

      <Toast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </BackgroundLayout>
  )
}
