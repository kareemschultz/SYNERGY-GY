# syntax=docker/dockerfile:1.7
# =============================================================================
# GK-Nexus Production Docker Image (Unbundled)
# =============================================================================
# Production Docker image running server directly from TypeScript
#
# Architecture:
#   - Stage 1 (Pruner): Creates minimal build context using Turbo prune
#   - Stage 2 (Builder): Installs deps, builds web app
#   - Stage 3 (Runner): Copies source + node_modules, runs TypeScript directly
#
# Note: Bundling disabled due to @orpc package compatibility issues.
# Image is larger (~700MB) but works reliably.
#
# Security (LinuxServer.io best practices):
#   - Non-root user (gknexus:1001)
#   - Health checks included
#
# Build: docker build -t gk-nexus:latest .
# Run:   docker compose up -d
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
COPY . .
RUN bunx turbo prune --scope=server --docker

# =============================================================================
# Stage 2: Builder (install deps + build web app)
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

# =============================================================================
# Stage 3: Production Runner (Unbundled - runs TypeScript directly)
# =============================================================================
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

# OCI Labels
LABEL org.opencontainers.image.title="GK-Nexus" \
      org.opencontainers.image.description="Business management platform for GCMC and KAJ" \
      org.opencontainers.image.vendor="Green Crescent Management Consultancy" \
      org.opencontainers.image.source="https://github.com/kareemschultz/SYNERGY-GY" \
      maintainer="Kareem Schultz"

# Install curl for health checks
RUN apk add --no-cache curl ca-certificates tzdata

# Create non-root user (gknexus:1001)
RUN addgroup -g 1001 gknexus && \
    adduser -D -u 1001 -G gknexus gknexus

# Copy node_modules from builder (required for unbundled approach)
COPY --from=builder --chown=gknexus:gknexus /app/node_modules ./node_modules

# Copy all package.json files for workspace resolution
COPY --from=builder --chown=gknexus:gknexus /app/package.json ./package.json
COPY --from=builder --chown=gknexus:gknexus /app/turbo.json ./turbo.json

# Copy server source code
COPY --from=builder --chown=gknexus:gknexus /app/apps/server ./apps/server

# Copy workspace packages source code
COPY --from=builder --chown=gknexus:gknexus /app/packages ./packages

# Copy web build artifacts
COPY --from=builder --chown=gknexus:gknexus /app/apps/web/dist ./apps/web/dist
COPY --from=builder --chown=gknexus:gknexus /app/apps/web/package.json ./apps/web/package.json

# Create writable directories
RUN mkdir -p /app/data/uploads /app/backups && \
    chown -R gknexus:gknexus /app/data /app/backups

# Switch to non-root user
USER gknexus

# Environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start server directly from TypeScript (unbundled)
CMD ["bun", "run", "/app/apps/server/src/index.ts"]
