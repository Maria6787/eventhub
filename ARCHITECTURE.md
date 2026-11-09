# 🏗️ EventHub — Architecture Design (Q2a)

> Use this for **Section 2(a)** of the PDF report. Paste the ASCII diagram inside a
> monospace / code block so the alignment stays correct, then the explanation below it.

## ASCII Architecture Diagram

```
                          ┌─────────────────────────┐
                          │     USER'S BROWSER       │
                          │  (http://localhost:3000) │
                          └────────────┬────────────┘
                                       │  HTTP
                     ┌─────────────────┼──────────────────┐
                     │   Browser loads UI from :3000       │
                     │   then calls API at :8000 (CORS)    │
                     └─────────────────┼──────────────────┘
   ========================= DOCKER HOST (your laptop) =========================
   ║                                   │                                        ║
   ║   PUBLISHED PORTS:  3000 ─────────┼────────── 8000                         ║
   ║                                   │                                        ║
   ║   ┌──────────────┐     ┌──────────▼──────────┐     ┌──────────────────┐    ║
   ║   │  frontend     │    │     backend         │     │       db         │    ║
   ║   │  Next.js      │    │     FastAPI         │     │   PostgreSQL 16  │    ║
   ║   │  :3000        │    │     :8000           │     │   :5432          │    ║
   ║   └──────┬───────┘     └─────┬─────────┬─────┘     └────────┬─────────┘    ║
   ║          │                   │         │                    │              ║
   ║          │   depends_on      │  "db:5432"          volume:  │              ║
   ║          │   (backend)       │         │           db_data  │              ║
   ║          │                   │   ┌─────▼─────┐               │             ║
   ║          │                   │   │  cache    │          ┌────▼─────┐       ║
   ║          │                   │   │  Redis 7  │          │ db_data  │       ║
   ║          │                   │   │  :6379    │          │ (named   │       ║
   ║          │                   │   └───────────┘          │  volume) │       ║
   ║          │                   │                          └──────────┘       ║
   ║   ┌──────┴───────────────────┴──────────────────────────────────┐         ║
   ║   │   USER-DEFINED NETWORK:  eventhub-net  (bridge)              │         ║
   ║   │   internal DNS: services reach each other by NAME            │         ║
   ║   └──────────────────────────────────────────────────────────────┘        ║
   =============================================================================

   REQUEST FLOW (create an event):
   Browser → :3000 (Next.js UI) → fetch POST :8000/events (FastAPI)
           → SQLAlchemy INSERT → db:5432 (PostgreSQL) → persisted to db_data
           → backend invalidates Redis "events:all" cache key
```

## Explanation

EventHub follows a classic **three-tier architecture**. The **presentation tier**
(Next.js, port 3000) renders the UI in the user's browser. The **application tier**
(FastAPI, port 8000) exposes the REST CRUD API and holds all business logic
(capacity checks, validation). The **data tier** (PostgreSQL, port 5432) persists
data to a named volume `db_data`, with Redis (port 6379) added as a caching layer.
All containers share a single **user-defined bridge network** (`eventhub-net`) whose
built-in DNS lets the backend reach the database simply as `db` and the cache as
`cache` — no hard-coded IPs. Only ports 3000 and 8000 are **published** to the host;
the database and cache stay private inside the network, which is a security best practice.

## Why containers beat VMs

| Aspect | Virtual Machines | Containers |
|--------|------------------|-----------|
| Isolation | Full guest OS per VM (hypervisor) | **Namespaces** isolate process/network/filesystem views; share the host kernel |
| Resource limits | Allocated per VM | **cgroups** cap CPU/memory precisely per container |
| Image size | GBs (whole OS) | MBs–hundreds of MBs (app + minimal deps) |
| Startup time | Minutes (boot an OS) | Seconds / sub-second (just start a process) |
| Density | Few VMs per host | Many containers per host |

Containers are lighter than VMs because they virtualize at the **OS level** rather
than the hardware level. Linux **namespaces** give each container its own isolated
view of processes, networking, and the filesystem, while **cgroups** enforce CPU and
memory limits. Because containers share the host kernel instead of bundling a full
guest OS, images are far smaller (MBs vs GBs) and start in seconds instead of minutes.
