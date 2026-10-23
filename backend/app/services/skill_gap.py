"""
Upgraded Skill Gap Analysis Engine — Jobnity

Improvements over original:
  1. 4 match statuses: Matched / BelowRequiredLevel / Transferable / Missing
  2. Uses skill_relationships table for transferable matching
  3. Multi-factor readiness/alignment score with documented formula
  4. Score breakdown returned in API response
  5. Proficiency from CandidateSkillEvidence used when available
  6. All existing fields preserved (backward compatible)

SCORING FORMULA (documented):
  required_coverage  = required_matched / required_total           (0–1)
  proficiency_factor = mean(proficiency_met_ratio per matched)     (0–1)
  evidence_factor    = mean(evidence_strength per matched)         (0–1)
  preferred_coverage = preferred_matched / max(preferred_total, 1) (0–1)
  transferable_bonus = transferable_count / max(required_total, 1) (0–1) * 0.5

  role_alignment_score = (
      0.55 * required_coverage
    + 0.25 * proficiency_factor
    + 0.10 * evidence_factor
    + 0.10 * preferred_coverage
  ) * 100 + transferable_bonus * 10

  Clamped to 0–100.

IMPORTANT: Scores are heuristic evidence-based estimates.
They are NOT a probability of getting hired.
"""
import uuid
import logging
from typing import Dict, Any, List, Set, Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import (
    CandidateProfile, JobRole, RoleSkill, SkillGapAnalysis,
    Skill, SkillAlias, SkillRelationship, CandidateSkillEvidence
)
from app.services.skill_normalizer import SkillNormalizerService

logger = logging.getLogger("jobnity.skill_gap")

# ─────────────────────────────────────────────────────────────────────────────
# GUARDRAILS
# ─────────────────────────────────────────────────────────────────────────────

DISTINCT_GUARDRAILS = [
    {"java", "javascript"},
    {"docker", "kubernetes"},
    {"aws", "azure"},
    {"python", "pytorch"},
    {"c", "c++"},
    {"c++", "c#"},
    {"react", "react native"},
    {"sql", "nosql"},
    {"html", "css"},
    {"java", "javafx"},
    {"ruby", "ruby on rails"},
    {"go", "golang"},
]

# minimum_level string → numeric mapping
LEVEL_MAP = {
    "beginner": 1, "basic": 2, "intermediate": 3,
    "advanced": 4, "expert": 5, "senior": 4
}

# evidence strength → numeric for scoring
STRENGTH_MAP = {"strong": 1.0, "moderate": 0.65, "weak": 0.35}

# Relationship types that count as "transferable" (not full match)
TRANSFERABLE_TYPES = {"related", "complementary", "alternative", "child", "specialization"}
# Relationship types that count as "prerequisite known" (partial credit)
PREREQUISITE_TYPES = {"prerequisite", "parent"}


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: distinct guardrail check
# ─────────────────────────────────────────────────────────────────────────────

def is_distinct_guardrail_violation(candidate_skill: str, required_skill: str) -> bool:
    c_low = candidate_skill.lower().strip()
    r_low = required_skill.lower().strip()
    for guard in DISTINCT_GUARDRAILS:
        if c_low in guard and r_low in guard and c_low != r_low:
            return True
    return False


# ─────────────────────────────────────────────────────────────────────────────
# SKILL GAP SERVICE
# ─────────────────────────────────────────────────────────────────────────────

