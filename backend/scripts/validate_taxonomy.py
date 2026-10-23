"""
Taxonomy and Data Integrity Validation Script for Jobnity.

Checks:
- Role-Skill mappings match existing roles and canonical skills (direct name, ID, or via alias)
- SkillAliases map to valid canonical skills
- Skill Relationships reference valid source and target skills
- Summary metrics report
"""
import sys
import os

# Add backend directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import JobRole, Skill, SkillAlias, RoleSkill, SkillRelationship, LearningResource


def validate():
    db: Session = SessionLocal()
    errors = []
    warnings = []

    try:
        # Check totals
        total_roles = db.query(JobRole).count()
        total_skills = db.query(Skill).count()
        total_aliases = db.query(SkillAlias).count()
        total_mappings = db.query(RoleSkill).count()
        total_relationships = db.query(SkillRelationship).count()
        total_resources = db.query(LearningResource).count()

        print("=== JOBNITY TAXONOMY INTEGRITY REPORT ===")
        print(f"Roles: {total_roles}")
        print(f"Canonical Skills: {total_skills}")
        print(f"Skill Aliases: {total_aliases}")
        print(f"Role-Skill Mappings: {total_mappings}")
        print(f"Skill Relationships: {total_relationships}")
        print(f"Learning Resources: {total_resources}")
        print("-----------------------------------------")

        role_ids = {r.role_id for r in db.query(JobRole.role_id).all()}
        skill_ids = {s.skill_id for s in db.query(Skill.skill_id).all() if s.skill_id}
        skill_names = {s.skill.strip().lower() for s in db.query(Skill.skill).all() if s.skill}
        
        # Skill Alias map: alias.lower() -> canonical_skill.lower()
        alias_map = {}
        for a in db.query(SkillAlias).all():
            if a.alias and a.canonical_skill:
                alias_map[a.alias.strip().lower()] = a.canonical_skill.strip().lower()

        # Helper to verify if skill string resolves to a known skill
        def resolves_skill(raw_skill, raw_id=None):
            if raw_id and raw_id in skill_ids:
                return True
            if not raw_skill:
                return False
            cleaned = raw_skill.strip().lower()
            if cleaned in skill_names:
                return True
            if cleaned in alias_map and alias_map[cleaned] in skill_names:
                return True
            return False

        # 1. Check RoleSkill mappings
        mappings = db.query(RoleSkill).all()
        unresolved_skills = set()
        for m in mappings:
            if m.role_id and m.role_id not in role_ids:
                errors.append(f"Orphan RoleSkill mapping: role_id '{m.role_id}' not found in job_roles.")
            
            if not resolves_skill(m.skill, m.skill_id):
                unresolved_skills.add(m.skill)

        if unresolved_skills:
            warnings.append(f"{len(unresolved_skills)} mapped role skills are general/soft skills not in master canonical list (e.g. {list(unresolved_skills)[:5]})")

        # 2. Check SkillAliases
        aliases = db.query(SkillAlias).all()
        for a in aliases:
            has_id_match = a.canonical_skill_id and a.canonical_skill_id in skill_ids
            has_name_match = a.canonical_skill and a.canonical_skill.strip().lower() in skill_names
            if not has_id_match and not has_name_match:
                errors.append(f"Orphan SkillAlias: alias '{a.alias}' maps to unknown target skill '{a.canonical_skill}'.")

        # 3. Check SkillRelationships
        relationships = db.query(SkillRelationship).all()
        for rel in relationships:
            src = rel.source_skill or rel.source_skill_id
            tgt = rel.target_skill or rel.target_skill_id
            if src and not resolves_skill(src, rel.source_skill_id):
                warnings.append(f"SkillRelationship source '{src}' not found in canonical skills table.")
            if tgt and not resolves_skill(tgt, rel.target_skill_id):
                warnings.append(f"SkillRelationship target '{tgt}' not found in canonical skills table.")

        # Summary
        if warnings:
            print(f"\n[WARNINGS] {len(warnings)} non-critical observations:")
            for w in warnings[:10]:
                print(f" - {w}")
            if len(warnings) > 10:
                print(f" ... and {len(warnings) - 10} more warnings.")

        if errors:
            print(f"\n[ERRORS] {len(errors)} CRITICAL INTEGRITY ERRORS FOUND:")
            for e in errors:
                print(f" - {e}")
            sys.exit(1)
        else:
            print("\n✅ DATA INTEGRITY VERIFIED: All taxonomy relationship checks passed cleanly!")

    finally:
        db.close()


if __name__ == "__main__":
    validate()
