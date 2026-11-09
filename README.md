# 🎟️ EventHub — Event Ticketing & Booking Platform

A modern, fully containerized **three-tier web application** for publishing events and booking tickets.
Built as a UTS (Midterm) project to demonstrate CRUD API design, containerization, and multi-service orchestration with Docker Compose.

> **Stack:** Next.js (frontend) · FastAPI (backend REST API) · PostgreSQL (database) · Redis (cache) — all orchestrated with Docker Compose.

---

## 📖 Description

EventHub lets organizers perform full **CRUD** on events (create, read, update, delete) and lets attendees book tickets, with live capacity checks. It is split into three tiers — presentation, application, and data — each running in its own container on a private, user-defined Docker network.

## 💡 Why I built it this way

- **FastAPI** — fast, modern Python framework with automatic OpenAPI/Swagger docs, ideal for a clean REST CRUD API.
- **Next.js** — production-grade React framework; its `standalone` output produces a tiny Docker image.
- **PostgreSQL** — robust relational database, a great fit for structured event/booking data.
- **Redis** — lightweight cache for the "list events" endpoint to reduce database load.
- **Docker Compose** — one command spins up the whole multi-tier stack reproducibly on any machine.

## 🏗️ Architecture

```
Browser ──▶ Next.js (:3000) ──▶ FastAPI (:8000) ──▶ PostgreSQL (:5432)
                                      │
                                      └──▶ Redis cache (:6379)
   All services share the user-defined network "eventhub-net".
   PostgreSQL data persists in the named volume "db_data".
```

## 🚀 How to Run

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Steps
```bash
# 1. Clone the repo
git clone https://github.com/<YOUR_USERNAME>/eventhub.git
cd eventhub

# 2. Create your environment file from the template
cp .env.example .env        # Windows: copy .env.example .env
#    (then edit .env and set a real POSTGRES_PASSWORD)

# 3. Build and start everything
docker compose up -d --build

# 4. Open the app
#    Frontend UI : http://localhost:3000
#    API docs    : http://localhost:8000/docs
```

### Optional: start pgAdmin (profile-gated)
```bash
docker compose --profile admin up -d
#    pgAdmin : http://localhost:5050
```

### Stop
```bash
docker compose down          # stops containers, KEEPS the database (volume)
docker compose down -v       # also DELETES the database volume (full reset)
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/events` | Create an event |
| GET    | `/events` | List all events (Redis-cached) |
| GET    | `/events/{id}` | Get one event with its bookings |
| PUT    | `/events/{id}` | Update an event |
| DELETE | `/events/{id}` | Delete an event |
| POST   | `/events/{id}/bookings` | Book tickets for an event |
| GET    | `/health` | Health check |

## 📸 Screenshots

> _Replace these placeholders with your own screenshots._

| Containers running | Web UI |
|--------------------|--------|
| _(screenshot of `docker compose ps`)_ | _(screenshot of http://localhost:3000)_ |

## 🔗 Links

- 📹 **Video demo (YouTube):** _<paste your YouTube link here>_
- ✍️ **Article (Medium/dev.to):** _<paste your article link here>_
- 📄 **Full report:** The complete cloud analysis and architecture rationale are in the submitted UTS PDF report.

## 🤖 AI Usage Declaration

In accordance with academic honesty requirements, I declare that AI tools were used as a **supporting aid for a maximum of ~50% of this work**, specifically for:
- Brainstorming the project idea and refining the architecture.
- Explaining concepts (multi-stage builds, Docker networking, COPY vs ADD).
- Debugging configuration and reviewing code.

The remaining work — understanding, running, testing, integrating, and presenting the project — was performed and verified by me. All code in this repository has been read and understood by the author.

## 📝 Originality Statement

This project is my own original work, created for the Midterm Exam (UTS). Any external references used are acknowledged above.
