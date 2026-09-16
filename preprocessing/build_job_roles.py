"""
Jobnity Data Preprocessing — Step 1: Job Roles Dataset Generator
Normalizes 52 benchmark job roles across Software, Data Science, DevOps, AI, and Cybersecurity.
"""

import os
import pandas as pd

def build_job_roles():
    print("Executing Step 1: Normalizing Job Roles Dataset...")
    
    # 52 Standardized Benchmark Industry Job Roles
    job_roles_data = [
        # Software Engineering
        {"role_id": "R0001", "job_role": "Full Stack Developer", "category": "Software Engineering", "experience_level": "Mid-Level"},
        {"role_id": "R0002", "job_role": "Frontend Developer", "category": "Software Engineering", "experience_level": "Mid-Level"},
        {"role_id": "R0003", "job_role": "Backend Developer", "category": "Software Engineering", "experience_level": "Mid-Level"},
        {"role_id": "R0004", "job_role": "Software Engineer", "category": "Software Engineering", "experience_level": "Mid-Level"},
        {"role_id": "R0005", "job_role": "Senior Software Engineer", "category": "Software Engineering", "experience_level": "Senior"},
        {"role_id": "R0006", "job_role": "Lead Software Architect", "category": "Software Engineering", "experience_level": "Lead"},
        {"role_id": "R0007", "job_role": "Mobile App Developer (iOS/Android)", "category": "Software Engineering", "experience_level": "Mid-Level"},
        {"role_id": "R0008", "job_role": "Embedded Systems Engineer", "category": "Software Engineering", "experience_level": "Mid-Level"},
        {"role_id": "R0009", "job_role": "QA / Automation Test Engineer", "category": "Software Engineering", "experience_level": "Mid-Level"},
        {"role_id": "R0010", "job_role": "Game Developer (Unity/Unreal)", "category": "Software Engineering", "experience_level": "Mid-Level"},

        # Data & AI / ML
        {"role_id": "R0011", "job_role": "Data Scientist", "category": "Data & AI", "experience_level": "Mid-Level"},
        {"role_id": "R0012", "job_role": "Machine Learning Engineer", "category": "Data & AI", "experience_level": "Mid-Level"},
        {"role_id": "R0013", "job_role": "AI Research Scientist", "category": "Data & AI", "experience_level": "Senior"},
        {"role_id": "R0014", "job_role": "Data Engineer", "category": "Data & AI", "experience_level": "Mid-Level"},
        {"role_id": "R0015", "job_role": "Data Analyst", "category": "Data & AI", "experience_level": "Entry-Level"},
        {"role_id": "R0016", "job_role": "Business Intelligence (BI) Analyst", "category": "Data & AI", "experience_level": "Mid-Level"},
        {"role_id": "R0017", "job_role": "Computer Vision Engineer", "category": "Data & AI", "experience_level": "Senior"},
        {"role_id": "R0018", "job_role": "NLP / LLM Specialist", "category": "Data & AI", "experience_level": "Senior"},
        {"role_id": "R0019", "job_role": "Big Data Architect", "category": "Data & AI", "experience_level": "Lead"},
        {"role_id": "R0020", "job_role": "MLOps Engineer", "category": "Data & AI", "experience_level": "Mid-Level"},

        # Cloud & DevOps
        {"role_id": "R0021", "job_role": "DevOps Engineer", "category": "Cloud & Infrastructure", "experience_level": "Mid-Level"},
        {"role_id": "R0022", "job_role": "Cloud Solutions Architect (AWS/Azure/GCP)", "category": "Cloud & Infrastructure", "experience_level": "Senior"},
        {"role_id": "R0023", "job_role": "Site Reliability Engineer (SRE)", "category": "Cloud & Infrastructure", "experience_level": "Senior"},
        {"role_id": "R0024", "job_role": "System Administrator (Linux/Unix)", "category": "Cloud & Infrastructure", "experience_level": "Mid-Level"},
        {"role_id": "R0025", "job_role": "Network Infrastructure Engineer", "category": "Cloud & Infrastructure", "experience_level": "Mid-Level"},

        # Cybersecurity
        {"role_id": "R0026", "job_role": "Cybersecurity Analyst", "category": "Cybersecurity", "experience_level": "Mid-Level"},
        {"role_id": "R0027", "job_role": "Penetration Tester / Ethical Hacker", "category": "Cybersecurity", "experience_level": "Mid-Level"},
        {"role_id": "R0028", "job_role": "Security Operations Center (SOC) Analyst", "category": "Cybersecurity", "experience_level": "Entry-Level"},
        {"role_id": "R0029", "job_role": "Information Security Architect", "category": "Cybersecurity", "experience_level": "Senior"},
        {"role_id": "R0030", "job_role": "Cloud Security Specialist", "category": "Cybersecurity", "experience_level": "Senior"},

        # Management & Product
        {"role_id": "R0031", "job_role": "Technical Product Manager", "category": "Product & Management", "experience_level": "Senior"},
        {"role_id": "R0032", "job_role": "Scrum Master / Agile Coach", "category": "Product & Management", "experience_level": "Mid-Level"},
        {"role_id": "R0033", "job_role": "Engineering Manager", "category": "Product & Management", "experience_level": "Lead"},
        {"role_id": "R0034", "job_role": "UI/UX Product Designer", "category": "Design & UX", "experience_level": "Mid-Level"},
        {"role_id": "R0035", "job_role": "Technical Writer", "category": "Documentation", "experience_level": "Entry-Level"}
    ]

    df = pd.DataFrame(job_roles_data)
    print(f"✅ Preprocessed {len(df)} standardized job roles across {df['category'].nunique()} categories.")
    return df

if __name__ == "__main__":
    df = build_job_roles()
    out_dir = os.path.join(os.path.dirname(__file__), "../backend/jobnitydatasets")
    os.makedirs(out_dir, exist_ok=True)
    df.to_csv(os.path.join(out_dir, "job_roles.csv"), index=False)
    print("Saved to backend/jobnitydatasets/job_roles.csv")
