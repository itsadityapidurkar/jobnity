"""
Structured types for resume extraction with confidence and evidence.
Every extracted field optionally carries: value, confidence, source_section,
evidence text, and the extraction method used.
"""
from dataclasses import dataclass, field
from typing import Any, Optional, List


@dataclass
class ExtractedField:
    """A single extracted resume field with provenance metadata."""
    value: Any
    confidence: float = 0.5          # 0.0 = no confidence, 1.0 = certain
    source_section: str = ""          # header / education / experience / skills / projects / certifications
    evidence: str = ""                # the raw text that produced this value
    method: str = "pattern_match"     # multi_signal_header / regex / keyword / section_context


@dataclass
class ExtractedSkillEvidence:
    """Evidence record for a single detected skill."""
    skill: str
    canonical_skill: str = ""
    evidence_text: str = ""
    evidence_type: str = "skills_section"   # work_experience / project / education / certification / skills_section
    source_section: str = "skills"
    strength: str = "weak"                  # strong / moderate / weak
    confidence: float = 0.5
    estimated_months: Optional[int] = None
    proficiency_level: int = 1              # 0–5
    proficiency_label: str = "Mentioned"


@dataclass
class ExtractedEducation:
    """One education entry with structured fields and confidence."""
    degree: str = ""
    degree_normalized: str = ""             # Canonical normalized degree name
    field_of_study: str = ""
    institution: str = ""
    start_date: str = ""
    end_date: str = ""
    ongoing: bool = False
    gpa: Optional[str] = None
    confidence: float = 0.5
    evidence: str = ""


@dataclass
class ExtractedExperience:
    """One work/internship/project experience entry."""
    job_title: str = ""
    company: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    current: bool = False
    duration_months: int = 0
    experience_type: str = "unknown"        # full_time / part_time / internship / freelance / contract / volunteer / project / unknown
    description: str = ""
    skills_mentioned: List[str] = field(default_factory=list)
    confidence: float = 0.5
    evidence: str = ""


@dataclass
class ResumeDocument:
    """
    Structured representation of a parsed resume document.
    All fields optionally carry confidence and evidence metadata.
    """
    raw_text: str = ""
    sections: dict = field(default_factory=dict)

    # Extracted header fields
    name: Optional[ExtractedField] = None
    email: Optional[ExtractedField] = None
    phone: Optional[ExtractedField] = None

    # Structured section extractions
    education: List[ExtractedEducation] = field(default_factory=list)
    experience: List[ExtractedExperience] = field(default_factory=list)
    skills: List[str] = field(default_factory=list)
    skill_evidence: List[ExtractedSkillEvidence] = field(default_factory=list)
    projects: List[dict] = field(default_factory=list)
    certifications: List[dict] = field(default_factory=list)

    def to_profile_dict(self) -> dict:
        """
        Returns backward-compatible flat dict matching the existing
        CandidateProfile schema, plus new evidence fields.
        """
        return {
            "name": self.name.value if self.name else "",
            "name_confidence": self.name.confidence if self.name else 0.0,
            "email": self.email.value if self.email else "",
            "phone": self.phone.value if self.phone else "",
            "education": [
                {
                    "degree": e.degree_normalized or e.degree,
                    "institution": e.institution,
                    "duration": f"{e.start_date} - {e.end_date}".strip(" -"),
                    "details": e.evidence,
                    "field": e.field_of_study,
                    "ongoing": e.ongoing,
                    "confidence": e.confidence
                }
                for e in self.education
            ],
            "experience": [
                {
                    "company": e.company,
                    "role": e.job_title,
                    "duration": f"{e.start_date} - {e.end_date}".strip(" -"),
                    "description": e.description,
                    "duration_months": e.duration_months,
                    "experience_type": e.experience_type,
                    "current": e.current,
                    "confidence": e.confidence
                }
                for e in self.experience
            ],
            "skills": self.skills,
            "skill_evidence": [
                {
                    "skill": se.skill,
                    "canonical_skill": se.canonical_skill,
                    "evidence_text": se.evidence_text,
                    "evidence_type": se.evidence_type,
                    "source_section": se.source_section,
                    "strength": se.strength,
                    "confidence": se.confidence,
                    "proficiency_level": se.proficiency_level,
                    "proficiency_label": se.proficiency_label
                }
                for se in self.skill_evidence
            ],
            "projects": self.projects,
            "certifications": self.certifications
        }
