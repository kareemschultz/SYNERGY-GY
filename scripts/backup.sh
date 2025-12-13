#!/bin/bash
#
# GK-Nexus Backup Script
# Creates a complete backup of database, uploaded files, and configuration
#
# Usage: ./scripts/backup.sh [backup-name]
# Example: ./scripts/backup.sh pre-update
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
UPLOADS_DIR="${PROJECT_ROOT}/data/uploads"
MIGRATIONS_DIR="${PROJECT_ROOT}/packages/db/src/migrations"

# Docker settings (can be overridden by environment)
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-gk-nexus-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-synergy_gy}"

# Timestamp and backup name
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-gk-nexus-backup-${TIMESTAMP}}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Print helpers
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi

    # Check if PostgreSQL container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
        print_error "PostgreSQL container '${POSTGRES_CONTAINER}' is not running."
        print_info "Start it with: bun run db:start"
        exit 1
    fi

    # Check for required tools (tar is almost always available, sha256sum has fallback)
    for cmd in tar; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is required but not installed."
            exit 1
        fi
    done

    print_success "All prerequisites met"
}

# Create backup directory structure
setup_backup_dir() {
    print_info "Setting up backup directory..."

    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${BACKUP_PATH}"
    mkdir -p "${BACKUP_PATH}/uploads"

    print_success "Created backup directory: ${BACKUP_PATH}"
}

# Backup PostgreSQL database
backup_database() {
    print_info "Backing up PostgreSQL database..."

    local db_file="${BACKUP_PATH}/database.sql"

    # Run pg_dump inside container
    docker exec "${POSTGRES_CONTAINER}" pg_dump \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        > "${db_file}"

    if [ $? -eq 0 ] && [ -s "${db_file}" ]; then
        local db_size=$(du -h "${db_file}" | cut -f1)
        print_success "Database backup created (${db_size})"
    else
        print_error "Database backup failed or file is empty"
        exit 1
    fi
}

