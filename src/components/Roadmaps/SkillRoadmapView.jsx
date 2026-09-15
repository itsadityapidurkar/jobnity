import { useEffect, useState } from 'react'
import { getLearningResources } from '../../services/dataService'
import { apiClient } from '../../services/apiClient'
import { YouTubeCard, ArticleCard, RoadmapCard } from './ResourceCards'

export default function SkillRoadmapView({ skillName, onBack }) {
  const [resources, setResources] = useState(() => getLearningResources(skillName))

  useEffect(() => {
    let isMounted = true
    apiClient.getSkillResources(skillName).then(data => {
      if (isMounted && data) {
        if (data.resources) {
          setResources({
            youtube: data.resources.youtube || [],
            blogs: data.resources.articles || data.resources.blogs || [],
            roadmaps: data.resources.roadmaps || []
          })
        } else {
          setResources(data)
        }
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [skillName])

  const { youtube = [], blogs = [], roadmaps = [] } = resources || {}

  return (
    <div className="skill-roadmap-view">
      <div className="view-header">
        <button type="button" className="back-link-btn" onClick={onBack}>
          ← Back to Explorer
        </button>
        
        <div className="skill-header-meta">
          <p className="eyebrow">Learning Path</p>
          <h1>{skillName} Learning Roadmap</h1>
          <p>Curated YouTube tutorials, technical articles, and interactive roadmap guides to help you master <strong>{skillName}</strong>.</p>
        </div>
      </div>

      {/* 1. YouTube Section */}
      {youtube.length > 0 && (
        <section className="resource-category-section">
          <div className="category-section-title">
            <h2>
              <span className="cat-icon">▶</span>
              YouTube Video Tutorials ({youtube.length})
            </h2>
            <p>Video courses and practical tutorials</p>
          </div>
          <div className="resource-cards-grid">
            {youtube.map(r => (
              <YouTubeCard key={r.resource_id || r.url} resource={r} />
            ))}
          </div>
        </section>
      )}

      {/* 2. Articles & Blogs Section */}
      {blogs.length > 0 && (
        <section className="resource-category-section">
          <div className="category-section-title">
            <h2>
              <span className="cat-icon">📄</span>
              Articles &amp; Documentation ({blogs.length})
            </h2>
            <p>Written guides, documentation, and technical articles</p>
          </div>
          <div className="resource-cards-grid">
            {blogs.map(r => (
              <ArticleCard key={r.resource_id || r.url} resource={r} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Roadmap.sh Section (Only rendered if valid roadmap exists!) */}
      {roadmaps.length > 0 && (
        <section className="resource-category-section">
          <div className="category-section-title">
            <h2>
              <span className="cat-icon">🗺️</span>
              Interactive Roadmap ({roadmaps.length})
            </h2>
            <p>Step-by-step developer roadmap</p>
          </div>
          <div className="resource-cards-grid">
            {roadmaps.map(r => (
              <RoadmapCard key={r.resource_id || r.url} resource={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
