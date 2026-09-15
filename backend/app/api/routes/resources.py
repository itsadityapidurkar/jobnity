from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import CategorizedResourcesResponse
from app.services.resource_service import ResourceService

router = APIRouter(prefix="", tags=["Learning Resources"])

@router.get("/skills/{skill_id}/resources", response_model=CategorizedResourcesResponse, summary="Get Resources for Skill")
def get_skill_resources(skill_id: str, db: Session = Depends(get_db)):
    result = ResourceService.get_resources_by_skill(db, skill_id)
    return result
