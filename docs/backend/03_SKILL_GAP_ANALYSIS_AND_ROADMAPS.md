# Module 3: Multi-Factor Skill Gap Calculation, Evidence Alignment & Learning Roadmap Generation

**Module Owner**: Engineer 3 (Gap Analysis, Scoring & Curriculum Specialist)  
**Package Path**: `backend/app/api/routes/analysis.py`, `backend/app/api/routes/roadmaps.py`, `backend/app/api/routes/resources.py`, `backend/app/services/skill_gap.py`, `backend/app/services/resource_service.py`, `backend/app/services/roadmap.py`, `backend/app/services/career_recommender.py`  
**Test Suite**: `backend/tests/test_scoring.py`, `backend/tests/test_api.py` (`test_skill_gap_analysis`, `test_roadmaps_api`, `test_resource_retrieval`)

---

## 1. Module Overview & Workflow

Module 3 is the analytical core of Jobnity. It takes the verified candidate profile from Module 1 and the target role from Module 2, executes a multi-factor mathematical comparison against required and preferred skills, and generates structured learning roadmaps with curated YouTube and documentation resources.

```
+---------------------------------------------------------------------------------------------------+
|                            MODULE 3 SKILL GAP & CURRICULUM PIPELINE                               |
+---------------------------------------------------------------------------------------------------+
|  [Inputs] Candidate Profile (Skills + Evidence) + Selected Target Role (RoleSkills)               |
|                                                                                                   |
|  [Step 1: 4-Way Skill Classification]                                                             |
|         ├── Matched: Direct canonical match, proficiency >= required                              |
|         ├── Below Level: Canonical match, but candidate level < required                          |
|         ├── Transferable: Not an exact match, but related via SkillRelationship graph             |
|         └── Missing: No direct or transferable match found                                        |
|                                                                                                   |
|  [Step 2: Multi-Factor Mathematical Scoring]                                                      |
|         Formula: 55% Required + 25% Proficiency + 10% Evidence + 10% Preferred + Bonus            |
|                                                                                                   |
|  [Step 3: Roadmap Generation & Resource Binding]                                                  |
|         ├── Sort missing skills by Priority (1-5) and Importance (Required vs Preferred)          |
|         ├── Retrieve verified YouTube, Blog, and Documentation links                              |
|         └── Structure week-by-week progressive milestones                                         |
|                                                                                                   |
|  [Step 4: Persistence & Return]                                                                   |
|         Save SkillGapAnalysis record, return readiness_score, gap_score, and recommendations      |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. The 4-Way Skill Classification System

Unlike basic keyword intersection engines, Jobnity classifies every target role requirement into one of four distinct states:

### 2.1 Matched (`MatchedSkillItem`)
- The candidate possesses the exact canonical skill (or an accepted alias).
- The candidate's evidence-based proficiency meets or exceeds the role's `minimum_level`.
- Status: `"Matched"`, with full credit awarded.

### 2.2 Below Required Level (`BelowLevelSkillItem`)
- The candidate possesses the skill, but their documented evidence is lower than required (e.g., candidate is *Basic (Level 2)*, but role requires *Advanced (Level 4)*).
- Partial credit is awarded based on the ratio $\frac{\text{Candidate Level}}{\text{Required Level}}$.
- Status: `"Below Level"`.

### 2.3 Transferable Skill (`TransferableSkillItem`)
- The candidate lacks the exact tool, but has proven experience in a sister technology within the `skill_relationships` graph.
- Example: Target role requires **PostgreSQL**, but candidate has extensive experience in **MySQL** or **MariaDB**.
- Status: `"Transferable"`, awarded a transferable bonus credit.

### 2.4 Missing (`MissingSkillItem`)
- No direct, equivalent, or transferable evidence exists in the candidate's verified profile.
- Segregated into:
  - **Required Missing**: Critical gaps that block candidate readiness.
  - **Preferred Missing**: Secondary competencies that provide a competitive advantage.

---

## 3. The Mathematical Multi-Factor Scoring Formula

The alignment score is deterministic, fully explainable, and grounded in verifiable evidence.

$$\text{Role Alignment Score} = \left( 0.55 \cdot C_{\text{req}} + 0.25 \cdot P_{\text{align}} + 0.10 \cdot E_{\text{qual}} + 0.10 \cdot C_{\text{pref}} \right) \times 100 + B_{\text{trans}}$$

### 3.1 Mathematical Factor Definitions:

1. **Required Skill Coverage ($C_{\text{req}}$) — Weight: 55%**
   $$C_{\text{req}} = \frac{\text{Required Matched}}{\max(\text{Total Required Skills}, 1)}$$
   The single largest factor in the score. Without required skills, the candidate cannot perform core responsibilities.

2. **Proficiency Alignment ($P_{\text{align}}$) — Weight: 25%**
   $$P_{\text{align}} = \frac{1}{N_{\text{matched}}} \sum_{i=1}^{N_{\text{matched}}} \min\left(1.0, \frac{\text{Candidate Proficiency}_i}{\text{Required Proficiency}_i}\right)$$
   Measures whether the candidate is experienced enough for the seniority level of the role.

3. **Evidence Quality ($E_{\text{qual}}$) — Weight: 10%**
   $$E_{\text{qual}} = \frac{1}{N_{\text{matched}}} \sum_{i=1}^{N_{\text{matched}}} \text{Strength Value}_i$$
   Where Strong = `1.0`, Moderate = `0.65`, Weak = `0.35`. Rewards candidates with production work experience over keyword listings.

4. **Preferred Skills Coverage ($C_{\text{pref}}$) — Weight: 10%**
   $$C_{\text{pref}} = \frac{\text{Preferred Matched}}{\max(\text{Total Preferred Skills}, 1)}$$
   Rewards bonus competencies (e.g., GraphQL for a REST developer, Kubernetes for a backend engineer).

5. **Transferable Skill Bonus ($B_{\text{trans}}$)**
   $$B_{\text{trans}} = \min\left(5.0, \frac{\text{Transferable Count}}{\max(\text{Total Required}, 1)} \times 5.0\right)$$
   Adds up to +5 bonus points for related technology foundations.

### 3.2 Clamping & Skill Gap Derivation:
- $\text{Readiness Score} = \text{clamp}(0, 100, \text{round}(\text{Role Alignment Score}))$
- $\text{Skill Gap Score} = 100 - \text{Readiness Score}$

> **Disclaimer**: Jobnity clearly labels this score as an evidence-based gap estimate, not a hiring guarantee.

---

## 4. Curated Learning Resources Engine (`ResourceService`)

When gaps are identified, Jobnity connects the candidate to curated, verified learning materials stored in `learning_resources`.

### 4.1 Resource Categorization:
- **YouTube**: High-impact video crash courses, tutorials, and system design walkthroughs.
- **Articles / Blogs**: Deep-dive documentation, RFCs, and engineering architecture blogs.
- **Roadmaps**: Interactive step-by-step topic checklists.

### 4.2 Quality & Difficulty Filtering:
- Each resource contains a `difficulty` level (*Beginner*, *Intermediate*, *Advanced*), matched to the candidate's current baseline.
- Filtered by `quality_score >= 4.0` and `verified = True`.

---

## 5. Learning Roadmap Progression & Milestones (`RoadmapService`)

Rather than presenting an overwhelming list of missing skills, the curriculum engine sequences learning into weekly phases:

```
[Phase 1: Critical Core Foundations] (Weeks 1 - 2)
   └── Required Missing skills with Priority 5 (e.g., Docker, SQL)

