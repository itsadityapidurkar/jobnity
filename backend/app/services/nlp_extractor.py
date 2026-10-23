"""
NLP Extraction Service — Jobnity
Extracts structured candidate profile from raw resume text using:
  - Multi-signal name extraction with confidence scoring
  - Structured + normalized education extraction
  - Duration-aware experience extraction with type classification
  - Taxonomy-driven skill extraction with word-boundary matching
  - Evidence tracking per extracted field

All ML-free: deterministic, regex + taxonomy based.
"""
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from app.utils.text_processing import (
    extract_email, extract_phone, split_into_sections, clean_text
)
from app.utils.extraction_types import (
    ExtractedField, ExtractedEducation, ExtractedExperience, ResumeDocument
)
from app.models import Skill, SkillAlias

logger = logging.getLogger("jobnity.nlp")

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

SECTION_HEADING_WORDS = {
    "education", "experience", "skills", "projects", "certifications",
    "objective", "summary", "profile", "contact", "references",
    "achievements", "awards", "publications", "interests", "hobbies",
    "work experience", "professional experience", "employment history",
    "academic background", "technical skills", "core competencies",
    "career objective", "professional summary", "personal details"
}

JOB_TITLE_WORDS = {
    "engineer", "developer", "analyst", "manager", "lead", "intern",
    "specialist", "consultant", "architect", "designer", "administrator",
    "scientist", "officer", "director", "associate", "head", "senior",
    "junior", "principal", "staff", "vice", "president", "cto", "ceo",
    "coo", "founder", "co-founder", "executive"
}

DEGREE_NORMALIZATIONS = {
    # Bachelor variants
    r"\bb\.?\s*tech\.?\b": "B.Tech",
    r"\bbachelor\s*of\s*technology\b": "B.Tech",
    r"\bb\.?\s*e\.?\b": "B.E.",
    r"\bbachelor\s*of\s*engineering\b": "B.E.",
    r"\bb\.?\s*sc\.?\b": "B.Sc",
    r"\bbachelor\s*of\s*science\b": "B.Sc",
    r"\bb\.?\s*a\.?\b": "B.A.",
    r"\bbachelor\s*of\s*arts\b": "B.A.",
    r"\bb\.?\s*com\.?\b": "B.Com",
    r"\bbachelor\s*of\s*commerce\b": "B.Com",
    r"\bbca\b": "BCA",
    # Master variants
    r"\bm\.?\s*tech\.?\b": "M.Tech",
    r"\bmaster\s*of\s*technology\b": "M.Tech",
    r"\bm\.?\s*e\.?\b": "M.E.",
    r"\bmaster\s*of\s*engineering\b": "M.E.",
    r"\bm\.?\s*sc\.?\b": "M.Sc",
    r"\bmaster\s*of\s*science\b": "M.Sc",
    r"\bm\.?\s*a\.?\b": "M.A.",
    r"\bmaster\s*of\s*arts\b": "M.A.",
    r"\bmba\b": "MBA",
    r"\bmca\b": "MCA",
    r"\bm\.?\s*com\.?\b": "M.Com",
    # PhD
    r"\bph\.?\s*d\.?\b": "PhD",
    r"\bdoctor\s*of\s*philosophy\b": "PhD",
    # Diploma
    r"\bdiploma\b": "Diploma",
    r"\bpg\s*diploma\b": "PG Diploma",
    # Associate
    r"\bassociate\s*degree\b": "Associate Degree",
    r"\bassociate\s*of\s*science\b": "A.Sc",
    r"\bassociate\s*of\s*arts\b": "A.A.",
}

DEGREE_PATTERNS = [
    r'\b(b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|b\.?sc|m\.?sc|b\.?a\.?|m\.?a\.?|b\.?com|m\.?com|bca|mca|mba|phd|ph\.?d|diploma|associate|bachelor|master|doctorate)\b',
    r'\b(computer science|data science|information technology|software engineering|electrical engineering|mathematics|physics|business|commerce|arts)\b'
]