class SkillGapService:

    @staticmethod
    def _load_relationships(db: Session) -> Dict[str, List[Dict]]:
        """
        Load skill_relationships into a dict keyed by target_skill (lower).
        {target_skill_lower: [{source_skill, relationship_type, source_skill_id}]}
        """
        rel_map: Dict[str, List[Dict]] = {}
        try:
            rels = db.query(SkillRelationship).all()
            for r in rels:
                if not r.target_skill:
                    continue
                key = r.target_skill.lower()
                if key not in rel_map:
                    rel_map[key] = []
                rel_map[key].append({
                    "source_skill": r.source_skill,
                    "source_skill_id": r.source_skill_id,
                    "relationship_type": (r.relationship_type or "related").lower()
                })
        except Exception as e:
            logger.warning(f"Could not load skill relationships: {e}")
        return rel_map

    @staticmethod
    def _load_evidence_map(db: Session, profile_id: str) -> Dict[str, Dict]:
        """
        Load CandidateSkillEvidence records for a profile into a dict keyed by skill (lower).
        Returns {skill_lower: {proficiency_level, proficiency_label, strength, confidence, estimated_months}}
        """
        ev_map: Dict[str, Dict] = {}
        try:
            records = db.query(CandidateSkillEvidence).filter(
                CandidateSkillEvidence.profile_id == profile_id
            ).all()
            for rec in records:
                if rec.skill:
                    level = max(1, rec.proficiency_level or 1)
                    label = rec.proficiency_label
                    if not label or label == "No Evidence":
                        label = {1: "Mentioned", 2: "Basic", 3: "Working", 4: "Proficient", 5: "Advanced"}.get(level, "Basic")

                    ev_map[rec.skill.lower()] = {
                        "proficiency_level": level,
                        "proficiency_label": label,
                        "strength": rec.strength or "weak",
                        "confidence": rec.confidence or 0.5,
                        "estimated_months": rec.estimated_months or 0,
                        "evidence_text": rec.evidence_text or "",
                        "evidence_type": rec.evidence_type or "skills_section"
                    }
        except Exception as e:
            logger.warning(f"Could not load evidence map: {e}")
        return ev_map

    @staticmethod
    def match_skill(
        candidate_skills_norm: List[str],
        required_skill: str,
        normalizer: SkillNormalizerService,
        rel_map: Dict[str, List[Dict]],
        candidate_skills_set: Set[str]
    ) -> Tuple[str, str, str]:
        """
        Returns (match_status, matched_candidate_skill, transferable_reason).
        match_status: "exact" | "transferable" | "prerequisite" | "none"
        """
        req_norm = normalizer.normalize(required_skill)
        req_lower = req_norm.lower()

        # 1. Exact / substring match
        for c_skill in candidate_skills_norm:
            c_norm = normalizer.normalize(c_skill)
            c_lower = c_norm.lower()

            if is_distinct_guardrail_violation(c_lower, req_lower):
                continue

            if c_lower == req_lower:
                return "exact", c_norm, ""

            if len(c_lower) > 3 and len(req_lower) > 3 and (c_lower in req_lower or req_lower in c_lower):
                return "exact", c_norm, ""

        # 2. Transferable / relationship-based match
        related_entries = rel_map.get(req_lower, [])
        for rel in related_entries:
            src = rel["source_skill"]
            rel_type = rel["relationship_type"]
            if not src:
                continue
            src_norm = normalizer.normalize(src)
            src_lower = src_norm.lower()

            # Check if candidate has the related skill
            if src_lower in candidate_skills_set:
                if is_distinct_guardrail_violation(src_lower, req_lower):
                    continue
                if rel_type in TRANSFERABLE_TYPES:
                    reason = f"Candidate has '{src_norm}', which is {rel_type} to '{required_skill}'"
                    return "transferable", src_norm, reason
                if rel_type in PREREQUISITE_TYPES:
                    reason = f"Candidate has prerequisite skill '{src_norm}' for '{required_skill}'"
                    return "prerequisite", src_norm, reason

        return "none", "", ""

    @classmethod
    def calculate_skill_gap(
        cls,
        db: Session,
        resume_id: str,
        role_id: str,
        job_description: Optional[str] = None
    ) -> Dict[str, Any]:

        # 1. Fetch Candidate Profile
        profile = db.query(CandidateProfile).filter(CandidateProfile.resume_id == resume_id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate profile not found for resume_id '{resume_id}'."
            )

        # 2. Fetch Job Role
        role = db.query(JobRole).filter(JobRole.role_id == role_id).first()
        if not role:
            role = db.query(JobRole).filter(JobRole.job_role.ilike(f"%{role_id}%")).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job role not found for role_id '{role_id}'."
            )

        # 3. Normalize candidate skills
        candidate_raw_skills = profile.skills or []
        normalizer = SkillNormalizerService(db)
        candidate_norm_skills = normalizer.normalize_list(candidate_raw_skills)
        candidate_skills_set = {normalizer.normalize(s).lower() for s in candidate_norm_skills}

        # 4. Load skill relationships and evidence map
        rel_map = cls._load_relationships(db)
        evidence_map = cls._load_evidence_map(db, profile.id)

        # 5. Fetch role skills
        role_skills = db.query(RoleSkill).filter(RoleSkill.role_id == role.role_id).all()
        if not role_skills:
            role_skills = db.query(RoleSkill).filter(RoleSkill.job_role.ilike(f"%{role.job_role}%")).all()

        # 5b. If custom job description is provided, extract skills from JD and augment requirements
        custom_jd_active = False
        jd_extracted_skills = []
        if job_description and len(job_description.strip()) > 10:
            from app.services.nlp_extractor import NLPExtractorService
            nlp_res = NLPExtractorService.extract_profile(job_description, db)
            jd_raw_skills = nlp_res.get("skills", [])
            jd_extracted_skills = normalizer.normalize_list(jd_raw_skills)

            if jd_extracted_skills:
                custom_jd_active = True
                existing_role_skills_map = {normalizer.normalize(rs.skill).lower(): rs for rs in role_skills}
                
                augmented_role_skills = []
                processed_skills = set()

                for jd_skill in jd_extracted_skills:
                    s_norm = normalizer.normalize(jd_skill)
                    s_lower = s_norm.lower()
                    if s_lower in processed_skills:
                        continue
                    processed_skills.add(s_lower)

                    if s_lower in existing_role_skills_map:
                        augmented_role_skills.append(existing_role_skills_map[s_lower])
                    else:
                        new_rs = RoleSkill(
                            role_id=role.role_id,
                            job_role=role.job_role,
                            skill_id=normalizer.get_skill_id(s_norm),
                            skill=s_norm,
                            importance="Required",
                            priority=4,
                            minimum_level="Intermediate",
                            frequency="High"
                        )
                        augmented_role_skills.append(new_rs)

                # Retain remaining role dataset skills
                for rs in role_skills:
                    rs_norm = normalizer.normalize(rs.skill).lower()
                    if rs_norm not in processed_skills:
                        processed_skills.add(rs_norm)
                        augmented_role_skills.append(rs)

                role_skills = augmented_role_skills

        # Accumulators
        matched_skills = []
        missing_skills = []
        preferred_missing_skills = []
        below_level_skills = []    # NEW: present but below required level
        transferable_skills = []   # NEW: related skill satisfies partially

        required_total = required_matched = required_missing = 0
        preferred_total = preferred_matched = preferred_missing = 0

        total_weight = 0.0
        earned_weight = 0.0

        # For scoring factors
        proficiency_ratios = []    # per matched skill: candidate_level / required_level
        evidence_strengths = []    # per matched skill: 0–1 strength value

        for rs in role_skills:
            importance = rs.importance or "Required"
            priority = rs.priority or 3
            is_req = importance.lower() == "required"

            # Required level → numeric
            req_level_str = (rs.minimum_level or "intermediate").lower()
            req_level_num = LEVEL_MAP.get(req_level_str, 3)

            weight = priority * (1.5 if is_req else 1.0)
            total_weight += weight

            skill_id = rs.skill_id or normalizer.get_skill_id(rs.skill)

            match_status, matched_cand_name, transfer_reason = cls.match_skill(
                candidate_norm_skills, rs.skill, normalizer, rel_map, candidate_skills_set
            )

            # Get evidence for matched skill
            ev = evidence_map.get((matched_cand_name or rs.skill).lower(), {})
            cand_proficiency = ev.get("proficiency_level", 1)
            cand_proficiency_label = ev.get("proficiency_label", "Mentioned")
            strength_val = STRENGTH_MAP.get(ev.get("strength", "weak"), 0.35)
            evidence_text = ev.get("evidence_text", "")

            if match_status == "exact":
                # Check proficiency vs required
                meets_level = cand_proficiency >= req_level_num

                if is_req:
                    required_total += 1
                    required_matched += 1
                else:
                    preferred_total += 1
                    preferred_matched += 1

                prof_ratio = min(1.0, cand_proficiency / max(req_level_num, 1))
                proficiency_ratios.append(prof_ratio)
                evidence_strengths.append(strength_val)

                if meets_level:
                    earned_weight += weight
                else:
                    # Skill present but below required level → partial weight credit
                    partial_credit = prof_ratio * weight
                    earned_weight += partial_credit

                matched_skills.append({
                    "skill_id": skill_id,
                    "skill": rs.skill,
                    "canonical_skill": normalizer.normalize(rs.skill),
                    "candidate_level": cand_proficiency_label,
                    "candidate_proficiency": cand_proficiency,
                    "required_level": rs.minimum_level or "Intermediate",
                    "required_proficiency": req_level_num,
                    "status": "Matched",
                    "match_type": "exact",
                    "meets_level": meets_level,
                    "below_required_level": not meets_level,
                    "level_gap_note": "" if meets_level else f"Your level is {cand_proficiency_label} ({cand_proficiency}/5); role specifies {rs.minimum_level} ({req_level_num}/5).",
                    "evidence_text": evidence_text,
                    "evidence_strength": ev.get("strength", "weak")
                })

                if not meets_level:
                    below_level_skills.append({
                        "skill_id": skill_id,
                        "skill": rs.skill,
                        "canonical_skill": normalizer.normalize(rs.skill),
                        "candidate_level": cand_proficiency_label,
                        "candidate_proficiency": cand_proficiency,
                        "required_level": rs.minimum_level or "Intermediate",
                        "required_proficiency": req_level_num,
                        "importance": importance,
                        "status": "Below Required Level",
                        "gap_type": "below_level",
                        "reason": f"Skill '{rs.skill}' found but evidence suggests level {cand_proficiency} ({cand_proficiency_label}); role specifies level {req_level_num} ({rs.minimum_level}).",
                        "evidence_text": evidence_text
                    })

            elif match_status in ("transferable", "prerequisite"):
                # Partial credit: 40% of weight for transferable, 25% for prerequisite
                credit_factor = 0.40 if match_status == "transferable" else 0.25
                earned_weight += credit_factor * weight
                if is_req:
                    required_total += 1
                else:
                    preferred_total += 1

                transferable_skills.append({
                    "skill_id": skill_id,
                    "skill": rs.skill,
                    "canonical_skill": normalizer.normalize(rs.skill),
                    "transferable_from": matched_cand_name,
                    "relationship_type": match_status,
                    "importance": importance,
                    "status": "Transferable Evidence",
                    "gap_type": "transferable",
                    "reason": transfer_reason,
                    "required_level": rs.minimum_level or "Intermediate",
                })

            else:
                # Missing
                if is_req:
                    required_total += 1; required_missing += 1
                    missing_skills.append({
                        "skill_id": skill_id,
                        "skill": rs.skill,
                        "canonical_skill": normalizer.normalize(rs.skill),
                        "importance": "Required",
                        "priority": priority,
                        "minimum_level": rs.minimum_level or "Intermediate",
                        "candidate_level": "Not Found",
                        "candidate_proficiency": 0,
                        "status": "Missing",
                        "gap_type": "missing",
                        "reason": f"Required skill '{rs.skill}' is missing from your profile."
                    })
                else:
                    preferred_total += 1; preferred_missing += 1
                    preferred_missing_skills.append({
                        "skill_id": skill_id,
                        "skill": rs.skill,
                        "canonical_skill": normalizer.normalize(rs.skill),
                        "importance": "Preferred",
                        "priority": priority,
                        "minimum_level": rs.minimum_level or "Intermediate",
                        "candidate_level": "Not Found",
                        "candidate_proficiency": 0,
                        "status": "Missing",
                        "gap_type": "missing",
                        "reason": f"Preferred skill '{rs.skill}' is missing."
                    })

        # ── MULTI-FACTOR SCORING ──────────────────────────────────────────────
        def safe_mean(lst): return sum(lst) / len(lst) if lst else 0.0

        required_coverage  = required_matched / max(required_total, 1)
        proficiency_factor = safe_mean(proficiency_ratios)
        evidence_factor    = safe_mean(evidence_strengths)
        preferred_coverage = preferred_matched / max(preferred_total, 1)
        transferable_count = len(transferable_skills)
        transferable_bonus = (transferable_count / max(required_total, 1)) * 0.5

        role_alignment_raw = (
            0.55 * required_coverage
            + 0.25 * proficiency_factor
            + 0.10 * evidence_factor
            + 0.10 * preferred_coverage
        ) * 100 + transferable_bonus * 10

        role_alignment_score = int(round(min(100, max(0, role_alignment_raw))))
        skill_gap_score = max(0, 100 - role_alignment_score)

        score_breakdown = {
            "required_skill_coverage": int(round(required_coverage * 100)),
            "proficiency_alignment": int(round(proficiency_factor * 100)),
            "evidence_quality": int(round(evidence_factor * 100)),
            "preferred_skill_coverage": int(round(preferred_coverage * 100)),
            "transferable_credit": int(round(transferable_bonus * 10))
        }

        analysis_id = f"A_{uuid.uuid4().hex[:8]}"
        score_explanation = (
            "Role Alignment Score is estimated from resume evidence against the configured "
            f"role requirements for '{role.job_role}'"
            f"{' (tailored for your custom Job Description)' if custom_jd_active else ''}. "
            "It is not a probability of being hired. "
            f"Required skills: {required_matched}/{required_total} matched. "
            f"Evidence quality: {score_breakdown['evidence_quality']}%. "
            f"Proficiency alignment: {score_breakdown['proficiency_alignment']}%."
        )

        analysis_record = SkillGapAnalysis(
            analysis_id=analysis_id,
            resume_id=resume_id,
            role_id=role.role_id,
            target_role=role.job_role,
            skill_gap_score=skill_gap_score,
            readiness_score=role_alignment_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            preferred_missing_skills=preferred_missing_skills,
            below_level_skills=below_level_skills,
            transferable_skills=transferable_skills,
            statistics={
                "required_total": required_total,
                "required_matched": required_matched,
                "required_missing": required_missing,
                "preferred_total": preferred_total,
                "preferred_matched": preferred_matched,
                "preferred_missing": preferred_missing,
                "below_level_count": len(below_level_skills),
                "transferable_count": transferable_count
            },
            score_breakdown=score_breakdown,
            score_explanation=score_explanation
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
            "readiness_score": role_alignment_score,
            "role_alignment_score": role_alignment_score,
            "score_breakdown": score_breakdown,
            "score_explanation": score_explanation,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "preferred_missing_skills": preferred_missing_skills,
            "below_level_skills": below_level_skills,
            "transferable_skills": transferable_skills,
            "statistics": {
                "required_total": required_total,
                "required_matched": required_matched,
                "required_missing": required_missing,
                "preferred_total": preferred_total,
                "preferred_matched": preferred_matched,
                "preferred_missing": preferred_missing,
                "below_level_count": len(below_level_skills),
                "transferable_count": transferable_count
            }
        }
