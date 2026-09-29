import asyncio
import os
import uuid
import fitz # PyMuPDF
from app.db.session import AsyncSessionLocal, engine
from app.db.base import Base
from app.models.all_models import Job, Requirement, Resume
from app.tasks.processor import process_single_resume
from app.core.config import settings

SAMPLE_RESUMES = [
    {
        "filename": "Alex_Morgan_Backend_Lead.pdf",
        "content": """Alex Morgan
Email: alex.morgan@example.com | Phone: +1-555-0192 | San Francisco, CA

SUMMARY
Senior Software Engineer with 4.5 years of professional backend development experience building scalable microservices and APIs.

EXPERIENCE
Lead Backend Engineer - Nexus Cloud Solutions (2022 - Present)
- Developed backend applications using Python and FastAPI handling 15M daily requests with high reliability.
- Architected and optimized PostgreSQL databases, query planning, and connection pooling.
- Designed robust REST API contracts and microservice architectures with Redis caching.
- Spearheaded CI/CD automation pipelines using Git, Docker, and GitHub Actions.
- Managed AWS cloud infrastructure including ECS, S3, and RDS deployments.

Software Engineer - DataTech Corp (2020 - 2022)
- Built high-performance data ingestion pipelines in Python.
- Maintained PostgreSQL relational schemas and automated migration scripts.

PROJECTS
- FinStream: Real-time payments microservice using FastAPI, PostgreSQL, and Redis.
- CloudMetrics: Distributed monitoring tool containerized with Docker and deployed to AWS.

EDUCATION
Bachelor of Science in Computer Science - University of California, Berkeley (2016 - 2020)

SKILLS
Python, FastAPI, REST API, PostgreSQL, Git, Docker, AWS, Redis, Microservices, Linux
"""
    },
    {
        "filename": "Sarah_Chen_Python_Developer.pdf",
        "content": """Sarah Chen
Email: sarah.chen@example.com | Phone: +1-555-8392 | Seattle, WA

PROFESSIONAL SUMMARY
Backend Developer with 3.2 years of experience specializing in Python web frameworks, relational databases, and RESTful API design.

WORK EXPERIENCE
Backend Developer - Horizon Web Labs (2022 - Present)
- Developed backend REST APIs using Python and FastAPI for enterprise SaaS clients.
- Designed PostgreSQL database tables, indexing strategies, and complex SQL queries.
- Collaborated in team code reviews using Git and version control best practices.
- Implemented in-memory caching with Redis to reduce database latency by 40%.

Junior Developer - ByteCraft (2021 - 2022)
- Developed internal reporting scripts in Python and automated data synchronization.

KEY PROJECTS
- Inventory Hub: Full-scale inventory management REST API built with FastAPI and PostgreSQL.
- TaskQueue: Asynchronous task distribution engine using Python and Redis.

EDUCATION
Bachelor of Engineering in Information Technology - University of Washington

TECHNICAL SKILLS
Python, FastAPI, PostgreSQL, REST API, Git, Redis, SQL, Docker (Basic)
"""
    },
    {
        "filename": "Marcus_Vance_Partial_Match.pdf",
        "content": """Marcus Vance
Email: marcus.vance@techmail.com | Phone: +1-555-4729 | Austin, TX

SUMMARY
Web Developer with 2.5 years experience building Python and Django web applications.

EXPERIENCE
Software Engineer - Apex Solutions (2022 - Present)
- Built web applications using Python and Django framework.
- Developed REST API endpoints for user authentication and order processing.
- Utilized MySQL for data persistence and schema management.
- Collaborated with frontend engineers and managed repositories using Git.
- Configured Docker containers for development environments.

EDUCATION
Bachelor of Science in Software Development - Texas State University (2018 - 2022)

PROJECTS
- E-Commerce Engine: Django web platform with MySQL database.

SKILLS
Python, Django, REST API, MySQL, Docker, Git, HTML, CSS, JavaScript
"""
    },
    {
        "filename": "David_Kim_Non_Match_Java.pdf",
        "content": """David Kim
Email: david.kim@samplecorp.org | Phone: +1-555-9012 | Chicago, IL

OBJECTIVE
Junior Java Developer seeking backend roles in enterprise software.

EXPERIENCE
Junior Java Developer - Legacy Enterprise Systems (2023 - Present)
- Maintained Java Spring Boot applications and SOAP services.
- Created unit tests using JUnit and Mockito.
- Worked with Oracle DB for stored procedures.

EDUCATION
Bachelor of Arts in Information Systems - University of Illinois (2019 - 2023)

SKILLS
Java, Spring Boot, Hibernate, Oracle DB, Maven, Eclipse, Jenkins
"""
    },
    {
        "filename": "Elena_Rostova_Fullstack_Dev.pdf",
        "content": """Elena Rostova
Email: elena.rostova@clouddev.io | Phone: +1-555-6671 | New York, NY

PROFILE
Versatile Full Stack Engineer with 3.8 years experience with Python backend and React frontends.

EXPERIENCE
Full Stack Engineer - CloudSpire Inc. (2021 - Present)
- Built modern microservices using Python, FastAPI, and PostgreSQL.
- Implemented comprehensive REST API standards and OpenAPI documentation.
- Deployed services to AWS using Docker containers and Kubernetes.
- Set up Redis for session management and rate limiting.
- Maintained team Git repositories and automated CI workflows.

EDUCATION
Master of Science in Computer Science - Columbia University (2019 - 2021)

PROJECTS
- HealthTracker: Microservice architecture with FastAPI, PostgreSQL, AWS S3, and React.

SKILLS
Python, FastAPI, PostgreSQL, REST API, AWS, Docker, Redis, Git, TypeScript, React
"""
    }
]

