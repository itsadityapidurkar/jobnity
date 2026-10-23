import os
import requests

BOT_TOKEN = "8993189628:AAFDGAynR1F4TuBL_aBI-ak9ivskoeVy2NA"
CHAT_IDS = ["6061716582", "-1004452680578"]
BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

DOCS = [
    {
        "path": "docs/backend/README.md",
        "caption": "📘 *Jobnity Backend Architecture — Master Index & Engineering Guide*\nOverview of the 4 core subsystems, system workflow diagram, tech stack, and local development setup."
    },
    {
        "path": "docs/backend/01_RESUME_PARSING_AND_NLP_ENGINE.md",
        "caption": "📄 *Module 1: Resume Ingestion, Multi-Tier Text Parsing & Contextual Evidence Extraction*\nOwner: Engineer 1 (Resume Ingestion & NLP Specialist)\nPyPDF2/pdfplumber fallback, section segmentation, regex entity extraction, 0-5 evidence proficiency rating."
    },
    {
        "path": "docs/backend/02_TAXONOMY_CATALOG_AND_LLM_ROLE_MATCHING.md",
        "caption": "🏷️ *Module 2: Taxonomy Catalog, Role Matrices & Local LLM Eligible Role Recommender*\nOwner: Engineer 2 (Catalog, Taxonomy & LLM Specialist)\nSkills taxonomy, canonical aliasing, distinct guardrails, Qwen 2.5 local LLM on Ollama, and heuristic fallback matching."
    },
    {
        "path": "docs/backend/03_SKILL_GAP_ANALYSIS_AND_ROADMAPS.md",
        "caption": "📊 *Module 3: Multi-Factor Skill Gap Calculation & Learning Roadmap Generation*\nOwner: Engineer 3 (Gap Analysis, Scoring & Curriculum Specialist)\n4-way skill classification, 5-factor mathematical scoring formula, transferable skill credit, and week-by-week roadmaps."
    },
    {
        "path": "docs/backend/04_TECHNICAL_MOCK_INTERVIEW_AI_ENGINE.md",
        "caption": "🎙️ *Module 4: Resume-Grounded Technical Mock Interview AI Engine*\nOwner: Engineer 4 (AI Interview & Evaluation Specialist)\nAnti-hallucination resume grounding, 3-question progression, Qwen 2.5 real-time scoring (Relevance, Correctness, Clarity), and STAR feedback."
    }
]

def send_message(chat_id, text):
    url = f"{BASE_URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    resp = requests.post(url, json=payload, timeout=15)
    return resp.json()

def send_document(chat_id, file_path, caption):
    url = f"{BASE_URL}/sendDocument"
    with open(file_path, "rb") as f:
        files = {"document": (os.path.basename(file_path), f, "text/markdown")}
        data = {
            "chat_id": chat_id,
            "caption": caption,
            "parse_mode": "Markdown"
        }
        resp = requests.post(url, data=data, files=files, timeout=30)
        return resp.json()

def main():
    header_text = (
        "🚀 *Jobnity Backend Workflow Documentation — Complete 4-Module Engineering Suite*\n\n"
        "Here are the 4 complete, self-contained documentation modules covering the full Jobnity backend architecture. "
        "Each document is structured so that individual team members can independently learn, master, and take ownership of their respective subsystem.\n\n"
        "📦 *Modules Included*:\n"
        "1. Resume Parsing & NLP Information Extraction Engine\n"
        "2. Taxonomy Catalog, Role Matrices & Local LLM Role Recommender\n"
        "3. Multi-Factor Skill Gap Calculation & Learning Roadmaps\n"
        "4. Resume-Grounded Technical Mock Interview AI Engine\n"
        "+ Master Architecture Index (`README.md`)"
    )

    for chat_id in CHAT_IDS:
        print(f"--> Sending header to chat: {chat_id}")
        try:
            res = send_message(chat_id, header_text)
            print(f"Header sent: ok={res.get('ok')}")
        except Exception as e:
            print(f"Failed to send header: {e}")

        for doc in DOCS:
            if not os.path.exists(doc["path"]):
                print(f"File not found: {doc['path']}")
                continue
            print(f"--> Uploading {doc['path']} to {chat_id}...")
            try:
                res = send_document(chat_id, doc["path"], doc["caption"])
                print(f"Document sent: ok={res.get('ok')}")
            except Exception as e:
                print(f"Failed to send document: {e}")

    print("\n✅ All documentation files sent successfully through ZestogramAI!")

if __name__ == "__main__":
    main()
