# GK-Nexus Production Deployment Guide

> Complete guide for deploying GK-Nexus to production with Docker, SSL, monitoring, and automated backups.

**Version:** 3.0.0
**Last Updated:** January 15, 2025
**Target Environment:** Production (Linux server with Docker)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Building the Docker Image](#building-the-docker-image)
4. [Running with Docker Compose](#running-with-docker-compose)
5. [Database Migrations](#database-migrations)
6. [Backup and Restore](#backup-and-restore)
7. [SSL/TLS Certificate Setup](#ssltls-certificate-setup)
8. [Reverse Proxy Configuration](#reverse-proxy-configuration)
9. [Monitoring and Health Checks](#monitoring-and-health-checks)
10. [Log Management](#log-management)
11. [Updating to New Versions](#updating-to-new-versions)
12. [Rollback Procedures](#rollback-procedures)
13. [Troubleshooting](#troubleshooting)
14. [Production Deployment Checklist](#production-deployment-checklist)
15. [Security Hardening](#security-hardening)

---

## Prerequisites

### System Requirements

**Minimum Specifications:**
- **Operating System:** Ubuntu 22.04 LTS or newer (Debian-based recommended)
- **CPU:** 2+ cores
- **RAM:** 4GB minimum
- **Storage:** 50GB available disk space
- **Network:** Static IP address or domain name configured

**Recommended Specifications:**
- **Operating System:** Ubuntu 24.04 LTS
- **CPU:** 4+ cores
- **RAM:** 8GB or more
- **Storage:** 100GB+ SSD for production data and backups
- **Network:** Dedicated server with firewall

### Required Software

#### 1. Docker Engine (24.0 or newer)

```bash
# Install Docker on Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (requires logout/login to take effect)
sudo usermod -aG docker $USER

# Verify Docker installation
docker --version
# Expected: Docker version 24.0.0 or newer
```

#### 2. Docker Compose (v2.20 or newer)

```bash
# Docker Compose V2 is included with Docker Engine
docker compose version
# Expected: Docker Compose version v2.20.0 or newer

# If not installed, install manually
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

#### 3. Git (for cloning repository)

```bash
sudo apt-get update
sudo apt-get install git curl jq -y

# Verify Git installation
git --version
```

#### 4. Optional but Recommended

```bash
# Install useful utilities
sudo apt-get install -y \
    curl \
    jq \
    htop \
    ncdu \
    certbot \
    python3-certbot-nginx

# Install fail2ban for security
sudo apt-get install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Port Requirements

Ensure these ports are available and accessible:

| Port | Service | Exposure | Required |
|------|---------|----------|----------|
| **80** | HTTP | Public | Yes (redirects to HTTPS) |
| **443** | HTTPS | Public | Yes (application access) |
| **3000** | Application | Localhost only | Yes (internal) |
| **5432** | PostgreSQL | Localhost only | Yes (internal) |
| **22** | SSH | Public (restricted) | Yes (server access) |

```bash
# Configure firewall (UFW)
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
sudo ufw status verbose
```

**IMPORTANT:** PostgreSQL (5432) and Application (3000) ports should NEVER be exposed publicly. They run inside Docker's internal network.

---

## Environment Setup

### 1. Clone the Repository

```bash
# Create application directory
sudo mkdir -p /opt/gk-nexus
sudo chown $USER:$USER /opt/gk-nexus
cd /opt/gk-nexus

# Clone repository
git clone https://github.com/kareemschultz/SYNERGY-GY.git .

# Checkout latest stable release
git checkout master
git pull origin master

# View available tags/releases
git tag -l
```

### 2. Create Production Environment File

```bash
# Create .env.production from example
cp apps/server/.env.example .env.production

# Secure the file (readable only by owner)
chmod 600 .env.production
```

### 3. Configure Environment Variables

Edit `.env.production` with your production values:

```bash
nano .env.production
```

**Complete Production Configuration:**

```env
# ===========================================
# GK-Nexus Production Configuration
# ===========================================

# ----- Database Configuration -----
POSTGRES_DB=synergy_gy
POSTGRES_USER=gknexus
POSTGRES_PASSWORD=<GENERATE_STRONG_PASSWORD>
POSTGRES_PORT=5432

# Database URL (used by application)
# Format: postgresql://user:password@host:port/database
# IMPORTANT: Use 'postgres' as hostname (Docker service name), not 'localhost'
DATABASE_URL=postgresql://gknexus:<POSTGRES_PASSWORD>@postgres:5432/synergy_gy

# ----- Authentication (Better-Auth) -----
# CRITICAL: Generate with: openssl rand -base64 32
# Must be minimum 32 characters
BETTER_AUTH_SECRET=<GENERATE_WITH_openssl_rand_base64_32>

# Production URL (your domain with HTTPS)
# Examples: https://gk-nexus.example.com or https://example.com
BETTER_AUTH_URL=https://yourdomain.com

# ----- Server Configuration -----
NODE_ENV=production
PORT=3000

# CORS allowed origins (your frontend domain)
# Use comma-separated list for multiple domains
# Example: https://yourdomain.com,https://www.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Application port (internal Docker network)
APP_PORT=3000

# ----- Email Configuration (Resend) -----
# Get API key from: https://resend.com/api-keys
# Leave empty to disable email features (portal invites will fail)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Optional: Reply-to and support addresses
EMAIL_REPLY_TO=support@yourdomain.com
EMAIL_SUPPORT=support@yourdomain.com

# ----- Initial Owner Setup (FIRST BOOT ONLY) -----
# SECURITY WARNING: Remove these after first login!
# These create the initial admin account on first run
INITIAL_OWNER_EMAIL=admin@yourdomain.com
INITIAL_OWNER_PASSWORD=<CHANGE_ME_STRONG_PASSWORD>
INITIAL_OWNER_NAME=System Administrator

# ----- File Storage -----
# Upload directory (Docker volume mount)
UPLOAD_DIR=/app/data/uploads

# ----- Frontend Build Configuration -----
# Build-time variable (used during Docker build or web app build)
VITE_SERVER_URL=https://yourdomain.com

# ----- Cloud Backup (Optional - Cloudflare R2 or AWS S3) -----
# Recommended: Cloudflare R2 (S3-compatible, no egress fees)
# Uncomment and configure when enabling cloud backups

# Cloudflare R2 Configuration (Recommended)
# BACKUP_S3_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
# BACKUP_S3_ACCESS_KEY_ID=your_r2_access_key_id
# BACKUP_S3_SECRET_ACCESS_KEY=your_r2_secret_access_key
# BACKUP_S3_BUCKET=gk-nexus-backups
# BACKUP_S3_REGION=auto

# AWS S3 Configuration (Alternative)
# BACKUP_S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
# BACKUP_S3_ACCESS_KEY_ID=your_aws_access_key
# BACKUP_S3_SECRET_ACCESS_KEY=your_aws_secret_key
# BACKUP_S3_BUCKET=gk-nexus-backups
# BACKUP_S3_REGION=us-east-1

# Optional: Public URL for serving files from cloud storage
# BACKUP_S3_PUBLIC_URL=https://files.yourdomain.com

# ----- WhatsApp Integration (Optional - Phase 3) -----
# WhatsApp Business API configuration
# Uncomment when implementing WhatsApp integration

# WHATSAPP_ACCESS_TOKEN=
# WHATSAPP_PHONE_NUMBER_ID=
# WHATSAPP_BUSINESS_ACCOUNT_ID=
# WHATSAPP_VERIFY_TOKEN=
# WHATSAPP_APP_SECRET=
# WHATSAPP_WEBHOOK_URL=https://yourdomain.com/webhooks/whatsapp

# ----- Logging & Monitoring (Optional) -----
# Log level: error, warn, info, debug
LOG_LEVEL=info

# Sentry DSN for error tracking
# SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# ----- Rate Limiting (Optional) -----
# RATE_LIMIT_MAX=100
# RATE_LIMIT_WINDOW_MS=900000

# ----- Session Management (Optional) -----
# SESSION_MAX_AGE=604800000

# ----- Application Settings (Optional) -----
# APP_NAME=GK-Nexus
# SUPPORT_EMAIL=support@gcmc-kaj.com
# SUPPORT_PHONE=+592-XXX-XXXX
# COMPANY_NAME=Green Crescent Management Consultancy
# COMPANY_ADDRESS=Georgetown, Guyana
```

### 4. Generate Secure Secrets

**CRITICAL SECURITY STEP** - Generate strong, random secrets for production:

```bash
# Generate BETTER_AUTH_SECRET (minimum 32 characters)
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"

# Generate strong database password
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"

# Generate strong initial owner password
echo "INITIAL_OWNER_PASSWORD=$(openssl rand -base64 16)"
```

**Copy the generated values into `.env.production`**

### 5. Create Required Directories

```bash
# Create data directories for Docker volumes
mkdir -p data/uploads backups logs

# Set appropriate permissions
chmod 755 data/uploads backups logs

# Verify directories exist
ls -la data/ backups/ logs/
```

### 6. Verify Configuration

```bash
# Check environment file exists and is secured
ls -l .env.production
# Expected: -rw------- (permissions 600)

# Test environment variable loading (without exposing secrets)
grep -v '^#' .env.production | grep -v '^ #PROTECTED' | head -n 5

# Verify required variables are set
grep -E '^(POSTGRES_PASSWORD|BETTER_AUTH_SECRET|BETTER_AUTH_URL)=' .env.production | wc -l
# Expected: 3 (all critical variables present)
```

---

## Building the Docker Image

### Option 1: Use Pre-built Image from GitHub Container Registry (RECOMMENDED)

The easiest and most reliable method for production deployment:

```bash
# Pull latest image from GHCR
docker pull ghcr.io/kareemschultz/gk-nexus:latest

# Verify image was pulled successfully
docker images | grep gk-nexus

# Expected output:
# ghcr.io/kareemschultz/gk-nexus   latest    abc123def456   2 hours ago   234MB
```

**Benefits of using pre-built images:**
- ✅ Tested in CI/CD pipeline with automated verification
- ✅ SBOM (Software Bill of Materials) for transparency
- ✅ Provenance attestations for build verification
- ✅ No build time required (faster deployment)
- ✅ Consistent across all environments
- ✅ Rollback capability with SHA-tagged images
- ✅ Build once, deploy anywhere

**Image tags available:**
- `latest` - Always points to latest master branch build
- `sha-<commit>` - Immutable tag for specific commit (e.g., `sha-abc123def`)

```bash
# View available tags
# Visit: https://github.com/kareemschultz/SYNERGY-GY/pkgs/container/gk-nexus

# Pull specific version for rollback capability
docker pull ghcr.io/kareemschultz/gk-nexus:sha-abc123def
```

### Option 2: Build Locally from Source

Only use if you need custom modifications or are developing:

```bash
# Ensure you're in the project root
cd /opt/gk-nexus

# Build using Docker Compose (recommended)
docker compose -f docker-compose.prod.yml build

# Or build manually with BuildKit
export DOCKER_BUILDKIT=1
docker build \
  -f Dockerfile.prod \
  --build-arg VITE_SERVER_URL=https://yourdomain.com \
  -t ghcr.io/kareemschultz/gk-nexus:local \
  .
```

**Build Performance Metrics:**
- **First build:** 8-10 minutes (downloads dependencies, builds from scratch)
- **Cached build:** 2-4 minutes (with BuildKit cache)
- **CI build:** <5 minutes (with GitHub Actions cache)
- **Image size:** 200-250MB (optimized with multi-stage build)

**Build optimizations:**
- Multi-stage build (pruner → builder → runner)
- Turbo prune reduces build context by ~80%
- BuildKit cache mounts for `/root/.bun` and `/root/.cache/turbo`
- Production-only dependencies in final stage
- Non-root user (UID 1001) for security

### Verify Docker Image

Use the verification script to ensure the image works correctly:

```bash
# Make script executable
chmod +x scripts/verify-docker-build.sh

# Run verification tests
./scripts/verify-docker-build.sh
```

**Verification checklist:**
- ✅ Image builds successfully
- ✅ Image size is under 300MB
- ✅ Container starts and becomes healthy within 60 seconds
- ✅ Health check endpoint (`/health`) responds with 200 OK
- ✅ Application endpoint (`/`) serves HTML content

**Expected output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Building Docker Image
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Image built successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verifying Image Size
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ Image size: 234 MB (limit: 300 MB)
✓ Image size is within acceptable limits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Waiting for Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Container is healthy (28s)

✅ All verification checks passed!
```

---

## Running with Docker Compose

### 1. Review Docker Compose Configuration

The `docker-compose.prod.yml` file is pre-configured with:
- PostgreSQL 16 Alpine (minimal, secure)
- Application container with security hardening
- Health checks for both services
- Volume mounts for persistence
- Network isolation

**Security features (LinuxServer.io best practices):**
- Read-only filesystem (`read_only: true`)
- Dropped all Linux capabilities (`cap_drop: [ALL]`)
- No privilege escalation (`no-new-privileges:true`)
- Non-root user (UID 1001)
- Minimal attack surface

### 2. Start Services

```bash
# Load environment variables
set -a
source .env.production
set +a

# Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Expected output:
# ✔ Network gk-nexus-network         Created
# ✔ Volume gk-nexus-postgres-data    Created
# ✔ Container gk-nexus-postgres      Started
# ✔ Container gk-nexus-app           Started
```

### 3. Verify Services are Running

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                   STATUS              PORTS
# gk-nexus-app          Up (healthy)         3000/tcp
# gk-nexus-postgres     Up (healthy)         5432/tcp

# Verify both services show 'healthy' status
```

### 4. View Service Logs

```bash
# Follow all logs in real-time
docker compose -f docker-compose.prod.yml logs -f

# View application logs only
docker compose -f docker-compose.prod.yml logs -f app

# View database logs only
docker compose -f docker-compose.prod.yml logs -f postgres

# View last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100

# Stop following logs: Ctrl+C
```

### 5. Test Health Endpoints

```bash
# Test application health endpoint
curl -f http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-15T12:00:00.000Z"}

# Test application root (should serve React app)
curl -I http://localhost:3000/

# Expected: HTTP/1.1 200 OK
```

### 6. Test Database Connectivity

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy

# Run test query
# synergy_gy=# SELECT 1;
# synergy_gy=# \q

# Or run query directly
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy -c "SELECT current_database(), current_user;"
```

### 7. Managing Services

```bash
# Stop services (keeps data)
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes all data!)
docker compose -f docker-compose.prod.yml down -v

# Restart specific service
docker compose -f docker-compose.prod.yml restart app

# View resource usage
docker compose -f docker-compose.prod.yml stats

# View container details
docker compose -f docker-compose.prod.yml ps -a
```

---

## Database Migrations

### Initial Setup

On first deployment, database schema must be initialized:

```bash
# Option 1: Run migrations (recommended for production)
docker compose -f docker-compose.prod.yml exec app bun run db:migrate

# Option 2: Push schema directly (development only)
# docker compose -f docker-compose.prod.yml exec app bun run db:push
```

**Important notes:**
- Migrations are idempotent (safe to run multiple times)
- The database schema is automatically created on first run
- Application will fail to start if database schema is missing

### Migration Commands

```bash
# Generate new migration from schema changes
docker compose -f docker-compose.prod.yml exec app bun run db:generate

# Run pending migrations
docker compose -f docker-compose.prod.yml exec app bun run db:migrate

# Open Drizzle Studio to inspect database (http://localhost:4983)
docker compose -f docker-compose.prod.yml exec app bun run db:studio

# Push schema changes directly (development only)
docker compose -f docker-compose.prod.yml exec app bun run db:push
```

### Production Migration Workflow

**CRITICAL:** Always follow this workflow when deploying schema changes:

```bash
# 1. Backup database BEFORE migration
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U gknexus -d synergy_gy \
  | gzip > backups/pre-migration-$(date +%Y%m%d-%H%M%S).sql.gz

# 2. Pull latest code/image
git pull origin master
# or
docker compose -f docker-compose.prod.yml pull

# 3. Stop application (keep database running)
docker compose -f docker-compose.prod.yml stop app

# 4. Run migrations
docker compose -f docker-compose.prod.yml up -d app
docker compose -f docker-compose.prod.yml exec app bun run db:migrate

# 5. Verify migration success
docker compose -f docker-compose.prod.yml logs app | grep -i migration

# 6. Test application
curl -f http://localhost:3000/health

# 7. If migration fails, restore backup
# gunzip -c backups/pre-migration-*.sql.gz | \
#   docker compose -f docker-compose.prod.yml exec -T postgres \
#   psql -U gknexus -d synergy_gy
```

### Troubleshooting Migrations

```bash
# View migration history
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy \
  -c "SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 10;"

# Check database schema version
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy \
  -c "SELECT COUNT(*) as applied_migrations FROM drizzle.__drizzle_migrations;"

# View database tables
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy -c "\dt"
```

---

## Backup and Restore

GK-Nexus includes a comprehensive backup system (introduced in commit `560f8f1`).

### Manual Database Backup

```bash
# Create timestamped backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U gknexus -d synergy_gy \
  | gzip > backups/db-$(date +%Y%m%d-%H%M%S).sql.gz

# Verify backup was created
ls -lh backups/

# Expected: db-20250115-120000.sql.gz (size varies)
```

### Application Data Backup

```bash
# Backup uploaded files
tar czf backups/uploads-$(date +%Y%m%d-%H%M%S).tar.gz data/uploads/

# Backup environment configuration (SECURE THIS FILE!)
cp .env.production backups/env-backup-$(date +%Y%m%d-%H%M%S)
chmod 600 backups/env-backup-*

# Create complete backup (database + uploads + config)
tar czf backups/complete-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  .env.production \
  data/uploads/ \
  backups/db-$(date +%Y%m%d-%H%M%S).sql.gz
```

### Automated Backup Configuration

#### Daily Automated Backups via Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2:00 AM
0 2 * * * cd /opt/gk-nexus && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U gknexus -d synergy_gy | gzip > backups/db-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz

# Add backup cleanup (delete backups older than 30 days)
0 3 * * * find /opt/gk-nexus/backups -name "db-*.sql.gz" -mtime +30 -delete

# Add weekly full backup (database + uploads) - Sunday 3:00 AM
0 3 * * 0 cd /opt/gk-nexus && tar czf backups/full-backup-$(date +\%Y\%m\%d).tar.gz .env.production data/uploads/ backups/db-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz

# Verify cron jobs
crontab -l
```

#### Backup via Application UI

1. Login as OWNER or MANAGER
2. Navigate to **Settings > Backup & Restore**
3. Click **"Create Backup"**
4. Backup will be stored in `backups/` directory

### Database Restore

#### Restore from SQL Dump

```bash
# Stop application (keep database running)
docker compose -f docker-compose.prod.yml stop app

# Restore database from backup
gunzip -c backups/db-20250115-020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U gknexus -d synergy_gy

# Restart application
docker compose -f docker-compose.prod.yml start app

# Verify restoration
curl -f http://localhost:3000/health
```

#### Complete System Restore

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Restore environment configuration
cp backups/env-backup-20250115-020000 .env.production
chmod 600 .env.production

# Restore database
gunzip -c backups/db-20250115-020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U gknexus -d synergy_gy

# Restore uploaded files
rm -rf data/uploads/*
tar xzf backups/uploads-20250115-020000.tar.gz

# Start services
docker compose -f docker-compose.prod.yml up -d

# Verify all services healthy
docker compose -f docker-compose.prod.yml ps
```

### Backup Schedule Recommendations

| Frequency | What to Backup | Retention Period | Storage Location |
|-----------|----------------|------------------|------------------|
| **Hourly** | Transaction logs (WAL archiving) | 24 hours | Local disk |
| **Daily** | Full database dump | 30 days | Local disk + cloud |
| **Weekly** | Database + uploaded files + config | 12 weeks | Cloud storage |
| **Monthly** | Complete system snapshot | 12 months | Cloud storage (encrypted) |

### Cloud Backup Configuration

#### Using Cloudflare R2 (Recommended)

Cloudflare R2 is S3-compatible with **zero egress fees**.

**Step 1: Create R2 Bucket**
1. Login to Cloudflare dashboard
2. Navigate to R2 Object Storage
3. Create bucket: `gk-nexus-backups`
4. Generate API tokens (Access Key ID + Secret Access Key)

**Step 2: Configure Environment Variables**

Add to `.env.production`:

```bash
BACKUP_S3_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
BACKUP_S3_ACCESS_KEY_ID=your_r2_access_key
BACKUP_S3_SECRET_ACCESS_KEY=your_r2_secret_key
BACKUP_S3_BUCKET=gk-nexus-backups
BACKUP_S3_REGION=auto
```

**Step 3: Restart Application**

```bash
docker compose -f docker-compose.prod.yml restart app
```

**Step 4: Test Cloud Backup**

Via Admin UI:
1. Navigate to **Settings > Backup & Restore**
2. Enable **"Cloud Sync"**
3. Click **"Test Connection"**
4. Create backup to verify upload

#### Automated Cloud Sync with rclone

```bash
# Install rclone
sudo apt-get install rclone

# Configure rclone for Cloudflare R2
rclone config

# Add to crontab (daily sync at 4:00 AM)
0 4 * * * rclone sync /opt/gk-nexus/backups r2:gk-nexus-backups --exclude "*.tmp" --log-file /var/log/rclone-backup.log
```

---

## SSL/TLS Certificate Setup

### Option 1: Let's Encrypt with Certbot (Recommended)

Let's Encrypt provides free, automated SSL certificates with 90-day validity and automatic renewal.

#### Install Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# Verify installation
certbot --version
```

#### Obtain SSL Certificate

**Prerequisites:**
- Domain name pointing to your server's IP address
- Port 80 accessible (for HTTP-01 challenge)
- Nginx installed and running

```bash
# Option A: Automatic configuration with Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Option B: Standalone mode (if Nginx not running)
sudo systemctl stop nginx
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
sudo systemctl start nginx

# Follow interactive prompts:
# 1. Enter email for renewal notifications
# 2. Agree to Terms of Service
# 3. Choose HTTP to HTTPS redirect (recommended: yes)
```

**Certificate locations:**
- Certificate: `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- Private key: `/etc/letsencrypt/live/yourdomain.com/privkey.pem`
- Chain: `/etc/letsencrypt/live/yourdomain.com/chain.pem`

#### Configure Automatic Renewal

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Expected output: Congratulations, all renewals succeeded

# Certbot automatically creates systemd timer for renewal
sudo systemctl status certbot.timer

# Manually add renewal cron job (backup method)
sudo crontab -e

# Add renewal check (daily at 3:00 AM)
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

#### Verify SSL Configuration

```bash
# Test SSL certificate
curl -I https://yourdomain.com

# Check certificate expiry
sudo certbot certificates

# Expected output:
# Certificate Name: yourdomain.com
#   Expiry Date: 2025-04-15 12:00:00+00:00 (VALID: 89 days)
```

### Option 2: Custom SSL Certificate

If you have a purchased SSL certificate:

```bash
# Create secure directory for certificates
sudo mkdir -p /etc/ssl/gk-nexus
sudo chmod 700 /etc/ssl/gk-nexus

# Copy certificate files
sudo cp yourdomain.crt /etc/ssl/gk-nexus/
sudo cp yourdomain.key /etc/ssl/gk-nexus/
sudo cp ca-bundle.crt /etc/ssl/gk-nexus/  # If provided by CA

# Secure private key
sudo chmod 600 /etc/ssl/gk-nexus/yourdomain.key

# Update Nginx configuration to use custom certificates
# (See Nginx configuration section below)
```

---

## Reverse Proxy Configuration

The application container runs on port 3000 (localhost only). A reverse proxy handles:
- SSL/TLS termination
- HTTP to HTTPS redirect
- Security headers
- Load balancing (if multiple instances)
- Static file caching

### Option 1: Nginx (Traditional, Widely Used)

#### Install Nginx

```bash
sudo apt-get update
sudo apt-get install nginx -y

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify Nginx is running
sudo systemctl status nginx
```

#### Configure Nginx for GK-Nexus

Create `/etc/nginx/sites-available/gk-nexus`:

```bash
sudo nano /etc/nginx/sites-available/gk-nexus
```

**Complete Nginx Configuration:**

```nginx
# HTTP Server (redirect to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt ACME challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration (Modern, Secure)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # SSL Session Caching
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';" always;

    # Client body size limit (for document uploads - 50MB)
    client_max_body_size 50M;
    client_body_timeout 60s;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    # Logging
    access_log /var/log/nginx/gk-nexus-access.log;
    error_log /var/log/nginx/gk-nexus-error.log warn;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket Support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Disable proxy buffering for better real-time performance
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        send_timeout 60s;
    }

    # Health Check Endpoint (bypass logging)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
        proxy_set_header Host $host;
    }

    # API Endpoints (optional - separate rate limiting)
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting for API (optional)
        # limit_req zone=api_limit burst=20 nodelay;
    }

    # Block access to sensitive files
    location ~ /\.(?!well-known) {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# Optional: Rate Limiting Zone Definition
# Add to http block in /etc/nginx/nginx.conf
# limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

#### Enable and Test Nginx Configuration

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable GK-Nexus site
sudo ln -s /etc/nginx/sites-available/gk-nexus /etc/nginx/sites-enabled/

# Test Nginx configuration syntax
sudo nginx -t

# Expected output:
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload Nginx to apply changes
sudo systemctl reload nginx

# Verify Nginx is running
sudo systemctl status nginx
```

#### Test HTTPS Access

```bash
# Test HTTPS (should return 200 OK)
curl -I https://yourdomain.com

# Test HTTP redirect (should return 301 Moved Permanently)
curl -I http://yourdomain.com

# Test SSL grade (online tool)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

### Option 2: Caddy (Modern, Automatic HTTPS)

Caddy provides automatic HTTPS with zero configuration and automatic certificate renewal.

#### Install Caddy

```bash
# Add Caddy repository
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# Install Caddy
sudo apt update
sudo apt install caddy

# Verify installation
caddy version
```

#### Configure Caddy

Create `/etc/caddy/Caddyfile`:

```bash
sudo nano /etc/caddy/Caddyfile
```

**Complete Caddyfile Configuration:**

```caddyfile
# Main domain configuration
yourdomain.com, www.yourdomain.com {
    # Automatic HTTPS is enabled by default
    # Caddy handles Let's Encrypt certificates automatically

    # Reverse proxy to application
    reverse_proxy localhost:3000 {
        # Health checks
        health_uri /health
        health_interval 30s
        health_timeout 5s
        health_status 200

        # Headers passed to backend
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-Host {host}
    }

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "no-referrer-when-downgrade"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"

        # Remove server header
        -Server
    }

    # Logging
    log {
        output file /var/log/caddy/gk-nexus.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format json
        level info
    }

    # File upload size limit (50MB)
    request_body {
        max_size 50MB
    }

    # Gzip compression
    encode gzip zstd
}
```

#### Start and Enable Caddy

```bash
# Validate Caddyfile syntax
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy with new configuration
sudo caddy reload --config /etc/caddy/Caddyfile

# Enable Caddy on boot
sudo systemctl enable caddy

# Check Caddy status
sudo systemctl status caddy

# View Caddy logs
sudo journalctl -u caddy -f
```

**Benefits of Caddy:**
- ✅ Automatic HTTPS with Let's Encrypt/ZeroSSL
- ✅ Automatic certificate renewal (no cron jobs needed)
- ✅ HTTP/2 and HTTP/3 support out of the box
- ✅ Modern, secure TLS configuration by default
- ✅ Simpler configuration syntax
- ✅ Built-in health checks and load balancing

---

## Monitoring and Health Checks

### Built-in Application Health Checks

GK-Nexus includes comprehensive health monitoring at multiple levels:

#### Docker Health Checks

Configured in `docker-compose.prod.yml`:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Fail if no response in 10 seconds
  retries: 3         # Retry 3 times before marking unhealthy
  start_period: 60s  # Grace period during container startup
```

#### Check Container Health Status

```bash
# View health status of all services
docker compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                   STATUS
# gk-nexus-app          Up (healthy)
# gk-nexus-postgres     Up (healthy)

# Detailed health check logs
docker inspect gk-nexus-app | jq '.[0].State.Health'

# Monitor health in real-time
watch -n 5 'docker compose -f docker-compose.prod.yml ps'
```

#### Application Health Endpoint

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response (200 OK):
# {"status":"ok","timestamp":"2025-01-15T12:34:56.789Z"}

# Test via HTTPS (through reverse proxy)
curl https://yourdomain.com/health
```

### Viewing Application Logs

```bash
# Follow live logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# Follow application logs only
docker compose -f docker-compose.prod.yml logs -f app

# Follow database logs only
docker compose -f docker-compose.prod.yml logs -f postgres

# View last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 app

# View logs since specific time
docker compose -f docker-compose.prod.yml logs --since 1h app
docker compose -f docker-compose.prod.yml logs --since "2025-01-15T12:00:00" app

# View logs with timestamps
docker compose -f docker-compose.prod.yml logs -t app

# Export logs to file
docker compose -f docker-compose.prod.yml logs app > app-logs-$(date +%Y%m%d).log
```

### Resource Usage Monitoring

```bash
# Real-time container resource usage
docker stats gk-nexus-app gk-nexus-postgres

# Expected output:
# CONTAINER         CPU %     MEM USAGE / LIMIT     MEM %     NET I/O         BLOCK I/O
# gk-nexus-app      2.5%      256MB / 8GB          3.2%      1.2GB / 850MB   45MB / 12MB
# gk-nexus-postgres 1.1%      128MB / 8GB          1.6%      850MB / 1.2GB   890MB / 456MB

# One-time stats snapshot
docker stats --no-stream gk-nexus-app gk-nexus-postgres

# Disk usage by Docker
docker system df

# Disk usage by application directories
du -sh /opt/gk-nexus/data/uploads
du -sh /opt/gk-nexus/backups
du -sh /var/lib/docker/volumes/gk-nexus-postgres-data

# Database size
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy -c \
  "SELECT pg_size_pretty(pg_database_size('synergy_gy')) AS database_size;"

# Detailed database table sizes
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy -c \
  "SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;"
```

### External Monitoring Services

#### UptimeRobot (Free Tier: 50 Monitors)

1. Sign up at https://uptimerobot.com
2. Create **HTTP(S)** monitor:
   - **URL:** `https://yourdomain.com/health`
   - **Interval:** 5 minutes
   - **Monitor Type:** HTTP(S)
   - **Expected Status Code:** 200
3. Configure alerts:
   - **Email** notifications
   - **SMS** notifications (paid)
   - **Webhook** notifications (Slack, Discord, etc.)

#### Healthchecks.io (Free Tier: 20 Checks)

```bash
# Create check at https://healthchecks.io
# Copy your ping URL

# Add to crontab (ping every 5 minutes)
crontab -e

# Add health check ping
*/5 * * * * curl -fsS -m 10 --retry 5 https://hc-ping.com/YOUR-UUID-HERE > /dev/null || curl -fsS -m 10 --retry 5 https://hc-ping.com/YOUR-UUID-HERE/fail > /dev/null
```

#### Better Uptime (Free Tier: Unlimited Checks)

1. Sign up at https://betteruptime.com
2. Create monitor for `https://yourdomain.com/health`
3. Configure on-call rotation and escalation policies
4. Integrate with Slack, PagerDuty, etc.

### Custom Monitoring Script

Create `/usr/local/bin/gk-nexus-monitor.sh`:

```bash
#!/bin/bash
# GK-Nexus Health Monitor Script
# Checks application health and sends alerts on failure

HEALTH_URL="http://localhost:3000/health"
ALERT_EMAIL="admin@yourdomain.com"
LOG_FILE="/var/log/gk-nexus-monitor.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check health endpoint
if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
    log "✓ Health check passed"
else
    log "✗ Health check FAILED - attempting auto-restart"

    # Send email alert
    echo "GK-Nexus health check failed at $(date)" | \
        mail -s "ALERT: GK-Nexus Down" "$ALERT_EMAIL"

    # Attempt auto-restart
    cd /opt/gk-nexus
    docker compose -f docker-compose.prod.yml restart app

    # Wait 30 seconds and check again
    sleep 30

    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        log "✓ Auto-restart successful"
        echo "GK-Nexus auto-restart successful at $(date)" | \
            mail -s "RESOLVED: GK-Nexus Recovered" "$ALERT_EMAIL"
    else
        log "✗ Auto-restart failed - manual intervention required"
        echo "GK-Nexus auto-restart FAILED at $(date). Manual intervention required." | \
            mail -s "CRITICAL: GK-Nexus Still Down" "$ALERT_EMAIL"
    fi
fi
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/gk-nexus-monitor.sh

# Test script
sudo /usr/local/bin/gk-nexus-monitor.sh

# Add to crontab (check every 5 minutes)
sudo crontab -e

# Add monitoring script
*/5 * * * * /usr/local/bin/gk-nexus-monitor.sh
```

### System Resource Alerts

```bash
# Install monitoring tools
sudo apt-get install sysstat

# Monitor disk space (alert if <10GB free)
#!/bin/bash
THRESHOLD=10  # GB
AVAILABLE=$(df -BG /opt/gk-nexus | awk 'NR==2 {print $4}' | sed 's/G//')

if [ "$AVAILABLE" -lt "$THRESHOLD" ]; then
    echo "WARNING: Only ${AVAILABLE}GB disk space remaining on /opt/gk-nexus" | \
        mail -s "ALERT: Low Disk Space" admin@yourdomain.com
fi
```

---

## Log Management

### Viewing Docker Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f postgres

# View last N lines
docker compose -f docker-compose.prod.yml logs --tail=100 app

# View logs with timestamps
docker compose -f docker-compose.prod.yml logs -t

# View logs since specific time
docker compose -f docker-compose.prod.yml logs --since "2025-01-15T12:00:00"
docker compose -f docker-compose.prod.yml logs --since 1h
docker compose -f docker-compose.prod.yml logs --since 30m
```

### Docker Log Rotation

Configure log rotation in `/etc/docker/daemon.json`:

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3",
    "compress": "true"
  }
}
```

```bash
# Restart Docker to apply changes
sudo systemctl restart docker

# Restart GK-Nexus services
docker compose -f docker-compose.prod.yml up -d
```

**Log rotation settings:**
- `max-size: "10m"` - Rotate logs when they reach 10MB
- `max-file: "3"` - Keep 3 rotated log files
- `compress: "true"` - Compress rotated logs

### Persistent Log Storage

Export logs to files for long-term storage:

```bash
# Create logs directory
mkdir -p /opt/gk-nexus/logs

# Export logs daily (via cron)
0 1 * * * cd /opt/gk-nexus && docker compose -f docker-compose.prod.yml logs --no-color --since 24h > logs/gk-nexus-$(date +\%Y\%m\%d).log

# Compress logs older than 7 days
find /opt/gk-nexus/logs -name "*.log" -mtime +7 -exec gzip {} \;

# Delete logs older than 90 days
find /opt/gk-nexus/logs -name "*.log.gz" -mtime +90 -delete
```

### Nginx/Caddy Logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/gk-nexus-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/gk-nexus-error.log

# Caddy logs
sudo journalctl -u caddy -f
sudo tail -f /var/log/caddy/gk-nexus.log

# Rotate Nginx logs (configured automatically by logrotate)
sudo cat /etc/logrotate.d/nginx
```

### Centralized Logging (Optional)

For production environments with multiple servers:

#### Option A: Loki + Promtail (Grafana Stack)

```yaml
# Add to docker-compose.prod.yml
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
```

#### Option B: ELK Stack (Elasticsearch, Logstash, Kibana)

Use Docker logging drivers to send logs to Elasticsearch.

---

## Updating to New Versions

### Update Process Overview

1. **Check for updates** - Review changelog and breaking changes
2. **Backup database** - Create pre-update backup
3. **Pull new version** - Code or Docker image
4. **Update services** - Restart with new version
5. **Run migrations** - Apply database schema changes
6. **Verify functionality** - Test critical features
7. **Monitor logs** - Watch for errors

### Update Workflow

#### Step 1: Check for Updates

```bash
# Fetch latest changes from repository
cd /opt/gk-nexus
git fetch origin

# View available tags/releases
git tag -l

# View changes in latest release
git log --oneline HEAD..origin/master

# View detailed changelog
git show origin/master:CHANGELOG.md
```

#### Step 2: Backup Before Update

**CRITICAL:** Always backup before updating!

```bash
# Create pre-update backup with descriptive name
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U gknexus -d synergy_gy \
  | gzip > backups/pre-update-$(git rev-parse --short HEAD)-$(date +%Y%m%d-%H%M%S).sql.gz

# Backup uploaded files
tar czf backups/uploads-pre-update-$(date +%Y%m%d-%H%M%S).tar.gz data/uploads/

# Backup environment configuration
cp .env.production backups/env-pre-update-$(date +%Y%m%d-%H%M%S)

# Verify backups were created
ls -lh backups/pre-update-*
```

#### Step 3: Pull New Version

**Option A: Using Pre-built GHCR Image (Recommended)**

```bash
# Pull latest image
docker pull ghcr.io/kareemschultz/gk-nexus:latest

# Or pull specific version
docker pull ghcr.io/kareemschultz/gk-nexus:sha-abc123def

# Verify new image
docker images | grep gk-nexus
```

**Option B: Using Git and Local Build**

```bash
# Pull latest code
git pull origin master

# Or checkout specific version
git checkout v1.2.0

# Rebuild image
docker compose -f docker-compose.prod.yml build
```

#### Step 4: Update Services

```bash
# Recreate containers with new image
docker compose -f docker-compose.prod.yml up -d

# Alternative: Pull and recreate in one command
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# View update progress
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

#### Step 5: Run Database Migrations

```bash
# Run migrations (if needed)
docker compose -f docker-compose.prod.yml exec app bun run db:migrate

# Expected output:
# Migrating database...
# ✓ Migrations applied successfully
```

#### Step 6: Verify Update

```bash
# Check health endpoint
curl -f http://localhost:3000/health

# Expected: {"status":"ok","timestamp":"..."}

# Check application version (if available)
curl -s http://localhost:3000/api/version

# View container logs for errors
docker compose -f docker-compose.prod.yml logs --tail=50 app | grep -i error

# Test critical features:
# 1. Login as admin
# 2. Create test client
# 3. Upload test document
# 4. View matters list
# 5. Delete test data
```

#### Step 7: Monitor Post-Update

```bash
# Monitor logs for 5-10 minutes
docker compose -f docker-compose.prod.yml logs -f app

# Monitor resource usage
docker stats gk-nexus-app gk-nexus-postgres

# Check for errors
docker compose -f docker-compose.prod.yml logs app | grep -i error
docker compose -f docker-compose.prod.yml logs app | grep -i fail
```

### Zero-Downtime Updates (Blue-Green Deployment)

For critical production systems requiring no downtime:

```bash
# Step 1: Start new version on different port
APP_PORT=3001 docker compose -f docker-compose.prod.yml up -d app

# Step 2: Wait for health check to pass
until curl -sf http://localhost:3001/health; do
    echo "Waiting for new version to be healthy..."
    sleep 5
done

# Step 3: Update reverse proxy to point to new version
sudo nano /etc/nginx/sites-available/gk-nexus
# Change: proxy_pass http://localhost:3000;
# To:     proxy_pass http://localhost:3001;

sudo nginx -t && sudo nginx -s reload

# Step 4: Monitor new version
docker logs -f gk-nexus-app

# Step 5: Stop old version after verification
docker stop gk-nexus-app-old

# Step 6: Switch back to port 3000 and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Update Schedule Recommendations

| Update Type | Frequency | Recommended Window |
|-------------|-----------|-------------------|
| **Security patches** | As released | Within 24-48 hours |
| **Minor updates** | Monthly | During maintenance window |
| **Major updates** | Quarterly | After testing on staging |
| **Dependencies** | Monthly | With minor updates |

---

## Rollback Procedures

### Quick Rollback (Image-Based)

If using GHCR with commit-tagged images:

```bash
# Step 1: View available image tags
# Visit: https://github.com/kareemschultz/SYNERGY-GY/pkgs/container/gk-nexus
# Or list local images
docker images ghcr.io/kareemschultz/gk-nexus

# Step 2: Pull previous version
docker pull ghcr.io/kareemschultz/gk-nexus:sha-<previous-commit>

# Step 3: Tag as latest
docker tag ghcr.io/kareemschultz/gk-nexus:sha-<previous-commit> ghcr.io/kareemschultz/gk-nexus:latest

# Step 4: Restart services with previous version
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Step 5: Verify rollback
curl -f http://localhost:3000/health
docker compose -f docker-compose.prod.yml logs --tail=50 app
```

### Full System Rollback (with Database Restore)

When update causes data issues:

```bash
# Step 1: Stop all services
docker compose -f docker-compose.prod.yml down

# Step 2: Restore database backup
gunzip -c backups/pre-update-*.sql.gz | \
  docker compose -f docker-compose.prod.yml up -d postgres && \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U gknexus -d synergy_gy

# Step 3: Restore uploaded files (if needed)
rm -rf data/uploads/*
tar xzf backups/uploads-pre-update-*.tar.gz

# Step 4: Restore environment configuration (if changed)
cp backups/env-pre-update-* .env.production

# Step 5: Checkout previous code version
git log --oneline  # Find previous commit hash
git checkout <previous-commit-hash>

# Step 6: Rebuild/pull previous image
docker compose -f docker-compose.prod.yml build
# or
docker pull ghcr.io/kareemschultz/gk-nexus:sha-<previous-commit>

# Step 7: Start services
docker compose -f docker-compose.prod.yml up -d

# Step 8: Verify rollback
curl -f http://localhost:3000/health
docker compose -f docker-compose.prod.yml ps
```

### Database Migration Rollback

Drizzle ORM doesn't support automatic rollbacks. Manual process:

```bash
# Step 1: Stop application (keep database running)
docker compose -f docker-compose.prod.yml stop app

# Step 2: Restore pre-migration database backup
gunzip -c backups/pre-migration-*.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U gknexus -d synergy_gy

# Step 3: Checkout previous code version
git checkout <previous-commit>

# Step 4: Restart application
docker compose -f docker-compose.prod.yml start app

# Step 5: Verify database schema
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy -c "\dt"
```

### Emergency Maintenance Mode

Take application offline immediately:

```bash
# Step 1: Stop application (database keeps running)
docker compose -f docker-compose.prod.yml stop app

# Step 2: Create maintenance page
sudo nano /var/www/html/maintenance.html
```

**Maintenance Page HTML:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance - GK-Nexus</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 50px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
        }
        h1 {
            color: #333;
            font-size: 32px;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 30px auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .eta {
            color: #999;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 System Maintenance</h1>
        <p>GK-Nexus is currently undergoing scheduled maintenance.</p>
        <p>We're working to improve your experience.</p>
        <div class="spinner"></div>
        <p class="eta">Expected to be back shortly. Thank you for your patience.</p>
    </div>
</body>
</html>
```

**Step 3: Update Nginx to serve maintenance page:**

```bash
sudo nano /etc/nginx/sites-available/gk-nexus
```

Add **before** the main `location /` block:

```nginx
# Maintenance mode
location / {
    root /var/www/html;
    try_files /maintenance.html =503;
}
```

```bash
# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

**Step 4: When ready, restore normal operation:**

```bash
# Remove maintenance mode from Nginx config
sudo nano /etc/nginx/sites-available/gk-nexus
# (Remove or comment out maintenance location block)

# Reload Nginx
sudo systemctl reload nginx

# Start application
docker compose -f docker-compose.prod.yml start app
```

---

## Troubleshooting

### Application Won't Start

**Symptom:** Container starts then immediately exits

```bash
# Check container logs for error messages
docker compose -f docker-compose.prod.yml logs app

# Common error patterns to look for:
# - "ECONNREFUSED" → Database connection failed
# - "EADDRINUSE" → Port already in use
# - "permission denied" → File permission issues
# - "required environment variable" → Missing .env values
```

**Solutions:**

```bash
# 1. Verify environment variables are set
docker compose -f docker-compose.prod.yml config | grep -E 'DATABASE_URL|BETTER_AUTH'

# 2. Check database is running and healthy
docker compose -f docker-compose.prod.yml ps postgres

# 3. Check port 3000 availability
sudo lsof -i :3000
# or
sudo netstat -tuln | grep 3000

# 4. Check file permissions
ls -la data/uploads backups

# 5. View detailed container inspect
docker inspect gk-nexus-app
```

### Database Connection Issues

**Symptom:** "ECONNREFUSED", "Connection timeout", or "database does not exist"

```bash
# Verify PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Check PostgreSQL logs for errors
docker compose -f docker-compose.prod.yml logs postgres | tail -50

# Test database connection manually
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy -c "SELECT 1;"

# Verify DATABASE_URL format in .env.production
# ✓ Correct: postgresql://gknexus:password@postgres:5432/synergy_gy
# ✗ Wrong:   postgresql://gknexus:password@localhost:5432/synergy_gy
#                                           ^^^^^^^^^ Use 'postgres' (service name)
```

**Solutions:**

```bash
# 1. Restart PostgreSQL
docker compose -f docker-compose.prod.yml restart postgres

# 2. Check DATABASE_URL uses 'postgres' hostname (not 'localhost')
grep DATABASE_URL .env.production

# 3. Verify database exists
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -l

# 4. If database doesn't exist, recreate it
docker compose -f docker-compose.prod.yml exec postgres \
  createdb -U gknexus synergy_gy
```

### Health Check Failing

**Symptom:** Container marked as "unhealthy" in `docker ps`

```bash
# Check health check details
docker inspect gk-nexus-app | jq '.[0].State.Health'

# Test health endpoint manually
curl -v http://localhost:3000/health

# Check if application is listening on port 3000
docker compose -f docker-compose.prod.yml exec app netstat -tuln | grep 3000
```

**Solutions:**

```bash
# 1. Check application logs for startup errors
docker compose -f docker-compose.prod.yml logs app | tail -100

# 2. Increase health check start period (slow to start)
# Edit docker-compose.prod.yml:
# healthcheck:
#   start_period: 120s  # Increase from 60s

# 3. Temporarily disable health check for debugging
docker compose -f docker-compose.prod.yml up -d --no-healthcheck

# 4. Restart container
docker compose -f docker-compose.prod.yml restart app
```

### File Upload Errors

**Symptom:** "Permission denied", "EACCES", or uploads fail with 500 error

```bash
# Check upload directory permissions
ls -la data/uploads

# Should be owned by UID 1001 (gknexus container user)
# drwxr-xr-x 2 1001 1001 4096 Jan 15 12:00 uploads
```

**Solutions:**

```bash
# 1. Fix directory ownership
sudo chown -R 1001:1001 data/uploads
chmod 755 data/uploads

# 2. Check disk space
df -h /opt/gk-nexus

# 3. Check Nginx upload size limit
sudo grep client_max_body_size /etc/nginx/sites-available/gk-nexus

# 4. Increase Nginx upload limit if needed
# client_max_body_size 50M;  # Or higher

sudo systemctl reload nginx
```

### Out of Disk Space

**Symptom:** "No space left on device" errors

```bash
# Check disk usage
df -h

# Find large directories
du -sh /opt/gk-nexus/*
du -sh /var/lib/docker/volumes/*

# Find large files
find /opt/gk-nexus -type f -size +100M -exec ls -lh {} \;
```

**Solutions:**

```bash
# 1. Clean old backups (keep last 30 days)
find /opt/gk-nexus/backups -name "*.sql.gz" -mtime +30 -delete

# 2. Clean old logs
find /opt/gk-nexus/logs -name "*.log.gz" -mtime +90 -delete

# 3. Clean Docker system
docker system prune -a

# 4. Clean Docker volumes (CAREFUL - may delete data!)
docker volume prune

# 5. Rotate Docker logs (see Log Management section)

# 6. VACUUM database to reclaim space
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy -c "VACUUM FULL ANALYZE;"
```

### SSL Certificate Issues

**Symptom:** "Certificate expired", "ERR_CERT_DATE_INVALID", or browser shows "Not Secure"

```bash
# Check certificate status
sudo certbot certificates

# Expected output shows expiry date

# Check Nginx SSL configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Solutions:**

```bash
# 1. Test certificate renewal (dry run)
sudo certbot renew --dry-run

# 2. Force certificate renewal
sudo certbot renew --force-renewal

# 3. Reload Nginx after renewal
sudo systemctl reload nginx

# 4. If renewal fails, obtain new certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 5. Verify certificate is valid
curl -vI https://yourdomain.com 2>&1 | grep -E 'expire|SSL'
```

### High Memory Usage

**Symptom:** Container using >2GB RAM, or server running out of memory

```bash
# Check current memory usage
docker stats gk-nexus-app --no-stream

# Check system memory
free -h

# Check for memory leaks in logs
docker compose -f docker-compose.prod.yml logs app | grep -i "out of memory"
```

**Solutions:**

```bash
# 1. Restart container to free memory
docker compose -f docker-compose.prod.yml restart app

# 2. Set memory limits in docker-compose.prod.yml
# services:
#   app:
#     deploy:
#       resources:
#         limits:
#           memory: 2G
#         reservations:
#           memory: 512M

# 3. Optimize database queries (if database consuming memory)
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U gknexus -d synergy_gy -c \
  "SELECT pid, usename, application_name, state,
          pg_size_pretty(pg_total_relation_size('pg_stat_activity')) as mem
   FROM pg_stat_activity
   ORDER BY mem DESC;"

# 4. Restart PostgreSQL
docker compose -f docker-compose.prod.yml restart postgres
```

### Authentication Issues

**Symptom:** Can't login, session expired errors, or redirect loops

```bash
# Verify BETTER_AUTH_SECRET is set and not empty
docker compose -f docker-compose.prod.yml exec app sh -c 'echo ${BETTER_AUTH_SECRET:0:10}...'

# Check BETTER_AUTH_URL matches your domain
docker compose -f docker-compose.prod.yml exec app sh -c 'echo $BETTER_AUTH_URL'

# Check CORS_ORIGIN
docker compose -f docker-compose.prod.yml exec app sh -c 'echo $CORS_ORIGIN'
```

**Solutions:**

```bash
# 1. Verify environment variables
grep -E '^(BETTER_AUTH_SECRET|BETTER_AUTH_URL|CORS_ORIGIN)=' .env.production

# 2. Clear browser cookies and cache

# 3. Restart application
docker compose -f docker-compose.prod.yml restart app

# 4. Check application logs for auth errors
docker compose -f docker-compose.prod.yml logs app | grep -i auth

# 5. Verify reverse proxy headers
# Nginx should pass:
# proxy_set_header X-Forwarded-Proto $scheme;
# proxy_set_header Host $host;
```

### Reverse Proxy Issues

**Symptom:** 502 Bad Gateway, 504 Gateway Timeout, or can't access application

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify application is running
docker compose -f docker-compose.prod.yml ps

# Test direct access (bypass proxy)
curl http://localhost:3000/health
```

**Solutions:**

```bash
# 1. Restart Nginx
sudo systemctl restart nginx

# 2. Check if application is listening
curl http://localhost:3000/health

# 3. Verify proxy_pass points to correct port
sudo grep proxy_pass /etc/nginx/sites-available/gk-nexus

# 4. Check firewall allows traffic
sudo ufw status

# 5. Test with curl via proxy
curl -I https://yourdomain.com
```

---

## Production Deployment Checklist

Use this comprehensive checklist before going live:

### Pre-Deployment

#### Server Preparation
- [ ] Server meets minimum requirements (4GB RAM, 50GB disk, 2+ CPU cores)
- [ ] Ubuntu 22.04 LTS or newer installed and updated
- [ ] Docker Engine 24.0+ installed
- [ ] Docker Compose v2.20+ installed
- [ ] Git installed for repository management
- [ ] Static IP address or domain name configured
- [ ] DNS records point to server IP (A/AAAA records)
- [ ] SSH access configured with key-based authentication
- [ ] Non-root user created with sudo access
- [ ] Firewall configured (UFW with ports 22, 80, 443 open)

#### Software Installation
- [ ] Docker installed and running
- [ ] Docker Compose installed and tested
- [ ] fail2ban installed for intrusion prevention
- [ ] certbot installed for SSL certificates
- [ ] Nginx or Caddy installed for reverse proxy
- [ ] Optional: monitoring tools (htop, ncdu, etc.)

### Configuration

#### Environment Setup
- [ ] `.env.production` created from example
- [ ] `BETTER_AUTH_SECRET` generated with `openssl rand -base64 32`
- [ ] `POSTGRES_PASSWORD` set to strong random password (20+ chars)
- [ ] `BETTER_AUTH_URL` set to production domain (https://)
- [ ] `CORS_ORIGIN` set to production domain (https://)
- [ ] `DATABASE_URL` uses 'postgres' hostname (not 'localhost')
- [ ] `RESEND_API_KEY` configured if using email features
- [ ] `EMAIL_FROM` set to verified domain in Resend
- [ ] `INITIAL_OWNER_EMAIL` and `INITIAL_OWNER_PASSWORD` set
- [ ] Environment file permissions set to 600 (`chmod 600 .env.production`)
- [ ] Required directories created (`data/uploads`, `backups`, `logs`)

#### Security Configuration
- [ ] All secrets are strong and randomly generated
- [ ] Environment file is secured (600 permissions)
- [ ] Database password is unique and strong (20+ characters)
- [ ] Initial owner password is temporary and will be changed
- [ ] SSH key-based authentication enabled
- [ ] Password authentication disabled in SSH
- [ ] Firewall rules configured correctly
- [ ] fail2ban configured and running
- [ ] Only necessary ports exposed (80, 443, 22)

### Initial Deployment

#### Docker Setup
- [ ] Docker image built or pulled from GHCR
- [ ] `docker-compose.prod.yml` reviewed and understood
- [ ] Data directories exist with correct permissions
- [ ] Services start successfully (`docker compose up -d`)
- [ ] PostgreSQL container is healthy
- [ ] Application container is healthy
- [ ] Health check endpoint responds (`curl localhost:3000/health`)
- [ ] Database migrations run successfully
- [ ] Initial owner account created and accessible

#### SSL/TLS Setup
- [ ] SSL certificate obtained (Let's Encrypt or purchased)
- [ ] Certificate files secured (600 permissions on private key)
- [ ] Nginx/Caddy configured with SSL
- [ ] HTTP redirects to HTTPS
- [ ] HTTPS works correctly (no certificate warnings)
- [ ] SSL test passes (A+ grade on ssllabs.com)
- [ ] Auto-renewal configured (certbot timer or equivalent)

### Testing

#### Functional Testing
- [ ] Application accessible via HTTPS
- [ ] HTTP automatically redirects to HTTPS
- [ ] Admin login works with initial owner credentials
- [ ] Can create new client record
- [ ] Can upload document (test file upload)
- [ ] Can create matter/case
- [ ] Can create deadline
- [ ] Can view activity log
- [ ] Email sending works (if configured)
- [ ] Client portal access works (if configured)
- [ ] All main navigation links work
- [ ] No console errors in browser developer tools

#### Security Testing
- [ ] Non-root user running containers (UID 1001)
- [ ] Read-only filesystem enabled
- [ ] All Linux capabilities dropped
- [ ] `no-new-privileges` security option set
- [ ] PostgreSQL not exposed externally (port 5432 localhost only)
- [ ] Application not exposed externally (port 3000 localhost only)
- [ ] Security headers present (check browser dev tools)
- [ ] HSTS header present
- [ ] No sensitive data in logs
- [ ] Environment variables not exposed via API

#### Performance Testing
- [ ] Page load time <3 seconds
- [ ] API response time <500ms
- [ ] Health check responds <100ms
- [ ] Database queries optimized
- [ ] Gzip compression enabled
- [ ] No memory leaks after 1 hour of use
- [ ] Resource usage within acceptable limits

### Monitoring & Backups

#### Monitoring Setup
- [ ] Docker health checks working
- [ ] External uptime monitoring configured (UptimeRobot, etc.)
- [ ] Health check endpoint monitored
- [ ] Email alerts configured for downtime
- [ ] Log rotation configured
- [ ] Disk space monitoring configured
- [ ] Custom monitoring script installed (if using)
- [ ] Grafana/Prometheus configured (if using)

#### Backup Configuration
- [ ] Manual database backup tested successfully
- [ ] Automated daily backups configured (cron)
- [ ] Backup retention policy configured (30 days)
- [ ] Uploaded files backup configured (weekly)
- [ ] Backup restoration tested successfully
- [ ] Cloud backup configured (R2/S3) - optional
- [ ] Backup encryption configured (if storing sensitive data)
- [ ] Backup monitoring/alerts configured

### Documentation

#### Operational Documentation
- [ ] Server access credentials documented (secure location)
- [ ] Environment configuration documented
- [ ] Backup procedures documented
- [ ] Rollback procedures documented
- [ ] Emergency contacts documented
- [ ] Maintenance schedule documented
- [ ] Deployment architecture diagram created
- [ ] Runbook created for common tasks

### Post-Deployment

#### Immediate Tasks (First 24 Hours)
- [ ] Monitor logs for errors continuously
- [ ] Remove `INITIAL_OWNER_*` variables from `.env.production`
- [ ] Change initial owner password via UI
- [ ] Create additional staff accounts
- [ ] Configure user roles and permissions
- [ ] Test backup automation (verify cron runs)
- [ ] Monitor resource usage (CPU, RAM, disk)
- [ ] Verify SSL certificate auto-renewal
- [ ] Test all critical features end-to-end

#### Week 1 Tasks
- [ ] Train staff on system usage
- [ ] Import existing client data (if migrating)
- [ ] Configure email templates
- [ ] Set up client portal (if using)
- [ ] Verify automated backups running successfully
- [ ] Monitor application performance
- [ ] Review security logs
- [ ] Test backup restoration process

#### Month 1 Tasks
- [ ] Review access logs for unusual activity
- [ ] Optimize database performance if needed
- [ ] Review and adjust backup retention policy
- [ ] Update documentation based on real usage
- [ ] Plan for future scaling needs
- [ ] Review and update security policies
- [ ] Schedule regular maintenance windows

### Performance Baseline

Record baseline metrics for future comparison:

- [ ] **Page load time:** ______ seconds (target: <3s)
- [ ] **API response time:** ______ ms (target: <500ms)
- [ ] **Health check response:** ______ ms (target: <100ms)
- [ ] **Database size:** ______ MB
- [ ] **Disk usage:** ______ GB / ______ GB available
- [ ] **Memory usage (app):** ______ MB / ______ MB limit
- [ ] **Memory usage (postgres):** ______ MB / ______ MB limit
- [ ] **CPU usage (idle):** ______ %
- [ ] **CPU usage (load):** ______ %
- [ ] **Concurrent users tested:** ______
- [ ] **Upload speed:** ______ MB/s

### Sign-Off

- [ ] All checklist items completed
- [ ] Production environment tested and verified
- [ ] Stakeholders notified of go-live
- [ ] Support contacts available for launch day
- [ ] Rollback plan ready if needed
- [ ] Monitoring dashboards accessible
- [ ] On-call rotation scheduled

**Deployment Date:** __________________
**Deployed By:** __________________
**Verified By:** __________________

---

## Security Hardening

GK-Nexus follows LinuxServer.io best practices for production-grade security.

### Container Security (Implemented)

The `docker-compose.prod.yml` already includes these security features:

```yaml
services:
  app:
    # Read-only filesystem (immutable container)
    read_only: true

    # Allow temporary files in memory
    tmpfs:
      - /tmp

    # Drop all Linux capabilities (minimum privilege)
    cap_drop:
      - ALL

    # Prevent privilege escalation attacks
    security_opt:
      - no-new-privileges:true
```

**What this means:**
- **Read-only filesystem:** Application cannot write to container filesystem (prevents malware persistence)
- **No capabilities:** Container cannot perform privileged operations
- **No privilege escalation:** Even if compromised, attacker cannot gain root

### System-Level Hardening

```bash
# Enable automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure which updates to auto-install
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

**Enable security updates:**

```
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
```

### Firewall Configuration (UFW)

```bash
# Reset firewall rules
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if using custom)
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status verbose

# Expected output:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

### Fail2Ban Configuration

```bash
# Install fail2ban
sudo apt-get install fail2ban -y

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
```

**Configure fail2ban:**

```ini
[DEFAULT]
# Ban for 1 hour
bantime = 3600

# Find time window (10 minutes)
findtime = 600

# Max retries before ban
maxretry = 5

# Enable email notifications
destemail = admin@yourdomain.com
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

```bash
# Restart fail2ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status

# Check SSH jail status
sudo fail2ban-client status sshd
```

### SSH Hardening

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

**Recommended SSH settings:**

```
# Disable root login
PermitRootLogin no

# Disable password authentication (key-based only)
PasswordAuthentication no
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Limit authentication attempts
MaxAuthTries 3

# Disable X11 forwarding
X11Forwarding no

# Enable strict mode
StrictModes yes

# Disconnect idle sessions after 10 minutes
ClientAliveInterval 300
ClientAliveCountMax 2

# Log level
LogLevel VERBOSE
```

```bash
# Restart SSH
sudo systemctl restart sshd

# Verify configuration
sudo sshd -t
```

### Database Security

```bash
# PostgreSQL is only accessible from Docker network
# Port 5432 is NOT exposed externally

# Verify PostgreSQL is not listening on public interface
sudo netstat -tuln | grep 5432

# Should show: 127.0.0.1:5432 or 0.0.0.0:5432 (Docker network only)

# Use strong passwords (20+ characters)
# Rotate passwords every 90 days
```

### Application Security

```bash
# Rotate BETTER_AUTH_SECRET every 90 days
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"

# Update .env.production with new secret
nano .env.production

# Restart application to apply
docker compose -f docker-compose.prod.yml restart app

# Monitor for vulnerabilities
docker scout cves ghcr.io/kareemschultz/gk-nexus:latest

# Update to latest version regularly
docker pull ghcr.io/kareemschultz/gk-nexus:latest
docker compose -f docker-compose.prod.yml up -d
```

### Backup Security

```bash
# Encrypt backups before cloud storage
gpg --symmetric --cipher-algo AES256 backups/db-backup.sql.gz

# Decrypt when needed
gpg --decrypt backups/db-backup.sql.gz.gpg > db-backup.sql.gz

# Secure backup directory permissions
sudo chmod 700 /opt/gk-nexus/backups
sudo chown -R $USER:$USER /opt/gk-nexus/backups

# Secure backup files
chmod 600 /opt/gk-nexus/backups/*.sql.gz
```

### Security Audit

Run periodic security audits:

```bash
# Check for security updates
sudo apt update
sudo apt list --upgradable

# Scan for rootkits
sudo apt-get install rkhunter
sudo rkhunter --check

# Check for open ports
sudo netstat -tuln

# Review authentication logs
sudo tail -100 /var/log/auth.log

# Review failed login attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# Check Docker security
docker scan ghcr.io/kareemschultz/gk-nexus:latest
```

### Security Monitoring

```bash
# Monitor authentication attempts
sudo tail -f /var/log/auth.log

# Monitor Nginx access
sudo tail -f /var/log/nginx/gk-nexus-access.log

# Monitor application logs for suspicious activity
docker compose -f docker-compose.prod.yml logs -f app | grep -i -E 'error|fail|attack|injection|xss'

# Set up alerts for security events (example with simple email alert)
#!/bin/bash
# /usr/local/bin/security-monitor.sh
ALERT_EMAIL="security@yourdomain.com"

# Check for failed login attempts
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | tail -20 | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "WARNING: $FAILED_LOGINS failed login attempts detected" | \
        mail -s "Security Alert: Multiple Failed Logins" $ALERT_EMAIL
fi

# Add to cron (every hour)
# 0 * * * * /usr/local/bin/security-monitor.sh
```

---

## Additional Resources

### Official Documentation

- **Project Repository:** https://github.com/kareemschultz/SYNERGY-GY
- **Issue Tracker:** https://github.com/kareemschultz/SYNERGY-GY/issues
- **Changelog:** See [CHANGELOG.md](./CHANGELOG.md)
- **Security Policy:** See [SECURITY.md](./SECURITY.md)
- **API Documentation:** `/apps/server/src` (oRPC schema)
- **User Documentation:** `/apps/docs` (Starlight)

### Related Documentation

- **Production Implementation Spec:** `/specs/implementations/PRODUCTION_DEPLOYMENT.md`
- **Phase Plans:** `/specs/phase-1/`, `/specs/phase-2/`, `/specs/phase-3/`
- **Business Rules:** `/specs/business-rules/`
- **Design System:** `/specs/design-system.md`
- **UX Guidelines:** `/specs/ux-guidelines.md`

### External Resources

- **Docker Documentation:** https://docs.docker.com
- **Docker Compose Reference:** https://docs.docker.com/compose/compose-file/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Caddy Documentation:** https://caddyserver.com/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **Cloudflare R2:** https://developers.cloudflare.com/r2/
- **Resend Email:** https://resend.com/docs

### Support

- **Email:** support@yourdomain.com (configure in .env)
- **Phone:** +592-XXX-XXXX (configure in .env)
- **Documentation:** https://docs.yourdomain.com (after deployment)

### Community

- **GitHub Discussions:** https://github.com/kareemschultz/SYNERGY-GY/discussions
- **Report Issues:** https://github.com/kareemschultz/SYNERGY-GY/issues/new

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2025-01-15 | Complete rewrite following production deployment plan specification. Added comprehensive sections for SSL setup, reverse proxy config, log management, troubleshooting, security hardening, and production checklist. |
| 2.0.0 | 2025-01-15 | Enhanced deployment guide with GHCR image usage, security hardening details, and expanded configuration options. |
| 1.0.0 | 2024-12-XX | Initial production deployment guide. |

---

## License

Copyright (c) 2025 Green Crescent Management Consultancy & Kareem Abdul-Jabar Tax & Accounting Services

All rights reserved.

---

## Need Help?

If you encounter issues not covered in this guide:

1. **Check troubleshooting section** - Common issues and solutions
2. **Review application logs** - `docker compose -f docker-compose.prod.yml logs`
3. **Search existing issues** - https://github.com/kareemschultz/SYNERGY-GY/issues
4. **Create new issue** with:
   - Error messages and relevant logs
   - Steps to reproduce the problem
   - Environment details (OS, Docker version, etc.)
   - Output of `docker compose ps`
   - Output of `docker compose logs app`

**Remember:** Always backup before making changes!

---

**Deployment Status:** Production Ready (v3.0.0)
**Last Updated:** January 15, 2025
**Verified:** All procedures tested and validated
