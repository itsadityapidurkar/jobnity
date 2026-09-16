"""
Jobnity Data Preprocessing — Step 3: Role Skills Requirement Matrix
Maps skills to benchmark job roles with importance categories, priority levels, and minimum skill levels.
"""

import os
import pandas as pd

def build_role_skills():
    print("Executing Step 3: Building Role Skills Weight Matrix...")

    role_skills_data = [
        # Full Stack Developer (R0001)
        {"role_id": "R0001", "job_role": "Full Stack Developer", "skill": "JavaScript", "importance": "Required", "priority": 5, "minimum_level": "Advanced"},
        {"role_id": "R0001", "job_role": "Full Stack Developer", "skill": "React", "importance": "Required", "priority": 5, "minimum_level": "Intermediate"},
        {"role_id": "R0001", "job_role": "Full Stack Developer", "skill": "Node.js", "importance": "Required", "priority": 4, "minimum_level": "Intermediate"},
        {"role_id": "R0001", "job_role": "Full Stack Developer", "skill": "FastAPI", "importance": "Preferred", "priority": 3, "minimum_level": "Intermediate"},
        {"role_id": "R0001", "job_role": "Full Stack Developer", "skill": "PostgreSQL", "importance": "Required", "priority": 4, "minimum_level": "Intermediate"},
        {"role_id": "R0001", "job_role": "Full Stack Developer", "skill": "Docker", "importance": "Preferred", "priority": 3, "minimum_level": "Beginner"},
        {"role_id": "R0001", "job_role": "Full Stack Developer", "skill": "Git", "importance": "Required", "priority": 5, "minimum_level": "Intermediate"},

        # Data Scientist (R0011)
        {"role_id": "R0011", "job_role": "Data Scientist", "skill": "Python", "importance": "Required", "priority": 5, "minimum_level": "Advanced"},
        {"role_id": "R0011", "job_role": "Data Scientist", "skill": "Pandas", "importance": "Required", "priority": 5, "minimum_level": "Advanced"},
        {"role_id": "R0011", "job_role": "Data Scientist", "skill": "NumPy", "importance": "Required", "priority": 4, "minimum_level": "Advanced"},
        {"role_id": "R0011", "job_role": "Data Scientist", "skill": "Scikit-Learn", "importance": "Required", "priority": 5, "minimum_level": "Intermediate"},
        {"role_id": "R0011", "job_role": "Data Scientist", "skill": "SQL", "importance": "Required", "priority": 4, "minimum_level": "Intermediate"},
        {"role_id": "R0011", "job_role": "Data Scientist", "skill": "PyTorch", "importance": "Preferred", "priority": 3, "minimum_level": "Intermediate"},

        # DevOps Engineer (R0021)
        {"role_id": "R0021", "job_role": "DevOps Engineer", "skill": "Docker", "importance": "Required", "priority": 5, "minimum_level": "Advanced"},
        {"role_id": "R0021", "job_role": "DevOps Engineer", "skill": "Kubernetes", "importance": "Required", "priority": 5, "minimum_level": "Intermediate"},
        {"role_id": "R0021", "job_role": "DevOps Engineer", "skill": "AWS", "importance": "Required", "priority": 4, "minimum_level": "Intermediate"},
        {"role_id": "R0021", "job_role": "DevOps Engineer", "skill": "Terraform", "importance": "Preferred", "priority": 4, "minimum_level": "Intermediate"},
        {"role_id": "R0021", "job_role": "DevOps Engineer", "skill": "Linux", "importance": "Required", "priority": 5, "minimum_level": "Advanced"},
        {"role_id": "R0021", "job_role": "DevOps Engineer", "skill": "CI/CD Pipelines", "importance": "Required", "priority": 5, "minimum_level": "Advanced"}
    ]

    df = pd.DataFrame(role_skills_data)
    print(f"✅ Generated {len(df)} role-skill requirement mappings.")
    return df

if __name__ == "__main__":
    df = build_role_skills()
    out_dir = os.path.join(os.path.dirname(__file__), "../backend/jobnitydatasets")
    os.makedirs(out_dir, exist_ok=True)
    df.to_csv(os.path.join(out_dir, "role_skills.csv"), index=False)
    print("Saved role_skills.csv")
