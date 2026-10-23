# Jobnity Backend Architecture & Technical Master Guide

> **Authoritative Technical Documentation**  
> **Platform Version**: 1.0.0  
> **Backend Engine**: FastAPI + SQLAlchemy + Local Qwen 2.5 (3B) on Ollama  
> **Verification Status**: 61/61 Pytest Suites Passing  

---

## 1. High-Level System Architecture

Jobnity is structured around four decoupled backend micro-services operating on a single unified asynchronous FastAPI runtime. The platform operates **100% locally with zero cloud dependencies**, ensuring candidate resume data never leaves the local machine.

### 1.1 Complete End-to-End Architectural Blueprint

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (React 18 + Vite)"]
        UI_Upload["Step 1: Resume Upload\n(Dropzone / File Picker)"]
        UI_Review["Step 2: Profile Review\n(Candidate Confirms Skills)"]
        UI_Roles["Step 3: Target Role Selection\n(AI Matched Cards + Catalog)"]
        UI_Gap["Step 4: Skill Gap & Roadmap\n(Readiness Score & Resources)"]
        UI_Interview["Step 5: Technical Mock Interview\n(3-Question Resume-Grounded Screen)"]
    end

    subgraph Gateway["API Gateway Layer (FastAPI)"]
        R_Resumes["/api/resumes/*"]
        R_Roles["/api/roles/*"]
        R_Analysis["/api/analysis/*"]
        R_Interview["/api/interview/*"]
        R_Roadmaps["/api/roadmaps/*"]
        R_Resources["/api/skills/*"]
    end

    subgraph Engine1["Module 1: Ingestion & NLP Engine"]
        Val["File Validation\n(MIME, Magic Bytes, <10MB)"]
        Parser["Multi-Tier Parser\n(PyPDF2 -> pdfplumber -> docx)"]
        NLP["NLPExtractorService\n(Name, Contact, Education, Exp)"]
        Evidence["EvidenceExtractor\n(Context Snippets, 0-5 Proficiency)"]
    end

    subgraph Engine2["Module 2: Taxonomy & LLM Matching"]
        Taxonomy["SkillNormalizerService\n(Canonical Aliases, Guardrails)"]
        LLM_Roles["LLMService.match_eligible_roles\n(Qwen 2.5 on Ollama)"]
        Fallback_Roles["_fallback_role_matching\n(Deterministic Keyword Overlap)"]
    end

    subgraph Engine3["Module 3: Skill Gap & Roadmaps"]
        Classifier["4-State Skill Classifier\n(Matched, Below, Trans, Miss)"]
        Scorer["Multi-Factor Math Scorer\n(55% Req, 25% Prof, 10% Qual, 10% Pref)"]
        Curriculum["RoadmapService & ResourceService\n(YouTube, Blogs, Weekly Milestones)"]
    end

    subgraph Engine4["Module 4: Technical Mock Interview"]
        Grounding["Candidate Profile Resolver\n(Extracts Real Projects & Companies)"]
        LLM_QGen["3-Question Progression\n(Architecture, Bottlenecks, Security)"]
        LLM_Eval["Multi-Axis Evaluator\n(Relevance, Correctness, Clarity, STAR)"]
        Fallback_Interview["Resume-Grounded Fallback"]
    end

    subgraph Storage["Persistence & Intelligence Layer"]
        DB[(SQLite / PostgreSQL\nSQLAlchemy 2.0 ORM)]
        Ollama["Local Ollama Server\n(qwen2.5:3b at :11434)"]
    end

    UI_Upload -->|multipart/form-data| R_Resumes --> Val --> Parser --> NLP --> Evidence --> DB
    UI_Review -->|PUT JSON| R_Resumes --> DB
    UI_Roles -->|POST JSON| R_Roles --> Taxonomy
    Taxonomy --> LLM_Roles
    LLM_Roles -.->|HTTP POST /api/generate| Ollama
    LLM_Roles -.->|On Timeout/Error| Fallback_Roles
    LLM_Roles --> DB
    UI_Gap -->|POST JSON| R_Analysis --> Classifier --> Scorer --> Curriculum --> DB
    UI_Interview -->|POST JSON| R_Interview --> Grounding --> LLM_QGen
    LLM_QGen -.->|HTTP POST /api/generate| Ollama
    LLM_QGen -.->|On Timeout/Error| Fallback_Interview
    R_Interview --> LLM_Eval -.-> Ollama
