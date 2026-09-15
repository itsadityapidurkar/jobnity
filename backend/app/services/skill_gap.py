import uuid
from typing import Dict, Any, List, Set, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import CandidateProfile, JobRole, RoleSkill, SkillGapAnalysis, Skill, SkillAlias
from app.services.skill_normalizer import SkillNormalizerService

# Guardrail sets for non-equivalent skills
DISTINCT_GUARDRAILS = [
    {"java", "javascript"},
    {"docker", "kubernetes"},
    {"aws", "azure"},
    {"python", "pytorch"},
    {"c", "c++"},
    {"c++", "c#"},
    {"react", "react native"},
    {"sql", "nosql"},
    {"html", "css"}
]

class SkillGapService:
    @staticmethod
    def is_distinct_guardrail_violation(candidate_skill: str, required_skill: str) -> bool:
        c_low = candidate_skill.lower().strip()
        r_low = required_skill.lower().strip()
        for guard in DISTINCT_GUARDRAILS:
            if c_low in guard and r_low in guard and c_low != r_low:
                return True
        return False

    @staticmethod
    def match_skill(
        candidate_skills_norm: List[str], 
        required_skill: str,
        normalizer: SkillNormalizerService
    ) -> Tuple[bool, str]:
        """
        Determines if a required skill is present in the candidate's normalized skills list.
        Returns: (is_matched, matched_candidate_skill_name)
        """
        req_norm = normalizer.normalize(required_skill)
        req_lower = req_norm.lower()

        for c_skill in candidate_skills_norm:
            c_norm = normalizer.normalize(c_skill)
            c_lower = c_norm.lower()

            # Check distinct guardrails first
            if SkillGapService.is_distinct_guardrail_violation(c_lower, req_lower):
                continue

            # 1. Exact canonical match
            if c_lower == req_lower:
                return True, c_norm

            # 2. Substring/Superstring matching with token boundary (e.g. "React" in "React.js")
            if (len(c_lower) > 3 and len(req_lower) > 3) and (c_lower in req_lower or req_lower in c_lower):
                # Ensure no guardrail violation
                return True, c_norm

        return False, ""

    @classmethod
    def calculate_skill_gap(
        cls, 
        db: Session, 
        resume_id: str, 
        role_id: str
    ) -> Dict[str, Any]:
        # 1. Fetch Candidate Profile (user confirmed profile)
        profile = db.query(CandidateProfile).filter(CandidateProfile.resume_id == resume_id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate profile not found for resume_id '{resume_id}'."
            )

        # 2. Fetch Job Role
        role = db.query(JobRole).filter(JobRole.role_id == role_id).first()
        if not role:
            # Fallback to search by title
            role = db.query(JobRole).filter(JobRole.job_role.ilike(f"%{role_id}%")).first()

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job role not found for role_id '{role_id}'."
            )

        # 3. Normalize Candidate Skills (USER-VERIFIED SKILLS ARE SOURCE OF TRUTH)
        candidate_raw_skills = profile.skills or []
        normalizer = SkillNormalizerService(db)
        candidate_norm_skills = normalizer.normalize_list(candidate_raw_skills)

        # 4. Fetch Role Skills
        role_skills = db.query(RoleSkill).filter(RoleSkill.role_id == role.role_id).all()
        if not role_skills:
            # Fallback: get skills by role title
            role_skills = db.query(RoleSkill).filter(RoleSkill.job_role.ilike(f"%{role.job_role}%")).all()

        matched_skills = []
        missing_skills = []
        preferred_missing_skills = []

        required_total = 0
        required_matched = 0
        required_missing = 0
        preferred_total = 0
        preferred_matched = 0
        preferred_missing = 0

        total_weight = 0.0
        earned_weight = 0.0

        for rs in role_skills:
            importance = rs.importance or "Required"
            priority = rs.priority or 3
            is_req = importance.lower() == "required"

            is_matched, matched_cand_name = cls.match_skill(candidate_norm_skills, rs.skill, normalizer)

            weight = priority * (1.5 if is_req else 1.0)
            total_weight += weight

            skill_id = rs.skill_id or normalizer.get_skill_id(rs.skill)

            if is_matched:
                earned_weight += weight
                if is_req:
                    required_total += 1
                    required_matched += 1
                else:
                    preferred_total += 1
                    preferred_matched += 1

                matched_skills.append({
                    "skill_id": skill_id,
                    "skill": rs.skill,
                    "canonical_skill": normalizer.normalize(rs.skill),
                    "candidate_level": "Intermediate",
                    "required_level": rs.minimum_level or "Intermediate",
                    "status": "Matched"
                })
            else:
                if is_req:
                    required_total += 1
                    required_missing += 1
                    missing_skills.append({
                        "skill_id": skill_id,
                        "skill": rs.skill,
                        "canonical_skill": normalizer.normalize(rs.skill),
                        "importance": "Required",
                        "priority": priority,
                        "minimum_level": rs.minimum_level or "Intermediate",
                        "candidate_level": "Not Found",
                        "status": "Missing",
                        "reason": f"Required skill '{rs.skill}' is missing from your profile."
                    })
                else:
                    preferred_total += 1
                    preferred_missing += 1
                    preferred_missing_skills.append({
                        "skill_id": skill_id,
                        "skill": rs.skill,
                        "canonical_skill": normalizer.normalize(rs.skill),
                        "importance": "Preferred",
                        "priority": priority,
                        "minimum_level": rs.minimum_level or "Intermediate",
                        "candidate_level": "Not Found",
                        "status": "Missing",
                        "reason": f"Preferred skill '{rs.skill}' is missing."
                    })

        # Calculate Scores
        if total_weight > 0:
            readiness_score = int(round((earned_weight / total_weight) * 100))
        elif required_total > 0:
            readiness_score = int(round((required_matched / required_total) * 100))
        else:
            readiness_score = 70

        skill_gap_score = max(0, 100 - readiness_score)

        analysis_id = f"A_{uuid.uuid4().hex[:8]}"

        analysis_record = SkillGapAnalysis(
            analysis_id=analysis_id,
            resume_id=resume_id,
            role_id=role.role_id,
            target_role=role.job_role,
            skill_gap_score=skill_gap_score,
            readiness_score=readiness_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            preferred_missing_skills=preferred_missing_skills,
            statistics={
                "required_total": required_total,
                "required_matched": required_matched,
                "required_missing": required_missing,
                "preferred_total": preferred_total,
                "preferred_matched": preferred_matched,
                "preferred_missing": preferred_missing
            }
        )
        db.add(analysis_record)
        db.commit()

        return {
            "analysis_id": analysis_id,
            "role": {
                "role_id": role.role_id,
                "job_role": role.job_role,
                "category": role.category,
                "experience_level": role.experience_level
            },
            "skill_gap_score": skill_gap_score,
            "readiness_score": readiness_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "preferred_missing_skills": preferred_missing_skills,
            "statistics": {
                "required_total": required_total,
                "required_matched": required_matched,
                "required_missing": required_missing,
                "preferred_total": preferred_total,
                "preferred_matched": preferred_matched,
                "preferred_missing": preferred_missing
            }
        }
