# Update All Documentation to Current State

## Overview

Before running comprehensive E2E testing, we need to update ALL documentation to reflect the current state of the application. This ensures:

1. Accurate baseline documentation
2. E2E tests can be built from accurate docs
3. Any gaps or inconsistencies are identified
4. The README and docs reflect what actually exists

---

## STEP 1: Analyze Current Codebase State

### 1.1 Read and Catalog Everything

```bash
# First, understand what we have

echo "=== 1. PROJECT ROOT FILES ==="
ls -la *.md *.json *.yml *.yaml 2>/dev/null

echo ""
echo "=== 2. DOCUMENTATION FILES ==="
find . -name "*.md" -not -path "./node_modules/*" | sort

echo ""
echo "=== 3. PACKAGES ==="
ls -la packages/

echo ""
echo "=== 4. APPS ==="
ls -la apps/

echo ""
echo "=== 5. SCHEMA FILES ==="
ls -la packages/db/src/schema/

echo ""
echo "=== 6. API ROUTERS ==="
ls -la packages/api/src/routers/

echo ""
echo "=== 7. FRONTEND ROUTES ==="
find apps/web/src/routes -type f -name "*.tsx" | sort

echo ""
echo "=== 8. COMPONENTS ==="
find apps/web/src/components -type f -name "*.tsx" | wc -l
echo "component files"
```

### 1.2 Read Key Configuration Files

```bash
# Read these to understand current setup
cat package.json | head -50
cat docker-compose.yml
cat .env.example
cat turbo.json 2>/dev/null
cat biome.json 2>/dev/null
```

### 1.3 Read Current Documentation

```bash
# Read all existing docs to understand what needs updating
cat README.md
cat .claude/CLAUDE.md 2>/dev/null
cat DEPLOYMENT.md 2>/dev/null
cat DEVELOPMENT_RULES.md 2>/dev/null
cat docs/*.md 2>/dev/null
```

---

## STEP 2: Create/Update Core Documentation

### 2.1 Update .claude/CLAUDE.md

This is the most important file - it tells Claude how to work with this codebase.

```bash
# Read current CLAUDE.md
cat .claude/CLAUDE.md
```

**Update CLAUDE.md to include:**

```markdown
# GK-Nexus - Claude Development Guide

## Project Overview

GK-Nexus (SYNERGY-GY) is a practice management system for two Guyana-based businesses:
- **GCMC** - Green Crescent Management Consultancy (Consulting, Immigration, Training)
- **KAJ** - KAJ Financial Services (Accounting, Tax Preparation)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, TanStack Router, TanStack Query, Tailwind, shadcn/ui |
| Backend | Hono, tRPC, Better Auth |
| Database | PostgreSQL 17, Drizzle ORM |
| Runtime | Bun |
| DevOps | Docker, Turborepo, Biome |

## Project Structure

```
SYNERGY-GY/
├── apps/
│   ├── server/              # Hono API server (entry: src/index.ts)
│   └── web/                 # React frontend (Vite)
│       └── src/
│           ├── components/  # UI components
│           ├── routes/      # File-based routing
│           └── lib/         # Utilities
├── packages/
│   ├── api/                 # tRPC routers
│   ├── auth/                # Better Auth config
│   └── db/                  # Drizzle schema & migrations
├── docker-compose.yml       # Production deployment
├── .env.example             # Environment template
└── .env                     # Local environment (git-ignored)
```

## Key Patterns

### Environment Configuration
- **Single `.env` file** (linuxserver.io style - simple!)
- `DATABASE_URL` password MUST match `POSTGRES_PASSWORD`
- No `.env.production` - just `.env`

### API Pattern (tRPC)
```typescript
// All routers in packages/api/src/routers/
// Procedures: publicProcedure, staffProcedure, adminProcedure, ownerProcedure
export const clientsRouter = {
  list: staffProcedure.input(schema).query(async ({ ctx, input }) => { ... }),
  create: staffProcedure.input(schema).mutation(async ({ ctx, input }) => { ... }),
};
```

### Frontend Pattern
```typescript
// File-based routing in apps/web/src/routes/
// Use TanStack Query for data fetching
const { data, isLoading } = api.clients.list.useQuery({ ... });
```

### Filter Pattern (IMPORTANT!)
When using filter dropdowns, convert "all" to undefined:
```typescript
// ✅ CORRECT
api.clients.list.useQuery({
  business: businessFilter === "all" ? undefined : businessFilter,
  status: statusFilter === "all" ? undefined : statusFilter,
});

