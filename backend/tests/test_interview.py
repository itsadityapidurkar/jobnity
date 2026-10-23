import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.llm_service import LLMService

client = TestClient(app)

def test_llm_status_endpoint():
    response = client.get("/api/interview/status")
    assert response.status_code == 200
    data = response.json()
    assert "online" in data
    assert "model" in data
    assert data["engine"] == "ollama"

def test_start_interview_endpoint():
    payload = {
        "role_id_or_title": "Full Stack Developer",
        "target_skill": "React",
        "difficulty": "medium",
        "candidate_profile": {
            "name": "Jane Developer",
            "skills": ["React", "Node.js", "PostgreSQL"],
            "projects": [
                {
                    "name": "E-Commerce App",
                    "technologies": "React, TypeScript, Redux",
                    "description": "High performance storefront"
                }
            ],
            "experience": [
                {
                    "role": "Frontend Engineer",
                    "company": "Tech Corp",
                    "duration": "2 years",
                    "description": "Built React components"
                }
            ]
        }
    }
    response = client.post("/api/interview/start", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "interview_id" in data
    assert "question" in data
    assert "text" in data["question"]
    assert len(data["question"]["text"]) > 10
    assert "E-Commerce App" in data["question"]["text"] or "React" in data["question"]["text"]

def test_start_interview_without_resume_fails():
    payload = {
        "role_id_or_title": "Full Stack Developer",
        "target_skill": "React",
        "difficulty": "medium"
    }
    response = client.post("/api/interview/start", json=payload)
    assert response.status_code == 400
    assert "No candidate resume found" in response.json()["detail"]

def test_evaluate_interview_answer_endpoint():
    payload = {
        "question_id": "q_12345",
        "question": "How do you optimize React component re-renders?",
        "answer": "I use React.memo to prevent unnecessary child re-renders, useMemo for expensive calculations, and useCallback to preserve function references across render cycles.",
        "target_role": "Frontend Developer",
        "candidate_profile": {
            "name": "Jane Developer",
            "skills": ["React", "Node.js"]
        }
    }
    response = client.post("/api/interview/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "scores" in data
    assert "relevance" in data["scores"]
    assert "correctness" in data["scores"]
    assert "clarity" in data["scores"]
    assert data["scores"]["relevance"] >= 0
    assert "feedback" in data

def test_evaluate_empty_answer():
    payload = {
        "question_id": "q_9999",
        "question": "What is Docker?",
        "answer": "idk",
        "target_role": "DevOps Engineer"
    }
    response = client.post("/api/interview/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scores"]["relevance"] < 30
    assert "too brief" in data["feedback"].lower()

def test_llm_service_unit():
    # Test service generation fallback & resilience strictly grounded in candidate profile
    profile = {
        "name": "Alex",
        "skills": ["Python", "PyTorch", "FastAPI"],
        "projects": [
            {
                "name": "Neural Style Transfer",
                "technologies": "PyTorch, CUDA",
                "description": "Deep learning image stylization"
            }
        ]
    }
    q = LLMService.generate_interview_question(
        role="Machine Learning Engineer",
        candidate_profile=profile,
        skill="PyTorch"
    )
    assert "text" in q
    assert q["difficulty"] == "medium"
    assert "Neural Style Transfer" in q["text"] or "PyTorch" in q["text"]

    eval_res = LLMService.evaluate_interview_answer(
        question="Explain gradient descent.",
        answer="Gradient descent is an optimization algorithm that iteratively moves towards the minimum of a loss function.",
        target_role="Machine Learning Engineer"
    )
    assert "scores" in eval_res
    assert "feedback" in eval_res
