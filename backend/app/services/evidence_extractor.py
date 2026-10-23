"""
Evidence Extractor — Jobnity
Collects cross-section evidence for each detected skill:
  - WHERE in the resume a skill was found
  - How strongly it was evidenced
  - Estimated months of usage (from experience dates)
  - Resulting proficiency level estimate (0–5)

All evidence is explainable and heuristic — not ML-based.
"""
import re
import logging
from typing import List, Dict, Any, Optional
from app.utils.extraction_types import ExtractedSkillEvidence

logger = logging.getLogger("jobnity.evidence")

# Proficiency levels
PROFICIENCY_LEVELS = {
    0: "No Evidence",
    1: "Mentioned",
    2: "Basic",
    3: "Working",
    4: "Proficient",
    5: "Advanced"
}


def _find_evidence_snippets(text: str, skill: str, context_chars: int = 120) -> List[str]:
    """Find text snippets where the skill appears."""
    snippets = []
    if not text or not skill:
        return snippets
    pattern = r'\b' + re.escape(skill.lower()) + r'\b'
    lower_text = text.lower()
    for m in re.finditer(pattern, lower_text):
        start = max(0, m.start() - context_chars // 2)
        end = min(len(text), m.end() + context_chars // 2)
        snippet = text[start:end].replace('\n', ' ').strip()
        if snippet:
            snippets.append(snippet)
        if len(snippets) >= 3:
            break
    return snippets


def estimate_proficiency(
    skill: str,
    evidence_type: str,
    strength: str,
    estimated_months: int
) -> tuple:
    """
    Returns (proficiency_level: int, proficiency_label: str).
    Deterministic heuristic — evidence-based only.
    """
    # Base level from source
    base = 1  # Mentioned

    if evidence_type == "certification":
        base = 3  # Working — certification implies structured learning
    elif evidence_type == "work_experience":
        if estimated_months >= 36:
            base = 5  # Advanced
        elif estimated_months >= 12:
            base = 4  # Proficient
        elif estimated_months >= 3:
            base = 3  # Working
        else:
            base = 2  # Basic
    elif evidence_type == "project":
        base = 2  # Basic (project may be brief)
    elif evidence_type == "education":
        base = 2  # Basic
    elif evidence_type == "skills_section":
        base = 2  # Basic — listed explicitly in candidate technical skills section

    # Strength modifier
    if strength == "strong":
        base = min(5, base + 1)
    elif strength == "weak":
        base = max(1, base - 1)

    level = max(1, min(5, base))
    return level, PROFICIENCY_LEVELS[level]


def extract_skill_evidence(
    skill_list: List[str],
    sections: Dict[str, str],
    experience_entries: List[Dict[str, Any]],
    project_entries: List[Dict[str, Any]],
    certification_entries: List[Dict[str, Any]]
) -> List[ExtractedSkillEvidence]:
    """
    For each detected skill, collect evidence from all resume sections.
    Returns a list of ExtractedSkillEvidence (one per skill, best evidence chosen).
    """
    results = []

    for skill in skill_list:
        skill_lower = skill.lower()
        best: Optional[ExtractedSkillEvidence] = None
        best_priority = -1  # higher = better evidence

        # Priority order: work_experience > certification > project > education > skills_section
        evidence_priority = {
            "work_experience": 5,
            "certification": 4,
            "project": 3,
            "education": 2,
            "skills_section": 1
        }

        # ── Work Experience ──
        for exp in experience_entries:
            desc = f"{exp.get('role', '')} {exp.get('company', '')} {exp.get('description', '')}"
            snippets = _find_evidence_snippets(desc, skill)
            if snippets:
                months = exp.get("duration_months", 0)
                strength = "strong" if months >= 6 else "moderate" if months >= 1 else "weak"
                confidence = 0.85 if months >= 6 else 0.70 if months >= 1 else 0.55
                prio = evidence_priority["work_experience"]
                if prio > best_priority:
                    level, label = estimate_proficiency(skill, "work_experience", strength, months)
                    best = ExtractedSkillEvidence(
                        skill=skill,
                        canonical_skill=skill,
                        evidence_text=snippets[0][:200],
                        evidence_type="work_experience",
                        source_section="experience",
                        strength=strength,
                        confidence=confidence,
                        estimated_months=months,
                        proficiency_level=level,
                        proficiency_label=label
                    )
                    best_priority = prio

        # ── Certifications ──
        for cert in certification_entries:
            cert_text = f"{cert.get('name', '')} {cert.get('issuer', '')}"
            if skill_lower in cert_text.lower():
                prio = evidence_priority["certification"]
                if prio > best_priority:
                    level, label = estimate_proficiency(skill, "certification", "strong", 0)
                    best = ExtractedSkillEvidence(
                        skill=skill,
                        canonical_skill=skill,
                        evidence_text=cert_text[:200],
                        evidence_type="certification",
                        source_section="certifications",
                        strength="strong",
                        confidence=0.9,
                        estimated_months=None,
                        proficiency_level=level,
                        proficiency_label=label
                    )
                    best_priority = prio

        # ── Projects ──
        for proj in project_entries:
            proj_text = f"{proj.get('name', '')} {proj.get('description', '')} {proj.get('technologies', '')}"
            snippets = _find_evidence_snippets(proj_text, skill)
            if snippets:
                prio = evidence_priority["project"]
                if prio > best_priority:
                    level, label = estimate_proficiency(skill, "project", "moderate", 0)
                    best = ExtractedSkillEvidence(
                        skill=skill,
                        canonical_skill=skill,
                        evidence_text=snippets[0][:200],
                        evidence_type="project",
                        source_section="projects",
                        strength="moderate",
                        confidence=0.75,
                        estimated_months=None,
                        proficiency_level=level,
                        proficiency_label=label
                    )
                    best_priority = prio

        # ── Education section ──
        edu_text = sections.get("education", "")
        if edu_text:
            snippets = _find_evidence_snippets(edu_text, skill)
            if snippets:
                prio = evidence_priority["education"]
                if prio > best_priority:
                    level, label = estimate_proficiency(skill, "education", "moderate", 0)
                    best = ExtractedSkillEvidence(
                        skill=skill,
                        canonical_skill=skill,
                        evidence_text=snippets[0][:200],
                        evidence_type="education",
                        source_section="education",
                        strength="moderate",
                        confidence=0.65,
                        estimated_months=None,
                        proficiency_level=level,
                        proficiency_label=label
                    )
                    best_priority = prio

        # ── Skills section (weakest — listed only) ──
        skills_text = sections.get("skills", "")
        if skills_text and skill_lower in skills_text.lower():
            prio = evidence_priority["skills_section"]
            if prio > best_priority or best is None:
                level, label = estimate_proficiency(skill, "skills_section", "weak", 0)
                best = ExtractedSkillEvidence(
                    skill=skill,
                    canonical_skill=skill,
                    evidence_text=f"Listed in skills section",
                    evidence_type="skills_section",
                    source_section="skills",
                    strength="weak",
                    confidence=0.50,
                    estimated_months=None,
                    proficiency_level=level,
                    proficiency_label=label
                )

        if best is None:
            # Skill found by taxonomy scan but no specific section evidence
            level, label = estimate_proficiency(skill, "skills_section", "weak", 0)
            best = ExtractedSkillEvidence(
                skill=skill,
                canonical_skill=skill,
                evidence_text="Detected in resume text",
                evidence_type="skills_section",
                source_section="unknown",
                strength="weak",
                confidence=0.40,
                estimated_months=None,
                proficiency_level=level,
                proficiency_label=label
            )

        results.append(best)

    return results
