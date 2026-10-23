"""
Tests for proficiency estimation and evidence-based scoring.
"""
import pytest
from app.services.evidence_extractor import estimate_proficiency, PROFICIENCY_LEVELS


def test_skills_section_only_gives_mentioned():
    level, label = estimate_proficiency("Python", "skills_section", "weak", 0)
    assert level == 0 or level == 1
    assert label in PROFICIENCY_LEVELS.values()


def test_work_experience_3_years_gives_advanced():
    level, label = estimate_proficiency("Python", "work_experience", "strong", 40)
    assert level >= 4  # Proficient or Advanced


def test_work_experience_1_year_gives_proficient():
    level, label = estimate_proficiency("SQL", "work_experience", "moderate", 12)
    assert level >= 3  # Working or Proficient


def test_work_experience_short_gives_basic():
    level, label = estimate_proficiency("React", "work_experience", "weak", 1)
    assert level <= 3  # Basic or Working


def test_certification_gives_working_plus():
    level, label = estimate_proficiency("AWS", "certification", "strong", 0)
    assert level >= 3  # Working or above


def test_project_gives_basic():
    level, label = estimate_proficiency("FastAPI", "project", "moderate", 0)
    assert level >= 2  # Basic or above


def test_proficiency_level_is_in_range():
    for ev_type in ["skills_section", "work_experience", "project", "education", "certification"]:
        for strength in ["weak", "moderate", "strong"]:
            level, label = estimate_proficiency("Skill", ev_type, strength, 12)
            assert 0 <= level <= 5, f"Out of range: {level} for {ev_type}/{strength}"
            assert label in PROFICIENCY_LEVELS.values()


def test_strong_evidence_boosts_level():
    level_weak, _ = estimate_proficiency("Docker", "work_experience", "weak", 12)
    level_strong, _ = estimate_proficiency("Docker", "work_experience", "strong", 12)
    assert level_strong >= level_weak
