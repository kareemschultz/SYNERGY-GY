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

---

# Enhancement Issues (December 17, 2024)

> These issues track the SYNERGY-GY enhancement roadmap work.

---

## [ENH-001] UI/UX - Extract Shared Category Constants

**Priority:** HIGH
**Status:** ⏳ PENDING
**Labels:** enhancement, ui/ux, tech-debt, P1-High

### Problem
Document category color definitions are duplicated in multiple files:
- `apps/web/src/routes/app/documents/index.tsx` (lines 57-94)
- `apps/web/src/components/documents/document-quick-view.tsx` (lines 29-66)

### Tasks
- [ ] Create `apps/web/src/lib/constants/document-categories.ts`
- [ ] Export `categoryLabels` and color mappings
- [ ] Update both files to import from shared constant

**Related Plan:** gk-nexus-plans/02-ui-ux-visual-polish.md - Task 2.1

---

## [ENH-002] UI/UX - Replace Inline Error States

**Priority:** HIGH
**Status:** ⏳ PENDING
**Labels:** enhancement, ui/ux, consistency, P1-High

### Problem
Documents page uses inline error/empty state divs instead of shared components:
- Line 623-626 (error state)
- Empty state uses basic div instead of `EmptyState` component

### Tasks
- [ ] Import `ErrorState` from `@/components/shared/error-state`
- [ ] Import `EmptyState` from `@/components/shared/empty-state`
- [ ] Replace inline implementations with shared components

**Related Plan:** gk-nexus-plans/02-ui-ux-visual-polish.md - Task 2.2

---

## [ENH-003] Accessibility - Add ARIA Attributes

**Priority:** HIGH
**Status:** ⏳ PENDING
**Labels:** enhancement, accessibility, a11y, P1-High

### Tasks
- [ ] Add `aria-busy="true"` to containers during loading
- [ ] Add `aria-live="polite"` to dynamic content areas
- [ ] Audit interactive elements for proper labeling

### Pages to Audit
- Documents list page
- Knowledge Base page
- Clients list page
- Document quick view dialog

**Related Plan:** gk-nexus-plans/02-ui-ux-visual-polish.md - Task 2.3

---

## [ENH-004] Templates - GRA Forms (PAYE, VAT)

**Priority:** MEDIUM
**Status:** ⏳ PENDING
**Labels:** feature, templates, gra, guyana, P2-Medium

### Forms to Create
1. **Form 2** - Monthly PAYE Return (due 14th)
2. **Form 5** - Annual PAYE Summary
3. **Form 7B** - Statement of Earnings
4. **VAT Return** - Monthly/Quarterly (due 21st)

### References
- https://www.gra.gov.gy/forms/
- https://www.gra.gov.gy/business/tax-operations-and-services/accounting-for-employees/file-your-paye/

**Related Plan:** gk-nexus-plans/03-templates-forms-system.md - Task 3.1

---

## [ENH-005] Templates - NIS Forms (CS3, R400)

**Priority:** MEDIUM
**Status:** ⏳ PENDING
**Labels:** feature, templates, nis, guyana, P2-Medium

### Forms to Create
1. **CS3** - Contribution Schedule (employers 100+ employees)
2. **R400** - Application for Change of Records

### NIS Rates
- Employee: 5.6%
- Employer: 8.4%
- Total: 14%

### References
- https://www.nis.org.gy/downloads
- https://www.nis.org.gy/information_on_contributions

**Related Plan:** gk-nexus-plans/03-templates-forms-system.md - Task 3.2

---

## [ENH-006] Templates - Legal Documents

**Priority:** MEDIUM
**Status:** ⏳ PENDING
**Labels:** feature, templates, legal, P2-Medium

### Templates to Create
1. **General Affidavit** - Sworn statements for Guyana courts
2. **Power of Attorney** - General and Specific POA
3. **Service Agreement** - GCMC and KAJ variants

**Related Plan:** gk-nexus-plans/03-templates-forms-system.md - Task 3.3

---

## [ENH-007] Verify Category Dropdown

**Priority:** CRITICAL
**Status:** ⏳ PENDING
**Labels:** bug, verification, documents, P0-Critical

### Background
Original audit noted category dropdown doesn't work on document upload page. Code review suggests implementation looks correct but needs manual verification.

### Tasks
- [ ] Navigate to `/app/documents/upload`
- [ ] Test category dropdown selection
- [ ] Upload document with selected category
- [ ] Verify category persists in database
- [ ] Verify category displays in document list

**Related Plan:** gk-nexus-plans/01-document-management-overhaul.md - Task 1

---

## Enhancement Summary

| ID | Title | Priority | Effort |
|----|-------|----------|--------|
| ENH-001 | Extract shared category constants | P1-High | Small |
| ENH-002 | Use shared ErrorState/EmptyState | P1-High | Small |
| ENH-003 | Add aria-busy/aria-live | P1-High | Medium |
| ENH-004 | GRA Form Templates | P2-Medium | Large |
| ENH-005 | NIS Form Templates | P2-Medium | Medium |
| ENH-006 | Legal Document Templates | P2-Medium | Medium |
| ENH-007 | Verify Category Dropdown | P0-Critical | Small |

---

*Enhancement issues added by Claude Code - December 17, 2024*
