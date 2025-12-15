# syntax=docker/dockerfile:1.7
# =============================================================================
# GK-Nexus Production Docker Image (Bundled with External Dependencies)
# =============================================================================
# Production-optimized Docker image using Bun bundler
#
# Architecture:
#   - Stage 1 (Pruner): Creates minimal build context using Turbo prune
#   - Stage 2 (Builder): Installs deps, builds web app, bundles server
#   - Stage 3 (Runner): Copies bundle + required node_modules
#
# Note: @orpc/* and hono packages marked as external due to bundling issues
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
# Stage 2: Builder (install deps + build + bundle)
# =============================================================================
FROM oven/bun:${BUN_VERSION} AS builder
WORKDIR /app

# Copy pruned lockfile and package.json files first (better caching)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock

# Install ALL dependencies with BuildKit cache mount
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
# This bundles our code but loads @orpc/*, hono, etc from node_modules
RUN mkdir -p dist && \
    bun build apps/server/src/index.ts \
    --target=bun \
    --outdir=dist \
    --entry-naming=server.bundled.js \
    --minify \
    --sourcemap=external \
    --external '@orpc/*' \
    --external 'hono' \
    --external 'hono/*' \
    --external '@hono/*' \
    --external 'better-auth' \
    --external 'better-auth/*' \
    --external 'drizzle-orm' \
    --external 'drizzle-orm/*' \
    --external 'postgres' \
    --external 'zod'

# =============================================================================
# Stage 3: Slim Production Runner
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

# Copy bundled server
COPY --from=builder --chown=gknexus:gknexus /app/dist/server.bundled.js ./server.bundled.js
COPY --from=builder --chown=gknexus:gknexus /app/dist/server.bundled.js.map ./server.bundled.js.map

# Copy node_modules for external packages (only the ones we need)
COPY --from=builder --chown=gknexus:gknexus /app/node_modules ./node_modules

# Copy package.json for module resolution
COPY --from=builder --chown=gknexus:gknexus /app/package.json ./package.json

# Copy web build artifacts
COPY --from=builder --chown=gknexus:gknexus /app/apps/web/dist ./apps/web/dist

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

# Start bundled server
CMD ["bun", "run", "/app/server.bundled.js"]
