from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.roadmap import RoadmapService

router = APIRouter(prefix="/roadmaps", tags=["Roadmaps"])

@router.get("/skills", summary="List Roadmap Skills")
def get_roadmap_skills(db: Session = Depends(get_db)):
    return RoadmapService.get_roadmap_skills(db)

@router.get("/roles/{role_id}", summary="Get Role Roadmap Details")
def get_role_roadmap(role_id: str, db: Session = Depends(get_db)):
    return RoadmapService.get_roadmap_by_role(db, role_id)
