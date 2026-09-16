import { useState } from 'react'
import Navigation from '../components/Navigation'
import BackgroundLayout from '../components/BackgroundLayout'

const DOC_SECTIONS = [
  { id: 'overview', title: '1. Executive Summary', icon: '⚡' },
  { id: 'architecture', title: '2. System Architecture & Stack', icon: '🏗️' },
  { id: 'schema', title: '3. Data Model & Database Schema', icon: '🗄️' },
  { id: 'engine', title: '4. NLP & Skill Gap Engine Flow', icon: '🧠' },
  { id: 'api', title: '5. REST API Reference', icon: '🔌' },
  { id: 'deployment', title: '6. Docker, Vercel & Cloudflare Setup', icon: '🚀' },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  const scrollToSection = (id) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <BackgroundLayout className="upload-layout">
      <Navigation />

      <main className="main-content-container" style={{ paddingBottom: '5rem', paddingTop: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Header Hero */}
        <div className="docs-hero" style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          marginBottom: '2.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Official Documentation
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>v1.0.0</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Jobnity Technical Platform Guide
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '750px', lineHeight: '1.6' }}>
            Complete architectural reference, database schemas, NLP taxonomy extraction pipeline, weighted skill gap engine formulas, REST API endpoints, and deployment guides.
          </p>

          {/* Quick Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
            <span className="tech-badge">React 18</span>
            <span className="tech-badge">Python 3 + FastAPI</span>
            <span className="tech-badge">SQLAlchemy ORM</span>
            <span className="tech-badge">SQLite Taxonomy DB</span>
            <span className="tech-badge">Docker Containerized</span>
            <span className="tech-badge">Vercel Serverless Ready</span>
          </div>
        </div>

        {/* Layout: Sidebar + Main Documentation */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }} className="docs-grid">
          
          {/* Sidebar Navigation */}
          <aside style={{
            position: 'sticky',
            top: '90px',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Documentation Index
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {DOC_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: activeSection === sec.id ? '600' : '500',
                    color: activeSection === sec.id ? '#38bdf8' : '#94a3b8',
                    background: activeSection === sec.id ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{sec.icon}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.title}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Docs Body Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Section 1: Executive Summary */}
            <section id="overview" className="docs-card">
              <h2 className="docs-section-title">⚡ 1. Executive Summary</h2>
              <p className="docs-text">
                <strong>Jobnity</strong> is an AI-powered career roadmap and skill gap analysis platform designed to bridge the gap between job seekers' current technical competencies and industry job role requirements.
              </p>
              <p className="docs-text">
                By parsing resumes (PDF/DOCX), extracting structured candidate profiles using a taxonomy-based NLP engine, and performing weighted skill gap analysis against benchmark job roles, Jobnity generates personalized, actionable learning roadmaps.
              </p>
            </section>

            {/* Section 2: Architecture & Tech Stack */}
            <section id="architecture" className="docs-card">
              <h2 className="docs-section-title">🏗️ 2. System Architecture & Stack</h2>
              <div className="code-box">
                <pre>{`+-----------------------------------------------------------------------+
|                              FRONTEND                                 |
|   React 18 + Vite | Framer Motion | Recharts | React Router v7     |
|   Custom Vanilla CSS Design System (Glassmorphic Dark Theme)          |
+-----------------------------------------------------------------------+
                                   |
                             HTTPS / REST API
                                   v
+-----------------------------------------------------------------------+
|                               BACKEND                                 |
|   Python 3 + FastAPI | Uvicorn ASGI Server | Pydantic v2              |
|   Resume Parser (pypdf + python-docx)                                 |
|   NLP Taxonomy & Skill Normalizer Service                             |
|   Weighted Skill Gap Analysis & Guardrail Engine                      |
+-----------------------------------------------------------------------+
                                   |
                            SQLAlchemy ORM
                                   v
+-----------------------------------------------------------------------+
|                               DATABASE                                |
|   SQLite (jobnity.db)                                                 |
|   Pre-seeded: 52 Job Roles | 1,156 Skills | 1,321 Skill Aliases        |
|               125 Learning Resources                                  |
+-----------------------------------------------------------------------+`}</pre>
              </div>
            </section>

            {/* Section 3: Data Model */}
            <section id="schema" className="docs-card">
              <h2 className="docs-section-title">🗄️ 3. Data Model & Database Schema</h2>
              <p className="docs-text">
                The platform runs on 8 relational database tables pre-seeded from curated Kaggle dataset analysis:
              </p>
              <ul className="docs-list">
                <li><strong>job_roles</strong>: 52 standardized industry roles (e.g. Data Scientist, DevOps Engineer, Full Stack Developer).</li>
                <li><strong>skills</strong>: 1,156 canonical technical skills categorized into Domains and Subdomains.</li>
                <li><strong>skill_aliases</strong>: 1,321 synonym and acronym mappings (e.g. <code>JS</code> &rarr; <code>JavaScript</code>, <code>ReactJS</code> &rarr; <code>React</code>).</li>
                <li><strong>role_skills</strong>: Skill requirements per role with importance weights (<code>Required</code> vs <code>Preferred</code>) and priority scores (1-5).</li>
                <li><strong>learning_resources</strong>: 125 curated courses, documentation, and video links mapped to missing skills.</li>
                <li><strong>resumes</strong> &amp; <strong>candidate_profiles</strong>: Uploaded document records and parsed candidate entity data.</li>
                <li><strong>skill_gap_analyses</strong>: Historical evaluation records storing readiness scores, skill gap scores, and matched/missing skill breakdowns.</li>
              </ul>
            </section>

            {/* Section 4: Engine Logic */}
            <section id="engine" className="docs-card">
              <h2 className="docs-section-title">🧠 4. NLP & Skill Gap Engine Flow</h2>
              <h3 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '0.5rem', marginTop: '1rem' }}>Skill Gap Weighting Formula</h3>
              <p className="docs-text">
                Skill importance is calculated using weighted priority scoring:
              </p>
              <div className="code-box">
                <pre>{`Weight = Priority * (1.5 if Importance == "Required" else 1.0)

Readiness Score (%) = Round( (Sum of Earned Skill Weights / Sum of Total Role Weights) * 100 )

Skill Gap Score (%) = 100 - Readiness Score`}</pre>
              </div>

              <h3 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Distinct Skill Guardrails</h3>
              <p className="docs-text">
                Prevents false-positive skill overlap between distinct technologies:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                <span className="guard-chip">Java &ne; JavaScript</span>
                <span className="guard-chip">Docker &ne; Kubernetes</span>
                <span className="guard-chip">AWS &ne; Azure</span>
                <span className="guard-chip">Python &ne; PyTorch</span>
                <span className="guard-chip">C &ne; C++ / C#</span>
                <span className="guard-chip">React &ne; React Native</span>
              </div>
            </section>

            {/* Section 5: REST API Reference */}
            <section id="api" className="docs-card">
              <h2 className="docs-section-title">🔌 5. REST API Endpoint Reference</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div className="api-endpoint-card">
                  <span className="method-tag post">POST</span>
                  <code className="endpoint-path">/api/resumes/upload</code>
                  <p className="endpoint-desc">Upload PDF/DOCX resume file &amp; extract candidate profile.</p>
                </div>

                <div className="api-endpoint-card">
                  <span className="method-tag get">GET</span>
                  <code className="endpoint-path">/api/resumes/{'{resume_id}'}/profile</code>
                  <p className="endpoint-desc">Retrieve parsed candidate profile by resume ID.</p>
                </div>

                <div className="api-endpoint-card">
                  <span className="method-tag put">PUT</span>
                  <code className="endpoint-path">/api/resumes/{'{resume_id}'}/profile</code>
                  <p className="endpoint-desc">Update candidate profile (user skill confirmation).</p>
                </div>

                <div className="api-endpoint-card">
                  <span className="method-tag get">GET</span>
                  <code className="endpoint-path">/api/roles</code>
                  <p className="endpoint-desc">List all 52 benchmark job roles with category filtering.</p>
                </div>

                <div className="api-endpoint-card">
                  <span className="method-tag post">POST</span>
                  <code className="endpoint-path">/api/analysis/skill-gap</code>
                  <p className="endpoint-desc">Perform weighted skill gap analysis for a candidate &amp; target role.</p>
                </div>

                <div className="api-endpoint-card">
                  <span className="method-tag get">GET</span>
                  <code className="endpoint-path">/api/analysis/{'{analysis_id}'}/recommendations</code>
                  <p className="endpoint-desc">Fetch learning resources &amp; personalized roadmap steps for missing skills.</p>
                </div>

              </div>
            </section>

            {/* Section 6: Deployment & Ops */}
            <section id="deployment" className="docs-card">
              <h2 className="docs-section-title">🚀 6. Deployment &amp; Ops Guide</h2>
              
              <h3 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '0.5rem' }}>A. Docker Deployment</h3>
              <div className="code-box">
                <pre>{`# Build and run unified frontend + backend container
docker compose up -d --build

# Container exposes app on port 8001
curl http://localhost:8001/api/health`}</pre>
              </div>

              <h3 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '0.5rem', marginTop: '1.5rem' }}>B. Cloudflare Tunnel</h3>
              <div className="code-box">
                <pre>{`# Run active tunnel forwarding jobnity.thundercipher.xyz to local port 8001
cloudflared tunnel --config ~/.cloudflared/jobnity-config.yml run jobnity`}</pre>
              </div>
            </section>

          </div>
        </div>
      </main>

      <style>{`
        .tech-badge {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          font-size: 0.8rem;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-weight: 500;
        }

        .docs-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }

        .docs-section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
        }

        .docs-text {
          color: #cbd5e1;
          font-size: 0.95rem;
          line-height: 1.7;
          margin-bottom: 0.85rem;
        }

        .docs-list {
          color: #cbd5e1;
          font-size: 0.95rem;
          line-height: 1.8;
          padding-left: 1.25rem;
        }

        .code-box {
          background: #090d16;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          overflow-x: auto;
          font-family: 'Fira Code', monospace, sans-serif;
          font-size: 0.85rem;
          color: #38bdf8;
          line-height: 1.6;
          margin-top: 0.75rem;
        }

        .guard-chip {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.5rem 0.85rem;
          border-radius: 8px;
          text-align: center;
        }

        .api-endpoint-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.85rem 1.25rem;
        }

        .method-tag {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .method-tag.get { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); }
        .method-tag.post { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
        .method-tag.put { background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }

        .endpoint-path {
          font-family: monospace;
          color: #f8fafc;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .endpoint-desc {
          color: #94a3b8;
          font-size: 0.85rem;
          margin-left: auto;
        }

        @media (max-width: 900px) {
          .docs-grid {
            grid-template-columns: 1fr !important;
          }
          .docs-grid aside {
            display: none;
          }
          .api-endpoint-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .endpoint-desc {
            margin-left: 0;
          }
        }
      `}</style>
    </BackgroundLayout>
  )
}
