"""
Tests for duration-aware experience extraction.
"""
import pytest
from app.services.nlp_extractor import NLPExtractorService, _duration_months


def test_duration_months_calculation():
    months = _duration_months("Jan 2022", "Jan 2024")
    assert months == 24


def test_duration_months_present():
    from datetime import datetime
    months = _duration_months("Jan 2023", "Present")
    now_months = (datetime.now().year - 2023) * 12 + datetime.now().month - 1
    # Allow ±2 months tolerance
    assert abs(months - now_months) <= 2


def test_experience_type_internship():
    exp_text = "Software Engineering Intern at Google | Jun 2023 - Aug 2023"
    entries = NLPExtractorService.parse_experience(exp_text)
    assert len(entries) >= 1
    assert entries[0].experience_type == "internship"


def test_experience_type_full_time():
    exp_text = "Software Engineer at Infosys | Jan 2022 - Present"
    entries = NLPExtractorService.parse_experience(exp_text)
    assert len(entries) >= 1
    assert entries[0].experience_type == "full_time"


def test_experience_current_flag():
    exp_text = "Backend Developer at TechCorp | Mar 2021 - Present"
    entries = NLPExtractorService.parse_experience(exp_text)
    assert len(entries) >= 1
    assert entries[0].current is True


def test_experience_duration_months_populated():
    exp_text = "Data Analyst at Analytics Co | Jan 2020 - Jan 2022"
    entries = NLPExtractorService.parse_experience(exp_text)
    assert len(entries) >= 1
    assert entries[0].duration_months >= 20  # ~24 months


def test_multiple_experience_entries():
    exp_text = """
Software Engineer at Company A | 2022 - Present
Junior Developer at Company B | 2020 - 2022
    """
    entries = NLPExtractorService.parse_experience(exp_text)
    assert len(entries) >= 1


def test_empty_experience():
    entries = NLPExtractorService.parse_experience("")
    assert isinstance(entries, list)


def test_experience_confidence_range():
    exp_text = "Python Developer at Startup X | Aug 2021 - Aug 2023"
    entries = NLPExtractorService.parse_experience(exp_text)
    for e in entries:
        assert 0.0 <= e.confidence <= 1.0
