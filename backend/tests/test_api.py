import os
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.services.skill_normalizer import SkillNormalizerService
from app.utils.text_processing import extract_email, extract_phone

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_roles():
    response = client.get("/api/roles?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "roles" in data
    assert data["total"] > 0
    assert len(data["roles"]) > 0

def test_get_role_detail():
    roles_res = client.get("/api/roles?limit=1")
    role_id = roles_res.json()["roles"][0]["role_id"]
    
    response = client.get(f"/api/roles/{role_id}")
    assert response.status_code == 200
    assert response.json()["role_id"] == role_id

def test_get_role_skills():
    roles_res = client.get("/api/roles?limit=1")
    role_id = roles_res.json()["roles"][0]["role_id"]

    response = client.get(f"/api/roles/{role_id}/skills")
    assert response.status_code == 200
    data = response.json()
    assert "skills" in data

def test_get_skills_taxonomy():
    response = client.get("/api/skills?search=python")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_extract_email_and_phone():
    sample_text = "John Doe, Email: john.doe@example.com, Phone: +1 555-019-2831"
    assert extract_email(sample_text) == "john.doe@example.com"
    assert extract_phone(sample_text) is not None

def test_skill_normalization():
    db = SessionLocal()
    normalizer = SkillNormalizerService(db)
    assert normalizer.normalize("ml").lower() == "machine learning"
    assert normalizer.normalize("js").lower() == "javascript"
    assert normalizer.normalize("sklearn").lower() == "scikit-learn"
    db.close()

def test_invalid_file_upload():
    # Unsupported extension (.txt)
    response = client.post(
        "/api/resumes/upload",
        files={"file": ("test.txt", b"Hello world text file", "text/plain")}
    )
    assert response.status_code == 415

def test_image_file_upload_rejection():
    # Direct image upload (.png)
    response = client.post(
        "/api/resumes/upload",
        files={"file": ("scanned_resume.png", b"\x89PNG\r\n\x1a\nfakeimagecontent", "image/png")}
    )
    assert response.status_code == 415
    assert "image" in response.json()["detail"].lower()

def test_scanned_pdf_upload_rejection():
    # PDF with no extractable text stream (simulating scanned/image-only PDF)
    empty_pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n"
        b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n"
        b"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF"
    )
    response = client.post(
        "/api/resumes/upload",
        files={"file": ("scanned_copy.pdf", empty_pdf, "application/pdf")}
    )
    assert response.status_code == 422
    assert "scanned" in response.json()["detail"].lower() or "image-only" in response.json()["detail"].lower()

def test_pdf_resume_upload_and_flow():
    # Create sample dummy PDF stream for test
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length 56 >>\nstream\nBT /F1 12 Tf 72 712 Td (Alex Rivers - Python SQL Git) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n373\n%%EOF"

    response = client.post(
        "/api/resumes/upload",
        files={"file": ("alex_resume.pdf", pdf_bytes, "application/pdf")}
    )
    assert response.status_code == 200
    res_data = response.json()
    assert "resume_id" in res_data
    resume_id = res_data["resume_id"]

    # Retrieve Profile
    prof_res = client.get(f"/api/resumes/{resume_id}/profile")
    assert prof_res.status_code == 200
    profile = prof_res.json()
    assert profile["resume_id"] == resume_id

    # Update Profile (Candidate adds Docker & removes Git)
    updated_skills = ["Python", "SQL", "Docker"]
    update_res = client.put(
        f"/api/resumes/{resume_id}/profile",
        json={"skills": updated_skills}
    )
    assert update_res.status_code == 200
    assert update_res.json()["skills"] == updated_skills

    # Skill Gap Analysis using updated skills
    roles_res = client.get("/api/roles?limit=1")
    role_id = roles_res.json()["roles"][0]["role_id"]

    gap_res = client.post(
        "/api/analysis/skill-gap",
        json={"resume_id": resume_id, "role_id": role_id}
    )
    assert gap_res.status_code == 200
    gap_data = gap_res.json()
    assert "skill_gap_score" in gap_data
    assert "matched_skills" in gap_data
    assert "missing_skills" in gap_data
    analysis_id = gap_data["analysis_id"]

    # Retrieve Recommendations
    rec_res = client.get(f"/api/analysis/{analysis_id}/recommendations")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert "recommendations" in rec_data

def test_roadmaps_api():
    res1 = client.get("/api/roadmaps/skills")
    assert res1.status_code == 200

    roles_res = client.get("/api/roles?limit=1")
    role_id = roles_res.json()["roles"][0]["role_id"]
    res2 = client.get(f"/api/roadmaps/roles/{role_id}")
    assert res2.status_code == 200
    assert "skills" in res2.json()

def test_resource_retrieval():
    res = client.get("/api/skills/Python/resources")
    assert res.status_code == 200
    data = res.json()
    assert "resources" in data
    assert "youtube" in data["resources"]

def test_recommend_eligible_roles():
    response = client.post("/api/roles/recommend", json={
        "skills": ["python", "react", "fastapi", "docker", "postgresql"],
        "limit": 4
    })
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    top_role = data["recommendations"][0]
    assert "job_role" in top_role
    assert "match_score" in top_role
    assert "fit_tier" in top_role
    assert "rationale" in top_role
    assert isinstance(top_role["matching_skills"], list)
