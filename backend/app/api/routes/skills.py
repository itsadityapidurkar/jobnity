from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Skill
from app.schemas import SkillTaxonomyResponse

router = APIRouter(prefix="/skills", tags=["Skills Taxonomy"])

@router.get("", response_model=List[SkillTaxonomyResponse], summary="List / Search Skills Taxonomy")
def list_skills(
    search: Optional[str] = Query(None, description="Search query for skill name or category"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Skill)

    if search:
        query = query.filter(
            (Skill.skill.ilike(f"%{search}%")) |
            (Skill.category.ilike(f"%{search}%")) |
            (Skill.aliases.ilike(f"%{search}%"))
        )

    if category:
        query = query.filter(Skill.category.ilike(f"%{category}%"))

    skills = query.offset(skip).limit(limit).all()

    return [
        SkillTaxonomyResponse(
            skill_id=s.skill_id,
            skill=s.skill,
            category=s.category,
            sub_category=s.sub_category,
            description=s.description,
            aliases=s.aliases,
            parent_skill=s.parent_skill,
            related_skills=s.related_skills,
            prerequisite_skills=s.prerequisite_skills
        ) for s in skills
    ]

@router.get("/{skill_id}", response_model=SkillTaxonomyResponse, summary="Get Skill Taxonomy Details")
def get_skill_detail(skill_id: str, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.skill_id == skill_id).first()
    if not skill:
        skill = db.query(Skill).filter(Skill.skill.ilike(skill_id)).first()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill with ID or name '{skill_id}' not found in taxonomy."
        )

    return SkillTaxonomyResponse(
        skill_id=skill.skill_id,
        skill=skill.skill,
        category=skill.category,
        sub_category=skill.sub_category,
        description=skill.description,
        aliases=skill.aliases,
        parent_skill=skill.parent_skill,
        related_skills=skill.related_skills,
        prerequisite_skills=skill.prerequisite_skills
    )
