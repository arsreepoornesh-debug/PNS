# ── Stage 1: Builder ────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system deps required by pymupdf
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Runtime ────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Runtime system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m appuser

COPY --from=builder /install /usr/local
COPY backend/ /app/

# Create upload dir (used when STORAGE_TYPE=local)
RUN mkdir -p /app/uploaded_resumes && chown -R appuser /app

USER appuser

EXPOSE 8000

# Render injects PORT env var; fall back to 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
