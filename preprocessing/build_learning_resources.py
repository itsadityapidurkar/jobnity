"""
Jobnity Data Preprocessing — Step 4: Learning Resources Dataset Aggregator
Maps courses, video tutorials, and official documentation links to technical skills.
"""

import os
import pandas as pd

def build_learning_resources():
    print("Executing Step 4: Aggregating Learning Resources Dataset...")

    resources_data = [
        {"resource_id": "LR0001", "skill": "React", "title": "React Official Documentation & Guides", "provider": "React Core Team", "type": "Documentation", "url": "https://react.dev", "estimated_hours": 15, "cost": "Free"},
        {"resource_id": "LR0002", "skill": "React", "title": "Complete React Developer Course", "provider": "Udemy", "type": "Course", "url": "https://www.udemy.com/course/react-2024", "estimated_hours": 40, "cost": "Paid"},
        {"resource_id": "LR0003", "skill": "Python", "title": "Python for Everybody Specialization", "provider": "Coursera", "type": "Course", "url": "https://www.coursera.org/specializations/python", "estimated_hours": 30, "cost": "Free Audit"},
        {"resource_id": "LR0004", "skill": "FastAPI", "title": "FastAPI Tutorial - User Guide", "provider": "FastAPI Docs", "type": "Documentation", "url": "https://fastapi.tiangolo.com", "estimated_hours": 10, "cost": "Free"},
        {"resource_id": "LR0005", "skill": "Docker", "title": "Docker Curriculum for Beginners", "provider": "Docker Docs", "type": "Tutorial", "url": "https://docker-curriculum.com", "estimated_hours": 8, "cost": "Free"},
        {"resource_id": "LR0006", "skill": "Kubernetes", "title": "Kubernetes Basics & Hands-on Labs", "provider": "Kubernetes.io", "type": "Documentation", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "estimated_hours": 20, "cost": "Free"},
        {"resource_id": "LR0007", "skill": "AWS", "title": "AWS Certified Cloud Practitioner Pathway", "provider": "AWS Skill Builder", "type": "Course", "url": "https://explore.skillbuilder.aws", "estimated_hours": 25, "cost": "Free"},
        {"resource_id": "LR0008", "skill": "Pandas", "title": "Pandas Data Analysis Fundamentals", "provider": "Kaggle Learn", "type": "Interactive Course", "url": "https://www.kaggle.com/learn/pandas", "estimated_hours": 6, "cost": "Free"}
    ]

    df = pd.DataFrame(resources_data)
    print(f"✅ Aggregated {len(df)} learning resources.")
    return df

if __name__ == "__main__":
    df = build_learning_resources()
    out_dir = os.path.join(os.path.dirname(__file__), "../backend/jobnitydatasets")
    os.makedirs(out_dir, exist_ok=True)
    df.to_csv(os.path.join(out_dir, "learning_resources.csv"), index=False)
    print("Saved learning_resources.csv")
