# Module 2: Taxonomy Catalog, Role Matrices & Local LLM Eligible Role Recommender

**Module Owner**: Engineer 2 (Catalog, Taxonomy & LLM Recommender Specialist)  
**Package Path**: `backend/app/api/routes/roles.py`, `backend/app/api/routes/skills.py`, `backend/app/services/llm_service.py`, `backend/app/services/skill_normalizer.py`  
**Test Suite**: `backend/tests/test_api.py` (`test_get_roles`, `test_get_role_detail`, `test_get_role_skills`, `test_recommend_eligible_roles`, `test_skill_normalization`)

---

## 1. Module Overview & Workflow

Module 2 bridges raw candidate competencies with the employment market. It powers the standardized technology taxonomy and connects the local **Qwen 2.5 (3B)** LLM to analyze verified resume profiles and recommend the most eligible job roles with explainable fit scores.

```
+---------------------------------------------------------------------------------------------------+
|                              MODULE 2 ROLE MATCHING & TAXONOMY PIPELINE                           |
+---------------------------------------------------------------------------------------------------+
|  [Verified Profile from Module 1]                                                                 |
|         | Candidate skills, experience, projects                                                  |
|         v                                                                                         |
|  [Taxonomy & SkillNormalizerService]                                                              |
|         | Aliasing, Canonical Normalization, Distinct Guardrails (Java != JS, Docker != K8s)      |
|         v                                                                                         |
|  [POST /api/roles/recommend]                                                                      |
|         |                                                                                         |
|         +---> [Check Ollama Server] (http://localhost:11434)                                      |
|         |            |                                                                            |
|         |     (Ollama Available)                                                                  |
|         |            v                                                                            |
|         |     [Qwen 2.5 LLM Engine]                                                               |
|         |            | Prompt with skills, projects, and target catalog roles                     |
|         |            | Structured JSON output: job_role, match_score, fit_tier, rationale         |
|         |            v                                                                            |
|         +---> (Ollama Offline / Timeout / Malformed JSON)                                         |
|                      v                                                                            |
|               [_fallback_role_matching]                                                           |
|                      | Deterministic keyword & cluster overlap against benchmark tech roles       |
|                      v                                                                            |
|  [Enrichment & Response] ---> Attach database role_id, return Top 4-6 recommended role cards      |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Skills Taxonomy & Relationship Architecture

Jobnity does not rely on arbitrary string comparisons; it maintains a structured database of normalized skills and their inter-relationships.

### 2.1 Canonical Aliasing (`SkillNormalizerService`)
Candidates write skills in dozens of different formats (e.g., `React.js`, `reactjs`, `ReactJS`, `react`). The normalizer maps all variations to an official canonical string:

```python
# Aliasing examples from backend/app/services/skill_normalizer.py
"ml"           -> "machine learning"
"js"           -> "javascript"
"ts"           -> "typescript"
"k8s"          -> "kubernetes"
"sklearn"      -> "scikit-learn"
"postgres"     -> "postgresql"
"aws cloud"    -> "aws"
```

### 2.2 Critical Semantic Distinct Guardrails
To prevent false-positive matches, the system enforces hard distinction boundaries between phonetically or typographically similar technologies:

```python
DISTINCT_GUARDRAILS = [
    {"java", "javascript"},       # Completely different runtimes & paradigms
    {"docker", "kubernetes"},     # Containerization vs Orchestration
    {"aws", "azure"},             # Distinct cloud providers
    {"python", "pytorch"},        # General language vs ML framework
    {"c", "c++"},                 # Procedural vs Object-Oriented
    {"c++", "c#"},                # Native compilation vs .NET CLR
    {"react", "react native"},    # Web DOM vs Mobile bridge
    {"sql", "nosql"},             # Relational vs Document/Key-Value
    {"html", "css"},              # Structure vs Styling
    {"ruby", "ruby on rails"},    # Core language vs MVC framework
    {"go", "golang"}              # Handled as identical canonical aliases
]
```

---

## 3. Database Catalog & Role-Skill Matrix

### 3.1 Data Models (`backend/app/models/__init__.py`)
- **`JobRole`**: Stores the target job title, category (*Engineering*, *Security*, *Data & AI*, *Cloud*), sub-category, experience level (*Junior*, *Mid*, *Senior*), and description.
- **`RoleSkill`**: Defines the skill profile for each job role:
  - `importance`: `"Required"` (mandatory core skill) vs `"Preferred"` (bonus / nice-to-have).
  - `priority`: Numeric weight from `1` (low) to `5` (mission critical).
  - `minimum_level`: Expected proficiency (`"Beginner"`, `"Intermediate"`, `"Advanced"`, `"Expert"`).
- **`SkillRelationship`**: Graph edges between skills representing transferable competencies:
  - `relationship_type`: `"related"`, `"complementary"`, `"alternative"`, `"child"`, `"prerequisite"`.

---

## 4. Local LLM Role Recommender (`backend/app/services/llm_service.py`)

Jobnity operates **100% locally** using Ollama running `qwen2.5:3b`. No candidate data is ever sent to external cloud APIs.

### 4.1 System Prompt & Temperature Tuning
The prompt instructs the model to act as a senior technical assessor, matching real candidate evidence with standard catalog roles:

```python
system_prompt = (
    "You are an expert technical talent assessor and AI career strategist. "
    "Analyze the candidate's verified resume to determine which job roles they are most eligible for based on their real skills and experience. "
    "Recommend 4 to 6 specific, practical tech roles. "
    "For each role, provide: "
    "'job_role' (exact title), 'match_score' (integer 55-98), 'fit_tier' ('High Fit', 'Solid Fit', or 'Stretch Role'), "
    "'rationale' (1-2 sentences explaining why their specific resume skills and experience make them eligible), "
    "'matching_skills' (3-5 skills from their profile that directly qualify them), "
    "'growth_skills' (1-3 complementary skills to learn), "
    "'category' (e.g. 'Security', 'Engineering', 'Cloud', 'Data'). "
    "Output strictly valid JSON with key 'recommended_roles' containing this list."
)
```

### 4.2 Candidate Summary Optimization
To fit the model's context window with zero latency (< 2.5 seconds), the engine constructs a clean candidate profile digest:
- Verified skills (Top 25).
- Work experience roles & companies (Top 3).
- Hands-on project titles and technology stacks (Top 3).
- Catalog role title hints for database alignment.

### 4.3 Structured JSON Enforcement
Requests to Ollama pass `"format": "json"`:
```python
payload = {
    "model": "qwen2.5:3b",
    "prompt": prompt,
    "system": system_prompt,
    "stream": False,
    "format": "json",
    "options": {
        "temperature": 0.25,  # Low temperature ensures deterministic, factual output
        "top_p": 0.9
    }
}
```

---

## 5. Deterministic Heuristic Fallback Engine

If Ollama is momentarily busy, reloading, or offline, the system **never crashes or blocks the user**. It automatically falls back to `_fallback_role_matching`:

```python
standard_benchmarks = [
    {
        "job_role": "Cybersecurity Analyst",
        "category": "Security",
        "keywords": ["security", "siem", "splunk", "wireshark", "linux", "firewall", "soc", "penetration testing"],
        "growth": ["Threat Hunting", "Cloud Security (AWS/Azure)"]
    },
    {
        "job_role": "Full Stack Developer",
        "category": "Engineering",
        "keywords": ["python", "javascript", "react", "fastapi", "node", "postgresql", "docker", "rest"],
        "growth": ["GraphQL", "Microservices"]
    },
    ...
]
```
The algorithm computes keyword overlap, calculates a baseline score between 52% and 96%, categorizes the fit tier (`High Fit` $\ge 82\%$, `Solid Fit` $\ge 70\%$, `Stretch Role` $< 70\%$), and outputs identical JSON schemas so the frontend consumes it seamlessly.

---

## 6. API Endpoints Specification

### 6.1 Recommend Eligible Roles
- **Endpoint**: `POST /api/roles/recommend`
- **Request Body**:
```json
{
  "skills": ["Python", "FastAPI", "React", "Docker", "PostgreSQL"],
  "resume_id": "R_c4b912a7",
  "limit": 4
}
```
- **Response**:
```json
{
  "recommendations": [
    {
      "job_role": "Full Stack Developer",
      "match_score": 95,
      "fit_tier": "High Fit",
      "rationale": "The candidate has experience with Python, React, FastAPI, Docker, and PostgreSQL, which are essential for a Full Stack Developer role.",
      "matching_skills": ["python", "react", "fastapi", "docker", "postgresql"],
      "growth_skills": ["cloud technologies", "database administration", "API design"],
      "category": "Web Development",
      "role_id": "R004",
      "engine": "qwen2.5"
    },
    {
      "job_role": "Backend Developer",
      "match_score": 90,
      "fit_tier": "High Fit",
      "rationale": "The candidate's skills in Python, FastAPI, and PostgreSQL align directly with Backend Developer responsibilities.",
      "matching_skills": ["python", "fastapi", "postgresql"],
      "growth_skills": ["API design", "microservices"],
      "category": "Software Development",
      "role_id": "R002",
      "engine": "qwen2.5"
    }
  ],
  "total_evaluated": 4,
  "engine": "qwen2.5"
}
```

### 6.2 Browse Catalog Roles
- **Endpoint**: `GET /api/roles?search=Developer&limit=10`
- **Endpoint**: `GET /api/roles/{role_id}`
- **Endpoint**: `GET /api/roles/{role_id}/skills`

---

## 7. Testing & Verification Guide

To test Module 2 independently:
```bash
# Verify roles routes and taxonomy aliases
python3 -m pytest backend/tests/test_api.py -k "test_get_roles or test_recommend_eligible_roles or test_skill_normalization"
```
Expected output: **Passed (100% green)**.
