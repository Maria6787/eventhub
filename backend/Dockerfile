# =============================================================================
# EventHub BACKEND Dockerfile (FastAPI)
# Multi-stage build: STAGE 1 "builder" compiles/installs deps into wheels,
# STAGE 2 "runtime" copies only what's needed -> small, clean final image.
# =============================================================================

# ---------- STAGE 1: builder ----------
# Pinned tag (NOT :latest) so builds are reproducible. "slim" = minimal Debian.
FROM python:3.12-slim AS builder

# WORKDIR sets (and creates) the working directory for following instructions.
WORKDIR /app

# Build-time system packages needed to compile the psycopg2 Postgres driver.
# We clean apt lists in the SAME layer to avoid bloating the image.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# COPY (not ADD) the dependency file FIRST, before the source code.
# Why first? Docker caches layers. requirements.txt changes rarely, so this
# expensive install layer is reused on rebuilds whenever only app code changes.
COPY requirements.txt .

# Build dependencies into pre-compiled "wheels" we copy into the runtime stage.
RUN pip install --upgrade pip \
    && pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# ---------- STAGE 2: runtime ----------
# Start fresh from the same slim base — the final image does NOT contain
# build-essential or the full build toolchain. That is what keeps it small.
FROM python:3.12-slim AS runtime

WORKDIR /app

# libpq5 is the lightweight RUNTIME library psycopg2 needs (not the -dev headers).
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

# ENV: PYTHONDONTWRITEBYTECODE stops .pyc files; PYTHONUNBUFFERED makes logs
# appear immediately (important so `docker compose logs` shows output live).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Bring over the pre-built wheels from the builder stage and install them
# offline (no compiler needed here). Then remove the wheels to save space.
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* \
    && rm -rf /wheels

# Now COPY the application source code (changes most often -> last layer).
COPY ./app ./app

# EXPOSE documents the port the app listens on (metadata; does not publish it).
EXPOSE 8000

# CMD in EXEC form (JSON array). Exec form runs the process directly as PID 1
# (no shell wrapper), so it receives Unix signals correctly for clean shutdown.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
