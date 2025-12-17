# syntax=docker/dockerfile:1.7

# ==========================================
# Stage 1: Prune (create minimal build context)
# ==========================================
FROM oven/bun:1.2 AS pruner
WORKDIR /app

# Copy repo and prune to server scope only
COPY . .
RUN bunx turbo prune --scope=server --docker

# ==========================================
# Stage 2: Builder (install deps + build)
# ==========================================
FROM oven/bun:1.2 AS builder
WORKDIR /app

# Copy pruned lockfile and package.json files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock

# Install dependencies with BuildKit cache
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build all apps with Turbo cache
ARG VITE_SERVER_URL=http://localhost:3000
ENV VITE_SERVER_URL=$VITE_SERVER_URL

RUN --mount=type=cache,target=/root/.cache/turbo \
    bunx turbo build --filter=web...

# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM oven/bun:1.2-slim AS runner
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r gknexus && useradd -r -g gknexus -u 1001 gknexus

# Copy root workspace configuration
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bunfig.toml ./bunfig.toml
COPY --from=builder /app/bun.lock ./bun.lock

# Copy all workspace package.json files first (needed for bun install)
COPY --from=builder /app/packages/api/package.json ./packages/api/package.json
COPY --from=builder /app/packages/auth/package.json ./packages/auth/package.json
COPY --from=builder /app/packages/config/package.json ./packages/config/package.json
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

# Install dependencies with HOISTED linker (Bun v1.2.19+ defaults to isolated)
# Hoisted mode hoists transitive deps to root node_modules (like npm/yarn)
RUN bun install --frozen-lockfile --ignore-scripts --linker hoisted

# Copy workspace packages source only (exclude node_modules to avoid symlink conflicts)
COPY --from=builder /app/packages/api/src ./packages/api/src
COPY --from=builder /app/packages/api/tsconfig.json ./packages/api/tsconfig.json
COPY --from=builder /app/packages/auth/src ./packages/auth/src
COPY --from=builder /app/packages/auth/tsconfig.json ./packages/auth/tsconfig.json
COPY --from=builder /app/packages/config/tsconfig.base.json ./packages/config/tsconfig.base.json
COPY --from=builder /app/packages/db/src ./packages/db/src
COPY --from=builder /app/packages/db/tsconfig.json ./packages/db/tsconfig.json
COPY --from=builder /app/packages/db/drizzle.config.ts ./packages/db/drizzle.config.ts

# Copy server app source only (package.json already copied earlier)
COPY --from=builder /app/apps/server/src ./apps/server/src
COPY --from=builder /app/apps/server/tsconfig.json ./apps/server/tsconfig.json

# Copy web build artifacts (served by Hono)
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Create writable directories
RUN mkdir -p /app/data/uploads /app/backups /tmp && \
    chown -R gknexus:gknexus /app

# Switch to non-root user
USER gknexus

# Environment
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Health check (runs as gknexus user)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start server (runs TypeScript directly - Bun handles transpilation)
CMD ["bun", "run", "/app/apps/server/src/index.ts"]
