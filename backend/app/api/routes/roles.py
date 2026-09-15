from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import JobRole, RoleSkill
from app.schemas import RoleResponse, RoleListResponse, RoleSkillListResponse, RoleSkillResponse

router = APIRouter(prefix="/roles", tags=["Job Roles"])

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
