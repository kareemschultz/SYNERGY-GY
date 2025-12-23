# Docker Deployment Guide

This guide covers deploying GK-Nexus using Docker in production.

## 🚀 Bundled Deployment (Production-Optimized)

The bundled deployment uses **Bun's bundler** to create a single 2.5MB JavaScript file containing all server code. This results in a **180MB Docker image** with zero node_modules dependencies at runtime.

### Architecture

- **Builder stage**: Installs dependencies, builds web app, bundles server code
- **Runner stage**: Copies only the bundle + web assets, no node_modules
- **Migrations**: Run separately before deployment (industry best practice)

### Image Size

```
gk-nexus-bundled:latest = 180MB
├─ Alpine Linux + Bun: ~104MB
├─ Server bundle: 2.5MB
├─ Web build artifacts: ~5MB
└─ System packages: ~70MB
```

**vs.** unbundled with node_modules: ~550MB

### Quick Start

#### 1. Run Migrations Locally

```bash
# Start PostgreSQL
docker compose -f docker-compose.bundled.yml up -d postgres

# Run migrations
DATABASE_URL="postgresql://gknexus:gknexus_dev_password@localhost:5432/gknexus" bun run db:push
```

#### 2. Build Bundled Image

```bash
docker build -f Dockerfile.bundled -t gk-nexus-bundled:latest .
```

Build time: ~2-4 minutes (with cache)

#### 3. Start Services

```bash
docker compose -f docker-compose.bundled.yml up -d
```

#### 4. Verify Health

```bash
curl http://localhost:3000/health
# {"status":"healthy","timestamp":"2025-12-15T14:00:00.000Z"}
```

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname
BETTER_AUTH_SECRET=min-32-chars-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Optional
CORS_ORIGIN=http://localhost:3001
NODE_ENV=production
RESEND_API_KEY=re_xxx  # For email
```

### Security Hardening

The bundled image includes:

- ✅ Non-root user (gknexus:1001)
- ✅ Read-only root filesystem
- ✅ Dropped capabilities
- ✅ no-new-privileges
- ✅ Health checks
- ✅ Minimal Alpine base

### Frontend Options

The bundled server is **API-only**. For the frontend, choose one:

#### Option A: Serve Separately (Recommended for Production)

```nginx
# nginx.conf
server {
  listen 80;
  root /var/www/gk-nexus;

  location /api {
    proxy_pass http://backend:3000;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

#### Option B: CDN Deployment

Deploy `apps/web/dist` to:
- Vercel/Netlify (automatic)
- Cloudflare Pages
- AWS S3 + CloudFront
- Google Cloud Storage

Update `VITE_SERVER_URL` to your API domain.

#### Option C: Dev Server (Local Testing)

```bash
VITE_SERVER_URL=http://localhost:3000 bun run dev:web
```

### Migrations Strategy

**DO NOT** run migrations inside the runtime container. Use one of these approaches:

#### Local (Development)

```bash
bun run db:push
docker compose up
```

#### CI/CD (Recommended)

```yaml
# .github/workflows/deploy.yml
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run db:push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    steps:
      - name: Deploy bundled image
        run: docker compose up -d
```

#### One-off Container

```bash
# Using builder image with full dependencies
docker run --rm \
  -e DATABASE_URL=$DATABASE_URL \
  gk-nexus-builder:latest \
  bun run db:push
```

### Performance Characteristics

| Metric | Target | Actual |
|--------|--------|--------|
| Image size | < 300MB | **180MB** ✅ |
| Build time | < 5min | ~3min ✅ |
| Startup time | < 60s | ~15s ✅ |
| Health check | < 2s | <1s ✅ |
| Memory usage | < 512MB | ~200MB ✅ |

### Troubleshooting

#### Container Restarts

```bash
# Check logs
docker compose logs server --tail=50

# Common issues:
# - DATABASE_URL incorrect → check connection string
# - Migrations not run → run db:push first
# - Port conflict → check port 3000 availability
```

#### Database Connection

```bash
# Test from container
docker exec gk-nexus-server curl -f http://localhost:3000/health

# Test migrations
docker exec -it gk-nexus-postgres psql -U gknexus -c "\dt"
```

#### Image Size Issues

```bash
# Analyze layers
docker history gk-nexus-bundled:latest

# Check bundle size
docker run --rm gk-nexus-bundled:latest ls -lh /app/server.bundled.js
```

---

## 📦 Full-Stack Deployment (Development/Testing)

For local development or when you need the full stack in Docker:

```bash
docker compose up -d
```

This uses `Dockerfile` (not Dockerfile.bundled) and includes:
- All node_modules (~458MB)
- Source code (unbundled)
- Built-in migrations at startup
- Frontend served by server

**Use this for:**
- Local development
- Testing
- Quick demos

**Use bundled for:**
- Production deployment
- CI/CD pipelines
- Minimal image size
- Faster startup

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build bundled image
        run: docker build -f Dockerfile.bundled -t ghcr.io/${{ github.repository }}:${{ github.sha }} .

      - name: Push to registry
        run: docker push ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Run migrations
        run: |
          bun install
          bun run db:push
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Deploy
        run: |
          docker pull ghcr.io/${{ github.repository }}:${{ github.sha }}
          docker compose up -d
```

---

## Production Checklist

Before deploying to production:

- [ ] Run `npx ultracite fix` (code quality)
- [ ] Test build: `docker build -f Dockerfile.bundled -t test .`
- [ ] Verify image size: `docker images test` (should be ~180MB)
- [ ] Run migrations: `bun run db:push`
- [ ] Test health: `curl http://localhost:3000/health`
- [ ] Set all required env vars
- [ ] Configure SSL/TLS (reverse proxy)
- [ ] Setup monitoring/logging
- [ ] Configure automated backups
- [ ] Test backup restore
- [ ] Setup CI/CD pipeline

---

## Security Best Practices

1. **Never commit secrets** - use .env (gitignored)
2. **Use strong passwords** - min 32 chars for BETTER_AUTH_SECRET
3. **Enable SSL/TLS** - use Let's Encrypt or cloud provider
4. **Regular updates** - keep base images updated
5. **Automated backups** - use built-in backup system
6. **Log monitoring** - integrate with logging service
7. **Network isolation** - use Docker networks
8. **Resource limits** - set memory/CPU limits in compose

---

## Support

For issues or questions:
- Check logs: `docker compose logs`
- Review health: `curl http://localhost:3000/health`
- GitHub Issues: https://github.com/kareemschultz/SYNERGY-GY/issues
