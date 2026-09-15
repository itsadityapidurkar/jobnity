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

class ExperienceItem(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None

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

class MatchedSkillItem(BaseModel):
    skill_id: Optional[str] = None
    skill: str
    canonical_skill: Optional[str] = None
    candidate_level: str = "Intermediate"
    required_level: str = "Intermediate"
    status: str = "Matched"

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

class SkillGapStatistics(BaseModel):
    required_total: int = 0
    required_matched: int = 0
    required_missing: int = 0
    preferred_total: int = 0
    preferred_matched: int = 0
    preferred_missing: int = 0

class SkillGapResponse(BaseModel):
    analysis_id: str
    role: Dict[str, Any]
    skill_gap_score: int
    readiness_score: int
    matched_skills: List[MatchedSkillItem]
    missing_skills: List[MissingSkillItem]
    preferred_missing_skills: List[MissingSkillItem]
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
