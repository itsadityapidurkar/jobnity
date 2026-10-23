"""
LLM Service for Jobnity — Qwen 2.5 Integration
Provides local, memory-efficient LLM capabilities via Ollama / OpenAI-compatible endpoint:
  - Technical & behavioral mock interview question generation
  - Multi-criteria answer evaluation (Relevance, Correctness, Clarity, Feedback)
  - Intelligent JD requirement & skill extraction
  - Seamless fallback mechanisms when LLM server is offline
"""

import os
import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("jobnity.llm")

DEFAULT_TIMEOUT = 30.0  # seconds

class LLMService:
    @classmethod
    def get_base_url(cls) -> str:
        return settings.OLLAMA_BASE_URL.rstrip("/")

    @classmethod
    def get_model(cls) -> str:
        return settings.OLLAMA_MODEL

    @classmethod
    def check_status(cls) -> Dict[str, Any]:
        """
        Checks whether Ollama is running and whether the target Qwen 2.5 model is pulled.
        """
        base_url = cls.get_base_url()
        target_model = cls.get_model()
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    has_model = any(target_model in m for m in models)
                    return {
                        "online": True,
                        "model": target_model,
                        "model_ready": has_model,
                        "available_models": models,
                        "endpoint": base_url,
                        "engine": "ollama"
                    }
        except Exception as e:
            logger.debug(f"Ollama server not reachable: {e}")

        return {
            "online": False,
            "model": target_model,
            "model_ready": False,
            "available_models": [],
            "endpoint": base_url,
            "engine": "ollama"
        }

    @classmethod
    def generate_completion(cls, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> Optional[str]:
        """
        Sends completion request to local Ollama instance running Qwen 2.5.
        """
        base_url = cls.get_base_url()
        model = cls.get_model()

        payload: Dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.4,
                "top_p": 0.9,
                "num_ctx": 4096
            }
        }
        if system_prompt:
            payload["system"] = system_prompt
        if json_mode:
            payload["format"] = "json"

        try:
            with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
                res = client.post(f"{base_url}/api/generate", json=payload)
                if res.status_code == 200:
                    return res.json().get("response", "").strip()
                else:
                    logger.warning(f"Ollama responded with HTTP {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Failed to query local LLM (Qwen 2.5): {e}")

        return None

    @classmethod
    def generate_interview_question(
        cls,
        role: str,
        candidate_profile: Dict[str, Any],
        skill: Optional[str] = None,
        difficulty: str = "medium",
        previous_questions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generates a targeted interview question strictly based on the candidate's uploaded resume.
        Rejects generation if no resume profile is provided.
        """
        if not candidate_profile:
            raise ValueError("Candidate resume profile is required. Interviews must be generated strictly from an uploaded resume.")

        # Extract verified candidate resume items
        name = candidate_profile.get("name") or "Candidate"
        skills = candidate_profile.get("skills") or []
        projects = candidate_profile.get("projects") or []
        experience = candidate_profile.get("experience") or []

        if not skills and not projects and not experience:
            raise ValueError("Candidate resume profile contains no extractable skills, projects, or experience.")

        # Format resume context for the LLM prompt
        projects_summary = "\n".join([
            f"  - Project: {p.get('name', 'Key Project')} | Tech: {p.get('technologies', '')} | Details: {p.get('description', '')}"
            for p in projects[:3]
        ]) or "  - None listed"

        experience_summary = "\n".join([
            f"  - Role: {e.get('role', 'Engineer')} at {e.get('company', 'Organization')} ({e.get('duration', '')}) | Details: {e.get('description', '')}"
            for e in experience[:3]
        ]) or "  - None listed"

        skills_summary = ", ".join(skills[:15]) if skills else "General Software Engineering"

        system_prompt = (
            f"You are a technical interviewer interviewing {name} for the role of '{role}'. "
            "You MUST formulate your question based SOLELY on the candidate's actual projects, work experience, "
            "or technologies listed on their resume. DO NOT ask generic or textbook questions. "
            "Output your response strictly as valid JSON with keys: 'text', 'category', 'difficulty', 'referenced_resume_item', 'expected_topics'."
        )

        prev_context = f"\nPrevious questions asked:\n- " + "\n- ".join(previous_questions) if previous_questions else ""
        prompt = (
            f"Candidate Verified Resume Data:\n"
            f"- Confirmed Skills: {skills_summary}\n"
            f"- Projects:\n{projects_summary}\n"
            f"- Work Experience:\n{experience_summary}\n"
            f"{prev_context}\n\n"
            f"Generate a {difficulty} technical interview question for '{role}' directly inquiring about a specific "
            f"project, technical decision, or responsibility explicitly shown in their resume above.\n"
            f"Return JSON only."
        )

        raw = cls.generate_completion(prompt, system_prompt=system_prompt, json_mode=True)
        if raw:
            try:
                data = json.loads(raw)
                q_text = data.get("text")
                if q_text and len(q_text) > 15:
                    return {
                        "id": f"q_{os.urandom(4).hex()}",
                        "text": q_text,
                        "category": data.get("category", skill or "Resume Technical Deep Dive"),
                        "difficulty": str(data.get("difficulty", difficulty)).lower(),
                        "referenced_resume_item": data.get("referenced_resume_item", "Resume Experience"),
                        "expected_topics": data.get("expected_topics", [skill] if skill else []),
                        "generator": "qwen2.5_resume_grounded"
                    }
            except Exception as e:
                logger.error(f"Failed to parse Qwen JSON response: {e}")

        # Deterministic resume-grounded fallback (Never uses generic demo questions)
        question_idx = len(previous_questions or [])
        if projects:
            p = projects[question_idx % len(projects)]
            p_name = p.get("name") or "one of your featured projects"
            p_tech = p.get("technologies") or (skills[0] if skills else "your chosen technology stack")
            chosen = (
                f"On your resume, you listed the project '{p_name}' utilizing {p_tech}. "
                f"Can you explain the system architecture, how you handled data consistency and latency, "
                f"and what specific technical trade-offs you evaluated while developing it?"
            )
            ref_item = f"Project: {p_name}"
        elif experience:
            e = experience[question_idx % len(experience)]
            e_comp = e.get("company") or "your previous organization"
            e_role = e.get("role") or role
            chosen = (
                f"During your experience as a {e_role} at {e_comp}, what was the most complex technical "
                f"bottleneck or architectural challenge you encountered, and what specific steps did you take to resolve it?"
            )
            ref_item = f"Experience: {e_comp}"
        else:
            primary_skill = skill or (skills[question_idx % len(skills)] if skills else "Software Engineering")
            chosen = (
                f"Your resume indicates practical experience with {primary_skill}. In the context of your target role '{role}', "
                f"how have you implemented {primary_skill} in production, and what were the most critical performance or security considerations?"
            )
            ref_item = f"Skill: {primary_skill}"

        return {
            "id": f"q_{os.urandom(4).hex()}",
            "text": chosen,
            "category": skill or "Resume Experience",
            "difficulty": difficulty,
            "referenced_resume_item": ref_item,
            "expected_topics": [skill] if skill else ["Architecture", "System Design"],
            "generator": "resume_grounded_fallback"
        }

    @classmethod
    def evaluate_interview_answer(
        cls,
        question: str,
        answer: str,
        target_role: str = "Software Engineer",
        expected_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates a candidate's answer across relevance, correctness, and clarity using Qwen 2.5.
        """
        clean_answer = (answer or "").strip()
        word_count = len(clean_answer.split())

        # If answer is practically empty
        if word_count < 4:
            return {
                "scores": {"relevance": 15, "correctness": 15, "clarity": 20},
                "relevance_score": 15,
                "correctness_score": 15,
                "clarity_score": 20,
                "feedback": "The answer is too brief to evaluate thoroughly. In interviews, aim to provide concrete examples, structure your points, and explain trade-offs.",
                "strengths": [],
                "areas_for_improvement": ["Elaborate on technical details", "Use the STAR method"],
                "evaluator": "heuristic"
            }

        system_prompt = (
            f"You are an expert interviewer evaluating a candidate for '{target_role}'. "
            "Evaluate their response objectively. Score relevance, correctness, and clarity from 0 to 100. "
            "Provide 2-3 sentences of clear, constructive feedback. "
            "Output strictly valid JSON with keys: 'relevance_score', 'correctness_score', 'clarity_score', "
            "'feedback', 'strengths', 'areas_for_improvement'."
        )
        prompt = (
            f"Question:\n{question}\n\n"
            f"Candidate's Answer:\n{clean_answer}\n\n"
            f"Expected Topics: {', '.join(expected_skills or ['technical depth', 'practical experience'])}\n"
            "Return JSON only."
        )

        raw = cls.generate_completion(prompt, system_prompt=system_prompt, json_mode=True)
        if raw:
            try:
                data = json.loads(raw)
                rel = int(min(max(data.get("relevance_score", 70), 0), 100))
                cor = int(min(max(data.get("correctness_score", 70), 0), 100))
                cla = int(min(max(data.get("clarity_score", 70), 0), 100))
                feedback = data.get("feedback", "Good effort demonstrating relevant technical background.")
                return {
                    "scores": {"relevance": rel, "correctness": cor, "clarity": cla},
                    "relevance_score": rel,
                    "correctness_score": cor,
                    "clarity_score": cla,
                    "feedback": feedback,
                    "strengths": data.get("strengths", []),
                    "areas_for_improvement": data.get("areas_for_improvement", []),
                    "evaluator": "qwen2.5"
                }
            except Exception as e:
                logger.error(f"Failed to parse Qwen evaluation JSON: {e}")

        # Deterministic heuristic scoring fallback
        base_score = min(85, 45 + int(word_count * 0.8))
        return {
            "scores": {"relevance": base_score, "correctness": base_score - 5, "clarity": base_score + 5},
            "relevance_score": base_score,
            "correctness_score": base_score - 5,
            "clarity_score": base_score + 5,
            "feedback": f"Your response highlights foundational familiarity with the topic. To score higher, back up your points with specific production metrics and architectural trade-offs.",
            "strengths": ["Clear structure", "Directly addresses the prompt"],
            "areas_for_improvement": ["Include quantifiable results or metrics", "Discuss alternatives considered"],
            "evaluator": "heuristic_fallback"
        }

    @classmethod
    def match_eligible_roles(
        cls,
        candidate_profile: Dict[str, Any],
        available_roles: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Uses local Qwen 2.5 to analyze a candidate's verified resume (skills, experience, projects)
        and recommend the most eligible job roles, fit percentages, and rationales.
        Falls back to deterministic skill-overlap matching if LLM is unreachable.
        """
        skills = candidate_profile.get("skills", [])
        experience = candidate_profile.get("experience", [])
        projects = candidate_profile.get("projects", [])

        # Build concise profile summary for LLM prompt
        exp_summary = []
        for exp in experience[:3]:
            role = exp.get("role") or "Engineer"
            company = exp.get("company") or ""
            exp_summary.append(f"{role} at {company}".strip())

        proj_summary = []
        for proj in projects[:3]:
            name = proj.get("name") or ""
            tech = proj.get("technologies") or ""
            if name:
                proj_summary.append(f"{name} ({tech})" if tech else name)

        skills_str = ", ".join(skills[:25]) if skills else "General technical foundations"
        exp_str = "; ".join(exp_summary) if exp_summary else "Software & Technology Experience"
        proj_str = "; ".join(proj_summary) if proj_summary else "Hands-on projects"

        sample_roles = [r.get("job_role") for r in (available_roles or []) if r.get("job_role")]
        roles_hint = f"\nFocus on standard industry tech roles like: {', '.join(sample_roles[:15])}." if sample_roles else ""

        system_prompt = (
            "You are an expert technical talent assessor and AI career strategist. "
            "Analyze the candidate's verified resume to determine which job roles they are most eligible for based on their real skills and experience. "
            "Recommend 4 to 6 specific, practical tech roles. "
            "For each role, provide: "
            "'job_role' (exact title), 'match_score' (integer 55-98), 'fit_tier' ('High Fit', 'Solid Fit', or 'Stretch Role'), "
            "'rationale' (1-2 sentences explaining why their specific resume skills and experience make them eligible), "
            "'matching_skills' (3-5 skills from their profile that directly qualify them), "
            "'growth_skills' (1-3 complementary skills to learn), "
            "'category' (e.g. 'Security', 'Engineering', 'Cloud', 'Data'). "
            "Output strictly valid JSON with key 'recommended_roles' containing this list."
        )

        prompt = (
            f"Candidate Verified Profile:\n"
            f"- Technical Skills: {skills_str}\n"
            f"- Work Experience: {exp_str}\n"
            f"- Key Projects: {proj_str}\n"
            f"{roles_hint}\n"
            "Identify the roles they are eligible for. Return JSON only."
        )

        raw = cls.generate_completion(prompt, system_prompt=system_prompt, json_mode=True)
        if raw:
            try:
                data = json.loads(raw)
                roles = data.get("recommended_roles", [])
                if isinstance(roles, list) and len(roles) > 0:
                    cleaned_roles = []
                    for r in roles[:6]:
                        score = int(min(max(r.get("match_score", 75), 45), 98))
                        tier = r.get("fit_tier")
                        if not tier:
                            tier = "High Fit" if score >= 82 else "Solid Fit" if score >= 70 else "Stretch Role"
                        cleaned_roles.append({
                            "job_role": r.get("job_role") or "Software Engineer",
                            "match_score": score,
                            "fit_tier": tier,
                            "rationale": r.get("rationale") or f"Strong alignment with your background in {skills_str[:40]}.",
                            "matching_skills": r.get("matching_skills") or skills[:4],
                            "growth_skills": r.get("growth_skills") or ["System Design", "Cloud Architecture"],
                            "category": r.get("category") or "Engineering",
                            "engine": "qwen2.5"
                        })
                    if cleaned_roles:
                        return cleaned_roles
            except Exception as e:
                logger.warning(f"Failed to parse Qwen 2.5 recommended roles JSON: {e}")

        # Deterministic Heuristic Fallback based on skill matching against available roles
        return cls._fallback_role_matching(candidate_profile, available_roles)

    @classmethod
    def _fallback_role_matching(
        cls,
        candidate_profile: Dict[str, Any],
        available_roles: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        candidate_skills = [s.lower() for s in candidate_profile.get("skills", [])]

        standard_benchmarks = [
            {
                "job_role": "Cybersecurity Analyst",
                "category": "Security",
                "keywords": ["security", "siem", "incident response", "active directory", "splunk", "wireshark", "linux", "firewall", "soc", "penetration testing", "vulnerability"],
                "growth": ["Threat Hunting", "Cloud Security (AWS/Azure)"]
            },
            {
                "job_role": "Full Stack Developer",
                "category": "Engineering",
                "keywords": ["python", "javascript", "react", "fastapi", "node", "postgresql", "docker", "rest", "typescript", "html", "css", "sql"],
                "growth": ["GraphQL", "Microservices"]
            },
            {
                "job_role": "DevOps Engineer",
                "category": "Cloud & Infra",
                "keywords": ["docker", "kubernetes", "ci/cd", "linux", "aws", "terraform", "python", "bash", "ansible", "git", "jenkins"],
                "growth": ["Kubernetes Operators", "Observability (Prometheus)"]
            },
            {
                "job_role": "Backend Engineer",
                "category": "Engineering",
                "keywords": ["python", "fastapi", "django", "postgresql", "mysql", "redis", "docker", "api", "rest", "sql", "linux"],
                "growth": ["Distributed Caching", "Event-Driven Architecture (Kafka)"]
            },
            {
                "job_role": "Data Scientist",
                "category": "Data & AI",
                "keywords": ["python", "pandas", "numpy", "machine learning", "scikit-learn", "sql", "data analysis", "tensorflow", "pytorch"],
                "growth": ["MLOps", "Model Quantization"]
            },
            {
                "job_role": "Cloud Security Engineer",
                "category": "Security",
                "keywords": ["aws", "cloud", "security", "iam", "terraform", "compliance", "encryption", "docker", "kubernetes", "linux"],
                "growth": ["Zero Trust Architecture", "CSPM Tools"]
            }
        ]

        scored = []
        raw_skills = candidate_profile.get("skills", [])
        for role in standard_benchmarks:
            matches = []
            for kw in role["keywords"]:
                for s in candidate_skills:
                    if kw in s or s in kw:
                        matches.append(kw.title())
                        break
            match_count = len(matches)
            score = min(96, max(52, 48 + match_count * 12))
            tier = "High Fit" if score >= 82 else "Solid Fit" if score >= 70 else "Stretch Role"

            matched_original = [s for s in raw_skills if any(kw in s.lower() for kw in role["keywords"])]

            scored.append({
                "job_role": role["job_role"],
                "match_score": score,
                "fit_tier": tier,
                "rationale": f"Your verified experience in {', '.join(matched_original[:3]) or 'software foundations'} aligns directly with {role['job_role']} competencies.",
                "matching_skills": matched_original[:4] or matches[:3],
                "growth_skills": role["growth"],
                "category": role["category"],
                "engine": "heuristic_fallback"
            })

        scored.sort(key=lambda x: x["match_score"], reverse=True)
        return scored[:5]