INSTITUTION_PATTERNS = [
    r'\b(university|college|institute|school|academy|iit|nit|mit|bits|vit|srm|polytechnic|faculty of)\b'
]

# Comprehensive date regex supporting many resume date formats
DATE_RANGE_REGEX = (
    r'(?i)'
    r'\b(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|'
    r'jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
    r'[a-z]*[\s,./-]*)?'
    r'\d{4}\s*(?:-|–|to|until)\s*'
    r'(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|'
    r'jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
    r'[a-z]*[\s,./-]*)?'
    r'(?:\d{4}|present|current|now|ongoing)'
    r'|'
    r'\b(?:19|20)\d{2}\s*(?:-|–|to)\s*(?:(?:19|20)\d{2}|present|current|now|ongoing)'
    r'|'
    r'\b(?:0?[1-9]|1[0-2])[/\-]\d{4}\s*(?:-|–|to)\s*(?:(?:0?[1-9]|1[0-2])[/\-]\d{4}|present|current|now)'
    r'|'
    r'\b(?:summer|fall|spring|winter)\s*\d{4}'
)

ROLE_KEYWORDS = [
    r'\bengineer\b', r'\bdeveloper\b', r'\banalyst\b', r'\bmanager\b', r'\blead\b',
    r'\bintern\b', r'\bspecialist\b', r'\bconsultant\b', r'\barchitect\b', r'\bdesigner\b',
    r'\badministrator\b', r'\bscientist\b', r'\bofficer\b', r'\bhead\b', r'\bdirector\b',
    r'\bassociate\b', r'\bstudent\b', r'\btrainee\b', r'\bprogrammer\b', r'\bcoordinator\b'
]

INTERNSHIP_INDICATORS = r'\b(intern|internship|trainee|summer\s+project|industrial\s+training|apprentice)\b'
FREELANCE_INDICATORS = r'\b(freelance|freelancer|self.?employed|consultant|contract|contractor|remote)\b'
VOLUNTEER_INDICATORS = r'\b(volunteer|volunteering|ngo|non.?profit|charity|community)\b'

# ─────────────────────────────────────────────────────────────────────────────
# DATE PARSING HELPERS
# ─────────────────────────────────────────────────────────────────────────────

MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'june': 6, 'july': 7, 'august': 8, 'september': 9,
    'october': 10, 'november': 11, 'december': 12
}


def _parse_date_to_ym(date_str: str) -> Optional[Tuple[int, int]]:
    """Parse a date string like 'Jan 2022', '2022', '01/2022' to (year, month)."""
    if not date_str:
        return None
    s = date_str.strip().lower()
    if s in ('present', 'current', 'now', 'ongoing'):
        now = datetime.now()
        return (now.year, now.month)

    # MM/YYYY or MM-YYYY
    m = re.match(r'^(0?[1-9]|1[0-2])[/\-](\d{4})$', s)
    if m:
        return (int(m.group(2)), int(m.group(1)))

    # Month Year: "Jan 2022"
    m = re.match(r'^([a-z]+)[\s,./-]*(\d{4})$', s)
    if m:
        mon = MONTH_MAP.get(m.group(1)[:3])
        if mon:
            return (int(m.group(2)), mon)

    # Year only: "2022"
    m = re.match(r'^(\d{4})$', s)
    if m:
        return (int(m.group(1)), 1)

    return None


def _duration_months(start_str: str, end_str: str) -> int:
    """Calculate duration in months between two date strings."""
    start = _parse_date_to_ym(start_str)
    end = _parse_date_to_ym(end_str)
    if not start or not end:
        return 0
    months = (end[0] - start[0]) * 12 + (end[1] - start[1])
    return max(0, months)


def _split_date_range(date_str: str) -> Tuple[str, str]:
    """Split 'Jan 2022 - Mar 2023' into ('Jan 2022', 'Mar 2023')."""
    parts = re.split(r'\s*(?:-|–|to|until)\s*', date_str, maxsplit=1, flags=re.IGNORECASE)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return date_str.strip(), ""


