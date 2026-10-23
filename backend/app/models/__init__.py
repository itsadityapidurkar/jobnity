from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class JobRole(Base):
    __tablename__ = "job_roles"

    role_id = Column(String, primary_key=True, index=True)
    job_role = Column(String, index=True, nullable=False)
    category = Column(String, index=True)
    sub_category = Column(String)
    role_description = Column(Text)
    experience_level = Column(String)
    common_alternative_titles = Column(Text)
    industry = Column(String)
    source = Column(String)

class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(String, primary_key=True, index=True)
    skill = Column(String, index=True, nullable=False)
    category = Column(String, index=True)
    sub_category = Column(String)
    description = Column(Text)
    aliases = Column(Text)
    parent_skill = Column(String)
    related_skills = Column(Text)
    prerequisite_skills = Column(Text)
    skill_type = Column(String)
    technical_domain = Column(String)

class SkillAlias(Base):
    __tablename__ = "skill_aliases"

    alias = Column(String, primary_key=True, index=True)
    canonical_skill_id = Column(String, ForeignKey("skills.skill_id"))
    canonical_skill = Column(String, index=True)
    confidence = Column(String)

class SkillRelationship(Base):
    __tablename__ = "skill_relationships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_skill_id = Column(String)
    source_skill = Column(String)
    relationship_type = Column(String)
    target_skill_id = Column(String)
    target_skill = Column(String)

class RoleSkill(Base):
    __tablename__ = "role_skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(String, ForeignKey("job_roles.role_id"), index=True)
    job_role = Column(String, index=True)
    skill_id = Column(String, index=True)
    skill = Column(String, index=True, nullable=False)
    skill_category = Column(String)
    importance = Column(String, index=True)  # Required vs Preferred
    priority = Column(Integer, default=3)
    minimum_level = Column(String)
    frequency = Column(String)
    skill_evidence = Column(Text)

class LearningResource(Base):
    __tablename__ = "learning_resources"

    resource_id = Column(String, primary_key=True, index=True)
    skill_id = Column(String, index=True)
    skill = Column(String, index=True, nullable=False)
    resource_type = Column(String, index=True)  # YouTube, Blog, Roadmap
    title = Column(String, nullable=False)
    url = Column(Text, nullable=False)
    provider = Column(String)
    difficulty = Column(String)
    description = Column(Text)
    duration = Column(String)
    quality_score = Column(Float, default=4.5)
    relevance_score = Column(Float, default=4.5)
    verified = Column(Boolean, default=True)

class Resume(Base):
    __tablename__ = "resumes"

    resume_id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    raw_text = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(String, primary_key=True, index=True)
    resume_id = Column(String, ForeignKey("resumes.resume_id"), unique=True, nullable=False)
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    education = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    skills = Column(JSON, default=list)  # Candidate's confirmed skills
    projects = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class CandidateSkillEvidence(Base):
    """Evidence record for each skill detected in a candidate's resume."""
    __tablename__ = "candidate_skill_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_id = Column(String, ForeignKey("candidate_profiles.id"), index=True)
    skill = Column(String, index=True, nullable=False)
    canonical_skill = Column(String, index=True)
    evidence_text = Column(Text)
    evidence_type = Column(String)   # work_experience / project / education / certification / skills_section
    source_section = Column(String)  # experience / projects / education / skills / certifications
    strength = Column(String)        # strong / moderate / weak
    confidence = Column(Float, default=0.5)
    estimated_months = Column(Integer, nullable=True)  # estimated months of usage
    proficiency_level = Column(Integer, nullable=True) # 0-5 evidence-based estimate
    proficiency_label = Column(String, nullable=True)  # No Evidence / Mentioned / Basic / Working / Proficient / Advanced
    created_at = Column(DateTime, server_default=func.now())

class SkillGapAnalysis(Base):
    __tablename__ = "skill_gap_analyses"

    analysis_id = Column(String, primary_key=True, index=True)
    resume_id = Column(String, ForeignKey("resumes.resume_id"))
    role_id = Column(String, ForeignKey("job_roles.role_id"))
    target_role = Column(String, nullable=False)
    skill_gap_score = Column(Integer, nullable=False)
    readiness_score = Column(Integer, nullable=False)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    preferred_missing_skills = Column(JSON, default=list)
    below_level_skills = Column(JSON, default=list)   # NEW: skills present but below required level
    transferable_skills = Column(JSON, default=list)  # NEW: related/transferable skill matches
    statistics = Column(JSON, default=dict)
    score_breakdown = Column(JSON, default=dict)       # NEW: multi-factor breakdown
    score_explanation = Column(Text, nullable=True)    # NEW: human-readable explanation
    created_at = Column(DateTime, server_default=func.now())
