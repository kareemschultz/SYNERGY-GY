# syntax=docker/dockerfile:1.7
# =============================================================================
# GK-Nexus Production Docker Image (Bundled)
# =============================================================================
# Production-optimized Docker image using Bun bundler for minimal size
#
# Architecture:
#   - Stage 1 (Pruner): Creates minimal build context using Turbo prune
#   - Stage 2 (Builder): Installs deps, builds web app, bundles server code
#   - Stage 3 (Runner): Copies bundle + node_modules + web assets
#
# Note: @orpc/*, hono, better-auth, drizzle-orm marked as external during bundling
# because they break when minified. These are loaded from node_modules at runtime.
#
# Security (LinuxServer.io best practices):
#   - Non-root user (gknexus:1001)
#   - Read-only filesystem with tmpfs mounts
#   - Dropped all capabilities
#   - no-new-privileges security opt
#   - Minimal Alpine base
#   - Health checks included
#
# Build: docker build -t gk-nexus:latest .
# Run:   docker compose up -d
# Docs:  See docs/DOCKER_DEPLOYMENT.md
# =============================================================================

# Build arguments
ARG BUN_VERSION=1.2
ARG VITE_SERVER_URL=http://localhost:3000

# =============================================================================
# Stage 1: Prune (create minimal build context)
# =============================================================================
FROM oven/bun:${BUN_VERSION} AS pruner
WORKDIR /app

# Copy entire monorepo and prune to server scope only
# This creates a minimal subset of files needed to build the server
COPY . .
RUN bunx turbo prune --scope=server --docker

# =============================================================================
# Stage 2: Builder (install deps + build + bundle)
# =============================================================================
FROM oven/bun:${BUN_VERSION} AS builder
WORKDIR /app

# Copy pruned lockfile and package.json files first (better caching)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock

# Install ALL dependencies with BuildKit cache mount
# Uses --linker hoisted for Docker compatibility (Bun v1.2.19+ workspace fix)
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile --linker hoisted

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build web app with Turbo cache mount
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

RUN --mount=type=cache,target=/root/.cache/turbo \
    bunx turbo build --filter=web...

# Bundle server with problematic packages marked as external
# The @orpc/* and hono packages break when bundled/minified due to dynamic code patterns
# These are kept in node_modules and loaded at runtime
RUN mkdir -p dist && \
    bun build apps/server/src/index.ts \
    --target=bun \
    --outdir=dist \
    --entry-naming=server.bundled.js \
    --minify \
    --sourcemap=external \
    --external hono \
    --external '@hono/*' \
    --external '@orpc/*' \
    --external better-auth \
    --external drizzle-orm \
    --external postgres

# =============================================================================
# Stage 3: Slim Production Runner (Bundled)
# =============================================================================
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# OCI Labels (LinuxServer.io standard metadata)
LABEL org.opencontainers.image.title="GK-Nexus" \
      org.opencontainers.image.description="Business management platform for GCMC and KAJ" \
      org.opencontainers.image.vendor="Green Crescent Management Consultancy" \
      org.opencontainers.image.source="https://github.com/kareemschultz/SYNERGY-GY" \
      org.opencontainers.image.documentation="https://github.com/kareemschultz/SYNERGY-GY/blob/main/docs/DOCKER_DEPLOYMENT.md" \
      org.opencontainers.image.licenses="UNLICENSED" \
      maintainer="Kareem Schultz"

# Install curl for health checks and ca-certificates for SSL
RUN apk add --no-cache curl ca-certificates tzdata

# Create non-root user (gknexus:1001)
# LinuxServer.io style: Could support PUID/PGID but not needed for single-user app
RUN addgroup -g 1001 gknexus && \
    adduser -D -u 1001 -G gknexus gknexus

# Copy bundled server (workspace code bundled, external packages loaded from node_modules)
COPY --from=builder --chown=gknexus:gknexus /app/dist/server.bundled.js ./server.bundled.js
COPY --from=builder --chown=gknexus:gknexus /app/dist/server.bundled.js.map ./server.bundled.js.map

# Copy node_modules for external packages (hono, @orpc/*, better-auth, drizzle-orm, postgres)
# These packages break when bundled due to dynamic code patterns
COPY --from=builder --chown=gknexus:gknexus /app/node_modules ./node_modules

# Copy web build artifacts (for API to serve if needed)
COPY --from=builder --chown=gknexus:gknexus /app/apps/web/dist ./apps/web/dist

# Create writable directories for uploads and backups
# These should be mounted as volumes in production
RUN mkdir -p /app/data/uploads /app/backups && \
    chown -R gknexus:gknexus /app/data /app/backups

# Switch to non-root user (security best practice)
USER gknexus

# Environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose application port
EXPOSE 3000

# Health check (LinuxServer.io standard)
# Runs as non-root user, quick response expected
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start bundled server
# Note: Database migrations should be run separately (see docs/DOCKER_DEPLOYMENT.md)
CMD ["bun", "run", "/app/server.bundled.js"]
