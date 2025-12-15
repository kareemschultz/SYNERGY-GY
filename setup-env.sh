#!/bin/bash
# =============================================================================
# GK-Nexus Environment Setup Script
# =============================================================================
# Automatically generates secure secrets and configures .env file
#
# Usage:
#   ./setup-env.sh
#
# This script will:
# - Generate secure random passwords and secrets
# - Prompt for your domain, email, and admin details
# - Create a fully configured .env file ready for deployment
# =============================================================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}✓${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# =============================================================================
# Welcome
# =============================================================================

header "🚀 GK-Nexus Environment Setup"

info "This script will generate secure secrets and configure your .env file."
echo ""

# Check if .env already exists
if [ -f .env ]; then
    warn ".env file already exists!"
    read -p "Do you want to overwrite it? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Your existing .env file was not modified."
        exit 0
    fi
fi

# Check if .env.example exists
if [ ! -f .env.example ]; then
    echo "Error: .env.example not found. Are you in the project root?"
    exit 1
fi

# =============================================================================
# Generate Secrets
# =============================================================================

header "🔐 Generating Secure Secrets"

info "Generating database password..."
POSTGRES_PASSWORD=$(openssl rand -base64 32)
log "Database password generated (44 characters)"

info "Generating authentication secret..."
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
log "Auth secret generated (44 characters)"

info "Generating admin password..."
INITIAL_OWNER_PASSWORD=$(openssl rand -base64 24)
log "Admin password generated (32 characters)"

# =============================================================================
# Gather Configuration
# =============================================================================

header "⚙️  Configuration"

# Domain
echo ""
read -p "Enter your domain (e.g., gcmc.karetechsolutions.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "Error: Domain is required"
    exit 1
fi

# Use HTTPS for production
BETTER_AUTH_URL="https://$DOMAIN"
CORS_ORIGIN="https://$DOMAIN"
TRUSTED_ORIGINS="https://$DOMAIN"

# Port
echo ""
read -p "Enter external port for reverse proxy (default: 3000, Pangolin: 8843): " APP_PORT
APP_PORT=${APP_PORT:-3000}

# Admin details
echo ""
read -p "Enter admin email: " INITIAL_OWNER_EMAIL
if [ -z "$INITIAL_OWNER_EMAIL" ]; then
    echo "Error: Admin email is required"
    exit 1
fi

read -p "Enter admin name: " INITIAL_OWNER_NAME
if [ -z "$INITIAL_OWNER_NAME" ]; then
    echo "Error: Admin name is required"
    exit 1
fi

# =============================================================================
# Create .env File
# =============================================================================

header "📝 Creating .env File"

info "Copying .env.example to .env..."
cp .env.example .env

info "Populating configuration..."

# URL-encode the password for DATABASE_URL (special chars like / + = break URL parsing)
# Using printf and xxd for URL encoding
ENCODED_PASSWORD=$(printf '%s' "$POSTGRES_PASSWORD" | xxd -plain | tr -d '\n' | sed 's/\(..\)/%\1/g')

# Update DATABASE_URL with URL-encoded password (no quotes needed)
DATABASE_URL="postgresql://gknexus:${ENCODED_PASSWORD}@postgres:5432/gknexus"
sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|g" .env

# Update secrets (no quotes - Docker Compose and bash interpret quotes literally)
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" .env
sed -i "s|BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET|g" .env

# Update URLs and domains (no quotes)
sed -i "s|BETTER_AUTH_URL=.*|BETTER_AUTH_URL=$BETTER_AUTH_URL|g" .env
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=$CORS_ORIGIN|g" .env
sed -i "s|TRUSTED_ORIGINS=.*|TRUSTED_ORIGINS=$TRUSTED_ORIGINS|g" .env

# Update port (no quotes)
sed -i "s|APP_PORT=.*|APP_PORT=$APP_PORT|g" .env

# Update admin details (no quotes for email/password, quotes for name with spaces)
sed -i "s|INITIAL_OWNER_EMAIL=.*|INITIAL_OWNER_EMAIL=$INITIAL_OWNER_EMAIL|g" .env
sed -i "s|INITIAL_OWNER_PASSWORD=.*|INITIAL_OWNER_PASSWORD=$INITIAL_OWNER_PASSWORD|g" .env
sed -i "s|INITIAL_OWNER_NAME=.*|INITIAL_OWNER_NAME=\"$INITIAL_OWNER_NAME\"|g" .env

log ".env file created successfully!"

# =============================================================================
# Summary
# =============================================================================

header "📋 Configuration Summary"

cat << EOF
Domain Configuration:
  ${BLUE}Domain:${NC}              $DOMAIN
  ${BLUE}BETTER_AUTH_URL:${NC}     $BETTER_AUTH_URL
  ${BLUE}CORS_ORIGIN:${NC}         $CORS_ORIGIN
  ${BLUE}External Port:${NC}       $APP_PORT

Admin Account:
  ${BLUE}Email:${NC}               $INITIAL_OWNER_EMAIL
  ${BLUE}Name:${NC}                $INITIAL_OWNER_NAME
  ${BLUE}Password:${NC}            $INITIAL_OWNER_PASSWORD

Database:
  ${BLUE}User:${NC}                gknexus
  ${BLUE}Database:${NC}            gknexus
  ${BLUE}Password:${NC}            $POSTGRES_PASSWORD

Security:
  ${BLUE}BETTER_AUTH_SECRET:${NC}  $BETTER_AUTH_SECRET

${YELLOW}⚠ IMPORTANT: Save your admin password somewhere safe!${NC}
${YELLOW}  Admin Password: $INITIAL_OWNER_PASSWORD${NC}

EOF

# =============================================================================
# Next Steps
# =============================================================================

header "🎯 Next Steps"

cat << EOF
Your .env file is ready! To deploy:

  1. ${BLUE}Review configuration:${NC}
     cat .env

  2. ${BLUE}Deploy to production:${NC}
     ./deploy-production.sh

  3. ${BLUE}Access your application:${NC}
     https://$DOMAIN

${GREEN}✓${NC} Setup complete! You're ready to deploy.

EOF