# Count database records
count_database_records() {
    print_info "Counting database records..."

    # Get table count and total record count
    local table_info=$(docker exec "${POSTGRES_CONTAINER}" psql \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -t -c "
        SELECT
            COUNT(*)::text || ',' || COALESCE(SUM(n_live_tup)::text, '0')
        FROM pg_stat_user_tables;
    " 2>/dev/null | tr -d ' ')

    TABLE_COUNT=$(echo "$table_info" | cut -d',' -f1)
    RECORD_COUNT=$(echo "$table_info" | cut -d',' -f2)

    print_info "Found ${TABLE_COUNT} tables with approximately ${RECORD_COUNT} records"
}

# Backup uploaded files
backup_uploads() {
    print_info "Backing up uploaded files..."

    if [ -d "${UPLOADS_DIR}" ] && [ "$(ls -A ${UPLOADS_DIR} 2>/dev/null)" ]; then
        cp -r "${UPLOADS_DIR}"/* "${BACKUP_PATH}/uploads/" 2>/dev/null || true
        UPLOADS_COUNT=$(find "${BACKUP_PATH}/uploads" -type f | wc -l)
        UPLOADS_SIZE=$(du -sh "${BACKUP_PATH}/uploads" | cut -f1)
        print_success "Backed up ${UPLOADS_COUNT} files (${UPLOADS_SIZE})"
    else
        UPLOADS_COUNT=0
        UPLOADS_SIZE="0"
        print_warning "No uploaded files found to backup"
    fi
}

# Get current schema version
get_schema_version() {
    if [ -d "${MIGRATIONS_DIR}" ]; then
        # Get the latest migration file name (excluding meta folder)
        SCHEMA_VERSION=$(ls -1 "${MIGRATIONS_DIR}"/*.sql 2>/dev/null | sort | tail -1 | xargs basename 2>/dev/null || echo "unknown")
    else
        SCHEMA_VERSION="unknown"
    fi

    print_info "Current schema version: ${SCHEMA_VERSION}"
}

# Get app version from git
get_app_version() {
    if [ -d "${PROJECT_ROOT}/.git" ]; then
        APP_VERSION=$(cd "${PROJECT_ROOT}" && git describe --tags --always 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        GIT_BRANCH=$(cd "${PROJECT_ROOT}" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    else
        APP_VERSION="unknown"
        GIT_BRANCH="unknown"
    fi

    print_info "App version: ${APP_VERSION} (branch: ${GIT_BRANCH})"
}

# Generate manifest file
generate_manifest() {
    print_info "Generating backup manifest..."

    local db_checksum=""
    if command -v sha256sum &> /dev/null; then
        db_checksum=$(sha256sum "${BACKUP_PATH}/database.sql" | cut -d' ' -f1)
    elif command -v shasum &> /dev/null; then
        db_checksum=$(shasum -a 256 "${BACKUP_PATH}/database.sql" | cut -d' ' -f1)
    fi
    local db_size=$(stat -c%s "${BACKUP_PATH}/database.sql" 2>/dev/null || stat -f%z "${BACKUP_PATH}/database.sql")

    cat > "${BACKUP_PATH}/manifest.json" << EOF
{
  "version": "1.0.0",
  "appVersion": "${APP_VERSION}",
  "gitBranch": "${GIT_BRANCH}",
  "schemaVersion": "${SCHEMA_VERSION}",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hostname": "$(hostname)",
  "backupName": "${BACKUP_NAME}",
  "database": {
    "name": "${POSTGRES_DB}",
    "tables": ${TABLE_COUNT:-0},
    "estimatedRecords": ${RECORD_COUNT:-0},
    "fileSize": ${db_size},
    "checksum": "${db_checksum}"
  },
  "uploads": {
    "count": ${UPLOADS_COUNT:-0},
    "directory": "uploads/"
  },
  "compatibility": {
    "minRestoreVersion": "1.0.0",
    "postgresVersion": "16"
  }
}
EOF

    print_success "Manifest generated"
}

# Create final tar.gz archive
create_archive() {
    print_info "Creating backup archive..."

    local archive_path="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

    cd "${BACKUP_DIR}"
    tar --exclude="*.DS_Store" -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"

    # Calculate archive size and checksum
    local archive_size=$(du -h "${archive_path}" | cut -f1)
    local archive_checksum=""
    if command -v sha256sum &> /dev/null; then
        archive_checksum=$(sha256sum "${archive_path}" | cut -d' ' -f1)
    elif command -v shasum &> /dev/null; then
        archive_checksum=$(shasum -a 256 "${archive_path}" | cut -d' ' -f1)
    fi

    # Clean up temporary directory
    rm -rf "${BACKUP_PATH}"

    print_success "Archive created: ${archive_path}"
    print_info "Size: ${archive_size}"
    if [ -n "${archive_checksum}" ]; then
        print_info "SHA256: ${archive_checksum}"
    fi

    echo "${archive_path}"
}

# Main execution
main() {
    echo ""
    echo "=============================================="
    echo "       GK-Nexus Backup Utility"
    echo "=============================================="
    echo ""

    check_prerequisites
    setup_backup_dir

    # Gather version info
    get_schema_version
    get_app_version

    # Backup data
    backup_database
    count_database_records
    backup_uploads

    # Create manifest and archive
    generate_manifest
    local archive=$(create_archive)

    echo ""
    echo "=============================================="
    print_success "Backup completed successfully!"
    echo ""
    echo "  Archive: ${archive}"
    echo "  Tables:  ${TABLE_COUNT:-0}"
    echo "  Records: ${RECORD_COUNT:-0}"
    echo "  Files:   ${UPLOADS_COUNT:-0}"
    echo ""
    echo "To restore this backup, run:"
    echo "  ./scripts/restore.sh ${archive}"
    echo "=============================================="
    echo ""
}

# Run main function
main
