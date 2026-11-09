"""
cache.py
--------
Thin Redis wrapper used for caching the "list events" response (BONUS feature).

Design goal: the app must still work even if Redis is DOWN or disabled.
So every function fails SILENTLY (returns None / does nothing) on error.
Caching is an optimization, never a hard dependency.
"""

import json
import os
from typing import Optional

import redis

# REDIS_URL is optional. If it is not set, caching is simply disabled.
REDIS_URL = os.getenv("REDIS_URL")  # e.g. redis://cache:6379/0

# Create the client once at import time (if configured).
_client: Optional[redis.Redis] = None
if REDIS_URL:
    try:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    except Exception:
        _client = None


def cache_enabled() -> bool:
    """True only if a Redis client was successfully created."""
    return _client is not None


def get_cached(key: str) -> Optional[list]:
    """Return a cached JSON value for `key`, or None on miss/error."""
    if not _client:
        return None
    try:
        raw = _client.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None  # never let a cache error break the request


def set_cached(key: str, value: list, ttl: int = 30) -> None:
    """Store `value` (JSON-serializable) under `key` for `ttl` seconds."""
    if not _client:
        return
    try:
        _client.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


def invalidate(key: str) -> None:
    """Delete a cache key (called after create/update/delete so data stays fresh)."""
    if not _client:
        return
    try:
        _client.delete(key)
    except Exception:
        pass