// ❌ WRONG - causes validation errors
api.clients.list.useQuery({
  business: businessFilter,  // "all" is invalid!
});
```

## Database Schema

Key tables (all in `packages/db/src/schema/`):
- `user` - Authentication users
- `staff` - Staff members (linked to user)
- `client` - Clients (individuals/companies)
- `matter` - Cases/projects for clients
- `document` - File attachments
- `invoice` / `invoiceLineItem` - Billing
- `appointment` - Calendar events
- `service` - Service catalog
- `knowledgeBaseCategory` / `knowledgeBaseItem` - KB resources
- `backup` / `backupSchedule` - Backup system
- `activityLog` - Audit trail

## Authentication & Authorization

- **Better Auth** for authentication
- Roles: `owner`, `admin`, `staff`
- Business isolation: Users see only their business (GCMC or KAJ)
- Client portal: Separate auth flow for clients

## Common Commands

```bash
# Development
bun install          # Install dependencies
bun run dev          # Start dev servers
bun run check        # Lint with Biome
bun run check-types  # TypeScript check

# Database
bun run db:push      # Push schema changes
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed database

# Production
docker compose up -d              # Start production
docker compose logs -f server     # View logs
docker exec -it gk-nexus-postgres psql -U gknexus  # DB access
```

## Important Files

| File | Purpose |
|------|---------|
| `apps/server/src/index.ts` | Server entry point, middleware |
| `packages/api/src/routers/index.ts` | All API routers combined |
| `packages/db/src/schema/index.ts` | All schema exports |
| `packages/auth/src/index.ts` | Auth configuration |
| `apps/web/src/routes/__root.tsx` | Root layout |
| `docker-compose.yml` | Production deployment |
| `.env` | Environment variables |

## Guyana-Specific Features

- **VAT**: 14% (standard rate)
- **NIS**: Employee 5.6%, Employer 8.4%, ceiling ~$312,000/month
- **PAYE**: Progressive tax brackets
- **Government Forms**: GRA, NIS, DCRA forms in Knowledge Base

## DO NOT

- Don't use `.env.production` - we use single `.env`
- Don't send "all" to API filters - convert to undefined
- Don't disable Biome rules - fix the actual issues
- Don't use `any` type - use proper types
- Don't forget to run `bun run check` before committing
```

### 2.2 Update DEPLOYMENT.md

```bash
cat > DEPLOYMENT.md << 'EOF'
# GK-Nexus Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Domain with SSL (via reverse proxy like Traefik/Nginx)
- At least 2GB RAM, 20GB storage

## Quick Deploy

```bash
# 1. Clone repository
git clone https://github.com/kareemschultz/SYNERGY-GY.git
cd SYNERGY-GY

# 2. Configure environment
cp .env.example .env

# 3. Generate secure passwords
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"

# 4. Edit .env with generated values
nano .env

# 5. Start services
docker compose up -d