```

---

## 2. Module 1: Resume Ingestion, Text Parsing & Evidence Extraction

Module 1 ingests unstructured binary documents (`.pdf`, `.docx`) and transforms them into verifiable, canonical candidate profiles.

### 2.1 Multi-Tier Parsing Flowchart

```mermaid
flowchart TD
    Start([Uploaded File]) --> ExtCheck{Extension Allowed?}
    ExtCheck -- No --> Err400[HTTP 400: Invalid Format]
    ExtCheck -- Yes --> MagicCheck{Magic Bytes Valid?\n%PDF- or PK\\x03\\x04}
    MagicCheck -- No --> Err422_Signature[HTTP 422: Tampered Document Signature]
    MagicCheck -- Yes --> SizeCheck{File Size <= 10MB?}
    SizeCheck -- No --> Err413[HTTP 413: Payload Too Large]
    SizeCheck -- Yes --> TypeCheck{File Type?}

    TypeCheck -- PDF --> Tier1["Tier 1: PyPDF2.PdfReader\n(High Throughput)"]
    Tier1 --> LenCheck1{Extracted chars >= 50?}
    LenCheck1 -- Yes --> CleanText[Normalize Whitespace & Ligatures]
    LenCheck1 -- No --> Tier2["Tier 2: pdfplumber.open\n(Columnar & Layout-Aware Fallback)"]
    Tier2 --> LenCheck2{Extracted chars >= 20?}
    LenCheck2 -- No --> ErrScanned[HTTP 422: Scanned/Image PDF Rejected]
    LenCheck2 -- Yes --> CleanText

    TypeCheck -- DOCX --> DocxParser["python-docx Document Reader\n(Paragraphs + Table Extraction)"]
    DocxParser --> CleanText

    CleanText --> SectionSplit["Section Boundary Segmenter\n(Regex Headers: Summary, Skills, Exp, Edu, Projects)"]
    SectionSplit --> NLP["NLPExtractorService\n(Name, Contact, Degrees, Work Intervals)"]
    NLP --> Evidence["extract_skill_evidence\n(Cross-Section Contextual Proof Scoring)"]
    Evidence --> SaveDB[(Save Resume, Profile & Evidence)]
```

### 2.2 Skill Evidence Scoring & Proficiency Matrix

Unlike keyword scrapers that count word frequency, Jobnity validates **where and how** a skill was used in production:

```mermaid
flowchart LR
    subgraph EvidenceSources["Evidence Source Priority"]
        direction TB
        E1["1. Work Experience (Priority 5)\nProven Commercial Production"]
        E2["2. Certifications (Priority 4)\nAccredited Verification"]
        E3["3. Projects (Priority 3)\nHands-on Practical Application"]
        E4["4. Education (Priority 2)\nAcademic Foundation"]
        E5["5. Skills Section (Priority 1)\nSelf-declared Keyword"]
    end

    subgraph ProficiencyOutput["Proficiency Rating (0 - 5)"]
        direction TB
        L5["Level 5: Advanced (36+ Months in Work Exp + Action Verbs)"]
        L4["Level 4: Proficient (12 - 36 Months in Work Exp)"]
        L3["Level 3: Working (3 - 12 Months Exp OR Formal Certification)"]
        L2["Level 2: Basic (Explicitly in Projects or Skills Section)"]
        L1["Level 1: Mentioned (Incidental mention without context)"]
        L0["Level 0: No Evidence (Not found in resume)"]
    end

    EvidenceSources --> ProficiencyOutput
