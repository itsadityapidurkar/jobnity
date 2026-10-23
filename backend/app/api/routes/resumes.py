import os
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models import Resume, CandidateProfile, CandidateSkillEvidence
from app.schemas import (
    ResumeUploadResponse, CandidateProfileResponse, CandidateProfileUpdate
)
from app.utils.file_validation import validate_uploaded_file
from app.services.resume_parser import ResumeParserService
from app.services.nlp_extractor import NLPExtractorService
from app.services.evidence_extractor import extract_skill_evidence
from app.utils.text_processing import split_into_sections

logger = logging.getLogger("jobnity.resumes")
router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload", response_model=ResumeUploadResponse, summary="Upload PDF/DOCX resume")
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    safe_name, file_type, file_size = validate_uploaded_file(file)
    
    # Ensure upload directory exists safely
    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    except Exception:
        pass

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
    if not raw_text or len(raw_text.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Scanned or image-only resumes cannot be processed. No readable text could be extracted. Please upload a digital PDF or DOCX file with selectable text (no scanned copies or images)."
        )

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

    # Extract evidence for each detected skill
    sections = split_into_sections(raw_text)
    skill_evidence_list = extract_skill_evidence(
        skill_list=extracted.get("skills", []),
        sections=sections,
        experience_entries=extracted.get("experience", []),
        project_entries=extracted.get("projects", []),
        certification_entries=extracted.get("certifications", [])
    )

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
    db.flush()  # get prof_id assigned

    # Save evidence records
    for ev in skill_evidence_list:
        try:
            db.add(CandidateSkillEvidence(
                profile_id=prof_id,
                skill=ev.skill,
                canonical_skill=ev.canonical_skill,
                evidence_text=ev.evidence_text,
                evidence_type=ev.evidence_type,
                source_section=ev.source_section,
                strength=ev.strength,
                confidence=ev.confidence,
                estimated_months=ev.estimated_months,
                proficiency_level=ev.proficiency_level,
                proficiency_label=ev.proficiency_label
            ))
        except Exception as e:
            logger.warning(f"Failed to save evidence for skill '{ev.skill}': {e}")

    db.commit()
    db.refresh(profile_record)

    # Build skill_evidence dict for response
    evidence_map = {
        ev.skill: {
            "evidence_text": ev.evidence_text,
            "evidence_type": ev.evidence_type,
            "strength": ev.strength,
            "proficiency_level": ev.proficiency_level,
            "proficiency_label": ev.proficiency_label,
            "confidence": round(ev.confidence, 2)
        }
        for ev in skill_evidence_list
    }

    return {
        "resume_id": resume_id,
        "filename": file.filename or safe_name,
        "status": "uploaded",
        "profile": {
            "id": prof_id,
            "resume_id": resume_id,
            "name": profile_record.name,
            "name_confidence": extracted.get("name_confidence", 0.5),
            "email": profile_record.email,
            "phone": profile_record.phone,
            "education": profile_record.education,
            "experience": profile_record.experience,
            "skills": profile_record.skills,
            "skill_evidence": evidence_map,
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

SAMPLE_PROFILES = {
    "software-engineer": {
        "name": "Alex Morgan",
        "email": "alex.morgan@example.com",
        "phone": "+1 (555) 234-5678",
        "skills": ["Python", "FastAPI", "React", "JavaScript", "PostgreSQL", "Docker", "Git", "REST APIs", "HTML5", "CSS3", "Tailwind CSS", "Linux"],
        "education": [{"degree": "B.S. in Computer Science", "institution": "University of California, Berkeley", "details": "Focus on Distributed Systems and Software Engineering. GPA: 3.8/4.0"}],
        "experience": [
            {"role": "Full Stack Developer", "company": "Acme Cloud Solutions", "duration": "2022 - Present", "description": "Built and scaled high-performance RESTful microservices with FastAPI and PostgreSQL. Engineered responsive web applications with React and Tailwind CSS."},
            {"role": "Junior Software Engineer", "company": "Innovate Tech Labs", "duration": "2020 - 2022", "description": "Developed backend API endpoints and automated unit testing pipelines. Managed Dockerized development environments and CI/CD pipelines."}
        ],
        "projects": [
            {"name": "TaskFlow Pro", "description": "Full-stack project collaboration app with real-time updates and interactive Kanban boards.", "technologies": "React, FastAPI, PostgreSQL, WebSockets"},
            {"name": "DevMetrics Analytics", "description": "Code performance dashboard aggregating Git commit metrics and API latencies.", "technologies": "Python, Docker, Chart.js"}
        ],
        "certifications": [{"name": "AWS Certified Developer - Associate", "issuer": "Amazon Web Services"}],
        "raw_text": "Alex Morgan\nEmail: alex.morgan@example.com | Phone: +1 (555) 234-5678\nTarget Position: Software Engineer\n\nEXPERIENCE\nAcme Cloud Solutions - Full Stack Developer (2022 - Present)\n- Built and scaled high-performance RESTful microservices with FastAPI and PostgreSQL.\n- Engineered responsive web applications with React and Tailwind CSS.\n\nInnovate Tech Labs - Junior Software Engineer (2020 - 2022)\n- Developed backend API endpoints and automated unit testing pipelines.\n- Managed Dockerized development environments and CI/CD pipelines.\n\nEDUCATION\nUniversity of California, Berkeley - B.S. in Computer Science (GPA: 3.8/4.0)\n\nSKILLS\nPython, FastAPI, React, JavaScript, PostgreSQL, Docker, Git, REST APIs, HTML5, CSS3, Tailwind CSS, Linux\n\nPROJECTS\nTaskFlow Pro: Full-stack project collaboration app with real-time updates.\nDevMetrics Analytics: Code performance dashboard aggregating commit metrics and API latencies."
    },
    "data-scientist": {
        "name": "Sarah Chen",
        "email": "sarah.chen@example.com",
        "phone": "+1 (555) 456-7890",
        "skills": ["Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Machine Learning", "Data Visualization", "Tableau", "Statistical Analysis", "Git", "Jupyter"],
        "education": [{"degree": "M.S. in Data Science", "institution": "Columbia University", "details": "Specialization in Statistical Learning and Machine Learning. Capstone on predictive modeling."}],
        "experience": [
            {"role": "Data Analyst", "company": "Helix Insights", "duration": "2022 - Present", "description": "Analyzed complex customer datasets using SQL and Pandas. Designed automated executive dashboards in Tableau tracking customer retention."},
            {"role": "Junior Analyst", "company": "MarketMetrics", "duration": "2021 - 2022", "description": "Conducted exploratory data analysis and built regression models for regional sales forecasting."}
        ],
        "projects": [
            {"name": "Customer Churn Predictor", "description": "Machine learning pipeline classifying at-risk subscribers with 89% precision using Scikit-Learn.", "technologies": "Python, Pandas, Scikit-Learn, Streamlit"},
            {"name": "Market Sentiment Tracker", "description": "Automated pipeline collecting product reviews and tracking sentiment over time.", "technologies": "Python, SQL, Matplotlib"}
        ],
        "certifications": [{"name": "Professional Data Scientist Certification", "issuer": "DataCamp"}],
        "raw_text": "Sarah Chen\nEmail: sarah.chen@example.com | Phone: +1 (555) 456-7890\nTarget Position: Data Scientist\n\nEXPERIENCE\nHelix Insights - Data Analyst (2022 - Present)\n- Analyzed complex customer datasets using SQL and Pandas.\n- Designed automated executive dashboards in Tableau tracking customer retention.\n\nEDUCATION\nColumbia University - M.S. in Data Science\n\nSKILLS\nPython, SQL, Pandas, NumPy, Scikit-Learn, Machine Learning, Data Visualization, Tableau, Statistical Analysis, Git, Jupyter\n\nPROJECTS\nCustomer Churn Predictor: Machine learning pipeline classifying at-risk subscribers with 89% precision.\nMarket Sentiment Tracker: Automated pipeline collecting product reviews and tracking sentiment."
    },
    "cloud-engineer": {
        "name": "David Kumar",
        "email": "david.kumar@example.com",
        "phone": "+1 (555) 789-0123",
        "skills": ["AWS", "Terraform", "Docker", "Kubernetes", "Linux", "CI/CD", "Python", "Bash", "Git", "Networking", "Prometheus"],
        "education": [{"degree": "B.Tech in Information Technology", "institution": "Georgia Tech", "details": "Coursework in Cloud Architecture, Networking, and Systems Administration."}],
        "experience": [
            {"role": "Cloud DevOps Engineer", "company": "AeroCloud Systems", "duration": "2022 - Present", "description": "Provisioned automated cloud infrastructure using Terraform on AWS. Configured containerized microservices and automated deployment pipelines."},
            {"role": "Systems Administrator", "company": "OmniHost Networks", "duration": "2020 - 2022", "description": "Maintained Linux server fleets, monitored system uptime with Prometheus, and automated operational bash scripts."}
        ],
        "projects": [
            {"name": "Multi-Region VPC Deployer", "description": "Infrastructure-as-code automation deploying fault-tolerant multi-tier networks across AWS regions.", "technologies": "Terraform, AWS, Bash"},
            {"name": "Containerized Service Mesh", "description": "Engineered Docker container pipelines with integrated health checks and logging.", "technologies": "Docker, Kubernetes, Linux"}
        ],
        "certifications": [{"name": "AWS Certified Solutions Architect", "issuer": "Amazon Web Services"}],
        "raw_text": "David Kumar\nEmail: david.kumar@example.com | Phone: +1 (555) 789-0123\nTarget Position: Cloud Engineer\n\nEXPERIENCE\nAeroCloud Systems - Cloud DevOps Engineer (2022 - Present)\n- Provisioned automated cloud infrastructure using Terraform on AWS.\n- Configured containerized microservices and automated deployment pipelines.\n\nEDUCATION\nGeorgia Tech - B.Tech in Information Technology\n\nSKILLS\nAWS, Terraform, Docker, Kubernetes, Linux, CI/CD, Python, Bash, Git, Networking, Prometheus\n\nPROJECTS\nMulti-Region VPC Deployer: Infrastructure-as-code automation deploying fault-tolerant multi-tier networks across AWS regions.\nContainerized Service Mesh: Engineered Docker container pipelines with integrated health checks."
    }
}

@router.post("/sample", response_model=ResumeUploadResponse, summary="Load pre-configured sample resume profile")
def load_sample_resume(
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    key = "software-engineer"
    if role:
        norm = role.lower().replace(" ", "-")
        if "data" in norm:
            key = "data-scientist"
        elif "cloud" in norm or "devops" in norm:
            key = "cloud-engineer"
        else:
            key = "software-engineer"

    data = SAMPLE_PROFILES.get(key, SAMPLE_PROFILES["software-engineer"])
    resume_id = f"R_sample_{uuid.uuid4().hex[:6]}"
    filename = f"sample_{key}_resume.pdf"

    # Save Resume Record
    resume_record = Resume(
        resume_id=resume_id,
        filename=filename,
        file_path=f"sample/{filename}",
        file_type="pdf",
        file_size=10240,
        raw_text=data["raw_text"]
    )
    db.add(resume_record)

    prof_id = f"prof_{uuid.uuid4().hex[:8]}"
    profile_record = CandidateProfile(
        id=prof_id,
        resume_id=resume_id,
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        education=data["education"],
        experience=data["experience"],
        skills=data["skills"],
        projects=data["projects"],
        certifications=data["certifications"]
    )
    db.add(profile_record)
    db.flush()

    # Save skill evidence for grounding
    evidence_map = {}
    for sk in data["skills"]:
        ev_item = CandidateSkillEvidence(
            profile_id=prof_id,
            skill=sk,
            canonical_skill=sk,
            evidence_text=f"Hands-on production experience in {sk} as documented in {data['experience'][0]['role']} role and projects.",
            evidence_type="work_experience",
            source_section="experience",
            strength="strong",
            confidence=0.92,
            estimated_months=24,
            proficiency_level=4,
            proficiency_label="Advanced"
        )
        db.add(ev_item)
        evidence_map[sk] = {
            "evidence_text": ev_item.evidence_text,
            "evidence_type": "work_experience",
            "strength": "strong",
            "proficiency_level": 4,
            "proficiency_label": "Advanced",
            "confidence": 0.92
        }

    db.commit()
    db.refresh(profile_record)

    return {
        "resume_id": resume_id,
        "filename": filename,
        "status": "uploaded",
        "profile": {
            "id": prof_id,
            "resume_id": resume_id,
            "name": profile_record.name,
            "name_confidence": 0.95,
            "email": profile_record.email,
            "phone": profile_record.phone,
            "education": profile_record.education,
            "experience": profile_record.experience,
            "skills": profile_record.skills,
            "skill_evidence": evidence_map,
            "projects": profile_record.projects,
            "certifications": profile_record.certifications
        }
    }
