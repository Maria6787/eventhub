/**
 * page.tsx  (home page)
 * ---------------------
 * Client component that talks to the FastAPI backend and demonstrates the
 * FULL CRUD cycle from the UI:
 *   - GET    /events          -> render the list of events
 *   - POST   /events          -> create a new event
 *   - PUT    /events/{id}      -> UPDATE (edit) an event        <-- NEW
 *   - DELETE /events/{id}      -> DELETE an event               <-- NEW
 *
 * IMPORTANT (networking):
 *   The browser runs on the USER's machine, so it must reach the API via
 *   a URL the browser can see (http://localhost:8000). We expose this through
 *   the NEXT_PUBLIC_API_URL env var (public = shipped to the browser).
 */
"use client";

import { useEffect, useState } from "react";

// Read the API base URL injected at build/runtime; fall back to localhost.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string;
  capacity: number;
  price: number;
  event_date: string;
};

// The shape of the create/edit form (without the server-generated id).
// NOTE: capacity & price are kept as STRINGS here (not numbers). This lets the
// input box be truly empty instead of showing a stuck leading "0" (which caused
// "030000" when typing). We convert them to numbers only when submitting.
type EventForm = {
  title: string;
  location: string;
  capacity: string;
  price: string;
  event_date: string;
  description: string;
};

const emptyForm: EventForm = {
  title: "",
  location: "",
  capacity: "50",
  price: "",
  event_date: "",
  description: "",
};

// Convert an ISO datetime (from the API) into the value a
// <input type="datetime-local"> expects: "YYYY-MM-DDTHH:mm".
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Shared form state. When editingId is null we are CREATING;
  // when it holds an id we are EDITING that event.
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  // CREATE (POST) or UPDATE (PUT) depending on whether we are editing.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = JSON.stringify({
      ...form,
      // Convert the string inputs to numbers; empty string becomes 0.
      capacity: Number(form.capacity) || 0,
      price: Number(form.price) || 0,
      event_date: new Date(form.event_date).toISOString(),
    });

    if (editingId === null) {
      // --- CREATE ---
      await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    } else {
      // --- UPDATE (PUT by id) ---
      await fetch(`${API_URL}/events/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      });
    }

    // Reset the form back to "create" mode and refresh the list.
    setForm(emptyForm);
    setEditingId(null);
    loadEvents();
  }

  // Load an event's data into the form so the user can edit it.
  function startEdit(ev: EventItem) {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      location: ev.location,
      // Convert numbers to strings for the text/number inputs.
      capacity: String(ev.capacity),
      price: String(ev.price),
      event_date: toLocalInput(ev.event_date),
      description: ev.description ?? "",
    });
    // Scroll up so the user sees the form that is now in "edit" mode.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Cancel editing and return the form to "create" mode.
  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  // DELETE an event by id (with a confirmation prompt).
  async function handleDelete(id: number) {
    const ok = window.confirm("Delete this event? This cannot be undone.");
    if (!ok) return;

    await fetch(`${API_URL}/events/${id}`, { method: "DELETE" });

    // If we were editing the event we just deleted, reset the form.
    if (editingId === id) cancelEdit();
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

      {/* Create / Edit form — the heading changes depending on the mode */}
      <div className="card">
        <h2 style={{ marginBottom: "0.75rem" }}>
          {editingId === null ? "Create an Event" : "Edit Event"}
        </h2>
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
            min="0"
            placeholder="Capacity (e.g. 50)"
            value={form.capacity}
            // Store the raw string so the box can be empty (no stuck leading 0).
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />
          <input
            type="number"
            min="0"
            placeholder="Price (e.g. 30000)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
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
          {/* Buttons: in edit mode we also show a Cancel button */}
          <div className="full" style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit">
              {editingId === null ? "+ Create Event" : "💾 Save Changes"}
            </button>
            {editingId !== null && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
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
              {new Date(ev.event_date).toLocaleString()} &nbsp;•&nbsp; 🎟{" "}
              {ev.capacity} seats &nbsp;•&nbsp;{" "}
              <span className="price">
                {ev.price === 0 ? "Free" : `Rp ${ev.price.toLocaleString()}`}
              </span>
            </div>
            {ev.description && (
              <p style={{ marginTop: "0.5rem" }}>{ev.description}</p>
            )}

            {/* NEW: Edit + Delete action buttons wire the UI to the
                existing PUT and DELETE backend endpoints. */}
            <div className="actions">
              <button className="btn-secondary" onClick={() => startEdit(ev)}>
                ✏️ Edit
              </button>
              <button className="btn-danger" onClick={() => handleDelete(ev.id)}>
                🗑 Delete
              </button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
