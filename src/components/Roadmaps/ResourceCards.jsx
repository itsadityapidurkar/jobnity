export function YouTubeCard({ resource }) {
  return (
    <div className="resource-card youtube-card">
      <div className="card-header-badge">
        <span className="badge-icon youtube-icon">▶</span>
        <span className="badge-type">YouTube</span>
      </div>
      <h4 className="resource-title">{resource.title}</h4>
      <p className="resource-desc">{resource.description || `Comprehensive YouTube tutorial covering ${resource.skill}.`}</p>
      
      <div className="resource-meta">
        <span className="meta-tag provider-tag">{resource.provider || 'YouTube'}</span>
        <span className="meta-tag difficulty-tag">{resource.difficulty || 'Intermediate'}</span>
        {resource.duration && <span className="meta-tag duration-tag">⏱ {resource.duration}</span>}
      </div>

      <a 
        href={resource.url || '#'} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="primary-button resource-action-btn"
      >
        Watch Video
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  )
}

export function ArticleCard({ resource }) {
  return (
    <div className="resource-card article-card">
      <div className="card-header-badge">
        <span className="badge-icon article-icon">📄</span>
        <span className="badge-type">Article / Blog</span>
      </div>
      <h4 className="resource-title">{resource.title}</h4>
      <p className="resource-desc">{resource.description || `In-depth article and documentation guide for ${resource.skill}.`}</p>

      <div className="resource-meta">
        <span className="meta-tag provider-tag">{resource.provider || 'Dev Guide'}</span>
        <span className="meta-tag difficulty-tag">{resource.difficulty || 'All Levels'}</span>
      </div>

      <a 
        href={resource.url || '#'} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="primary-button resource-action-btn"
      >
        Read Article
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  )
}

export function RoadmapCard({ resource }) {
  return (
    <div className="resource-card roadmap-card">
      <div className="card-header-badge">
        <span className="badge-icon roadmap-icon">🗺️</span>
        <span className="badge-type">Interactive Roadmap</span>
      </div>
      <h4 className="resource-title">{resource.title || `${resource.skill} Developer Roadmap`}</h4>
      <p className="resource-desc">Community curated learning roadmap and visual developer guide from roadmap.sh.</p>

      <div className="resource-meta">
        <span className="meta-tag provider-tag">roadmap.sh</span>
        <span className="meta-tag verified-tag">✓ Verified Path</span>
      </div>

      <a 
        href={resource.url || 'https://roadmap.sh'} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="primary-button resource-action-btn"
      >
        Open Roadmap
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  )
}
