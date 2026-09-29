import re
from typing import List, Dict, Any, Tuple, Optional
from app.parsers.base import ParsedDocument, DocumentPage
from app.schemas.all_schemas import (
    AIAnalysisResult,
    CandidateInfoExtract,
    RequirementEvidence,
    AIScoringBreakdown,
)

# Common regex patterns
EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(?:\+?\d{1,3}[-.\s]*)?(?:\(?\d{2,4}\)?[-.\s]*)?\d{3,4}[-.\s]*\d{3,4}'
YEARS_EXP_PATTERNS = [
    r'(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?',
    r'(?:experience|exp):\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)',
    r'(\d{4})\s*[-–—to]+\s*(?:present|current|\d{4})',
]

def extract_candidate_basics(text: str) -> Dict[str, Any]:
    """
    Extracts name, email, phone, location from resume text.
    """
    email_match = re.search(EMAIL_REGEX, text)
    email = email_match.group(0) if email_match else None
    
    phone_match = re.search(PHONE_REGEX, text)
    phone = phone_match.group(0) if phone_match else None
    
    # Try to extract candidate name from top lines (ignoring header words)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    name = "Unknown Candidate"
    
    ignore_keywords = {"resume", "curriculum", "vitae", "cv", "page", "contact", "profile", "summary"}
    for line in lines[:6]:
        # Filter out lines with emails, phones, or URLs
        if '@' in line or any(char.isdigit() for char in line) or 'http' in line.lower():
            continue
        cleaned_line = re.sub(r'[^a-zA-Z\s]', '', line).strip()
        words = cleaned_line.split()
        if 2 <= len(words) <= 4 and not any(w.lower() in ignore_keywords for w in words):
            name = cleaned_line.title()
            break
            
    # Extract years of experience
    exp_years = 0.0
    for pattern in YEARS_EXP_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            for m in matches:
                try:
                    val = float(m)
                    if 0 < val <= 40 and val > exp_years:
                        exp_years = val
                except ValueError:
                    pass
                    
    # Education summary detection
    education_keywords = ["bachelor", "master", "b.tech", "m.tech", "b.s.", "m.s.", "ph.d", "degree", "university", "college", "diploma"]
    education_lines = []
    for line in lines:
        if any(edu in line.lower() for edu in education_keywords):
            education_lines.append(line)
    edu_summary = " | ".join(education_lines[:3]) if education_lines else "Degree details mentioned in resume"
    
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "location": None,
        "experience_years": exp_years if exp_years > 0 else 2.0, # Default estimated minimum if not explicitly written
        "education_summary": edu_summary
    }

def find_evidence_for_requirement(req_name: str, parsed_doc: ParsedDocument) -> Tuple[str, Optional[str], Optional[int], Optional[str]]:
    """
    Searches across parsed document pages for exact mentions or contextual evidence.
    Returns (status, evidence_snippet, page_number, section_name).
    """
    req_clean = req_name.strip()
    if not req_clean:
        return ("NOT_FOUND", None, None, None)
        
    # Escape special regex chars like C++, .NET
    escaped_req = re.escape(req_clean)
    pattern = re.compile(rf'\b{escaped_req}\b', re.IGNORECASE)
    
    # Check each page
    for page in parsed_doc.pages:
        lines = page.text.split('\n')
        for i, line in enumerate(lines):
            if pattern.search(line):
                # Grab a clean 1-2 line evidence context
                start = max(0, i - 1)
                end = min(len(lines), i + 2)
                snippet = " ".join([l.strip() for l in lines[start:end] if l.strip()])
                
                # Determine approximate section
                section = "Experience / Skills"
                lower_text_before = "\n".join(lines[:i]).lower()
                if "project" in lower_text_before[-300:]:
                    section = "Projects"
                elif "education" in lower_text_before[-300:]:
                    section = "Education"
                elif "skill" in lower_text_before[-300:]:
                    section = "Skills"
                    
                return ("MATCH", snippet[:250], page.page_number, section)
                
    # Check partial match (e.g. "PostgreSQL" vs "Postgres" or "REST API" vs "RESTful")
    aliases = {
        "postgresql": ["postgres", "psql", "sql"],
        "fastapi": ["fast api", "python api", "starlette"],
        "react": ["react.js", "reactjs", "next.js", "nextjs"],
        "aws": ["amazon web services", "s3", "ec2", "lambda", "cloud"],
        "docker": ["container", "dockerfile", "containerization"],
        "kubernetes": ["k8s", "k8"],
        "rest api": ["restful", "rest apis", "api development"],
        "ci/cd": ["github actions", "gitlab ci", "jenkins"],
        "git": ["github", "gitlab", "version control"]
    }
    
    lower_req = req_clean.lower()
    for alias_key, alias_list in aliases.items():
        if lower_req == alias_key or lower_req in alias_list:
            for alias in alias_list:
                alias_pattern = re.compile(rf'\b{re.escape(alias)}\b', re.IGNORECASE)
                for page in parsed_doc.pages:
                    lines = page.text.split('\n')
                    for i, line in enumerate(lines):
                        if alias_pattern.search(line):
                            snippet = line.strip()
                            return ("PARTIAL", f"Related experience: '{snippet}'", page.page_number, "Skills")

    return ("NOT_FOUND", None, None, None)

