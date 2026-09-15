# Jobnity Backend API

Modular FastAPI backend for **Jobnity** — AI-Powered Resume Analysis, Skill Gap Profiling, and Learning Roadmap Engine.

> **Note**: The Interview/LLM module is intentionally disabled in the current scope as specified.

---

## 🛠 Tech Stack

- **Language**: Python 3.10+
- **Framework**: FastAPI (Async REST API & OpenAPI docs)
- **Validation**: Pydantic v2
- **ORM / Database**: SQLAlchemy (Database-agnostic ORM; defaults to SQLite `jobnity.db`, configurable to PostgreSQL)
- **PDF & DOCX Parsing**: `pypdf`, `python-docx`
- **Text Processing & NLP**: Regex patterns, Taxonomy matching, Levenshtein / Token similarity algorithms (No external LLM APIs required)
- **Testing**: `pytest`, `httpx`, `TestClient`

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI application entry point & CORS
│   ├── api/
│   │   └── routes/
│   │       ├── health.py           # GET /api/health
│   │       ├── resumes.py          # Upload, profile extraction & editing
│   │       ├── roles.py            # Job roles & required role skills
│   │       ├── skills.py           # Skills taxonomy
│   │       ├── analysis.py         # Skill gap analysis & recommendations
│   │       ├── roadmaps.py         # Role & skill learning roadmaps
│   │       └── resources.py        # Skill-specific learning resources
│   ├── core/
│   │   ├── config.py               # Environment configuration
│   │   └── database.py             # SQLAlchemy engine & session factory
│   ├── models/                     # SQLAlchemy ORM models
│   │   └── __init__.py             # JobRole, Skill, SkillAlias, RoleSkill, etc.
│   ├── schemas/                    # Pydantic request/response schemas
│   │   └── __init__.py
│   ├── services/                   # Core business logic
│   │   ├── resume_parser.py        # PDF & DOCX text extraction
│   │   ├── nlp_extractor.py        # Name, contact, skills, education extraction
│   │   ├── skill_normalizer.py     # Canonical taxonomy skill mapping
│   │   ├── skill_gap.py            # Transparent skill gap calculation
│   │   ├── resource_service.py     # Categorized resource retrieval
│   │   └── roadmap.py              # Learning recommendations & roadmaps
│   └── utils/
│       ├── file_validation.py      # Extension, MIME, size & safety check
│       └── text_processing.py      # Regex, text cleaning & section splitting
├── scripts/
│   └── import_datasets.py          # CSV dataset seed and import script
├── tests/
│   ├── conftest.py
│   └── test_api.py                 # Automated pytest test suite
├── .env.example                    # Environment variable template
├── requirements.txt                # Python dependencies
└── jobnity.db                      # SQLite database (generated on seed)
```

---

## 📊 Database Datasets Imported

The backend seeds from the following 5 CSV datasets:
1. `job_roles_dataset.csv` (52 Job roles & categories)
2. `skills_taxonomy_dataset.csv` (1,156 Skills taxonomy & relationships)
3. `skill_alias_mapping.csv` (1,321 Alias mappings)
4. `role_skills_dataset.csv` (527 Role-Skill associations with priority & minimum levels)
5. `learning_resources_dataset.csv` (125 Curated YouTube, Blog, and Roadmap resources)
6. `resume_dataset_clean.csv` (Sample candidate profiles for quick testing)

---

## 🧮 Skill Gap Scoring Formula

The Skill Gap score is calculated with complete transparency:

1. **Normalization**: Candidate skills (from user-edited profile) and required role skills are normalized into canonical forms using `skill_aliases` and `skills_taxonomy`.
2. **Matching & Guardrails**: Skills are matched via canonical string comparison and alias resolution. Distinct domain guardrails prevent false matches (e.g., `Java != JavaScript`, `Docker != Kubernetes`, `AWS != Azure`, `Python != PyTorch`).
3. **Weighting**:
   - `Weight = Priority * (1.5 if Required else 1.0)`
4. **Scores**:
   - $\text{Readiness Score} = \left(\frac{\sum \text{Earned Weights}}{\sum \text{Total Required Weights}}\right) \times 100$
   - $\text{Skill Gap Score} = \max(0, 100 - \text{Readiness Score})$

---

## 🚀 Running the Backend

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Import Datasets & Create Database
```bash
python scripts/import_datasets.py
```

### 3. Start Development Server
```bash
uvicorn app.main:app --reload --port 8001
```
- API Base URL: `http://localhost:8001/api`
- Interactive Swagger Docs: `http://localhost:8001/docs`
- ReDoc Docs: `http://localhost:8001/redoc`

---

## 🧪 Running Automated Tests

```bash
PYTHONPATH=. python -m pytest tests/test_api.py
```

---

## 🔗 Key API Endpoints

- `GET /api/health` — API health check
- `POST /api/resumes/upload` — Upload PDF/DOCX resume
- `GET /api/resumes/{resume_id}/profile` — Fetch candidate profile
- `PUT /api/resumes/{resume_id}/profile` — Update candidate profile (confirmed profile used for skill gap)
- `GET /api/roles` — List job roles
- `GET /api/roles/{role_id}/skills` — Required role skills
- `POST /api/analysis/skill-gap` — Execute Skill Gap Analysis
- `GET /api/analysis/{analysis_id}/recommendations` — Recommended learning roadmaps
- `GET /api/roadmaps/skills` — Skills available for roadmap exploration
- `GET /api/skills/{skill_id}/resources` — Resources grouped by YouTube, Articles, and Roadmaps
