import { useMemo, useState } from 'react'
import interviewBackground from '../assets/mock-interview-hero.png'
import BackgroundLayout from '../components/BackgroundLayout'
import LoadingSkeleton from '../components/LoadingSkeleton'
import StepIndicator from '../components/StepIndicator'
import Toast from '../components/Toast'
import { apiClient } from '../services/apiClient'

const interviewSteps = ['Resume', 'Review', 'Skill gap', 'Roadmap', 'Interview']
const openingQuestion = {
  id: 'opening-question',
  text: 'Tell me about a project where you had to make a difficult technical decision. How did you evaluate the trade-offs?',
}

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

function ScoreBars({ scores }) {
  const rows = [['Relevance', scores.relevance], ['Correctness', scores.correctness], ['Clarity', scores.clarity]]
  return <div className="score-bars">{rows.map(([label, score]) => <div className="score-bar" key={label}><div><span>{label}</span><strong>{Math.round(score)}<small>/100</small></strong></div><i><b style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} /></i></div>)}</div>
}

function SessionSummary({ evaluations }) {
  const averages = ['relevance', 'correctness', 'clarity'].map((key) => Math.round(evaluations.reduce((sum, item) => sum + item.scores[key], 0) / evaluations.length || 0))
  return <section className="session-summary"><span className="session-summary__mark">✓</span><p className="eyebrow">Session complete</p><h1>Nice work showing up.</h1><p>Your average performance across this session.</p><div className="summary-averages">{[['Relevance', averages[0]], ['Correctness', averages[1]], ['Clarity', averages[2]]].map(([label, score]) => <div key={label}><strong>{score}%</strong><span>{label}</span></div>)}</div><a className="primary-button dashboard-button" href="/dashboard">View Full Dashboard <span aria-hidden="true">→</span></a></section>
}

export default function MockInterviewPage() {
  const [question, setQuestion] = useState(openingQuestion)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState('answering')
  const [evaluation, setEvaluation] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [toast, setToast] = useState('')
  const candidateId = sessionStorage.getItem('jobnity_profile_id')
  const interviewId = sessionStorage.getItem('jobnity_interview_id')
  const canSubmit = answer.trim().length > 0 && status === 'answering'
  const questionNumber = evaluations.length + 1
  const average = useMemo(() => evaluations.length ? Math.round(evaluations.reduce((sum, item) => sum + Object.values(item.scores).reduce((a, b) => a + b, 0) / 3, 0) / evaluations.length) : 0, [evaluations])

  async function submitAnswer() {
    if (!canSubmit) return
    setStatus('loading')
    try {
      const response = await apiClient.submitInterviewAnswer({ candidate_id: candidateId, interview_id: interviewId || undefined, question_id: question.id, question: question.text, answer: answer.trim() })
      const parsed = normaliseEvaluation(response)
      if (parsed.interviewId) sessionStorage.setItem('jobnity_interview_id', String(parsed.interviewId))
      setEvaluation(parsed)
      setEvaluations([...evaluations, parsed])
      setStatus('feedback')
    } catch (error) {
      setStatus('answering')
      setToast(error.message || 'We could not evaluate that answer. Please try again.')
    }
  }

  function nextQuestion() {
    if (!evaluation?.nextQuestion || evaluation.isLast) { setStatus('summary'); return }
    const next = typeof evaluation.nextQuestion === 'string' ? { id: `question-${questionNumber + 1}`, text: evaluation.nextQuestion } : { id: evaluation.nextQuestion.id ?? evaluation.nextQuestion.question_id ?? `question-${questionNumber + 1}`, text: evaluation.nextQuestion.text ?? evaluation.nextQuestion.question }
    setQuestion(next)
    setAnswer('')
    setEvaluation(null)
    setStatus('answering')
  }

  return <BackgroundLayout backgroundImage={interviewBackground} className="interview-layout"><header className="upload-header"><a className="wordmark" href="/">Jobnity</a><StepIndicator active={4} steps={interviewSteps} /></header><main className="interview-main">{status === 'summary' ? <SessionSummary evaluations={evaluations} /> : <section className="interview-panel"><div className="interview-panel__top"><p className="eyebrow">Mock interview <span>·</span> Question {questionNumber}</p><span className="interview-average">Session avg. {average || '—'}%</span></div>{status === 'loading' ? <LoadingSkeleton title="Reviewing your answer" detail="Scoring relevance, correctness, and clarity." /> : <>{!evaluation ? <><h1>{question.text}</h1><label className="answer-field"><span>Your answer</span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows="5" placeholder="Take a moment. A thoughtful answer is better than a fast one." /></label><div className="interview-actions"><button className="voice-button" type="button" disabled><span aria-hidden="true">◉</span> Voice input <small>coming soon</small></button><button className="primary-button submit-answer" type="button" disabled={!canSubmit} onClick={submitAnswer}>Submit Answer <span aria-hidden="true">→</span></button></div></> : <div className="answer-feedback" role="status" aria-live="polite"><p className="eyebrow">Your feedback</p><h1>Here’s what landed.</h1><ScoreBars scores={evaluation.scores} /><p className="feedback-copy">{evaluation.feedback}</p><button className="primary-button next-question" type="button" onClick={nextQuestion}>{evaluation.nextQuestion && !evaluation.isLast ? 'Next Question' : 'Finish Session'} <span aria-hidden="true">→</span></button></div>}</>}</section>}</main><Toast message={toast} onDismiss={() => setToast('')} /></BackgroundLayout>
}
