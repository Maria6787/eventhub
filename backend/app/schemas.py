"""
schemas.py
----------
Pydantic models = the API's request/response contracts (validation layer).

Why separate from models.py?
- models.py describes the DATABASE shape.
- schemas.py describes the API shape (what clients send/receive).
Keeping them separate means we can hide internal fields and validate input
before it ever touches the database.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Event schemas ----------
class EventBase(BaseModel):
    """Fields shared by create & update requests."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    location: str = Field(..., min_length=1, max_length=200)
    capacity: int = Field(..., ge=0)          # ge=0 => cannot be negative
    price: int = Field(..., ge=0)
    event_date: datetime


class EventCreate(EventBase):
    """Request body for POST /events (create)."""

    pass


class EventUpdate(EventBase):
    """Request body for PUT /events/{id} (update)."""

    pass


class EventOut(EventBase):
    """Response body sent back to clients (includes server-generated fields)."""

    id: int
    created_at: datetime

    class Config:
        # Allows Pydantic to read data directly from SQLAlchemy ORM objects.
        from_attributes = True


# ---------- Booking schemas ----------
class BookingCreate(BaseModel):
    """Request body for POST /events/{id}/bookings."""

    attendee_name: str = Field(..., min_length=1, max_length=120)
    attendee_email: EmailStr                   # validates it looks like an email
    quantity: int = Field(1, ge=1)             # must book at least 1 ticket


class BookingOut(BaseModel):
    """Response body for a booking."""

    id: int
    event_id: int
    attendee_name: str
    attendee_email: EmailStr
    quantity: int
    created_at: datetime

    class Config:
        from_attributes = True


class EventWithBookings(EventOut):
    """An event plus its list of bookings (used on the detail endpoint)."""

    bookings: List[BookingOut] = []