```

---

## 3. Module 2: Taxonomy Catalog & Local LLM Role Recommender

Module 2 maps candidate competencies against standardized industry tech roles.

### 3.1 Taxonomy Canonicalization & Distinct Guardrails

```mermaid
flowchart TD
    RawInput["Raw Detected Skill Tokens\ne.g., 'k8s', 'js', 'postgres', 'docker'"] --> Normalizer["SkillNormalizerService"]
    Normalizer --> DB_Aliases[(skill_aliases Table)]
    DB_Aliases --> Canonical["Canonical Form\n'kubernetes', 'javascript', 'postgresql', 'docker'"]
    
    Canonical --> GuardrailCheck{"Distinct Guardrail Check\nPrevents False-Positive Collisions"}
    GuardrailCheck -->|Enforces Separation| G1["Java != JavaScript"]
    GuardrailCheck -->|Enforces Separation| G2["Docker != Kubernetes"]
    GuardrailCheck -->|Enforces Separation| G3["AWS != Azure"]
    GuardrailCheck -->|Enforces Separation| G4["Python != PyTorch"]
    GuardrailCheck -->|Enforces Separation| G5["C++ != C#"]
    GuardrailCheck -->|Enforces Separation| G6["React != React Native"]
```

### 3.2 Role Recommender Dual-Engine Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Candidate
    participant API as /api/roles/recommend
    participant Service as LLMService
    participant Ollama as Local Ollama Server (Qwen 2.5:3b)
    participant Fallback as _fallback_role_matching
    participant DB as Jobnity Database

    Candidate->>API: POST /roles/recommend (Skills, Experience, Projects)
    API->>DB: Query 60+ benchmark JobRoles for taxonomy alignment
    DB-->>API: Return standard catalog roles
    API->>Service: match_eligible_roles(profile, available_roles)
    
    alt Ollama Available & Responds within 3000ms
        Service->>Ollama: POST /api/generate (System Prompt + JSON Format)
        Ollama-->>Service: Structured JSON ({ recommended_roles: [...] })
        Service->>Service: Validate match_score (55-98) & Fit Tiers
    else Ollama Offline, Timeout, or Malformed JSON
        Service->>Fallback: Trigger deterministic keyword heuristic overlap
        Fallback-->>Service: Ranked benchmark matches with computed Fit Tiers
    end

    Service->>DB: Cross-reference role_id from job_roles table
    DB-->>Service: Return enriched roles with catalog IDs
    Service-->>API: Return Top 4-6 Recommended Role Cards
    API-->>Candidate: Render interactive cards with Match %, Rationale, and Skills
```

---

## 4. Module 3: Multi-Factor Skill Gap Engine & Curriculum Generator

Module 3 performs evidence-weighted mathematical gap analysis and builds structured roadmaps.

### 4.1 The 4-Way Skill Classification System

```mermaid
stateDiagram-v2
    [*] --> TargetRequirement: Inspect Role Skill Requirement

    TargetRequirement --> CheckCandidate: Search Candidate Profile & Evidence
    CheckCandidate --> Matched: Exact match found & Proficiency >= Required Level
    CheckCandidate --> BelowLevel: Exact match found BUT Proficiency < Required Level
    CheckCandidate --> CheckGraph: Exact match NOT found

    CheckGraph --> Transferable: Related skill exists in SkillRelationship graph
    CheckGraph --> Missing: No relation found

    Missing --> RequiredMissing: Importance == "Required" (Priority 1-5)
    Missing --> PreferredMissing: Importance == "Preferred" (Nice-to-have)

    Matched --> ScoringEngine
    BelowLevel --> ScoringEngine
    Transferable --> ScoringEngine
    RequiredMissing --> ScoringEngine
    PreferredMissing --> ScoringEngine
```

### 4.2 Multi-Factor Scoring Formula Breakdown

$$\mathbf{Role\ Alignment\ Score} = \left( 0.55 \cdot C_{\text{req}} + 0.25 \cdot P_{\text{align}} + 0.10 \cdot E_{\text{qual}} + 0.10 \cdot C_{\text{pref}} \right) \times 100 + B_{\text{trans}}$$

