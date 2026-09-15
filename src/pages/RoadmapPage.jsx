import { useEffect, useMemo, useState } from 'react'
import roadmapBackground from '../assets/roadmap-hero.png'
import BackgroundLayout from '../components/BackgroundLayout'
import LoadingSkeleton from '../components/LoadingSkeleton'
import StepIndicator from '../components/StepIndicator'
import Toast from '../components/Toast'
import { apiClient } from '../services/apiClient'

const roadmapSteps = ['Resume', 'Review', 'Skill gap', 'Roadmap']

function normalizeRoadmap(response) {
  const source = response.roadmap ?? response.data ?? response
  const items = source.items ?? source.roadmap_items ?? []
  return {
    id: source.roadmap_id ?? source.id,
    items: items.map((item, index) => ({
      id: item.item_id ?? item.id,
      skill: item.skill_name ?? item.skill ?? item.title ?? `Skill ${index + 1}`,
      priority: String(item.priority ?? 'medium').toLowerCase(),
      hours: item.estimated_hours ?? item.hours ?? item.duration_hours ?? 0,
      resources: item.resources ?? item.resource_links ?? [],
      status: item.status ?? (item.completed || item.is_completed ? 'done' : 'in_progress'),
    })),
  }
}

function ResourceLinks({ resources }) {
  if (!resources.length) return <p className="resource-empty">Resources will be recommended for this step soon.</p>
  return <ul className="resource-links">{resources.map((resource, index) => { const link = typeof resource === 'string' ? { title: resource, url: resource } : resource; return <li key={link.url ?? link.title ?? index}><a href={link.url ?? '#'} target="_blank" rel="noreferrer">{link.title ?? link.name ?? link.url}<span aria-hidden="true">↗</span></a></li> })}</ul>
}

function TimelineItem({ item, index, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const done = item.status === 'done'
  return <article className={`timeline-item ${done ? 'is-done' : ''}`}><div className="timeline-item__line"><span className="timeline-item__index">{String(index + 1).padStart(2, '0')}</span><label className="completion-toggle"><input type="checkbox" checked={done} onChange={(event) => onToggle(item, event.target.checked)} /><span aria-hidden="true">✓</span><span className="sr-only">Mark {item.skill} as {done ? 'in progress' : 'done'}</span></label><div className="timeline-item__main"><div className="timeline-item__meta"><span className={`priority-tag priority-tag--${item.priority}`}>{item.priority}</span><span>{item.hours ? `${item.hours} hrs` : 'Flexible time'}</span></div><h2>{item.skill}</h2></div><button className="expand-button" type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? 'Hide resources' : 'Resources'}<span aria-hidden="true">⌄</span></button></div>{expanded && <div className="timeline-item__resources"><ResourceLinks resources={item.resources} /></div>}</article>
}

function ReadyState() {
  return <div className="ready-state"><span className="ready-state__mark">✓</span><p className="eyebrow">You’re ready</p><h1>You already have a strong foundation.</h1><p>There are no priority skills to build for this target role. Put that momentum into your interview practice.</p></div>
}

export default function RoadmapPage() {
  const [status, setStatus] = useState('loading')
  const [roadmap, setRoadmap] = useState(null)
  const [toast, setToast] = useState('')
  const reportId = sessionStorage.getItem('jobnity_report_id')

  useEffect(() => {
    let cancelled = false
    async function loadRoadmap() {
      if (!reportId) { setStatus('error'); setToast('Choose a role and generate a skill-gap report first.'); return }
      try {
        let response
        try {
          response = await apiClient.getRoadmap(reportId)
        } catch (error) {
          if (error.status && error.status !== 404) throw error
          response = await apiClient.generateRoadmap(reportId)
          if (!response.items && !response.roadmap && !response.data) response = await apiClient.getRoadmap(reportId)
        }
        if (!cancelled) { setRoadmap(normalizeRoadmap(response)); setStatus('ready') }
      } catch (error) {
        if (!cancelled) { setStatus('error'); setToast(error.message || 'We could not load your roadmap. Please try again.') }
      }
    }
    loadRoadmap()
    return () => { cancelled = true }
  }, [reportId])

  const completed = useMemo(() => roadmap?.items.filter((item) => item.status === 'done').length ?? 0, [roadmap])
  const progress = roadmap?.items.length ? Math.round((completed / roadmap.items.length) * 100) : 100

  async function toggleItem(item, isDone) {
    const previousItems = roadmap.items
    const nextStatus = isDone ? 'done' : 'in_progress'
    setRoadmap({ ...roadmap, items: previousItems.map((current) => current.id === item.id ? { ...current, status: nextStatus } : current) })
    try {
      await apiClient.updateRoadmapItem(item.id, nextStatus)
    } catch (error) {
      setRoadmap({ ...roadmap, items: previousItems })
      setToast(error.message || 'We could not update that roadmap item. Please try again.')
    }
  }

  return <BackgroundLayout backgroundImage={roadmapBackground} className="roadmap-layout"><header className="upload-header"><a className="wordmark" href="/">Jobnity</a><StepIndicator active={3} steps={roadmapSteps} /></header><main className="roadmap-main">{status === 'loading' && <div className="roadmap-panel"><LoadingSkeleton title="Building your best next steps" detail="Turning your skill gaps into a focused learning plan." /></div>}{status === 'ready' && roadmap && <><section className="roadmap-heading"><p className="eyebrow">A path built around you</p><h1>Your learning roadmap.</h1><div className="roadmap-progress"><div><span>Progress</span><strong>{completed} of {roadmap.items.length} complete</strong></div><i><b style={{ width: `${progress}%` }} /></i><em>{progress}%</em></div></section>{roadmap.items.length ? <section className="timeline" aria-label="Learning roadmap">{roadmap.items.map((item, index) => <TimelineItem key={item.id ?? item.skill} item={item} index={index} onToggle={toggleItem} />)}</section> : <ReadyState />}<a className="primary-button interview-button" href="/interview-prep">Proceed to Interview Prep <span aria-hidden="true">→</span></a></>}{status === 'error' && <div className="roadmap-error"><p className="eyebrow">Roadmap unavailable</p><h1>We couldn’t find a roadmap yet.</h1><a href="/skill-gap-report">Return to skill gap report</a></div>}</main><Toast message={toast} onDismiss={() => setToast('')} /></BackgroundLayout>
}
