import pytest
import os
from app.parsers.factory import parse_resume_file
from app.ai.rule_matcher import (
    extract_candidate_basics,
    find_evidence_for_requirement,
    calculate_transparent_score
)
from app.parsers.base import ParsedDocument, DocumentPage
from app.schemas.all_schemas import RequirementEvidence

def test_extract_candidate_basics():
    sample_text = """John Doe
Email: john.doe@techcompany.com | Phone: +1-555-0144 | Seattle, WA
Senior Python Developer with 4.5 years of experience.
Bachelor of Science in Computer Science from Stanford University.
"""
    basics = extract_candidate_basics(sample_text)
    assert basics["email"] == "john.doe@techcompany.com"
    assert "555" in basics["phone"]
    assert basics["experience_years"] == 4.5
    assert "Stanford" in basics["education_summary"]

def test_find_evidence_and_scoring():
    parsed_doc = ParsedDocument(
        raw_text="Built scalable backend services using Python and FastAPI. Used PostgreSQL for storage.",
        pages=[DocumentPage(page_number=1, text="Built scalable backend services using Python and FastAPI. Used PostgreSQL for storage.")],
        page_count=1
    )
    
    status_py, ev_py, page_py, _ = find_evidence_for_requirement("Python", parsed_doc)
    assert status_py == "MATCH"
    assert "FastAPI" in ev_py
    assert page_py == 1
    
    status_aws, ev_aws, _, _ = find_evidence_for_requirement("AWS", parsed_doc)
    assert status_aws == "NOT_FOUND"
    assert ev_aws is None
    
    requirements = [
        {"name": "Python", "type": "required", "is_mandatory": True},
        {"name": "FastAPI", "type": "required", "is_mandatory": True},
        {"name": "PostgreSQL", "type": "required", "is_mandatory": True},
        {"name": "AWS", "type": "preferred", "is_mandatory": False}
    ]
    
    req_evidence_list = [
        RequirementEvidence(requirement="Python", type="required", status="MATCH", evidence="Python experience"),
        RequirementEvidence(requirement="FastAPI", type="required", status="MATCH", evidence="FastAPI experience"),
        RequirementEvidence(requirement="PostgreSQL", type="required", status="MATCH", evidence="PostgreSQL experience"),
        RequirementEvidence(requirement="AWS", type="preferred", status="NOT_FOUND", evidence=None)
    ]
    
    weights = {
        "weight_required_skills": 40.0,
        "weight_experience": 25.0,
        "weight_projects": 15.0,
        "weight_education": 10.0,
        "weight_preferred_skills": 10.0
    }
    
    thresholds = {
        "threshold_matched": 75.0,
        "threshold_partial": 50.0
    }
    
    score, classification, missing_mand, missing_skills, summary = calculate_transparent_score(
        requirements=requirements,
        req_evidence_list=req_evidence_list,
        candidate_exp_years=3.0,
        job_required_exp_years=2.0,
        weights=weights,
        thresholds=thresholds,
        mandatory_rule="downgrade_to_partial",
        parsed_doc=parsed_doc
    )
    
    assert score.required_skills == 40.0
    assert score.experience == 25.0
    assert score.total >= 75.0
    assert classification == "MATCHED"
    assert len(missing_mand) == 0
    assert "AWS" in missing_skills

def test_mandatory_missing_rule():
    # Test that missing mandatory requirement triggers configured rule
    parsed_doc = ParsedDocument(
        raw_text="Experienced in Python and FastAPI only.",
        pages=[DocumentPage(page_number=1, text="Experienced in Python and FastAPI only.")],
        page_count=1
    )
    
    requirements = [
        {"name": "Python", "type": "required", "is_mandatory": True},
        {"name": "FastAPI", "type": "required", "is_mandatory": True},
        {"name": "PostgreSQL", "type": "required", "is_mandatory": True}, # Missing!
    ]
    
    req_evidence_list = [
        RequirementEvidence(requirement="Python", type="required", status="MATCH", evidence="Python"),
        RequirementEvidence(requirement="FastAPI", type="required", status="MATCH", evidence="FastAPI"),
        RequirementEvidence(requirement="PostgreSQL", type="required", status="NOT_FOUND", evidence=None)
    ]
    
    weights = {
        "weight_required_skills": 40.0,
        "weight_experience": 25.0,
        "weight_projects": 15.0,
        "weight_education": 10.0,
        "weight_preferred_skills": 10.0
    }
    
    score, classification, missing_mand, missing_skills, summary = calculate_transparent_score(
        requirements=requirements,
        req_evidence_list=req_evidence_list,
        candidate_exp_years=5.0,
        job_required_exp_years=2.0,
        weights=weights,
        thresholds={"threshold_matched": 70.0, "threshold_partial": 45.0},
        mandatory_rule="downgrade_to_partial",
        parsed_doc=parsed_doc
    )
    
    assert "PostgreSQL" in missing_mand
    # Even if mathematical points were high, mandatory rule downgrades from MATCHED to PARTIALLY MATCHED
    assert classification == "PARTIALLY MATCHED"
    assert "PostgreSQL" in summary