```mermaid
pie title Role Alignment Score Weight Distribution
    "Required Skill Coverage (55%)" : 55
    "Proficiency Alignment (25%)" : 25
    "Evidence Quality (10%)" : 10
    "Preferred Skills Coverage (10%)" : 10
```

1. **Required Skill Coverage ($C_{\text{req}}$ - 55%)**: Ratio of required core skills satisfied ($\frac{\text{Required Matched}}{\text{Total Required}}$).
2. **Proficiency Alignment ($P_{\text{align}}$ - 25%)**: Average ratio of candidate proficiency vs required role seniority ($\frac{\text{Candidate Level}}{\text{Required Level}}$).
3. **Evidence Quality ($E_{\text{qual}}$ - 10%)**: Production validation factor (Strong = 1.0, Moderate = 0.65, Weak = 0.35).
4. **Preferred Skills Coverage ($C_{\text{pref}}$ - 10%)**: Extra credit for secondary capabilities.
5. **Transferable Bonus ($B_{\text{trans}}$)**: Up to $+5\%$ bonus credit for sister technologies mapped via the knowledge graph.

---

## 5. Module 4: Resume-Grounded Technical Mock Interview AI

Module 4 conducts dynamic technical screens strictly referencing real resume achievements.

### 5.1 Anti-Hallucination Grounding Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Candidate
    participant InterviewRoute as /api/interview/start
    participant Resolver as Profile Resolver
    participant LLM as LLMService (Qwen 2.5:3b)
    participant Evaluator as /api/interview/evaluate

    Candidate->>InterviewRoute: POST /interview/start (resume_id, target_role)
    InterviewRoute->>Resolver: Extract verified projects, work exp, and stack
    Resolver-->>InterviewRoute: Grounding context (e.g. Project 'Jobnity Platform' with FastAPI)

    InterviewRoute->>LLM: generate_interview_question(profile, step=1)
    Note over LLM: Strict Prompt: Must inquire about real project architecture,<br/>latency handling, and tech trade-offs. No generic trivia.
    LLM-->>InterviewRoute: Return Grounded Question 1
    InterviewRoute-->>Candidate: Present Question 1 + Resume Grounding Pill

    Candidate->>Evaluator: POST /interview/evaluate (Question 1 + Candidate Answer)
    Evaluator->>LLM: evaluate_interview_answer(question, answer, target_role)
    Note over LLM: Evaluate 0-100 on Relevance, Correctness, Clarity.<br/>Generate STAR coaching feedback & strengths.
    LLM-->>Evaluator: JSON Scores + Actionable Feedback
    Evaluator-->>Candidate: Instant Scorecard & Advance Progress to Question 2
```

### 5.2 The 3-Question Structured Progression

```mermaid
timeline
    title 3-Question Technical Screen Progression
    Question 1 : System Architecture & Technical Trade-offs : Grounded in featured project : Evaluates design patterns, state handling, latency
    Question 2 : Production Bottlenecks & Debugging : Grounded in past company experience : Evaluates root-cause analysis, production scaling, outages
    Question 3 : Production Implementation & Security : Grounded in target role tech stack : Evaluates CI/CD, migration safety, container security
