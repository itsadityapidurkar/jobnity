import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.utils.text_processing import (
    extract_email, extract_phone, split_into_sections, clean_text
)
from app.models import Skill, SkillAlias

DEGREE_PATTERNS = [
    r'\b(bachelor|master|phd|b\.s\.|m\.s\.|b\.e\.|m\.e\.|b\.tech|m\.tech|bca|mca|b\.a\.|m\.a\.|associate|diploma)\b',
    r'\b(computer science|data science|information technology|software engineering|electrical engineering|mathematics|physics|business)\b'
]

class NLPExtractorService:
    @staticmethod
    def extract_name(header_text: str, full_text: str) -> str:
        """Extract candidate name from top lines of resume."""
        lines = [line.strip() for line in (header_text or full_text).split('\n') if line.strip()]
        for line in lines[:5]:
            # Skip email or phone lines
            if '@' in line or re.search(r'\d{7,}', line) or 'resume' in line.lower() or 'curriculum' in line.lower():
                continue
            # A candidate name is usually 2-4 words, capitalized letters
            words = line.split()
            if 1 <= len(words) <= 4 and all(w[0].isupper() or w.isalpha() for w in words if len(w) > 1):
                clean_name = re.sub(r'[^a-zA-Z\s.-]', '', line).strip()
                if clean_name and len(clean_name) > 2:
                    return clean_name
        return "Candidate"

    @staticmethod
    def extract_skills_from_text(text: str, db: Session) -> List[str]:
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
                # Require strict boundary for single character skills like 'R' or 'C'
                pattern = r'(?<=[\s,.:;/(])' + re.escape(term) + r'(?=[\s,.:;/)]|$)'
            else:
                pattern = r'\b' + re.escape(term) + r'\b'
            
            if re.search(pattern, text_lower):
                found_skills.add(canonical_map[term])

        return sorted(list(found_skills))

    @staticmethod
    def parse_education(edu_text: str) -> List[Dict[str, Any]]:
        if not edu_text:
            return []
        items = []
        lines = [l.strip() for l in edu_text.split('\n') if l.strip()]
        for line in lines:
            if any(re.search(pat, line, re.IGNORECASE) for pat in DEGREE_PATTERNS):
                items.append({
                    "degree": line,
                    "institution": "University / College",
                    "details": line
                })
        if not items and lines:
            items.append({
                "degree": lines[0],
                "institution": lines[1] if len(lines) > 1 else "",
                "details": "\n".join(lines)
            })
        return items

    @staticmethod
    def parse_experience(exp_text: str) -> List[Dict[str, Any]]:
        if not exp_text:
            return []
        lines = [l.strip() for l in exp_text.split('\n') if l.strip()]
        items = []
        current_exp = None
        for line in lines:
            # Look for job title or date pattern
            if len(line) < 80 and any(kw in line.lower() for kw in ['engineer', 'developer', 'analyst', 'manager', 'lead', 'intern', 'specialist', 'consultant', '201', '202', 'present']):
                if current_exp:
                    items.append(current_exp)
                current_exp = {
                    "company": "Company",
                    "role": line,
                    "duration": "",
                    "description": ""
                }
            elif current_exp:
                current_exp["description"] += " " + line
        if current_exp:
            items.append(current_exp)
        if not items and lines:
            items.append({
                "company": "Organization",
                "role": lines[0],
                "duration": "",
                "description": "\n".join(lines)
            })
        return items

    @classmethod
    def extract_profile(cls, raw_text: str, db: Session) -> Dict[str, Any]:
        """
        Parses raw text into CandidateProfile structured dictionary.
        """
        cleaned = clean_text(raw_text)
        sections = split_into_sections(cleaned)

        email = extract_email(cleaned)
        phone = extract_phone(cleaned)
        name = cls.extract_name(sections.get("header", ""), cleaned)
        skills = cls.extract_skills_from_text(cleaned, db)
        education = cls.parse_education(sections.get("education", ""))
        experience = cls.parse_experience(sections.get("experience", ""))

        projects = []
        if sections.get("projects"):
            proj_lines = [l.strip() for l in sections["projects"].split('\n') if l.strip()]
            if proj_lines:
                projects.append({
                    "name": proj_lines[0],
                    "description": "\n".join(proj_lines[1:]),
                    "technologies": ""
                })

        certifications = []
        if sections.get("certifications"):
            cert_lines = [l.strip() for l in sections["certifications"].split('\n') if l.strip()]
            for cl in cert_lines:
                certifications.append({"name": cl, "issuer": ""})

        return {
            "name": name,
            "email": email or "",
            "phone": phone or "",
            "education": education,
            "experience": experience,
            "skills": skills,
            "projects": projects,
            "certifications": certifications
        }
