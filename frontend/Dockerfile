# =============================================================================
# EventHub FRONTEND Dockerfile (Next.js)
# Multi-stage: deps -> builder -> runner. The final "runner" image ships ONLY
# the compiled standalone output, not the huge node_modules or source tree.
# =============================================================================

# ---------- STAGE 1: deps ----------
# Pinned Node tag (NOT :latest). alpine = tiny base image.
FROM node:20-alpine AS deps
WORKDIR /app

# COPY only the manifest files first so the (slow) npm install layer is cached
# and reused whenever source code changes but dependencies do not.
COPY package.json package-lock.json* ./
# Use npm install (works even without a committed lockfile for this demo).
RUN npm install

# ---------- STAGE 2: builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
# Reuse the installed node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules
# Now bring in the rest of the source.
COPY . .
# Produce the optimized production build (./.next, incl. standalone output).
RUN npm run build

# ---------- STAGE 3: runner ----------
# Clean, minimal final image — no dev dependencies, no source tree.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# The standalone build already bundles everything the server needs. We copy it
# FIRST so the image runs even if other optional folders are absent.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy the public/ folder for static assets (favicon, images). The trailing
# "./public" with a guaranteed-present source folder avoids the "not found"
# build error that happens when public/ does not exist.
COPY --from=builder /app/public ./public

EXPOSE 3000

# EXEC form so Node runs as PID 1 and handles shutdown signals cleanly.
CMD ["node", "server.js"]
