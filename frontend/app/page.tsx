/**
 * page.tsx  (home page)
 * ---------------------
 * Client component that talks to the FastAPI backend:
 *   - GET  /events        -> render the list of events
 *   - POST /events        -> create a new event from the form
 *
 * IMPORTANT (networking):
 *   The browser runs on the USER's machine, so it must reach the API via
 *   a URL the browser can see (http://localhost:8000). We expose this through
 *   the NEXT_PUBLIC_API_URL env var (public = shipped to the browser).
 *   This is different from server-to-server calls, which would use the Docker
 *   service name "backend".
 */
"use client";

import { useEffect, useState } from "react";

// Read the API base URL injected at build/runtime; fall back to localhost.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string;
  capacity: number;
  price: number;
  event_date: string;
};

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Controlled form state for creating an event.
  const [form, setForm] = useState({
    title: "",
    location: "",
    capacity: 50,
    price: 0,
    event_date: "",
    description: "",
  });

  // Fetch the list of events from the backend.
  async function loadEvents() {
    try {
      const res = await fetch(`${API_URL}/events`);
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // Submit the form -> POST /events -> reload list.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        capacity: Number(form.capacity),
        price: Number(form.price),
        // Convert the datetime-local value to ISO so FastAPI parses it.
        event_date: new Date(form.event_date).toISOString(),
      }),
    });
    setForm({
      title: "",
      location: "",
      capacity: 50,
      price: 0,
      event_date: "",
      description: "",
    });
    loadEvents();
  }

  return (
    <main className="container">
      <div className="header">
        <div className="brand">
          Event<span>Hub</span>
        </div>
        <div className="meta">FastAPI + Next.js + PostgreSQL</div>
      </div>

      {/* Create-event form */}
      <div className="card">
        <h2 style={{ marginBottom: "0.75rem" }}>Create an Event</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            placeholder="Title"
            value={form.title}
            required
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Location"
            value={form.location}
            required
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <input
            type="number"
            placeholder="Capacity"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
          <input
            type="datetime-local"
            className="full"
            value={form.event_date}
            required
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          />
          <textarea
            className="full"
            placeholder="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="full" type="submit">
            + Create Event
          </button>
        </form>
      </div>

      {/* Event list */}
      <h2 style={{ margin: "1.5rem 0 0.75rem" }}>Upcoming Events</h2>
      {loading ? (
        <p className="empty">Loading…</p>
      ) : events.length === 0 ? (
        <p className="empty">No events yet — create one above!</p>
      ) : (
        events.map((ev) => (
          <div className="card" key={ev.id}>
            <div className="event-title">{ev.title}</div>
            <div className="meta">
              📍 {ev.location} &nbsp;•&nbsp; 🗓{" "}
              {new Date(ev.event_date).toLocaleString()} &nbsp;•&nbsp;{" "}
              🎟 {ev.capacity} seats &nbsp;•&nbsp;{" "}
              <span className="price">
                {ev.price === 0 ? "Free" : `Rp ${ev.price.toLocaleString()}`}
              </span>
            </div>
            {ev.description && (
              <p style={{ marginTop: "0.5rem" }}>{ev.description}</p>
            )}
          </div>
        ))
      )}
    </main>
  );
}
