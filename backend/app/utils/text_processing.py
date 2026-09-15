import re
from typing import Dict, List, Optional

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'

SECTION_HEADERS = {
    "education": [r'\beducation\b', r'\bacademic background\b', r'\bqualification[s]?\b', r'\bacademics\b'],
    "experience": [r'\bwork experience\b', r'\bemployment history\b', r'\bexperience\b', r'\bprofessional experience\b', r'\bwork history\b'],
    "skills": [r'\btechnical skills\b', r'\bskills\b', r'\bcore competencies\b', r'\btechnologies\b', r'\btools & technologies\b'],
    "projects": [r'\bprojects\b', r'\bkey projects\b', r'\bpersonal projects\b', r'\bacademic projects\b'],
    "certifications": [r'\bcertifications\b', r'\bcertificates\b', r'\blicenses\b', r'\baccreditation[s]?\b']
}

def clean_text(text: str) -> str:
    """Cleans extracted text by normalizing whitespace and special characters."""
    if not text:
        return ""
    # Replace non-breaking spaces and redundant whitespaces
    text = text.replace('\xa0', ' ').replace('\r', '\n')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def extract_email(text: str) -> Optional[str]:
    match = re.search(EMAIL_REGEX, text)
    return match.group(0) if match else None

def extract_phone(text: str) -> Optional[str]:
    match = re.search(PHONE_REGEX, text)
    return match.group(0) if match else None

def split_into_sections(text: str) -> Dict[str, str]:
    """
    Splits resume text into logical sections based on regex header patterns.
    """
    lines = text.split('\n')
    sections: Dict[str, List[str]] = {
        "header": [],
        "education": [],
        "experience": [],
        "skills": [],
        "projects": [],
        "certifications": []
    }
    
    current_section = "header"
    
    for line in lines:
        clean_line = line.strip().lower()
        matched_section = None
        
        # Check if line matches a known section header
        if len(clean_line) < 40:  # Header lines are usually short
            for sec_name, patterns in SECTION_HEADERS.items():
                for pat in patterns:
                    if re.search(pat, clean_line):
                        matched_section = sec_name
                        break
                if matched_section:
                    break
        
        if matched_section:
            current_section = matched_section
        else:
            sections[current_section].append(line)

    return {k: "\n".join(v).strip() for k, v in sections.items()}
