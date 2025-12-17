# GitHub Issues - Production Deployment

**NOTE:** Create these issues manually at https://github.com/kareemschultz/SYNERGY-GY/issues

---

## [PROD-001] Phase 1: LinuxServer.io-Grade Docker Build

**Priority:** CRITICAL
**Status:** 🚧 IN PROGRESS
**Labels:** production, docker, critical, phase-1

### Tasks
- [ ] Create `.dockerignore`
- [ ] Replace `Dockerfile.prod`
- [ ] Update `docker-compose.prod.yml`
- [ ] Create `scripts/verify-docker-build.sh`
- [ ] Test and verify build

**Files:** `.dockerignore`, `Dockerfile.prod`, `docker-compose.prod.yml`, `scripts/verify-docker-build.sh`

---

## [PROD-002] Phase 2: Professional CI/CD Pipeline

**Priority:** CRITICAL
**Status:** ⏳ PENDING
**Labels:** production, ci-cd, critical, phase-2
**Dependencies:** #PROD-001

### Tasks
- [ ] Create `.github/workflows/docker-publish.yml`
- [ ] Enable SBOM + provenance
- [ ] Add verification tests
- [ ] Test workflow

**Files:** `.github/workflows/docker-publish.yml`

---

## [PROD-003] Phase 3: Routing & UX Fixes

**Priority:** HIGH
**Status:** ⏳ PENDING
**Labels:** ux, routing, high-priority, phase-3

### Tasks
- [ ] Create root route redirect
- [ ] Fix sign-in redirect
- [ ] Add loading states
- [ ] Test auth flow

**Files:** `apps/web/src/routes/index.tsx`, `apps/web/src/components/sign-in-form.tsx`

---

## [PROD-004] Phase 4: Production Documentation

**Priority:** MEDIUM
**Status:** ⏳ PENDING
**Labels:** documentation, medium-priority, phase-4

### Tasks
- [ ] DEPLOYMENT.md
- [ ] SECURITY.md
- [ ] Architecture diagrams
- [ ] Screenshots
- [ ] README updates
- [ ] GitHub templates

**Files:** `DEPLOYMENT.md`, `SECURITY.md`, `docs/**`, `.github/ISSUE_TEMPLATE/**`

---

## [PROD-005] Phase 5: Knowledge Base Content

**Priority:** ONGOING
**Status:** ⏳ PENDING
**Labels:** documentation, knowledge-base, ongoing, phase-5

### Tasks
- [ ] Service guides (GCMC: 5, KAJ: 5)
- [ ] Form templates
- [ ] Onboarding guides
- [ ] Training materials

**Files:** `apps/docs/src/content/docs/**/*.md`

---

## [PROD-006] Phase 6: Backup System Testing

**Priority:** HIGH
**Status:** ⏳ PENDING
**Labels:** testing, backup, high-priority, phase-6

### Tasks
- [ ] Test UI backup
- [ ] Test CLI scripts
- [ ] Test restore
- [ ] Test scheduled backups
- [ ] Test retention

**Files:** Test existing backup system (commit 560f8f1)

---

## [PROD-007] Phase 7: Production Deployment

**Priority:** CRITICAL
**Status:** ⏳ PENDING
**Labels:** production, deployment, critical, phase-7
**Dependencies:** #PROD-001, #PROD-002

### Tasks
- [ ] Configure environment
- [ ] Pull from GHCR
- [ ] Run migrations
- [ ] Setup Nginx + SSL
- [ ] Verify deployment

**Commands:**
```bash
docker login ghcr.io
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
