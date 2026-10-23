import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackgroundLayout from '../components/BackgroundLayout'
import Navigation from '../components/Navigation'
import LoadingSkeleton from '../components/LoadingSkeleton'
import Toast from '../components/Toast'
import { apiClient } from '../services/apiClient'

const TOTAL_QUESTIONS = 3

function normaliseEvaluation(response) {
  const source = response.data ?? response.evaluation ?? response
  const score = (key) => {
    const value = Number(source[`${key}_score`] ?? source.scores?.[key] ?? source[key] ?? 0)
    return value > 0 && value <= 5 ? value * 20 : value
  }
  return {
    interviewId: source.interview_id ?? source.interviewId,
    questionId: source.question_id ?? source.questionId,
    scores: { relevance: score('relevance'), correctness: score('correctness'), clarity: score('clarity') },
    feedback: source.feedback ?? source.feedback_text ?? source.overall_feedback ?? 'Your answer has been reviewed. Use the scores to guide your next response.',
    nextQuestion: source.next_question ?? source.nextQuestion ?? null,
    isLast: Boolean(source.is_last ?? source.isLast ?? source.complete ?? false),
  }
}

function formatResumeGrounding(raw) {
  if (!raw) return null
  let text = String(raw).trim()
  const typeMatch = text.match(/^(role|project|skill|experience|achievement|tool):\s*/i)
  const category = typeMatch ? typeMatch[1].toLowerCase() : 'experience'
  text = text.replace(/^(role|project|skill|experience|achievement|tool):\s*/i, '')
  
  // Clean dangling unclosed parentheses or dates from parsing
  const openCount = (text.match(/\(/g) || []).length
  const closeCount = (text.match(/\)/g) || []).length
  if (openCount > closeCount) {
    text = text.replace(/\s*\([^)]*$/, '')
  }
  if (text.length > 60) {
    text = text.substring(0, 57) + '...'
  }
  return {
    category: category.charAt(0).toUpperCase() + category.slice(1),
    detail: text
  }
}

