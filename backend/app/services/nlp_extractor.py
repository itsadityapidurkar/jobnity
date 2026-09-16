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
INSTITUTION_PATTERNS = [
    r'\b(university|college|institute|school|academy|iit|nit|mit|polytechnic)\b'
]
DATE_RANGE_REGEX = r'(?i)\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,./-]*)?\d{4}\s*(?:-|–|to|until)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,./-]*)?(?:\d{4}|present|current|now)\b|\b(?:19|20)\d{2}\s*(?:-|–|to)\s*(?:(?:19|20)\d{2}|present|current|now)\b|\b(?:19|20)\d{2}\b'

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
                # Require strict boundary for single character skills like 'R' or 'C'
                pattern = r'(?<=[\s,.:;/(])' + re.escape(term) + r'(?=[\s,.:;/)]|$)'
            else:
                pattern = r'\b' + re.escape(term) + r'\b'
            
            if re.search(pattern, text_lower):
                found_skills.add(canonical_map[term])

        # Also extract raw skill tokens from explicitly labeled skills section
        if skills_section_text:
            raw_tokens = re.split(r'[,;|\n•*-]', skills_section_text)
            for token in raw_tokens:
                clean_tok = token.strip()
                if len(clean_tok) >= 2 and len(clean_tok) <= 30 and not clean_tok.lower().startswith(('skill', 'technical', 'tools')):
                    # If it maps to a canonical skill, use that, otherwise use clean title token
                    norm_key = clean_tok.lower()
                    if norm_key in canonical_map:
                        found_skills.add(canonical_map[norm_key])
                    elif re.match(r'^[a-zA-Z0-9\s.+#/-]+$', clean_tok):
                        found_skills.add(clean_tok.title())

        return sorted(list(found_skills))

    @staticmethod
    def parse_education(edu_text: str) -> List[Dict[str, Any]]:
        if not edu_text:
            return []
        
        lines = [l.strip() for l in edu_text.split('\n') if l.strip()]
        items = []
        current_edu = None

        for line in lines:
            line_low = line.lower()
            date_match = re.search(DATE_RANGE_REGEX, line)
            is_degree = any(re.search(pat, line, re.IGNORECASE) for pat in DEGREE_PATTERNS)
            is_inst = any(re.search(pat, line, re.IGNORECASE) for pat in INSTITUTION_PATTERNS)
            duration = date_match.group(0) if date_match else ""
            clean_line = re.sub(DATE_RANGE_REGEX, '', line).strip(' |-,()[]')

            if current_edu and is_inst and (current_edu["institution"] == "University / College" or not current_edu["institution"]):
                current_edu["institution"] = clean_line
                if duration and not current_edu["duration"]:
                    current_edu["duration"] = duration
                current_edu["details"] += " | " + line
            elif is_degree or is_inst or date_match:
                if current_edu and (current_edu["degree"] or current_edu["institution"]):
                    items.append(current_edu)
                
                degree = clean_line if is_degree else ""
                institution = clean_line if is_inst and not is_degree else ""

                if "|" in clean_line or "-" in clean_line or "–" in clean_line:
                    parts = [p.strip() for p in re.split(r'[|\-–]', clean_line) if p.strip()]
                    if len(parts) >= 2:
                        if any(re.search(pat, parts[0], re.IGNORECASE) for pat in DEGREE_PATTERNS):
                            degree = parts[0]
                            institution = parts[1]
                        elif any(re.search(pat, parts[1], re.IGNORECASE) for pat in DEGREE_PATTERNS):
                            institution = parts[0]
                            degree = parts[1]

                current_edu = {
                    "degree": degree or "Degree / Qualification",
                    "institution": institution or "University / College",
                    "duration": duration,
                    "details": line
                }
            elif current_edu:
                if (current_edu["institution"] == "University / College" or not current_edu["institution"]) and len(line) < 70:
                    current_edu["institution"] = clean_line
                current_edu["details"] += " | " + line

        if current_edu and (current_edu["degree"] or current_edu["institution"]):
            items.append(current_edu)

        if not items and lines:
            date_match = re.search(DATE_RANGE_REGEX, edu_text)
            items.append({
                "degree": lines[0],
                "institution": lines[1] if len(lines) > 1 else "University / College",
                "duration": date_match.group(0) if date_match else "",
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
        role_keywords = [
            r'\bengineer\b', r'\bdeveloper\b', r'\banalyst\b', r'\bmanager\b', r'\blead\b', 
            r'\bintern\b', r'\bspecialist\b', r'\bconsultant\b', r'\barchitect\b', r'\bdesigner\b', 
            r'\badministrator\b', r'\bscientist\b', r'\bofficer\b', r'\bhead\b', r'\bdirector\b', r'\bassociate\b'
        ]

        for line in lines:
            line_low = line.lower()
            date_match = re.search(DATE_RANGE_REGEX, line)
            has_role = any(re.search(pat, line_low) for pat in role_keywords)

            if has_role or date_match:
                if current_exp and (current_exp["role"] or current_exp["company"]):
                    items.append(current_exp)
                
                duration = date_match.group(0) if date_match else ""
                clean_title = re.sub(DATE_RANGE_REGEX, '', line).strip(' |-,()[]')

                role, company = "", ""
                if " at " in clean_title.lower():
                    parts = re.split(r'\s+at\s+', clean_title, flags=re.IGNORECASE)
                    role = parts[0].strip()
                    company = parts[1].strip() if len(parts) > 1 else ""
                elif "|" in clean_title or "-" in clean_title or "–" in clean_title:
                    parts = [p.strip() for p in re.split(r'[|\-–]', clean_title) if p.strip()]
                    if len(parts) >= 2:
                        if any(re.search(pat, parts[0].lower()) for pat in role_keywords):
                            role, company = parts[0], parts[1]
                        elif any(re.search(pat, parts[1].lower()) for pat in role_keywords):
                            company, role = parts[0], parts[1]
                        else:
                            role, company = parts[0], parts[1]
                    else:
                        role = clean_title
                else:
                    role = clean_title

                current_exp = {
                    "company": company or "Organization",
                    "role": role or "Position",
                    "duration": duration,
                    "description": ""
                }
            elif current_exp:
                if (current_exp["company"] == "Organization" or not current_exp["company"]) and len(line) < 60 and not line.startswith(('-', '•', '*', '1', '2', '3')):
                    current_exp["company"] = line.strip(' |-,()[]')
                else:
                    current_exp["description"] += (" " if current_exp["description"] else "") + line

        if current_exp and (current_exp["role"] or current_exp["company"]):
            items.append(current_exp)

        if not items and lines:
            date_match = re.search(DATE_RANGE_REGEX, exp_text)
            items.append({
                "company": "Organization",
                "role": lines[0],
                "duration": date_match.group(0) if date_match else "",
                "description": "\n".join(lines[1:])
            })

        return items

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
                current_proj = {
                    "name": name,
                    "description": "",
                    "technologies": tech
                }
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
                name = parts[0]
                issuer = parts[1] if len(parts) > 1 else ""
                items.append({"name": name, "issuer": issuer})
            else:
                items.append({"name": line, "issuer": ""})
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
        skills = cls.extract_skills_from_text(cleaned, db, sections.get("skills", ""))
        education = cls.parse_education(sections.get("education", ""))
        experience = cls.parse_experience(sections.get("experience", ""))
        projects = cls.parse_projects(sections.get("projects", ""))
        certifications = cls.parse_certifications(sections.get("certifications", ""))

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

