#!/bin/bash
# =============================================================================
# GK-Nexus Production Deployment Script
# =============================================================================
# This script deploys GK-Nexus to production on a VPS with zero-downtime
#
# Prerequisites:
# - Docker and Docker Compose installed
# - .env file configured with production values
# - Reverse proxy (Nginx/Caddy) configured for SSL
# - Database migrations run separately (see README)
#
# Usage:
#   ./deploy-production.sh
#
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GHCR_REGISTRY="ghcr.io"
IMAGE_NAME="kareemschultz/gk-nexus"
BACKUP_DIR="./backups"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Confirmation
confirm() {
    read -p "$(echo -e ${YELLOW}$1${NC}) [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deployment cancelled by user"
    fi
}

# =============================================================================
# Pre-deployment Checks
# =============================================================================

log "Starting GK-Nexus production deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    error ".env file not found! Copy .env.example to .env and configure it first."
fi

# Check required environment variables
log "Checking required environment variables..."
source .env

REQUIRED_VARS=(
    "DATABASE_URL"
    "BETTER_AUTH_SECRET"
    "BETTER_AUTH_URL"
    "CORS_ORIGIN"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        error "Required environment variable $var is not set in .env"
    fi
    log "✓ $var is set"
done

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running or not accessible"
fi
log "✓ Docker is running"

# Check Docker Compose is available
if ! docker compose version > /dev/null 2>&1; then
    error "Docker Compose is not installed or not accessible"
fi
log "✓ Docker Compose is available"

# =============================================================================
# Database Backup
# =============================================================================

log "Creating pre-deployment database backup..."

mkdir -p "$BACKUP_DIR"

# Check if postgres container is running
if docker compose ps postgres | grep -q "Up"; then
    BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%Y%m%d-%H%M%S).sql.gz"

    docker compose exec -T postgres \
        pg_dump -U "${POSTGRES_USER:-gknexus}" -d "${POSTGRES_DB:-gknexus}" \
        2>/dev/null | gzip > "$BACKUP_FILE"

    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "✓ Database backup created: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        warn "Could not create database backup (container might not be running yet)"
    fi
else
    warn "Postgres container not running - skipping backup (first deployment?)"
fi

# =============================================================================
# Pull Latest Image
# =============================================================================

log "Pulling latest Docker image from GHCR..."

confirm "Pull ghcr.io/kareemschultz/gk-nexus:latest?"

if ! docker pull "$GHCR_REGISTRY/$IMAGE_NAME:latest" 2>&1 | tee -a "$LOG_FILE"; then
    error "Failed to pull Docker image. Check your GHCR authentication."
fi

log "✓ Docker image pulled successfully"

# Show image details
IMAGE_SIZE=$(docker images "$GHCR_REGISTRY/$IMAGE_NAME:latest" --format "{{.Size}}")
IMAGE_ID=$(docker images "$GHCR_REGISTRY/$IMAGE_NAME:latest" --format "{{.ID}}")
log "Image ID: $IMAGE_ID"
log "Image Size: $IMAGE_SIZE"

# =============================================================================
# Run Database Migrations (CRITICAL)
# =============================================================================

log "Checking for pending database migrations..."

confirm "Run database migrations? (CRITICAL - Do NOT skip this!)"

info "Running migrations..."
info "This may take a few seconds..."

# Export DATABASE_URL for migration script
export DATABASE_URL

# Run migrations using local Bun installation
if command -v bun &> /dev/null; then
    if bun run db:push 2>&1 | tee -a "$LOG_FILE"; then
        log "✓ Database migrations completed successfully"
    else
        error "Database migration failed! Check the logs above."
    fi
else
    error "Bun is not installed. Install Bun or run migrations manually: DATABASE_URL='$DATABASE_URL' bun run db:push"
fi

# =============================================================================
# Deploy New Version
# =============================================================================

log "Deploying new version..."

confirm "Stop current containers and start new version?"

# Stop current containers (brief downtime)
info "Stopping current containers..."
docker compose down 2>&1 | tee -a "$LOG_FILE"
log "✓ Containers stopped"

# Start new version
info "Starting new containers..."
if docker compose up -d 2>&1 | tee -a "$LOG_FILE"; then
    log "✓ Containers started"
else
    error "Failed to start containers. Check Docker Compose logs."
fi

# =============================================================================
# Health Checks
# =============================================================================

log "Waiting for application to become healthy..."

MAX_ATTEMPTS=60
ATTEMPT=0
HEALTH_URL="http://localhost:3000/health"

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        log "✓ Health check passed!"
        break
    fi

    ATTEMPT=$((ATTEMPT + 1))
    info "Waiting for application startup... ($ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    error "Health check failed after ${MAX_ATTEMPTS} attempts. Check logs with: docker compose logs app"
fi

# Test health endpoint response
HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")
log "Health endpoint response: $HEALTH_RESPONSE"

# =============================================================================
# Verification
# =============================================================================

log "Running post-deployment verification..."

# Check container status
info "Container status:"
docker compose ps | tee -a "$LOG_FILE"

# Check if containers are healthy
if docker compose ps | grep -q "unhealthy"; then
    error "Some containers are unhealthy. Check logs with: docker compose logs"
fi

log "✓ All containers are healthy"

# Check logs for errors
info "Checking recent logs for errors..."
if docker compose logs --tail=50 app | grep -i "error" | grep -v "0 errors"; then
    warn "Found error messages in logs. Review with: docker compose logs app"
else
    log "✓ No critical errors in logs"
fi

# =============================================================================
# Deployment Summary
# =============================================================================

log ""
log "================================================================="
log "           🚀 DEPLOYMENT COMPLETED SUCCESSFULLY! 🚀"
log "================================================================="
log ""
log "Deployment Details:"
log "  - Image: $GHCR_REGISTRY/$IMAGE_NAME:latest"
log "  - Image ID: $IMAGE_ID"
log "  - Image Size: $IMAGE_SIZE"
log "  - Backup: $BACKUP_FILE"
log "  - Log File: $LOG_FILE"
log ""
log "Next Steps:"
log "  1. Test the application in your browser"
log "  2. Monitor logs: docker compose logs -f app"
log "  3. Check health: curl http://localhost:3000/health"
log "  4. Verify your reverse proxy is serving HTTPS correctly"
log ""
log "Rollback (if needed):"
log "  docker compose down"
log "  gunzip -c $BACKUP_FILE | docker compose exec -T postgres psql -U gknexus -d gknexus"
log "  docker compose up -d"
log ""
log "================================================================="
