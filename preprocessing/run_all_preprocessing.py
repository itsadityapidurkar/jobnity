"""
Jobnity Master Data Preprocessing Pipeline Runner
Executes all ETL preprocessing scripts in sequence and prepares CSV files for database ingestion.
"""

import os
import sys

from build_job_roles import build_job_roles
from build_skills_taxonomy import build_skills_taxonomy
from build_role_skills import build_role_skills
from build_learning_resources import build_learning_resources

def main():
    print("=========================================================================")
    print("           JOBNITY DATA PREPROCESSING & DATASET ETL PIPELINE             ")
    print("=========================================================================\n")

    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/jobnitydatasets"))
    os.makedirs(out_dir, exist_ok=True)

    # Step 1: Job Roles
    job_roles_df = build_job_roles()
    job_roles_df.to_csv(os.path.join(out_dir, "job_roles.csv"), index=False)

    # Step 2: Taxonomy & Aliases
    skills_df, aliases_df = build_skills_taxonomy()
    skills_df.to_csv(os.path.join(out_dir, "skills.csv"), index=False)
    aliases_df.to_csv(os.path.join(out_dir, "skill_aliases.csv"), index=False)

    # Step 3: Role Skills Matrix
    role_skills_df = build_role_skills()
    role_skills_df.to_csv(os.path.join(out_dir, "role_skills.csv"), index=False)

    # Step 4: Learning Resources
    resources_df = build_learning_resources()
    resources_df.to_csv(os.path.join(out_dir, "learning_resources.csv"), index=False)

    print("\n=========================================================================")
    print(f"🎉 SUCCESS: All datasets generated in: {out_dir}")
    print("   To import into SQLite database, run:")
    print("   python3 backend/scripts/import_datasets.py")
    print("=========================================================================")

if __name__ == "__main__":
    main()
