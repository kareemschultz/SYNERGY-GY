#!/bin/bash
# =============================================================================
# sync-database-url.sh - Synchronizes DATABASE_URL with POSTGRES_PASSWORD
# =============================================================================
# This script ensures the password in DATABASE_URL matches POSTGRES_PASSWORD.
# Run this after changing POSTGRES_PASSWORD to update DATABASE_URL automatically.
#
# Usage:
#   ./scripts/sync-database-url.sh
#   ./scripts/sync-database-url.sh /path/to/.env  # specify custom env file
#
# =============================================================================

set -e

ENV_FILE="${1:-.env}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== DATABASE_URL Sync Utility ===${NC}"
echo ""

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found${NC}"
    echo "Usage: $0 [path/to/.env]"
    exit 1
fi

# Extract current values (strip quotes if present)
strip_quotes() {
    echo "$1" | sed 's/^["'\'']//' | sed 's/["'\'']$//'
}

PG_USER_RAW=$(grep "^POSTGRES_USER=" "$ENV_FILE" | cut -d'=' -f2-)
PG_PASS_RAW=$(grep "^POSTGRES_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2-)
PG_HOST_RAW=$(grep "^POSTGRES_HOST=" "$ENV_FILE" | cut -d'=' -f2-)
PG_PORT_RAW=$(grep "^POSTGRES_PORT=" "$ENV_FILE" | cut -d'=' -f2-)
PG_DB_RAW=$(grep "^POSTGRES_DB=" "$ENV_FILE" | cut -d'=' -f2-)
CURRENT_URL_RAW=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2-)

# Strip quotes
PG_USER=$(strip_quotes "$PG_USER_RAW")
PG_PASS=$(strip_quotes "$PG_PASS_RAW")
PG_HOST=$(strip_quotes "$PG_HOST_RAW")
PG_PORT=$(strip_quotes "$PG_PORT_RAW")
PG_DB=$(strip_quotes "$PG_DB_RAW")
CURRENT_URL=$(strip_quotes "$CURRENT_URL_RAW")

# Set defaults
PG_USER=${PG_USER:-gknexus}
PG_HOST=${PG_HOST:-postgres}
PG_PORT=${PG_PORT:-5432}
PG_DB=${PG_DB:-gknexus}

if [ -z "$PG_PASS" ]; then
    echo -e "${RED}Error: POSTGRES_PASSWORD not found in $ENV_FILE${NC}"
    echo "Please set POSTGRES_PASSWORD before running this script."
    exit 1
fi

# Extract password from current DATABASE_URL
CURRENT_DB_PASS=$(echo "$CURRENT_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

# Check if passwords match
if [ "$PG_PASS" = "$CURRENT_DB_PASS" ]; then
    echo -e "${GREEN}Passwords already match! No changes needed.${NC}"
    echo ""
    echo "Current configuration:"
    echo "  POSTGRES_PASSWORD: ****${PG_PASS: -4}"
    echo "  DATABASE_URL password: ****${CURRENT_DB_PASS: -4}"
    exit 0
fi

echo -e "${YELLOW}Password mismatch detected!${NC}"
echo ""
echo "  POSTGRES_PASSWORD: ****${PG_PASS: -4}"
echo "  DATABASE_URL password: ****${CURRENT_DB_PASS: -4}"
echo ""

# Build new DATABASE_URL
NEW_URL="postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${PG_DB}"

# Create backup
BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Update DATABASE_URL in .env (handle both quoted and unquoted formats)
if grep -q '^DATABASE_URL="' "$ENV_FILE"; then
    # Quoted format
    sed -i "s|^DATABASE_URL=\".*\"|DATABASE_URL=\"${NEW_URL}\"|" "$ENV_FILE"
else
    # Unquoted format
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${NEW_URL}|" "$ENV_FILE"
fi

echo ""
echo -e "${GREEN}SUCCESS: DATABASE_URL updated!${NC}"
echo ""
echo "New DATABASE_URL: postgresql://${PG_USER}:****@${PG_HOST}:${PG_PORT}/${PG_DB}"
echo ""
echo -e "${YELLOW}IMPORTANT: If containers are running, restart them:${NC}"
echo "  docker compose down && docker compose up -d"
