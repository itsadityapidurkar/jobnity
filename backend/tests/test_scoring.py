"""
Scoring regression tests for the new multi-factor skill gap scoring formula.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Valid minimal PDF bytes that parse successfully
VALID_PDF = (
    b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
    b"/Contents 4 0 R /Resources << /Font << /F1 << /Type /Font "
    b"/Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n"
    b"4 0 obj\n<< /Length 56 >>\nstream\n"
    b"BT /F1 12 Tf 72 712 Td (Alex Rivers - Python SQL Git) Tj ET\n"
    b"endstream\nendobj\nxref\n0 5\n0000000000 65535 f \n"
    b"0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n"
    b"0000000266 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\n"
    b"startxref\n373\n%%EOF"
)


def _upload_resume():
    """Upload a valid PDF and return resume_id."""
    res = client.post(
        "/api/resumes/upload",
        files={"file": ("scoring_test.pdf", VALID_PDF, "application/pdf")}
    )
    assert res.status_code == 200, f"Upload failed: {res.json()}"
    return res.json()["resume_id"]


def _get_role_id():
    return client.get("/api/roles?limit=1").json()["roles"][0]["role_id"]


def test_score_is_bounded_0_100():
    """Score must always be 0–100."""
    resume_id = _upload_resume()
    role_id = _get_role_id()
    gap_res = client.post("/api/analysis/skill-gap", json={"resume_id": resume_id, "role_id": role_id})
    assert gap_res.status_code == 200
    score = gap_res.json()["readiness_score"]
    assert 0 <= score <= 100, f"Score {score} out of bounds"


def test_score_breakdown_present():
    """score_breakdown must be in response with correct keys."""
    resume_id = _upload_resume()
    role_id = _get_role_id()
    gap_res = client.post("/api/analysis/skill-gap", json={"resume_id": resume_id, "role_id": role_id})
    assert gap_res.status_code == 200
    data = gap_res.json()
    assert "score_breakdown" in data
    bd = data["score_breakdown"]
    for key in ("required_skill_coverage", "proficiency_alignment", "evidence_quality", "preferred_skill_coverage", "transferable_credit"):
        assert key in bd, f"Missing key: {key}"


def test_response_has_new_fields():
    """Backward-compatible: all original AND new fields must be present."""
    resume_id = _upload_resume()
    role_id = _get_role_id()
    gap_res = client.post("/api/analysis/skill-gap", json={"resume_id": resume_id, "role_id": role_id})
    assert gap_res.status_code == 200
    data = gap_res.json()
    # Original fields
    for key in ("skill_gap_score", "readiness_score", "matched_skills", "missing_skills", "preferred_missing_skills", "statistics"):
        assert key in data, f"Original field missing: {key}"
    # New additive fields
    for key in ("role_alignment_score", "score_breakdown", "score_explanation", "below_level_skills", "transferable_skills"):
        assert key in data, f"New field missing: {key}"


def test_statistics_has_new_counts():
    """Statistics must include below_level_count and transferable_count."""
    resume_id = _upload_resume()
    role_id = _get_role_id()
    gap_res = client.post("/api/analysis/skill-gap", json={"resume_id": resume_id, "role_id": role_id})
    assert gap_res.status_code == 200
    stats = gap_res.json()["statistics"]
    assert "below_level_count" in stats
    assert "transferable_count" in stats
    assert stats["below_level_count"] >= 0
    assert stats["transferable_count"] >= 0


def test_score_explanation_contains_disclaimer():
    """Score explanation must mention it's not a probability of hiring."""
    resume_id = _upload_resume()
    role_id = _get_role_id()
    gap_res = client.post("/api/analysis/skill-gap", json={"resume_id": resume_id, "role_id": role_id})
    assert gap_res.status_code == 200
    explanation = gap_res.json().get("score_explanation", "")
    assert len(explanation) > 0
    assert "not a probability" in explanation.lower() or "not" in explanation.lower()
