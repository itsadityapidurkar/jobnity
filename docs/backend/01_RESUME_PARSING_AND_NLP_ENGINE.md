# Module 1: Resume Ingestion, Multi-Tier Text Parsing & Contextual Evidence Extraction

**Module Owner**: Engineer 1 (Resume Ingestion & NLP Specialist)  
**Package Path**: `backend/app/api/routes/resumes.py`, `backend/app/services/resume_parser.py`, `backend/app/services/nlp_extractor.py`, `backend/app/services/evidence_extractor.py`  
**Test Suite**: `backend/tests/test_api.py`, `backend/tests/test_education_extraction.py`, `backend/tests/test_experience_extraction.py`, `backend/tests/test_name_extraction.py`, `backend/tests/test_proficiency.py`

---

## 1. Module Overview & Lifecycle

Module 1 serves as the entry point of the entire Jobnity intelligence platform. It converts unstructured binary resume files (`.pdf`, `.docx`) into a structured, validated, canonical candidate profile backed by granular textual evidence.

```
+---------------------------------------------------------------------------------------------------+
|                                     MODULE 1 INGESTION PIPELINE                                   |
+---------------------------------------------------------------------------------------------------+
|  [Client Request]                                                                                 |
|         | multipart/form-data (.pdf / .docx)                                                      |
|         v                                                                                         |
|  [file_validation.py] ------> File signature checks, MIME whitelist, size bounds (<10MB)          |
|         |                                                                                         |
|         v                                                                                         |
|  [resume_parser.py] --------> Multi-tier extraction (PyPDF2 -> pdfplumber fallback -> python-docx)|
|         |                     Scanned image detection (length check < 20 characters)              |
|         v                                                                                         |
|  [nlp_extractor.py] --------> Section segmentation, Regex pattern matching                       |
|         |                     Name heuristic, Email/Phone, Education, Experience, Projects        |
|         v                                                                                         |
|  [evidence_extractor.py] ---> Contextual snippet extraction, Source mapping                       |
|         |                     Proficiency estimation (0-5), Strength rating (Strong/Mod/Weak)     |
|         v                                                                                         |
|  [PostgreSQL / SQLite] -----> Saves Resume, CandidateProfile, CandidateSkillEvidence              |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Component Architecture & File Responsibilities

### 2.1 File Validation (`backend/app/utils/file_validation.py`)
- **`validate_uploaded_file(file: UploadFile) -> Tuple[str, str, int]`**:
  - Validates file extension against allowed whitelist: `.pdf`, `.docx`.
  - Checks binary magic bytes: `%PDF-` for PDFs, `PK\x03\x04` for DOCX (ZIP format).
  - Enforces a 10MB maximum file size limit.
  - Sanitizes filenames removing path traversal tokens (`../`, null bytes).

### 2.2 Multi-Tier Text Parser (`backend/app/services/resume_parser.py`)
- **`ResumeParserService.parse_file(file_path: str, file_type: str) -> str`**:
  - Handles format branching between PDF and DOCX.
- **`ResumeParserService.extract_text_from_pdf(file_path: str) -> str`**:
  - **Tier 1**: Attempts extraction using `PyPDF2.PdfReader` for high-throughput digital PDFs.
  - **Tier 2 (Fallback)**: If PyPDF2 returns fewer than 50 characters or raises an exception, the parser automatically falls back to `pdfplumber.open()`, which handles complex columnar text layouts and ligatures.
  - **Scanned PDF Rejection**: If extracted text is under 20 characters after stripping whitespace, the engine raises an `HTTP 422 Unprocessable Content` exception:
    ```python
    if not text or len(text.strip()) < 20:
        raise HTTPException(
            status_code=422,
            detail="Scanned or image-only resumes cannot be processed. Please upload a digital PDF/DOCX."
        )
    ```
- **`ResumeParserService.extract_text_from_docx(file_path: str) -> str`**:
  - Uses `docx.Document` to read paragraphs and embedded table cells in chronological order.

---

## 3. NLP Extraction Pipeline (`backend/app/services/nlp_extractor.py`)

The extractor converts raw text into structured data using deterministic heuristics and regex:

### 3.1 Structural Section Segmentation
The raw resume text is partitioned into standard functional blocks:
- **`split_into_sections(raw_text: str) -> Dict[str, str]`**:
  - Uses regex to match typical headers: `SUMMARY`, `SKILLS`, `EXPERIENCE`, `WORK HISTORY`, `PROJECTS`, `EDUCATION`, `CERTIFICATIONS`.
  - Content between headers is isolated into dedicated string buffers.

### 3.2 Candidate Metadata Extraction
- **Name Extraction**:
  - Analyzes the first 4 lines of the resume.
  - Filters out headers, URLs, phone numbers, and common labels.
  - Matches 2-4 capitalized word tokens using heuristic weighting.
- **Contact Details**:
  - Email: `[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+`
  - Phone: `(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}`

### 3.3 Experience & Projects Parsing
- Identifies date intervals using regex (e.g., `Jan 2021 - Present`, `2019 - 2022`).
- Splits work blocks into: `company`, `role`, `start_date`, `end_date`, `duration_months`, and `description`.
- Projects are parsed with `name`, `technologies`, and `description`.

### 3.4 Skill Taxonomy Matching
- Matches words and phrases against the active database `skills` and `skill_aliases` tables.
- Leverages `SkillNormalizerService` to resolve shorthand:
  - `ml` $\rightarrow$ `machine learning`
  - `js` $\rightarrow$ `javascript`
  - `k8s` $\rightarrow$ `kubernetes`
  - `sklearn` $\rightarrow$ `scikit-learn`

---

## 4. Contextual Skill Evidence Extractor (`backend/app/services/evidence_extractor.py`)

Unlike shallow keyword counters, Jobnity creates an explainable audit trail for every skill detected.

### 4.1 Evidence Hierarchy & Priority
When a skill appears in multiple sections, the best evidence record is chosen based on this hierarchy:
1. **`work_experience`** (Priority 5) - Proven in commercial production.
2. **`certification`** (Priority 4) - Validated by an accredited certification body.
3. **`project`** (Priority 3) - Practical hands-on implementation.
4. **`education`** (Priority 2) - Academic foundation.
5. **`skills_section`** (Priority 1) - Declared keyword list.

### 4.2 Proficiency Level Estimation (0 to 5)

| Level | Label | Criteria |
| :--- | :--- | :--- |
| **0** | No Evidence | Skill not present in resume |
| **1** | Mentioned | Skill mentioned in passing without context |
| **2** | Basic | Listed in Skills section or academic project |
| **3** | Working | Commercial experience (3–12 months) or formal Certification |
| **4** | Proficient | Commercial experience (12–36 months) with strong action verbs |
| **5** | Advanced | Commercial experience (36+ months) with strong system impact |

### 4.3 Evidence Strength Algorithm
- **Strong**: Co-occurs with action verbs (*"architected"*, *"engineered"*, *"optimized"*, *"scaled"*, *"reduced latency"*) or quantifiable metrics (*"35% increase"*, *"10k QPS"*).
- **Moderate**: Found within descriptive project paragraphs (*"used Python to build API"*).
- **Weak**: Simple keyword listing without descriptive context.

---

## 5. Database Schema & Data Models

### `resumes` Table
```sql
CREATE TABLE resumes (
    resume_id VARCHAR PRIMARY KEY,
    filename VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    file_type VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    raw_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `candidate_profiles` Table
```sql
CREATE TABLE candidate_profiles (
    id VARCHAR PRIMARY KEY,
    resume_id VARCHAR UNIQUE REFERENCES resumes(resume_id),
    name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    education JSON,
    experience JSON,
    skills JSON,
    projects JSON,
    certifications JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `candidate_skill_evidence` Table
```sql
CREATE TABLE candidate_skill_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id VARCHAR REFERENCES candidate_profiles(id),
    skill VARCHAR NOT NULL,
    canonical_skill VARCHAR,
    evidence_text TEXT,
    evidence_type VARCHAR,      -- work_experience / project / certification / skills_section
    source_section VARCHAR,     -- experience / projects / skills
    strength VARCHAR,           -- strong / moderate / weak
    confidence FLOAT DEFAULT 0.5,
    estimated_months INTEGER,
    proficiency_level INTEGER,  -- 0 to 5
    proficiency_label VARCHAR,  -- Mentioned, Basic, Working, Proficient, Advanced
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. API Endpoints Specification

### 6.1 Upload Resume
- **Endpoint**: `POST /api/resumes/upload`
- **Content-Type**: `multipart/form-data`
- **Request**: `file: Binary`
- **Response**:
```json
{
  "resume_id": "R_c4b912a7",
  "filename": "Aditya_Software_Engineer.pdf",
  "profile": {
    "id": "prof_3d98e1fa",
    "name": "Aditya Pidurkar",
    "email": "aditya@example.com",
    "phone": "+91 9876543210",
    "skills": ["Python", "FastAPI", "React", "Docker", "PostgreSQL"],
    "experience": [
      {
        "role": "Backend Engineer",
        "company": "Tech Corp",
        "duration_months": 24,
        "description": "Architected high-throughput REST APIs using FastAPI and PostgreSQL."
      }
    ],
    "projects": [
      {
        "name": "Jobnity Platform",
        "technologies": "FastAPI, React, Ollama",
        "description": "AI-powered skill gap analyzer with real-time LLM interview simulation."
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Technology",
        "field_of_study": "Computer Science",
        "institution": "National Institute of Technology"
      }
    ]
  }
}
```

### 6.2 Update / Confirm Profile
- **Endpoint**: `PUT /api/resumes/{resume_id}/profile`
- **Content-Type**: `application/json`
- **Purpose**: Persists user edits made during Step 2 (Review Profile) before role matching.

---

## 7. Testing & Verification Guide

To test Module 1 independently:
```bash
# Run parsing and extraction unit tests
python3 -m pytest backend/tests/test_api.py -k "test_upload or test_scanned"
python3 -m pytest backend/tests/test_education_extraction.py
python3 -m pytest backend/tests/test_experience_extraction.py
python3 -m pytest backend/tests/test_name_extraction.py
python3 -m pytest backend/tests/test_proficiency.py
```
Expected output: **All tests green**.