# ─────────────────────────────────────────────────────────────────────────────
# DEGREE NORMALIZATION
# ─────────────────────────────────────────────────────────────────────────────

def normalize_degree(text: str) -> str:
    """Normalize degree text to canonical form."""
    if not text:
        return text
    lower = text.lower().strip()
    for pattern, canonical in DEGREE_NORMALIZATIONS.items():
        if re.search(pattern, lower):
            return canonical
    return text.strip()


# ─────────────────────────────────────────────────────────────────────────────
# MAIN NLP EXTRACTOR SERVICE
# ─────────────────────────────────────────────────────────────────────────────

class NLPExtractorService:

    # ── NAME EXTRACTION ──────────────────────────────────────────────────────

    @staticmethod
    def extract_name(header_text: str, full_text: str, known_skills: set = None) -> ExtractedField:
        """
        Multi-signal name extraction with confidence scoring.
        Returns an ExtractedField with value=name and confidence 0–1.
        Returns value=None if confidence is below 0.4.
        """
        lines = [line.strip() for line in (header_text or full_text).split('\n') if line.strip()]
        known_skills_lower = {s.lower() for s in (known_skills or set())}

        candidates = []

        for idx, line in enumerate(lines[:8]):
            score = 0.0
            reasons = []

            # Hard disqualifiers
            if '@' in line:
                continue
            if re.search(r'https?://|www\.', line, re.IGNORECASE):
                continue
            if re.search(r'\d{5,}', line):  # long digit sequence (phone, ZIP)
                continue
            if re.search(r'\+?\d[\d\s\-().]{8,}', line):  # phone pattern
                continue

            words = line.split()
            if len(words) < 2 or len(words) > 6:
                continue

            # Check if line matches a known section heading
            line_lower = line.lower().strip()
            if line_lower in SECTION_HEADING_WORDS:
                continue
            # Check multi-word headings
            if any(hw in line_lower for hw in SECTION_HEADING_WORDS):
                if len(words) <= 3:
                    continue

            # Check if line is a job title
            if any(re.search(pat, line_lower) for pat in [r'\b' + kw + r'\b' for kw in JOB_TITLE_WORDS]):
                score -= 0.4
                reasons.append("looks like job title")

            # Check if line looks like a skill
            if line_lower in known_skills_lower:
                continue

            # Capitalization check: proper noun pattern
            alpha_words = [w for w in words if re.match(r'^[a-zA-Z]', w)]
            if not alpha_words:
                continue

            cap_ratio = sum(1 for w in alpha_words if w[0].isupper() or w.lower() in {'de', 'van', 'von', 'bin', 'al', 'el'}) / len(alpha_words)

            # Position bonus
            if idx == 0:
                score += 0.5
                reasons.append("first line")
            elif idx == 1:
                score += 0.3
                reasons.append("second line")
            elif idx <= 3:
                score += 0.1

            # Capitalization bonus
            if cap_ratio >= 0.8:
                score += 0.3
                reasons.append("capitalized")
            elif cap_ratio >= 0.5:
                score += 0.1

            # Word count bonus (names are typically 2–4 words)
            if 2 <= len(words) <= 4:
                score += 0.2
                reasons.append("2-4 words")
            elif len(words) == 5:
                score += 0.05

            # Only alphabetic / hyphen / period / space
            if re.match(r'^[a-zA-Z\s.\'\-]+$', line):
                score += 0.15
                reasons.append("alpha only")
            else:
                score -= 0.1  # has digits or special chars

            # Proximity to email/phone (on next 1–2 lines) boosts score
            next_lines = lines[idx + 1:idx + 3]
            for nl in next_lines:
                if '@' in nl or re.search(r'\d{7,}', nl):
                    score += 0.2
                    reasons.append("near contact info")
                    break

            # Check for repeated appearance (name often appears in header AND footer)
            full_lower = full_text.lower()
            line_lower_clean = line.lower().strip()
            occurrences = full_lower.count(line_lower_clean)
            if occurrences >= 2:
                score += 0.1
                reasons.append("repeated")

            # Penalty for numbers in line
            if re.search(r'\d', line):
                score -= 0.3

            candidates.append((score, line, ", ".join(reasons)))

        if not candidates:
            return ExtractedField(
                value=None,
                confidence=0.0,
                source_section="header",
                evidence="No name candidate found",
                method="multi_signal_header"
            )

        candidates.sort(key=lambda x: x[0], reverse=True)
        best_score, best_name, best_reasons = candidates[0]

        # Clamp confidence
        confidence = min(1.0, max(0.0, best_score))

        if confidence < 0.4:
            return ExtractedField(
                value=None,
                confidence=confidence,
                source_section="header",
                evidence=f"Low confidence ({confidence:.2f}): {best_reasons}",
                method="multi_signal_header"
            )

        # Clean the name
        clean_name = re.sub(r'[^a-zA-Z\s.\'\-]', '', best_name).strip()
        if not clean_name or len(clean_name) < 2:
            return ExtractedField(value=None, confidence=0.0, source_section="header",
                                  evidence="Name cleanup produced empty string", method="multi_signal_header")

        return ExtractedField(
            value=clean_name,
            confidence=confidence,
            source_section="header",
            evidence=f"Line: '{best_name}' | Signals: {best_reasons}",
            method="multi_signal_header"
        )

    # ── EDUCATION EXTRACTION ─────────────────────────────────────────────────

    @staticmethod
    def parse_education(edu_text: str) -> List[ExtractedEducation]:
        """
        Structured, normalized education extraction.
        Returns list of ExtractedEducation with confidence and evidence.
        """
        if not edu_text or not edu_text.strip():
            return []

        lines = [l.strip() for l in edu_text.split('\n') if l.strip()]
        items: List[ExtractedEducation] = []
        current: Optional[ExtractedEducation] = None

        for line in lines:
            line_low = line.lower()
            date_match = re.search(DATE_RANGE_REGEX, line)
            is_degree = any(re.search(pat, line, re.IGNORECASE) for pat in DEGREE_PATTERNS)
            is_inst = any(re.search(pat, line, re.IGNORECASE) for pat in INSTITUTION_PATTERNS)
            duration_text = date_match.group(0) if date_match else ""
            clean_line = re.sub(DATE_RANGE_REGEX, '', line).strip(' |-,()[]')

            # Detect current/ongoing
            is_ongoing = bool(re.search(r'\b(present|current|now|ongoing)\b', line, re.IGNORECASE))

            # Try to extract start/end dates
            start_d, end_d = _split_date_range(duration_text) if duration_text else ("", "")

            if is_degree or (is_inst and not current):
                if current and (current.degree or current.institution):
                    items.append(current)

                # Try to separate degree and institution if on same line
                degree_raw, institution_raw, field_raw = "", "", ""

                separators = re.split(r'\s*[|,\-–]\s*', clean_line)
                if len(separators) >= 2:
                    for part in separators:
                        p_low = part.lower()
                        if any(re.search(pat, p_low) for pat in DEGREE_PATTERNS) and not degree_raw:
                            degree_raw = part.strip()
                        elif any(re.search(pat, p_low) for pat in INSTITUTION_PATTERNS) and not institution_raw:
                            institution_raw = part.strip()
                else:
                    if is_degree:
                        degree_raw = clean_line
                    if is_inst:
                        institution_raw = clean_line

                # Try to extract field of study from degree line: "B.Tech in Computer Science"
                field_match = re.search(r'\b(?:in|of)\s+([A-Za-z\s]+?)(?:\s*[|,\-–]|$)', degree_raw, re.IGNORECASE)
                if field_match:
                    field_raw = field_match.group(1).strip()

                deg_normalized = normalize_degree(degree_raw)
                confidence = 0.7 if (degree_raw and institution_raw) else 0.5 if (degree_raw or institution_raw) else 0.3

                current = ExtractedEducation(
                    degree=degree_raw,
                    degree_normalized=deg_normalized,
                    field_of_study=field_raw,
                    institution=institution_raw,
                    start_date=start_d,
                    end_date=end_d if not is_ongoing else "Present",
                    ongoing=is_ongoing,
                    confidence=confidence,
                    evidence=line
                )

            elif current and is_inst and not current.institution:
                current.institution = clean_line
                if start_d and not current.start_date:
                    current.start_date = start_d
                if end_d and not current.end_date:
                    current.end_date = end_d
                current.ongoing = current.ongoing or is_ongoing
                current.confidence = min(1.0, current.confidence + 0.2)
                current.evidence += " | " + line

            elif current:
                if date_match and not current.start_date:
                    current.start_date = start_d
                    current.end_date = end_d if not is_ongoing else "Present"
                    current.ongoing = is_ongoing
                elif not current.institution and len(line) < 80:
                    current.institution = clean_line
                current.evidence += " | " + line

        if current and (current.degree or current.institution):
            items.append(current)

        # Fallback: if nothing parsed but we have text, create a single low-confidence entry
        if not items and lines:
            date_match = re.search(DATE_RANGE_REGEX, edu_text)
            start_d, end_d = _split_date_range(date_match.group(0)) if date_match else ("", "")
            items.append(ExtractedEducation(
                degree=lines[0],
                institution=lines[1] if len(lines) > 1 else "",
                start_date=start_d,
                end_date=end_d,
                confidence=0.3,
                evidence="\n".join(lines[:3])
            ))

        return items

    # ── EXPERIENCE EXTRACTION ────────────────────────────────────────────────

    @staticmethod
    def _classify_experience_type(text: str) -> str:
        """Classify experience type from text context."""
        t = text.lower()
        if re.search(INTERNSHIP_INDICATORS, t):
            return "internship"
        if re.search(FREELANCE_INDICATORS, t):
            return "freelance"
        if re.search(VOLUNTEER_INDICATORS, t):
            return "volunteer"
        return "full_time"

    @staticmethod
    def parse_experience(exp_text: str) -> List[ExtractedExperience]:
        """
        Duration-aware, structured experience extraction.
        Calculates duration_months and classifies experience_type.
        """
        if not exp_text or not exp_text.strip():
            return []

        lines = [l.strip() for l in exp_text.split('\n') if l.strip()]
        items: List[ExtractedExperience] = []
        current: Optional[ExtractedExperience] = None

        for line in lines:
            line_low = line.lower()
            date_match = re.search(DATE_RANGE_REGEX, line)
            has_role = any(re.search(pat, line_low) for pat in ROLE_KEYWORDS)

            if has_role or date_match:
                if current and (current.job_title or current.company):
                    items.append(current)

                duration_text = date_match.group(0) if date_match else ""
                start_d, end_d = _split_date_range(duration_text) if duration_text else ("", "")
                is_current = bool(re.search(r'\b(present|current|now|ongoing)\b', end_d, re.IGNORECASE))

                clean_title = re.sub(DATE_RANGE_REGEX, '', line).strip(' |-,()[]')

                job_title, company = "", ""
                if " at " in clean_title.lower():
                    parts = re.split(r'\s+at\s+', clean_title, flags=re.IGNORECASE, maxsplit=1)
                    job_title = parts[0].strip()
                    company = parts[1].strip() if len(parts) > 1 else ""
                elif re.search(r'[|–\-]', clean_title):
                    parts = [p.strip() for p in re.split(r'\s*[|–\-]\s*', clean_title) if p.strip()]
                    if len(parts) >= 2:
                        if any(re.search(pat, parts[0].lower()) for pat in ROLE_KEYWORDS):
                            job_title, company = parts[0], parts[1]
                        elif any(re.search(pat, parts[1].lower()) for pat in ROLE_KEYWORDS):
                            company, job_title = parts[0], parts[1]
                        else:
                            job_title, company = parts[0], parts[1]
                    else:
                        job_title = clean_title
                else:
                    job_title = clean_title

                duration_months = _duration_months(start_d, end_d) if start_d else 0
                exp_type = NLPExtractorService._classify_experience_type(line)

                confidence = 0.8 if (job_title and company and start_d) else \
                             0.6 if (job_title and start_d) else \
                             0.5 if job_title else 0.3

                current = ExtractedExperience(
                    job_title=job_title or "Position",
                    company=company or "",
                    start_date=start_d,
                    end_date=end_d if not is_current else "Present",
                    current=is_current,
                    duration_months=duration_months,
                    experience_type=exp_type,
                    description="",
                    confidence=confidence,
                    evidence=line
                )

            elif current:
                # Try to fill missing company from next non-bullet short line
                if not current.company and len(line) < 60 and not line.startswith(('-', '•', '*', '1', '2', '3')):
                    current.company = line.strip(' |-,()[]')
                else:
                    current.description += (" " if current.description else "") + line
                current.evidence += " | " + line[:80]

        if current and (current.job_title or current.company):
            items.append(current)

        # Fallback
        if not items and lines:
            date_match = re.search(DATE_RANGE_REGEX, exp_text)
            start_d, end_d = _split_date_range(date_match.group(0)) if date_match else ("", "")
            items.append(ExtractedExperience(
                job_title=lines[0],
                company="",
                start_date=start_d,
                end_date=end_d,
                duration_months=_duration_months(start_d, end_d),
                experience_type="unknown",
                description="\n".join(lines[1:]),
                confidence=0.3,
                evidence="\n".join(lines[:3])
            ))

        return items

    # ── PROJECTS & CERTIFICATIONS (unchanged logic, preserved) ───────────────

    @staticmethod
    def parse_projects(proj_text: str) -> List[Dict[str, Any]]:
        if not proj_text:
            return []
        items = []
        lines = [l.strip() for l in proj_text.split('\n') if l.strip()]
        current_proj = None
        for line in lines:
            if len(line) < 65 and not line.startswith(('-', '•', '*')) and (":" in line or "|" in line or not current_proj):
                if current_proj and current_proj["name"]:
                    items.append(current_proj)
                parts = [p.strip() for p in re.split(r'[:|]', line) if p.strip()]
                name = parts[0] if parts else line
                tech = parts[1] if len(parts) > 1 else ""
                current_proj = {"name": name, "description": "", "technologies": tech}
            elif current_proj:
                current_proj["description"] += (" " if current_proj["description"] else "") + line
        if current_proj and current_proj["name"]:
            items.append(current_proj)
        return items

    @staticmethod
    def parse_certifications(cert_text: str) -> List[Dict[str, Any]]:
        if not cert_text:
            return []
        items = []
        lines = [l.strip() for l in cert_text.split('\n') if l.strip()]
        for line in lines:
            if "|" in line or "-" in line or ":" in line:
                parts = [p.strip() for p in re.split(r'[|\-:]', line) if p.strip()]
                items.append({"name": parts[0], "issuer": parts[1] if len(parts) > 1 else ""})
            else:
                items.append({"name": line, "issuer": ""})
        return items

    # ── SKILL EXTRACTION ─────────────────────────────────────────────────────

    @staticmethod
    def extract_skills_from_text(text: str, db: Session, skills_section_text: str = "") -> List[str]:
        """
        Extracts skills from full text using database Skill taxonomy & SkillAlias table.
        Uses exact token matching & word boundaries to avoid false positives.
        """
        if not text:
            return []

        text_lower = f" {text.lower()} "
        found_skills = set()

        # Query all canonical skills and aliases from DB
        all_skills = db.query(Skill.skill).all()
        canonical_map = {}
        for (skill_name,) in all_skills:
            if skill_name:
                canonical_map[skill_name.lower()] = skill_name

        all_aliases = db.query(SkillAlias.alias, SkillAlias.canonical_skill).all()
        for alias, canonical in all_aliases:
            if alias and canonical:
                canonical_map[alias.lower()] = canonical

        # Match longest terms first to prevent 'C' matching 'C++' or 'JS' matching 'JSON'
        sorted_terms = sorted(canonical_map.keys(), key=lambda x: len(x), reverse=True)

        for term in sorted_terms:
            if len(term) <= 1:
                pattern = r'(?<=[\s,.:;/(])' + re.escape(term) + r'(?=[\s,.:;/)]|$)'
            else:
                pattern = r'\b' + re.escape(term) + r'\b'

            if re.search(pattern, text_lower):
                found_skills.add(canonical_map[term])

        # Also extract raw skill tokens from explicitly labeled skills section
        if skills_section_text:
            raw_tokens = re.split(r'[,;|\n•*\-]', skills_section_text)
            for token in raw_tokens:
                clean_tok = token.strip()
                if len(clean_tok) >= 2 and len(clean_tok) <= 30 and not clean_tok.lower().startswith(('skill', 'technical', 'tools')):
                    norm_key = clean_tok.lower()
                    if norm_key in canonical_map:
                        found_skills.add(canonical_map[norm_key])
                    elif re.match(r'^[a-zA-Z0-9\s.+#/\-]+$', clean_tok):
                        found_skills.add(clean_tok.title())

        return sorted(list(found_skills))

    # ── MAIN PROFILE EXTRACTION ──────────────────────────────────────────────

    @classmethod
    def extract_profile(cls, raw_text: str, db: Session) -> Dict[str, Any]:
        """
        Parses raw text into a structured profile dictionary.
        Returns a backward-compatible dict PLUS new evidence/confidence fields.
        """
        if not raw_text:
            logger.warning("extract_profile called with empty raw_text")
            return {
                "name": "", "email": "", "phone": "",
                "education": [], "experience": [], "skills": [],
                "projects": [], "certifications": []
            }

        cleaned = clean_text(raw_text)
        sections = split_into_sections(cleaned)

        email_val = extract_email(cleaned)
        phone_val = extract_phone(cleaned)

        # Get known skills for name extraction anti-signal
        all_skill_names = {row[0] for row in db.query(Skill.skill).all() if row[0]}

        name_field = cls.extract_name(sections.get("header", ""), cleaned, all_skill_names)
        skills = cls.extract_skills_from_text(cleaned, db, sections.get("skills", ""))
        education = cls.parse_education(sections.get("education", ""))
        experience = cls.parse_experience(sections.get("experience", ""))
        projects = cls.parse_projects(sections.get("projects", ""))
        certifications = cls.parse_certifications(sections.get("certifications", ""))

        # Build backward-compatible flat education/experience lists
        edu_flat = [
            {
                "degree": e.degree_normalized or e.degree,
                "institution": e.institution or "University / College",
                "duration": f"{e.start_date} - {e.end_date}".strip(" -"),
                "details": e.evidence,
                "field": e.field_of_study,
                "ongoing": e.ongoing,
                "confidence": round(e.confidence, 2)
            }
            for e in education
        ] or [{
            "degree": "Degree / Qualification",
            "institution": "University / College",
            "duration": "", "details": ""
        }]

        exp_flat = [
            {
                "company": e.company or "Organization",
                "role": e.job_title or "Position",
                "duration": f"{e.start_date} - {e.end_date}".strip(" -"),
                "description": e.description,
                "duration_months": e.duration_months,
                "experience_type": e.experience_type,
                "current": e.current,
                "confidence": round(e.confidence, 2)
            }
            for e in experience
        ]

        return {
            "name": name_field.value or "Candidate",
            "name_confidence": round(name_field.confidence, 2),
            "email": email_val or "",
            "phone": phone_val or "",
            "education": edu_flat,
            "experience": exp_flat,
            "skills": skills,
            "projects": projects,
            "certifications": certifications
        }
