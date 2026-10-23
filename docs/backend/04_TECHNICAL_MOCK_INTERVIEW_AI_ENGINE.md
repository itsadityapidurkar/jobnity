# Module 4: Resume-Grounded Technical Mock Interview AI Engine & STAR Evaluation

**Module Owner**: Engineer 4 (AI Interview & Evaluation Specialist)  
**Package Path**: `backend/app/api/routes/interview.py`, `backend/app/services/llm_service.py`, `backend/app/schemas/__init__.py`  
**Test Suite**: `backend/tests/test_interview.py`, `backend/tests/test_api.py`

---

## 1. Module Overview & Problem Statement

Generic interview prep apps ask canned LeetCode or trivia questions (*"What is a Python decorator?"*). In real hiring loops, engineering managers probe the candidate's **actual technical decisions, architecture trade-offs, and past project bottlenecks**.

Module 4 implements an **anti-hallucination, resume-grounded AI interviewer** powered by local **Qwen 2.5 (3B)**. Every question is dynamically constructed using concrete projects, companies, and technologies extracted from the candidate's verified resume.

```
+---------------------------------------------------------------------------------------------------+
|                            MODULE 4 TECHNICAL MOCK INTERVIEW WORKFLOW                             |
+---------------------------------------------------------------------------------------------------+
|  [Profile Resolution]                                                                             |
|         Extract verified projects, previous company roles, and key tech stack                     |
|         v                                                                                         |
|  [POST /api/interview/start]                                                                      |
|         v                                                                                         |
|  [3-Question Grounded Progression]                                                                |
|         ├── Question 1: System Architecture & Tech Trade-offs on Featured Project                 |
|         ├── Question 2: Complex Production Bottlenecks & Problem Solving at Past Company          |
|         └── Question 3: Production Implementation, Reliability & Security in Target Role          |
|         v                                                                                         |
|  [POST /api/interview/evaluate]                                                                   |
|         v                                                                                         |
|  [Qwen 2.5 Multi-Dimensional Evaluation Engine]                                                   |
|         ├── Relevance Score (0-100)                                                               |
|         ├── Correctness Score (0-100)                                                             |
|         ├── Clarity Score (0-100)                                                                 |
|         ├── Constructive Actionable Feedback (STAR method coaching)                               |
|         ├── Strengths Identified (Concrete positive technical evidence)                           |
|         └── Areas for Improvement (Missing trade-offs, architecture gaps)                         |
|         v                                                                                         |
|  [Client Response & Real-time Progress Bar Updates]                                               |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Candidate Profile Resolution Engine (`_resolve_candidate_profile`)

To guarantee seamless state management across reloads or direct page navigation, the interview route accepts either a persistent database ID or the active session payload:

```python
def _resolve_candidate_profile(payload, db: Session) -> dict:
    # 1. Check database by resume_id
    if getattr(payload, "resume_id", None):
        rec = db.query(CandidateProfile).filter(CandidateProfile.resume_id == payload.resume_id).first()
        if rec: return format_profile(rec)
        
    # 2. Check database by candidate_id
    if getattr(payload, "candidate_id", None):
        rec = db.query(CandidateProfile).filter(CandidateProfile.id == payload.candidate_id).first()
        if rec: return format_profile(rec)
        
    # 3. Direct session payload fallback (instant execution without DB roundtrip)
    if getattr(payload, "candidate_profile", None):
        return payload.candidate_profile
```

---

## 3. The 3-Question Structured Progression

To prevent test fatigue and mirror standard 45-minute technical screen formats, the interview is capped at **exactly 3 technical deep-dive questions**:

### 3.1 Question 1: System Architecture & Technical Trade-offs
- **Grounding Target**: The candidate's featured hands-on projects (`projects[0]`).
- **Core Inquiry**: System topology, data flow, latency handling, and why specific technology trade-offs were made.
- **Example Generated Question**:
  > *"On your resume, you listed the project 'Jobnity Platform' utilizing FastAPI, React, and Ollama. Can you explain the system architecture, how you handled concurrent inference latency and state synchronization, and what technical trade-offs you evaluated while developing it?"*

### 3.2 Question 2: Production Bottlenecks & Real-World Problem Solving
- **Grounding Target**: Past company work experience (`experience[0]`).
- **Core Inquiry**: Root-cause analysis, production debugging, resolving architectural debt or scaling limits.
- **Example Generated Question**:
  > *"During your experience as a Backend Engineer at Tech Corp, what was the most complex technical bottleneck or architectural challenge you encountered with your PostgreSQL database, and what specific steps did you take to resolve it?"*

### 3.3 Question 3: Production Implementation, Reliability & Security
- **Grounding Target**: Primary technology stack applied to the **Target Job Role**.
- **Core Inquiry**: Production readiness, caching strategies, zero-downtime deployments, and security constraints.
- **Example Generated Question**:
  > *"Your resume indicates practical experience with Docker and PostgreSQL. In the context of your target role 'Full Stack Developer', how have you implemented automated database migrations and container security in production, and what were the most critical performance considerations?"*

---

## 4. Prompt Engineering for Grounded Generation

The LLM is strictly constrained via system prompt instructions to prevent hallucinated trivia:

```python
system_prompt = (
    "You are a principal technical interviewer conducting an authentic, rigorous technical screen. "
    f"The candidate is applying for '{role}'.\n"
    "CRITICAL MANDATE: You MUST formulate questions strictly referencing the candidate's actual projects, "
    "work experience, or declared technical stack provided in their verified profile below. "
    "Do NOT ask generic trivia (e.g. 'What is OOP?'). Inquire about system design choices, trade-offs, "
    "performance bottlenecks, or architectural decisions they actually made in their documented work.\n"
    "Output strictly valid JSON with keys: 'text', 'category', 'difficulty', 'referenced_resume_item', 'expected_topics'."
)
```

---

## 5. Deterministic Resume-Grounded Fallback Engine

If Ollama is offline or experiences an operating system delay, Jobnity **never shows generic placeholder questions**. The fallback engine directly inspects the candidate's projects and generates custom template-grounded inquiries:

```python
# Fallback snippet from backend/app/services/llm_service.py
if projects:
    p = projects[question_idx % len(projects)]
    p_name = p.get("name") or "one of your featured projects"
    p_tech = p.get("technologies") or (skills[0] if skills else "your chosen technology stack")
    chosen = (
        f"On your resume, you listed the project '{p_name}' utilizing {p_tech}. "
        f"Can you explain the system architecture, how you handled data consistency and latency, "
        f"and what specific technical trade-offs you evaluated while developing it?"
    )
    ref_item = f"Project: {p_name}"
