from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models import LearningResource
from app.services.skill_normalizer import SkillNormalizerService

class ResourceService:
    @staticmethod
    def get_resources_by_skill(db: Session, skill_identifier: str) -> Dict[str, Any]:
        """
        Retrieves learning resources for a given skill or skill_id, grouped by YouTube, articles, and roadmaps.
        """
        normalizer = SkillNormalizerService(db)
        canonical_name = normalizer.normalize(skill_identifier)

        # Query resources matching skill_id or skill name
        resources = db.query(LearningResource).filter(
            (LearningResource.skill_id == skill_identifier) |
            (LearningResource.skill.ilike(skill_identifier)) |
            (LearningResource.skill.ilike(canonical_name))
        ).all()

        grouped: Dict[str, List[Dict[str, Any]]] = {
            "youtube": [],
            "articles": [],
            "roadmaps": []
        }

        for r in resources:
            item = {
                "resource_id": r.resource_id,
                "skill_id": r.skill_id,
                "skill": r.skill,
                "resource_type": r.resource_type,
                "title": r.title,
                "url": r.url,
                "provider": r.provider,
                "difficulty": r.difficulty,
                "description": r.description,
                "duration": r.duration
            }

            res_type = (r.resource_type or "").lower()
            if "youtube" in res_type or "video" in res_type:
                grouped["youtube"].append(item)
            elif "roadmap" in res_type:
                grouped["roadmaps"].append(item)
            else:
                grouped["articles"].append(item)

        return {
            "skill": canonical_name or skill_identifier,
            "resources": grouped
        }
