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

## 📸 Project Screenshots

Berikut adalah bukti implementasi dan pengujian project EventHub sesuai dengan kriteria penilaian.

### 1. Docker Containers Status (SS-1)
Perintah `docker compose ps` menunjukkan bahwa keempat container (`backend`, `frontend`, `db`, `cache`) berhasil berjalan. Container database dan cache berstatus **healthy**, menandakan konfigurasi *healthcheck* berfungsi dengan baik.
<img width="1156" height="76" alt="Screenshot 2026-11-09 at 17 00 51" src="https://github.com/user-attachments/assets/1e607c10-ce78-4d74-bf0a-dad510cf437a" />

### 2. Docker Image Size (SS-2)
Perintah `docker images` membuktikan bahwa implementasi **multi-stage build** pada Dockerfile berhasil. Ukuran image akhir tetap kecil dan ringan karena hanya berisi *runtime* yang dibutuhkan, tanpa menyertakan *tools* build.
<img width="688" height="36" alt="Screenshot 2026-11-09 at 17 09 23" src="https://github.com/user-attachments/assets/f541be86-9360-4a76-b173-cf65db77b282" />

### 3. API Testing - CRUD (SS-3)
Pengujian endpoint menggunakan Swagger UI (`/docs`) atau `curl`. Gambar di bawah menunjukkan respons JSON yang berhasil dibuat dengan status `200 OK`, membuktikan bahwa operasi CRUD (Create & Read) berjalan dengan baik.
<img width="649" height="244" alt="Screenshot 2026-04-24 at 00 36 25" src="https://github.com/user-attachments/assets/73d69905-c4e4-413f-a461-04c638733d01" />

### 4. Frontend UI (SS-4)
Tampilan antarmuka web EventHub yang diakses melalui `http://localhost:3000`. Halaman ini berhasil menampilkan data event yang diambil dari backend dan database.
<img width="1470" height="956" alt="Screenshot 2026-11-09 at 16 45 17" src="https://github.com/user-attachments/assets/d6a05082-bb1e-4507-9b04-5df6eb637a21" />

### 5. Data Persistence Test (SS-5)
Bukti bahwa **Named Volume** bekerja dengan sempurna. Setelah container dimatikan (`docker compose down`) dan dinyalakan kembali (`docker compose up -d`), data event masih tetap ada dan tidak hilang.
<img width="573" height="198" alt="Screenshot 2026-11-09 at 17 13 14" src="https://github.com/user-attachments/assets/1f8ed9c1-e389-4aa1-84c7-d52ee485537e" />


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
