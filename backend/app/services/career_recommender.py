"""
Career Recommendation Engine — Jobnity

Provides explainable, ranked career recommendations based on:
  1. Priority-ranked missing skills to learn next
  2. Alternative roles the candidate is close to qualifying for
  3. High-leverage skills that unlock multiple roles

Algorithm: deterministic graph-traversal scoring — no ML, no paid APIs.

All recommendations include human-readable reasons.
Scores are heuristic estimates based on configured role requirements.
"""
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from app.models import (
    CandidateProfile, JobRole, RoleSkill, SkillGapAnalysis,
    SkillRelationship, CandidateSkillEvidence, LearningResource
)
from app.services.skill_normalizer import SkillNormalizerService
from app.services.resource_service import ResourceService

logger = logging.getLogger("jobnity.career_recommender")


def _get_role_skill_set(db: Session, role_id: str) -> List[Dict]:
    """Return required+preferred skills for a role."""
    return [
        {"skill": rs.skill, "importance": rs.importance or "Required", "priority": rs.priority or 3}
        for rs in db.query(RoleSkill).filter(RoleSkill.role_id == role_id).all()
    ]


def _candidate_coverage(
    candidate_skills_lower: set,
    role_skills: List[Dict],
    normalizer: SkillNormalizerService
) -> float:
    """Quick estimate of candidate coverage for a role (0–1)."""
    req = [rs for rs in role_skills if rs["importance"].lower() == "required"]
    if not req:
        return 0.0
    matched = sum(1 for rs in req if normalizer.normalize(rs["skill"]).lower() in candidate_skills_lower)
    return matched / len(req)


