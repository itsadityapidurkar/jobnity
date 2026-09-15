from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import SkillGapRequest, SkillGapResponse, RecommendationResponse
from app.services.skill_gap import SkillGapService
from app.services.roadmap import RoadmapService

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
        role_id=target_role_id
    )
    return result

@router.get("/{analysis_id}/recommendations", response_model=RecommendationResponse, summary="Get Recommended Learning Roadmaps")
def get_analysis_recommendations(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    result = RoadmapService.get_recommendations_for_analysis(db=db, analysis_id=analysis_id)
    return result
