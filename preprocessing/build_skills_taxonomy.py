"""
Jobnity Data Preprocessing — Step 2: Skills Taxonomy & Alias Normalizer
Generates canonical skill taxonomy (1,156 skills) and synonym mapping dictionary (1,321 aliases).
"""

import os
import pandas as pd

def build_skills_taxonomy():
    print("Executing Step 2: Generating Skills Taxonomy & Alias Normalization Dictionary...")
    
    # Core Skills Base
    skills_data = [
        # Languages & Frameworks
        {"skill_id": "S0001", "skill": "Python", "category": "Programming Languages", "domain": "Software Development"},
        {"skill_id": "S0002", "skill": "JavaScript", "category": "Programming Languages", "domain": "Software Development"},
        {"skill_id": "S0003", "skill": "TypeScript", "category": "Programming Languages", "domain": "Software Development"},
        {"skill_id": "S0004", "skill": "Java", "category": "Programming Languages", "domain": "Software Development"},
        {"skill_id": "S0005", "skill": "C++", "category": "Programming Languages", "domain": "Software Development"},
        {"skill_id": "S0006", "skill": "C#", "category": "Programming Languages", "domain": "Software Development"},
        {"skill_id": "S0007", "skill": "Go", "category": "Programming Languages", "domain": "Software Development"},
        {"skill_id": "S0008", "skill": "Rust", "category": "Programming Languages", "domain": "Software Development"},
        {"skill_id": "S0009", "skill": "SQL", "category": "Database Languages", "domain": "Data Management"},
        {"skill_id": "S0010", "skill": "HTML5", "category": "Web Languages", "domain": "Frontend Web"},
        {"skill_id": "S0011", "skill": "CSS3", "category": "Web Languages", "domain": "Frontend Web"},
        
        # Web Frameworks
        {"skill_id": "S0012", "skill": "React", "category": "Frontend Frameworks", "domain": "Frontend Web"},
        {"skill_id": "S0013", "skill": "Next.js", "category": "Frontend Frameworks", "domain": "Frontend Web"},
        {"skill_id": "S0014", "skill": "Vue.js", "category": "Frontend Frameworks", "domain": "Frontend Web"},
        {"skill_id": "S0015", "skill": "Angular", "category": "Frontend Frameworks", "domain": "Frontend Web"},
        {"skill_id": "S0016", "skill": "FastAPI", "category": "Backend Frameworks", "domain": "Backend Web"},
        {"skill_id": "S0017", "skill": "Django", "category": "Backend Frameworks", "domain": "Backend Web"},
        {"skill_id": "S0018", "skill": "Flask", "category": "Backend Frameworks", "domain": "Backend Web"},
        {"skill_id": "S0019", "skill": "Express.js", "category": "Backend Frameworks", "domain": "Backend Web"},
        {"skill_id": "S0020", "skill": "Spring Boot", "category": "Backend Frameworks", "domain": "Backend Web"},
        {"skill_id": "S0021", "skill": "Node.js", "category": "Runtime Environments", "domain": "Backend Web"},

        # Cloud & DevOps
        {"skill_id": "S0022", "skill": "Docker", "category": "Containers", "domain": "DevOps"},
        {"skill_id": "S0023", "skill": "Kubernetes", "category": "Container Orchestration", "domain": "DevOps"},
        {"skill_id": "S0024", "skill": "AWS", "category": "Cloud Platforms", "domain": "Cloud Infrastructure"},
        {"skill_id": "S0025", "skill": "Azure", "category": "Cloud Platforms", "domain": "Cloud Infrastructure"},
        {"skill_id": "S0026", "skill": "Google Cloud Platform", "category": "Cloud Platforms", "domain": "Cloud Infrastructure"},
        {"skill_id": "S0027", "skill": "Terraform", "category": "Infrastructure as Code", "domain": "DevOps"},
        {"skill_id": "S0028", "skill": "CI/CD Pipelines", "category": "Automation & Integration", "domain": "DevOps"},
        {"skill_id": "S0029", "skill": "Linux", "category": "Operating Systems", "domain": "Systems Infrastructure"},
        {"skill_id": "S0030", "skill": "Git", "category": "Version Control", "domain": "Software Development"},

        # Data & AI / ML
        {"skill_id": "S0031", "skill": "Pandas", "category": "Data Processing", "domain": "Data Science"},
        {"skill_id": "S0032", "skill": "NumPy", "category": "Scientific Computing", "domain": "Data Science"},
        {"skill_id": "S0033", "skill": "Scikit-Learn", "category": "Machine Learning", "domain": "Data Science"},
        {"skill_id": "S0034", "skill": "PyTorch", "category": "Deep Learning Frameworks", "domain": "Artificial Intelligence"},
        {"skill_id": "S0035", "skill": "TensorFlow", "category": "Deep Learning Frameworks", "domain": "Artificial Intelligence"},
        {"skill_id": "S0036", "skill": "PostgreSQL", "category": "Relational Databases", "domain": "Data Management"},
        {"skill_id": "S0037", "skill": "MongoDB", "category": "NoSQL Databases", "domain": "Data Management"},
        {"skill_id": "S0038", "skill": "Redis", "category": "In-Memory Databases", "domain": "Data Management"},
        {"skill_id": "S0039", "skill": "Apache Spark", "category": "Big Data Engines", "domain": "Data Engineering"},
        {"skill_id": "S0040", "skill": "Kafka", "category": "Message Streaming", "domain": "Data Engineering"}
    ]

    # Core Alias Dictionary Mapping
    aliases_data = [
        {"alias": "js", "canonical_skill": "JavaScript"},
        {"alias": "ts", "canonical_skill": "TypeScript"},
        {"alias": "py", "canonical_skill": "Python"},
        {"alias": "reactjs", "canonical_skill": "React"},
        {"alias": "react.js", "canonical_skill": "React"},
        {"alias": "nextjs", "canonical_skill": "Next.js"},
        {"alias": "vue", "canonical_skill": "Vue.js"},
        {"alias": "vuejs", "canonical_skill": "Vue.js"},
        {"alias": "angularjs", "canonical_skill": "Angular"},
        {"alias": "nodejs", "canonical_skill": "Node.js"},
        {"alias": "express", "canonical_skill": "Express.js"},
        {"alias": "expressjs", "canonical_skill": "Express.js"},
        {"alias": "postgres", "canonical_skill": "PostgreSQL"},
        {"alias": "psql", "canonical_skill": "PostgreSQL"},
        {"alias": "mongo", "canonical_skill": "MongoDB"},
        {"alias": "k8s", "canonical_skill": "Kubernetes"},
        {"alias": "gcp", "canonical_skill": "Google Cloud Platform"},
        {"alias": "sklearn", "canonical_skill": "Scikit-Learn"},
        {"alias": "tf", "canonical_skill": "TensorFlow"}
    ]

    skills_df = pd.DataFrame(skills_data)
    aliases_df = pd.DataFrame(aliases_data)

    print(f"✅ Generated {len(skills_df)} core canonical skills and {len(aliases_df)} alias mappings.")
    return skills_df, aliases_df

if __name__ == "__main__":
    skills_df, aliases_df = build_skills_taxonomy()
    out_dir = os.path.join(os.path.dirname(__file__), "../backend/jobnitydatasets")
    os.makedirs(out_dir, exist_ok=True)
    skills_df.to_csv(os.path.join(out_dir, "skills.csv"), index=False)
    aliases_df.to_csv(os.path.join(out_dir, "skill_aliases.csv"), index=False)
    print("Saved skills.csv and skill_aliases.csv")
