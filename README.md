# Jobnity: AI-Powered Career Guidance & Skill Gap Analyzer with Resume-Based Interview Preparation

## Background and Motivation
The rapid evolution of technology-driven industries has widened the gap between academic curriculum and the practical skills employers demand. Students often struggle to identify precisely which skills they lack relative to their desired job roles. Career counselling remains generic, and the interview process has grown more specialized, requiring candidates to answer questions tailored to the exact technologies, projects, and roles listed on their resumes. Jobnity aims to automate resume understanding, benchmark candidate skills against industry requirements, and generate individualized interview questions in real time.

## Problem Statement
Job seekers and final-year students lack a single platform that connects three critical stages of employability preparation: understanding what skills their resume demonstrates, identifying the precise gap between those skills and the requirements of a target job role, and preparing for interviews specific to that gap and role. Existing tools are fragmented, relying on generic questionnaires and static, role-agnostic question banks.

## Objectives
* To design an NLP-based resume parsing module that accurately extracts skills, education, experience, and projects from resumes in PDF/DOCX formats.
* To build a skill-gap analysis engine that benchmarks the extracted candidate profile against the skill requirements of a chosen target job role.
* To develop a personalized career-guidance module that recommends a prioritized learning roadmap and curated resources to close identified skill gaps.
* To generate resume-aware, role-specific interview questions using AI, covering both technical and behavioral aspects of the target role.
* To implement a mock-interview simulation module with automated performance scoring and feedback.
* To evaluate the system's accuracy and usability through testing on real resumes and target job roles.

## Proposed Methodology / Plan of Work
Jobnity follows a modular pipeline:
1. **Resume Parsing Module:** Accepts PDF/DOCX files and uses NLP techniques (spaCy-based Named Entity Recognition combined with transformer embeddings such as BERT) to extract structured fields.
2. **Skill Gap Analysis Engine:** Maintains a Job-Role Skill Database (built from public role taxonomies like O*NET and job postings). Computes semantic similarity between the candidate's skills and the role's requirements using sentence-transformer embeddings and cosine similarity.
3. **Career Guidance Module:** Converts the missing-skill list into a personalized learning roadmap, recommending courses, certifications, and practice resources ordered by priority.
4. **Interview Question Generator:** Uses the candidate profile and skill-gap output, together with a large language model, to synthesize interview questions specific to the projects, technologies, and gaps found in that resume.
5. **Mock Interview Simulation:** The candidate responds via text or voice and receives automated scoring on relevance, technical correctness, and communication clarity.
6. **Performance Feedback & Analytics Dashboard:** Tracks skill-gap closure over time, interview scores across sessions, and overall readiness for the target role.

## Technology, Tools and Platforms
* **Backend:** Python (Flask/FastAPI)
* **NLP & AI:** spaCy, Hugging Face Transformers (BERT/Sentence-BERT), LLM API
* **Frontend:** React.js
* **Database:** PostgreSQL/MongoDB
* **Version Control:** Git/GitHub
* **Deployment:** Docker, AWS or Render
* **Data Sources:** O*NET and public job-posting datasets

## Team Members
* Nidhi Singh (15)
* Shraddha Agrawal (25)
* Vaishnavi Nandurkar (33)
* Aditya Pidurkar (40)

**Under the Guidance of:** Dr. Uma Yadav
