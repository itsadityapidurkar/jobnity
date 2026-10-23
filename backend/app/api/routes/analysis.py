from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import SkillGapRequest, SkillGapResponse, RecommendationResponse
from app.services.skill_gap import SkillGapService
from app.services.roadmap import RoadmapService
from app.services.career_recommender import get_career_recommendations

router = APIRouter(prefix="/analysis", tags=["Skill Gap Analysis"])

@router.post("/skill-gap", response_model=SkillGapResponse, summary="Perform Skill Gap Analysis")
def analyze_skill_gap(
    request: SkillGapRequest,
    db: Session = Depends(get_db)
):
    if not request.resume_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="resume_id is required for skill gap analysis."
        )

    target_role_id = request.role_id or request.target_role
    if not target_role_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="role_id or target_role is required for skill gap analysis."
        )

    result = SkillGapService.calculate_skill_gap(
        db=db,
        resume_id=request.resume_id,
        role_id=target_role_id,
        job_description=request.job_description
    )
    return result

@router.get("/{analysis_id}/recommendations", response_model=RecommendationResponse, summary="Get Recommended Learning Roadmaps")
def get_analysis_recommendations(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    result = RoadmapService.get_recommendations_for_analysis(db=db, analysis_id=analysis_id)
    return result

@router.get("/{analysis_id}/career-recommendations", summary="Get Explainable Career Recommendations")
def get_career_recs(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns ranked career recommendations:
    - priority_skills_to_learn (with reasons and resources)
    - alternative_roles (roles candidate is close to qualifying for)
    - high_leverage_skills (skills unlocking multiple roles)
    """
    return get_career_recommendations(db=db, analysis_id=analysis_id)

