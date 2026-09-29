import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import engine
from app.db.base import Base

@pytest.fixture(autouse=True)
async def prepare_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

@pytest.mark.asyncio
async def test_api_health_and_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"
        
        root_res = await client.get("/")
        assert root_res.status_code == 200
        assert "AI Resume Analyzer" in root_res.json()["app"]

@pytest.mark.asyncio
async def test_job_crud_and_extract():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test JD extraction
        extract_res = await client.post(
            "/api/v1/jobs/extract-requirements",
            json={
                "job_title": "Senior Python Developer",
                "job_description": "We need 3+ years experience in Python, FastAPI, PostgreSQL, Docker, AWS, and Git."
            }
        )
        assert extract_res.status_code == 200
        extracted = extract_res.json()
        assert "Python" in extracted["required_skills"] or "Python" in extracted["preferred_skills"]
        
        # Test Create Job
        create_res = await client.post(
            "/api/v1/jobs",
            json={
                "title": "FastAPI Backend Specialist",
                "department": "Engineering",
                "experience_required": "3+ years",
                "experience_min_years": 3.0,
                "location": "Remote",
                "employment_type": "Full-time",
                "description": "Looking for FastAPI and PostgreSQL expert.",
                "weight_required_skills": 40.0,
                "weight_experience": 25.0,
                "weight_projects": 15.0,
                "weight_education": 10.0,
                "weight_preferred_skills": 10.0,
                "threshold_matched": 75.0,
                "threshold_partial": 50.0,
                "mandatory_rule": "downgrade_to_partial",
                "requirements": [
                    {"name": "Python", "type": "required", "is_mandatory": True, "weight_multiplier": 1.0},
                    {"name": "FastAPI", "type": "required", "is_mandatory": True, "weight_multiplier": 1.0},
                    {"name": "Docker", "type": "preferred", "is_mandatory": False, "weight_multiplier": 1.0}
                ]
            }
        )
        assert create_res.status_code == 200
        job_data = create_res.json()
        job_id = job_data["id"]
        assert job_data["title"] == "FastAPI Backend Specialist"
        assert len(job_data["requirements"]) == 3
        
        # List jobs
        list_res = await client.get("/api/v1/jobs")
        assert list_res.status_code == 200
        assert any(j["id"] == job_id for j in list_res.json())
        
        # Get single job
        get_res = await client.get(f"/api/v1/jobs/{job_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == job_id

@pytest.mark.asyncio
async def test_dashboard_analytics_and_settings():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Dashboard stats
        dash_res = await client.get("/api/v1/analytics/dashboard")
        assert dash_res.status_code == 200
        stats = dash_res.json()
        assert "active_jobs" in stats
        assert "resumes_analyzed" in stats
        
        # AI settings & health
        ai_res = await client.get("/api/v1/settings/ai-status")
        assert ai_res.status_code == 200
        ai_data = ai_res.json()
        assert ai_data["provider"] == "ollama"
        assert "config" in ai_data
