import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models import Resume, CandidateProfile
from app.schemas import (
    ResumeUploadResponse, CandidateProfileResponse, CandidateProfileUpdate
)
from app.utils.file_validation import validate_uploaded_file
from app.services.resume_parser import ResumeParserService
from app.services.nlp_extractor import NLPExtractorService

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload", response_model=ResumeUploadResponse, summary="Upload PDF/DOCX resume")
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    safe_name, file_type, file_size = validate_uploaded_file(file)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    # Save uploaded file
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Parse text
    raw_text = ResumeParserService.parse_file(file_path, file_type)

    # Generate Resume ID
    resume_id = f"R_{uuid.uuid4().hex[:8]}"

    # Save Resume record
    resume_record = Resume(
        resume_id=resume_id,
        filename=file.filename or safe_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        raw_text=raw_text
    )
    db.add(resume_record)

    # Extract NLP Profile
    extracted = NLPExtractorService.extract_profile(raw_text, db)

    # Create CandidateProfile record
    prof_id = f"prof_{uuid.uuid4().hex[:8]}"
    profile_record = CandidateProfile(
        id=prof_id,
        resume_id=resume_id,
        name=extracted.get("name"),
        email=extracted.get("email"),
        phone=extracted.get("phone"),
        education=extracted.get("education", []),
        experience=extracted.get("experience", []),
        skills=extracted.get("skills", []),
        projects=extracted.get("projects", []),
        certifications=extracted.get("certifications", [])
    )
    db.add(profile_record)
    db.commit()
    db.refresh(profile_record)

    return {
        "resume_id": resume_id,
        "filename": file.filename or safe_name,
        "status": "uploaded",
        "profile": {
            "id": prof_id,
            "resume_id": resume_id,
            "name": profile_record.name,
            "email": profile_record.email,
            "phone": profile_record.phone,
            "education": profile_record.education,
            "experience": profile_record.experience,
            "skills": profile_record.skills,
            "projects": profile_record.projects,
            "certifications": profile_record.certifications
        }
    }

@router.get("/{resume_id}/profile", response_model=CandidateProfileResponse, summary="Get Candidate Profile")
def get_candidate_profile(resume_id: str, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.resume_id == resume_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile for resume_id '{resume_id}' not found."
        )
    return profile

@router.put("/{resume_id}/profile", response_model=CandidateProfileResponse, summary="Update Candidate Profile (User Review)")
def update_candidate_profile(
    resume_id: str,
    update_data: CandidateProfileUpdate,
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.resume_id == resume_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile for resume_id '{resume_id}' not found."
        )

    # Update non-null fields
    if update_data.name is not None:
        profile.name = update_data.name
    if update_data.email is not None:
        profile.email = update_data.email
    if update_data.phone is not None:
        profile.phone = update_data.phone
    if update_data.education is not None:
        profile.education = update_data.education
    if update_data.experience is not None:
        profile.experience = update_data.experience
    if update_data.skills is not None:
        # THE USER-EDITED SKILL LIST IS NOW THE SOURCE OF TRUTH
        profile.skills = update_data.skills
    if update_data.projects is not None:
        profile.projects = update_data.projects
    if update_data.certifications is not None:
        profile.certifications = update_data.certifications

    db.commit()
    db.refresh(profile)
    return profile