def calculate_transparent_score(
    requirements: List[Dict[str, Any]],
    req_evidence_list: List[RequirementEvidence],
    candidate_exp_years: float,
    job_required_exp_years: float,
    weights: Dict[str, float],
    thresholds: Dict[str, float],
    mandatory_rule: str,
    parsed_doc: ParsedDocument
) -> Tuple[AIScoringBreakdown, str, List[str], List[str], str]:
    """
    Transparent mathematical calculation of resume match score according to configurable weights.
    """
    weight_req = weights.get("weight_required_skills", 40.0)
    weight_exp = weights.get("weight_experience", 25.0)
    weight_proj = weights.get("weight_projects", 15.0)
    weight_edu = weights.get("weight_education", 10.0)
    weight_pref = weights.get("weight_preferred_skills", 10.0)
    
    # 1. Required Skills Score
    required_items = [r for r in req_evidence_list if r.type == "required"]
    missing_mandatory = []
    missing_skills = []
    
    if required_items:
        req_points = 0.0
        for item in required_items:
            # check if mandatory
            matching_job_req = next((jr for jr in requirements if jr.get("name", "").lower() == item.requirement.lower()), None)
            is_mand = matching_job_req.get("is_mandatory", True) if matching_job_req else True
            
            if item.status == "MATCH":
                req_points += 1.0
            elif item.status == "PARTIAL":
                req_points += 0.5
            else:
                missing_skills.append(item.requirement)
                if is_mand:
                    missing_mandatory.append(item.requirement)
                    
        score_required = (req_points / len(required_items)) * weight_req
    else:
        score_required = weight_req
        
    # 2. Preferred Skills Score
    pref_items = [r for r in req_evidence_list if r.type == "preferred"]
    if pref_items:
        pref_points = 0.0
        for item in pref_items:
            if item.status == "MATCH":
                pref_points += 1.0
            elif item.status == "PARTIAL":
                pref_points += 0.5
            else:
                missing_skills.append(item.requirement)
        score_preferred = (pref_points / len(pref_items)) * weight_pref
    else:
        score_preferred = weight_pref * 0.8 # default reasonable baseline if no preferred skills defined
        
    # 3. Experience Score (25%)
    target_exp = max(1.0, job_required_exp_years)
    if candidate_exp_years >= target_exp:
        score_exp = weight_exp
    elif candidate_exp_years > 0:
        ratio = min(1.0, candidate_exp_years / target_exp)
        score_exp = ratio * weight_exp
    else:
        score_exp = weight_exp * 0.5
        
    # 4. Projects Score (15%)
    doc_text_lower = parsed_doc.raw_text.lower()
    has_projects = "project" in doc_text_lower or "developed" in doc_text_lower or "built" in doc_text_lower or "implemented" in doc_text_lower
    matched_skills_count = sum(1 for r in req_evidence_list if r.status == "MATCH")
    if has_projects and matched_skills_count > 0:
        score_proj = min(weight_proj, (matched_skills_count / max(1, len(req_evidence_list))) * weight_proj + 3.0)
    else:
        score_proj = weight_proj * 0.5
        
    # 5. Education Score (10%)
    has_degree = any(term in doc_text_lower for term in ["bachelor", "master", "degree", "university", "b.tech", "b.s.", "m.s.", "college"])
    score_edu = weight_edu if has_degree else weight_edu * 0.7
    
    # Calculate Total Score
    total = round(score_required + score_exp + score_proj + score_edu + score_preferred, 1)
    total = min(100.0, max(0.0, total))
    
    score_breakdown = AIScoringBreakdown(
        required_skills=round(score_required, 1),
        experience=round(score_exp, 1),
        projects=round(score_proj, 1),
        education=round(score_edu, 1),
        preferred_skills=round(score_preferred, 1),
        total=total
    )
    
    # Determine Classification
    matched_thresh = thresholds.get("threshold_matched", 75.0)
    partial_thresh = thresholds.get("threshold_partial", 50.0)
    
    classification = "NOT MATCHED"
    if total >= matched_thresh:
        classification = "MATCHED"
    elif total >= partial_thresh:
        classification = "PARTIALLY MATCHED"
    else:
        classification = "NOT MATCHED"
        
    # Apply Mandatory Requirement Rule
    if missing_mandatory:
        if mandatory_rule == "downgrade_to_partial":
            if classification == "MATCHED":
                classification = "PARTIALLY MATCHED"
        elif mandatory_rule == "downgrade_to_not_matched" or mandatory_rule == "strict":
            classification = "NOT MATCHED"
            
    # Generate objective, recruiter-oriented AI summary (STRICTLY EVIDENCE-BASED, NO BIAS)
    matched_req_names = [r.requirement for r in req_evidence_list if r.status == "MATCH"]
    matched_str = ", ".join(matched_req_names[:4]) if matched_req_names else "limited required skills"
    missing_str = ", ".join(missing_mandatory if missing_mandatory else missing_skills[:3])
    
    summary_parts = [
        f"Candidate presents {candidate_exp_years:.1f} years of relevant experience."
    ]
    if matched_req_names:
        summary_parts.append(f"Demonstrated verified evidence for: {matched_str}.")
    if missing_mandatory:
        summary_parts.append(f"Missing mandatory requirements: {missing_str}.")
    elif missing_skills:
        summary_parts.append(f"Not found in resume: {missing_str}.")
        
    ai_summary = " ".join(summary_parts)
    
    return score_breakdown, classification, missing_mandatory, missing_skills, ai_summary
