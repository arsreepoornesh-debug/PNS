# TalentMatch AI - Production AI Resume Shortlisting & Job Matching Platform

An enterprise-grade, recruiter-facing AI platform that analyzes candidate resumes (PDF/DOCX) against Job Descriptions with **transparent mathematical scoring**, **verified evidence quotes**, **customizable weights**, and **zero hallucination**.

---

## 🌟 Key Features

### 1. Job Description Management & AI Extraction
- Create detailed Job Descriptions with Title, Department, Experience required, Location, and Employment Type.
- **✨ Auto-Extract Requirements**: AI parses raw JD text into structured mandatory required skills, nice-to-have preferred skills, education criteria, and certifications.
- **Configurable Scoring Weights**:
  - Required Skills (Default: 40%)
  - Relevant Experience (Default: 25%)
  - Projects / Relevant Work (Default: 15%)
  - Education (Default: 10%)
  - Preferred Skills (Default: 10%)
- **Configurable Match Thresholds & Mandatory Policy**:
  - `MATCHED`: Score $\ge 75\%$
  - `PARTIALLY MATCHED`: Score $\ge 50\%$ and $< 75\%$
  - `NOT MATCHED`: Score $< 50\%$
  - **Mandatory Skill Rule**: Candidates missing mandatory requirements are automatically downgraded from MATCHED with clear missing requirement warnings (e.g. *"Missing mandatory skill: PostgreSQL"*).

### 2. Multi-Resume Ingestion & Asynchronous Batch Processing
- Drag-and-drop batch resume upload supporting **PDF** (via PyMuPDF) and **DOCX** (via python-docx).
- Scalable asynchronous processing queue with live progress polling (`Analyzing 37 / 100 resumes...`).
- Tracks per-resume state: `Pending`, `Processing`, `Completed`, `Failed`.

### 3. Transparent, Evidence-Based Matching & AI Fairness
- **Strict Evidence Grounding**: Every matched requirement shows the exact text snippet and resume page number where evidence was discovered.
- **Zero Hallucination Guarantee**: Skills not found in the resume are strictly marked as `"Not Found"`.
- **Bias-Free / Ethical AI**: Ignores protected demographics (gender, race, age, religion, disability, marital status).

### 4. Recruiter Shortlisting & Pipeline Management
- Dynamic candidate list ordered with **`✓ MATCHED` candidates at the top**, followed by **`⚠ PARTIAL MATCH`**, and **`✕ NOT MATCHED`**.
- Deep Candidate Inspector Drawer/Modal with requirement-by-requirement breakdown, scoring radar, and private recruiter notes.
- Pipeline stages: `NEW`, `ANALYZING`, `MATCHED`, `SHORTLISTED`, `INTERVIEW`, `REJECTED`, `HIRED`.
- **1-Click Export**: Export shortlisted talent records to formatted **CSV** or **Excel (.xlsx)**.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Next.js 14/15 App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, SQLAlchemy (Async), Pydantic v2, SQLite (aiosqlite) / PostgreSQL ready
- **Document Parsing**: PyMuPDF (`fitz`), python-docx
- **AI Provider**: `AIProvider` abstraction with `OllamaProvider` (supporting Qwen 2.5/3, Llama 3, etc.) and transparent fallback engine.
- **Testing**: Pytest & Pytest-asyncio

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend
```bash
# Activate virtual environment
.\venv\Scripts\activate

# (Optional) Seed demo data with sample job & 5 evaluated resumes
python backend/seed.py

# Run FastAPI backend server (Port 8000)
python run_backend.py
```
Backend Swagger API Documentation is available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Start the Next.js Frontend
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests
```bash
pytest backend/tests
```
All unit and integration tests for document parsing, deterministic evidence extraction, mandatory rules, and API endpoints run automatically.
