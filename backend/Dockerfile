# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS production

# Security: non-root user
RUN groupadd -r mamaverse && useradd -r -g mamaverse mamaverse

WORKDIR /app

# Copy the virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY --chown=mamaverse:mamaverse . .

# Create __init__.py files
RUN touch routers/__init__.py middleware/__init__.py services/__init__.py \
    agents/__init__.py models/__init__.py

# Switch to non-root user
USER mamaverse

# Cloud Run uses PORT env variable (default 8080)
ENV PORT=8080
EXPOSE 8080

# Start with uvicorn (production: single worker, Cloud Run auto-scales)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1 --loop uvloop --no-access-log"]
