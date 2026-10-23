import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import CandidateProfile
from app.schemas import InterviewStartRequest, InterviewAnswerRequest
from app.services.llm_service import LLMService

logger = logging.getLogger("jobnity.interview")
router = APIRouter(prefix="/interview", tags=["Interview"])

def _resolve_candidate_profile(payload, db: Session) -> dict:
    """Helper to resolve candidate profile from DB or request payload."""
    profile_record = None
    if getattr(payload, "resume_id", None):
        profile_record = db.query(CandidateProfile).filter(CandidateProfile.resume_id == payload.resume_id).first()
    elif getattr(payload, "candidate_id", None):
        profile_record = db.query(CandidateProfile).filter(CandidateProfile.id == payload.candidate_id).first()

    if profile_record:
        return {
            "id": profile_record.id,
            "resume_id": profile_record.resume_id,
            "name": profile_record.name,
            "skills": profile_record.skills or [],
            "experience": profile_record.experience or [],
            "projects": profile_record.projects or [],
            "education": profile_record.education or []
        }

    if getattr(payload, "candidate_profile", None):
        p = payload.candidate_profile
        return {
            "id": p.get("id") or p.get("profile_id"),
            "resume_id": p.get("resume_id"),
            "name": p.get("name") or (p.get("personalInfo") and p["personalInfo"].get("name")),
            "skills": p.get("skills") or [],
            "experience": p.get("experience") or [],
            "projects": p.get("projects") or [],
            "education": p.get("education") or []
        }

    return None

@router.get("/status", summary="Check Qwen 2.5 LLM status & availability")
def get_llm_status():
    """
    Returns the real-time operational status of the local Qwen 2.5 LLM engine.
    """
    return LLMService.check_status()

@router.post("/start", summary="Start resume-grounded mock interview session")
def start_interview(payload: InterviewStartRequest, db: Session = Depends(get_db)):
    """
    Initializes a new mock interview session and generates the first question strictly based on the candidate's resume.
    """
    profile_dict = _resolve_candidate_profile(payload, db)

    if not profile_dict or (not profile_dict.get("skills") and not profile_dict.get("projects") and not profile_dict.get("experience")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No candidate resume found. Jobnity technical interviews are strictly generated from an uploaded resume. Please upload your resume first."
        )

    role_name = payload.role_id_or_title or "Software Engineer"
    
    try:
        question_data = LLMService.generate_interview_question(
            role=role_name,
            candidate_profile=profile_dict,
            skill=payload.target_skill,
            difficulty=payload.difficulty or "medium"
        )
    except Exception as e:
        logger.error(f"Failed to generate resume question: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not generate question from resume: {str(e)}"
        )

    interview_id = f"int_{uuid.uuid4().hex[:8]}"

    return {
        "interview_id": interview_id,
        "role": role_name,
        "candidate_name": profile_dict.get("name"),
        "question": question_data,
        "question_number": 1,
        "total_questions": 3,
        "engine": question_data.get("generator", "qwen2.5")
    }

@router.post("/evaluate", summary="Evaluate interview answer with Qwen 2.5")
def evaluate_interview_answer(payload: InterviewAnswerRequest, db: Session = Depends(get_db)):
    """
    Evaluates candidate's answer with Qwen 2.5 across Relevance, Correctness, and Clarity.
    Generates follow-up question strictly referencing resume details.
    """
    profile_dict = _resolve_candidate_profile(payload, db)

    role_name = payload.target_role or "Software Engineer"

    eval_result = LLMService.evaluate_interview_answer(
        question=payload.question,
        answer=payload.answer,
        target_role=role_name,
        expected_skills=profile_dict.get("skills") if profile_dict else None
    )

    # Next question generated strictly from resume if profile available
    next_q = None
    if profile_dict:
        try:
            next_q = LLMService.generate_interview_question(
                role=role_name,
                candidate_profile=profile_dict,
                difficulty="medium",
                previous_questions=[payload.question]
            )
        except Exception:
            next_q = None

    interview_id = payload.interview_id or f"int_{uuid.uuid4().hex[:8]}"

    return {
        "interview_id": interview_id,
        "question_id": payload.question_id,
        "scores": eval_result.get("scores", {"relevance": 70, "correctness": 70, "clarity": 70}),
        "relevance_score": eval_result.get("relevance_score", 70),
        "correctness_score": eval_result.get("correctness_score", 70),
        "clarity_score": eval_result.get("clarity_score", 70),
        "feedback": eval_result.get("feedback", "Good effort demonstrating relevant domain understanding."),
        "strengths": eval_result.get("strengths", []),
        "areas_for_improvement": eval_result.get("areas_for_improvement", []),
        "next_question": next_q,
        "is_last": next_q is None,
        "evaluator": eval_result.get("evaluator", "qwen2.5")
    }
