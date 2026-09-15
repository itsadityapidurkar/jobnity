from typing import List, Dict
from sqlalchemy.orm import Session
from app.models import Skill, SkillAlias

class SkillNormalizerService:
    def __init__(self, db: Session):
        self.db = db
        self._load_mappings()

    def _load_mappings(self):
        self.alias_to_canonical: Dict[str, str] = {}
        self.canonical_skills: Dict[str, str] = {}
        self.skill_ids: Dict[str, str] = {}

        # Load canonical skills
        skills = self.db.query(Skill).all()
        for s in skills:
            if s.skill:
                name_lower = s.skill.strip().lower()
                self.canonical_skills[name_lower] = s.skill.strip()
                self.skill_ids[name_lower] = s.skill_id

        # Load aliases
        aliases = self.db.query(SkillAlias).all()
        for a in aliases:
            if a.alias and a.canonical_skill:
                alias_lower = a.alias.strip().lower()
                self.alias_to_canonical[alias_lower] = a.canonical_skill.strip()

    def normalize(self, skill_name: str) -> str:
        """
        Normalizes a single skill string to its canonical taxonomy form.
        """
        if not skill_name or not skill_name.strip():
            return ""

        term = skill_name.strip()
        term_lower = term.lower()

        # 1. Check exact alias match
        if term_lower in self.alias_to_canonical:
            return self.alias_to_canonical[term_lower]

        # 2. Check canonical skill match
        if term_lower in self.canonical_skills:
            return self.canonical_skills[term_lower]

        # 3. Known inline fallbacks
        fallbacks = {
            "ml": "Machine Learning",
            "js": "JavaScript",
            "ts": "TypeScript",
            "sklearn": "Scikit-learn",
            "py": "Python",
            "reactjs": "React",
            "vuejs": "Vue.js",
            "nodejs": "Node.js",
            "postgres": "PostgreSQL",
            "aws": "Amazon Web Services",
            "gcp": "Google Cloud Platform",
            "k8s": "Kubernetes",
            "tf": "TensorFlow",
            "dl": "Deep Learning",
            "nlp": "Natural Language Processing",
            "cv": "Computer Vision"
        }
        if term_lower in fallbacks:
            canonical = fallbacks[term_lower]
            # Check if canonical is in canonical_skills for exact casing
            if canonical.lower() in self.canonical_skills:
                return self.canonical_skills[canonical.lower()]
            return canonical

        # 4. Return trimmed original string
        return term

    def normalize_list(self, skill_list: List[str]) -> List[str]:
        """
        Normalizes a list of skills, deduplicating while preserving order.
        """
        normalized_set = set()
        result = []
        for s in skill_list:
            norm = self.normalize(s)
            if norm and norm.lower() not in normalized_set:
                normalized_set.add(norm.lower())
                result.append(norm)
        return result

    def get_skill_id(self, skill_name: str) -> str:
        """Returns the skill_id if present in taxonomy database, else generates empty."""
        norm = self.normalize(skill_name)
        norm_lower = norm.lower()
        if norm_lower in self.skill_ids:
            return self.skill_ids[norm_lower]
        return ""