```

---

## 6. Complete Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    resumes ||--|| candidate_profiles : "1:1 contains"
    candidate_profiles ||--o{ candidate_skill_evidence : "1:N has evidence"
    job_roles ||--o{ role_skills : "1:N requires"
    skills ||--o{ skill_aliases : "1:N aliases"
    skills ||--o{ skill_relationships : "1:N source"
    skills ||--o{ learning_resources : "1:N mapped resources"
    resumes ||--o{ skill_gap_analyses : "1:N analyzed"
    job_roles ||--o{ skill_gap_analyses : "1:N target"

    resumes {
        string resume_id PK
        string filename
        string file_path
        string file_type
        int file_size
        text raw_text
        datetime created_at
    }

    candidate_profiles {
        string id PK
        string resume_id FK
        string name
        string email
        string phone
        json education
        json experience
        json skills
        json projects
        json certifications
    }

    candidate_skill_evidence {
        int id PK
        string profile_id FK
        string skill
        string canonical_skill
        text evidence_text
        string evidence_type
        string source_section
        string strength
        float confidence
        int estimated_months
        int proficiency_level
        string proficiency_label
    }

    job_roles {
        string role_id PK
        string job_role
        string category
        string sub_category
        text role_description
        string experience_level
    }

    role_skills {
        int id PK
        string role_id FK
        string skill
        string importance
        int priority
        string minimum_level
    }

    skills {
        string skill_id PK
        string skill
        string category
        string sub_category
        text description
    }

    skill_aliases {
        string alias PK
        string canonical_skill_id FK
        string canonical_skill
    }

    skill_relationships {
        int id PK
        string source_skill_id
        string relationship_type
        string target_skill_id
    }

    learning_resources {
        string resource_id PK
        string skill_id
        string skill
        string resource_type
        string title
        text url
        string difficulty
        float quality_score
    }

    skill_gap_analyses {
        string analysis_id PK
        string resume_id FK
        string role_id FK
        string target_role
        int readiness_score
        int skill_gap_score
        json matched_skills
        json missing_skills
        json score_breakdown
    }
```

---

## 7. Complete REST API Specifications

| Method | Endpoint | Description | Module |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/resumes/upload` | Upload PDF/DOCX resume file & extract candidate profile | Module 1 |
| `PUT` | `/api/resumes/{resume_id}/profile` | Update and confirm candidate verified skills & details | Module 1 |
| `POST` | `/api/roles/recommend` | Recommend eligible job roles grounded in candidate resume via Qwen 2.5 | Module 2 |
| `GET` | `/api/roles` | List all 52 benchmark job roles with category and level filters | Module 2 |
| `GET` | `/api/roles/{role_id}` | Retrieve specific job role metadata & description | Module 2 |
| `GET` | `/api/roles/{role_id}/skills` | Get required and preferred skills for a specific job role | Module 2 |
| `GET` | `/api/skills` | Search standardized taxonomy skills | Module 2 |
| `POST` | `/api/analysis/skill-gap` | Execute multi-factor weighted skill gap analysis | Module 3 |
| `GET` | `/api/analysis/{analysis_id}/recommendations` | Get prioritized learning roadmaps and curated resources | Module 3 |
| `GET` | `/api/analysis/{analysis_id}/career-recommendations` | Get alternative career roles and high-leverage skills | Module 3 |
| `GET` | `/api/roadmaps/roles/{role_id}` | Retrieve weekly structured roadmap for a specific job role | Module 3 |
| `GET` | `/api/interview/status` | Check local Qwen 2.5 LLM connectivity and status | Module 4 |
| `POST` | `/api/interview/start` | Initialize 3-question screen & generate Question 1 grounded in resume | Module 4 |
| `POST` | `/api/interview/evaluate` | Evaluate candidate answer across Relevance, Correctness, and Clarity | Module 4 |
| `GET` | `/api/health` | Health check endpoint | System |

---

## 8. Verification & Test Execution

Run the complete backend test suite:
```bash
# Full test suite (61 tests)
python3 -m pytest backend/tests -v

# Run individual subsystem tests
python3 -m pytest backend/tests/test_api.py               # API Endpoints & Ingestion
python3 -m pytest backend/tests/test_scoring.py           # Multi-Factor Math Formula
python3 -m pytest backend/tests/test_proficiency.py       # Evidence & Proficiency Matrix
python3 -m pytest backend/tests/test_interview.py         # Grounded Interview & STAR Evaluation
python3 -m pytest backend/tests/test_name_extraction.py   # Name Heuristics
python3 -m pytest backend/tests/test_experience_extraction.py # Work Experience Parsing
python3 -m pytest backend/tests/test_education_extraction.py  # Degree & Academic Parsing
```
