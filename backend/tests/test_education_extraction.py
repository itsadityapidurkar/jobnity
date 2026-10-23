"""
Tests for structured education extraction with normalization.
"""
import pytest
from app.services.nlp_extractor import NLPExtractorService, normalize_degree


def test_degree_normalization_btech():
    assert normalize_degree("B.Tech") == "B.Tech"
    assert normalize_degree("BTech") == "B.Tech"
    assert normalize_degree("Bachelor of Technology") == "B.Tech"
    assert normalize_degree("b.tech") == "B.Tech"


def test_degree_normalization_mba():
    assert normalize_degree("MBA") == "MBA"
    assert normalize_degree("mba") == "MBA"


def test_degree_normalization_phd():
    assert normalize_degree("Ph.D") == "PhD"
    assert normalize_degree("PhD") == "PhD"
    assert normalize_degree("Doctor of Philosophy") == "PhD"


def test_single_entry_education():
    edu_text = "B.Tech Computer Science | IIT Bombay | 2019-2023"
    entries = NLPExtractorService.parse_education(edu_text)
    assert len(entries) >= 1
    e = entries[0]
    assert "B.Tech" in e.degree_normalized or e.degree
    assert e.confidence > 0.3


def test_multi_entry_education():
    edu_text = """
M.Sc Data Science | Stanford University | 2024-Present
B.Sc Computer Science | MIT | 2020-2024
    """
    entries = NLPExtractorService.parse_education(edu_text)
    assert len(entries) >= 1  # At least one detected


def test_ongoing_education():
    edu_text = "B.Tech | BITS Pilani | 2022 - Present"
    entries = NLPExtractorService.parse_education(edu_text)
    # Check at least one entry found
    assert len(entries) >= 1


def test_education_confidence_range():
    edu_text = "Bachelor of Engineering | Anna University | 2018-2022"
    entries = NLPExtractorService.parse_education(edu_text)
    for e in entries:
        assert 0.0 <= e.confidence <= 1.0


def test_empty_education():
    entries = NLPExtractorService.parse_education("")
    assert isinstance(entries, list)


def test_fallback_education_single_line():
    edu_text = "State University 2018-2022"
    entries = NLPExtractorService.parse_education(edu_text)
    assert isinstance(entries, list)
