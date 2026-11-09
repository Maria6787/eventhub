"""
database.py
-----------
Sets up the SQLAlchemy connection to PostgreSQL.

Why this file exists:
- Centralizes DB configuration in ONE place (single source of truth).
- Reads the connection string from an environment variable (DATABASE_URL),
  so we NEVER hard-code secrets. Docker Compose injects this at runtime.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Read the database URL from the environment.
# Format: postgresql://<user>:<password>@<host>:<port>/<dbname>
# NOTE: the host is "db" — the Docker Compose SERVICE NAME, not "localhost".
# Docker's user-defined network resolves "db" to the database container's IP.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    # Fallback only used when running outside Docker (local dev).
    "postgresql://eventhub:eventhub@localhost:5432/eventhub",
)

# The engine is the core interface to the database (manages a connection pool).
# pool_pre_ping=True checks a connection is still alive before using it,
# which avoids "server closed the connection" errors after the DB restarts.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# SessionLocal is a factory: each request creates its own short-lived session.
# autocommit/autoflush are off so we control transactions explicitly.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class all ORM models inherit from. SQLAlchemy uses it
# to collect table metadata so it can create the tables.
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session and guarantees it is
    closed afterwards (even if the request raises an error).
    Used via: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
