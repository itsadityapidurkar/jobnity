import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BackgroundLayout from '../components/BackgroundLayout'
import Navigation from '../components/Navigation'
import Toast from '../components/Toast'
import ResumeUploadStep from '../components/AnalyseResume/ResumeUploadStep'
import ResumeParsingStep from '../components/AnalyseResume/ResumeParsingStep'
import ResumeReviewStep from '../components/AnalyseResume/ResumeReviewStep'
import RoleSelectionStep from '../components/AnalyseResume/RoleSelectionStep'
import SkillGapAnalysisStep from '../components/AnalyseResume/SkillGapAnalysisStep'
import { apiClient } from '../services/apiClient'
import heroBackground from '../assets/jobnity-hero.png'

const stepVariants = {
  initial: { opacity: 0, y: 18, filter: 'blur(6px)', scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    y: -14,
    filter: 'blur(4px)',
    scale: 0.995,
    transition: { duration: 0.22, ease: [0.7, 0, 0.84, 0] }
  }
}

export default function AnalyseResumePage() {
  const navigate = useNavigate()
  
  // Logical states: 'upload' | 'parsing' | 'review' | 'role_select' | 'analysis'
  const [step, setStep] = useState('upload')
  const [rawProfile, setRawProfile] = useState(null)
  const [confirmedProfile, setConfirmedProfile] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
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
    if (!file) return
    setStep('parsing')
    try {
      const response = await apiClient.uploadResume(file)
      const parsed = formatProfileForUI(response)
      if (!parsed || !parsed.resume_id) {
        throw new Error('Backend returned invalid profile. Please try re-uploading.')
      }
      setRawProfile(parsed)
      try {
        sessionStorage.setItem('jobnity_resume_id', parsed.resume_id)
        sessionStorage.setItem('jobnity_profile_id', parsed.id || parsed.resume_id)
        sessionStorage.setItem('jobnity_candidate_profile', JSON.stringify(parsed))
        sessionStorage.removeItem('jobnity_interview_completed')
        sessionStorage.removeItem('jobnity_interview_id')
      } catch (e) {
        console.warn('Could not cache resume in sessionStorage', e)
      }
      setStep('review')
    } catch (err) {
      setStep('upload')
      setToastMessage(err.message || 'Failed to extract profile from resume.')
    }
  }

  // Handle sample selection shortcut
  async function handleSampleSelect(roleName) {
    setStep('parsing')
    try {
      const response = await apiClient.loadSampleResume(roleName)
      const parsed = formatProfileForUI(response)
      if (!parsed || !parsed.resume_id) {
        throw new Error('Could not load sample resume profile.')
      }
      setRawProfile(parsed)
      try {
        sessionStorage.setItem('jobnity_resume_id', parsed.resume_id)
        sessionStorage.setItem('jobnity_profile_id', parsed.id || parsed.resume_id)
        sessionStorage.setItem('jobnity_candidate_profile', JSON.stringify(parsed))
        sessionStorage.removeItem('jobnity_interview_completed')
        sessionStorage.removeItem('jobnity_interview_id')
      } catch (e) {
        console.warn('Could not cache resume in sessionStorage', e)
      }
      setStep('review')
    } catch (err) {
      setStep('upload')
      setToastMessage(err.message || 'Failed to load sample profile.')
    }
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
      try {
        sessionStorage.setItem('jobnity_resume_id', editedProfile.resume_id)
        sessionStorage.setItem('jobnity_profile_id', editedProfile.id || editedProfile.resume_id)
        sessionStorage.setItem('jobnity_candidate_profile', JSON.stringify(editedProfile))
      } catch (e) {
        console.warn('Could not cache updated profile in sessionStorage', e)
      }
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
      const result = await apiClient.analyzeSkillGap(
        confirmedProfile.resume_id,
        selectedRole,
        jobDescription
      )
      setAnalysisResult(result)
      try {
        sessionStorage.setItem('jobnity_target_role', selectedRole)
      } catch (e) {
        console.warn('Could not cache target role in sessionStorage', e)
      }
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

  // CTA to Technical Mock Interview
  function handleNavigateToInterview(targetRole) {
    navigate(`/interview?role=${encodeURIComponent(targetRole || selectedRole || '')}`)
  }

  return (
    <BackgroundLayout backgroundImage={heroBackground} className="upload-layout">
      <Navigation />

      <main className="analysis-main">
        {/* Step Indicator Tabs / Progress Header with Shared Element Layout Morphing */}
        <div className="progressive-workflow-nav" aria-label="Progressive workflow steps">
          {[
            {
              id: 'upload',
              num: 1,
              label: 'Upload Resume',
              isActive: step === 'upload' || step === 'parsing',
              isComplete: step !== 'upload' && step !== 'parsing',
              disabled: false,
              onClick: () => setStep('upload')
            },
            {
              id: 'review',
              num: 2,
              label: 'Review Profile',
              isActive: step === 'review',
              isComplete: step === 'role_select' || step === 'analysis',
              disabled: !rawProfile && (step === 'upload' || step === 'parsing'),
              onClick: () => rawProfile && setStep('review')
            },
            {
              id: 'role_select',
              num: 3,
              label: 'Target Role',
              isActive: step === 'role_select',
              isComplete: step === 'analysis',
              disabled: !confirmedProfile,
              onClick: () => confirmedProfile && setStep('role_select')
            },
            {
              id: 'analysis',
              num: 4,
              label: 'Skill Gap Analysis',
              isActive: step === 'analysis',
              isComplete: false,
              disabled: !analysisResult,
              onClick: () => analysisResult && setStep('analysis')
            }
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              className={`workflow-step-btn ${st.isActive ? 'is-active' : ''} ${st.isComplete ? 'is-complete' : ''}`}
              disabled={st.disabled}
              onClick={st.onClick}
              style={{ position: 'relative' }}
            >
              {st.isActive && (
                <motion.div
                  layoutId="workflow-active-capsule"
                  className="workflow-active-capsule"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="step-content-wrap" style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="step-num">{st.num}</span>
                <span>{st.label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Step views with smooth crossfade animation */}
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div key="step-upload" className="analysis-step-wrapper" initial="initial" animate="animate" exit="exit" variants={stepVariants}>
              <ResumeUploadStep 
                onAnalyze={handleStartAnalysis} 
                onSampleSelect={handleSampleSelect}
                errorMessage={toastMessage}
                onClearError={() => setToastMessage('')}
              />
            </motion.div>
          )}

          {step === 'parsing' && (
            <motion.div key="step-parsing" className="analysis-step-wrapper" initial="initial" animate="animate" exit="exit" variants={stepVariants}>
              <ResumeParsingStep />
            </motion.div>
          )}

          {step === 'review' && rawProfile && (
            <motion.div key="step-review" className="analysis-step-wrapper" initial="initial" animate="animate" exit="exit" variants={stepVariants}>
              <ResumeReviewStep 
                profile={rawProfile} 
                onConfirm={handleConfirmProfile} 
              />
            </motion.div>
          )}

          {step === 'role_select' && (
            <motion.div key="step-role-select" className="analysis-step-wrapper" initial="initial" animate="animate" exit="exit" variants={stepVariants}>
              <RoleSelectionStep 
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                onProceed={handlePerformAnalysis}
                profile={confirmedProfile || rawProfile}
              />
            </motion.div>
          )}

          {step === 'analysis' && analysisResult && (
            <motion.div key="step-analysis" className="analysis-step-wrapper" initial="initial" animate="animate" exit="exit" variants={stepVariants}>
              <SkillGapAnalysisStep 
                analysis={analysisResult} 
                onNavigateToRoadmaps={handleNavigateToRoadmaps}
                onNavigateToInterview={handleNavigateToInterview}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Toast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </BackgroundLayout>
  )
}
