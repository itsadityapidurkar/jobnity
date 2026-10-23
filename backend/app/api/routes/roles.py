from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import JobRole, RoleSkill, CandidateProfile
from app.schemas import (
    RoleResponse, RoleListResponse, RoleSkillListResponse, RoleSkillResponse,
    RoleRecommendationRequest, RoleRecommendationResponse, RecommendedRoleItem
)
from app.services.llm_service import LLMService

router = APIRouter(prefix="/roles", tags=["Job Roles"])

@router.post("/recommend", response_model=RoleRecommendationResponse, summary="Recommend Eligible Job Roles via LLM")
def recommend_eligible_roles(
    req: RoleRecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates candidate's verified resume profile against tech job roles using Qwen 2.5 LLM.
    Returns matching job roles with match %, fit tier, rationale, and matching skills.
    """
    profile_dict: Dict[str, Any] = {}

    if req.candidate_profile and isinstance(req.candidate_profile, dict):
        profile_dict = dict(req.candidate_profile)
    elif req.resume_id or req.candidate_id:
        lookup_id = req.resume_id or req.candidate_id
        candidate = db.query(CandidateProfile).filter(
            (CandidateProfile.resume_id == lookup_id) | (CandidateProfile.id == lookup_id)
        ).first()
        if candidate:
            profile_dict = {
                "skills": candidate.skills or [],
                "experience": candidate.experience or [],
                "projects": candidate.projects or [],
                "education": candidate.education or [],
                "certifications": candidate.certifications or []
            }

    if not profile_dict.get("skills") and req.skills:
        profile_dict["skills"] = req.skills

    # Fetch available database roles for catalog alignment
    db_roles = db.query(JobRole).limit(80).all()
    available_roles = [
        {"role_id": r.role_id, "job_role": r.job_role, "category": r.category}
        for r in db_roles
    ]

    # Run LLM role matching with heuristic fallback
    matches = LLMService.match_eligible_roles(profile_dict, available_roles=available_roles)

    # Attach role_id if available in database
    enriched_items: List[RecommendedRoleItem] = []
    engine_used = "qwen2.5"

    for m in matches[:(req.limit or 6)]:
        role_title = m.get("job_role", "Software Engineer")
        engine_used = m.get("engine", engine_used)
        
        # Find matching DB role
        matched_db_role = next(
            (r for r in db_roles if r.job_role.lower() == role_title.lower() or role_title.lower() in r.job_role.lower()),
            None
        )

        role_id = matched_db_role.role_id if matched_db_role else None
        category = matched_db_role.category if matched_db_role and matched_db_role.category else m.get("category", "Engineering")

        enriched_items.append(
            RecommendedRoleItem(
                job_role=role_title,
                match_score=int(m.get("match_score", 75)),
                fit_tier=m.get("fit_tier", "Solid Fit"),
                rationale=m.get("rationale", ""),
                matching_skills=m.get("matching_skills", []),
                growth_skills=m.get("growth_skills", []),
                category=category,
                role_id=role_id,
                engine=m.get("engine", "qwen2.5")
            )
        )

    return RoleRecommendationResponse(
        recommendations=enriched_items,
        total_evaluated=len(enriched_items),
        engine=engine_used
    )

@router.get("", response_model=RoleListResponse, summary="List Job Roles")
def list_job_roles(
    search: Optional[str] = Query(None, description="Search query by job role name or category"),
    category: Optional[str] = Query(None, description="Filter by category"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(JobRole)

    if search:
        query = query.filter(
            (JobRole.job_role.ilike(f"%{search}%")) |
            (JobRole.category.ilike(f"%{search}%")) |
            (JobRole.sub_category.ilike(f"%{search}%"))
        )

    if category:
        query = query.filter(JobRole.category.ilike(f"%{category}%"))

    if experience_level:
        query = query.filter(JobRole.experience_level.ilike(f"%{experience_level}%"))

    total = query.count()
    roles = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "roles": [
            RoleResponse(
                role_id=r.role_id,
                job_role=r.job_role,
                category=r.category,
                sub_category=r.sub_category,
                role_description=r.role_description,
                experience_level=r.experience_level,
                common_alternative_titles=r.common_alternative_titles,
                industry=r.industry
            ) for r in roles
        ]
    }

@router.get("/{role_id}", response_model=RoleResponse, summary="Get Job Role Details")
def get_job_role(role_id: str, db: Session = Depends(get_db)):
    role = db.query(JobRole).filter(JobRole.role_id == role_id).first()
    if not role:
        role = db.query(JobRole).filter(JobRole.job_role.ilike(f"%{role_id}%")).first()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job role with ID or name '{role_id}' not found."
        )

    return RoleResponse(
        role_id=role.role_id,
        job_role=role.job_role,
        category=role.category,
        sub_category=role.sub_category,
        role_description=role.role_description,
        experience_level=role.experience_level,
        common_alternative_titles=role.common_alternative_titles,
        industry=role.industry
    )

@router.get("/{role_id}/skills", response_model=RoleSkillListResponse, summary="Get Skills for Job Role")
def get_role_skills(role_id: str, db: Session = Depends(get_db)):
    role = db.query(JobRole).filter(JobRole.role_id == role_id).first()
    if not role:
        role = db.query(JobRole).filter(JobRole.job_role.ilike(f"%{role_id}%")).first()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job role '{role_id}' not found."
        )

    role_skills = db.query(RoleSkill).filter(RoleSkill.role_id == role.role_id).all()
    if not role_skills:
        role_skills = db.query(RoleSkill).filter(RoleSkill.job_role.ilike(f"%{role.job_role}%")).all()

    return RoleSkillListResponse(
        role_id=role.role_id,
        job_role=role.job_role,
        skills=[
            RoleSkillResponse(
                skill_id=rs.skill_id,
                skill=rs.skill,
                skill_category=rs.skill_category,
                importance=rs.importance or "Required",
                priority=rs.priority or 3,
                minimum_level=rs.minimum_level or "Intermediate",
                skill_evidence=rs.skill_evidence
            ) for rs in role_skills
        ]
    )
