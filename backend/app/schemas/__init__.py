from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# --- RESUME SCHEMAS ---
class ResumeUploadResponse(BaseModel):
    resume_id: str
    filename: str
    status: str = "uploaded"
    profile: Optional[Dict[str, Any]] = None

class ResumeDetail(BaseModel):
    resume_id: str
    filename: str
    file_type: str
    file_size: int
    raw_text: Optional[str] = None

# --- CANDIDATE PROFILE SCHEMAS ---
class EducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    details: Optional[str] = None
    field: Optional[str] = None          # NEW: field of study
    ongoing: Optional[bool] = None       # NEW: currently studying
    confidence: Optional[float] = None   # NEW: extraction confidence

class ExperienceItem(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    duration_months: Optional[int] = None       # NEW: computed duration
    experience_type: Optional[str] = None       # NEW: full_time / internship / freelance
    current: Optional[bool] = None              # NEW: currently working here
    confidence: Optional[float] = None          # NEW: extraction confidence

class ProjectItem(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: Optional[str] = None

class CertificationItem(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None

class CandidateProfileBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: List[Any] = Field(default_factory=list)
    experience: List[Any] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[Any] = Field(default_factory=list)
    certifications: List[Any] = Field(default_factory=list)

class CandidateProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[List[Any]] = None
    experience: Optional[List[Any]] = None
    skills: Optional[List[str]] = None
    projects: Optional[List[Any]] = None
    certifications: Optional[List[Any]] = None

class CandidateProfileResponse(CandidateProfileBase):
    id: str
    resume_id: str

# --- JOB ROLE SCHEMAS ---
class RoleResponse(BaseModel):
    role_id: str
    job_role: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    role_description: Optional[str] = None
    experience_level: Optional[str] = None
    common_alternative_titles: Optional[str] = None
    industry: Optional[str] = None

class RoleListResponse(BaseModel):
    total: int
    roles: List[RoleResponse]

# --- ROLE SKILL & TAXONOMY SCHEMAS ---
class RoleSkillResponse(BaseModel):
    skill_id: Optional[str] = None
    skill: str
    skill_category: Optional[str] = None
    importance: str = "Required"  # Required vs Preferred
    priority: int = 3
    minimum_level: str = "Intermediate"
    skill_evidence: Optional[str] = None

class RoleSkillListResponse(BaseModel):
    role_id: str
    job_role: str
    skills: List[RoleSkillResponse]

class SkillTaxonomyResponse(BaseModel):
    skill_id: str
    skill: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    description: Optional[str] = None
    aliases: Optional[str] = None
    parent_skill: Optional[str] = None
    related_skills: Optional[str] = None
    prerequisite_skills: Optional[str] = None

# --- LEARNING RESOURCE SCHEMAS ---
class ResourceResponse(BaseModel):
    resource_id: str
    skill_id: Optional[str] = None
    skill: str
    resource_type: str  # YouTube, Blog, Roadmap
    title: str
    url: str
    provider: Optional[str] = None
    difficulty: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None

class CategorizedResourcesResponse(BaseModel):
    skill: str
    resources: Dict[str, List[ResourceResponse]]

# --- SKILL GAP ANALYSIS SCHEMAS ---
class SkillGapRequest(BaseModel):
    resume_id: Optional[str] = None
    profile_id: Optional[str] = None
    role_id: Optional[str] = None
    target_role: Optional[str] = None
    job_description: Optional[str] = None

class MatchedSkillItem(BaseModel):
    skill_id: Optional[str] = None
    skill: str
    canonical_skill: Optional[str] = None
    candidate_level: str = "Intermediate"
    required_level: str = "Intermediate"
    status: str = "Matched"
    # NEW additive fields
    match_type: Optional[str] = None              # exact / transferable / prerequisite
    candidate_proficiency: Optional[int] = None   # 0–5
    required_proficiency: Optional[int] = None    # 0–5
    evidence_text: Optional[str] = None
    evidence_strength: Optional[str] = None

class MissingSkillItem(BaseModel):
    skill_id: Optional[str] = None
    skill: str
    canonical_skill: Optional[str] = None
    importance: str = "Required"
    priority: int = 3
    minimum_level: str = "Intermediate"
    candidate_level: str = "Not Found"
    status: str = "Missing"
    reason: Optional[str] = None
    # NEW additive fields
    gap_type: Optional[str] = None                # missing / below_level / transferable
    candidate_proficiency: Optional[int] = None
    required_proficiency: Optional[int] = None
    transferable_from: Optional[str] = None
    relationship_type: Optional[str] = None

class ScoreBreakdown(BaseModel):
    required_skill_coverage: int = 0     # % — required skills matched
    proficiency_alignment: int = 0       # % — proficiency vs required level
    evidence_quality: int = 0            # % — strength of resume evidence
    preferred_skill_coverage: int = 0    # % — preferred skills matched
    transferable_credit: int = 0         # bonus points from transferable skills

class SkillGapStatistics(BaseModel):
    required_total: int = 0
    required_matched: int = 0
    required_missing: int = 0
    preferred_total: int = 0
    preferred_matched: int = 0
    preferred_missing: int = 0
    below_level_count: int = 0            # NEW
    transferable_count: int = 0           # NEW

class SkillGapResponse(BaseModel):
    analysis_id: str
    role: Dict[str, Any]
    skill_gap_score: int
    readiness_score: int
    role_alignment_score: Optional[int] = None    # NEW: renamed label
    score_breakdown: Optional[ScoreBreakdown] = None  # NEW
    score_explanation: Optional[str] = None           # NEW
    matched_skills: List[MatchedSkillItem]
    missing_skills: List[MissingSkillItem]
    preferred_missing_skills: List[MissingSkillItem]
    below_level_skills: List[MissingSkillItem] = Field(default_factory=list)   # NEW
    transferable_skills: List[MissingSkillItem] = Field(default_factory=list)  # NEW
    statistics: SkillGapStatistics

class RecommendationItem(BaseModel):
    skill: str
    importance: str
    priority: int
    youtube: List[ResourceResponse]
    articles: List[ResourceResponse]
    roadmap: List[ResourceResponse]

class RecommendationResponse(BaseModel):
    analysis_id: str
    target_role: str
    recommendations: List[RecommendationItem]

# --- INTERVIEW SCHEMAS (LLM QWEN 2.5 - RESUME-GROUNDED ONLY) ---
class InterviewStartRequest(BaseModel):
    resume_id: Optional[str] = None
    candidate_id: Optional[str] = None
    role_id_or_title: Optional[str] = None
    target_skill: Optional[str] = None
    difficulty: Optional[str] = "medium"
    candidate_profile: Optional[Dict[str, Any]] = None

class InterviewAnswerRequest(BaseModel):
    resume_id: Optional[str] = None
    candidate_id: Optional[str] = None
    interview_id: Optional[str] = None
    question_id: str
    question: str
    answer: str
    target_role: Optional[str] = None
    candidate_profile: Optional[Dict[str, Any]] = None

# --- ELIGIBLE ROLE RECOMMENDATION SCHEMAS (LLM QWEN 2.5) ---
class RoleRecommendationRequest(BaseModel):
    resume_id: Optional[str] = None
    candidate_id: Optional[str] = None
    candidate_profile: Optional[Dict[str, Any]] = None
    skills: Optional[List[str]] = None
    limit: Optional[int] = 5

class RecommendedRoleItem(BaseModel):
    job_role: str
    match_score: int
    fit_tier: str
    rationale: str
    matching_skills: List[str] = Field(default_factory=list)
    growth_skills: List[str] = Field(default_factory=list)
    category: Optional[str] = "Engineering"
    role_id: Optional[str] = None
    engine: Optional[str] = "qwen2.5"

class RoleRecommendationResponse(BaseModel):
    recommendations: List[RecommendedRoleItem]
    total_evaluated: int
    engine: str = "qwen2.5"

