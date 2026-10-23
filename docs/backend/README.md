# Jobnity Backend Architecture & Modular Learning Guide

Welcome to the **Jobnity Backend Engineering Documentation**. This folder contains comprehensive, production-grade architectural guides divided into **4 distinct self-contained learning modules** so individual engineers can master and take ownership of specific platform subsystems.

---

## 1. Modular Learning Breakdown & Team Ownership

Each document contains end-to-end component diagrams, mathematical formulas, algorithms, DB schemas, API specs, and verification suites:

| Module | Document | Focus Area & Capabilities | Recommended Owner |
| :--- | :--- | :--- | :--- |
| **Module 1** | [**`01_RESUME_PARSING_AND_NLP_ENGINE.md`**](./01_RESUME_PARSING_AND_NLP_ENGINE.md) | File validation, PyPDF2 & pdfplumber multi-tier text parsing, section segmentation, entity extraction (name, email, education, experience), and contextual skill evidence rating (0–5 proficiency levels). | **Engineer 1 (NLP & Ingestion Specialist)** |
| **Module 2** | [**`02_TAXONOMY_CATALOG_AND_LLM_ROLE_MATCHING.md`**](./02_TAXONOMY_CATALOG_AND_LLM_ROLE_MATCHING.md) | Standardized skills taxonomy, canonical alias mapping, distinct guardrails (Java vs JS), local Qwen 2.5 LLM Ollama integration, JSON schema enforcement, and heuristic role matching fallback. | **Engineer 2 (Taxonomy & Recommender Specialist)** |
| **Module 3** | [**`03_SKILL_GAP_ANALYSIS_AND_ROADMAPS.md`**](./03_SKILL_GAP_ANALYSIS_AND_ROADMAPS.md) | 4-way skill classification (Matched, Below Level, Transferable, Missing), multi-factor scoring formula (55% req, 25% prof, 10% qual, 10% pref), curated learning resources, and weekly roadmap sequencing. | **Engineer 3 (Gap Scoring & Curriculum Specialist)** |
| **Module 4** | [**`04_TECHNICAL_MOCK_INTERVIEW_AI_ENGINE.md`**](./04_TECHNICAL_MOCK_INTERVIEW_AI_ENGINE.md) | Anti-hallucination resume-grounded 3-question progression (Project Architecture, Production Bottlenecks, Role Security), real-time Qwen 2.5 answer evaluation (Relevance, Correctness, Clarity), and STAR feedback. | **Engineer 4 (AI Interview & Evaluation Specialist)** |

---

## 2. End-to-End System Workflow

The following diagram illustrates how data flows between the 4 modules during a user's session:

```
[Candidate uploads PDF/DOCX]
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│ MODULE 1: RESUME PARSING & EVIDENCE EXTRACTION          │
│ • Validates magic bytes and file limits (<10MB)         │
│ • PyPDF2 / pdfplumber fallback text parsing             │
│ • Section splitting & regex entity extraction           │
│ • Evidence scoring (0-5 proficiency, Strong/Mod/Weak)   │
└───────────────────────────┬─────────────────────────────┘
                            │ Verified Profile (Skills, Experience, Projects)
                            ▼
┌─────────────────────────────────────────────────────────┐
│ MODULE 2: TAXONOMY & LLM ELIGIBLE ROLE RECOMMENDER      │
│ • Canonical alias normalization & distinct guardrails   │
│ • Qwen 2.5 local LLM on Ollama (http://localhost:11434) │
│ • Evaluates eligibility (Match %, Fit Tier, Rationale)  │
│ • Deterministic heuristic fallback when offline         │
└───────────────────────────┬─────────────────────────────┘
                            │ Selected Target Role + Candidate Profile
                            ▼
┌─────────────────────────────────────────────────────────┐
│ MODULE 3: MULTI-FACTOR SKILL GAP & ROADMAP ENGINE       │
│ • 4-state classification: Matched / Below / Trans / Miss│
│ • Formula: 55% Req + 25% Prof + 10% Qual + 10% Pref     │
│ • Curated YouTube, Blog & Roadmap resource binding      │
│ • Milestone phase sequencing (Weeks 1-6)                │
└───────────────────────────┬─────────────────────────────┘
                            │ Target Role + Verified Projects
                            ▼
┌─────────────────────────────────────────────────────────┐
│ MODULE 4: RESUME-GROUNDED TECHNICAL MOCK INTERVIEW AI   │
│ • 3-Question progression grounded in real resume items  │
│ • Anti-hallucination prompt constraints                 │
│ • Real-time scoring: Relevance, Correctness, Clarity    │
│ • Constructive STAR feedback coaching                   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & Prerequisites

- **Language**: Python 3.10+ (tested on Python 3.14)
- **Web Framework**: FastAPI (Asynchronous REST API, Pydantic v2 schemas)
- **Database & ORM**: SQLite / PostgreSQL with SQLAlchemy 2.0
- **NLP & Document Parsing**: `PyPDF2`, `pdfplumber`, `python-docx`
- **Local AI / LLM**: `qwen2.5:3b` executed via Ollama (`http://localhost:11434`)
- **Testing Framework**: `pytest`, `pytest-asyncio`, `starlette.testclient`

---

## 4. Local Development Quickstart

### 4.1 Start Ollama LLM Engine:
Ensure Ollama is running with the Qwen 2.5 model loaded:
```bash
ollama run qwen2.5:3b
```

### 4.2 Run FastAPI Backend Server:
```bash
# From project root:
python3 -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8001 --reload
```
Interactive Swagger API documentation will be accessible at:
- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

### 4.3 Run Full Backend Test Suite:
```bash
python3 -m pytest backend/tests -v
```
All **61 tests** across all 4 modules should pass cleanly.
