#!/bin/bash
#
# GK-Nexus Restore Script
# Restores a complete backup of database and uploaded files
#
# Usage: ./scripts/restore.sh <backup-file.zip> [--skip-migrations] [--force]
# Example: ./scripts/restore.sh ./backups/gk-nexus-backup-20241212_143000.zip
#
# Options:
#   --skip-migrations   Skip running database migrations after restore
#   --force             Skip confirmation prompts
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
UPLOADS_DIR="${PROJECT_ROOT}/data/uploads"
TEMP_DIR="${BACKUP_DIR}/.restore-temp"

# Docker settings (can be overridden by environment)
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-gk-nexus-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-synergy_gy}"

# Command line options
SKIP_MIGRATIONS=false
FORCE=false
BACKUP_FILE=""

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

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-migrations)
                SKIP_MIGRATIONS=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$BACKUP_FILE" ]; then
                    BACKUP_FILE="$1"
                else
                    print_error "Unknown argument: $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done

    if [ -z "$BACKUP_FILE" ]; then
        print_error "Backup file is required"
        echo ""
        show_help
        exit 1
    fi
}

show_help() {
    echo "GK-Nexus Restore Utility"
    echo ""
    echo "Usage: ./scripts/restore.sh <backup-file.tar.gz> [options]"
    echo ""
    echo "Options:"
    echo "  --skip-migrations   Skip running database migrations after restore"
    echo "  --force             Skip confirmation prompts"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/restore.sh ./backups/gk-nexus-backup-20241212.tar.gz"
    echo "  ./scripts/restore.sh ./backups/gk-nexus-backup-20241212.tar.gz --skip-migrations"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check if backup file exists
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

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

    # Check for required tools (tar is almost always available)
    for cmd in tar; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is required but not installed."
            exit 1
        fi
    done

    print_success "All prerequisites met"
}

# Extract and validate backup
extract_backup() {
    print_step "Extracting backup archive..."

    # Clean up any previous temp directory
    rm -rf "${TEMP_DIR}"
    mkdir -p "${TEMP_DIR}"

    # Extract archive (supports both .tar.gz and .zip)
    if [[ "$BACKUP_FILE" == *.tar.gz ]] || [[ "$BACKUP_FILE" == *.tgz ]]; then
        tar -xzf "$BACKUP_FILE" -C "${TEMP_DIR}"
    elif [[ "$BACKUP_FILE" == *.zip ]]; then
        if command -v unzip &> /dev/null; then
            unzip -q "$BACKUP_FILE" -d "${TEMP_DIR}"
        else
            print_error "unzip is required for .zip files but not installed."
            exit 1
        fi
    else
        print_error "Unsupported archive format. Use .tar.gz or .zip"
        exit 1
    fi

    # Find the extracted folder (should be only one)
    EXTRACTED_DIR=$(find "${TEMP_DIR}" -mindepth 1 -maxdepth 1 -type d | head -1)

    if [ -z "$EXTRACTED_DIR" ]; then
        print_error "Invalid backup archive structure"
        cleanup
        exit 1
    fi

    print_success "Archive extracted"
}

# Validate backup manifest
validate_manifest() {
    print_step "Validating backup manifest..."

    local manifest_file="${EXTRACTED_DIR}/manifest.json"

    if [ ! -f "$manifest_file" ]; then
        print_error "Manifest file not found in backup"
        cleanup
        exit 1
    fi

    # Parse manifest (basic validation)
    if ! python3 -c "import json; json.load(open('$manifest_file'))" 2>/dev/null; then
        if ! node -e "JSON.parse(require('fs').readFileSync('$manifest_file'))" 2>/dev/null; then
            print_error "Invalid manifest JSON"
            cleanup
            exit 1
        fi
    fi

    # Extract manifest info for display
    BACKUP_APP_VERSION=$(grep -o '"appVersion"[[:space:]]*:[[:space:]]*"[^"]*"' "$manifest_file" | cut -d'"' -f4)
    BACKUP_SCHEMA_VERSION=$(grep -o '"schemaVersion"[[:space:]]*:[[:space:]]*"[^"]*"' "$manifest_file" | cut -d'"' -f4)
    BACKUP_CREATED_AT=$(grep -o '"createdAt"[[:space:]]*:[[:space:]]*"[^"]*"' "$manifest_file" | cut -d'"' -f4)
    BACKUP_DB_TABLES=$(grep -o '"tables"[[:space:]]*:[[:space:]]*[0-9]*' "$manifest_file" | grep -o '[0-9]*')
    BACKUP_DB_RECORDS=$(grep -o '"estimatedRecords"[[:space:]]*:[[:space:]]*[0-9]*' "$manifest_file" | grep -o '[0-9]*')

    echo ""
    echo "  Backup Information:"
    echo "  -------------------"
    echo "  Created:        ${BACKUP_CREATED_AT}"
    echo "  App Version:    ${BACKUP_APP_VERSION}"
    echo "  Schema Version: ${BACKUP_SCHEMA_VERSION}"
    echo "  Tables:         ${BACKUP_DB_TABLES}"
    echo "  Records:        ${BACKUP_DB_RECORDS}"
    echo ""

    print_success "Manifest validated"
}