function ScoreBars({ scores }) {
  const rows = [
    ['Relevance', scores.relevance, scores.relevance >= 80 ? 'Strong' : scores.relevance >= 60 ? 'Competent' : 'Needs Depth'],
    ['Correctness', scores.correctness, scores.correctness >= 80 ? 'Accurate' : scores.correctness >= 60 ? 'Valid' : 'Gaps Found'],
    ['Clarity', scores.clarity, scores.clarity >= 80 ? 'Crisp' : scores.clarity >= 60 ? 'Adequate' : 'Unclear']
  ]

  return (
    <div className="score-bars">
      {rows.map(([label, score, grade], index) => (
        <div className="score-bar" key={label}>
          <div>
            <span>
              {label} <small style={{ color: '#94a3b8', marginLeft: '0.4rem' }}>({grade})</small>
            </span>
            <strong>{Math.round(score)}<small>/100</small></strong>
          </div>
          <i>
            <motion.b
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
              transition={{ duration: 0.65, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            />
          </i>
        </div>
      ))}
    </div>
  )
}

function SessionSummary({ evaluations, onRetake, onUploadNew }) {
  const averages = ['relevance', 'correctness', 'clarity'].map((key) =>
    Math.round(evaluations.reduce((sum, item) => sum + item.scores[key], 0) / (evaluations.length || 1))
  )
  return (
    <motion.section
      className="session-summary"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="session-summary__mark">✓</span>
      <p className="eyebrow">Session Complete</p>
      <h1>Interview Finished</h1>
      <p>Here is your aggregate performance across this verified resume interview.</p>
      <div className="summary-averages">
        {[['Relevance', averages[0]], ['Correctness', averages[1]], ['Clarity', averages[2]]].map(([label, score]) => (
          <div key={label}>
            <strong>{score}%</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <button
          type="button"
          className="primary-button dashboard-button"
          onClick={onUploadNew}
          style={{ margin: 0 }}
        >
          Upload New Resume <span aria-hidden="true">→</span>
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onRetake}
          style={{ alignSelf: 'center', padding: '0.75rem 1.4rem' }}
        >
          Practice Again (Same Profile) ↻
        </button>
        <Link className="secondary-button" to="/roadmaps" style={{ alignSelf: 'center', padding: '0.75rem 1.4rem' }}>
          Return to Roadmaps
        </Link>
      </div>
    </motion.section>
  )
}

function InterviewProgressBar({ current, total = TOTAL_QUESTIONS, status }) {
  const displayCurrent = Math.min(current, total)
  const percent = Math.round((displayCurrent / total) * 100)
  const isFinal = current >= total
  const completedSegments = status === 'feedback' ? current : current - 1

  return (
    <div className="interview-progress" aria-label={`Assessment Progress: Question ${displayCurrent} of ${total}`}>
      <div className="interview-progress__header">
        <div className="interview-progress__left">
          <span className="interview-progress__step-badge">
            Question {displayCurrent} of {total}
          </span>
          {isFinal && (
            <span className="interview-progress__final-badge">Final Question</span>
          )}
        </div>
        <span className="interview-progress__value">{percent}% Complete</span>
      </div>

      <div
        className="interview-progress__track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1
          const isComplete = stepNum <= completedSegments
          const isActive = stepNum === current && !isComplete

          return (
            <div
              key={stepNum}
              className={`interview-progress__segment ${
                isComplete ? 'is-complete' : isActive ? 'is-active' : ''
              }`}
            >
              <motion.div
                className="interview-progress__segment-fill"
                initial={false}
                animate={{
                  width: isComplete ? '100%' : isActive ? (status === 'evaluating' ? '70%' : '35%') : '0%'
                }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          )
        })}
      </div>

      <div className="interview-progress__steps">
        {[
          { stepNum: 1, label: '1. Scenario' },
          { stepNum: 2, label: '2. Architecture' },
          { stepNum: 3, label: '3. Final Evaluation' }
        ].map((item) => {
          const isActive = current === item.stepNum
          const isComplete = current > item.stepNum
          return (
            <span
              key={item.stepNum}
              className={`progress-step-label ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`}
              style={{ position: 'relative' }}
            >
              {isActive && (
                <motion.span
                  layoutId="interview-current-step-indicator"
                  className="progress-step-active-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function MockInterviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetRole = searchParams.get('role') || sessionStorage.getItem('jobnity_target_role') || 'Software Engineer'

  // State: 'initializing' | 'no_resume' | 'session_completed_prompt' | 'answering' | 'evaluating' | 'feedback' | 'summary' | 'connection_error'
  const [status, setStatus] = useState('initializing')
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const textareaRef = useRef(null)
  const [evaluation, setEvaluation] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [candidateProfile, setCandidateProfile] = useState(null)

  const canSubmit = answer.trim().length > 0 && status === 'answering'
  const questionNumber = evaluations.length + 1
  const average = useMemo(
    () =>
      evaluations.length
        ? Math.round(
            evaluations.reduce((sum, item) => sum + Object.values(item.scores).reduce((a, b) => a + b, 0) / 3, 0) /
              evaluations.length
          )
        : 0,
    [evaluations]
  )

  const candidateName = useMemo(() => {
    return candidateProfile?.personalInfo?.name || candidateProfile?.name || ''
  }, [candidateProfile])

  const wordCount = useMemo(() => {
    const trimmed = answer.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
  }, [answer])

  const groundingInfo = useMemo(() => {
    if (!question || !question.referenced_resume_item) return null
    return formatResumeGrounding(question.referenced_resume_item)
  }, [question])

  // Clear cached resume from sessionStorage and start fresh upload
  const handleClearResumeAndUploadNew = useCallback(() => {
    sessionStorage.removeItem('jobnity_resume_id')
    sessionStorage.removeItem('jobnity_profile_id')
    sessionStorage.removeItem('jobnity_candidate_profile')
    sessionStorage.removeItem('jobnity_interview_id')
    sessionStorage.removeItem('jobnity_interview_completed')
    sessionStorage.removeItem('jobnity_target_role')
    navigate('/analyse-resume')
  }, [navigate])

  const initializeInterview = useCallback(async (forceFresh = false) => {
    const cachedResumeId = sessionStorage.getItem('jobnity_resume_id')
    const cachedCandidateId = sessionStorage.getItem('jobnity_profile_id')
    const rawProfile = sessionStorage.getItem('jobnity_candidate_profile')
    const isCompleted = sessionStorage.getItem('jobnity_interview_completed') === 'true'

    let parsedProfile = null
    if (rawProfile) {
      try {
        parsedProfile = JSON.parse(rawProfile)
        setCandidateProfile(parsedProfile)
      } catch (err) {
        console.warn('Failed to parse cached candidate profile', err)
      }
    }

    // Gate 1: Jobnity technical interviews are strictly generated from the candidate's verified resume.
    if (!cachedResumeId && !parsedProfile) {
      setStatus('no_resume')
      return
    }

    // Gate 2: If previous session was completed and not explicitly retaking, show prompt to avoid locking into old resume
    if (isCompleted && !forceFresh) {
      setStatus('session_completed_prompt')
      return
    }

    setStatus('initializing')
    setErrorMessage('')

    try {
      const response = await apiClient.startInterview({
        role: targetRole,
        resume_id: cachedResumeId || undefined,
        candidate_id: cachedCandidateId || undefined,
        candidate_profile: parsedProfile || undefined
      })

      if (response && response.question && response.question.text) {
        setQuestion(response.question)
        if (response.interview_id) {
          sessionStorage.setItem('jobnity_interview_id', String(response.interview_id))
        }
        setStatus('answering')
      } else {
        throw new Error('Interview engine did not return a valid question for your resume.')
      }
    } catch (err) {
      console.error('Failed to initialize interview session:', err)
      setErrorMessage(
        err.message || 'Unable to connect to the backend interview engine (Qwen 2.5). Generic mock questions are disabled.'
      )
      setStatus('connection_error')
    }
  }, [targetRole])

  // Retake with same profile
  const handleRetakeSession = useCallback(() => {
    sessionStorage.removeItem('jobnity_interview_completed')
    sessionStorage.removeItem('jobnity_interview_id')
    setEvaluations([])
    setEvaluation(null)
    setAnswer('')
    initializeInterview(true)
  }, [initializeInterview])

  useEffect(() => {
    initializeInterview()
  }, [initializeInterview])

  async function submitAnswer() {
    if (!canSubmit || !question) return
    setStatus('evaluating')

    const cachedResumeId = sessionStorage.getItem('jobnity_resume_id')
    const cachedCandidateId = sessionStorage.getItem('jobnity_profile_id')
    const cachedInterviewId = sessionStorage.getItem('jobnity_interview_id')
    const rawProfile = sessionStorage.getItem('jobnity_candidate_profile')
    let parsedProfile = null
    if (rawProfile) {
      try {
        parsedProfile = JSON.parse(rawProfile)
      } catch (e) {}
    }

    try {
      const response = await apiClient.submitInterviewAnswer({
        candidate_id: cachedCandidateId,
        resume_id: cachedResumeId,
        candidate_profile: parsedProfile,
        interview_id: cachedInterviewId || undefined,
        question_id: question.id,
        question: question.text,
        answer: answer.trim(),
        target_role: targetRole
      })
      const parsed = normaliseEvaluation(response)
      if (parsed.interviewId) sessionStorage.setItem('jobnity_interview_id', String(parsed.interviewId))
      setEvaluation(parsed)
      setEvaluations((prev) => [...prev, parsed])
      setStatus('feedback')
    } catch (error) {
      setStatus('answering')
      setToast(error.message || 'We could not evaluate that answer. Please try again.')
    }
  }

  function nextQuestion() {
    if (!evaluation?.nextQuestion || evaluation.isLast || evaluations.length >= TOTAL_QUESTIONS) {
      sessionStorage.setItem('jobnity_interview_completed', 'true')
      setStatus('summary')
      return
    }
    const next =
      typeof evaluation.nextQuestion === 'string'
        ? { id: `question-${questionNumber + 1}`, text: evaluation.nextQuestion }
        : {
            id: evaluation.nextQuestion.id ?? evaluation.nextQuestion.question_id ?? `question-${questionNumber + 1}`,
            text: evaluation.nextQuestion.text ?? evaluation.nextQuestion.question,
            referenced_resume_item: evaluation.nextQuestion.referenced_resume_item
          }
    setQuestion(next)
    setAnswer('')
    setEvaluation(null)
    setStatus('answering')
  }

  function handleInput(event) {
    setAnswer(event.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 340) + 'px'
    }
  }

  function handleKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      if (canSubmit) {
        submitAnswer()
      }
    }
  }

  return (
    <BackgroundLayout className="interview-layout">
      {/* Global Navigation Header */}
      <Navigation />

      {/* Session Context Bar: only display when in an active interview session */}
      {status !== 'no_resume' && status !== 'connection_error' && status !== 'session_completed_prompt' && (
        <div className="interview-context-bar" aria-label="Interview session context">
          <div className="interview-context-bar__role">
            <span>Target:</span>
            <strong>{targetRole}</strong>
            {candidateName && (
              <>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>·</span>
                <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>{candidateName}</span>
              </>
            )}
          </div>
          <div className="interview-context-bar__meta">
            <span className="interview-context-bar__stat">
              Question {Math.min(questionNumber, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
            </span>
            <span className="interview-context-bar__stat">Session Avg: {average ? `${average}%` : 'Pending'}</span>
            <button
              type="button"
              className="context-change-resume-btn"
              onClick={handleClearResumeAndUploadNew}
              title="Upload a new resume instead of current cached resume"
            >
              Upload New Resume ↺
            </button>
            <Link className="interview-context-bar__exit" to="/roadmaps">
              Exit
            </Link>
          </div>
        </div>
      )}

      <main className="interview-main">
        <AnimatePresence mode="wait">
          {/* Gate 1: No resume uploaded yet */}
          {status === 'no_resume' && (
            <motion.section
              key="no_resume"
              className="session-summary"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="session-summary__mark"
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <p className="eyebrow" style={{ color: '#38bdf8' }}>Verified Profile Required</p>
              <h1>Upload Your Resume to Begin</h1>
              <p>
                Jobnity AI technical interviews are strictly grounded in your verified experience — testing you directly
                on your real architectural decisions, technologies, and achievements.
              </p>
              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                <Link className="primary-button dashboard-button" to="/analyse-resume" style={{ margin: 0 }}>
                  Upload Resume First <span aria-hidden="true">→</span>
                </Link>
                <Link className="secondary-button" to="/roadmaps" style={{ alignSelf: 'center', padding: '0.75rem 1.4rem' }}>
                  Explore Roadmaps
                </Link>
              </div>
            </motion.section>
          )}

          {/* Gate 2: Previous session completed prompt (prevents locking onto old resume after refresh) */}
          {status === 'session_completed_prompt' && (
            <motion.section
              key="previous_completed"
              className="session-summary"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="session-summary__mark"
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <p className="eyebrow" style={{ color: '#38bdf8' }}>Previous Session Finished</p>
              <h1>Ready for Your Next Session?</h1>
              <p>
                You recently completed an interview for{' '}
                <strong>{candidateName || 'your verified profile'}</strong> ({targetRole}).
                Would you like to upload a new resume or practice again?
              </p>
              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="primary-button dashboard-button"
                  onClick={handleClearResumeAndUploadNew}
                  style={{ margin: 0 }}
                >
                  Upload New Resume <span aria-hidden="true">→</span>
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleRetakeSession}
                  style={{ alignSelf: 'center', padding: '0.75rem 1.4rem' }}
                >
                  Practice Again (Same Profile) ↻
                </button>
              </div>
            </motion.section>
          )}

          {/* Gate 3: Backend disconnected / Ollama offline */}
          {status === 'connection_error' && (
            <motion.section
              key="connection_error"
              className="session-summary"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="session-summary__mark"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  color: '#f87171'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p className="eyebrow" style={{ color: '#f87171' }}>Interview Engine Unavailable</p>
              <h1>Could Not Reach AI Service</h1>
              <p>
                We could not connect to the local interview engine. To maintain quality and accuracy,
                questions must be generated directly from your verified background.
              </p>
              {errorMessage && (
                <p
                  style={{
                    color: '#fca5a5',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.78rem',
                    marginBottom: '1.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '0.6rem 1rem',
                    borderRadius: '0.5rem',
                    display: 'inline-block'
                  }}
                >
                  {errorMessage}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="primary-button dashboard-button"
                  onClick={() => initializeInterview(true)}
                  style={{ margin: 0 }}
                >
                  Retry Connection <span aria-hidden="true">↻</span>
                </button>
                <Link className="secondary-button" to="/analyse-resume" style={{ alignSelf: 'center', padding: '0.75rem 1.4rem' }}>
                  Back to Resume
                </Link>
              </div>
            </motion.section>
          )}

          {/* State 4: Initializing interview with resume */}
          {status === 'initializing' && (
            <motion.section
              key="initializing"
              className="interview-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <LoadingSkeleton
                title="Preparing Interview Questions"
                detail="Reviewing your projects, technologies, and work history to formulate targeted technical scenarios..."
              />
            </motion.section>
          )}

          {/* State 5: Evaluating answer */}
          {status === 'evaluating' && (
            <motion.section
              key="evaluating"
              className="interview-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <LoadingSkeleton
                title="Reviewing Your Response"
                detail="Evaluating technical accuracy, depth, architectural soundess, and communication clarity..."
              />
            </motion.section>
          )}

          {/* State 6: Session complete summary */}
          {status === 'summary' && (
            <SessionSummary
              key="summary"
              evaluations={evaluations}
              onRetake={handleRetakeSession}
              onUploadNew={handleClearResumeAndUploadNew}
            />
          )}

          {/* State 7: Question answering or feedback */}
          {(status === 'answering' || status === 'feedback') && question && (
            <motion.section
              key={`question-${question.id || questionNumber}-${status}`}
              className="interview-panel"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Progress Bar */}
              <InterviewProgressBar
                current={questionNumber}
                total={TOTAL_QUESTIONS}
                status={status}
              />

              <div className="interview-panel__top">
                <p className="eyebrow">
                  Technical Assessment <span>·</span> Scenario {Math.min(questionNumber, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
                </p>
                <span className="interview-average">Session Avg: {average ? `${average}%` : 'Pending'}</span>
              </div>

              {!evaluation ? (
                <>
                  {groundingInfo && (
                    <div className="resume-grounding-pill" title={question.referenced_resume_item}>
                      <span className="grounding-dot" aria-hidden="true" />
                      <span className="grounding-type">Based on your {groundingInfo.category}</span>
                      <span className="grounding-sep">·</span>
                      <strong className="grounding-detail">{groundingInfo.detail}</strong>
                    </div>
                  )}

                  <h1>{question.text}</h1>

                  <div className="answer-field">
                    <div className="answer-field-header">
                      <span>Your Response</span>
                      <div className="answer-meta">
                        <span className="word-count">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                        <span>·</span>
                        <span>min. 15 recommended</span>
                      </div>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={answer}
                      onChange={handleInput}
                      onKeyDown={handleKeyDown}
                      rows="5"
                      placeholder="Take a moment to structure your thoughts. Cite specific technologies, trade-offs, and outcomes from your experience."
                      autoFocus
                    />
                  </div>

                  <div className="interview-actions">
                    <button className="voice-button" type="button" disabled title="Voice input coming in next release">
                      <span aria-hidden="true">◉</span> Voice input <small>coming soon</small>
                    </button>
                    <div className="action-submit-group">
                      <span className="shortcut-hint" title="Press Cmd/Ctrl + Enter to submit">⌘ + Enter</span>
                      <button
                        className="primary-button submit-answer"
                        type="button"
                        disabled={!canSubmit}
                        onClick={submitAnswer}
                      >
                        Submit Answer <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="answer-feedback" role="status" aria-live="polite">
                  <div className="feedback-header">
                    <p className="eyebrow">Interview Feedback</p>
                    <h2>Detailed Response Breakdown</h2>
                  </div>

                  <ScoreBars scores={evaluation.scores} />

                  <div className="feedback-content-card">
                    <h4>Feedback &amp; Recommendations</h4>
                    <p className="feedback-copy">{evaluation.feedback}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    <button className="primary-button next-question" type="button" onClick={nextQuestion}>
                      {questionNumber < TOTAL_QUESTIONS && evaluation.nextQuestion && !evaluation.isLast
                        ? 'Next Question'
                        : 'Complete Interview'}{' '}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <Toast message={toast} onDismiss={() => setToast('')} />
    </BackgroundLayout>
  )
}
