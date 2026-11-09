"""
main.py
-------
The FastAPI application: defines every REST endpoint.

This demonstrates a COMPLETE CRUD API on the "Event" resource:
    CREATE -> POST   /events
    READ   -> GET    /events          (list, cached)
           -> GET    /events/{id}     (single, with bookings)
    UPDATE -> PUT    /events/{id}
    DELETE -> DELETE /events/{id}
Plus a nested resource:
    POST /events/{id}/bookings  (book tickets for an event)
"""

from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import cache, models, schemas
from app.database import Base, engine, get_db

# Create tables on startup if they don't exist yet.
# (For production you'd use Alembic migrations; this is fine for the exam.)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EventHub API",
    description="Event ticketing & booking REST API (FastAPI + PostgreSQL).",
    version="1.0.0",
)

# CORS: allow the Next.js frontend (different origin) to call this API.
# "*" is fine for a demo; lock this down in real production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache key for the full events list (BONUS: Redis).
EVENTS_CACHE_KEY = "events:all"


# ---------- Health & root ----------
@app.get("/health", tags=["system"])
def health():
    """Liveness probe — used by humans and by container healthchecks."""
    return {"status": "ok", "cache_enabled": cache.cache_enabled()}


@app.get("/", tags=["system"])
def root():
    """Friendly landing response pointing to the interactive docs."""
    return {"message": "Welcome to EventHub API. See /docs for Swagger UI."}


# ---------- CREATE ----------
@app.post(
    "/events",
    response_model=schemas.EventOut,
    status_code=status.HTTP_201_CREATED,
    tags=["events"],
)
def create_event(payload: schemas.EventCreate, db: Session = Depends(get_db)):
    """Create a new event, then invalidate the cached list."""
    event = models.Event(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)                 # reload to get the DB-generated id
    cache.invalidate(EVENTS_CACHE_KEY)  # list changed -> drop stale cache
    return event


# ---------- READ (list) ----------
@app.get("/events", response_model=List[schemas.EventOut], tags=["events"])
def list_events(db: Session = Depends(get_db)):
    """
    List all events.
    BONUS caching flow:
      1. Try Redis first (fast path).
      2. On miss, read from PostgreSQL and populate the cache (TTL 30s).
    """
    cached = cache.get_cached(EVENTS_CACHE_KEY)
    if cached is not None:
        return cached  # cache HIT

    events = db.query(models.Event).order_by(models.Event.event_date).all()
    # Serialize to plain dicts so they can be JSON-stored in Redis.
    data = [schemas.EventOut.model_validate(e).model_dump() for e in events]
    cache.set_cached(EVENTS_CACHE_KEY, data, ttl=30)
    return data


# ---------- READ (single) ----------
@app.get(
    "/events/{event_id}",
    response_model=schemas.EventWithBookings,
    tags=["events"],
)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Fetch one event (including its bookings) or return 404."""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# ---------- UPDATE ----------
@app.put("/events/{event_id}", response_model=schemas.EventOut, tags=["events"])
def update_event(
    event_id: int, payload: schemas.EventUpdate, db: Session = Depends(get_db)
):
    """Replace an event's fields, then invalidate the cached list."""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, value in payload.model_dump().items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    cache.invalidate(EVENTS_CACHE_KEY)
    return event


# ---------- DELETE ----------
@app.delete(
    "/events/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["events"],
)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """Delete an event (and its bookings via cascade), then clear cache."""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    cache.invalidate(EVENTS_CACHE_KEY)
    return None  # 204 => empty body


# ---------- Nested: book tickets ----------
@app.post(
    "/events/{event_id}/bookings",
    response_model=schemas.BookingOut,
    status_code=status.HTTP_201_CREATED,
    tags=["bookings"],
)
def create_booking(
    event_id: int, payload: schemas.BookingCreate, db: Session = Depends(get_db)
):
    """Book `quantity` tickets for an event, enforcing remaining capacity."""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Sum tickets already booked to check capacity.
    booked = sum(b.quantity for b in event.bookings)
    if booked + payload.quantity > event.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough capacity. {event.capacity - booked} tickets left.",
        )

    booking = models.Booking(event_id=event_id, **payload.model_dump())
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking
