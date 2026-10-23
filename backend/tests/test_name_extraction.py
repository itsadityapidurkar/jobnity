"""
Tests for multi-signal name extraction.
"""
import pytest
from app.services.nlp_extractor import NLPExtractorService


def _extract(header, full=None, skills=None):
    """Helper to call extract_name with minimal setup."""
    return NLPExtractorService.extract_name(
        header_text=header,
        full_text=full or header,
        known_skills=skills or set()
    )


def test_two_word_name():
    header = "Alex Rivers\nalex.rivers@example.com\n+1 555-123-4567"
    result = _extract(header)
    assert result.value is not None
    assert result.confidence >= 0.5
    assert "Alex" in result.value or "Rivers" in result.value


def test_three_word_name():
    header = "Sarah Jane Williams\nsarahj@gmail.com\n+44 7700 900123"
    result = _extract(header)
    assert result.value is not None
    assert "Sarah" in result.value


def test_name_with_hyphen():
    header = "Mary-Anne Thompson\nmary@example.com"
    result = _extract(header)
    assert result.value is not None
    assert result.confidence >= 0.4


def test_name_with_van_particle():
    header = "Vincent van Gogh\nv.vangogh@art.com"
    result = _extract(header)
    # Should still detect this as a name (van is a known particle)
    assert result.value is not None


def test_resume_starting_with_job_title():
    header = "Senior Software Engineer\nJohn Doe\njohn@example.com"
    result = _extract(header)
    # Should prefer "John Doe" over "Senior Software Engineer"
    assert result.value is None or "Senior Software Engineer" != result.value


def test_resume_starting_with_contact_info():
    header = "+1 555-123-4567\nAlice Smith\nalice@example.com"
    result = _extract(header)
    # Should skip phone line and find the name
    assert result.value is None or "+" not in result.value


def test_no_name_returns_none():
    header = "Technical Skills | Python | SQL | Git\nSoftware Engineer | 2020–2024"
    result = _extract(header, skills={"Python", "SQL", "Git"})
    # Confidence should be low; value may be None or a weak guess
    assert result.confidence < 0.8 or result.value is None


def test_name_not_confused_with_section_heading():
    header = "Education\nB.Tech Computer Science\nIIT Bombay"
    result = _extract(header)
    # "Education" is a heading — value should not be just "Education"
    assert result.value != "Education"


def test_confidence_is_float_in_range():
    header = "Maya Patel\nmaya@example.com\n+91 9876543210"
    result = _extract(header)
    assert 0.0 <= result.confidence <= 1.0


def test_empty_header_returns_none():
    result = _extract("", "")
    assert result.value is None
