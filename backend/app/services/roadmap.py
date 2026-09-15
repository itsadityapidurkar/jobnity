from typing import Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models import JobRole, RoleSkill, LearningResource, SkillGapAnalysis, Skill
from app.services.resource_service import ResourceService

class RoadmapService:
    @staticmethod
    def get_roadmap_skills(db: Session) -> List[Dict[str, Any]]:
        """Returns skills available for roadmap exploration with resource count."""
        # Query distinct skills from learning resources
        counts = db.query(
            LearningResource.skill, 
            LearningResource.skill_id, 
            func.count(LearningResource.resource_id)
        ).group_by(LearningResource.skill, LearningResource.skill_id).all()

        results = []
        for skill_name, skill_id, cnt in counts:
            if skill_name:
                results.append({
                    "skill_id": skill_id or "",
                    "skill": skill_name,
                    "resource_count": cnt
                })
        return results

    @staticmethod
    def get_roadmap_by_role(db: Session, role_id: str) -> Dict[str, Any]:
        """Returns role skills and their learning resource count."""
        role = db.query(JobRole).filter(JobRole.role_id == role_id).first()
        if not role:
            role = db.query(JobRole).filter(JobRole.job_role.ilike(f"%{role_id}%")).first()

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role '{role_id}' not found."
            )

        role_skills = db.query(RoleSkill).filter(RoleSkill.role_id == role.role_id).all()
        skills_with_resources = []

        for rs in role_skills:
            res_count = db.query(func.count(LearningResource.resource_id)).filter(
                (LearningResource.skill_id == rs.skill_id) |
                (LearningResource.skill.ilike(rs.skill))
            ).scalar() or 0

            skills_with_resources.append({
                "skill_id": rs.skill_id or "",
                "skill": rs.skill,
                "importance": rs.importance or "Required",
                "priority": rs.priority or 3,
                "resource_count": res_count
            })

        return {
            "role_id": role.role_id,
            "role": role.job_role,
            "category": role.category,
            "skills": skills_with_resources
        }

    @staticmethod
    def get_recommendations_for_analysis(db: Session, analysis_id: str) -> Dict[str, Any]:
        """
        Retrieves recommended learning resources for all missing skills in a skill-gap analysis.
        Sorted by: Importance (Required > Preferred) then Priority.
        """
        analysis = db.query(SkillGapAnalysis).filter(SkillGapAnalysis.analysis_id == analysis_id).first()
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis '{analysis_id}' not found."
            )

        missing_items = analysis.missing_skills or []
        preferred_items = analysis.preferred_missing_skills or []

        all_missing = []
        for item in missing_items:
            all_missing.append({**item, "sort_importance": 1})
        for item in preferred_items:
            all_missing.append({**item, "sort_importance": 2})

        # Sort by importance (1 before 2) and priority descending
        all_missing.sort(key=lambda x: (x.get("sort_importance", 1), -x.get("priority", 3)))

        recommendations = []
        for m in all_missing:
            skill_name = m.get("skill")
            skill_id = m.get("skill_id")
            res_data = ResourceService.get_resources_by_skill(db, skill_id or skill_name)

            recommendations.append({
                "skill": skill_name,
                "importance": m.get("importance", "Required"),
                "priority": m.get("priority", 3),
                "youtube": res_data["resources"]["youtube"],
                "articles": res_data["resources"]["articles"],
                "roadmap": res_data["resources"]["roadmaps"]
            })

        return {
            "analysis_id": analysis_id,
            "target_role": analysis.target_role,
            "recommendations": recommendations
        }
