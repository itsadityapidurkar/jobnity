# ==============================================================================
# Multi-stage Dockerfile for Jobnity (React Frontend + FastAPI Backend)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React Frontend Application
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build assets
COPY index.html ./
COPY public ./public
COPY src ./src

# Generate production bundle in /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Unified Python FastAPI Runtime
# ------------------------------------------------------------------------------
FROM python:3.10-slim AS runner
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8001

# Install runtime system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy production dist folder built in Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy backend application code and dataset scripts
COPY backend ./backend

# Create uploads directory for candidate resume storage
RUN mkdir -p ./backend/uploads ./uploads

WORKDIR /app/backend

# Seed database schema & datasets (roles, skills, aliases, resources)
RUN python3 scripts/import_datasets.py

EXPOSE 8001

# Run Uvicorn ASGI server
CMD ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
