import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react'
import heroBackground from '../assets/jobnity-hero.png'
import BackgroundLayout from '../components/BackgroundLayout'
import LoadingSkeleton from '../components/LoadingSkeleton'
import StepIndicator from '../components/StepIndicator'
import Toast from '../components/Toast'
import { apiClient } from '../services/apiClient'

const roles = ['Software Developer', 'Data Scientist', 'AI / ML Engineer', 'Frontend Developer', 'Product Manager']

function normaliseAnalysis(response, role) {
  const source = response.data ?? response.analysis ?? response
  const matched = source.matched_skills ?? source.skills_you_have ?? source.matched ?? []
  const missing = source.missing_skills ?? source.skills_to_build ?? source.gaps ?? []
  return {
    reportId: source.report_id ?? source.reportId ?? source.id,
    readinessScore: Number(source.readiness_score ?? source.readinessScore ?? source.score ?? 0),
    matched: matched.map((item) => typeof item === 'string' ? { name: item, confidence: 100 } : { name: item.name ?? item.skill ?? item.label, confidence: Number(item.confidence ?? item.match_score ?? item.score ?? 0) }).filter((item) => item.name),
    missing: missing.map((item, index) => typeof item === 'string' ? { name: item, rank: index + 1, reason: `Important for a ${role} role.` } : { name: item.name ?? item.skill ?? item.label, rank: item.rank ?? index + 1, reason: item.reason ?? item.why ?? `Important for a ${role} role.` }).filter((item) => item.name),
  }
}

function RoleSelector({ selected, onSelect, disabled }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const matches = useMemo(() => roles.filter((role) => role.toLowerCase().includes(query.toLowerCase())), [query])
  function choose(role) { setOpen(false); setQuery(''); onSelect(role) }

  return <div className="role-selector"><label htmlFor="role-search">Target role</label><button className="role-selector__trigger" type="button" onClick={() => setOpen(!open)} aria-expanded={open} disabled={disabled}><span>{selected || 'Choose a role to analyze'}</span><span aria-hidden="true">⌄</span></button>{open && <div className="role-selector__menu" onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}><input id="role-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles" aria-label="Search roles" />{matches.length ? <div className="role-selector__options">{matches.map((role) => <button type="button" key={role} onClick={() => choose(role)}>{role}</button>)}</div> : <p>No matching roles</p>}</div>}</div>
}

function ReadinessGauge({ score }) {
  const tone = score < 50 ? 'var(--red)' : score < 75 ? 'var(--amber)' : 'var(--green)'
  const label = score < 50 ? 'Needs attention' : score < 75 ? 'Building momentum' : 'Strong foundation'
  return <section className="readiness" aria-label={`Readiness score: ${score}%`}><div className="gauge" style={{ '--score': `${Math.min(Math.max(score, 0), 100)}%`, '--gauge-color': tone }}><div className="gauge__center"><strong>{Math.round(score)}<sup>%</sup></strong><span>readiness</span></div></div><p>{label}</p></section>
}

function MatchedList({ items }) {
  return <section className="skill-column"><div className="skill-column__title"><span className="status-dot status-dot--matched" /> <h2>Skills You Have</h2></div>{items.length ? items.map((item) => <div className="skill-row" key={item.name}><div><strong>{item.name}</strong><span>Strong match</span></div><div className="confidence"><span>{Math.round(item.confidence)}%</span><i><b style={{ width: `${Math.min(Math.max(item.confidence, 0), 100)}%` }} /></i></div></div>) : <p className="skill-column__empty">Matched skills will appear here.</p>}</section>
}

function MissingList({ items, role }) {
  return <section className="skill-column"><div className="skill-column__title"><span className="status-dot status-dot--missing" /> <h2>Skills to Build</h2></div>{items.length ? items.map((item) => <div className="skill-row skill-row--missing" key={item.name}><span className="skill-rank">{String(item.rank).padStart(2, '0')}</span><div><strong>{item.name}</strong><span>{item.reason || `Important for a ${role} role.`}</span></div></div>) : <p className="skill-column__empty">Growth areas will appear here.</p>}</section>
}

export default function SkillGapReportPage() {
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('idle')
  const [analysis, setAnalysis] = useState(null)
  const [toast, setToast] = useState('')

  async function analyse(selectedRole) {
    setRole(selectedRole)
    setAnalysis(null)
    setStatus('loading')
    try {
      const profileId = sessionStorage.getItem('jobnity_profile_id')
      const response = await apiClient.analyzeSkillGap(profileId, selectedRole)
      const parsedAnalysis = normaliseAnalysis(response, selectedRole)
      if (parsedAnalysis.reportId) sessionStorage.setItem('jobnity_report_id', String(parsedAnalysis.reportId))
      setAnalysis(parsedAnalysis)
      setStatus('ready')
    } catch (error) {
      setStatus('idle')
      setToast(error.message || 'We could not analyze this role. Please try again.')
    }
  }

  return <BackgroundLayout backgroundImage={heroBackground} className="analysis-layout"><header className="upload-header"><Link className="wordmark" to="/">Jobnity</Link><StepIndicator active={2} /></header><main className="analysis-main"><div className="analysis-intro"><p className="eyebrow">Your personal benchmark</p><h1>Find your next best move.</h1><p>See how your current profile aligns with the role you want.</p></div><RoleSelector selected={role} onSelect={analyse} disabled={status === 'loading'} />{status === 'loading' && <div className="analysis-panel"><LoadingSkeleton title="Measuring your skill fit" detail="Comparing your profile with role requirements." /></div>}{status === 'ready' && analysis && <div className="analysis-results"><ReadinessGauge score={analysis.readinessScore} /><div className="skill-columns"><MatchedList items={analysis.matched} /><MissingList items={analysis.missing} role={role} /></div><Link className="primary-button roadmap-button" to="/roadmap">Generate My Roadmap <span aria-hidden="true">→</span></Link></div>}</main><Toast message={toast} onDismiss={() => setToast('')} /></BackgroundLayout>
}
