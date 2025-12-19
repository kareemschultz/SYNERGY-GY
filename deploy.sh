#!/bin/bash

#######################################
# GK-Nexus Unified Deployment Script
#
# One script to deploy everything.
# Usage: curl -fsSL https://raw.githubusercontent.com/kareemschultz/SYNERGY-GY/master/deploy.sh | bash
# Or: ./deploy.sh
#
# Inspired by Pangolin and Netbird deployment experience.
#######################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Script version
SCRIPT_VERSION="1.0.0"

# Default values
DEFAULT_DOMAIN="localhost"
DEFAULT_HTTP_PORT="80"
DEFAULT_HTTPS_PORT="443"
DEFAULT_APP_PORT="8843"
DEFAULT_DB_PORT="5432"
DEFAULT_DB_NAME="gknexus"
DEFAULT_DB_USER="gknexus"
DEFAULT_POSTGRES_VERSION="17-alpine"
DEFAULT_INSTALL_DIR="/opt/gk-nexus"

# GitHub repo
GITHUB_REPO="kareemschultz/SYNERGY-GY"
GITHUB_RAW="https://raw.githubusercontent.com/${GITHUB_REPO}/master"

#######################################
# Helper Functions
#######################################

print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
   _____ _  __      _   _
  / ____| |/ /     | \ | |
 | |  __| ' / _____|  \| | _____  ___   _ ___
 | | |_ |  < |______| . ` |/ _ \ \/ / | | / __|
 | |__| | . \       | |\  |  __/>  <| |_| \__ \
  \_____|_|\_\      |_| \_|\___/_/\_\\__,_|___/

  Practice Management System
  Version: ${SCRIPT_VERSION}
EOF
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

prompt() {
    local prompt_text="$1"
    local default_value="$2"
    local var_name="$3"
    local is_secret="${4:-false}"

    if [ -n "$default_value" ]; then
        prompt_text="${prompt_text} [${default_value}]"
    fi

    if [ "$is_secret" = "true" ]; then
        read -sp "${prompt_text}: " user_input
        echo ""
    else
        read -p "${prompt_text}: " user_input
    fi

    if [ -z "$user_input" ] && [ -n "$default_value" ]; then
        user_input="$default_value"
    fi

    eval "$var_name='$user_input'"
}

prompt_yes_no() {
    local prompt_text="$1"
    local default="${2:-y}"
    local result

    if [ "$default" = "y" ]; then
        prompt_text="${prompt_text} [Y/n]"
    else
        prompt_text="${prompt_text} [y/N]"
    fi

    read -p "${prompt_text}: " result

    if [ -z "$result" ]; then
        result="$default"
    fi

    case "$result" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

generate_password() {
    openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32
}

generate_secret() {
    openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

check_port() {
    local port=$1
    if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
        return 1
    fi
    return 0
}

#######################################
# System Checks
#######################################

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        log_error "Cannot detect operating system"
        exit 1
    fi

    log_info "Detected OS: $OS $VER"

    case "$OS" in
        "Ubuntu"*|"Debian"*)
            PKG_MANAGER="apt-get"
            PKG_UPDATE="apt-get update"
            PKG_INSTALL="apt-get install -y"
            ;;
        "CentOS"*|"Red Hat"*|"Fedora"*|"Rocky"*|"AlmaLinux"*)
            PKG_MANAGER="yum"
            PKG_UPDATE="yum update -y"
            PKG_INSTALL="yum install -y"
            ;;
        *)
            log_warn "Untested OS: $OS. Proceeding anyway..."
            PKG_MANAGER="apt-get"
            PKG_UPDATE="apt-get update"
            PKG_INSTALL="apt-get install -y"
            ;;
    esac
}

check_dependencies() {
    log_step "Checking Dependencies"

    local missing_deps=()

    # Check for curl
    if ! check_command curl; then
        missing_deps+=("curl")
    fi

    # Check for Docker
    if ! check_command docker; then
        missing_deps+=("docker")
    fi

    # Check for Docker Compose
    if ! docker compose version &> /dev/null && ! check_command docker-compose; then
        missing_deps+=("docker-compose")
    fi

    # Check for openssl
    if ! check_command openssl; then
        missing_deps+=("openssl")
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_warn "Missing dependencies: ${missing_deps[*]}"

        if prompt_yes_no "Would you like to install missing dependencies?"; then
            install_dependencies "${missing_deps[@]}"
        else
            log_error "Cannot proceed without required dependencies"
            exit 1
        fi
    else
        log_success "All dependencies are installed"
    fi
}

install_dependencies() {
    local deps=("$@")

    log_info "Updating package manager..."
    $PKG_UPDATE > /dev/null 2>&1

    for dep in "${deps[@]}"; do
        case "$dep" in
            "docker")
                install_docker
                ;;
            "docker-compose")
                install_docker_compose
                ;;
            *)
                log_info "Installing $dep..."
                $PKG_INSTALL "$dep" > /dev/null 2>&1
                ;;
        esac
    done
}

install_docker() {
    log_info "Installing Docker..."

    # Remove old versions
    for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
        $PKG_MANAGER remove -y $pkg 2>/dev/null || true
    done

    # Install using official script
    curl -fsSL https://get.docker.com | sh

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    log_success "Docker installed successfully"
}

install_docker_compose() {
    log_info "Installing Docker Compose..."

    # Docker Compose is now included with Docker, but install plugin if needed
    if ! docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")')
        curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi

    log_success "Docker Compose installed successfully"
}

#######################################
# Configuration Collection
#######################################

detect_installation() {
    if [ -f "$DEFAULT_INSTALL_DIR/.env" ] || [ -f "$DEFAULT_INSTALL_DIR/docker-compose.yml" ]; then
        return 0  # Existing installation
    fi
    return 1  # Fresh installation
}

collect_configuration() {
    log_step "Configuration"

    # Detect existing installation
    if detect_installation; then
        log_info "Existing installation detected at $DEFAULT_INSTALL_DIR"
        if prompt_yes_no "Would you like to upgrade the existing installation?"; then
            INSTALL_MODE="upgrade"
            INSTALL_DIR="$DEFAULT_INSTALL_DIR"
            # Load existing config
            if [ -f "$INSTALL_DIR/.env" ]; then
                source "$INSTALL_DIR/.env"
            fi
            return
        fi
    fi

    INSTALL_MODE="fresh"

    echo -e "${BOLD}Please provide the following configuration:${NC}\n"

    # Installation directory
    prompt "Installation directory" "$DEFAULT_INSTALL_DIR" INSTALL_DIR

    # Domain configuration
    echo ""
    log_info "Domain Configuration"
    prompt "Domain name (e.g., app.example.com)" "$DEFAULT_DOMAIN" DOMAIN

    if [ "$DOMAIN" != "localhost" ]; then
        if prompt_yes_no "Would you like to enable SSL/TLS with Let's Encrypt?" "y"; then
            ENABLE_SSL="true"
            prompt "Email for SSL certificate notifications" "" SSL_EMAIL
        else
            ENABLE_SSL="false"
        fi
    else
        ENABLE_SSL="false"
    fi

    # Port configuration
    echo ""
    log_info "Port Configuration"
    prompt "Application port" "$DEFAULT_APP_PORT" APP_PORT

    if [ "$ENABLE_SSL" = "true" ]; then
        HTTP_PORT="80"
        HTTPS_PORT="443"
    else
        prompt "HTTP port" "$DEFAULT_HTTP_PORT" HTTP_PORT
    fi

    # Database configuration
    echo ""
    log_info "Database Configuration"
    prompt "Database name" "$DEFAULT_DB_NAME" DB_NAME
    prompt "Database user" "$DEFAULT_DB_USER" DB_USER

    log_info "Generating secure database password..."
    DB_PASSWORD=$(generate_password)
    log_success "Database password generated (saved to .env file)"

    # Application secrets
    echo ""
    log_info "Generating application secrets..."
    AUTH_SECRET=$(generate_secret)
    log_success "Authentication secret generated"

    # Initial admin account
    echo ""
    log_info "Initial Administrator Account"
    prompt "Admin email" "" ADMIN_EMAIL
    prompt "Admin password (min 8 characters)" "" ADMIN_PASSWORD "true"
    prompt "Admin name" "System Administrator" ADMIN_NAME

    # Additional options
    echo ""
    log_info "Additional Options"

    if prompt_yes_no "Enable automatic backups?" "y"; then
        ENABLE_BACKUPS="true"
        prompt "Backup retention days" "30" BACKUP_RETENTION_DAYS
    else
        ENABLE_BACKUPS="false"
    fi

    if prompt_yes_no "Seed database with demo data?" "n"; then
        SEED_DATA="true"
    else
        SEED_DATA="false"
    fi

    if prompt_yes_no "Enable email notifications (requires SMTP)?" "n"; then
        ENABLE_EMAIL="true"
        prompt "SMTP host" "" SMTP_HOST
        prompt "SMTP port" "587" SMTP_PORT
        prompt "SMTP user" "" SMTP_USER
        prompt "SMTP password" "" SMTP_PASSWORD "true"
        prompt "From email address" "" SMTP_FROM
    else
        ENABLE_EMAIL="false"
    fi
}

#######################################
# Installation
#######################################

create_directories() {
    log_step "Creating Directories"

    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/data/postgres"
    mkdir -p "$INSTALL_DIR/data/uploads"
    mkdir -p "$INSTALL_DIR/data/backups"
    mkdir -p "$INSTALL_DIR/logs"

    log_success "Directories created at $INSTALL_DIR"
}

create_env_file() {
    log_step "Creating Environment Configuration"

    cat > "$INSTALL_DIR/.env" << EOF
# GK-Nexus Environment Configuration
# Generated by deploy.sh v${SCRIPT_VERSION}
# Generated at: $(date -Iseconds)

# ===========================================
# Application Settings
# ===========================================
NODE_ENV=production
APP_PORT=${APP_PORT}
DOMAIN=${DOMAIN}

# ===========================================
# Database Configuration
# ===========================================
POSTGRES_DB=${DB_NAME}
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}

# ===========================================
# Authentication
# ===========================================
BETTER_AUTH_SECRET=${AUTH_SECRET}
BETTER_AUTH_URL=${ENABLE_SSL:+https}${ENABLE_SSL:-http}://${DOMAIN}${APP_PORT:+:}${APP_PORT}

# ===========================================
# CORS Configuration
# ===========================================
CORS_ORIGIN=${ENABLE_SSL:+https}${ENABLE_SSL:-http}://${DOMAIN}

# ===========================================
# Initial Owner Account
# ===========================================
INITIAL_OWNER_EMAIL=${ADMIN_EMAIL}
INITIAL_OWNER_PASSWORD=${ADMIN_PASSWORD}
INITIAL_OWNER_NAME=${ADMIN_NAME}

# ===========================================
# Email Configuration (Optional)
# ===========================================
ENABLE_EMAIL=${ENABLE_EMAIL}
SMTP_HOST=${SMTP_HOST:-}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USER=${SMTP_USER:-}
SMTP_PASSWORD=${SMTP_PASSWORD:-}
SMTP_FROM=${SMTP_FROM:-}

# ===========================================
# Backup Configuration
# ===========================================
ENABLE_BACKUPS=${ENABLE_BACKUPS}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# ===========================================
# SSL Configuration
# ===========================================
ENABLE_SSL=${ENABLE_SSL}
SSL_EMAIL=${SSL_EMAIL:-}
EOF

    chmod 600 "$INSTALL_DIR/.env"
    log_success "Environment file created"
}

create_docker_compose() {
    log_step "Creating Docker Compose Configuration"

    cat > "$INSTALL_DIR/docker-compose.yml" << 'EOF'
version: "3.8"

services:
  server:
    image: ghcr.io/kareemschultz/gk-nexus:latest
    container_name: gk-nexus-server
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${APP_PORT:-8843}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - INITIAL_OWNER_EMAIL=${INITIAL_OWNER_EMAIL}
      - INITIAL_OWNER_PASSWORD=${INITIAL_OWNER_PASSWORD}
      - INITIAL_OWNER_NAME=${INITIAL_OWNER_NAME}
      - SMTP_HOST=${SMTP_HOST:-}
      - SMTP_PORT=${SMTP_PORT:-587}
      - SMTP_USER=${SMTP_USER:-}
      - SMTP_PASSWORD=${SMTP_PASSWORD:-}
      - SMTP_FROM=${SMTP_FROM:-}
    volumes:
      - gk-nexus-uploads:/app/uploads
    networks:
      - gk-nexus-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

  postgres:
    image: postgres:17-alpine
    container_name: gk-nexus-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - gk-nexus-postgres:/var/lib/postgresql/data
    networks:
      - gk-nexus-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    security_opt:
      - no-new-privileges:true

volumes:
  gk-nexus-postgres:
    name: gk-nexus-postgres
  gk-nexus-uploads:
    name: gk-nexus-uploads

networks:
  gk-nexus-network:
    name: gk-nexus-network
    driver: bridge
EOF

    log_success "Docker Compose file created"
}

create_management_script() {
    log_step "Creating Management Script"

    cat > "$INSTALL_DIR/gk-nexus" << 'EOF'
#!/bin/bash

#######################################
# GK-Nexus Management Script
#######################################

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$INSTALL_DIR"

# Load environment
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

case "$1" in
    start)
        echo "Starting GK-Nexus..."
        docker compose up -d
        echo "GK-Nexus started. Access at: http://${DOMAIN:-localhost}:${APP_PORT:-8843}"
        ;;
    stop)
        echo "Stopping GK-Nexus..."
        docker compose down
        echo "GK-Nexus stopped."
        ;;
    restart)
        echo "Restarting GK-Nexus..."
        docker compose restart
        echo "GK-Nexus restarted."
        ;;
    status)
        docker compose ps
        ;;
    logs)
        docker compose logs -f "${2:-server}"
        ;;
    update)
        echo "Updating GK-Nexus..."
        docker compose pull
        docker compose up -d
        echo "GK-Nexus updated."
        ;;
    backup)
        echo "Creating backup..."
        BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
        docker compose exec -T postgres pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "data/backups/${BACKUP_FILE}"
        gzip "data/backups/${BACKUP_FILE}"
        echo "Backup created: data/backups/${BACKUP_FILE}.gz"
        ;;
    restore)
        if [ -z "$2" ]; then
            echo "Usage: gk-nexus restore <backup-file.sql.gz>"
            exit 1
        fi
        echo "Restoring from $2..."
        gunzip -c "$2" | docker compose exec -T postgres psql -U "${POSTGRES_USER}" "${POSTGRES_DB}"
        echo "Restore complete."
        ;;
    seed)
        echo "Seeding database..."
        docker compose exec server bun run db:seed
        echo "Database seeded."
        ;;
    shell)
        docker compose exec server sh
        ;;
    db)
        docker compose exec postgres psql -U "${POSTGRES_USER}" "${POSTGRES_DB}"
        ;;
    health)
        curl -s "http://localhost:${APP_PORT:-8843}/health" | jq . 2>/dev/null || curl -s "http://localhost:${APP_PORT:-8843}/health"
        ;;
    uninstall)
        echo "WARNING: This will remove GK-Nexus and all data!"
        read -p "Are you sure? (type 'yes' to confirm): " confirm
        if [ "$confirm" = "yes" ]; then
            docker compose down -v
            echo "GK-Nexus uninstalled."
        else
            echo "Uninstall cancelled."
        fi
        ;;
    *)
        echo "GK-Nexus Management Script"
        echo ""
        echo "Usage: gk-nexus <command>"
        echo ""
        echo "Commands:"
        echo "  start       Start GK-Nexus"
        echo "  stop        Stop GK-Nexus"
        echo "  restart     Restart GK-Nexus"
        echo "  status      Show container status"
        echo "  logs [svc]  View logs (default: server)"
        echo "  update      Update to latest version"
        echo "  backup      Create database backup"
        echo "  restore     Restore from backup"
        echo "  seed        Seed database with initial data"
        echo "  shell       Open shell in server container"
        echo "  db          Open PostgreSQL shell"
        echo "  health      Check health status"
        echo "  uninstall   Remove GK-Nexus (WARNING: deletes data)"
        echo ""
        ;;
esac
EOF

    chmod +x "$INSTALL_DIR/gk-nexus"

    # Create symlink in /usr/local/bin for global access
    ln -sf "$INSTALL_DIR/gk-nexus" /usr/local/bin/gk-nexus

    log_success "Management script created (available as 'gk-nexus' command)"
}

create_systemd_service() {
    log_step "Creating Systemd Service"

    cat > /etc/systemd/system/gk-nexus.service << EOF
[Unit]
Description=GK-Nexus Practice Management System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable gk-nexus.service

    log_success "Systemd service created and enabled"
}

setup_ssl() {
    if [ "$ENABLE_SSL" != "true" ]; then
        return
    fi

    log_step "Setting up SSL/TLS with Let's Encrypt"

    # Install certbot if not present
    if ! check_command certbot; then
        log_info "Installing certbot..."
        $PKG_INSTALL certbot > /dev/null 2>&1
    fi

    # Get certificate
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$SSL_EMAIL" \
        -d "$DOMAIN"

    # Setup auto-renewal
    echo "0 0 * * * root certbot renew --quiet --post-hook 'docker compose -f $INSTALL_DIR/docker-compose.yml restart'" > /etc/cron.d/gk-nexus-ssl

    log_success "SSL certificate obtained and auto-renewal configured"
}

setup_backup_cron() {
    if [ "$ENABLE_BACKUPS" != "true" ]; then
        return
    fi

    log_step "Setting up Automatic Backups"

    cat > /etc/cron.d/gk-nexus-backup << EOF
# GK-Nexus automatic backup - runs daily at 2 AM
0 2 * * * root ${INSTALL_DIR}/gk-nexus backup

# Cleanup old backups
0 3 * * * root find ${INSTALL_DIR}/data/backups -name "*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete
EOF

    log_success "Automatic daily backups configured"
}

deploy_application() {
    log_step "Deploying Application"

    cd "$INSTALL_DIR"

    # Pull latest image
    log_info "Pulling latest Docker image..."
    docker compose pull

    # Start containers
    log_info "Starting containers..."
    docker compose up -d

    # Wait for health check
    log_info "Waiting for application to become healthy..."
    local max_attempts=60
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:${APP_PORT}/health" | grep -q "healthy"; then
            log_success "Application is healthy!"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
        log_error "Application failed to become healthy. Check logs with: gk-nexus logs"
        exit 1
    fi
}

seed_database() {
    if [ "$SEED_DATA" != "true" ]; then
        return
    fi

    log_step "Seeding Database"

    log_info "Running seed scripts..."
    docker compose exec -T server bun run db:seed 2>/dev/null || true

    log_success "Database seeded with initial data"
}

#######################################
# Upgrade
#######################################

upgrade_installation() {
    log_step "Upgrading GK-Nexus"

    cd "$INSTALL_DIR"

    # Backup before upgrade
    log_info "Creating pre-upgrade backup..."
    ./gk-nexus backup

    # Pull latest image
    log_info "Pulling latest Docker image..."
    docker compose pull

    # Recreate containers
    log_info "Updating containers..."
    docker compose up -d

    # Wait for health
    log_info "Waiting for application to become healthy..."
    sleep 10

    if curl -s "http://localhost:${APP_PORT:-8843}/health" | grep -q "healthy"; then
        log_success "Upgrade complete!"
    else
        log_error "Application may not be healthy. Check logs with: gk-nexus logs"
    fi
}

#######################################
# Summary
#######################################

print_summary() {
    log_step "Installation Complete!"

    echo -e "${GREEN}${BOLD}GK-Nexus has been successfully installed!${NC}\n"

    echo -e "${BOLD}Access Information:${NC}"
    if [ "$ENABLE_SSL" = "true" ]; then
        echo -e "  URL: ${CYAN}https://${DOMAIN}${NC}"
    else
        echo -e "  URL: ${CYAN}http://${DOMAIN}:${APP_PORT}${NC}"
    fi
    echo -e "  Admin Email: ${CYAN}${ADMIN_EMAIL}${NC}"
    echo ""

    echo -e "${BOLD}Management Commands:${NC}"
    echo -e "  ${YELLOW}gk-nexus start${NC}     - Start the application"
    echo -e "  ${YELLOW}gk-nexus stop${NC}      - Stop the application"
    echo -e "  ${YELLOW}gk-nexus status${NC}    - Check status"
    echo -e "  ${YELLOW}gk-nexus logs${NC}      - View logs"
    echo -e "  ${YELLOW}gk-nexus update${NC}    - Update to latest version"
    echo -e "  ${YELLOW}gk-nexus backup${NC}    - Create backup"
    echo -e "  ${YELLOW}gk-nexus health${NC}    - Check health"
    echo ""

    echo -e "${BOLD}File Locations:${NC}"
    echo -e "  Installation: ${CYAN}${INSTALL_DIR}${NC}"
    echo -e "  Configuration: ${CYAN}${INSTALL_DIR}/.env${NC}"
    echo -e "  Backups: ${CYAN}${INSTALL_DIR}/data/backups${NC}"
    echo -e "  Logs: ${CYAN}gk-nexus logs${NC}"
    echo ""

    if [ "$ENABLE_BACKUPS" = "true" ]; then
        echo -e "${BOLD}Backups:${NC}"
        echo -e "  Automatic daily backups enabled"
        echo -e "  Retention: ${BACKUP_RETENTION_DAYS} days"
        echo ""
    fi

    echo -e "${BOLD}Next Steps:${NC}"
    echo -e "  1. Access the application at the URL above"
    echo -e "  2. Log in with your admin credentials"
    echo -e "  3. Configure your business settings"
    echo -e "  4. Add staff members and start using the system"
    echo ""

    echo -e "${BOLD}Documentation:${NC}"
    echo -e "  https://github.com/${GITHUB_REPO}#readme"
    echo ""

    echo -e "${GREEN}Thank you for using GK-Nexus!${NC}"
}

#######################################
# Main
#######################################

main() {
    print_banner

    # Check if running as root
    check_root

    # Detect OS
    check_os

    # Check dependencies
    check_dependencies

    # Collect configuration
    collect_configuration

    if [ "$INSTALL_MODE" = "upgrade" ]; then
        upgrade_installation
    else
        # Fresh installation
        create_directories
        create_env_file
        create_docker_compose
        create_management_script
        create_systemd_service
        setup_ssl
        setup_backup_cron
        deploy_application
        seed_database
    fi

    print_summary
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "GK-Nexus Deployment Script v${SCRIPT_VERSION}"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show version"
        echo "  --unattended   Run in unattended mode (requires env vars)"
        echo ""
        echo "Environment Variables (for unattended mode):"
        echo "  DOMAIN, APP_PORT, DB_NAME, DB_USER, DB_PASSWORD"
        echo "  ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME"
        echo "  ENABLE_SSL, SSL_EMAIL"
        echo ""
        exit 0
        ;;
    --version|-v)
        echo "GK-Nexus Deployment Script v${SCRIPT_VERSION}"
        exit 0
        ;;
    *)
        main
        ;;
esac