def get_career_recommendations(
    db: Session,
    analysis_id: str
) -> Dict[str, Any]:
    """
    Generates ranked career recommendations from a completed skill gap analysis.

    Returns:
      - priority_skills_to_learn: ranked missing skills
      - alternative_roles: roles the candidate is close to qualifying for
      - high_leverage_skills: skills that unlock multiple roles
    """
    analysis = db.query(SkillGapAnalysis).filter(SkillGapAnalysis.analysis_id == analysis_id).first()
    if not analysis:
        return {"error": f"Analysis '{analysis_id}' not found"}

    profile = db.query(CandidateProfile).filter(CandidateProfile.resume_id == analysis.resume_id).first()
    if not profile:
        return {"error": "Candidate profile not found"}

    normalizer = SkillNormalizerService(db)
    candidate_raw_skills = profile.skills or []
    candidate_skills_set = {normalizer.normalize(s).lower() for s in candidate_raw_skills}

    # Load evidence map for proficiency context
    evidence_map = {}
    try:
        ev_records = db.query(CandidateSkillEvidence).filter(
            CandidateSkillEvidence.profile_id == profile.id
        ).all()
        for ev in ev_records:
            if ev.skill:
                evidence_map[ev.skill.lower()] = ev
    except Exception as e:
        logger.warning(f"Could not load evidence map: {e}")

    # Load relationship map
    rel_map: Dict[str, List] = {}
    try:
        rels = db.query(SkillRelationship).all()
        for r in rels:
            if r.target_skill:
                rel_map.setdefault(r.target_skill.lower(), []).append(r)
    except Exception as e:
        logger.warning(f"Could not load relationships: {e}")

    # ── 1. PRIORITY SKILLS TO LEARN ──────────────────────────────────────────
    missing_req = analysis.missing_skills or []
    below_level = analysis.below_level_skills or []
    preferred_missing = analysis.preferred_missing_skills or []

    # Count how many roles in DB require each missing skill
    all_roles = db.query(JobRole).all()
    all_role_ids = [r.role_id for r in all_roles]

    # Skill → role_count (demand across all configured roles)
    skill_role_demand: Dict[str, int] = {}
    try:
        demands = db.query(
            RoleSkill.skill,
            sqlfunc.count(RoleSkill.role_id.distinct()).label("role_count")
        ).group_by(RoleSkill.skill).all()
        for row in demands:
            if row.skill:
                skill_role_demand[row.skill.lower()] = row.role_count
    except Exception as e:
        logger.warning(f"Could not compute skill demand: {e}")

    def score_missing_skill(item: Dict, importance_weight: float) -> Dict:
        skill = item.get("skill", "")
        priority = item.get("priority", 3)
        demand = skill_role_demand.get(skill.lower(), 1)

        # Check if candidate has a related/transferable skill
        related_rels = rel_map.get(skill.lower(), [])
        has_related = any(
            r.source_skill and normalizer.normalize(r.source_skill).lower() in candidate_skills_set
            for r in related_rels
        )
        transferable_discount = 0.7 if has_related else 1.0

        score = (priority / 5.0) * importance_weight * transferable_discount * min(demand, 10)

        # Gather reasons
        reasons = []
        if importance_weight >= 1.5:
            reasons.append(f"Required for '{analysis.target_role}'")
        else:
            reasons.append(f"Preferred for '{analysis.target_role}'")
        if demand > 3:
            reasons.append(f"Needed by {demand} other configured roles")
        if has_related:
            related_skills = [r.source_skill for r in related_rels if r.source_skill and
                              normalizer.normalize(r.source_skill).lower() in candidate_skills_set]
            reasons.append(f"You already have related skill: {', '.join(related_skills[:2])}")

        resources = ResourceService.get_resources_by_skill(db, skill)
        return {
            "skill": skill,
            "skill_id": item.get("skill_id", ""),
            "importance": item.get("importance", "Required"),
            "priority": priority,
            "score": round(score, 2),
            "minimum_level": item.get("minimum_level", "Intermediate"),
            "reasons": reasons,
            "transferable_head_start": has_related,
            "youtube": resources["resources"]["youtube"][:2],
            "articles": resources["resources"]["articles"][:2],
            "roadmap": resources["resources"]["roadmaps"][:1]
        }

    priority_skills = []
    for item in missing_req:
        priority_skills.append(score_missing_skill(item, 1.5))
    for item in below_level:
        priority_skills.append(score_missing_skill(item, 1.2))
    for item in preferred_missing:
        priority_skills.append(score_missing_skill(item, 1.0))

    priority_skills.sort(key=lambda x: x["score"], reverse=True)

    # ── 2. ALTERNATIVE ROLES ──────────────────────────────────────────────────
    alternative_roles = []
    try:
        target_role = db.query(JobRole).filter(JobRole.role_id == analysis.role_id).first()
        target_category = target_role.category if target_role else None

        for role in all_roles:
            if role.role_id == analysis.role_id:
                continue
            role_skills = _get_role_skill_set(db, role.role_id)
            coverage = _candidate_coverage(candidate_skills_set, role_skills, normalizer)
            if coverage >= 0.40:  # candidate covers ≥40% of required skills
                reason_parts = [f"You meet ~{int(coverage * 100)}% of required skills"]
                if target_category and role.category == target_category:
                    reason_parts.append(f"Same category as '{analysis.target_role}'")
                alternative_roles.append({
                    "role_id": role.role_id,
                    "job_role": role.job_role,
                    "category": role.category,
                    "experience_level": role.experience_level,
                    "coverage_estimate": int(coverage * 100),
                    "reasons": reason_parts
                })

        alternative_roles.sort(key=lambda x: x["coverage_estimate"], reverse=True)
        alternative_roles = alternative_roles[:5]  # Top 5
    except Exception as e:
        logger.warning(f"Alternative roles computation failed: {e}")

    # ── 3. HIGH-LEVERAGE SKILLS ───────────────────────────────────────────────
    high_leverage = []
    try:
        all_missing_skills = {item.get("skill", "").lower() for item in missing_req + preferred_missing}
        for skill_name, demand in sorted(skill_role_demand.items(), key=lambda x: x[1], reverse=True):
            if skill_name in all_missing_skills and demand >= 3:
                canonical = normalizer.normalize(skill_name)
                related_rels = rel_map.get(skill_name, [])
                has_related = any(
                    r.source_skill and normalizer.normalize(r.source_skill).lower() in candidate_skills_set
                    for r in related_rels
                )
                high_leverage.append({
                    "skill": canonical,
                    "unlocks_role_count": demand,
                    "has_transferable_start": has_related,
                    "reason": (
                        f"'{canonical}' is required by {demand} roles in the configured dataset"
                        + (". You have a related skill to build from." if has_related else ".")
                    )
                })
                if len(high_leverage) >= 5:
                    break
    except Exception as e:
        logger.warning(f"High-leverage skills computation failed: {e}")

    return {
        "analysis_id": analysis_id,
        "target_role": analysis.target_role,
        "readiness_score": analysis.readiness_score,
        "score_explanation": analysis.score_explanation or "",
        "priority_skills_to_learn": priority_skills[:10],
        "alternative_roles": alternative_roles,
        "high_leverage_skills": high_leverage,
        "disclaimer": (
            "Recommendations are based on resume evidence compared against the configured "
            "role skill requirements. They are heuristic estimates, not guarantees of employability."
        )
    }
