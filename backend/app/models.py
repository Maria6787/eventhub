"""
models.py
---------
SQLAlchemy ORM models = the database tables as Python classes.

We have two tables:
- events   : the things organizers create (full CRUD target)
- bookings : tickets attendees reserve for an event (one-to-many: event -> bookings)
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Event(Base):
    """An event that an organizer publishes (concert, workshop, meetup...)."""

    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=False)
    # Total seats available for this event.
    capacity = Column(Integer, nullable=False, default=0)
    # Price per ticket, stored in the smallest currency unit (e.g. rupiah).
    price = Column(Integer, nullable=False, default=0)
    event_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationship() gives us event.bookings in Python (not a DB column).
    # cascade="all, delete-orphan" => deleting an event deletes its bookings.
    bookings = relationship(
        "Booking", back_populates="event", cascade="all, delete-orphan"
    )


class Booking(Base):
    """A ticket reservation made by an attendee for a specific event."""

    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    # ForeignKey links each booking to one event row.
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    attendee_name = Column(String(120), nullable=False)
    attendee_email = Column(String(120), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    # The reverse side of the relationship: booking.event
    event = relationship("Event", back_populates="bookings")