```

---

## 6. Multi-Dimensional Answer Evaluation Pipeline

When the candidate submits an answer, the evaluation pipeline scores the response across three distinct axes:

### 6.1 Evaluation Criteria (0 to 100 Each):
1. **Relevance Score**: Did the candidate directly answer the technical question asked? Did they stay on topic?
2. **Correctness Score**: Are the stated architectural patterns, protocol choices, algorithms, and syntax accurate?
3. **Clarity Score**: Is the explanation well-structured, coherent, professional, and easy to follow?

### 6.2 Actionable Feedback Generation:
- **`feedback`**: 2–3 sentences of constructive coaching, encouraging structured methodologies (like the **STAR method**: Situation, Task, Action, Result).
- **`strengths`**: List of 1–3 concrete positive technical choices mentioned in the answer.
- **`areas_for_improvement`**: Specific gaps (e.g., *"Mention database indexing strategies"*, *"Clarify error handling on connection timeouts"*).

---

## 7. API Endpoints Specification

### 7.1 Check LLM Engine Status
- **Endpoint**: `GET /api/interview/status`
- **Response**:
```json
{
  "status": "online",
  "engine": "qwen2.5:3b",
  "base_url": "http://localhost:11434",
  "resume_grounding_enforced": true
}
```

### 7.2 Start Mock Interview Session
- **Endpoint**: `POST /api/interview/start`
- **Request Body**:
```json
{
  "role_id_or_title": "Full Stack Developer",
  "resume_id": "R_c4b912a7",
  "difficulty": "medium"
}
```
- **Response**:
```json
{
  "interview_id": "int_78f1a23b",
  "question": {
    "id": "q_4a8b192c",
    "text": "On your resume, you listed the project 'Jobnity Platform' utilizing FastAPI, React, and PostgreSQL. Can you explain the system architecture, how you handled asynchronous task execution, and what trade-offs you evaluated?",
    "category": "Architecture & System Design",
    "difficulty": "medium",
    "referenced_resume_item": "Project: Jobnity Platform",
    "expected_topics": ["FastAPI", "PostgreSQL", "Async/Await", "System Architecture"],
    "generator": "qwen2.5_resume_grounded"
  },
  "candidate": {
    "id": "prof_3d98e1fa",
    "name": "Aditya Pidurkar",
    "skills_count": 14
  }
}
```

### 7.3 Submit Answer & Receive Real-time Evaluation
- **Endpoint**: `POST /api/interview/evaluate`
- **Request Body**:
```json
{
  "interview_id": "int_78f1a23b",
  "question_id": "q_4a8b192c",
  "question": "On your resume, you listed the project 'Jobnity Platform'...",
  "answer": "We structured Jobnity using FastAPI as the asynchronous REST gateway. For heavy NLP parsing and Ollama LLM inference, we utilized background task execution with threading and persistent terminals to avoid blocking the main event loop...",
  "target_role": "Full Stack Developer"
}
```
- **Response**:
```json
{
  "relevance_score": 92,
  "correctness_score": 88,
  "clarity_score": 90,
  "feedback": "Excellent technical depth. You clearly articulated the rationale behind separating synchronous I/O from long-running inference tasks. To improve further, quantify the latency improvements achieved.",
  "strengths": [
    "Clear separation of concerns between web gateway and inference workers",
    "Concrete mention of non-blocking event loops in FastAPI"
  ],
  "areas_for_improvement": [
    "Discuss caching layers (e.g. Redis) for repeated queries",
    "Mention monitoring and circuit breakers"
  ],
  "scores": {
    "relevance": 92,
    "correctness": 88,
    "clarity": 90
  },
  "evaluator": "qwen2.5"
}
```

---

## 8. Testing & Verification Guide

To test Module 4 independently:
```bash
# Verify question generation, answer evaluation, and resume grounding
python3 -m pytest backend/tests/test_interview.py
```
Expected output: **6/6 passed (100% green)**.
