import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '../components/Navigation'
import BackgroundLayout from '../components/BackgroundLayout'

const MAIN_TABS = [
  { id: 'tech_stack', label: 'Tech Stack & Blueprint', icon: '⚡' },
  { id: 'backend', label: 'Backend Architecture (4 Modules)', icon: '🧠' },
  { id: 'frontend', label: 'Frontend & Motion Design', icon: '✨' },
  { id: 'deployment', label: 'Local Setup & Deployment', icon: '🚀' },
]

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('tech_stack')
  const [backendSubSection, setBackendSubSection] = useState('overview')

  return (
    <BackgroundLayout className="upload-layout">
      <Navigation />

      <main className="main-content-container docs-page-main">
        {/* Header Hero */}
        <div className="docs-hero-card">
          <div className="hero-badge-row">
            <span className="official-badge">Official Technical Guide</span>
            <span className="version-tag">v1.0.0 Architecture Suite</span>
            <span className="ai-badge">Qwen 2.5 Local AI</span>
          </div>
          <h1 className="docs-hero-title">Jobnity System Architecture &amp; Platform Guide</h1>
          <p className="docs-hero-description">
            A comprehensive technical guide to Jobnity's architecture: resume text extraction, skills taxonomy, role matching with local AI, skill gap calculations, and technical mock interviews.
          </p>

          {/* Top-Level Category Tabs with Shared Element Layout Morphing */}
          <div className="docs-tab-navigation" role="tablist" aria-label="Documentation Categories">
            {MAIN_TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`docs-tab-button ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ position: 'relative' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="docs-active-tab-indicator"
                      className="docs-tab-active-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="docs-tab-content">
                    <span className="docs-tab-icon">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content Panes with AnimatePresence */}
        <AnimatePresence mode="wait">
          {/* TAB 1: TECH STACK & SYSTEM BLUEPRINT */}
          {activeTab === 'tech_stack' && (
            <motion.div
              key="tech_stack"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="docs-tab-pane"
            >
              {/* Visual System Blueprint (Pictorial Representation) */}
              <section className="docs-card">
                <h2 className="docs-section-title">⚡ End-to-End System Blueprint</h2>
                <p className="docs-text">
                  Jobnity operates as a decoupled, privacy-first career intelligence platform. All resume parsing, taxonomy mapping, scoring math, and LLM inferences occur <strong>locally without external API exposure</strong>.
                </p>

                {/* Pictorial System Architecture Flow */}
                <div className="architecture-diagram-container">
                  <div className="arch-flow-col">
                    <div className="arch-box arch-box--client">
                      <div className="arch-box__tag">CLIENT LAYER</div>
                      <h4>React 18 + Vite</h4>
                      <ul>
                        <li>Framer Motion Shared Layouts</li>
                        <li>Lenis Kinetic Smooth Scroll</li>
                        <li>Executive Dark Canvas UI</li>
                        <li>Session State Synchronization</li>
                      </ul>
                    </div>
                  </div>

                  <div className="arch-connector">
                    <span className="connector-line" />
                    <span className="connector-label">HTTPS / REST API</span>
                    <span className="connector-arrow">→</span>
                  </div>

                  <div className="arch-flow-col">
                    <div className="arch-box arch-box--gateway">
                      <div className="arch-box__tag">API GATEWAY</div>
                      <h4>FastAPI + Python 3</h4>
                      <ul>
                        <li>Asynchronous Event Loop</li>
                        <li>Pydantic v2 Schema Validation</li>
                        <li>Multi-Tier PDF/DOCX Parser</li>
                        <li>Multi-Factor Scoring Engine</li>
                      </ul>
                    </div>
                  </div>

                  <div className="arch-connector">
                    <span className="connector-line" />
                    <span className="connector-label">IPC / HTTP</span>
                    <span className="connector-arrow">⇄</span>
                  </div>

                  <div className="arch-flow-col">
                    <div className="arch-box arch-box--ai">
                      <div className="arch-box__tag">INTELLIGENCE LAYER</div>
                      <h4>Ollama + Qwen 2.5:3b</h4>
                      <ul>
                        <li>Local LLM Runtime (Port 11434)</li>
                        <li>Role Eligibility Recommender</li>
                        <li>Grounded Question Generator</li>
                        <li>STAR Answer Evaluator</li>
                      </ul>
                    </div>
                    
                    <div className="arch-box arch-box--db" style={{ marginTop: '1rem' }}>
                      <div className="arch-box__tag">PERSISTENCE</div>
                      <h4>SQLite / PostgreSQL</h4>
                      <ul>
                        <li>SQLAlchemy 2.0 ORM</li>
                        <li>52 Benchmark Job Roles</li>
                        <li>1,156 Skills & 1,321 Aliases</li>
                        <li>Candidate Evidence Records</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Technology Stack Matrix */}
              <section className="docs-card" style={{ marginTop: '2rem' }}>
                <h2 className="docs-section-title">🧱 Core Technology Stack Matrix</h2>
                <div className="tech-matrix-grid">
                  <div className="tech-matrix-card">
                    <div className="tech-card-header">
                      <span className="tech-pill tech-pill--frontend">Frontend</span>
                      <h3>React 18 &amp; Vite 8</h3>
                    </div>
                    <p>Modern component architecture running with React Router v7, fast HMR bundling, and strict client optimizations.</p>
                    <div className="tech-card-meta">
                      <span>Vite 8.3</span>
                      <span>ESNext</span>
                    </div>
                  </div>

                  <div className="tech-matrix-card">
                    <div className="tech-card-header">
                      <span className="tech-pill tech-pill--motion">Motion</span>
                      <h3>Framer Motion &amp; Lenis</h3>
                    </div>
                    <p>Shared element layout morphing (<code>layoutId</code>) between cards, workflow steps, and tabs, combined with 60/120fps kinetic smooth scrolling.</p>
                    <div className="tech-card-meta">
                      <span>Framer Motion 13</span>
                      <span>Lenis 1.3</span>
                    </div>
                  </div>

                  <div className="tech-matrix-card">
                    <div className="tech-card-header">
                      <span className="tech-pill tech-pill--backend">Backend</span>
                      <h3>FastAPI &amp; Uvicorn</h3>
                    </div>
                    <p>High-throughput asynchronous Python web framework enforcing Pydantic v2 schemas, automated Swagger documentation, and CORS security.</p>
                    <div className="tech-card-meta">
                      <span>Python 3.10+</span>
                      <span>Starlette</span>
                    </div>
                  </div>

                  <div className="tech-matrix-card">
                    <div className="tech-card-header">
                      <span className="tech-pill tech-pill--ai">AI Engine</span>
                      <h3>Qwen 2.5 (3B) on Ollama</h3>
                    </div>
                    <p>Local inference runtime generating structured JSON completions in &lt;2.5s for eligible role recommendations and resume-grounded technical questions.</p>
                    <div className="tech-card-meta">
                      <span>Ollama API</span>
                      <span>Zero Cloud Latency</span>
                    </div>
                  </div>

                  <div className="tech-matrix-card">
                    <div className="tech-card-header">
                      <span className="tech-pill tech-pill--nlp">Document NLP</span>
                      <h3>PyPDF2 &amp; pdfplumber</h3>
                    </div>
                    <p>Multi-tier text ingestion with automated fallback for columnar layouts, image-only scanned document rejection, and regex entity segmentation.</p>
                    <div className="tech-card-meta">
                      <span>python-docx</span>
                      <span>Regex Heuristics</span>
                    </div>
                  </div>

                  <div className="tech-matrix-card">
                    <div className="tech-card-header">
                      <span className="tech-pill tech-pill--db">Database</span>
                      <h3>SQLAlchemy 2.0 &amp; SQLite</h3>
                    </div>
                    <p>Robust relational schema pre-seeded with 52 industry roles, 1,156 canonical skills, and 125 curated YouTube/documentation learning resources.</p>
                    <div className="tech-card-meta">
                      <span>SQLAlchemy 2.0</span>
                      <span>Relational Graph</span>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* TAB 2: BACKEND ARCHITECTURE & 4 MODULES */}
          {activeTab === 'backend' && (
            <motion.div
              key="backend"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="docs-tab-pane"
            >
              {/* Sub-navigation Jump Pills */}
              <div className="backend-subnav-bar">
                {[
                  { id: 'overview', label: 'Pipeline Overview' },
                  { id: 'module1', label: '1. Ingestion & NLP' },
                  { id: 'module2', label: '2. Taxonomy & Role Matching' },
                  { id: 'module3', label: '3. Skill Gap & Scoring' },
                  { id: 'module4', label: '4. Mock Interview AI' },
                  { id: 'database', label: 'Database ERD' },
                  { id: 'api_reference', label: 'REST API Reference' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`subnav-pill ${backendSubSection === item.id ? 'is-active' : ''}`}
                    onClick={() => {
                      setBackendSubSection(item.id)
                      const el = document.getElementById(`sec-${item.id}`)
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Section: Backend Pipeline Overview */}
              <section id="sec-overview" className="docs-card">
                <h2 className="docs-section-title">🧠 Backend End-to-End Execution Pipeline</h2>
                <p className="docs-text">
                  The backend executes a progressive, 4-stage analytical lifecycle. Each stage enriches the candidate context and enforces strict validation guardrails before proceeding:
                </p>

                {/* Pictorial Workflow Steps */}
                <div className="pictorial-steps-grid">
                  <div className="pictorial-step-card">
                    <div className="step-badge">Stage 1</div>
                    <h4>Ingestion &amp; Parsing</h4>
                    <p>Validates file signature, extracts digital text via PyPDF2/pdfplumber, segments sections, and rates contextual skill evidence (0-5 levels).</p>
                    <span className="step-tag">Module 1</span>
                  </div>

                  <div className="pictorial-step-card">
                    <div className="step-badge">Stage 2</div>
                    <h4>Taxonomy &amp; AI Matching</h4>
                    <p>Normalizes canonical aliases (JS &rarr; JavaScript), checks semantic guardrails (Java &ne; JS), and prompts Qwen 2.5 to recommend eligible tech roles.</p>
                    <span className="step-tag">Module 2</span>
                  </div>

                  <div className="pictorial-step-card">
                    <div className="step-badge">Stage 3</div>
                    <h4>Skill Gap &amp; Roadmaps</h4>
                    <p>Applies the 5-factor mathematical scoring formula (55% Req, 25% Prof, 10% Qual, 10% Pref), awards transferable credits, and binds weekly learning resources.</p>
                    <span className="step-tag">Module 3</span>
                  </div>

                  <div className="pictorial-step-card">
                    <div className="step-badge">Stage 4</div>
                    <h4>Resume-Grounded Interview</h4>
                    <p>Qwen 2.5 generates 3 technical deep-dive questions grounded in candidate's real resume projects, then evaluates answers across Relevance, Correctness, and Clarity.</p>
                    <span className="step-tag">Module 4</span>
                  </div>
                </div>
              </section>

              {/* MODULE 1 DEEP DIVE */}
              <section id="sec-module1" className="docs-card" style={{ marginTop: '2rem' }}>
                <div className="module-header-row">
                  <span className="module-indicator">Module 1</span>
                  <h2 className="docs-section-title" style={{ margin: 0 }}>Resume Ingestion, Text Parsing &amp; Evidence Extraction</h2>
                </div>
                <p className="docs-text">
                  <strong>Module Owner:</strong> Engineer 1 (Resume Ingestion &amp; NLP Specialist)<br />
                  <strong>Source Path:</strong> <code>backend/app/api/routes/resumes.py</code>, <code>backend/app/services/resume_parser.py</code>, <code>backend/app/services/evidence_extractor.py</code>
                </p>

                {/* Visual Parsing Flow */}
                <div className="visual-pipeline-box">
                  <div className="pipeline-title">Multi-Tier Parser &amp; Scanned PDF Rejection Fallback</div>
                  <div className="pipeline-flow-row">
                    <div className="pipeline-node">
                      <strong>Upload</strong>
                      <span>MIME &amp; Magic Bytes</span>
                    </div>
                    <span className="pipeline-arrow">&rarr;</span>
                    <div className="pipeline-node node--primary">
                      <strong>Tier 1: PyPDF2</strong>
                      <span>Fast Stream Extraction</span>
                    </div>
                    <span className="pipeline-arrow">&rarr;</span>
                    <div className="pipeline-node node--warning">
                      <strong>Tier 2: pdfplumber</strong>
                      <span>Layout Fallback (&lt;50 chars)</span>
                    </div>
                    <span className="pipeline-arrow">&rarr;</span>
                    <div className="pipeline-node node--danger">
                      <strong>Rejection Check</strong>
                      <span>&lt;20 chars &rarr; HTTP 422</span>
                    </div>
                  </div>
                </div>

                <h3 className="docs-subtitle">Proficiency Scoring &amp; Evidence Matrix (0 - 5 Levels)</h3>
                <p className="docs-text">
                  Unlike shallow keyword counters, Jobnity scores evidence based on commercial source context and duration:
                </p>

                <div className="table-responsive">
                  <table className="docs-table">
                    <thead>
                      <tr>
                        <th>Level</th>
                        <th>Label</th>
                        <th>Source Section</th>
                        <th>Duration / Criteria</th>
                        <th>Weight Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="lvl-pill lvl-5">5</span></td>
                        <td><strong>Advanced</strong></td>
                        <td>Work Experience</td>
                        <td>36+ Months in commercial production with strong action verbs</td>
                        <td>1.00 (Max)</td>
                      </tr>
                      <tr>
                        <td><span className="lvl-pill lvl-4">4</span></td>
                        <td><strong>Proficient</strong></td>
                        <td>Work Experience</td>
                        <td>12 - 36 Months in commercial production with architecture impact</td>
                        <td>0.85</td>
                      </tr>
                      <tr>
                        <td><span className="lvl-pill lvl-3">3</span></td>
                        <td><strong>Working</strong></td>
                        <td>Work Experience / Certs</td>
                        <td>3 - 12 Months work experience OR formal accredited Certification</td>
                        <td>0.65</td>
                      </tr>
                      <tr>
                        <td><span className="lvl-pill lvl-2">2</span></td>
                        <td><strong>Basic</strong></td>
                        <td>Projects / Skills Section</td>
                        <td>Implemented in practical portfolio project or listed explicitly</td>
                        <td>0.45</td>
                      </tr>
                      <tr>
                        <td><span className="lvl-pill lvl-1">1</span></td>
                        <td><strong>Mentioned</strong></td>
                        <td>Summary / Intro</td>
                        <td>Incidental mention without technical implementation details</td>
                        <td>0.20</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* MODULE 2 DEEP DIVE */}
              <section id="sec-module2" className="docs-card" style={{ marginTop: '2rem' }}>
                <div className="module-header-row">
                  <span className="module-indicator">Module 2</span>
                  <h2 className="docs-section-title" style={{ margin: 0 }}>Taxonomy Catalog &amp; Local LLM Role Recommender</h2>
                </div>
                <p className="docs-text">
                  <strong>Module Owner:</strong> Engineer 2 (Catalog, Taxonomy &amp; LLM Recommender Specialist)<br />
                  <strong>Source Path:</strong> <code>backend/app/api/routes/roles.py</code>, <code>backend/app/services/llm_service.py</code>, <code>backend/app/services/skill_normalizer.py</code>
                </p>

                <h3 className="docs-subtitle">Distinct Semantic Guardrails Matrix</h3>
                <p className="docs-text">
                  Hard boundaries enforced by <code>SkillNormalizerService</code> to prevent false-positive keyword overlap:
                </p>

                <div className="guardrails-matrix-grid">
                  <div className="guardrail-pair">
                    <span className="g-item g-left">Java</span>
                    <span className="g-versus">&ne;</span>
                    <span className="g-item g-right">JavaScript</span>
                  </div>
                  <div className="guardrail-pair">
                    <span className="g-item g-left">Docker</span>
                    <span className="g-versus">&ne;</span>
                    <span className="g-item g-right">Kubernetes</span>
                  </div>
                  <div className="guardrail-pair">
                    <span className="g-item g-left">AWS</span>
                    <span className="g-versus">&ne;</span>
                    <span className="g-item g-right">Azure</span>
                  </div>
                  <div className="guardrail-pair">
                    <span className="g-item g-left">Python</span>
                    <span className="g-versus">&ne;</span>
                    <span className="g-item g-right">PyTorch</span>
                  </div>
                  <div className="guardrail-pair">
                    <span className="g-item g-left">C++</span>
                    <span className="g-versus">&ne;</span>
                    <span className="g-item g-right">C#</span>
                  </div>
                  <div className="guardrail-pair">
                    <span className="g-item g-left">React</span>
                    <span className="g-versus">&ne;</span>
                    <span className="g-item g-right">React Native</span>
                  </div>
                </div>

                <h3 className="docs-subtitle" style={{ marginTop: '1.5rem' }}>Dual Role Recommendation Engine (Qwen 2.5 + Fallback)</h3>
                <p className="docs-text">
                  When a candidate confirms their profile in Step 2, <code>POST /api/roles/recommend</code> prompts Qwen 2.5 with verified skills, projects, and work history. If Ollama is offline or times out, the deterministic heuristic fallback executes immediately:
                </p>

                <div className="code-box">
                  <pre>{`# Structured JSON Output Schema enforced by Qwen 2.5 LLM
{
  "recommended_roles": [
    {
      "job_role": "Full Stack Developer",
      "match_score": 95,
      "fit_tier": "High Fit",
      "rationale": "Strong verified production alignment across Python, React, FastAPI, Docker, and PostgreSQL.",
      "matching_skills": ["python", "react", "fastapi", "docker", "postgresql"],
      "growth_skills": ["cloud architecture", "microservices"],
      "category": "Web Development"
    }
  ]
}`}</pre>
                </div>
              </section>

              {/* MODULE 3 DEEP DIVE */}
              <section id="sec-module3" className="docs-card" style={{ marginTop: '2rem' }}>
                <div className="module-header-row">
                  <span className="module-indicator">Module 3</span>
                  <h2 className="docs-section-title" style={{ margin: 0 }}>Multi-Factor Skill Gap Calculation &amp; Roadmaps</h2>
                </div>
                <p className="docs-text">
                  <strong>Module Owner:</strong> Engineer 3 (Gap Analysis, Scoring &amp; Curriculum Specialist)<br />
                  <strong>Source Path:</strong> <code>backend/app/api/routes/analysis.py</code>, <code>backend/app/services/skill_gap.py</code>, <code>backend/app/services/roadmap.py</code>
                </p>

                <h3 className="docs-subtitle">The 5-Factor Mathematical Alignment Formula</h3>
                <div className="formula-display-card">
                  <div className="math-equation">
                    Alignment Score = (0.55 &times; C<sub>req</sub> + 0.25 &times; P<sub>align</sub> + 0.10 &times; E<sub>qual</sub> + 0.10 &times; C<sub>pref</sub>) &times; 100 + B<sub>trans</sub>
                  </div>
                </div>

                <div className="formula-factors-grid">
                  <div className="factor-card">
                    <span className="factor-weight">55%</span>
                    <h4>Required Skill Coverage (C<sub>req</sub>)</h4>
                    <p>Ratio of required baseline skills satisfied by candidate evidence.</p>
                  </div>
                  <div className="factor-card">
                    <span className="factor-weight">25%</span>
                    <h4>Proficiency Alignment (P<sub>align</sub>)</h4>
                    <p>Measures whether candidate experience matches the seniority level demanded by the role.</p>
                  </div>
                  <div className="factor-card">
                    <span className="factor-weight">10%</span>
                    <h4>Evidence Quality (E<sub>qual</sub>)</h4>
                    <p>Weights production commercial work experience (1.0) higher than listed keywords (0.35).</p>
                  </div>
                  <div className="factor-card">
                    <span className="factor-weight">10%</span>
                    <h4>Preferred Skills (C<sub>pref</sub>)</h4>
                    <p>Extra competitive credit for complementary nice-to-have capabilities.</p>
                  </div>
                  <div className="factor-card bonus-card">
                    <span className="factor-weight">+5 Pts</span>
                    <h4>Transferable Bonus (B<sub>trans</sub>)</h4>
                    <p>Bonus credit when candidate has proven experience in adjacent sister tools (e.g. MySQL for Postgres).</p>
                  </div>
                </div>
              </section>

              {/* MODULE 4 DEEP DIVE */}
              <section id="sec-module4" className="docs-card" style={{ marginTop: '2rem' }}>
                <div className="module-header-row">
                  <span className="module-indicator">Module 4</span>
                  <h2 className="docs-section-title" style={{ margin: 0 }}>Resume-Grounded Technical Mock Interview AI Engine</h2>
                </div>
                <p className="docs-text">
                  <strong>Module Owner:</strong> Engineer 4 (AI Interview &amp; Evaluation Specialist)<br />
                  <strong>Source Path:</strong> <code>backend/app/api/routes/interview.py</code>, <code>backend/app/services/llm_service.py</code>
                </p>

                <h3 className="docs-subtitle">Anti-Hallucination 3-Question Progression Strategy</h3>
                <p className="docs-text">
                  Generic trivia is strictly prohibited by system prompt constraints. Questions probe real projects and architectures:
                </p>

                <div className="interview-timeline-box">
                  <div className="timeline-item">
                    <div className="timeline-num">1</div>
                    <div className="timeline-details">
                      <h4>Question 1: System Architecture &amp; Technical Trade-offs</h4>
                      <p>Grounded in the candidate's featured project (<code>projects[0]</code>). Probes data flow, latency handling, and why specific technologies were selected.</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-num">2</div>
                    <div className="timeline-details">
                      <h4>Question 2: Production Bottlenecks &amp; Debugging</h4>
                      <p>Grounded in previous company experience (<code>experience[0]</code>). Evaluates architectural debt, complex production outages, and scaling limits.</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-num">3</div>
                    <div className="timeline-details">
                      <h4>Question 3: Production Implementation &amp; Security</h4>
                      <p>Grounded in the target job role. Probes zero-downtime database migrations, CI/CD automation, and container security hardening.</p>
                    </div>
                  </div>
                </div>

                <h3 className="docs-subtitle" style={{ marginTop: '1.5rem' }}>Multi-Axis Answer Evaluation (0 - 100 Each)</h3>
                <div className="eval-axes-grid">
                  <div className="axis-card">
                    <span className="axis-title">Relevance Score</span>
                    <p>Measures whether the candidate addressed the exact scenario without deviating or deflecting.</p>
                  </div>
                  <div className="axis-card">
                    <span className="axis-title">Correctness Score</span>
                    <p>Verifies technical accuracy, architectural design patterns, protocol choices, and edge-case handling.</p>
                  </div>
                  <div className="axis-card">
                    <span className="axis-title">Clarity Score</span>
                    <p>Evaluates communication coherence, professional structure, and adoption of the STAR method.</p>
                  </div>
                </div>
              </section>

              {/* DATABASE ERD SECTION */}
              <section id="sec-database" className="docs-card" style={{ marginTop: '2rem' }}>
                <h2 className="docs-section-title">🗄️ Database Entity-Relationship Architecture</h2>
                <p className="docs-text">
                  The backend persistence model runs on 8 interconnected relational tables:
                </p>

                <div className="erd-visual-container">
                  <div className="erd-table-card">
                    <div className="erd-table-header">resumes</div>
                    <ul>
                      <li><code>resume_id (PK)</code></li>
                      <li><code>filename, file_path</code></li>
                      <li><code>file_type, file_size</code></li>
                      <li><code>raw_text, created_at</code></li>
                    </ul>
                  </div>

                  <div className="erd-arrow">&harr;</div>

                  <div className="erd-table-card">
                    <div className="erd-table-header">candidate_profiles</div>
                    <ul>
                      <li><code>id (PK)</code></li>
                      <li><code>resume_id (FK)</code></li>
                      <li><code>name, email, phone</code></li>
                      <li><code>education, experience (JSON)</code></li>
                      <li><code>skills, projects (JSON)</code></li>
                    </ul>
                  </div>

                  <div className="erd-arrow">&rarr;</div>

                  <div className="erd-table-card">
                    <div className="erd-table-header">candidate_skill_evidence</div>
                    <ul>
                      <li><code>id (PK)</code></li>
                      <li><code>profile_id (FK)</code></li>
                      <li><code>skill, canonical_skill</code></li>
                      <li><code>evidence_text, evidence_type</code></li>
                      <li><code>strength, proficiency_level</code></li>
                    </ul>
                  </div>
                </div>

                <div className="erd-visual-container" style={{ marginTop: '1rem' }}>
                  <div className="erd-table-card">
                    <div className="erd-table-header">job_roles</div>
                    <ul>
                      <li><code>role_id (PK)</code></li>
                      <li><code>job_role, category</code></li>
                      <li><code>role_description</code></li>
                      <li><code>experience_level</code></li>
                    </ul>
                  </div>

                  <div className="erd-arrow">&harr;</div>

                  <div className="erd-table-card">
                    <div className="erd-table-header">role_skills</div>
                    <ul>
                      <li><code>id (PK)</code></li>
                      <li><code>role_id (FK), skill</code></li>
                      <li><code>importance (Req/Pref)</code></li>
                      <li><code>priority (1-5)</code></li>
                      <li><code>minimum_level</code></li>
                    </ul>
                  </div>

                  <div className="erd-arrow">&harr;</div>

                  <div className="erd-table-card">
                    <div className="erd-table-header">skill_gap_analyses</div>
                    <ul>
                      <li><code>analysis_id (PK)</code></li>
                      <li><code>resume_id, role_id (FK)</code></li>
                      <li><code>readiness_score, gap_score</code></li>
                      <li><code>matched_skills, missing (JSON)</code></li>
                      <li><code>score_breakdown (JSON)</code></li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* REST API REFERENCE */}
              <section id="sec-api_reference" className="docs-card" style={{ marginTop: '2rem' }}>
                <h2 className="docs-section-title">🔌 REST API Endpoint Specifications</h2>
                <div className="api-endpoint-list">
                  <div className="api-endpoint-item">
                    <span className="method-tag post">POST</span>
                    <code>/api/resumes/upload</code>
                    <span className="ep-desc">Multipart upload (PDF/DOCX) &amp; extract candidate profile</span>
                  </div>

                  <div className="api-endpoint-item">
                    <span className="method-tag put">PUT</span>
                    <code>/api/resumes/{'{resume_id}'}/profile</code>
                    <span className="ep-desc">Update confirmed candidate skills and experience</span>
                  </div>

                  <div className="api-endpoint-item">
                    <span className="method-tag post">POST</span>
                    <code>/api/roles/recommend</code>
                    <span className="ep-desc">Qwen 2.5 local LLM role recommendations grounded in verified resume</span>
                  </div>

                  <div className="api-endpoint-item">
                    <span className="method-tag get">GET</span>
                    <code>/api/roles</code>
                    <span className="ep-desc">List all 52 benchmark job roles with category filters</span>
                  </div>

                  <div className="api-endpoint-item">
                    <span className="method-tag post">POST</span>
                    <code>/api/analysis/skill-gap</code>
                    <span className="ep-desc">Execute multi-factor weighted skill gap mathematical formula</span>
                  </div>

                  <div className="api-endpoint-item">
                    <span className="method-tag get">GET</span>
                    <code>/api/analysis/{'{id}'}/recommendations</code>
                    <span className="ep-desc">Retrieve prioritized learning curriculum and curated resources</span>
                  </div>

                  <div className="api-endpoint-item">
                    <span className="method-tag get">GET</span>
                    <code>/api/interview/status</code>
                    <span className="ep-desc">Check local Qwen 2.5 Ollama health and operational status</span>
                  </div>

                  <div className="api-endpoint-item">
                    <span className="method-tag post">POST</span>
                    <code>/api/interview/start</code>
                    <span className="ep-desc">Start 3-question interview screen &amp; generate Question 1</span>
                  </div>

                  <div className="api-endpoint-item">
                    <span className="method-tag post">POST</span>
                    <code>/api/interview/evaluate</code>
                    <span className="ep-desc">Evaluate technical answer across Relevance, Correctness, and Clarity</span>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* TAB 3: FRONTEND & MOTION DESIGN */}
          {activeTab === 'frontend' && (
            <motion.div
              key="frontend"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="docs-tab-pane"
            >
              <section className="docs-card">
                <h2 className="docs-section-title">✨ Frontend Architecture &amp; Motion System</h2>
                <p className="docs-text">
                  The frontend delivers an executive, low-latency pair-programming aesthetic using React 18, Vite, Framer Motion, and Lenis smooth kinetic scrolling.
                </p>

                <h3 className="docs-subtitle">Shared Element Layout Morphing (FLIP Projection)</h3>
                <p className="docs-text">
                  Instead of abrupt state snapping or disjointed opacity crossfades, elements physically morph their shape, position, and border glow across active states using spring physics:
                </p>

                <div className="motion-feature-grid">
                  <div className="motion-feature-card">
                    <div className="m-icon">🎯</div>
                    <h4>Global Navigation Tabs</h4>
                    <p>The active capsule glides smoothly between Analyse Resume, Roadmaps, Docs, and Interview using <code>layoutId="global-nav-active-pill"</code>.</p>
                  </div>

                  <div className="motion-feature-card">
                    <div className="m-icon">📈</div>
                    <h4>4-Step Workflow Bar</h4>
                    <p>Active state indicator capsule morphs across Step 1 (Upload) &rarr; Step 2 (Review) &rarr; Step 3 (Target Role) &rarr; Step 4 (Skill Gap).</p>
                  </div>

                  <div className="motion-feature-card">
                    <div className="m-icon">🏷️</div>
                    <h4>AI Eligible Role Cards</h4>
                    <p>Selecting any recommended role morphs an emerald active glow ring and "✓ Selected Target" badge directly to the newly clicked card.</p>
                  </div>

                  <div className="motion-feature-card">
                    <div className="m-icon">🎙️</div>
                    <h4>3-Question Interview Row</h4>
                    <p>The active step pill (Scenario &rarr; Architecture &rarr; Final Evaluation) glides smoothly as candidate answers are evaluated.</p>
                  </div>
                </div>

                <h3 className="docs-subtitle" style={{ marginTop: '2rem' }}>Lenis Kinetic Smooth Scrolling &amp; Accessibility</h3>
                <p className="docs-text">
                  Integrated with <code>prefers-reduced-motion: reduce</code> detection. When reduced motion is requested by the OS or user, smooth wheel inertia is turned off (<code>duration: 0</code>) and standard instant scrolling is restored to preserve accessibility.
                </p>
              </section>
            </motion.div>
          )}

          {/* TAB 4: SETUP & DEPLOYMENT */}
          {activeTab === 'deployment' && (
            <motion.div
              key="deployment"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="docs-tab-pane"
            >
              <section className="docs-card">
                <h2 className="docs-section-title">🚀 Local Development &amp; Test Suite Execution</h2>
                <p className="docs-text">
                  Follow these steps to run the complete Jobnity platform locally with full LLM capabilities:
                </p>

                <div className="setup-step-box">
                  <div className="step-num-badge">1</div>
                  <div className="step-content">
                    <h4>Launch Ollama with Qwen 2.5 (3B)</h4>
                    <p>Ensure Ollama is running and has downloaded the 3B quantized model:</p>
                    <div className="code-box"><pre>ollama run qwen2.5:3b</pre></div>
                  </div>
                </div>

                <div className="setup-step-box">
                  <div className="step-num-badge">2</div>
                  <div className="step-content">
                    <h4>Start FastAPI Backend Server (Port 8001)</h4>
                    <p>Run the backend using Uvicorn with auto-reload enabled:</p>
                    <div className="code-box"><pre>python3 -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8001 --reload</pre></div>
                  </div>
                </div>

                <div className="setup-step-box">
                  <div className="step-num-badge">3</div>
                  <div className="step-content">
                    <h4>Start Vite Frontend Dev Server (Port 5173)</h4>
                    <p>Launch the React client application:</p>
                    <div className="code-box"><pre>npm run dev</pre></div>
                  </div>
                </div>

                <div className="setup-step-box">
                  <div className="step-num-badge">4</div>
                  <div className="step-content">
                    <h4>Run Verification Test Suites</h4>
                    <p>Run both backend and frontend test runners:</p>
                    <div className="code-box"><pre>{`# Run all 61 backend pytest tests
python3 -m pytest backend/tests -v

# Run all 16 frontend vitest tests
npm test -- --run`}</pre></div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Scoped CSS for Modern Docs Portal */}
      <style>{`
        .docs-page-main {
          padding-bottom: 5rem;
          padding-top: 1.5rem;
          max-width: 1240px;
          margin: 0 auto;
          width: 100%;
        }

        .docs-hero-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(7, 11, 22, 0.85));
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2.25rem 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4);
        }

        .hero-badge-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.65rem;
          margin-bottom: 0.85rem;
        }

        .official-badge {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.2rem 0.65rem;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .version-tag {
          color: #94a3b8;
          font-size: 0.8rem;
          font-family: 'DM Mono', monospace;
        }

        .ai-badge {
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #7dd3fc;
          font-size: 0.7rem;
          font-family: 'DM Mono', monospace;
          padding: 0.15rem 0.55rem;
          border-radius: 9999px;
        }

        .docs-hero-title {
          font-size: clamp(1.6rem, 2.8vw, 2.2rem);
          font-weight: 800;
          color: #f8fafc;
          margin-bottom: 0.65rem;
          letter-spacing: -0.02em;
        }

        .docs-hero-description {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 820px;
          margin-bottom: 1.5rem;
        }

        /* Top-level Category Tabs */
        .docs-tab-navigation {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(3, 9, 24, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          padding: 0.35rem;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .docs-tab-navigation::-webkit-scrollbar {
          display: none;
        }

        .docs-tab-button {
          background: transparent;
          border: 0;
          border-radius: 999px;
          color: #94a3b8;
          font: 600 0.84rem 'Manrope', sans-serif;
          cursor: pointer;
          padding: 0.55rem 1.15rem;
          white-space: nowrap;
          transition: color 0.15s ease;
          user-select: none;
        }

        .docs-tab-button:hover:not(.is-active) {
          color: #f1f5f9;
        }

        .docs-tab-button.is-active {
          color: #04121d;
          font-weight: 800;
        }

        .docs-tab-active-pill {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: #9cebd9;
          box-shadow: 0 4px 16px rgba(156, 235, 217, 0.35);
          z-index: 0;
          pointer-events: none;
        }

        .docs-tab-content {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }

        .docs-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 1.85rem;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        }

        .docs-section-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 0.75rem;
          letter-spacing: -0.01em;
        }

        .docs-subtitle {
          font-size: 1.05rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .docs-text {
          color: #cbd5e1;
          font-size: 0.9rem;
          line-height: 1.65;
          margin-bottom: 0.85rem;
        }

        /* Pictorial Architecture Blueprint */
        .architecture-diagram-container {
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          gap: 0.5rem;
          margin: 1.5rem 0;
          overflow-x: auto;
          padding: 0.5rem 0;
        }

        .arch-flow-col {
          flex: 1;
          min-width: 240px;
          display: flex;
          flex-direction: column;
        }

        .arch-box {
          background: rgba(7, 11, 22, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.15rem;
          height: 100%;
        }

        .arch-box--client { border-top: 3px solid #38bdf8; }
        .arch-box--gateway { border-top: 3px solid #10b981; }
        .arch-box--ai { border-top: 3px solid #a855f7; }
        .arch-box--db { border-top: 3px solid #f59e0b; }

        .arch-box__tag {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.35rem;
        }

        .arch-box h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0 0 0.5rem;
        }

        .arch-box ul {
          margin: 0;
          padding-left: 1.1rem;
          color: #94a3b8;
          font-size: 0.76rem;
          line-height: 1.5;
        }

        .arch-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 0.5rem;
          min-width: 100px;
        }

        .connector-line {
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.15);
        }

        .connector-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          color: #7dd3fc;
          white-space: nowrap;
          margin: 0.3rem 0;
        }

        .connector-arrow {
          color: #7dd3fc;
          font-size: 0.85rem;
        }

        /* Tech Matrix Grid */
        .tech-matrix-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .tech-matrix-card {
          background: rgba(7, 11, 22, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .tech-card-header {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.5rem;
        }

        .tech-card-header h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0;
        }

        .tech-pill {
          display: inline-block;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          text-transform: uppercase;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          width: fit-content;
        }

        .tech-pill--frontend { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
        .tech-pill--motion { background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3); }
        .tech-pill--backend { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .tech-pill--ai { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
        .tech-pill--nlp { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .tech-pill--db { background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }

        .tech-matrix-card p {
          color: #94a3b8;
          font-size: 0.8rem;
          line-height: 1.5;
          margin: 0 0 1rem;
        }

        .tech-card-meta {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 0.65rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.68rem;
          color: #64748b;
        }

        /* Backend Subnav */
        .backend-subnav-bar {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          overflow-x: auto;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          scrollbar-width: none;
        }

        .backend-subnav-bar::-webkit-scrollbar {
          display: none;
        }

        .subnav-pill {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .subnav-pill:hover {
          color: #f1f5f9;
          border-color: rgba(56, 189, 248, 0.4);
        }

        .subnav-pill.is-active {
          background: rgba(56, 189, 248, 0.15);
          border-color: rgba(56, 189, 248, 0.45);
          color: #38bdf8;
        }

        .module-header-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.65rem;
        }

        .module-indicator {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(52, 211, 153, 0.35);
          color: #6ee7b7;
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
        }

        /* Visual Pipeline Diagram Box */
        .visual-pipeline-box {
          background: rgba(3, 9, 24, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1.25rem;
          margin: 1.25rem 0;
        }

        .pipeline-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 1rem;
        }

        .pipeline-flow-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .pipeline-node {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 0.65rem 0.95rem;
          display: flex;
          flex-direction: column;
          font-size: 0.76rem;
        }

        .pipeline-node strong { color: #f8fafc; margin-bottom: 0.15rem; }
        .pipeline-node span { color: #94a3b8; font-size: 0.68rem; font-family: 'DM Mono', monospace; }

        .pipeline-node.node--primary { border-color: rgba(56, 189, 248, 0.4); }
        .pipeline-node.node--warning { border-color: rgba(245, 158, 11, 0.4); }
        .pipeline-node.node--danger { border-color: rgba(239, 68, 68, 0.4); }

        .pipeline-arrow {
          color: #64748b;
          font-size: 1.1rem;
        }

        /* Docs Table */
        .table-responsive {
          overflow-x: auto;
          margin: 1rem 0;
        }

        .docs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }

        .docs-table th, .docs-table td {
          padding: 0.65rem 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          text-align: left;
        }

        .docs-table th {
          color: #94a3b8;
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          text-transform: uppercase;
        }

        .docs-table td { color: #cbd5e1; }

        .lvl-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-weight: 800;
          font-size: 0.7rem;
          font-family: 'DM Mono', monospace;
        }

        .lvl-5 { background: rgba(16, 185, 129, 0.2); color: #34d399; }
        .lvl-4 { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        .lvl-3 { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
        .lvl-2 { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        .lvl-1 { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }

        /* Guardrails Grid */
        .guardrails-matrix-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 0.75rem;
          margin: 1rem 0;
        }

        .guardrail-pair {
          background: rgba(7, 11, 22, 0.65);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 8px;
          padding: 0.65rem 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
          font-family: 'DM Mono', monospace;
        }

        .g-item { color: #f1f5f9; font-weight: 600; }
        .g-versus { color: #ef4444; font-weight: 800; font-size: 1rem; }

        /* Formula Card */
        .formula-display-card {
          background: rgba(3, 9, 24, 0.75);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 12px;
          padding: 1.25rem;
          margin: 1rem 0;
          text-align: center;
        }

        .math-equation {
          font-family: 'DM Mono', monospace;
          font-size: 0.95rem;
          color: #7dd3fc;
          font-weight: 600;
        }

        .formula-factors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.85rem;
          margin-top: 1rem;
        }

        .factor-card {
          background: rgba(7, 11, 22, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          padding: 1rem;
        }

        .factor-card.bonus-card {
          border-color: rgba(52, 211, 153, 0.35);
        }

        .factor-weight {
          font-family: 'DM Mono', monospace;
          font-size: 1.1rem;
          font-weight: 800;
          color: #38bdf8;
          display: block;
          margin-bottom: 0.25rem;
        }

        .factor-card.bonus-card .factor-weight {
          color: #34d399;
        }

        .factor-card h4 {
          font-size: 0.84rem;
          color: #f1f5f9;
          margin: 0 0 0.35rem;
        }

        .factor-card p {
          color: #94a3b8;
          font-size: 0.75rem;
          line-height: 1.45;
          margin: 0;
        }

        /* Timeline Box */
        .interview-timeline-box {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin: 1.25rem 0;
        }

        .timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: rgba(7, 11, 22, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 1rem 1.15rem;
        }

        .timeline-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
          font-family: 'DM Mono', monospace;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .timeline-details h4 {
          font-size: 0.9rem;
          color: #f8fafc;
          margin: 0 0 0.25rem;
        }

        .timeline-details p {
          color: #94a3b8;
          font-size: 0.78rem;
          line-height: 1.5;
          margin: 0;
        }

        .eval-axes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 0.85rem;
          margin-top: 1rem;
        }

        .axis-card {
          background: rgba(7, 11, 22, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 1rem;
        }

        .axis-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #38bdf8;
          display: block;
          margin-bottom: 0.35rem;
        }

        .axis-card p {
          color: #94a3b8;
          font-size: 0.76rem;
          margin: 0;
          line-height: 1.5;
        }

        /* ERD Visual Container */
        .erd-visual-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          overflow-x: auto;
          padding: 0.5rem 0;
        }

        .erd-table-card {
          flex: 1;
          min-width: 220px;
          background: rgba(7, 11, 22, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }

        .erd-table-header {
          background: rgba(56, 189, 248, 0.12);
          border-bottom: 1px solid rgba(56, 189, 248, 0.25);
          color: #7dd3fc;
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 0.45rem 0.85rem;
        }

        .erd-table-card ul {
          list-style: none;
          margin: 0;
          padding: 0.65rem 0.85rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          color: #cbd5e1;
          line-height: 1.6;
        }

        .erd-arrow {
          color: #64748b;
          font-size: 1.25rem;
          font-weight: 800;
        }

        /* API Endpoint List */
        .api-endpoint-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-top: 1rem;
        }

        .api-endpoint-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          background: rgba(7, 11, 22, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          flex-wrap: wrap;
        }

        .api-endpoint-item code {
          color: #f1f5f9;
          font-family: 'DM Mono', monospace;
          font-size: 0.82rem;
        }

        .ep-desc {
          color: #94a3b8;
          font-size: 0.78rem;
          margin-left: auto;
        }

        .method-tag {
          font-size: 0.68rem;
          font-family: 'DM Mono', monospace;
          font-weight: 800;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .method-tag.get { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35); }
        .method-tag.post { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.35); }
        .method-tag.put { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.35); }

        /* Motion Features */
        .motion-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .motion-feature-card {
          background: rgba(7, 11, 22, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .m-icon { font-size: 1.4rem; margin-bottom: 0.45rem; }
        .motion-feature-card h4 { color: #f1f5f9; font-size: 0.92rem; margin: 0 0 0.35rem; }
        .motion-feature-card p { color: #94a3b8; font-size: 0.78rem; margin: 0; line-height: 1.5; }

        /* Setup Steps */
        .setup-step-box {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: rgba(7, 11, 22, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }

        .step-num-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38bdf8;
          font-family: 'DM Mono', monospace;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-content h4 {
          color: #f1f5f9;
          font-size: 0.95rem;
          margin: 0 0 0.35rem;
        }

        .step-content p {
          color: #94a3b8;
          font-size: 0.8rem;
          margin: 0 0 0.65rem;
        }

        .code-box {
          background: #040813;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          overflow-x: auto;
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          color: #7dd3fc;
          line-height: 1.5;
        }

        .code-box pre {
          margin: 0;
        }

        @media (max-width: 768px) {
          .architecture-diagram-container {
            flex-direction: column;
          }
          .arch-connector {
            transform: rotate(90deg);
            padding: 0.85rem 0;
          }
          .erd-visual-container {
            flex-direction: column;
          }
          .erd-arrow {
            transform: rotate(90deg);
          }
          .ep-desc {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
    </BackgroundLayout>
  )
}
