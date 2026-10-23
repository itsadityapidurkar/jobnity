import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import heroBackground from '../assets/jobnity-hero.png'
import BackgroundLayout from '../components/BackgroundLayout'
import LoadingSkeleton from '../components/LoadingSkeleton'
import Toast from '../components/Toast'
import { apiClient } from '../services/apiClient'

function normaliseDashboard(response) {
  const source = response.data ?? response.dashboard ?? response
  const history = source.history ?? source.score_history ?? source.progress ?? []
  const toPercent = (value) => {
    const score = Number(value ?? 0)
    return score > 0 && score <= 5 ? score * 20 : score
  }
  const readiness = Number(source.readiness_score ?? source.current_readiness ?? source.readiness ?? 0)
  const averageInterview = toPercent(source.average_interview_score ?? source.avg_interview_score)
  const points = history.map((item, index) => ({ label: item.label ?? item.date ?? `Session ${index + 1}`, readiness: Number(item.readiness ?? item.readiness_score ?? 0), interview: toPercent(item.interview ?? item.interview_score ?? item.average_interview_score) }))
  return {
    hasSessions: Number(source.sessions_completed ?? source.session_count ?? 0) > 0 || points.length > 0,
    readiness,
    roadmapCompletion: Number(source.roadmap_completion ?? source.roadmap_completion_percent ?? 0),
    sessions: Number(source.sessions_completed ?? source.session_count ?? 0),
    averageInterview,
    closed: Number(source.skills_closed ?? source.closed_skills ?? 0),
    open: Number(source.skills_open ?? source.open_skills ?? source.remaining_skills ?? 0),
    trend: Number(source.readiness_trend ?? source.trend ?? 0),
    history: points.length ? points : [{ label: 'Current', readiness, interview: averageInterview }],
  }
}

function StatReadout({ value, label, trend }) {
  return <div className="stat-readout"><strong>{value}</strong><span>{label}</span>{trend !== undefined && <small className={trend >= 0 ? 'is-up' : 'is-down'}>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} pts</small>}</div>
}

function ScoreChart({ data }) {
  return <section className="dashboard-chart"><div className="dashboard-section-title"><div><p className="eyebrow">Momentum over time</p><h2>How your scores are moving</h2></div><div className="chart-key"><span><i className="chart-key__readiness" />Readiness</span><span><i className="chart-key__interview" />Interview</span></div></div><div className="chart-canvas" role="img" aria-label="Line chart comparing readiness and interview scores over time."><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: -24 }}><CartesianGrid stroke="rgba(205, 226, 239, 0.12)" strokeDasharray="2 8" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#91a1b8', fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tick={{ fill: '#91a1b8', fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: '#101c37', border: '1px solid rgba(188, 231, 220, .25)', borderRadius: 10, color: '#f2f9ff', fontSize: 12 }} cursor={{ stroke: 'rgba(180, 242, 225, .22)' }} /><Line type="monotone" dataKey="readiness" stroke="#9debd9" strokeWidth={2} dot={{ r: 3, fill: '#9debd9', strokeWidth: 0 }} activeDot={{ r: 4 }} /><Line type="monotone" dataKey="interview" stroke="#f2c879" strokeWidth={2} dot={{ r: 3, fill: '#f2c879', strokeWidth: 0 }} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></div></section>
}

function SkillsStatus({ closed, open }) {
  const total = closed + open
  const percent = total ? Math.round((closed / total) * 100) : 0
  return <section className="skills-status"><p className="eyebrow">Skills progress</p><h2>Closing the gap</h2><div className="skills-status__bar"><b style={{ width: `${percent}%` }} /></div><div className="skills-status__legend"><span><i className="skills-status__closed" />{closed} closed</span><span><i className="skills-status__open" />{open} to build</span><strong>{percent}%</strong></div></section>
}

function EmptyDashboardIcon() {
  return (
    <svg viewBox="0 0 48 48" width="64" height="64" style={{ margin: '0 auto 1.25rem', display: 'block', opacity: 0.8 }}>
      <rect x="4" y="8" width="40" height="32" rx="4" fill="none" stroke="#9cebd9" strokeWidth="2" strokeDasharray="4 4"/>
      <path d="M12 28l6-8 8 6 10-12" fill="none" stroke="#f2c879" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="28" r="2" fill="#f2c879"/>
      <circle cx="18" cy="20" r="2" fill="#f2c879"/>
      <circle cx="26" cy="26" r="2" fill="#f2c879"/>
      <circle cx="36" cy="14" r="2" fill="#f2c879"/>
    </svg>
  )
}

function EmptyDashboard() {
  return <section className="dashboard-empty"><EmptyDashboardIcon /><p className="eyebrow">No data yet</p><h1>Your first practice session starts the story.</h1><p>Take a mock interview to begin tracking your readiness, strengths, and growth.</p><Link className="primary-button" to="/interview-prep">Start Mock Interview <span aria-hidden="true">→</span></Link></section>
}

export default function DashboardPage() {
  const [status, setStatus] = useState('loading')
  const [dashboard, setDashboard] = useState(null)
  const [toast, setToast] = useState('')
  const candidateId = sessionStorage.getItem('jobnity_profile_id')

  useEffect(() => { let cancelled = false; async function load() { if (!candidateId) { setStatus('empty'); return } try { const response = await apiClient.getDashboard(candidateId); if (!cancelled) { const data = normaliseDashboard(response); setDashboard(data); setStatus(data.hasSessions ? 'ready' : 'empty') } } catch (error) { if (!cancelled) { setStatus('error'); setToast(error.message || 'We could not load your dashboard.') } } } load(); return () => { cancelled = true } }, [candidateId])

  const hasData = useMemo(() => dashboard?.hasSessions, [dashboard])
  return <BackgroundLayout backgroundImage={heroBackground} className="dashboard-layout"><header className="dashboard-header"><Link className="wordmark" to="/">Jobnity</Link><span>Your progress</span></header><main className="dashboard-main">{status === 'loading' && <div className="dashboard-loading"><LoadingSkeleton title="Gathering your progress" detail="Bringing your career momentum into view." /></div>}{status === 'empty' && <EmptyDashboard />}{status === 'ready' && dashboard && hasData && <><section className="dashboard-heading"><p className="eyebrow">Your progress</p><h1>Keep the momentum.</h1><p>Every focused step makes the next opportunity feel closer.</p></section><section className="stat-readouts"><StatReadout value={`${Math.round(dashboard.readiness)}%`} label="Current readiness" trend={dashboard.trend} /><StatReadout value={`${Math.round(dashboard.roadmapCompletion)}%`} label="Roadmap complete" /><StatReadout value={dashboard.sessions} label="Sessions completed" /><StatReadout value={`${Math.round(dashboard.averageInterview)}%`} label="Avg. interview score" /></section><ScoreChart data={dashboard.history} /><SkillsStatus closed={dashboard.closed} open={dashboard.open} /></>}{status === 'error' && <section className="dashboard-empty"><p className="eyebrow">Dashboard unavailable</p><h1>Your progress will be here once it’s ready.</h1><Link className="primary-button" to="/interview-prep">Go to Interview Prep <span aria-hidden="true">→</span></Link></section>}</main><Toast message={toast} onDismiss={() => setToast('')} /></BackgroundLayout>
}
