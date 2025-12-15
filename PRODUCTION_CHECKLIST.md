# 📋 GK-Nexus Production Deployment Checklist

Complete this checklist **before** running the production deployment script.

## ✅ Pre-Deployment Checklist

### 1. VPS Server Preparation

- [ ] **VPS is provisioned and accessible**
  - SSH access configured
  - Root or sudo access available
  - Minimum 4GB RAM, 2 CPU cores, 50GB disk space

- [ ] **System is up to date**
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] **Docker is installed and running**
  ```bash
  docker --version
  docker info
  ```

- [ ] **Docker Compose is installed**
  ```bash
  docker compose version
  ```

- [ ] **Bun is installed (for migrations)**
  ```bash
  curl -fsSL https://bun.sh/install | bash
  bun --version
  ```

- [ ] **Git is installed**
  ```bash
  git --version
  ```

### 2. Network & Security

- [ ] **Firewall configured (UFW)**
  ```bash
  sudo ufw allow 22/tcp comment 'SSH'
  sudo ufw allow 80/tcp comment 'HTTP'
  sudo ufw allow 443/tcp comment 'HTTPS'
  sudo ufw enable
  sudo ufw status
  ```

- [ ] **Reverse proxy installed and configured**
  - [ ] Nginx, Caddy, or Pangolin installed
  - [ ] SSL certificates obtained (Let's Encrypt recommended)
  - [ ] SSL certificates auto-renewal configured
  - [ ] Proxy configuration points to `http://localhost:3000` (or custom `APP_PORT`)
  - [ ] Proxy passes `X-Forwarded-Proto`, `X-Real-IP`, `Host` headers
  - [ ] Note: If using Pangolin or custom port, set `APP_PORT=8843` in .env

- [ ] **Domain DNS configured**
  - [ ] A record points to VPS IP address
  - [ ] DNS propagation complete (check with `dig your-domain.com`)

### 3. Environment Configuration

- [ ] **Repository cloned**
  ```bash
  cd /opt
  sudo mkdir gk-nexus
  sudo chown $USER:$USER gk-nexus
  cd gk-nexus
  git clone https://github.com/kareemschultz/SYNERGY-GY.git .
  ```

- [ ] **.env file created and configured**
  ```bash
  cp .env.example .env
  nano .env
  ```

- [ ] **Generate secure secrets** (run these commands and save the output)
  ```bash
  # Generate database password
  openssl rand -base64 32

  # Generate authentication secret
  openssl rand -base64 32

  # Generate admin password (or use password manager)
  openssl rand -base64 24
  ```

- [ ] **Required environment variables set** (paste generated values above)
  - [ ] `POSTGRES_PASSWORD` - Output from first `openssl` command
  - [ ] `BETTER_AUTH_SECRET` - Output from second `openssl` command
  - [ ] `INITIAL_OWNER_PASSWORD` - Output from third `openssl` command
  - [ ] `DATABASE_URL` - Update with your `POSTGRES_PASSWORD`
  - [ ] `BETTER_AUTH_URL` - **Your domain** → `https://gcmc.karetechsolutions.com`
  - [ ] `CORS_ORIGIN` - **Your domain** → `https://gcmc.karetechsolutions.com`
  - [ ] `TRUSTED_ORIGINS` - **All domains** → `https://gcmc.karetechsolutions.com`
  - [ ] `APP_PORT` - **Port for Pangolin** → `8843`
  - [ ] `INITIAL_OWNER_EMAIL` - Your email address
  - [ ] `INITIAL_OWNER_NAME` - Your full name

- [ ] **Optional environment variables configured (if needed)**
  - [ ] `RESEND_API_KEY` - For email notifications
  - [ ] `EMAIL_FROM` - From email address
  - [ ] `BACKUP_S3_ENDPOINT` - For cloud backups (Cloudflare R2, AWS S3)
  - [ ] `BACKUP_S3_ACCESS_KEY_ID` - S3 access key
  - [ ] `BACKUP_S3_SECRET_ACCESS_KEY` - S3 secret key
  - [ ] `BACKUP_S3_BUCKET` - Backup bucket name
  - [ ] `BACKUP_S3_REGION` - Bucket region

### 4. Docker Image Access

- [ ] **GitHub Container Registry authentication**
  ```bash
  # Create Personal Access Token at: https://github.com/settings/tokens
  # Select scopes: read:packages, write:packages

  echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u kareemschultz --password-stdin
  ```

- [ ] **Test image pull**
  ```bash
  docker pull ghcr.io/kareemschultz/gk-nexus:latest
  ```

### 5. Database Safety

- [ ] **Backup directory created**
  ```bash
  mkdir -p /opt/gk-nexus/backups
  ```

- [ ] **Backup retention policy configured**
  - Keep daily backups for 30 days
  - Keep weekly backups for 90 days
  - Keep monthly backups for 1 year

- [ ] **Automated backup schedule configured (optional but recommended)**
  ```bash
  # Add to crontab (crontab -e)
  0 2 * * * cd /opt/gk-nexus && docker compose exec -T postgres pg_dump -U gknexus -d gknexus | gzip > backups/db-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz
  0 3 * * * find /opt/gk-nexus/backups -name "db-*.sql.gz" -mtime +30 -delete
  ```

### 6. Monitoring Setup

- [ ] **Health check monitoring configured**
  - Option 1: UptimeRobot (https://uptimerobot.com) - Free tier available
  - Option 2: Healthchecks.io (https://healthchecks.io) - Open source
  - Option 3: Custom cron job monitoring script

- [ ] **Log monitoring configured**
  ```bash
  # View logs
  docker compose logs -f app
  docker compose logs -f postgres
  ```

- [ ] **Resource monitoring configured**
  ```bash
  # Install htop for resource monitoring
  sudo apt install htop -y

  # Monitor Docker containers
  docker stats
  ```

### 7. Post-Deployment Testing Plan

- [ ] **Test plan prepared**
  - [ ] Test user login
  - [ ] Create test client
  - [ ] Create test matter
  - [ ] Upload test document
  - [ ] Generate test invoice
  - [ ] Test client portal access
  - [ ] Test all main navigation items
  - [ ] Test on mobile device
  - [ ] Test with different user roles

## 🚀 Deployment Commands

Once all checklist items are complete, run the automated deployment script:

```bash
cd /opt/gk-nexus
./deploy-production.sh
```

The script will:
1. ✅ Verify all required environment variables
2. ✅ Create pre-deployment database backup
3. ✅ Pull latest Docker image from GHCR
4. ✅ Run database migrations
5. ✅ Deploy new version with zero-downtime
6. ✅ Perform health checks
7. ✅ Verify deployment success

## 🔍 Post-Deployment Verification

After deployment completes:

### 1. Check Container Status
```bash
docker compose ps
# All containers should show "Up (healthy)"
```

### 2. Test Health Endpoint
```bash
curl http://localhost:3000/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### 3. Test Public Access
```bash
curl https://gcmc.karetechsolutions.com/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### 4. Test Application in Browser
- Open `https://gcmc.karetechsolutions.com` in browser
- Login with admin credentials
- Navigate through main sections
- Create test data
- Verify everything works

### 5. Monitor Logs
```bash
# Watch logs for any errors
docker compose logs -f app

# Check for specific error patterns
docker compose logs app | grep -i "error"
docker compose logs app | grep -i "fail"
```

### 6. Check Resource Usage
```bash
docker stats gk-nexus-server gk-nexus-postgres
# Memory should be < 512MB
# CPU should be < 10% at idle
```

## 🆘 Rollback Procedure (If Needed)

If deployment fails or issues are discovered:

```bash
# 1. Stop current containers
docker compose down

# 2. Restore database backup
BACKUP_FILE=$(ls -t backups/pre-deploy-*.sql.gz | head -1)
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U gknexus -d gknexus

# 3. Pull previous working image
docker pull ghcr.io/kareemschultz/gk-nexus:sha-<previous-commit>
docker tag ghcr.io/kareemschultz/gk-nexus:sha-<previous-commit> ghcr.io/kareemschultz/gk-nexus:latest

# 4. Restart services
docker compose up -d

# 5. Verify rollback
curl http://localhost:3000/health
```

## 📞 Support & Troubleshooting

If you encounter issues:

1. **Check logs**: `docker compose logs app`
2. **Check DEPLOYMENT.md**: Comprehensive troubleshooting guide
3. **Check GitHub Issues**: https://github.com/kareemschultz/SYNERGY-GY/issues
4. **Email support**: support@karetech.solutions

## ✅ Deployment Complete Checklist

After successful deployment:

- [ ] Application accessible via HTTPS
- [ ] All containers healthy
- [ ] No errors in logs
- [ ] Admin login works
- [ ] Test client created successfully
- [ ] Test matter created successfully
- [ ] Document upload works
- [ ] Client portal accessible
- [ ] Mobile view works correctly
- [ ] Monitoring alerts configured
- [ ] Backup schedule running
- [ ] Team notified of deployment
- [ ] Documentation updated with production URLs

---

**🎉 Congratulations! GK-Nexus is now live in production!**