[Phase 2: Architectural Depth & Frameworks] (Weeks 3 - 4)
   └── Required Missing skills with Priority 4 (e.g., Redis, FastAPI, Asynchronous queues)

[Phase 3: Production Hardening & Preferred Skills] (Weeks 5 - 6)
   └── Preferred Missing skills & Cloud Tools (e.g., AWS ECS, Terraform, CI/CD)
```

Each weekly milestone includes:
- Estimated completion hours (e.g., *6 hours*).
- Direct embedded YouTube and article URLs.
- Hands-on practical project suggestions to generate verified resume evidence.

---

## 6. API Endpoints Specification

### 6.1 Calculate Skill Gap
- **Endpoint**: `POST /api/analysis/skill-gap`
- **Request Body**:
```json
{
  "resume_id": "R_c4b912a7",
  "role_id": "R004",
  "job_description": "Optional pasted posting text..."
}
```
- **Response**:
```json
{
  "analysis_id": "SG_98a7b6c5",
  "target_role": "Full Stack Developer",
  "readiness_score": 82,
  "skill_gap_score": 18,
  "score_breakdown": {
    "required_skill_coverage": 85.0,
    "proficiency_alignment": 80.0,
    "evidence_quality": 88.0,
    "preferred_skill_coverage": 65.0,
    "transferable_credit": 2.5
  },
  "score_explanation": "Strong match for role. High alignment with required backend and database technologies.",
  "matched_skills": [
    {
      "skill": "Python",
      "canonical_skill": "python",
      "candidate_level": "Proficient",
      "required_level": "Intermediate",
      "status": "Matched",
      "evidence_text": "Architected high-throughput REST APIs using FastAPI and PostgreSQL.",
      "evidence_strength": "strong"
    }
  ],
  "missing_skills": [
    {
      "skill": "Docker",
      "importance": "Required",
      "priority": 5,
      "minimum_level": "Intermediate",
      "status": "Missing"
    }
  ],
  "preferred_missing_skills": [],
  "below_level_skills": [],
  "transferable_skills": [],
  "statistics": {
    "total_role_skills": 8,
    "matched_count": 6,
    "required_missing": 1,
    "preferred_missing": 1
  }
}
```

### 6.2 Get Learning Recommendations
- **Endpoint**: `GET /api/analysis/{analysis_id}/recommendations`
- **Response**: Returns categorized YouTube videos, articles, and roadmaps for each missing skill.

### 6.3 Explainable Career Recommendations
- **Endpoint**: `GET /api/analysis/{analysis_id}/career-recommendations`
- **Response**: Returns alternative job roles within 15% skill reach and high-leverage skills that unlock the most jobs.

---

## 7. Testing & Verification Guide

To test Module 3 independently:
```bash
# Verify math formulas, score breakdowns, and edge cases
python3 -m pytest backend/tests/test_scoring.py
python3 -m pytest backend/tests/test_api.py -k "test_skill_gap_analysis or test_roadmaps_api or test_resource_retrieval"
```
Expected output: **Passed (100% green)**.
