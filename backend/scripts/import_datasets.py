import os
import csv
import sys
import uuid

# Add parent directory to python path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
from app.models import (
    JobRole, Skill, SkillAlias, SkillRelationship, 
    RoleSkill, LearningResource, Resume, CandidateProfile
)

def find_dataset_dir():
    candidates = ["jobnitydatasets", "datasets", "../jobnitydatasets", "../datasets"]
    for path in candidates:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path) and os.path.isdir(abs_path):
            return abs_path
    raise FileNotFoundError("Could not locate datasets directory.")

def import_datasets():
    print("Creating database tables if not exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    dataset_dir = find_dataset_dir()
    print(f"Loading datasets from: {dataset_dir}")

    # 1. Job Roles
    roles_csv = os.path.join(dataset_dir, "job_roles_dataset.csv")
    if os.path.exists(roles_csv):
        with open(roles_csv, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                role_id = row.get("role_id", "").strip()
                if not role_id:
                    continue
                existing = db.query(JobRole).filter(JobRole.role_id == role_id).first()
                if not existing:
                    db.add(JobRole(
                        role_id=role_id,
                        job_role=row.get("job_role", "").strip(),
                        category=row.get("category", "").strip(),
                        sub_category=row.get("sub_category", "").strip(),
                        role_description=row.get("role_description", "").strip(),
                        experience_level=row.get("experience_level", "").strip(),
                        common_alternative_titles=row.get("common_alternative_titles", "").strip(),
                        industry=row.get("industry", "").strip(),
                        source=row.get("source", "").strip()
                    ))
                    count += 1
            db.commit()
            print(f"Imported {count} job roles.")

    # 2. Skills Taxonomy
    skills_csv = os.path.join(dataset_dir, "skills_taxonomy_dataset.csv")
    if os.path.exists(skills_csv):
        with open(skills_csv, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                skill_id = row.get("skill_id", "").strip()
                if not skill_id:
                    continue
                existing = db.query(Skill).filter(Skill.skill_id == skill_id).first()
                if not existing:
                    db.add(Skill(
                        skill_id=skill_id,
                        skill=row.get("skill", "").strip(),
                        category=row.get("category", "").strip(),
                        sub_category=row.get("sub_category", "").strip(),
                        description=row.get("description", "").strip(),
                        aliases=row.get("aliases", "").strip(),
                        parent_skill=row.get("parent_skill", "").strip(),
                        related_skills=row.get("related_skills", "").strip(),
                        prerequisite_skills=row.get("prerequisite_skills", "").strip(),
                        skill_type=row.get("skill_type", "").strip(),
                        technical_domain=row.get("technical_domain", "").strip()
                    ))
                    count += 1
            db.commit()
            print(f"Imported {count} skills taxonomy entries.")

    # 3. Skill Aliases
    aliases_csv = os.path.join(dataset_dir, "skill_alias_mapping.csv")
    if os.path.exists(aliases_csv):
        with open(aliases_csv, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            seen_aliases = set(a.alias for a in db.query(SkillAlias.alias).all())
            for row in reader:
                alias = row.get("alias", "").strip()
                if not alias or alias in seen_aliases:
                    continue
                seen_aliases.add(alias)
                db.add(SkillAlias(
                    alias=alias,
                    canonical_skill_id=row.get("canonical_skill_id", "").strip(),
                    canonical_skill=row.get("canonical_skill", "").strip(),
                    confidence=row.get("confidence", "").strip()
                ))
                count += 1
            db.commit()
            print(f"Imported {count} skill aliases.")

    # 4. Role Skills
    role_skills_csv = os.path.join(dataset_dir, "role_skills_dataset.csv")
    if os.path.exists(role_skills_csv):
        with open(role_skills_csv, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                role_id = row.get("role_id", "").strip()
                skill_name = row.get("skill", "").strip()
                if not role_id or not skill_name:
                    continue
                existing = db.query(RoleSkill).filter(
                    RoleSkill.role_id == role_id,
                    RoleSkill.skill == skill_name
                ).first()
                if not existing:
                    priority = 3
                    try:
                        priority = int(row.get("priority", 3))
                    except (ValueError, TypeError):
                        pass

                    db.add(RoleSkill(
                        role_id=role_id,
                        job_role=row.get("job_role", "").strip(),
                        skill_id=row.get("skill_id", "").strip(),
                        skill=skill_name,
                        skill_category=row.get("skill_category", "").strip(),
                        importance=row.get("importance", "Required").strip(),
                        priority=priority,
                        minimum_level=row.get("minimum_level", "Intermediate").strip(),
                        frequency=row.get("frequency", "").strip(),
                        skill_evidence=row.get("skill_evidence", "").strip()
                    ))
                    count += 1
            db.commit()
            print(f"Imported {count} role skill mappings.")

    # 5. Learning Resources
    resources_csv = os.path.join(dataset_dir, "learning_resources_dataset.csv")
    if os.path.exists(resources_csv):
        with open(resources_csv, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                res_id = row.get("resource_id", "").strip()
                if not res_id:
                    continue
                existing = db.query(LearningResource).filter(LearningResource.resource_id == res_id).first()
                if not existing:
                    q_score = 4.5
                    r_score = 4.5
                    try:
                        q_score = float(row.get("quality_score", 4.5))
                        r_score = float(row.get("relevance_score", 4.5))
                    except (ValueError, TypeError):
                        pass

                    db.add(LearningResource(
                        resource_id=res_id,
                        skill_id=row.get("skill_id", "").strip(),
                        skill=row.get("skill", "").strip(),
                        resource_type=row.get("resource_type", "YouTube").strip(),
                        title=row.get("title", "").strip(),
                        url=row.get("url", "").strip(),
                        provider=row.get("provider", "").strip(),
                        difficulty=row.get("difficulty", "Intermediate").strip(),
                        description=row.get("description", "").strip(),
                        duration=row.get("duration", "").strip(),
                        quality_score=q_score,
                        relevance_score=r_score,
                        verified=row.get("verified", "True").lower() == "true"
                    ))
                    count += 1
            db.commit()
            print(f"Imported {count} learning resources.")

    # 6. Sample Resumes (Seed top sample candidate profiles)
    resumes_csv = os.path.join(dataset_dir, "resume_dataset_clean.csv")
    if os.path.exists(resumes_csv):
        with open(resumes_csv, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for idx, row in enumerate(reader):
                if idx >= 20:  # Seed 20 sample resumes for development/testing
                    break
                res_id = row.get("resume_id", f"sample_{idx}").strip()
                existing = db.query(Resume).filter(Resume.resume_id == res_id).first()
                if not existing:
                    skills_raw = row.get("skills", "")
                    skills_list = [s.strip() for s in skills_raw.replace("[","").replace("]","").replace("'","").split(",") if s.strip()]

                    name = row.get("name", "Alex Morgan")
                    if not name or name == "[REDACTED]":
                        name = f"Sample Candidate {idx+1}"
                    email = row.get("email", "candidate@example.com")
                    if not email or email == "[REDACTED]":
                        email = f"candidate{idx+1}@example.com"

                    resume_record = Resume(
                        resume_id=res_id,
                        filename=f"sample_resume_{idx+1}.pdf",
                        file_path=f"/uploads/sample_resume_{idx+1}.pdf",
                        file_type="PDF",
                        file_size=512000,
                        raw_text=row.get("resume_text", "")
                    )
                    db.add(resume_record)

                    prof_record = CandidateProfile(
                        id=f"prof_{res_id}",
                        resume_id=res_id,
                        name=name,
                        email=email,
                        phone=row.get("phone", "+1 (555) 019-2831"),
                        education=[{
                            "degree": row.get("degree", "Bachelor of Science"),
                            "institution": row.get("college", "State University"),
                            "details": row.get("education", "")
                        }],
                        experience=[{
                            "company": "Tech Solutions",
                            "role": row.get("job_role", "Software Engineer"),
                            "duration": "2021 - Present",
                            "description": row.get("experience", "")
                        }],
                        skills=skills_list if skills_list else ["Python", "SQL", "Git"],
                        projects=[{
                            "name": "E-Commerce System",
                            "description": row.get("projects", "Built scalable web application"),
                            "technologies": "Python, React, SQL"
                        }],
                        certifications=[{
                            "name": row.get("certifications", "Certified Developer"),
                            "issuer": "Tech Certification Body"
                        }]
                    )
                    db.add(prof_record)
                    count += 1
            db.commit()
            print(f"Seeded {count} sample candidate profiles.")

    # 7. Skill Relationships — from skill_relationships.csv
    rel_csv = os.path.join(dataset_dir, "skill_relationships.csv")
    if os.path.exists(rel_csv):
        with open(rel_csv, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                src_id = row.get("source_skill_id", "").strip()
                src = row.get("source_skill", "").strip()
                rel_type = row.get("relationship_type", "related").strip()
                tgt_id = row.get("target_skill_id", "").strip()
                tgt = row.get("target_skill", "").strip()
                if not src or not tgt:
                    continue
                exists = db.query(SkillRelationship).filter(
                    SkillRelationship.source_skill == src,
                    SkillRelationship.target_skill == tgt,
                    SkillRelationship.relationship_type == rel_type
                ).first()
                if not exists:
                    db.add(SkillRelationship(
                        source_skill_id=src_id,
                        source_skill=src,
                        relationship_type=rel_type,
                        target_skill_id=tgt_id,
                        target_skill=tgt
                    ))
                    count += 1
            db.commit()
            print(f"Imported {count} skill relationships from CSV.")

    # 8. Skill Relationships — derived from taxonomy columns
    skills_csv2 = os.path.join(dataset_dir, "skills_taxonomy_dataset.csv")
    if os.path.exists(skills_csv2):
        with open(skills_csv2, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                skill_id = row.get("skill_id", "").strip()
                skill_name = row.get("skill", "").strip()
                if not skill_name:
                    continue

                def add_rel(src_id, src, rel_type, tgt_id, tgt):
                    nonlocal count
                    if not src or not tgt or src.lower() == tgt.lower():
                        return
                    exists = db.query(SkillRelationship).filter(
                        SkillRelationship.source_skill == src,
                        SkillRelationship.target_skill == tgt,
                        SkillRelationship.relationship_type == rel_type
                    ).first()
                    if not exists:
                        db.add(SkillRelationship(
                            source_skill_id=src_id,
                            source_skill=src,
                            relationship_type=rel_type,
                            target_skill_id=tgt_id,
                            target_skill=tgt
                        ))
                        count += 1

                # related_skills
                related = row.get("related_skills", "")
                for rel in [r.strip() for r in related.split(",") if r.strip()]:
                    add_rel(skill_id, skill_name, "related", "", rel)

                # prerequisite_skills
                prereqs = row.get("prerequisite_skills", "")
                for pre in [p.strip() for p in prereqs.split(",") if p.strip()]:
                    add_rel("", pre, "prerequisite", skill_id, skill_name)

                # parent_skill
                parent = row.get("parent_skill", "").strip()
                if parent:
                    add_rel(skill_id, skill_name, "child", "", parent)
                    add_rel("", parent, "parent", skill_id, skill_name)

            db.commit()
            print(f"Derived {count} skill relationships from taxonomy columns.")

    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    import_datasets()