def create_pdf(file_path: str, text: str):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4
    rect = fitz.Rect(50, 50, 545, 792)
    page.insert_textbox(rect, text, fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    doc.save(file_path)
    doc.close()

async def seed_database():
    print("Seeding database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        # Create Sample Job
        job_id = str(uuid.uuid4())
        job = Job(
            id=job_id,
            title="Python Backend Developer",
            department="Engineering",
            experience_required="2+ years",
            experience_min_years=2.0,
            location="Remote / San Francisco",
            employment_type="Full-time",
            description="""We are seeking a talented Python Backend Developer to design, build, and maintain our high-performance APIs and microservices. 
The ideal candidate has proven experience developing backend applications using Python and FastAPI, managing relational databases with PostgreSQL, and crafting clean REST APIs.

Key Responsibilities:
- Build scalable REST APIs and backend microservices with Python & FastAPI.
- Architect and optimize PostgreSQL databases.
- Integrate caching with Redis and containerize services with Docker.
- Collaborate using Git version control and deploy on AWS cloud infrastructure.
""",
            weight_required_skills=40.0,
            weight_experience=25.0,
            weight_projects=15.0,
            weight_education=10.0,
            weight_preferred_skills=10.0,
            threshold_matched=75.0,
            threshold_partial=50.0,
            mandatory_rule="downgrade_to_partial",
            status="active"
        )
        db.add(job)
        await db.flush()
        
        # Requirements
        requirements_data = [
            ("Python", "required", True),
            ("FastAPI", "required", True),
            ("REST API", "required", True),
            ("PostgreSQL", "required", True),
            ("Git", "required", True),
            ("Docker", "preferred", False),
            ("AWS", "preferred", False),
            ("Redis", "preferred", False)
        ]
        
        req_objects = []
        for name, req_type, mandatory in requirements_data:
            req = Requirement(
                id=str(uuid.uuid4()),
                job_id=job.id,
                name=name,
                type=req_type,
                is_mandatory=mandatory,
                weight_multiplier=1.0
            )
            db.add(req)
            req_objects.append(req)
            
        await db.commit()
        
        # Create Sample Resumes in storage and process them
        os.makedirs(settings.STORAGE_DIR, exist_ok=True)
        
        for sample in SAMPLE_RESUMES:
            file_path = os.path.join(settings.STORAGE_DIR, f"{job.id}_{sample['filename']}")
            create_pdf(file_path, sample["content"])
            
            resume = Resume(
                id=str(uuid.uuid4()),
                job_id=job.id,
                filename=sample["filename"],
                file_path=file_path,
                file_size_bytes=os.path.getsize(file_path),
                file_type="pdf",
                upload_status="pending",
                page_count=1
            )
            db.add(resume)
            await db.commit()
            
            # Process immediately for seed
            await process_single_resume(db, resume.id, job, req_objects)
            print(f"Processed seed candidate from: {sample['filename']}")

        print("Database seed complete! Sample job and 5 analyzed candidates created.")

if __name__ == "__main__":
    asyncio.run(seed_database())
