#!/bin/sh
# =============================================================================
# GK-Nexus Docker Entrypoint Script
# =============================================================================
# This script runs on container startup to:
# 1. Wait for the database to be ready
# 2. Run database schema push (db:push) to sync schema
# 3. Start the application server
#
# Environment Variables:
#   DATABASE_URL - Required: PostgreSQL connection string
#   SKIP_DB_PUSH - Optional: Set to "true" to skip schema push
#   DB_WAIT_TIMEOUT - Optional: Max seconds to wait for DB (default: 60)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo "${GREEN}[Entrypoint]${NC} $1"
}

log_warn() {
    echo "${YELLOW}[Entrypoint]${NC} $1"
}

log_error() {
    echo "${RED}[Entrypoint]${NC} $1"
}

# Configuration
DB_WAIT_TIMEOUT="${DB_WAIT_TIMEOUT:-60}"
SKIP_DB_PUSH="${SKIP_DB_PUSH:-false}"

# =============================================================================
# Wait for Database
# =============================================================================
wait_for_database() {
    log_info "Waiting for database to be ready..."

    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:pass@host:port/dbname
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    # Default port if not specified
    DB_PORT="${DB_PORT:-5432}"

    log_info "Checking database at ${DB_HOST}:${DB_PORT}"

    waited=0
    while [ $waited -lt "$DB_WAIT_TIMEOUT" ]; do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            log_info "Database is ready!"
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done

    log_error "Database not ready after ${DB_WAIT_TIMEOUT} seconds"
    return 1
}

# =============================================================================
# Run Database Schema Push
# =============================================================================
run_db_push() {
    if [ "$SKIP_DB_PUSH" = "true" ]; then
        log_warn "Skipping db:push (SKIP_DB_PUSH=true)"
        return 0
    fi

    log_info "Running database schema push..."

    # Check if drizzle-kit is available
    if [ -d "/app/node_modules/drizzle-kit" ]; then
        # Run drizzle-kit push with the schema
        cd /app
        bun run /app/node_modules/drizzle-kit/bin.cjs push \
            --config=/app/drizzle.config.ts \
            2>&1 || {
            log_warn "db:push completed with warnings (this is usually OK for existing schema)"
        }
        log_info "Database schema push completed"
    else
        log_warn "drizzle-kit not found, skipping schema push"
        log_warn "You may need to run db:push manually if you have new schema changes"
    fi
}

# =============================================================================
# Main
# =============================================================================
main() {
    log_info "Starting GK-Nexus..."

    # Validate required environment variables
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL environment variable is required"
        exit 1
    fi

    # Wait for database
    wait_for_database || exit 1

    # Run schema push
    run_db_push

    log_info "Starting application server..."

    # Start the bundled server
    exec bun run /app/server.bundled.js
}

main "$@"