# 6. Verify health
curl http://localhost:8843/health
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | Yes | Database user (default: gknexus) |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `POSTGRES_DB` | Yes | Database name (default: gknexus) |
| `DATABASE_URL` | Yes | Full connection string (password must match POSTGRES_PASSWORD!) |
| `BETTER_AUTH_SECRET` | Yes | Auth encryption key |
| `NODE_ENV` | Yes | `production` |
| `APP_URL` | Yes | Public URL (e.g., https://gcmc.karetechsolutions.com) |
| `APP_PORT` | No | Internal port (default: 3000, exposed as 8843) |

## Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| `server` | 8843:3000 | Main application |
| `postgres` | 5432:5432 | PostgreSQL database |

## Health Check

```bash
# Check application health
curl http://localhost:8843/health
# Expected: {"status":"ok"}

# Check container status
docker ps | grep gk-nexus

# View logs
docker logs gk-nexus-server -f
```

## Backup & Restore

### Manual Backup
```bash
# Via UI: Settings > Backup > Create Backup Now

# Via CLI:
docker exec gk-nexus-postgres pg_dump -U gknexus gknexus > backup.sql
```

### Restore
```bash
# Via UI: Settings > Backup > Select backup > Restore

# Via CLI:
cat backup.sql | docker exec -i gk-nexus-postgres psql -U gknexus gknexus
```

## Updating

```bash
# Pull latest changes
git pull origin master

# Rebuild and restart
docker compose pull
docker compose up -d

# Verify
curl http://localhost:8843/health
```

## Troubleshooting

### Container won't start
```bash
docker logs gk-nexus-server
# Check for database connection errors
# Verify DATABASE_URL password matches POSTGRES_PASSWORD
```

### Database connection failed
```bash
# Test database directly
docker exec -it gk-nexus-postgres psql -U gknexus -c "SELECT 1"

# If password mismatch, update .env and restart
docker compose down && docker compose up -d
```

### Sync DATABASE_URL with POSTGRES_PASSWORD
```bash
# Use helper script
./scripts/sync-database-url.sh
docker compose restart server
```

## SSL/HTTPS

The application runs on HTTP internally. Use a reverse proxy (Traefik, Nginx, Caddy) for SSL termination.

Example with Traefik labels in docker-compose.yml:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.gknexus.rule=Host(`gcmc.karetechsolutions.com`)"
  - "traefik.http.routers.gknexus.tls=true"
  - "traefik.http.routers.gknexus.tls.certresolver=letsencrypt"
```
EOF
```

### 2.3 Create/Update IMPLEMENTATION_STATUS.md

```bash
cat > IMPLEMENTATION_STATUS.md << 'EOF'
# GK-Nexus Implementation Status

Last Updated: December 2024

## Module Status

| Module | Status | Notes |
|--------|--------|-------|
| ✅ Authentication | Complete | Login, logout, session management |
| ✅ Dashboard | Complete | Stats, recent activity, quick actions |
| ✅ Clients | Complete | CRUD, filters, portal access |
| ✅ Matters | Complete | CRUD, status workflow, assignments |
| ✅ Documents | Complete | Upload, download, preview |
| ✅ Invoices | Complete | CRUD, VAT calculations, line items |
| ✅ Appointments | Complete | CRUD, calendar integration |
| ✅ Calendar | Complete | Month/week/day views |
| ✅ Services | Complete | Service catalog management |
| ✅ Knowledge Base | Complete | Resources, categories, downloads |
| ✅ Training | Complete | Training management |
| ✅ Calculators | Complete | PAYE, NIS, VAT |
| ✅ Analytics | Complete | Charts, date filters |
| ✅ Reports | Complete | Various report types |
| ✅ Admin Panel | Complete | System settings, staff, backups |
| ✅ Settings | Complete | Profile, appearance, security |
| ✅ Client Portal | Complete | Client self-service |

## Feature Status

### Core Features
- [x] Multi-business support (GCMC/KAJ)
- [x] Role-based access (Owner/Admin/Staff)
- [x] Business isolation
- [x] Dark/Light theme
- [x] Responsive design

### Security
- [x] Authentication (Better Auth)
- [x] Session management
- [x] RBAC middleware
- [x] Security headers (HSTS, X-Frame-Options, etc.)
- [x] Rate limiting
- [x] Input validation (Zod)

### Data Management
- [x] PostgreSQL database
- [x] Drizzle ORM
- [x] Database backups
- [x] Activity logging
- [x] File uploads

### Guyana-Specific
- [x] 14% VAT calculations
- [x] PAYE tax calculator
- [x] NIS contribution calculator
- [x] Government forms (GRA, NIS)
- [x] Local date/currency formatting

## Recent Changes

### December 2024
- ✅ Login page redesign (split-screen with branding)
- ✅ Security headers added
- ✅ Environment configuration simplified to single .env
- ✅ Portal IP tracking implemented
- ✅ Service soft-delete implemented
- ✅ Knowledge Base downloads fixed
- ✅ Auto-fill feature for KB templates

## Known Issues

| Issue | Priority | Status |
|-------|----------|--------|
| None currently | - | - |

## Upcoming Features

| Feature | Priority | ETA |
|---------|----------|-----|
| Email notifications | Medium | TBD |
| Document templates | Medium | TBD |
| Advanced reporting | Low | TBD |
| Mobile app | Low | TBD |
EOF
```

### 2.4 Create docs/ARCHITECTURE.md

```bash
mkdir -p docs

cat > docs/ARCHITECTURE.md << 'EOF'
# GK-Nexus Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │   Staff UI   │  │ Client Portal│  │    Mobile (PWA)        ││
│  │   (React)    │  │   (React)    │  │    (Future)            ││
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘│
└─────────┼─────────────────┼──────────────────────┼─────────────┘
          │                 │                      │
          └─────────────────┼──────────────────────┘
                            │ HTTPS
┌───────────────────────────┼─────────────────────────────────────┐
│                           │                                     │
│  ┌────────────────────────┴──────────────────────────────────┐ │
│  │                     REVERSE PROXY                          │ │
│  │                  (Traefik/Nginx)                           │ │
│  │                    SSL Termination                         │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                           │ HTTP (internal)                    │
│  ┌────────────────────────┴──────────────────────────────────┐ │
│  │                     HONO SERVER                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│ │
│  │  │   tRPC      │  │ Better Auth │  │   Static Files      ││ │
│  │  │   Router    │  │  Sessions   │  │   (Uploads)         ││ │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘│ │
│  └─────────┼────────────────┼────────────────────────────────┘ │
│            │                │                                   │
│  ┌─────────┴────────────────┴────────────────────────────────┐ │
│  │                    DRIZZLE ORM                             │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                           │                                     │
│  ┌────────────────────────┴──────────────────────────────────┐ │
│  │                   POSTGRESQL 17                            │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                         DOCKER                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Package Structure

```
packages/
├── api/           # tRPC API layer
│   └── src/
│       ├── routers/      # Feature routers
│       │   ├── admin.ts
│       │   ├── auth.ts
│       │   ├── backup.ts
│       │   ├── clients.ts
│       │   ├── documents.ts
│       │   ├── invoices.ts
│       │   ├── knowledge-base.ts
│       │   ├── matters.ts
│       │   ├── portal.ts
│       │   ├── reports.ts
│       │   └── ...
│       ├── utils/        # Shared utilities
│       └── index.ts      # Router aggregation
│
├── auth/          # Authentication
│   └── src/
│       └── index.ts      # Better Auth config
│
└── db/            # Database layer
    └── src/
        ├── schema/       # Drizzle schemas
        │   ├── auth.ts   # User, session
        │   ├── client.ts
        │   ├── matter.ts
        │   ├── invoice.ts
        │   └── ...
        ├── migrations/   # SQL migrations
        └── index.ts      # DB client
```

## Data Flow

### API Request Flow
```
Client Request
     │
     ▼
┌─────────────┐
│   Hono      │ ◄─── Middleware (CORS, Auth, Security Headers)
│   Server    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   tRPC      │ ◄─── Procedure (public/staff/admin/owner)
│   Router    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Zod Input  │ ◄─── Validation
│  Validation │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Business   │ ◄─── Authorization checks
│   Logic     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Drizzle    │ ◄─── Database queries
│    ORM      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
│  Database   │
└─────────────┘
```

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│ Better Auth │────▶│  Session    │
│   Form      │     │   Verify    │     │  Created    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    │
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Session    │────▶│   Staff     │────▶│  Business   │
│  Cookie     │     │   Lookup    │     │  Context    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Business Isolation

```
┌───────────────────────────────────────────────────────┐
│                    GK-Nexus                           │
│  ┌─────────────────────┐  ┌─────────────────────────┐│
│  │        GCMC         │  │          KAJ            ││
│  │  ┌───────────────┐  │  │  ┌───────────────────┐  ││
│  │  │    Clients    │  │  │  │     Clients       │  ││
│  │  ├───────────────┤  │  │  ├───────────────────┤  ││
│  │  │    Matters    │  │  │  │     Matters       │  ││
│  │  ├───────────────┤  │  │  ├───────────────────┤  ││
│  │  │   Invoices    │  │  │  │    Invoices       │  ││
│  │  ├───────────────┤  │  │  ├───────────────────┤  ││
│  │  │   Documents   │  │  │  │    Documents      │  ││
│  │  └───────────────┘  │  │  └───────────────────┘  ││
│  └─────────────────────┘  └─────────────────────────┘│
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │              SHARED                              │ │
│  │  Knowledge Base │ Services │ Training │ Users   │ │
│  └─────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

## Security Layers

1. **Transport**: HTTPS via reverse proxy
2. **Authentication**: Better Auth sessions
3. **Authorization**: Role-based procedures (staff/admin/owner)
4. **Validation**: Zod schemas on all inputs
5. **Business Isolation**: Queries filtered by business
6. **Headers**: HSTS, X-Frame-Options, CSP, etc.
7. **Rate Limiting**: Per-endpoint limits
EOF
```

---

## STEP 3: Generate Feature Inventory from Code

### 3.1 Analyze Schema for Data Models

```bash
# List all tables and their fields
echo "=== DATABASE TABLES ===" > docs/DATABASE_TABLES.md

for file in packages/db/src/schema/*.ts; do
  echo "" >> docs/DATABASE_TABLES.md
  echo "### $(basename $file .ts)" >> docs/DATABASE_TABLES.md
  echo '```typescript' >> docs/DATABASE_TABLES.md
  grep -A 50 "export const" "$file" | head -60 >> docs/DATABASE_TABLES.md
  echo '```' >> docs/DATABASE_TABLES.md
done
```

### 3.2 Analyze Routers for API Endpoints

```bash
# List all API endpoints
echo "=== API ENDPOINTS ===" > docs/API_ENDPOINTS.md

for file in packages/api/src/routers/*.ts; do
  routerName=$(basename $file .ts)
  echo "" >> docs/API_ENDPOINTS.md
  echo "## $routerName" >> docs/API_ENDPOINTS.md
  echo "" >> docs/API_ENDPOINTS.md
  
  # Extract procedure names
  grep -E "^\s*(list|get|create|update|delete|[a-zA-Z]+):\s*(public|staff|admin|owner|portal)Procedure" "$file" | while read line; do
    echo "- $line" >> docs/API_ENDPOINTS.md
  done
done
```

### 3.3 Analyze Routes for Pages

```bash
# List all frontend pages
echo "=== FRONTEND PAGES ===" > docs/FRONTEND_PAGES.md

find apps/web/src/routes -name "*.tsx" | sort | while read file; do
  route=$(echo "$file" | sed 's|apps/web/src/routes||' | sed 's|\.tsx||' | sed 's|/index||' | sed 's|_||g')
  echo "- $route - $(basename $file)" >> docs/FRONTEND_PAGES.md
done
```

---

## STEP 4: Update README.md

Create a comprehensive README based on current state:

```bash
# This should be done by Claude after analyzing the codebase
# The README should include:
# - Project overview
# - Features list (from actual code)
# - Screenshots (placeholder for now)
# - Tech stack
# - Quick start
# - Project structure
# - Environment variables
# - Development commands
# - Deployment guide
# - Contributing guidelines
```

See the comprehensive prompt for full README template.

---

## STEP 5: Verify Documentation Accuracy

### 5.1 Cross-Reference Check

```bash
# Verify all documented features actually exist
echo "=== VERIFICATION ==="

# Check if documented routes exist
echo "Checking routes..."
grep -r "createFileRoute" apps/web/src/routes --include="*.tsx" | wc -l
echo "routes found"

# Check if documented API endpoints exist
echo "Checking API endpoints..."
grep -r "Procedure\." packages/api/src/routers --include="*.ts" | wc -l
echo "procedures found"

# Check if documented components exist
echo "Checking components..."
find apps/web/src/components -name "*.tsx" | wc -l
echo "components found"
```

### 5.2 Find Undocumented Features

```bash
# Find features in code that might not be documented
echo "=== POTENTIALLY UNDOCUMENTED ==="

# New routes not in docs
find apps/web/src/routes/app -name "index.tsx" -exec dirname {} \; | sort

# New routers
ls packages/api/src/routers/*.ts | xargs -I {} basename {} .ts
```

---

## Execution Checklist

```
Documentation Update - Execute in order:

[ ] 1. Read current codebase state (Step 1)
    - Run all diagnostic commands
    - Note current structure

[ ] 2. Update CLAUDE.md (Step 2.1)
    - Ensure patterns are current
    - Add any new conventions

[ ] 3. Update DEPLOYMENT.md (Step 2.2)
    - Verify deployment steps work
    - Update environment variables

[ ] 4. Update IMPLEMENTATION_STATUS.md (Step 2.3)
    - Mark completed features
    - Note any known issues

[ ] 5. Create ARCHITECTURE.md (Step 2.4)
    - Diagram current architecture
    - Document data flow

[ ] 6. Generate feature inventory (Step 3)
    - List all database tables
    - List all API endpoints
    - List all frontend pages

[ ] 7. Update README.md (Step 4)
    - Match current features
    - Accurate tech stack
    - Working commands

[ ] 8. Verify accuracy (Step 5)
    - Cross-reference code and docs
    - Fix any discrepancies

[ ] 9. Commit changes
    git add -A
    git commit -m "docs: update all documentation to current state"
    git push origin master
```

---

## Quick Start Command for Claude Code

```
Update all documentation to reflect the current state of the codebase.

FIRST: Read and understand the current code:
1. cat package.json
2. cat docker-compose.yml  
3. cat .env.example
4. ls packages/db/src/schema/
5. ls packages/api/src/routers/
6. find apps/web/src/routes -name "*.tsx" | head -30
7. cat .claude/CLAUDE.md

THEN: Update these documentation files:
1. .claude/CLAUDE.md - Development guide, patterns, conventions
2. DEPLOYMENT.md - Deployment instructions
3. IMPLEMENTATION_STATUS.md - Feature completion status
4. docs/ARCHITECTURE.md - System architecture diagrams
5. README.md - Project overview (brief update, full overhaul later)

Generate these new docs from code analysis:
1. docs/DATABASE_TABLES.md - All schema tables
2. docs/API_ENDPOINTS.md - All tRPC procedures
3. docs/FRONTEND_PAGES.md - All routes/pages

Ensure all documentation accurately reflects:
- Current tech stack
- Current project structure
- Current features
- Current patterns and conventions
- Current deployment process

Commit: "docs: update all documentation to current state"
```