# Validate database file
validate_database() {
    print_step "Validating database backup..."

    local db_file="${EXTRACTED_DIR}/database.sql"

    if [ ! -f "$db_file" ]; then
        print_error "Database file not found in backup"
        cleanup
        exit 1
    fi

    if [ ! -s "$db_file" ]; then
        print_error "Database file is empty"
        cleanup
        exit 1
    fi

    # Verify checksum if available
    local expected_checksum=$(grep -o '"checksum"[[:space:]]*:[[:space:]]*"[^"]*"' "${EXTRACTED_DIR}/manifest.json" | cut -d'"' -f4)
    if [ -n "$expected_checksum" ]; then
        local actual_checksum=$(sha256sum "$db_file" | cut -d' ' -f1)
        if [ "$expected_checksum" != "$actual_checksum" ]; then
            print_warning "Database checksum mismatch!"
            print_info "Expected: $expected_checksum"
            print_info "Actual:   $actual_checksum"
            if [ "$FORCE" != "true" ]; then
                read -p "Continue anyway? (y/N): " confirm
                if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                    cleanup
                    exit 1
                fi
            fi
        else
            print_success "Database checksum verified"
        fi
    fi

    print_success "Database file validated"
}

# Confirm restore with user
confirm_restore() {
    if [ "$FORCE" = "true" ]; then
        return 0
    fi

    echo ""
    print_warning "This will REPLACE ALL current data with the backup!"
    echo ""
    echo "  Current database: ${POSTGRES_DB}"
    echo "  Backup file:      $(basename $BACKUP_FILE)"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_info "Restore cancelled by user"
        cleanup
        exit 0
    fi
}

# Create pre-restore backup
create_safety_backup() {
    print_step "Creating safety backup of current data..."

    local safety_backup="${BACKUP_DIR}/pre-restore-$(date +%Y%m%d_%H%M%S).sql"

    docker exec "${POSTGRES_CONTAINER}" pg_dump \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --clean \
        --if-exists \
        > "${safety_backup}" 2>/dev/null || true

    if [ -s "$safety_backup" ]; then
        print_success "Safety backup created: ${safety_backup}"
    else
        print_warning "Could not create safety backup (database may be empty)"
        rm -f "$safety_backup"
    fi
}

# Restore database
restore_database() {
    print_step "Restoring database..."

    local db_file="${EXTRACTED_DIR}/database.sql"

    # Drop and recreate database
    print_info "Recreating database..."
    docker exec "${POSTGRES_CONTAINER}" psql \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
        > /dev/null 2>&1 || true

    docker exec "${POSTGRES_CONTAINER}" psql \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "DROP DATABASE IF EXISTS \"${POSTGRES_DB}\";" \
        > /dev/null 2>&1

    docker exec "${POSTGRES_CONTAINER}" psql \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "CREATE DATABASE \"${POSTGRES_DB}\";" \
        > /dev/null 2>&1

    # Restore from backup
    print_info "Importing backup data..."
    cat "$db_file" | docker exec -i "${POSTGRES_CONTAINER}" psql \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        print_success "Database restored"
    else
        print_error "Database restore failed"
        cleanup
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    if [ "$SKIP_MIGRATIONS" = "true" ]; then
        print_warning "Skipping migrations as requested"
        return 0
    fi

    print_step "Running database migrations..."

    cd "${PROJECT_ROOT}"

    # Check if bun is available
    if command -v bun &> /dev/null; then
        if bun run db:migrate 2>&1; then
            print_success "Migrations completed"
        else
            print_warning "Migration command returned non-zero (may be normal if no new migrations)"
        fi
    else
        print_warning "Bun not found, skipping migrations"
        print_info "Run migrations manually: bun run db:migrate"
    fi
}

# Restore uploaded files
restore_uploads() {
    print_step "Restoring uploaded files..."

    local uploads_backup="${EXTRACTED_DIR}/uploads"

    if [ -d "$uploads_backup" ] && [ "$(ls -A $uploads_backup 2>/dev/null)" ]; then
        # Create uploads directory if it doesn't exist
        mkdir -p "${UPLOADS_DIR}"

        # Backup current uploads if they exist
        if [ "$(ls -A ${UPLOADS_DIR} 2>/dev/null)" ]; then
            local uploads_backup_dir="${BACKUP_DIR}/uploads-pre-restore-$(date +%Y%m%d_%H%M%S)"
            mv "${UPLOADS_DIR}" "${uploads_backup_dir}"
            mkdir -p "${UPLOADS_DIR}"
            print_info "Existing uploads moved to: ${uploads_backup_dir}"
        fi

        # Copy backup uploads
        cp -r "${uploads_backup}"/* "${UPLOADS_DIR}/" 2>/dev/null || true
        local count=$(find "${UPLOADS_DIR}" -type f | wc -l)
        print_success "Restored ${count} uploaded files"
    else
        print_info "No uploaded files in backup"
    fi
}

# Cleanup temporary files
cleanup() {
    if [ -d "${TEMP_DIR}" ]; then
        rm -rf "${TEMP_DIR}"
    fi
}

# Main execution
main() {
    echo ""
    echo "=============================================="
    echo "       GK-Nexus Restore Utility"
    echo "=============================================="
    echo ""

    parse_args "$@"
    check_prerequisites
    extract_backup
    validate_manifest
    validate_database
    confirm_restore
    create_safety_backup
    restore_database
    run_migrations
    restore_uploads
    cleanup

    echo ""
    echo "=============================================="
    print_success "Restore completed successfully!"
    echo ""
    echo "  Database:   ${POSTGRES_DB}"
    echo "  From:       $(basename $BACKUP_FILE)"
    echo ""
    if [ "$SKIP_MIGRATIONS" != "true" ]; then
        echo "  Migrations have been applied."
    else
        echo "  Note: Migrations were skipped."
        echo "  Run 'bun run db:migrate' to apply any pending migrations."
    fi
    echo ""
    echo "  You may need to restart the application:"
    echo "    docker-compose restart app"
    echo "    (or) bun run dev"
    echo "=============================================="
    echo ""
}

# Run main function with all arguments
main "$@"
